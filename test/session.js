var assert = require("assert")
var nedb = require('nedb');
var session = require('../lib/session');

var dataStore = new nedb({filename: './test-session.db', autoload: true});

var timeout = 60000;



describe('Session', function() {
  before(function(done) {
    session.initialize(dataStore, timeout, {
      guid: function() {
        return Math.random(0, 255) + '-' + Math.random(0, 255) + '-' + Math.random(0, 255);
      }
    });
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
      name: 'foo',
      bar: '42'
    }

    it('creates a new session', function(done){
      session.create(testData, function(err, sess) {
        assert.equal(null, err);
        assert.equal(sess.data.name, testData.name);
        assert.equal(sess.data.bar, testData.bar);
        done();
      })
    })
  });

  describe('touch()', function() {
    it ('sets timout to a value in the future', function(done) {
      session.create({foo: 'bar'}, function(err, sess) {
        assert.equal(null, err);
        var oldTime = sess.timeout;
        setTimeout(function() {
          session.touch(sess._id, function(err, result) {
            assert.equal(1, result);
            assert.equal(null, err);
            session.get(sess._id, function(err, data) {
              console.log("OLD: " + oldTime);
              console.log("NEW: " + data.timeout)
              assert.equal(null, err);
              assert.equal(true, new Date() < sess.timeout);
              done();
            })
          })
        }, 1000);
      })
    })
  });

})