var assert = require("assert")
var nedb = require('nedb');
var user = require('../lib/user');

var dataStore = new nedb({filename: './test-user.db', autoload: true, inMemoryOnly: true});

describe('User', function() {
  before(function(done) {
    user.initialize(dataStore);
    done();
  });

  after(function(done) {
    dataStore.remove({}, {multi: true}, function(err) {
      assert.equal(null, err);
      done();
    })
  })

  describe('create()', function() {
    
    var testData = {
      username: 'foo',
      password: '42',
      rights: ['test']
    }

    it('creates a new user', function(done){
      user.create(testData.username, testData.password, testData.rights, function(err, usr) {
        assert.equal(null, err);
        assert.equal(usr.username, testData.username);
        assert.deepEqual(usr.rights, testData.rights);
        done();
      })
    });

    it('encrypts password to be not readable', function(done) {
      dataStore.find({username: testData.username}, function(err, data) {
        var usr = data[0];
        assert.equal(null, err);
        assert.notEqual(null, usr);
        assert.notEqual(testData.password, usr.password);
        done();
      })
    })
  });

})