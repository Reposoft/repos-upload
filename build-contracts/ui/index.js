
var reposUpload = require('repos-upload');

var RU = new reposUpload.ReposUpload({
  hostname: 'http://localhost',
  dataRepository: '/svn/lean-data',
  auth: { user: 'browser', password: '' }
});

window.handleFiles = function(fileList) {
  document.title = 'Got ' + fileList.length + ' files';
};
