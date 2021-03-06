var {OverlayPage} = require("app/page");

// This function IS NOT A CLOSURE!
module.exports = new OverlayPage(require, "keychooser", function(callback) {
  require_page("page/util/css").load("dialog");

  // Display a searchable list (autocomplete dropdown?) of public keys.
  // Let the user add keys to a list of keys.

  var {keyring, Uid} = require('app/models/pgp');
  var publicKeys = keyring.get('publicKeys');

  var {template} = require("app/templates");
  var tmpl = template("keychooser.html");
  var _ = require("underscore");
  $(document).ready(function() {
    var uids = publicKeys.map(function(key) {return key.get('uids').models});
    uids =  _.flatten(uids);
    var cidToUid = {};
    _.each(uids, function(uid) {cidToUid[uid.cid]=uid.get('uid')});
     
    document.body.innerHTML = tmpl({
      uids: cidToUid
    });

    $(".chosen-select").chosen();

    $("#submit").click(function(event) {
        var selected = $("#keychooser").val();
        if (!selected) {
          alert("Please select at least one key.");
        }
        else {
          var uids = _.map(selected, function(cid) {return Uid.find(cid);});
          var keys = _.map(uids, function(uid) {return uid.get('key');});
          callback(keys);
          window.close();
        }
    });

    $("#cancel").click(function(event) {
      callback();
      window.close();
    });
  });
});
