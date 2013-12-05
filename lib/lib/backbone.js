var _ = require("lib/underscore");
var data = require("sdk/self").data;
const { sandbox, load } = require("sdk/loader/sandbox");

var scope = sandbox();
scope._ = _;
scope.window = scope;

// May have jQuery
try { scope.$ = $; } catch (e) { }


load(scope, data.url("js/lib/backbone.js"));
load(scope, data.url("js/lib/backbone.store.js"));
load(scope, data.url("js/lib/backbone.relational.js"));

module.exports = scope.Backbone;
