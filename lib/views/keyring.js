var {View} = require("lib/backbone");
var {ListView} = require("views/list");
var {template} = require("templates");
var _ = require("lib/underscore");

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
    this.listView = new ListView({
      collection: this.model.get('publicKeys'),
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
    'change #importFiles': 'onImportFiles'
  },
  render: function() {
    this.$el.html(this.template());
    return this;
  },
  onImportFiles: function(event) {
    var that = this;
    _.each(event.target.files, function(file) {
      var reader = new FileReader();
      reader.onload = function() {
        that.model.importPublicKey(reader.result);
      };
      reader.readAsText(file);
    });
  }
});
