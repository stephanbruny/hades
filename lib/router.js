exports.initialize = function(dataStore) {
  exports.addRoute = function(method, pattern, action, page, callback) {
    var route = {
      method: method || 'get',
      pattern: pattern,
      action: action, 
      page: page
    }
    dataStore.insert(route, callback);
  }

  exports.getRoutes = function(method, callback) {
    dataStore.find({method: method}, callback);
  }
}