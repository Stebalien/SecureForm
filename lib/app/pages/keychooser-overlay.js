var {TabPage} = require("app/page");

// This function IS NOT A CLOSURE!
module.exports = new TabPage(require, "keychooser", function() {
  var css = require_page("page/util/css");
  css.load("keychooser");

  var callback = function(keys) { };
  // Display a searchable list (autocomplete dropdown?) of public keys.
  // Let the user add keys to a list of keys.
  //
  // On success, call callback(keys);
  // On cancel, call callback();
  var {keyring} = require('app/models/pgp');
  var publicKeys = keyring.get('publicKeys');


  var {template} = require("app/templates");
  var tmpl = template("keychooser.html");
  $(document).ready(function() {
    document.body.innerHTML = tmpl({
      uids: {a: "first", b: "second", c: "third"}
    });
    $(".chosen-select").chosen();
  });

  // onsubmit, get value from select...

});
