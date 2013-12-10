var windows = require("sdk/windows").browserWindows;
var {getTabBrowser} = require('sdk/tabs/utils');
var {getOwnerWindow} = require('sdk-extra/sudo');
const {EventTarget} = require("sdk/event/target");
const {emit} = require("sdk/event/core");


var vent = EventTarget();

function onLoad(event) {
  var doc = event.target;
  if (doc instanceof this.contentWindow.HTMLDocument) {
    var location = doc.defaultView.location;
    if (location.href === 'about:blank' ||
        /^(https?|data|blob):$/.test(location.protocol)) {
      emit(vent, 'load', doc);
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
