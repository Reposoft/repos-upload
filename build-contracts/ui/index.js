
var reposUpload = require('repos-upload');

var repo = '/svn/uploadtest' + Date.now();
var reposHost = new reposUpload.ReposUpload({
  hostname: location.protocol + '//' + location.host,
  dataRepository: repo,
  auth: { user: 'browser', password: '' }
});

window.reposHost = reposHost; // for console experiments

var log = function(msg) {
  var li = document.createElement('li');
  li.appendChild(document.createTextNode(msg));
  document.querySelector('#log').appendChild(li);
  return li;
};

var fail = function(msg) {
  var li = log(msg);
  li.setAttribute('class', 'failure');
  li.setAttribute('style', 'color: red');
};

reposHost.createRepository(function (err) {
  if (err) {
    fail('Failed to create repository');
    return;
  }
  log('Created repository');

  reposHost.info(repo + '/a/b/c/fileFromString.txt', function(err, res) {
    log('Got status ' + res.statusCode + ' for missing file (404 is good but rweb tends to return 500)');
  }, function(info) {
    fail('Warning. Info returns ok for nonexistent file.');
  });

  reposHost.createFile(repo + '/a/b/c/fileFromString.txt', 'Xyz', {
    'cms:some-prop': 'value1',
    'cms:other-prop': 'X Y Z' // RWEB-ISSUE no newline support? 'X\nY\nZ'
  }, err => {
    if (err) {
      return fail('Failed to create file from string');
    }
    log('Created sample file from string');

    reposHost.info(repo + '/a/b/c/fileFromString.txt', console.error, function(info) {
      if (3 !== info.size) {
        return fail('Not the given string data? Size is ' + info.size);
      }
      log('String upload size is good');

      reposHost.details(repo + '/a/b/c/fileFromString.txt', function(err, json) {
        if (err) return fail('Failed to fetch details');
        if (json.proplist.cms['cms:some-prop'][0] === 'value1') {
          log('The new file was committed with the given properties');
        } else {
          console.log('details', json);
        }
      });
    });

  });
});

window.handleFiles = function(fileList) {
  if (fileList.length !== 1) {
    return fail('Unexpected file selection');
  }
  var file = fileList[0];

  // TODO title as svn prop
  var ext = /\.[a-zA-Z0-9-]{1,8}$/.exec(file.name);
  if (!ext) {
    return fail('Aborting due to unknown extension for selected file: ' + file.name + ' (mime type: ' + file.type + ')');
  } else {
    ext = ext[0];
    log('Extension: ' + ext + ', mime-type: ' + file.type + ', original name: ' + file.name);
  }

  // RWEB-ISSUE files larger than PHP upload file limit result in pretty useless error messages
  reposHost.createFile(repo + '/a/b/c/fileFromBlob' + ext, file, err => {
    if (err) {
      return fail('Failed to create file from Blob');
    }
    log('Created sample file from blob: ' + file.name);

    reposHost.info(repo + '/a/b/c/fileFromBlob' + ext, console.error, function(info) {
      if (file.size !== info.size) {
        return fail('Failed upload, size is ' + info.size + ' instead of expected ' + file.size);
      }
      log('Yes! Size of committed file is ' + info.size);
      log('Commit is rev ' + info.commit.revision + ' date ' + info.commit.date + ' by ' + info.commit.author);
    });
  });
};
