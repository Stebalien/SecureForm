function dataURI(object) {
  return 'data:'+object.type+';base64,'+object.value;
}

exports.viewDecryption = function(jsonArray, iframe){
	var jsonToHtml = function(objectList) {
		for (var i=0; i < objectList.length; i++){
			var object =objectList[i];
			// This checks the first level 
			if ( typeof(object) === "array" ) {
				var jsonObject = object[i];
				var jsonDisp = jsonObject["disposition"];
				var tbl = iframe.contentDocument.createElement("table");
				tbl.setAttribute('border','1');
				var tblBody = iframe.contentDocument.createElement("tbody");
				for (x=0; x<object.length; x++ ){
					var tr = iframe.contentDocument.createElement("tr");
					for(y=0; y<2; y++){
						var td = iframe.contentDocument.createElement("td");
						if(jsonDisp==="form-data"){
							if(y===0){
								td.textContent=jsonObject["name"];
							} else{
								td.textContent=jsonObject["value"];
							}
						}if(jsonDisp === "form-files"){
							if(y===0){
								td.textContent = jsonObject["name"];
							} else {
								var value = jsonObject["value"];
								for(var files=0;files<value.length;files++){
									var file = value[files];
									var li = iframe.contentDocument.createElement("li");
									td.appendChild(li);
									var a = iframe.contentDocument.createElement("a");
									a.href = dataURI(object);
									a.textContent = file["filename"];
                  a.download = file["filename"];
									li.appendChild(a);
								}
							}
						}
						tr.appendChild(td);
					}
					tblBody.appendChild(tr);
				}
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
		}
	}
	jsonToHtml(jsonArray);
}
