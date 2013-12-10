/**
 * Hey there...
 * Go away.
 * NO SERIOUSLY. GO AWAY.
 * 
 * (please, for your own sanity)
 **/

var tabs = require('sdk/tabs');
var {Class} = require('sdk/core/heritage');
var {Cu} = require('chrome');
var {pivot} = Cu.import('chrome://secure-form/content/pivot.jsm');
var querystring = require("sdk/querystring");
var _ = require('underscore');
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
  'templates': require("app/templates")
}, options.modules);

var anonymousPageCounter = 0;

var Page = Class({
  initialize: function(requirer, name, fn) {
    var that = ns(this);

    if (arguments.length === 2) {
      fn = page;
      name = "page"+anonymousPageCounter++;
    } else if (arguments.length !== 3) {
      throw new Error("Invalid Arguments");
    }

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
    this.url = 'chrome://secure-form/content/page.html?'
                + querystring.stringify({name: name});
  },
  urlWithArgs: function() {
    return this.url + '&' + querystring.stringify({
      args: JSON.stringify(Array.prototype.slice.call(arguments, 0))
    });
  },
  destroy: function() {
    delete pivot[this.name];
  }
});

var TabPage = Class({
  extends: Page,
  initialize: function() {
    var that = ns(this);
    exports.Page.prototype.initialize.apply(this, arguments);
    that._tab = _.findWhere(tabs, {'url': this.url});
  },
  activate: function() {
    var that = ns(this);
    if (that._tab) {
      if (that._tab === true) {
        // Already Launching
        return;
      }
      if (that._tab.url === this.url) {
        // Activate
        that._tab.activate();
        return;
      }
    }
    // Open
    that._tab = true;
    tabs.open({
      url: this.url,
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
      if (that._tab.url === this.url) {
        that._tab.close();
      } else {
        that._tab = null;
      }
    }
  }
});



exports.Page = Page;
exports.TabPage = TabPage;
