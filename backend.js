exports.initialize = function(backendRootUrl, app) {
  
  var user = require('./lib/user');
  var session = require('./lib/session');
  var async = require('async');
  var hogan = require('hogan.js');

  app.locals.backendRootUrl = backendRootUrl;
  app.locals.backendLoginUrl = backendRootUrl + '/login';
  app.locals.backendLogoutUrl = backendRootUrl + '/logout';
  app.locals.backendPagesUrl = backendRootUrl + '/pages';
  app.locals.backendUsersUrl = backendRootUrl + '/users';
  app.locals.backendModelsUrl = backendRootUrl + '/models/:action?';

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

  function getBackendView(view, req, res, css, scripts, callback) {
    var context = merge(res.locals, app.locals);
    context.models = require('./lib/models').getModels();
    context.css = ['/css/dashboard.css'];
    if (req.session && req.session.data && req.session.data.rights.indexOf('*') != -1) {
      renderHtml(view, context, function(err, viewHtml) {
        if (css) {
          context.css = context.css.concat(css);
        }
        context.scripts = scripts;
        context.backendContent = viewHtml;
        renderHtml('dashboard.html', context, function(err, dashboardHtml) {
          context.content = dashboardHtml;
          renderHtml('index.html', context, function(err, html) {
            if (err) {
              return callback(err);
            }
            callback(null, html);
          });
        })
      });
    }
  }

  function showView(res) {
    return function(err, html) {
      if (err) {
        return res.send(500, "Internal Server Error: " + err.message)
      }
      res.send(html);
    }
  }

  app.post(app.locals.backendLoginUrl, function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    session.clear();
    user.get(username, password, function(err, data) {
      if (err) {
        return res.send(500, 'Internal Server Error');
      }
      if (!data) {
        return res.redirect(backendRootUrl);
      }
      // TODO: Create cookie and session
      session.create(data, function(err, sess) {
        if (err) {
          return res.send(500, 'Internal Error');
        }
        req.session = sess;
        res.cookie('session', sess._id);
        res.redirect(backendRootUrl);
      })
    })
  });

  app.get(app.locals.backendLogoutUrl, function(req, res) {
    session.remove(req.session._id, function(err) {
      res.redirect(backendRootUrl);
    })
  });

  app.get(app.locals.backendPagesUrl, function(req, res) {
    require('./lib/page').getPage({}, function(err, pages) {
      getBackendView('pages.html', req, res, null, null, function(err, html) {
        if (err) {
          return res.send(500, "Internal Server Error: " + err.message)
        }
        res.send(html);
      })
    })
  });

  app.get(app.locals.backendUsersUrl, function(req, res) {
    require('./lib/user').all(function(err, data) {
      res.locals.users = data;
      getBackendView('users.html', req, res, null, null, showView(res))
    });
  });

  app.get(app.locals.backendModelsUrl, function(req, res) {
    getBackendView('new-model.html', req, res, null, null, showView(res));
  })

}