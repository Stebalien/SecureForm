var {FramePage} = require("app/page");

module.exports = new FramePage(require, "display", function(data) {
  var {viewDecryption} = require("app/views/display");
  var {EncryptedMessage} = require("app/models/pgp");
  var {mimeDecode} = require("app/mime-parser");
  var msg = EncryptedMessage.fromText(data);
  var pk = msg.getDecryptionKeys()[0];
  pk.unlock('passpass');
  var data = mimeDecode(msg.decrypt(pk)[0].get('text'));
  console.log(JSON.stringify(data));
  $(document).ready(function() {
    var iframe = window.document.createElement("iframe");
    window.document.body.appendChild(iframe);
    viewDecryption(iframe, data);
  });
});
