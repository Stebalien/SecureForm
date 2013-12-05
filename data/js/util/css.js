var styleUtils = require('sdk/stylesheet/utils');
var data = require('sdk/self').data

exports.load = function(id) {
  styleUtils.loadSheet(window, data.url('css/'+id+".css"));
}


