exports.initialize = function(backendRootUrl, app) {
  
  var user = require('./lib/user');
  var session = require('./lib/session');

  app.locals.backendLoginUrl = backendRootUrl + '/login';
  app.locals.backendLogoutUrl = backendRootUrl + '/logout';

  app.post(app.locals.backendLoginUrl, function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
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
  })
}