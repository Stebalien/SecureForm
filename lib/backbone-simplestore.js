var ss = require("sdk/simple-storage");

exports = {
  set: function(key, object, options) {
    try {
      ss.storage[key] = object;
      if (options && options.success) options.success();
    } catch (e) {
      if (options && options.error) options.error(e);
    }
  },
  get: function(key, options) {
    if (!options) {
      return;
    }
    if (ss.storage.hasOwnProperty("key")) {
      var object = ss.storage["key"];
      if (options.success) {
        options.success(object);
      }
    } else {
      if (options.error) {
        options.error("Not Found");
      }
    }
  },
  remove: function(key, options) {
    try {
      delete ss.storage[key];
      if (options && options.success) options.success();
    } catch (e) {
      if (options && options.error) options.error(e);
    }
  }
};

