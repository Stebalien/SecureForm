function shadowDOMs(slaveDocument, masterDocument) {
	var handleNode = function(slaveNodeMutated, masterNode) {
		var length = slaveNodeMutated.childNodes.length;
		var minLength = Math.min(slaveNodeMutated.childNodes.length, masterNode.childNodes.length)
		var misMatchFoundAt = minLength;
		var misMatchFound = slaveNodeMutated.childNodes.length !== masterNode.childNodes.length;
		var removechildNodes = [];
		for (var i = 0; i < minLength; ++i) {
			var slaveChild = slaveNodeMutated.childNodes[i];
			var masterChild = masterNode.childNodes[i];
			// if the childNodes don't match, copy the rest of the childNodes and remove the remaining childNodes from master
			if (!nodesMap.has(slaveChild) || nodesMap.get(slaveChild) !== masterChild) {
				misMatchFoundAt = i;
				misMatchFound = true;
			}
		}
		// After a mismatch is found, remove all master node's childNodes from mismatch onwards
		if (misMatchFound && misMatchFoundAt < masterNode.childNodes.length) {
			var initialchildNodesLength = masterNode.childNodes.length;
			for (var i = initialchildNodesLength - 1; i >= misMatchFoundAt; --i) {
				var masterChild = masterNode.childNodes[i];
				masterNode.removeChild(masterChild);
			}	
		}
		
		// If there was a mismatch, add nodes from mismatch onwards from the slave to master
		for (var k=misMatchFoundAt; k < slaveNodeMutated.childNodes.length; ++k) {
			var slaveChild = slaveNodeMutated.childNodes[k];
			var newMasterChild;
			if (!nodesMap.has(slaveChild)) {
				newMasterChild = slaveChild.cloneNode(false);
				nodesMap.set(slaveChild, newMasterChild);
			}
			else {
				newMasterChild = nodesMap.get(slaveChild);
				if (slaveChild.getAttribute("style") !== null) {
					newMasterChild.setAttribute("style", slaveChild.getAttribute("style"));	
				}
			}
			masterNode.appendChild(newMasterChild);
		}
		var j = 0;
		while (j < length) {
			handleNode(slaveNodeMutated.childNodes[j], masterNode.childNodes[j]);
			j++;
		}

	}

	var target = slaveDocument.body;
	var mirror = masterDocument.body
	var nodesMap = new Map();
	nodesMap.set(target, mirror);
	handleNode(target, mirror);
	// Handles node which has been mutated

	var observer = new MutationObserver(function(mutations) {
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

	var config = { attributes: true, childList: true, characterData: true, subtree:true };

	observer.observe(target, config);	
}

exports.shadowDOMs = shadowDOMS;