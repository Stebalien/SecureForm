var self = require('sdk/self');
var tabs = require('sdk/tabs');
var {Widget} = require('sdk/widget');
var keyringPage = require('app/pages/keyring');
var {overlayVisibleOnTab, monitor: overlayMonitor} = require("app/views/overlay");

var mainWidget = Widget({
  id: "open-keyring",
  label: "Open Keyring",
  contentURL: self.data.url("keyring-widget.html"),
  contentScriptFile: self.data.url("js/widget.js"),
  onClick: function() {
    keyringPage.activate();
  },
  contentScriptWhen: "start"
});


function showIndicator(win, state) {
  var widget = mainWidget.getView(win);
  if (state) {
    widget.width = 70;
    widget.port.emit('showIndicator');
  } else {
    widget.width = 15;
    widget.port.emit('hideIndicator');
  }
}

tabs.on('activate', function(tab) {
  showIndicator(tab.window, overlayVisibleOnTab(tab));
});

overlayMonitor.on('visible', function(tab) {
  if (tab === tabs.activeTab) {
    showIndicator(tab.window, true);
  }
});

overlayMonitor.on('hidden', function(tab) {
  if (tab === tabs.activeTab) {
    showIndicator(tab.window, false);
  }
});
