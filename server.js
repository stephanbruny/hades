var express = require('express')
var config = require('./config.json')
var hogan = require('hogan.js')
var utils = require('./lib/utils')
var async = require('async');
var nedb = require('nedb');

var pageLib = require('./lib/page');
var session = require('./lib/session')
var userLib = require('./lib/user');

var app = express();

var site;

app.use(express.static(__dirname + '/public'));

app.locals.appTitle = config.appTitle;

function createDatabase(name) {
  return new nedb({filename: './db/' + name + '.db', autoload: true});
}

function installDefaultAdmin(callback) {
  userLib.count(function(err, cnt) {
    if (cnt > 0) {
      return callback();
    }
    var password = guid();
    var username = "admin";
    console.log("Default administrator created. Use " + username + " with password: " + password + ' to login.');
    console.log("Security information: Change default password after first login.");
    userLib.create(username, password, ['*'], callback);
  });
}

function initialize() {
  site = createDatabase('site');
  subSystems = [];
  subSystems.push(function(cb) { pageLib.initialize(createDatabase('pages')); cb(); });
  subSystems.push(function(cb) { session.initialize(createDatabase('sessions')); cb(); });
  subSystems.push(function(cb) { userLib.initialize(createDatabase('users')); cb(); });
  subSystems.push(function(cb) { installDefaultAdmin(cb) });
  async.series(subSystems, function(err) {
    if (err) {
      return console.error(err);
    }
    return app.listen(config.port);
  })
}

function renderHtml(view, context, callback) {
  require('fs').readFile('./views/' + view, 'utf8', function(err, data) {
    if (err) {
      return callback(err);
    }
    try {
      var template = hogan.compile(data);
      return callback(null, template.render(context));
    } catch (ex) {
      return callback(ex);
    }
  });
}

app.get(config.backend, function(req, res){
  var context = merge(app.locals, res.locals);
  if (req.session && req.session.admin) {
    context.content = "<h2>Hello Admin!</h2>";
    renderHtml('index.html', context, function(err, html) {
      if (err) {
        return res.send(500, err.message);
      }
      res.send(html);
    });
  } else {
    renderHtml('login.html', context, function(err, loginHtml) {
      if (err) {
        return res.send(500, err.message);
      }
      context.content = loginHtml;
      renderHtml('index.html', context, function(err, html) {
        if (err) {
          return res.send(500, err.message);
        }
        return res.send(html);
      })
    });
  }
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