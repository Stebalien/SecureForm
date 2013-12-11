var { setTimeout } = require('sdk/timers');
var Wu = require('sdk/window/utils');
var Tu = require('sdk/tabs/utils');
var self = require('sdk/self');
var tabs = require('sdk/tabs');
var {Widget} = require('sdk/widget');
var keyringPage = require('app/pages/keyring');
var {getTabPanel} = require('sdk-extra/sudo');
var {PageMod} = require('sdk/page-mod');
var _ = require('underscore');

var displayPage = require('app/pages/display');

Widget({
  id: "open-keyring",
  label: "Open Keyring",
  contentURL: self.data.url("keyring-widget.html"),
  onClick: function() {
    keyringPage.activate();
  }
});

require('app/styleloader').addSheet(self.data.url("css/browser.css"));
require('app/content-manager');

var keyChooserOverlay = require('app/pages/keychooser-overlay');
keyChooserOverlay.activate();


var {Overlay} = require('app/views/overlay');
setTimeout(function() {
  var overlay = new Overlay(tabs[0]);
  overlay.ready(function(){
    var doc = overlay.form.document;
    var submit = doc.createElement('input');
    submit.type = "submit";
    submit.value = "Submit";

    var text = doc.createElement('input');
    text.required = true;

    var form = doc.createElement('form');
    form.appendChild(text);
    form.appendChild(submit);

    doc.body.appendChild(form);
    doc.body.appendChild(submit);
    overlay.show();
  });
}, 1000);
