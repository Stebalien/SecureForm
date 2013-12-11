var { setTimeout } = require('sdk/timers');
var Wu = require('sdk/window/utils');
var Tu = require('sdk/tabs/utils');
var self = require('sdk/self');
var tabs = require('sdk/tabs');
var {Widget} = require('sdk/widget');
var keyringPage = require('app/pages/keyring');

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

