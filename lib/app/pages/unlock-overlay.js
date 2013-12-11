var {TabPage} = require("app/page");

// This function IS NOT A CLOSURE!
module.exports = new TabPage(require, "unlock", function() {
  var callback = function(success) { alert(success); };
  var {keyring} = require('app/models/pgp');
  var _ = require('underscore');
  var key = keyring.get('privateKeys').at(0);
  var subkey = key.get('primaryKey');

  var {template} = require("app/templates");
  var tmpl = template("unlock.html");
  $(document).ready(function() {
    var shortId = key.getShortId();
    var uids = key.get('uids').models;
    var myUids = _.map(uids, function(uid) {return uid.get('uid')});
    
    document.body.innerHTML = tmpl({
      id: shortId,
      uids: myUids
    });

    $("#submit").click(function() {
      var password = $("#password").val();
      if (subkey.unlock(password)) {
        callback(true);
      }
      else {
        alert("The password you entered is incorrect.");
      }
    });

    $("#cancel").click(function() {
      callback(false);
    });
  });
});
