var { setTimeout } = require('sdk/timers');
var Wu = require('sdk/window/utils');
var Tu = require('sdk/tabs/utils');
var self = require('sdk/self');
var {Widget} = require('sdk/widget');
var keyringPage = require('pages/keyring');

Widget({
  id: "open-keyring",
  label: "Open Keyring",
  contentURL: self.data.url("keyring-widget.html"),
  onClick: function() {
    keyringPage.activate();
  }
});

require('util/styleloader').addSheet(self.data.url("css/browser.css"));

/*
var {Overlay} = require('views/overlay');
setTimeout(function() {

  var window = Wu.getMostRecentBrowserWindow();
  var tab = Tu.getActiveTab(window);
  var overlay = new Overlay(tab);
  setTimeout(function() {
    var submit = overlay.form.document.createElement('input');
    submit.type = "submit";
    submit.value = "Submit";
    overlay.form.document.forms[0].appendChild(submit);
    overlay.on('submit', function(doc) {
      console.log(arguments);
    });
    overlay.show();
  }, 100);
}, 1000);

*/
