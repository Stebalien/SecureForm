var {TabPage} = require("app/page");

// This function IS NOT A CLOSURE!
module.exports = new TabPage(require, "unlock", function() {
  var callback = function(success) { };
  var {keyring} = require('app/models/pgp');
  var key = keyring.get('privateKeys').at(0);
  var subkey = key.get('primaryKey');

  // Call `subkey.unlock(password)` until it works or the user cancels.
  //
  // On success, call callback(true);
  // On cancel, call callback(false);

  // View code HERE!
});
