exports.initialize = function(dataStore) {
  
  var crypto = require('crypto');
  var _salt = 'xN8_42Be90';

  function encrypt(algorithm, text, salt) {
    var cipher = crypto.createCipher(algorithm, text + salt)
    var crypted = cipher.update(text,'utf8','hex')
    crypted += cipher.final('hex');
    return crypted;
  }

  function encryptPassword(password) {
    return encrypt('aes256', password, _salt);
  }

  exports.create = function(username, password, rights, callback) {
    dataStore.insert({
      username: username,
      password: encryptPassword(password),
      rights: rights
    }, callback);
  }

  exports.get = function(username, password, callback) {
    dataStore.findOne({username: username, password: encryptPassword(password)}, callback);
  }

  exports.all = function(callback) {
   dataStore.find({}, callback); 
  }

  exports.count = function(callback) {
    dataStore.count({}, callback);
  }
}