var { Cc, Ci, Cr, Cu } = require('chrome');
var { emit } = require("sdk/event/core");
var { EventTarget } = require("sdk/event/target");
var { Class } = require("sdk/core/heritage");
var { XPCOMUtils } = Cu.import("resource://gre/modules/XPCOMUtils.jsm");
var priv = require("sdk/core/namespace").ns();

exports.Overlay = Class({
  extends: EventTarget,
  initialize: function(tab) {
    EventTarget.prototype.initialize.call(this);
    var that = this;
    var panel = tab.ownerDocument.getElementById(tab.linkedPanel);
    var stack = panel.getElementsByClassName('browserStack')[0];
    // TODO: Handle existing stack?
    var browser = stack.children[0],
        document = panel.ownerDocument;

    var controls = document.createElement('iframe'),
        form = document.createElement('iframe'),
        overlayBackground = document.createElement('vbox'),
        overlayForeground = document.createElement('vbox'),
        overlay = document.createElement('stack');


    overlay.setAttribute('class', 'secureFormOverlay');

    overlayBackground.setAttribute('class', 'secureFormOverlayBackground');
    overlayForeground.setAttribute('class', 'secureFormOverlayForeground');

    controls.setAttribute('class', 'secureFormControls');
    controls.setAttribute('type', 'content');

    form.setAttribute('class', 'secureFormForm');
    form.setAttribute('flex', '1');
    form.setAttribute('type', 'content');

    overlayForeground.appendChild(controls);
    overlayForeground.appendChild(form);
    overlay.appendChild(overlayBackground);
    overlay.appendChild(overlayForeground);
    overlay.style.visibility = 'hidden';
    stack.appendChild(overlay);


    form.setAttribute('src', 'data:text/html,' + encodeURIComponent("<html><body><form></form></body></html>"));
    form.docShell.allowAuth = false;
    form.docShell.allowImages = false; // TODO: Fix this. We really need to prevent remote resource loading...
    form.docShell.allowJavascript = false;
    form.docShell.allowMetaRedirects = false;
    form.docShell.allowPlugins = false;
    form.docShell.allowSubframes = false;
    //form.docShell.allowWindowControl = false;

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
    priv(this).form = form;
    priv(this).controls = controls;

    // Can't reference documents hear as they haven't been loaded.
    this.form = form.contentWindow;
    this.controls = controls.contentWindow;

    priv(this).form.addEventListener("submit", function() {
      // Keep a reference (or doc goes bye-bye).
      var doc = that.form.document;
      that.remove();
      emit(that, "submit", doc);
    }, true);
  },
  setControls: function(url) {
    this.controls.location = url;
  },
  remove: function() {
    this.controls.close();
    this.form.close();
    priv(this).el.parentNode.removeChild(priv(this).el);
    priv(this).browser.removeProgressListener(priv(this).progressListener);
  },
  hide: function() {
    priv(this).el.style.visibility = "hidden";
    emit(this, "hide");
  },
  show: function() {
    priv(this).el.style.visibility = "visible";
    emit(this, "show");
  }
});
