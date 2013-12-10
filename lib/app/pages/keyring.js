var {TabPage} = require("app/page");

// This function IS NOT A CLOSURE!
module.exports = new TabPage(require, "keyring", function() {
  var {keyring, encrypt, EncryptedMessage}     = require("app/models/pgp");
  var _             = require("underscore");
  var css           = require_page("page/util/css");
  var {HKPModel}    = require("app/models/hkp");
  var {ImportView, PublicKeyringView, PrivateKeyringView} = require_page("app/views/keyring");
  var {TabbedView}  = require_page("app/views/tabbed");
  css.load("keyring");

  document.title = "SecureForm Keyring";

  var view = new TabbedView({
    tabs: [
      {
        name: "public",
        title: "Public Keys",
        view: new PublicKeyringView({model: keyring})
      },
      {
        name: "private",
        title: "Private Keys",
        view: new PrivateKeyringView({model: keyring})
      },
      {
        name: "import",
        title: "Import Keys",
        view: new ImportView({model: keyring})
      }
    ]
  });
  $(document).ready(function() {
    $(document.body).append(view.render().$el);
  });
});
