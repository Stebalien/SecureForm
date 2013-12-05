var {View} = require("lib/backbone");
var {template} = require("templates");
var _ = require("lib/underscore");

exports.ListView = View.extend({
  tagName: 'ul',
  className: 'list-group',
  initialize: function(options) {
    this.itemView = options.itemView;
    this.views = {};
  },
  render: function() {
    this._rendered = true;
    this.listenTo(this.collection, 'add', this.addModel);
    this.listenTo(this.collection, 'remove', this.removeModel);
    this.collection.each(this.addModel, this);
    return this;
  },
  addModel: function(model) {
    if (!this._rendered) {
      return;
    }
    var view = this.views[model.id];
    if (view) {
      // Re-render
      view.render();
    } else {
      this.views[model.id] = view = new this.itemView({model: model});
      var item = $('<li class="list-group-item">');
      item.append(view.render().$el);
      this.$el.append(item);
    }
  },
  removeModel: function(model) {
    if (!this._rendered) {
      return;
    }
    var view = this.views[model.id];
    if (view) {
      delete this.views[model.id];
      view.$el.parent().remove();
      view.remove();
    }
  }
});

