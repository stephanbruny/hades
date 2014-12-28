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

  exports.clean = function(callback) {
    dataStore.remove({timeout: {$lt: new Date()}}, callback);
  }

  exports.touch = function(id, callback) {
    var newTimeout = new Date(new Date().getTime() + timeout);
    dataStore.update({_id: id}, {$set: {timeout: newTimeout}}, callback);
  }
}