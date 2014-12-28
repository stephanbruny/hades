var assert = require("assert")
var nedb = require('nedb');
var page = require('../lib/page');

var dataStore = new nedb({filename: './test.db', autoload: true});

var pageObject = {
  created: new Date(),
  active: true,
  template: '<p>{{test}}</p>',
  name: 'Test Page 1'
}

before(function(done) {
  page.initialize(dataStore);
  done();
});

describe('Page', function() {
  
  beforeEach(function(done) {
    dataStore.insert(pageObject, function(err) {
      assert.equal(null, err);
      done();
    });
  });

  afterEach(function(done) {
    dataStore.remove({}, {multi: true}, function(err) {
      assert.equal(null, err);
      done();
    })
  })

  describe('getPage()', function() {
    it('return an array with one page object', function(done){
      page.getPage({name: pageObject.name}, function(err, data) {
        assert.equal(null, err);
        assert.equal(1, data.length);
        assert.equal(pageObject.template, data[0].template);
        assert.equal(pageObject.created, data[0].created);
        done();
      })
    })
  });

  describe('render()', function() {
    it('return an array with one page object', function(done){
      page.getPage({name: pageObject.name}, function(err, data) {
        assert.equal(null, err);
        var p = data[0];
        var testString = 'Foo Bar 42'
        page.render(p, {test: testString}, function(err, html) {
          assert.equal(null, err);
          assert.equal(html, '<p>' + testString + '</p>');
          done();
        });
      })
    })
  });

})