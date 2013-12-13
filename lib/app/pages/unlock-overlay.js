var {OverlayPage} = require("app/page");

// This function IS NOT A CLOSURE!
module.exports = new OverlayPage(require, "unlock", function(subkey, callback) {
  require_page("page/util/css").load("dialog");
  var _ = require('underscore');
  var key = subkey.get('masterKey');

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
