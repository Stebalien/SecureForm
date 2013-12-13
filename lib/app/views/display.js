var _ = require("underscore");
function dataURI(object) {
  return 'data:'+object.type+';base64,'+object.value;
}

function viewDecryption(objectList, iframe) {
  _.each(objectList, function(object) {
    // This checks the first level 
    if ( _.isArray(object) ) {
      var tbl = iframe.contentDocument.createElement("table");
      tbl.setAttribute('border','1');
      var tblBody = iframe.contentDocument.createElement("tbody");
      _.each(object, function(item) {
        var jsonDisp = item["disposition"];
        var row = iframe.contentDocument.createElement("tr");
        var name = iframe.contentDocument.createElement("td");
        var value = iframe.contentDocument.createElement("td");
        row.appendChild(name);
        row.appendChild(value);

        name.textContent= item["name"];

        switch (item["disposition"]) {
          case "form-data":
            value.textContent=item["value"];
            break;
          case "form-files":
            _.each(item["value"], function(file) {
              var li = iframe.contentDocument.createElement("li");
              value.appendChild(li);
              var a = iframe.contentDocument.createElement("a");
              a.href = dataURI(file);
              a.textContent = file["filename"];
              a.download = file["filename"];
              li.appendChild(a);
            });
            break;
        }
        tblBody.appendChild(row);
      });
      tbl.appendChild(tblBody);
      iframe.contentDocument.body.appendChild(tbl);
    } else {
      var jsonDisp = object["disposition"];
      switch (object["disposition"]) {
        case "inline":
          var jsonHTML= iframe.contentDocument.createElement("p");
          jsonHTML.textContent = object["value"];
          iframe.contentDocument.body.appendChild(jsonHTML);
          break;
        case "attachment":
          var attachment = iframe.contentDocument.createElement("a");
          attachment.href = dataURI(object);
          attachment.textContent = object.filename;
          attachment.download = object.filename;
          iframe.contentDocument.body.appendChild(attachment);
          break;
      }
    }
  });
};

exports.viewDecryption = viewDecryption;
