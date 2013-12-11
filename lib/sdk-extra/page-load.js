var windows = require("sdk/windows").browserWindows;
var {getTabBrowser, getTabForContentWindow} = require('sdk/tabs/utils');
var {getOwnerWindow} = require('sdk-extra/sudo');
const {EventTarget} = require("sdk/event/target");
const {emit} = require("sdk/event/core");


var vent = EventTarget();

function onLoad(event) {
  var doc = event.originalTarget;
  if (doc instanceof this.contentWindow.HTMLDocument) {
    var win = doc.defaultView;
    var that = this;
    var tab = getTabForContentWindow(doc.defaultView);
    if (!tab) {
      return;
    }
    function cb() {
      that.removeEventListener('load', cb);
      if (win.location.href === 'about:blank' ||
          /^(https?|data|blob):$/.test(win.location.protocol)) {
        emit(vent, 'load', win.document, tab, that);
      }
    }
    this.addEventListener('load', cb);
    if (win.location.href) {
      cb();
    }
  }
}

function watchWindow(window) {
  var gBrowser = getTabBrowser(getOwnerWindow(window));
  gBrowser.addEventListener('load', onLoad, true);
}

function unwatchWindow(window) {
  var gBrowser = getTabBrowser(getOwnerWindow(window));
  gBrowser.removeEventListener('load', onLoad);
}

Array.prototype.forEach.call(windows, watchWindow);
windows.on('open', watchWindow);
windows.on('close', unwatchWindow);

module.exports = vent;
