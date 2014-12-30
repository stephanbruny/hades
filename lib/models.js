/* Custom Model library */
exports.initialize = function(dbDirectory) {
  var nedb = require('nedb');
  var fs = require('fs');
  var databases = fs.readdirSync(dbDirectory);
  var models = {};
  databases.forEach(function(db) {
    models[db] = new nedb(dbDirectory + '/' + db, {autoload: true});
  });

  exports.create = function(name, callback) {
    if (models[name]) {
      return callback(new Error('Model already exists.'));
    }
    models[name] = new nedb(dbDirectory + '/' + name, {autoload: true});
    callback(null, models[name]);
  }

  exports.insert = function(name, data, callback) {
    if (models[name]) {
      return models[name].insert(data, callback);
    }
    return callback();
  }

  exports.find = function(name, data, callback) {
    if (models[name]) {
      return models[name].find(data, callback);
    }
    return callback();
  }

  exports.getModels = function() {
    return models;
  }

  exports.getDocument = function(modelName, query, callback) {
    models[name].findOne(query, function(err, data) {
      if (err) {
        return callback(err);
      }
      result = {};
      for (var key in data) {
        result.push({key: key, value: data[key], type: typeof(data[key])});
      }
      callback(null, result);
    });
  }
  
}