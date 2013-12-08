/**
 * Hey there...
 * Go away.
 * NO SERIOUSLY. GO AWAY.
 * 
 * (please, for your own sanity)
 **/

var tabs = require('sdk/tabs');
var {Class} = require('lib/types');
var {Cu} = require('chrome');
var {pivot} = Cu.import('chrome://secure-form/content/pivot.jsm');
var _ = require('lib/underscore');
var ns = require('sdk/core/namespace').ns();

// Get and clean options
var options = _.clone(require("@loader/options"));
delete options.resolve;
options.paths = {
  'sdk/': options.paths['addon-sdk/'] + 'sdk/',
  'page/': require('sdk/self').data.url('js/'),
  '': options.paths['./']
}

// Cache global template engine
options.modules = _.defaults({
  'templates': require("templates")
}, options.modules);

exports.Page = Class.extend({
  init: function(requirer, name, fn) {
    var that = ns(this);

    var ctx = pivot[name];
    var to_pivot = [];
    if (ctx) {
      if (ctx instanceof Array) {
        to_pivot = ctx;
      } else {
        throw new Error("Page already defined");
      }
    }

    // Create context
    ctx = pivot[name] = {
      require: requirer,
      code: fn.toSource(),
      options: options
    }
    to_pivot.forEach(function(callback) {
      callback(ctx);
    });

    this.name = name;
    that._url = 'chrome://secure-form/content/page.html?name=' + name;
    that._tab = _.findWhere(tabs, {'url': that._url});
  },
  activate: function() {
    var that = ns(this);
    if (that._tab) {
      if (that._tab === true) {
        // Already Launching
        return;
      }
      if (that._tab.url === that._url) {
        // Activate
        that._tab.activate();
        return;
      }
    }
    // Open
    that._tab = true;
    tabs.open({
      url: that._url,
      onOpen: function(tab) {
        that._tab = tab;
      },
      onClose: function() {
        that._tab = null;
      }
    });
  },
  close: function() {
    var that = ns(this);
    if (that._tab && that._tab !== true) {
      if (that._tab.url === that._url) {
        that._tab.close();
      } else {
        that._tab = null;
      }
    }
  }
});
