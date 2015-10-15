# repos-upload
Javascript (browser/nodejs) module for uploading (new) (JSON) files to svn through the Repos web API.
## Usage

```js
var reposUpload = require('repos-upload');

var ru = new reposUpload.ReposUpload({
  hostname: 'http://localhost',
  dataRepository: '/svn/lean-data'
});

ru.createFile('/svn/lean-data/path/to/my/directory/file.json', {}, callback);
```
