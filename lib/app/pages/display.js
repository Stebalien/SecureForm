require("app/views/display.js");
var {FramePage} = require("app/page");

module.exports = new FramePage(require, "display", function(data) {
  var {EncryptedMessage} = require("app/models/pgp");
  var iframe = window.document.createElement("iframe");
  window.document.body.appendChild(iframe);
  var msg = EncryptedMessage.fromText(data);

  $(document).ready(function() {
    viewDecryption(iframe, msg);
  });
});
