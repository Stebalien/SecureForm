var attachTo = require("sdk/content/mod").attachTo;
var {Tab} = require("sdk/tabs/tab");
var self = require('sdk/self');
var {encrypt} = require('app/models/pgp');
var encode = require('app/form-encoder').encode;
var decode = require('app/mime-parser').mimeDecode;
var displayPage = require("app/pages/display");
var {FormOverlay} = require('app/views/form');
var {generateRandomBytes} = require('sdk-extra/crypto');
var {shadowDOMs} = require("shadowdoms");
var hiddenFrames = require("sdk/frame/hidden-frame");
var { getTabPanel } = require("sdk-extra/sudo");
var pageMod = require("sdk/page-mod");
var keyChooserOverlay = require('app/pages/keychooser-overlay');

var style = 'encrypted { display: block; -moz-binding: url('+self.data.url('xbl/custom-elements.xbl')+'#encrypted); }';

pageMod.PageMod({
  include: ["*"],
  contentStyle: style,
  attachTo: ["existing", "top"],
  contentScriptWhen: "start",
  contentScriptFile: self.data.url('js/api.js'),
  onAttach: function(worker) {
    var browser = getTabPanel(worker.tab).getElementsByClassName('browserStack')[0].children[0];
    var win = browser.contentWindow;
    var doc = browser.contentDocument;

    // Manage encrypted elements.
    doc.addEventListener('-encrypted-element-load', function(e) {
      var data = e.detail;
      var element = e.originalTarget;
      if (element.tagName !== "ENCRYPTED") return;

      var iframe = doc.getAnonymousNodes(element)[0];
      displayPage.open(iframe, data);
    }, true);

    var knownForms = {};

    worker.port.on('show', function(id) {
      var id = String(parseInt(id));
      var overlay = knownForms[id];
      if (overlay) {
        overlay.ready(function() {
          overlay.show();
        });
      }
    });

    worker.port.on('new', function(ctx) {

      var id = String(parseInt(ctx.id));
      if (knownForms.hasOwnProperty(id)) {
        return;
      }
      var overlay = knownForms[id] = new FormOverlay(worker.tab);
      worker.on('detach', function() {
        overlay.off();
      });

      // TODO Cleanup
      let hiddenFrame = hiddenFrames.add(hiddenFrames.HiddenFrame({
        onReady: function() {
          var that = this;
          var formSlave = this.element.contentWindow;
          overlay.form.onload = function() {
            that.element.addEventListener("DOMContentLoaded", function() {
              shadowDOMs(that.element.contentWindow, overlay.form.document);
            });
            var token = "-secure-form-"+generateRandomBytes(16);
            Object.defineProperty(win.content.wrappedJSObject.window, token, {
              enumerable: false,
              configurable: true,
              value: {
                controls: overlay.controls,
                form: formSlave,
                __exposedProps__: {
                  form: "r",
                  controls: "r"
                }
              }
            });
            worker.port.emit('load', {id: id, token: token});
          };
        }
      }));
      overlay.on('remove', function() {
        hiddenFrames.remove(hiddenFrame);
      });
      overlay.on('show', function() {
        worker.port.emit('show', {id: id});
      });
      overlay.on('hide', function() {
        worker.port.emit('hide', {id: id});
      });
      overlay.on('submit', function(win, selectedElement) {
        var ov = keyChooserOverlay.open(worker.tab, function(keys) {
          ov.remove();
          if (keys) {
            encode(win, selectedElement, function(data) {
              worker.port.emit('submit', {id: id, data: encrypt(data, keys)});
              overlay.remove();
            });
          }
        });
      });

    });
  }
});
