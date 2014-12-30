var express = require('express')
var config = require('./config.json')
var hogan = require('hogan.js')
var utils = require('./lib/utils')
var async = require('async');
var nedb = require('nedb');
var bodyParser = require('body-parser');

var pageLib = require('./lib/page');
var session = require('./lib/session')
var userLib = require('./lib/user');
var router  = require('./lib/router');
var models  = require('./lib/models')
var backend = require('./backend')

var app = express();

var site;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.use(express.static(__dirname + '/public'));

app.locals.appTitle = config.appTitle;

/* cookie parser middleware */
app.use(function(req, res, next) {
  var cookies = req.headers.cookie.split(/;\W*/);
  req.cookies = {};
  cookies.forEach(function(pairs) {
    var c = pairs.split('=');
    req.cookies[c[0]] = c[1];
  });
  next();
})

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

function addDefaultRoutes(app) {
  app.get(config.backend, function(req, res){
    var context = merge(app.locals, res.locals);
    context.css = [];
    if (req.session && req.session.data && req.session.data.rights.indexOf('*') != -1) {
      renderHtml('dashboard.html', context, function(err, dashboard) {
        context.css.push('/css/dashboard.css');
        context.content = dashboard;
        renderHtml('index.html', context, function(err, html) {
          if (err) {
            return res.send(500, err.message);
          }
          res.send(html);
        });
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

function initialize() {
  site = createDatabase('site');
  subSystems = [];
  subSystems.push(function(cb) { session.initialize(createDatabase('sessions'), 3600000, global); cb(); app.use(session.middleware); });
  subSystems.push(function(cb) { pageLib.initialize(createDatabase('pages')); cb(); });
  subSystems.push(function(cb) { userLib.initialize(createDatabase('users')); cb(); });
  subSystems.push(function(cb) { router.initialize(createDatabase('routes')); cb(); });
  subSystems.push(function(cb) { models.initialize(config.modelsDirectory); cb(); });
  subSystems.push(function(cb) { installDefaultAdmin(cb) });
  subSystems.push(function(cb) { backend.initialize(config.backend, app); cb() });
  subSystems.push(function(cb) { addDefaultRoutes(app); cb() });

  async.series(subSystems, function(err) {
    if (err) {
      return console.error(err);
    }
    return app.listen(config.port);
  })
}


initialize();