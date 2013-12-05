var {View} = require("lib/backbone");
var {template} = require("templates");
var _ = require("lib/underscore");

exports.TabbedView = View.extend({
  template: template("tabbed.html"),
  initialize: function(options) {
    this.tabs = options.tabs;
  },
  events: {
    "click .nav-tabs a": function() {
      $(this).tab('show');
    }
  },
  render: function() {
    var that = this;
    this.$el.html(this.template({
      cid: this.cid,
      tabs: this.tabs
    }));
    this.$(".nav-tabs li:first").addClass("active");
    this.$(".tab-content .tab-pane:first").addClass("active");
    _.each(this.tabs, function(tab) {
      that.$("#"+that.cid+"-"+tab.name).html(tab.view.render().$el);
    });
    return this;
  }
});
