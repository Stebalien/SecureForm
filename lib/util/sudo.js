// This is where we put our privilege escalation hacks...
var { getOwnerWindow } = require('sdk/private-browsing/window/utils');

function getOwnerWindow(window) {
  getOwnerWindow(window);
}

function getTabPanel(tab) {
  return getOwnerWindow(tab.window).document.getElementById("panel"+tab.id);
}

exports.getOwnerWindow = getOwnerWindow;
exports.getTabPanel = getTabPanel;
