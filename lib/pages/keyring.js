var {Page} = require("util/page");

// This function IS NOT A CLOSURE!
module.exports = new Page(require, "keyring", function() {
  var {keyring}     = require("models/keyring");
  var css           = require_page("page/util/css");
  var {HKPModel}    = require("models/hkp");
  var {ImportView, PublicKeyringView, PrivateKeyringView} = require_page("views/keyring");
  var {TabbedView}  = require_page("views/tabbed");
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

