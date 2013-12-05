var {HKPServer} = require("util/hkp");
var {Model} = require("lib/backbone");

exports.HKP = Model.extend({
  initialize: function() {
    this.hkpServer = new HKPServer();
  }
});
