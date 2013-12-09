var {HKPServer} = require("app/hkp");
var {Model} = require("backbone");

exports.HKP = Model.extend({
  initialize: function() {
    this.hkpServer = new HKPServer();
  }
});
