exports.viewDecryption = function(jsonArray, iframe){
	var arrayConstructor = [].constructor;
	var arraycheck = function(object) {
		if (object.constructor === arrayConstructor) {
			return "array";
		} 
		else {
			return "jsonObject";
		}
	}
	var jsonToHtml = function(objectList) {
		for (i=0; i < objectList.length; i++){
			var object =objectList[i];
			// This checks the first level 
			var objectType = arraycheck(object);
			if(objectType === "jsonObject"){
				var jsonDisp = object["disposition"];
				if(jsonDisp==="inline"){
					var jsonHTML= iframe.contentDocument.createElement("p");
					jsonHTML.innerHTML = object["value"];
					iframe.contentDocument.body.appendChild(jsonHTML);
				} else {
					if(jsonDisp==="attachment"){
						var attachment = iframe.contentDocument.createElement("a");
						attachment.href = object["value"];
						attachment.innerHTML = object["filename"];
					}
				}
			} else if(objectType === "array"){
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
								td.innerHTML=jsonObject["name"];
							} else{
								td.innerHTML=jsonObject["value"];
							}
						}if(jsonDisp === "form-files"){
							if(y===0){
								td.innerHTML= jsonObject["name"];
							} else {
								var value = jsonObject["value"];
								for(files=0;files<value.length;files++){
									file = value[files];
									var li = iframe.contentDocument.createElement("li");
									td.appendChild(li);
									var a = iframe.contentDocument.createElement("a");
									a.href= file["value"];
									a.innerHTML = file["filename"];
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
				var adder = iframe.contentDocument.getElementById("addFiles");


			}
		}
	}
	jsonToHtml(jsonArray);
}
