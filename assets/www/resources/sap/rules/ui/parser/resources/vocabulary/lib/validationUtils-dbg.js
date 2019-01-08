jQuery.sap.declare("sap.rules.ui.parser.resources.vocabulary.lib.validationUtils");

jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.parseUtils");


sap.rules.ui.parser.resources.vocabulary.lib.validationUtils = sap.rules.ui.parser.resources.vocabulary.lib.validationUtils|| {}; 
sap.rules.ui.parser.resources.vocabulary.lib.validationUtils.lib = (function() {
	
	var parseUtils = sap.rules.ui.parser.businessLanguage.lib.parseUtils.lib;
	var parseUtilsLib = new parseUtils.parseUtilsLib();
	
	//Constructor:
	function validationUtilsLib(){
		this.descMap = new Map();
		this.valueHelpBusinessDataTypeMap= new Map();
		this.vocaRulesArr = [];
	}
	
	
	/**
	 * The uniqueness is tested only among the same type of vocaElement (DOs/Atts/Assos) under the same parent.
	 */
	validationUtilsLib.prototype.isUniqueDesc = function(vocaElmnt, type, parentObjName){
		var key = type + '_' + parentObjName + '_' + vocaElmnt.description;
		var existingVocaElmnt = this.descMap.get(key); 
		
		//change the description of the previously added vocaElmnt (if exists) with the same description:
		if(existingVocaElmnt){
			existingVocaElmnt.description = existingVocaElmnt.name;
			
			return false;
		}
		this.descMap.set(key, vocaElmnt);
		return true;
	};
	
	
	validationUtilsLib.prototype.validateValueHelpBusinessDataType = function(ValueHelpId,BusinessDataType){
		var existingBusinessDataType = this.valueHelpBusinessDataTypeMap.get(ValueHelpId);
		if (existingBusinessDataType){
			if(BusinessDataType !== existingBusinessDataType){
				throw  "";//TODO:add error to response collector "Multiple attributes are mapped to value help <id> with non-matching business data types."
			} 
		}else{
			this.valueHelpBusinessDataTypeMap.set(ValueHelpId, BusinessDataType);
		}
	};
	
	
	validationUtilsLib.prototype.getValueHelpBusinessDataType = function (ValueHelpId){
		return  this.valueHelpBusinessDataTypeMap.get(ValueHelpId);
	};
	
	
	validationUtilsLib.prototype.containsReservedWord = function(desc){
		var status = false;
		var firstDescWrd;
		var rx = new RegExp('^[A-Za-z_]');
		
		if(desc){
			firstDescWrd = desc.split(" ")[0];
			//Filter out all descs that starts with non [A-Z/a-z] (or '_') char: 
			if(firstDescWrd.length > 0 && !rx.test(firstDescWrd.charAt(0))){
				status = true;
			}
			//Filter out all descs that contains ' and ":
			else if(desc.indexOf("'") > -1){
				status = true;
			}
			//Filter out all descs that starts with a reserved word:
			else if(parseUtilsLib.alfabetReservedWordsArr.indexOf(firstDescWrd.toUpperCase())!== -1){
				status = true;
			}
		}
		return status;
	};
	
	
	validationUtilsLib.prototype.removeRedundantSpaces = function(descStr){
		var arr = null;
		var newStr, i;
			
		if(descStr){
			//Replace the Tabs with space key
			newStr = descStr.replace("	", " ");    
			arr = newStr.split(" ");
			for(i = 0; i < arr.length;i){
				if(arr[i] === ""){
					//Remove the redundant white spaces
					arr.splice(i,1);  
					//Don't "i++" since the array was changed 
				}
				else {
					i++;
				}
			}
			//Reassemble the descStr
			descStr = arr.join(" ");
		}
		return descStr;
	};
	
	
	validationUtilsLib.prototype.validateDescription = function(vocaElmnt, type, parentObjName){
		var isValid = true;
		var descStr;
		
		//Remove Redundant white spaces:
		descStr = this.removeRedundantSpaces(vocaElmnt.description);
		//Check if the description exists:
		if(!descStr  || descStr.length === 0 || descStr === " "){
			isValid = false;
		}
		//Check if the description is not a reserver word:  
		else if(this.containsReservedWord(descStr)){
			isValid = false;
		}
		//Check if the description is unique:
		else if(!this.isUniqueDesc(vocaElmnt, type, parentObjName)){
			isValid = false;
		}
		//If the descStr is not valid use the ElementName as a fall back
		isValid ? vocaElmnt.description = descStr : vocaElmnt.description = vocaElmnt.name;
	};
	
	
	validationUtilsLib.prototype.isVocaRuleUnique = function(vocaRuleElmnt){
		var result = false;
		var key = vocaRuleElmnt.name + " " + vocaRuleElmnt.description;
		if(this.vocaRulesArr.indexOf(key) < 0){
			this.vocaRulesArr.push(key);
			result = true;
		}
		return result;
	};
	
	validationUtilsLib.prototype.deleteNonUniqueVocaRule = function(vocaRuleElmnt, convertedDataObjectsArr){
		var i = 0;
		for(i; convertedDataObjectsArr.length > i; i++){
			if(convertedDataObjectsArr[i].hasOwnProperty("resultDataObjectId") &&
					convertedDataObjectsArr[i].name === vocaRuleElmnt.name && 
					convertedDataObjectsArr[i].description === vocaRuleElmnt.description){
				convertedDataObjectsArr.splice(i,1);
				break;
			}
		}
	};
	
	return {
		validationUtilsLib : validationUtilsLib
		
	};

}());
