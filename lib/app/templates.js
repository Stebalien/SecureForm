var data = require("sdk/self").data;
var _ = require("underscore");
var cache = {};

exports.template = function Template(path) {
  if (!cache.hasOwnProperty(path)) {
    try {
      var templateString = data.load("templates/"+path);
    } catch (e) {
      throw new Error("No such template: " + path);
    }
    try {
    cache[path] = _.template(templateString);
    } catch (e) {
      console.log(e);
    }
  }
  return cache[path];
};
