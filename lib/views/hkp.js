var {View} = require("lib/backbone");
var {PublicKeyView} = require("views/keyring");

exports.HKPView = View.extend({
  initialize: function() {
    this.views = {};
  },
  render: function() {
    this.listenTo(this.collection, 'add', this.addResult);
    this.listenTo(this.collection, 'remove', this.removeResult);
    this.collection.each(this.addResult, this);
    return this;
  },
  addResult: function(model) {
    var view = this.views[m.id];
    if (view) {
      // Re-render
      view.render();
    } else {
      view = new PublicKeyView({model: m});
      this.views[model.id] = view;
      this.$el.append(view.render().$el);
    }
  },
  removeResult: function(model) {
    var view = this.views[model.id];
    if (view) {
      delete this.views[model.id];
      view.remove();
    }
  }
});

