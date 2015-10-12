var chai = require('chai');
var expect = chai.expect;
chai.should();

var reposUpload = require('../');

describe('repos-upload', function () {

  describe('host initialization', function () {

    it('should validate the provided hostname and data repository options', function () {
      expect(reposUpload.ReposUpload).to.throw();

      expect(reposUpload.ReposUpload.bind(null, {
        hostname: 'http://localhost',
        dataRepository: '/svn/lean-data/'
      })).to.throw();

      expect(reposUpload.ReposUpload.bind(null, {
        hostname: 'http://localhost',
        dataRepository: 'svn/lean-data'
      })).to.throw();

      expect(reposUpload.ReposUpload.bind(null, {
        hostname: 'http://localhost/',
        dataRepository: '/svn/lean-data'
      })).to.throw();

      expect(reposUpload.ReposUpload.bind(null, {
        hostname: 'http://localhost',
        dataRepository: '/svn/lean-data'
      })).not.to.throw();
    });
  });
});