var { emit, once } = require("sdk/event/core");
var { Class } = require("sdk/core/heritage");
var {Overlay, namespace: priv} = require("app/views/overlay");
var _ = require("underscore");
/*
 * Overlay:
 * Attributes:
 *  form                  : The form's window.
 *  controls              : The control's window.
 * Functions:
 *  * event functions sdk/event/target documentation
 *  ready(callback)       : Call callback when the form dom is ready.
 *  setControls(url)      : Set controls URL.
 *  hide()                : Hide the overlay.
 *  show()                : Show the overlay.
 *  remove()              : Remove the overlay. DO NOT USE AFTER CALLING.
 * Events:
 *  submit(doc, [button]) : When the form is submitted.
 *  ready(doc)            : When the form is ready.
 *  show()                : When the form is shown.
 *  hide()                : When the form is hidden.
 */
var FormOverlay = Class({
  extends: Overlay,
  initialize: function(tab) {
    Overlay.prototype.initialize.call(this, tab);
    var that = this;
    var overlay = priv(this).overlay;
    var document = overlay.ownerDocument;

    var controls = document.createElement('iframe'),
        form = document.createElement('iframe'),
        hideButtonContainer = document.createElement('hbox'),
        hideButton = document.createElement('button');

    controls.setAttribute('class', 'secureFormControls');
    controls.setAttribute('type', 'content');

    form.setAttribute('class', 'secureFormForm');
    form.setAttribute('flex', '1');
    form.setAttribute('type', 'content');

    hideButtonContainer.setAttribute('pack', 'center');

    hideButton.setAttribute('class', 'secureFormButton');
    hideButton.setAttribute("label", "Hide");

    hideButtonContainer.appendChild(hideButton);
    overlay.appendChild(controls);
    overlay.appendChild(form);
    overlay.appendChild(hideButtonContainer);


    controls.setAttribute('src', 'data:text/html,' + encodeURIComponent("<html><body></body></html>"));

    form.setAttribute('src', 'data:text/html,' + encodeURIComponent("<html><body></body></html>"));
    form.docShell.allowAuth = false;
    form.docShell.allowImages = false; // TODO: Fix this. We really need to prevent remote resource loading...
    form.docShell.allowJavascript = false;
    form.docShell.allowMetaRedirects = false;
    form.docShell.allowPlugins = false;
    form.docShell.allowSubframes = false;
    form.docShell.allowWindowControl = false;

    priv(this).form = form;
    priv(this).controls = controls;

    // Can't reference documents hear as they haven't been loaded.
    this.form = form.contentWindow;
    this.controls = controls.contentWindow;

    hideButton.addEventListener("command", function() {
      that.hide();
    });

    priv(this).form.addEventListener('DOMContentLoaded', function() {
      that.isReady = true;
      emit(that, 'ready', that.form.document);
    });

    priv(this).form.addEventListener("submit", function(event) {
      event.preventDefault();
      event.stopImmediatePropagation(); 
    });

    // Ignore our fake clicks while checking validity.
    var checkingValidity = false;

    // Use click events instead of submits as we allow submit buttons outside
    // of forms.
    priv(this).form.addEventListener("click", function(event) {
      var target = event.target;
      if (checkingValidity ||
          target.tagName !== "INPUT" ||
          target.type !== "submit") {
        return;
      }

      var tmpSubmitButton = that.form.document.createElement('input');
      tmpSubmitButton.setAttribute('type', 'submit');
      var cancel = false;
      checkingValidity = true;
      _.each(that.form.document.forms, function(form) {
        if (!form.checkValidity()) {
          cancel = true;
          form.appendChild(tmpSubmitButton);
          tmpSubmitButton.click();
          form.removeChild(tmpSubmitButton);
        }
      });
      checkingValidity = false;
      if (cancel) {
        return;
      }

      emit(that, "submit", that.form, target);

    }, true);
  },
  ready: function(cb) {
    if (this.isReady) {
      cb(this.form);
    } else {
      this.once('ready', cb);
    }
  }
});
exports.FormOverlay = FormOverlay;
