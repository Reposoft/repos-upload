var chai = require('chai');
chai.should();

var Rowdata = require('../');

var UUID_LENGTH = 36;

describe('yolean-rowdata', function () {

  describe('compileData', function () {

    var result;
    beforeEach(function () {
      result = Rowdata.compileData([
        {
          "id": "gate_a",
          "name": "Gate A"
        },
        {
          "id": "gate_b",
          "name": "Gate B"
        },
        {
          "id": "alindgren",
          "name": "Anton Lindgren"
        },
        {
          "id": "{{uuid}}",
          "name": "PTL"
        },
        {
          "id": "{{uuid}}",
          "name": "PEL"
        },
        {
          "name": "Unknown"
        }
      ]);
    });

    it('should replace missing ids', function () {
      var json = JSON.parse(result);
      json[5].id.length.should.equal(UUID_LENGTH);
    });

    it('should replace moustache syntax uuids ({{uuid}})', function () {
      var json = JSON.parse(result);
      json[3].id.should.not.equal('{{uuid}}');
      json[3].id.length.should.equal(UUID_LENGTH);
      json[4].id.should.not.equal('{{uuid}}');
      json[4].id.length.should.equal(UUID_LENGTH);
    });

    it('should ignore already set ids', function () {
      var json = JSON.parse(result);
      json[0].id.should.equal('gate_a');
      json[1].id.should.equal('gate_b');
    });
  });
});