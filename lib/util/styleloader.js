var windows = require("sdk/windows").browserWindows;
var { getOwnerWindow } = require('util/sudo');
var styleUtils = require('sdk/stylesheet/utils');
var _ = require('lib/underscore');

var stylesheets = {};

function addSheet(stylesheet) {
  stylesheets[stylesheet] = true;
  _.each(windows, function(w) {
    styleUtils.loadSheet(getOwnerWindow(w), stylesheet, "agent");
  });
}
exports.addSheet = addSheet;

function removeSheet(stylesheet) {
  delete stylesheets[stylesheet];
  _.each(windows, function(w) {
    styleUtils.removeSheet(getOwnerWindow(w), stylesheet, "agent");
  });
}
exports.removeSheet = removeSheet;

windows.on('open', function(window) {
  _.each(stylesheets, function(v, s) {
    styleUtils.loadSheet(getOwnerWindow(window), s, "agent");
  });
});

