exports.initialize = function(dataStore) {
  exports.getPage = function(pageData, callback) {
   dataStore.find(pageData.find).sort(pageData.sort || {}).limit(pageData.limit || 0).exec(callback);
  }

  exports.render = function(page, context, callback) {
    try {
      // if (pageData.action) runAction(pageData.action, function(err, data) { ... })
      var hogan = require('hogan.js'); // require (config.renderEngine);
      var template = hogan.compile(page.template);
      callback(null, template.render(context));
    } catch (ex) {
      callback(ex);
    }
  }

  exports.createPage = function(id, title, content, callback) {
    dataStore.insert({
      id: id, 
      title: title,
      content: content,
      created: new Date()
    }, callback);
  }
}