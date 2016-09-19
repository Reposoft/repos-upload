const chai = require('chai');
chai.should();

const reposUpload = require('repos-upload');
const uuid = require('uuid');

describe('repos-upload', function () {

  it('should support writing several files to the same (missing) folder', done => {

    const reposHost = new reposUpload.ReposUpload({
      hostname: 'http://rweb',
      dataRepository: '/svn/lean-data'
    });

    const ps = [];
    const path = `/svn/lean-data/${uuid.v4()}/${uuid.v4()}`;
    for (let i = 0; i < 10; i++) {
      ps.push(new Promise((resolve, reject) => {
        const id = uuid.v4();
        reposHost.createFile(`${path}/${id}.txt`, id, err => {
          if (err) reject(err);
          else resolve(id);
        });
      }));
    }

    Promise.all(ps).then(() => done()).catch(done);
  });
});