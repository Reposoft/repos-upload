
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
};

reposHost.createRepository(function (err) {
  if (err) {
    log('Failed to create repository');
    return;
  }
  log('Created repository');

  reposHost.info(repo + '/a/b/c/fileFromString.txt', function(err, res) {
    log('Missing file got statusCode: ' + res.statusCode);
  }, function(info) {
    log('Warming. Info returns ok for nonexistent file.');
  });

  reposHost.createFile(repo + '/a/b/c/fileFromString.txt', 'X', err => {
    if (err) {
      log('Failed to create file from string');
      return;
    }
    log('Created sample file from string');

    reposHost.info(repo + '/a/b/c/fileFromString.txt', console.error, function(info) {
      console.log('Sting file info:', info);
    });
  });
});

window.handleFiles = function(fileList) {
  if (fileList.length !== 1) {
    log('Unexpected file selection');
    return;
  }
  var file = fileList[0];

  // TODO title as svn prop
  console.log('File:', file);
  var ext = /\.[a-zA-Z0-9-]{1,8}$/.exec(file.name);
  if (!ext) {
    log('Aborting due to unknown extension for selected file: ' + file.name + ' (mime type: ' + file.type + ')');
    return;
  } else {
    ext = ext[0];
    log('Extension: ' + ext + ', mime-type: ' + file.type);
  }

  reposHost.createFile(repo + '/a/b/c/fileFromBlob' + ext, file, err => {
    if (err) {
      log('Failed to create file from Blob');
      return;
    }
    log('Created sample file from blob: ' + file.name);

    reposHost.info(repo + '/a/b/c/fileFromBlob' + ext, console.error, function(info) {
      log(file.size === info.size ? 'Yes! Size is good.' : 'Failed upload, size is ' + info.size + ' instead of expected ' + file.size);

      console.log('Got info', info);
    });
  });
};
