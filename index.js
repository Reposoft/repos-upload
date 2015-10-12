var Promise = this.Promise || require('promise');
var request = require('superagent');

function Rowdata(config) {
  if (!this instanceof Rowdata) {
    return new Rowdata(config);
  }

  if (!config.hostname) throw new Error('Missing option "hostname" [http://localhost]');
  if (!config.dataRepository) throw new Error('Missing option "dataRepository" [/svn/lean-data]');

  function createFile(fileUrl, data, callback) {
    var createMissing = fileExists(fileUrl)
      .then(function(status) {
        if (status === 200) return Promise.resolve();
        if (status === 404) {
          var dataString = compileData(data);
          return addFile(fileUrl, dataString);
        }

        // Some other error, how do we handle this?
        return Promise.reject('Unknown error, status: ' + status);
    });

    createMissing.then(function (result) {
      callback(null, result);
    }, callback);
  }

  function addFile(fileUrl, fileData) {
    return createFoldersForFile(fileUrl).then(function () {
      return new Promise(function(fulfill, reject) {

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
          message: 'Yolean Rowdata add file',
          type: 'upload',
          create: 'yes'
        };

        var url = config.hostname + config.dataRepository + '/?rweb=e.upload';

        request
          .post(url)
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
    });
  }

  function fileExists(path) {
    return new Promise(function(fulfill, reject) {
      request
        // It seems that head requests do not follow redirects
        // https://github.com/visionmedia/superagent/issues/669
        .get(config.hostname + path)
        .end(function(err, res) {
          if (!res && !(err || {}).status) {
            return reject('Missing status code for: ' + path);
          }

          fulfill((res || err).status);
        });
    });
  }

  function fetchFile(path) {
    var url = config.hostname + path;

    return new Promise(function(fulfill, reject) {
      request
        .get(url)
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
        message: 'Yolean Rowdata add folder',
        submit: 'Create'
      };

      var url = hostname + dataRepository + '/?rweb=e.mkdir';

      request
        .post(url)
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

  this.createFile = createFile;

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

function compileData(rowData) {
  return JSON.stringify(rowData);
}

module.exports = Rowdata;
