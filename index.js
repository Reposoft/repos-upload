var Promise = this.Promise || require('promise');
var request = require('superagent');
var async = require('async');

var DEFAULT_RETRIES = 3;

function ReposUpload(config) {
  if (!(this instanceof ReposUpload)) {
    return new ReposUpload(config);
  }

  if (!config.hostname) throw new Error('Missing option "hostname" [http://localhost]');
  if (!config.dataRepository) throw new Error('Missing option "dataRepository" [/svn/lean-data]');

  var leadingRe = /^\//;
  var trailingRe = /\/$/;

  if (trailingRe.test(config.hostname)) throw new Error('Invalid "hostname" option provided. Remove trailing slash!');
  if (trailingRe.test(config.dataRepository)) throw new Error('Invalid "dataRepository" option provided. Remove trailing slash!');
  if (!leadingRe.test(config.dataRepository)) throw new Error('Invalid "dataRepository" option provided. Include leading slash!');

  var auth = config.auth || { user: '', password: '' };
  // We check against undefined and not just falsy values as 0 should be valid here
  var nRetries = DEFAULT_RETRIES;
  if (config.nRetries !== undefined) nRetries = config.nRetries;

  function createRepository(callback) {
    var repoName = config.dataRepository.split('/').pop();

    fileExists('/' + repoName).then(function (status) {
      if (status === 200) return callback(null, status);
      if (status !== 404) return callback(new Error('Unknown error, status: ' + status));

      // Repository missing. Create it
      request
        .post(config.hostname + '/admin/repocreate')
        .auth(auth.user, auth.password)
        .type('form')
        .accept('json')
        .send({ reponame: repoName })
        .end(function (err, result) {
          if (err) return callback(err);
          callback(null);
        });
    }, callback);
  }

  function createFile(fileUrl, data, callback) {
    var createMissing = fileExists(fileUrl)
      .then(function(status) {
        if (status === 200) return Promise.resolve();
        if (status === 404) {
          var dataString = compileData(data);
          return addFile(fileUrl, dataString);
        }

        // Some other error, how do we handle this?
        return Promise.reject(new Error('Unknown error, status: ' + status));
    });

    createMissing.then(function (result) {
      callback(null, result);
    }, callback);
  }

  // Like createFile but assumes an existing file
  function writeFile(fileUrl, data, callback) {
    var createMissing = fileExists(fileUrl)
      .then(function(status) {
        var dataString = compileData(data);
        if (status === 200) return updateFile(fileUrl, dataString);
        if (status === 404) return addFile(fileUrl, dataString);

        // Some other error, how do we handle this?
        return Promise.reject('Unknown error, status: ' + status);
    });

    createMissing.then(function (result) {
      callback(null, result);
    }, callback);
  }

  function addFile(fileUrl, fileData) {
    return createFoldersForFile(fileUrl).then(function () {

      var filename = fileUrl.split('/').pop();
      var path = fileUrl
        .replace(config.hostname, '')
        .replace(config.dataRepository, '')
        .replace(filename, '');

      var base = config.dataRepository.split('/').pop();

      var data = {
        base: base,
        target: path,
        name: filename,
        usertext: fileData,
        fromrev: 'HEAD',
        message: 'repos-upload add file',
        type: 'upload',
        create: 'yes'
      };

      var url = config.hostname + config.dataRepository + '/?rweb=e.upload';

      return postFile(url, data);
    });
  }

  function updateFile(fileUrl, fileData) {
    return createFoldersForFile(fileUrl).then(function () {

      var data = {
        usertext: fileData,
        fromrev: 'HEAD',
        message: 'repos-upload update file',
        type: 'upload'
      };

      var filePath = fileUrl
        .replace(config.hostname, '')
        .replace(config.dataRepository, '');

      var url = config.hostname + config.dataRepository + filePath + '/?rweb=e.upload';

      return postFile(url, data);
    });
  }

  function postFile(url, data) {
    return new Promise(function(fulfill, reject) {
      request
        .post(url)
        .auth(auth.user, auth.password)
        .type('form')
        .accept('json')
        .send(data)
        .end(function(err, res) {
          if (err) {
            var msg = parseErrorMsg(err);
            return reject(msg);
          }
          else if (res.ok) return fulfill(true);
          else reject('Unknown error');
        });
    });
  }

  // info isn't a promise because you use it to see current status, not to fetch data
  function info(path, errCallback, jsonCallback) {
    request
      .get(config.hostname + path)
      .query({ rweb: 'json', serv: 'json' })
      .set('Accept', 'application/json') // RWEB-ISSUE: understands only serv=json atm
      .auth(auth.user, auth.password)
      .end(function(err, res) {
        // RWEB-ISSUE returns status 500 if the file does not exist
        if (res.statusCode === 500 && /Could not read entry for URL/.test(res.text)) {
          res.statusCode = 404; // TBD set .status too?
          return errCallback(err, res);
        }

        if (err) return errCallback(err, res);

        var svnlist = res.body;
        // RWEB-ISSUE doesn't set Content-Type application/json on json resources
        if (svnlist === null && res.type === 'text/plain') {
          svnlist = JSON.parse(res.text);
        }

        var keys = Object.keys(svnlist.list);
        if (keys.length !== 1) throw new Error('Unexpected info, multiple entries. Is it a folder? Use .details() instead, as info is based on ls.');
        return jsonCallback(svnlist.list[keys[0]]);
      });
  }

  // details is an expensive call that returns entry stats, recent history etc
  function details(path) {
    return new Promise(function(fulfill, reject) {
      request
        .get(config.hostname + path)
        .query({ rweb: 'details', serv: 'json' })
        .set('Accept', 'application/json') // but rweb understands only serv=json atm
        .auth(auth.user, auth.password)
        .end(function(err, res) {
          if (!res && !(err || {}).statusCode) {
            return reject(new Error('Missing status code for: ' + path));
          }

          fulfill(res.body || JSON.parse(res.text)); // rweb up to 1.6 does not set Content-Type properly
        });
    });
  }

  function fileExists(path) {
    return new Promise(function(fulfill, reject) {
      request
        // It seems that head requests do not follow redirects
        // https://github.com/visionmedia/superagent/issues/669
        .get(config.hostname + path)
        .auth(auth.user, auth.password)
        .end(function(err, res) {
          if (!res && !(err || {}).statusCode) {
            return reject(new Error('Missing status code for: ' + path));
          }

          fulfill((res || {}).statusCode);
        });
    });
  }

  function fetchFile(path) {
    var url = config.hostname + path;

    return new Promise(function(fulfill, reject) {
      request
        .get(url)
        .auth(auth.user, auth.password)
        .end(function(err, res) {
          if (err) {
            return reject('Unable to get file with url: "' + url + '", status: ' + err);
          }

          return fulfill(res.body);
        });
    });
  }

  function createFoldersForFile(fileUrl) {
    var dataRepository = config.dataRepository;
    var fileName = fileUrl.split('/').pop();
    var folders = fileUrl
      .replace(config.hostname, '')
      .replace(dataRepository, '')
      .replace(fileName, '')
      .replace(/(^\/)|(\/$)/g, '') // Remove leading and trailing slashes
      .split('/');

    return fillFolders(dataRepository, folders);
  }

  function fillFolders(parentFolder, folders) {
    if (folders.length === 0) return Promise.resolve();

    var path = [parentFolder, folders[0]].join('/');
    return fileExists(path + '/')
      .then(function (status) {
        if (status === 200) return fillFolders(path, folders.slice(1));
        if (status === 404) {
          var target = parentFolder.replace(config.dataRepository, '') + '/';
          return addFolder(target, folders[0]).then(function () {
            return fillFolders(path, folders.slice(1));
          });
        }
        else return Promise.reject('Unkown folder  status ' + status + ' for ' + path);
      });
  }

  function addFolder(parentFolder, folderName) {
    return new Promise(function (resolve, reject) {

      var hostname = config.hostname;
      var dataRepository = config.dataRepository;
      var base = dataRepository.split('/').pop();

      var data = {
        base: base,
        target: parentFolder,
        name: folderName,
        message: 'repos-upload add folder',
        submit: 'Create'
      };

      var url = hostname + dataRepository + '/?rweb=e.mkdir';

      request
        .post(url)
        .auth(auth.user, auth.password)
        .type('form')
        .accept('json')
        .send(data)
        .end(function (err, res) {
          if (err) {
            var msg = parseErrorMsg(err);

            return reject(msg);
          }

          var body = JSON.parse(res.text);
          if (body && body.successful) resolve(body.result);
          else (reject(body));
        });
    });
  }

  this.createRepository = createRepository;
  this.createFile = async.retryable(nRetries, createFile);
  this.writeFile = async.retryable(nRetries, writeFile);
  this.info = info;
  this.details = async.retryable(nRetries, details);

  return this;
}

function parseErrorMsg(err) {
  var error;
  try {
    error = JSON.parse(err.response.text).error;
  } catch (e) {
    console.error(e);
  }
  var msg = error ? error.split('<br />')[0] :
            'Unknown error';

  return msg;
}

function compileData(data) {
  if (typeof data === 'string') return data;
  else return JSON.stringify(data, null, 2);
}

exports.ReposUpload = ReposUpload;
