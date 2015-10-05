var hostname = '';
if (typeof location === 'undefined') hostname = 'https://labs01';

module.exports = {
  hostname: hostname,
  dataRepository: '/svn/lean-data'
};