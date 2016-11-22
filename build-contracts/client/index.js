const chai = require('chai');
chai.should();

const reposUpload = require('repos-upload');
const uuid = require('uuid');

describe('repos-upload', function () {

  it('should support writing several files to the same (missing) folder', done => {

    const reposHost = new reposUpload.ReposUpload({
      hostname: 'http://svn',
      dataRepository: '/svn/lean-data',
      auth: { user: 'test', password: '' }
    });

    reposHost.createRepository(function (err) {
      if (err) return done(err);

      const ps = [];
      const path = `/svn/lean-data/${uuid.v4()}`;
      for (let i = 0; i < 10; i++) {
        const id = i;
        ps.push(new Promise((resolve, reject) => { //jshint ignore:line
          reposHost.createFile(`${path}/${id}.txt`, id, err => {
            if (err) reject({ id: id, error: err });
            else resolve(id);
          });
        }));
      }

      Promise.all(ps).then(() => done()).catch(err => {
        console.error(err);
        done(err);
      });
    });
  });

  describe('.createFile()', function () {

    it('should never try to overwrite existing files', function (done) {

      const reposHost = new reposUpload.ReposUpload({
        hostname: 'http://svn',
        dataRepository: '/svn/write-file-test',
        auth: { user: 'test', password: '' }
      });

      reposHost.createRepository(function (err) {
        if (err) return done(err);

        const fileName = '/svn/write-file-test/' + uuid.v4() + '.txt';
        reposHost.createFile(fileName, 'A', err => {
          if (err) return done(err);

          console.log('Created file. We should be done quickly now ...');
          reposHost.createFile(fileName, 'A', err => {
            if (err) return done(err);

            done();
          });
        });
      });
    });
  });
});