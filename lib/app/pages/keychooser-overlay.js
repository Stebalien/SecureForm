var {TabPage} = require("app/page");

// This function IS NOT A CLOSURE!
module.exports = new TabPage(require, "keyring", function() {
  var callback = function(keys) { };
  // View code HERE!
  var {keyring} = require('keyring');
  var publicKeys = keyring.get('publicKeys');

  // Display a searchable list (autocomplete dropdown?) of public keys.
  // Let the user add keys to a list of keys.
  //
  // On success, call callback(keys);
  // On cancel, call callback();

});
