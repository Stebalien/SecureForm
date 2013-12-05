var data = require("sdk/self").data;
var ss = require("sdk/simple-storage");
var _ = require("lib/underscore");
const { sandbox, load } = require("sdk/loader/sandbox");

var scope = sandbox();


var store = ss.storage.openpgp;
if (!store) {
  store = ss.storage.openpgp = {};
}

scope.localStorage = {
    setItem: function(key, value) {
      store[key] = value;
    },
    getItem: function(key) {
      return store.hasOwnProperty(key) ? store[key] : null;
    },
    removeItem: function(key) {
      delete store[key];
    },
    clear: function() {
      store = ss.storage.openpgp = {};
    }
};
scope.navigator = {
  appName: "Firefox"
};
scope.window = scope;

load(scope, data.url("js/lib/openpgp.js"));
 
scope.openpgp.init();

module.exports = scope.openpgp;
