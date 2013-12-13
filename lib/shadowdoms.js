var forbiddenTags = Set([
  "SCRIPT", "STYLE", "LINK", "A"
]);

function isForbidden(el) {
  return forbiddenTags.has(el.tagName);
}

function onReady(win, fn) {
  // Because DOMContentLoaded didn't work...
  function cb() {
    if (win.document.readyState === "loaded" || win.document.readyState === "complete") {
      fn();
    } else {
      win.setTimeout(cb, 10);
    }
  }
  win.setTimeout(cb, 10);
}

function shadowDOMs(slaveWindow, masterDocument) {
  masterDocument.documentElement.innerHTML = "<html><body></body></html>";

  var nodeMap;
  function handleNode(slaveNodeMutated, masterNode) {
    // After a mismatch is found, remove all master node's childNodes from mismatch onwards
    while(masterNode.lastChild) {
      masterNode.removeChild(masterNode.lastChild);
    }
    for (var k = 0; k < slaveNodeMutated.childNodes.length; k++) {
      var slaveChild = slaveNodeMutated.childNodes[k];
      var newMasterChild;
      if (!nodesMap.has(slaveChild)) {
        if (isForbidden(slaveChild)) {
          newMasterChild = masterDocument.createElement("meta");
        } else {
          newMasterChild = masterDocument.importNode(slaveChild, false);
        }
        nodesMap.set(slaveChild, newMasterChild);
      } else {
        newMasterChild = nodesMap.get(slaveChild);
        if (slaveChild.getAttribute && slaveChild.getAttribute("style") !== null) {
          newMasterChild.setAttribute("style", slaveChild.getAttribute("style"));
        }
      }
      masterNode.appendChild(newMasterChild);
    }

    for (var j = 0; j < slaveNodeMutated.childNodes.length; j++) {
      handleNode(slaveNodeMutated.childNodes[j], masterNode.childNodes[j]);
    }

  }

	var config = { attributes: true, childList: true, characterData: true, subtree:true };
	var observer = new slaveWindow.MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {

			var nodeAffected = mutation.target;
			var masterNodeAffected = nodesMap.get(nodeAffected);
			if (mutation.type === "attributes") {
				if (nodeAffected.getAttribute(mutation.attributeName) !== null) {
					masterNodeAffected.setAttribute("style", nodeAffected.getAttribute(mutation.attributeName));	
				}
			}
			handleNode(nodeAffected, masterNodeAffected);
			 

		}); // end of mutation forEach

	});

  slaveWindow.addEventListener("unload", function() {
    observer.disconnect();
  });

  onReady(slaveWindow, function() {
    var slaveDocument = slaveWindow.document;

    var target = slaveDocument.body;
    var mirror = masterDocument.body

    nodesMap = new Map();
    nodesMap.set(target, mirror);
    handleNode(target, mirror);
    // Handles node which has been mutated

    observer.observe(target, config);
  });
}

exports.shadowDOMs = shadowDOMs;
