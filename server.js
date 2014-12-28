var express = require('express')
var config = require('./config.json')
var hogan = require('hogan.js')
var utils = require('./lib/utils')
var async = require('async');
var nedb = require('nedb');

var pageLib = require('./lib/page');

var app = express();

var site;

app.use(express.static(__dirname + '/public'));

app.locals.appTitle = config.appTitle;

function createDatabase(name) {
  return new nedb({filename: './db/' + name + '.db', autoload: true});
}

function initialize() {
  site = createDatabase('site');
  subSystems = [];
  subSystems.push(function(cb) { pageLib.initialize(createDatabase('pages')); cb(); });
  async.series(subSystems, function(err) {
    if (err) {
      return console.error(err);
    }
    return app.listen(config.port);
  })
}

app.get(config.backend, function(req, res){
  require('fs').readFile('./views/index.html', 'utf8', function(err, data) {
    if (err) {
      return res.send(500);
    }
    var template = hogan.compile(data);
    return res.send(template.render(merge(app.locals, res.locals)))
  });
});

app.get('/:page', function(req, res) {
  pageLib.getPage({id: req.params.page, limit: 1}, function(err, pages) {
    if (err) {
      return res.send(500, 'Internal Server Error');
    }
    if (!pages[0]) {
      return res.send(404, 'Page not found.');
    }
    pageLib.render(pages[0], res.locals, function(err, html) {
      if (err) {
        return res.send(500, 'Internal Server Error');
      }
      site.findOne({}, function(err, data) {
        var siteFolder = data.folder || 'default';
        require('fs').readFile('./site/'+siteFolder+'/index.html', 'utf8', function(err, templateFile) {
          var template = hogan.compile(templateFile);
          res.locals.content = html;
          return res.send(template.render(merge(app.locals, res.locals)))
        });
      });
    });
  })
})

initialize();