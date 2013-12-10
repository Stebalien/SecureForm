var data = require("sdk/self").data;
const { sandbox, load } = require("sdk/loader/sandbox");
var { setTimeout } = require('sdk/timers');

var scope = sandbox();
scope.setTimeout = setTimeout;
scope.window = scope;

load(scope, data.url("js/lib/underscore.js"));
load(scope, data.url("js/lib/underscore.string.js"));

module.exports = scope._;
