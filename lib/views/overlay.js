var { Cc, Ci, Cr, Cu } = require('chrome');
var { Class } = require('lib/types');
var { XPCOMUtils } = Cu.import("resource://gre/modules/XPCOMUtils.jsm");

exports.Overlay = Class.extend({
  init: function(tab, controlsURI, formContent) {
    var that = this;
    var panel = tab.ownerDocument.getElementById(tab.linkedPanel);
    var stack = panel.getElementsByClassName('browserStack')[0];
    if (stack.getElementsByClassName('secureFormOverlay').length > 0) {
      return null;
    }
    var oldBrowser = stack.children[0];
    var document = panel.ownerDocument;

    var controls = document.createElement('iframe'),
        form = document.createElement('iframe'),
        overlayBackground = document.createElement('vbox'),
        overlayForeground = document.createElement('vbox'),
        overlay = document.createElement('stack');

    overlayForeground.appendChild(controls);
    overlayForeground.appendChild(form);
    overlay.appendChild(overlayBackground);
    overlay.appendChild(overlayForeground);

    overlayBackground.setAttribute('class', 'secureFormOverlayBackground');
    overlayForeground.setAttribute('class', 'secureFormOverlayForeground');
    controls.setAttribute('class', 'secureFormControls');
    form.setAttribute('class', 'secureFormForm');
    form.setAttribute('flex', '1');

    stack.appendChild(overlay);

    controls.setAttribute('type', 'content');
    controls.setAttribute('src', controlsURI);

    form.docShell.allowAuth = false;
    form.docShell.allowImages = false; // TODO: Fix this. We really need to prevent remote resource loading...
    form.docShell.allowJavascript = false;
    form.docShell.allowMetaRedirects = false;
    form.docShell.allowPlugins = false;
    form.docShell.allowSubframes = false;
    form.setAttribute('type', 'content');

    // TODO: Maybe limit requests here?
    // We can also limit elements here.
    form.setAttribute('src', 'data:text/html,' + encodeURIComponent(formContent));

    overlay.setAttribute('class', 'secureFormOverlay');

    oldBrowser.addProgressListener({
      QueryInterface: XPCOMUtils.generateQI([Ci.nsIWebProgressListener, Ci.nsISupportsWeakReference]),
      onLocationChange: function() {
        that.remove();
        stack.removeChild(overlay);
      },
      onProgressChange: function() {},
      onSecurityChange: function() {},
      onStateChange: function() {},
      onStatusChange: function() {}
    });
    this._el = overlay;
    this.form = form.contentDocument;
    this.controls = controls.contentDocument;

    this.form.addEventListener("submit", function() {
      // TODO
    }, true);
  },
  remove: function() {
    this._el.parent.removeChild(this._el);
  }
});
