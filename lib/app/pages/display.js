var {Page} = require("app/page");

module.exports = new Page(require, "display", function(data) {
  var {EncryptedMessage} = require("app/models/pgp");
});
