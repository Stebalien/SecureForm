var {FramePage} = require("app/page");

module.exports = new FramePage(require, "display", function(data) {
  require_page("page/util/css").load("display");

  var unlockOverlay = require("app/pages/unlock-overlay");
  var {viewDecryption} = require("app/views/display");
  var {EncryptedMessage} = require("app/models/pgp");
  var {mimeDecode} = require("app/mime-parser");
  var tabs = require("sdk/tabs");

  $(document).ready(function() {
    var decryptButton = $("<button>Decrypt</button>");
    var msg = EncryptedMessage.fromText(data);
    var pk = msg.getDecryptionKeys()[0];
    if (pk) {
      $(document.body).append(decryptButton);
      decryptButton.click(function() {
        var msg = EncryptedMessage.fromText(data);
        var pk = msg.getDecryptionKeys()[0];
        function cb() {
          var obj = mimeDecode(msg.decrypt(pk)[0].get('text'));
          var iframe = $("<iframe>");
          iframe.attr("sandbox", "");
          $(document.body).empty()
          $(document.body).append(iframe);

          iframe.on("load", function() {
            iframe.contents().ready(function() {
              viewDecryption(obj, iframe[0]);
            });
          });
        }
        if (pk.get("locked")) {
          var overlay = unlockOverlay.open(tabs.activeTab, pk, function(success) {
            if (success) {
              cb()
            }
            overlay.remove();
          });
        } else {
          cb();
        }
      });
    } else {
      var msg = $("<p>");
      $(document.body).append($("<p>Cannot decrypt. Key Unknown</p>"));
    }
  });
});
