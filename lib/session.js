exports.initialize = function(dataStore, timeout, api) {
  exports.create = function(data, callback) {
    var session = {
      data: data,
      timeout: new Date(new Date().getTime() + timeout),
      id: api.guid(),
      interval: timeout
    }
    dataStore.insert(session, callback);
  }

  exports.get = function(id, callback) {
    dataStore.findOne({_id: id}, callback);
  }

  exports.clear = function(callback) {
    dataStore.remove({timeout: {$lt: new Date()}}, callback);
  }

  exports.touch = function(id, callback) {
    var newTimeout = new Date(new Date().getTime() + timeout);
    dataStore.update({_id: id}, {$set: {timeout: newTimeout}}, callback);
  }

  exports.remove = function(id, callback) {
    dataStore.remove({_id: id}, callback);
  }

  exports.middleware = function(req, res, next) {
    if (req.session) {
      if (!req.cookies.session) {
        /* set new cookie */
        res.cookie('session', req.session._id);
        return next();
      } else {
        if (req.cookies) {
          var sessionId = req.cookies.session;
          return exports.touch(sessionId, function(err) {
            if (err) {
              return res.send(500, "Internal Server Error");
            }
            return next();
          })
        }
      }
    } else {
      if (req.cookies && req.cookies.session) {
        var sessionId = req.cookies.session;
        return exports.get(sessionId, function(err, sess) {
          if (err) {
            return next(err);
          }
          if (!sess) {
            return next();
          }
          req.session = sess;
          return next();
        });
      }
    }
    return next();
  }

  exports.setCookie = function(res, session) {
    res.cookie('session', session._id, {path: '/', secure: true, maxAge: timeout});
  }
}