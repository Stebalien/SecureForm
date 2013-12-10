var attachTo = require("sdk/content/mod").attachTo;
var style = require('sdk/stylesheet/style').Style({ 
  source: 'encrypted { -moz-binding: url('+require('sdk/self').data.url('xbl/custom-elements.xbl')+'#encrypted); }',
});
var displayPage = require("app/pages/display");

require('sdk-extra/page-load').on('load', function(doc) {
  doc.addEventListener('-encrypted-element-load', function(e) {
    var data = e.detail;
    var element = e.target;
    if (element.tagName !== "ENCRYPTED") return;

    var iframe = doc.getAnonymousNodes(element)[0];
    iframe.contentWindow.location.href = displayPage.urlWithArgs(data);
  });

  // Attach style.
  attachTo(style, doc.defaultView);
});
