var { Cc, Ci, Cr, Cu } = require('chrome');
var { emit } = require("sdk/event/core");
var { EventTarget } = require("sdk/event/target");
var { Class } = require("sdk/core/heritage");
var { getTabPanel } = require("sdk-extra/sudo");
var { XPCOMUtils } = Cu.import("resource://gre/modules/XPCOMUtils.jsm");
var priv = require("sdk/core/namespace").ns();
var _ = require("underscore");

var monitor = new EventTarget();
var overlayCounter = {};

function overlayVisibleOnTab(tab) {
  return !!overlayCounter[tab.id];
}

// Reference counter
// We use these to keep track of the number of visible overlays on a tab.
function incrementTab(tab) {
  if (!overlayCounter.hasOwnProperty(tab.id)) {
    overlayCounter[tab.id] = 0;
  }
  overlayCounter[tab.id] += 1;
  if (overlayCounter[tab.id] === 1) {
    emit(monitor, "visible", tab);
  }
}

function decrementTab(tab) {
  if (!overlayCounter.hasOwnProperty(tab.id) || overlayCounter[tab.id] <= 0) {
    throw new Error("Invalid overlay count");
  }
  overlayCounter[tab.id] -= 1;
  if (overlayCounter[tab.id] === 0) {
    emit(monitor, "hidden", tab);
  }
}

var Overlay = Class({
  extends: EventTarget,
  initialize: function(tab) {
    EventTarget.prototype.initialize.call(this);
    var that = this;
    this.isReady = false;

    var stack = getTabPanel(tab).getElementsByClassName('browserStack')[0];
    var browser = stack.children[0];
    var document = browser.ownerDocument;

    var overlayBackground = document.createElement('vbox'),
        overlayForeground = document.createElement('vbox'),
        overlay = document.createElement('stack');

    overlay.setAttribute('class', 'secureFormOverlay');

    overlayBackground.setAttribute('class', 'secureFormOverlayBackground');
    overlayForeground.setAttribute('class', 'secureFormOverlayForeground');

    overlay.appendChild(overlayBackground);
    overlay.appendChild(overlayForeground);
    overlay.style.visibility = 'hidden';
    stack.appendChild(overlay);

    var progressListener = {
      QueryInterface: XPCOMUtils.generateQI([Ci.nsIWebProgressListener, Ci.nsISupportsWeakReference]),
      onLocationChange: function(progress, request, uri, flags) {
        if (flags && (flags & Ci.nsIWebProgressListener.LOCATION_CHANGE_SAME_DOCUMENT)) {
          return;
        }
        that.remove();
      },
      onProgressChange: function() {},
      onSecurityChange: function() {},
      onStateChange: function() {},
      onStatusChange: function() {}
    };

    browser.addProgressListener(progressListener);

    priv(this).browser = browser;
    priv(this).progressListener = progressListener;
    priv(this).el = overlay;
    priv(this).overlay = overlayForeground;
    this.tab = tab;
  },
  remove: function() {
    this.isReady = false;
    this.hide();
    priv(this).el.parentNode.removeChild(priv(this).el);
    priv(this).browser.removeProgressListener(priv(this).progressListener);
  },
  hide: function() {
    if (this.visible) {
      priv(this).el.style.visibility = "hidden";
      this.visible = false;
      decrementTab(this.tab);
      emit(this, "hide");
    }
  },
  show: function() {
    if (!this.visible) {
      priv(this).el.style.visibility = "visible";
      this.visible = true;
      incrementTab(this.tab);
      emit(this, "show");
    }
  }
});

var IFrameOverlay = Class({
  extends: Overlay,
  initialize: function(tab, src) {
    Overlay.prototype.initialize.call(this, tab);
    var that = this;
    var overlay = priv(this).overlay;
    var document = overlay.ownerDocument;

    var iframe = document.createElement('iframe');
    iframe.setAttribute('class', 'secureFormDialog outset');
    iframe.setAttribute('type', 'chrome');
    iframe.setAttribute('src', src);
    iframe.setAttribute('flex', '1');
    overlay.appendChild(iframe);

    iframe.addEventListener('load', function() {
      that.isReady = true;
      emit(that, 'load', that.iframe);
    });
    iframe.addEventListener("unload", function() {
      that.isReady = false;
      that.remove();
    });
  },
  loaded: function(cb) {
    if (this.isReady) {
      cb(this.iframe);
    } else {
      this.once('load', cb);
    }
  }
});


exports.Overlay = Overlay;
exports.IFrameOverlay = IFrameOverlay;
exports.namespace = priv;
exports.monitor = monitor;
exports.overlayVisibleOnTab = overlayVisibleOnTab;
