var {View} = require("backbone");
var {ListView} = require("app/views/list");
var {template} = require("app/templates");
var _ = require("underscore");

var PublicKeyView = View.extend({
  template: template("public-key.html"),
  render: function() {
    this.$el.html(this.template({key: this.model}));
    return this;
  }
});

var KeyringView = View.extend({ });

exports.PublicKeyringView = KeyringView.extend({
  initialize: function() {
    this.collection = this.model.get('publicKeys');
    this.listView = new ListView({
      collection: this.collection,
      itemView: PublicKeyView
    });
  },
  render: function() {
    this.$el.append(this.listView.render().$el);
    return this;
  }
});

exports.PrivateKeyringView = KeyringView.extend({
});

exports.ImportView = View.extend({
  template: template("keyring-import.html"),
  events: {
    'submit #importForm': 'onImport'
  },
  render: function() {
    this.$el.html(this.template());
    return this;
  },
  onImport: function(event) {
    event.preventDefault();
    var input = this.$("#importInput");
    this.model.importPublicKey(input.val());
    input.val("");
    // Notify user that it worked.
  }
});