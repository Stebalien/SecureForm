var {Cc, Ci} = require("chrome");
var CryptoUtils = Cc["@mozilla.org/security/random-generator;1"].createInstance(Ci.nsIRandomGenerator);
exports.generateRandomBytes = CryptoUtils.generateRandomBytes;
