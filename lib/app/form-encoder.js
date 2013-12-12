// TODO stuff I'm not doing for now
// make files read in parallel
// get rid of random newlines
// actually check if boundaries exist in the parts

var MULTIPART_FORM_TYPE = "Content-Type: multipart/form-data";
var MULTIPART_MIXED_TYPE = "Content-Type: multipart/mixed";
var PLAINTEXT_TYPE = "Content-Type: text/plain";

var INLINE_DISPOSITION = "Content-Disposition: inline";
var ATTACHMENT_DISPOSITION = "Content-Disposition: attachment";
var FORMDATA_DISPOSITION = "Content-Disposition: form-data";
var FILE_DISPOSITION = "Content-Disposition: file";

var BASE64_ENCODING = "Content-Transfer-Encoding: base64";
var UTF8_CHARSET = "charset=utf-8";

var submitButton = null;

function encodeWithPadding(myWin, mySubmit, callback) {
  var myDoc = myWin.document;
  var getData = function(encoded) {
    var encodedData = encoded; 
    // clone form
    var cloned = myDoc.cloneNode(true);
    setMaxSelections(cloned);
    var maxDoc = cloned;
    var getMaxData = function(max) {
      var maxData = max;
      var padLen = maxData.length - encodedData.length;
      encodedData += (Array(padLen).join(" "));
      callback(encodedData);
    }
    encodeSecuredDocument(myWin, maxDoc, mySubmit, getMaxData);
  }
  encodeSecuredDocument(myWin, myDoc, mySubmit, getData);
}

function setMaxSelections(doc) {
  var desc = getAllDescendants(doc.body, new Array());
  // only need for checkbox, radio, select 
  // check all checkboxes, select all multiple
  // pick longest radio, select one
  for (var i=0; i<desc.length; i++) {
    if (desc[i].nodeName === "INPUT" && desc[i].type === "checkbox") {
      desc[i].checked = true; 
    }
    else if (desc[i].nodeName === "INPUT" && desc[i].type === "radio") {
      var longest = 0;
      var elems = doc.getElementsByName(desc[i].name);
      for (var j=0; j<elems.length; j++) {
        if (elems[j].nodeName === "INPUT" && elems[j].type === "radio" &&
          elems[j].value.length > longest) {
          elems[j].checked = true;
          longest = elems[j].value.length;
        }
      }
    }
    else if (desc[i].nodeName === "SELECT") {
      var opts = desc[i].options;
      if (desc[i].multiple) {
        for (var j=0; j<opts.length; j++) {
          opts[j].selected = true; 
        }
      }
      else {
        var longest = 0;
        for (var j=0; j<opts.length; j++) {
          if (opts[j].value.length > longest) {
            opts[j].selected = true;
            longest = opts[j].value.length;
          }
        }
      }
    }
  }
}

function encodeSecuredDocument(myWin, myDoc, mySubmit, callback) {   
  var myOuterForm = myDoc.body;
  fileIndex = 0;
  var desc = getAllDescendants(myOuterForm, new Array());
  var files = new Array();
  fileContent = new Array();
  for (var i=0; i<desc.length; i++) {
    if (desc[i].nodeName === "INPUT" && desc[i].type === "file") {
      for (var j=0; j<desc[i].files.length; j++) {
        files.push(desc[i].files[j]);
      }
    }
  }
  
  function readFile(index) {
    if (index >= files.length) {
      var encoded = encodeInside(myWin, myOuterForm, mySubmit);
      callback(encoded);
      return;
    }

    var reader = new myWin.FileReader();  
    var file = files[index];
    reader.onload = function() {  
      // get file content  
      var content = reader.result; 
      file.data = content.split(",", 2)[1];
      readFile(index+1);
    }
    reader.readAsDataURL(file);
  }
  readFile(0); 
}

function encodeInside(myWin, myOuterForm, mySubmit) {
  var encoded = "";
  var boundary = generateBoundary();
  // header
  encoded += (MULTIPART_MIXED_TYPE + "; ");
  encoded += ("boundary=" + boundary + "\r\n\r\n"); 

  submitButton = mySubmit;
   
  var elem = myOuterForm.firstElementChild; 
  while (elem != null) {
    processed = process(myWin, elem, false, boundary);
    if (processed !== null) {
      encoded += ("--" + boundary + "\r\n");
      encoded += (processed + "\r\n");
    }
    elem = elem.nextElementSibling;
  }
  encoded += ("--" + boundary + "--\r\n");

  return encoded;
}

function getAllDescendants(elem, desc) {
  for (var i=0; i<elem.children.length; i++) {
    desc.push(elem.children[i]);
    getAllDescendants(elem.children[i], desc);
  }
  return desc;
}

function chunkData(str) {
  var newStr = "";
  var COL = 72;
  for (var i=0; i<str.length; i+=COL) {
    newStr += (str.substr(i, COL) + "\r\n");
  }
  return newStr;
}

function processForm(myWin, myForm) {
  var encoded = "";
  var boundary = generateBoundary();
  // header
  encoded += (MULTIPART_FORM_TYPE + "; ");
  encoded += ("boundary=" + boundary + "\r\n\r\n"); 

  var desc = new Array();
  desc = getAllDescendants(myForm, desc);
  // want all children recursively here
  for (var i=0; i<desc.length; i++) {
    processed = process(myWin, desc[i], true, boundary);
    if (processed !== null) {
      encoded += ("--" + boundary + "\r\n");
      encoded += (processed + "\r\n");
    }
  }

  encoded += ("--" + boundary + "--");
  return encoded;
}

function generateBoundary() {
  var BOUNDARY_LENGTH = 16; // must be between 1 and 70 characters
  var boundary = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'()+_,-./:=?";

  for (var i=0; i<BOUNDARY_LENGTH; i++)
    boundary += possible.charAt(Math.floor(Math.random() * possible.length));
  return boundary;
}

function process(myWin, elem, isForm, boundary) {
  // disabled form elements shouldn't be submitted
  // neither should form elements that don't have a name
  if (elem.disabled || !elem.name) {
    return null;
  }

  if (elem.nodeName === "INPUT") {
    if (elem.type === "text") {
      return processText(myWin, elem, isForm);
    }
    else if (elem.type === "password") {
      return processPassword(myWin, elem, isForm);
    }
    else if (elem.type === "radio") {
      return processRadio(myWin, elem, isForm);
    }
    else if (elem.type === "checkbox") {
      return processCheckbox(myWin, elem, isForm);
    }
    else if (elem.type === "file") {
      return processFile(myWin, elem, isForm, boundary);
    }
    else if (elem.type === "submit") {
      return processSubmit(myWin, elem, isForm);
    }
  }
  else if (elem.nodeName === "SELECT") {
    return processSelect(myWin, elem, isForm, boundary);
  }
  else if (elem.nodeName === "TEXTAREA") {
    return processTextarea(myWin, elem, isForm);
  }
  else if (elem.nodeName === "FORM") {
    return processForm(myWin, elem);
  }

  // nop if it's not an element we care about
  return null;
}

function processTextElem(myWin, elem, isForm) {
  part = "";
  part += (PLAINTEXT_TYPE + "; ");
  part += (UTF8_CHARSET + "\r\n")
  if (isForm) {
    part += (FORMDATA_DISPOSITION + '; name="' + elem.name + '"\r\n\r\n');
  }
  else {
    part += (INLINE_DISPOSITION + "\r\n\r\n");
  }
  part += (elem.value);
  return part;
}

function processTextarea(myWin, myTextarea, isForm) {
  return processTextElem(myWin, myTextarea, isForm);
}

function processSelect(myWin, mySelect, isForm, boundary) {
  part = "";
  somethingSelected = false;
  for (var i=0; i<mySelect.options.length; i++) {
    if (mySelect.options[i].selected) {
      // can't use processTextElem because of where the name is from
      if (somethingSelected) {
        part += ("\r\n--" + boundary + "\r\n");
      }
      part += (PLAINTEXT_TYPE + "; ");
      part += (UTF8_CHARSET + "\r\n")
      if (isForm) {
        part += (FORMDATA_DISPOSITION + '; name="' + mySelect.name + '"\r\n\r\n');
      }
      else {
        part += (INLINE_DISPOSITION + "\r\n\r\n");
      }
      part += (mySelect.options[i].value);
      somethingSelected = true;
    }
  }
  // should not be submitted if nothing is selected
  if (!somethingSelected) {
    return null;
  }
  return part;
}

function processText(myWin, myText, isForm) {
  return processTextElem(myWin, myText, isForm);
}

function processPassword(myWin, myPassword, isForm) {
  return processTextElem(myWin, myPassword, isForm);
}

function processRadio(myWin, myRadio, isForm) {
  // radio buttons that aren't selected aren't submitted
  if (!myRadio.checked) {
    return null;
  }
  return processTextElem(myWin, myRadio, isForm);
}

function processCheckbox(myWin, myCheckbox, isForm) {
  // checkboxes that aren't selected also aren't submitted
  if (!myCheckbox.checked) {
    return null;
  }
  return processTextElem(myWin, myCheckbox, isForm);
}

function processSubmit(myWin, mySubmit, isForm) {
  if (mySubmit !== submitButton) {
    return null; 
  }
  return processTextElem(mySubmit, isForm);
}

function processFile(myWin, myFile, isForm, outerBoundary) {
  part = "";
  fileReader = new myWin.FileReader();

  // if the user didn't upload a file, nothing gets submitted
  if (myFile.files.length === 0) {
    return null;
  }
  else if (isForm) {
    if (myFile.multiple) {
      var boundary = generateBoundary();
      part += (MULTIPART_MIXED_TYPE + "; ")
      part += ("boundary=" + boundary + "\r\n"); 
      part += (FORMDATA_DISPOSITION + '; name="' + myFile.name + '"\r\n\r\n');
       
      for (var i=0; i<myFile.files.length; i++) {
        part += ("--" + boundary + "\r\n");
        selectedFile = myFile.files[i];
        part += processOneFile(myWin, selectedFile, isForm, null);
      }
      part += ("--" + boundary + "--\r\n");
    }
    else {
      part += processOneFile(myWin, myFile.files[0], isForm, myFile.name);
    }
  }
  else {
    for (var i=0; i<myFile.files.length; i++) {
      if (i !== 0) {
        part += ("--" + outerBoundary + "\r\n");
      }
      selectedFile = myFile.files[i];
      part += processOneFile(myWin, selectedFile, isForm, null);
    }
  }
  return part;
}

function processOneFile(myWin, selectedFile, isForm, elemName) {
  part = "";
  part += "Content-Type: " + selectedFile.type + "\r\n";
  if (isForm) {
    if (elemName !== null) {
      part += (FILE_DISPOSITION + '; name="' + elemName + '"; filename="' + selectedFile.name + '"\r\n');
    }
    else {
      part += (FILE_DISPOSITION + '; filename="' + selectedFile.name + '"\r\n');
    }
  }
  else {
    part += (ATTACHMENT_DISPOSITION + '; filename="' + selectedFile.name + '"\r\n');
  }
  part += (BASE64_ENCODING + "\r\n\r\n");
  part += (chunkData(selectedFile.data));
  return part;
}

// exports.encode = encodeWithPadding;
exports.encode = function(myWin, mySubmit, callback) {
    return encodeSecuredDocument(myWin, myWin.document, mySubmit, callback);
};
