jQuery.sap.declare("sap.rules.ui.parser.infrastructure.util.utilsBase");

jQuery.sap.require("sap.rules.ui.parser.infrastructure.util.constants");
 
sap.rules.ui.parser.infrastructure.util.utilsBase = sap.rules.ui.parser.infrastructure.util.utilsBase|| {}; 
sap.rules.ui.parser.infrastructure.util.utilsBase.lib = (function() { 
 
	var utilConstantsLib = sap.rules.ui.parser.infrastructure.util.constants.lib;
	
	function utilsBaseLib() {
		//Constructor to enable usage of public method on the client side.
		//This mechanism was used in HRF to enable association to corresponding namespace in the client side.
	}
	
	utilsBaseLib.prototype.buildJsonPath = function(prefix, property, propertyIndex){
		var path = '';
		
		//adding prefix
		if(prefix === null || prefix === undefined){
			path += utilConstantsLib.JSON_PATH_ROOT;
		}
		else{
			path += prefix;
		}
		
		//adding additional property
		path += '.' + property;
		
		//adding property index in case property is a collection
		if(propertyIndex !== null && 
		   propertyIndex !== undefined && 
		   propertyIndex >= 0){
			path += '[' + propertyIndex + ']';
		}
		
		return path;
	};
	
	utilsBaseLib.prototype.setJsonValueAccordingPath = function (jsonObj, jsonPath, propToAddName, objToAdd){
		var pathArray = jsonPath.replace(/\[/g, '.').replace(/\]/g, '').split('.');
		var i, jsonIndex;
		var currObj = jsonObj;
		
		for(i = 1; i < pathArray.length; i++){ //starting after $
			jsonIndex = parseInt(pathArray[i], 10);
			
			if(jsonIndex >= 0){ //A number
				currObj = currObj[jsonIndex];
			}
			else{ //A property
				currObj = currObj[pathArray[i]];
			}
		}
		
		if(currObj){
			currObj[propToAddName] = objToAdd;
		}
	};
	
	// Creates 32-char UUID
	utilsBaseLib.prototype.createUUID = function() {
		var result, i, j;
		result = '';
		for (j = 0; j < 32; j++) {
			// SECURITY CODE SCAN:
			// Must use Math.random (), because In XS JavaScript there is no currently
			// solution for a robust cryptographic PRNG
			i = Math.floor(Math.random() * 16).toString(16);
			result = result + i;
		}
		return result;
	};
	

	utilsBaseLib.prototype.findObjectById = function (objectId, array) {
		var result = null;
		for (var i = 0; i < array.length; i++) { 
		  if (array[i].id === objectId) { 
		    result = array[i];
		    break;
		  } 
		}
		return result;
	};
	
	return {
		utilsBaseLib: utilsBaseLib
	}; 

	
}());