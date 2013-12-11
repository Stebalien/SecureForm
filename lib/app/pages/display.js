require("app/views/display.js");
var {Page} = require("app/page");

module.exports = new Page(require, "display", function(data) {
  var {EncryptedMessage} = require("app/models/pgp");
  var iframe = window.document.createElement("iframe");
  window.document.appendChild(iframe);
  var empty = [];
  viewDecryption(iframe, empty);
});
