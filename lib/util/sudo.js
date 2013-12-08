// This is where we put our privilege escalation hacks...
var { getOwnerWindow } = require('sdk/private-browsing/window/utils');

function getOwnerWindow(window) {
  getOwnerWindow(window);
}

exports.getOwnerWindow = getOwnerWindow;
