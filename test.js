var Rowdata = require('./');

Rowdata.prepare({
  boardsUrl: '/svn/lean-data/admin/yolean-boards.json',
  templatesUrl: '/svn/lean/Templates/VP/'
}).then(function(result) { console.log(result); });

// Rowdata.addFile('https://labs01/svn/lean-data/squad5/tech12/a/b/c/d/e/f/rows1.json', JSON.stringify([
//   {
//     "timeline": true,
//     "id": "gate_a",
//     "name": "Gate A"
//   },
//   {
//     "timeline": true,
//     "id": "gate_b",
//     "name": "Gate B"
//   },
//   {
//     "id": "alindgren",
//     "name": "Anton Lindgren",
//     "sortable": true
//   },
//   {
//     "id": "{{uuid}}",
//     "name": "PTL",
//     "sortable": true
//   },
//   {
//     "id": "{{uuid}}",
//     "name": "PEL",
//     "sortable": true
//   }
// ]))
  // .then(console.log.bind(console, 'Success: '))
  // .catch(console.warn.bind(console, 'Failure: '));

// Rowdata.addFolder('/', 'd')
//   .then(console.log.bind(console, 'Success: '))
//   .catch(console.warn.bind(console, 'Failure: '));

// Rowdata.createFoldersForFile('/svn/lean-data/a/b/c/d/e.json')
//   .then(console.log.bind(console, 'Success: '))
//   .catch(console.warn.bind(console, 'Failure: '));

// Rowdata.createFoldersForFile('/svn/lean-data/xa/xb/xc/xd/xe.json')
//   .then(console.log.bind(console, 'Success: '))
//   .catch(console.warn.bind(console, 'Failure: '));

// Rowdata.fileExists('/svn/lean-data/a')
//   .then(console.log.bind(console, 'Success: '))
//   .catch(console.warn.bind(console, 'Failure: '));
//