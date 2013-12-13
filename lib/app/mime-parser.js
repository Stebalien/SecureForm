// https://github.com/andris9/mimelib/blob/master/lib/mimelib.js

var BOUNDARY_HEADER = "boundary=";
var CONTENT_TYPE = "Content-Type:";
var CONTENT_DISPOSITION = "Content-Disposition";
var INLINE = "inline";
var ATTACHMENT = "attachment";
var FORMDATA = "form-data";
var FORMFILES = "form-files";
var FILE = "file";
var MULTIPART = "Content-Type: multipart"
var MULTIPART_ALT = "Content-Type: multipart/alternative"
var PLAINTEXT = "text/plain";

function mimeDecode(mimeStr) {
  var lines = mimeStr.split("\r\n");
  var processed = processMultipart(lines);  
  formatResult(processed);
  console.log(processed);
  return processed;
}

function formatResult(a) {
  for (var i=0; i<a.length; i++) {
    if (Array.isArray(a[i])) {
      formatResult(a[i]);
      console.log(a[i]);
    }
    else if (a[i]["disposition"] === FILE) {
      var obj = {};
      obj["disposition"] = "form-files";
      obj["name"] = a[i]["name"];
      var valueArray = new Array();
      var value ={}; 
      value["filename"] = a[i]["filename"];
      value["type"] = a[i]["type"];
      value["value"] = a[i]["value"];
      valueArray.push(value);
      obj["value"] = valueArray; 
      a[i] = obj;
    }
  }
}

exports.mimeDecode = mimeDecode;

function processMultipart(part) {
  var obj;
  var result = new Array();
  var foundFirstPart = false;
  var foundEnd = false;
  var boundary = null;
  var i = 0;
  while (i < part.length) {
    var line = part[i].trim();
    if (!foundFirstPart) {
      while (i+1 < part.length && !part[i+1].length === 0 && part[i+1][0] === " ") {
        line += (" " + part[i+1].trim());
        i++;
      }
      if (line.startsWith(MULTIPART)) {
        var lineParts = parseHeaderLine(line);
        if (lineParts["boundary"]) boundary = lineParts["boundary"];
      }
      else if (line.startsWith(CONTENT_DISPOSITION + ": " + FORMDATA)) {
        obj = {}; 
        var lineParts = parseHeaderLine(line);
        if (lineParts["name"]) obj["name"] = lineParts["name"];
        obj["disposition"] = FORMFILES;
        obj["value"] = result;
      }
      else if (boundary !== null && line === ("--" + boundary)) {
        foundFirstPart = true;
      }
      i++;
    }
    else {
      // ignore stuff after final boundary
      if (foundEnd) {
        break;
      }
      var next = part.indexOf("--" + boundary, i);
      if (next === -1) {
        next = part.indexOf("--" + boundary + "--", i);
        foundEnd = true;
      }

      var subpart = part.slice(i, next);
      if (line.startsWith(MULTIPART_ALT)) {
        var alt = processMultipart(subpart);
        for (var j=0; j<alt.length; j++) {
          if (alt[j].type == PLAINTEXT) {
            result.push(alt[j]);
            break;
          }
        }
      }
      else if (line.startsWith(MULTIPART)) {
        result.push(processMultipart(subpart));
      }
      else {
        result.push(processPart(subpart));
      }
      i = next + 1;
    }
  }
  if (obj) return obj;
  return result;
}

function processPart(part) {
  var result = {};
  var foundBody = false;
  var value = "";
  var i = 0;
  while (i < part.length) {
    var line = part[i].trim();
    if (!foundBody) {
      while (i+1 < part.length && !part[i+1].length === 0 && part[i+1][0] === " ") {
        line += (" " + part[i+1].trim());
        i++;
      }
      if (line.startsWith(CONTENT_TYPE)) {
        var type = line.split(";")[0].split(":")[1].trim();    
        result["type"] = type;
      }
      else if (line.startsWith(CONTENT_DISPOSITION)) {
        var disposition = line.split(";")[0].split(":")[1].trim().toLowerCase();
        result["disposition"] = disposition;
        var lineParts = parseHeaderLine(line);
        if (lineParts["name"]) result["name"] = lineParts["name"];
        if (lineParts["filename"]) result["filename"] = lineParts["filename"];
      }
      else if (line.length === 0) {
        foundBody = true;
      }
    }
    else {
      value += line;
      if ((result["disposition"] === INLINE || result["disposition"] === FORMDATA) && i !== part.length - 1) {
        value += "\n" 
      }
    }
    i++;
  }
  result["value"] = value;
  return result;
}

function parseHeaderLine(line){
  if(!line)
    return {};
  var re = /(?!\s|;|$)[^;"]*("(\\.|[^\\"])*"[^;"]*)*/g;
  var result = {}, parts = line.match(re), pos;
  for(var i=0, len = parts.length; i<len; i++){
    pos = parts[i].indexOf("=");
    if(pos<0){
      result[!i?"defaultValue":"i-"+i] = parts[i].trim();
    }else{
      var tmp = parts[i].substr(pos+1).trim();
      result[parts[i].substr(0,pos).trim().toLowerCase()] = stripQuotes(tmp);
    }
  }
  return result;
};

function stripQuotes(str) {
  var len = str.length;
  if (str[0] === '"' && str[len-1] === '"') {
    return str.substr(1, len-2).replace('\\"', '"');
  }
  return str;
}
