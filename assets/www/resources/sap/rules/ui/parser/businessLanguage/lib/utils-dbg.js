jQuery.sap.declare("sap.rules.ui.parser.businessLanguage.lib.utils");



sap.rules.ui.parser.businessLanguage.lib.utils = sap.rules.ui.parser.businessLanguage.lib.utils|| {}; 
sap.rules.ui.parser.businessLanguage.lib.utils.lib = (function(){
	function utilsLib(){
		
	}
	utilsLib.prototype.getFixedParamName = function (str) {
	    var retVal = null;
	    retVal = str.replace(/^:/, "");
	    return retVal;
	};
	utilsLib.prototype.isEmptyArray = function (array) {
	    if (array.length === undefined || array.length === null || array.length === 0) {
	        return true;
	    }
	    return false;
	};
	utilsLib.prototype.isInArray = function (value, array) {
	    return array.indexOf(value) > -1 ? true : false;
	};
	utilsLib.prototype.removeInvertedCommas = function (str) {
	    var retVal = null;
	    retVal = str.replace(/(^")|("$)/g, '');
	    //$.trace("removeInvertedCommas - " + str + " with no inverted commas : " + retVal);
	    return retVal;
	};
	utilsLib.prototype.removeSingleQuotes = function (str) {
	    var retVal = null;
	    retVal = str.replace(/(^')|('$)/g, '');
	    return retVal;
	};
	utilsLib.prototype.removeDuplicate = function (a) {
	    var temp = {};
	    var i = 0;
	    for (i = 0; i < a.length; i++) {
	        temp[a[i]] = true;
	    }
	    var r = [];
	    var k = null;
	    for (k in temp) {
	        if (temp.hasOwnProperty(k)) {
	            r.push(k);
	        }
	    }

	    return r;
	};
	utilsLib.prototype.removeDupplicateByName = function(a) {
	    var temp = {};
	    var i = 0;
	    for (i = 0; i < a.length; i++) {
	        temp[a[i].name] = a[i];
	    }
	    var r = [];
	    var k = null;
	    for (k in temp) {
	        if (temp.hasOwnProperty(k)) {
	            r.push(temp[k]);
	        }
	    }

	    return r;
	};
	///****************************************************************
	// * Closure to add properties to objects
	// * Input - object to add, name of property, the value
	// ****************************************************************/
	utilsLib.prototype.addProperty = function (obj, name, defaultVal) {
	    // The property itself is a local variable of this function

	    var n = this.capitaliseFirstLetter(name);

	    var prop = defaultVal;

	    obj["get" + n] = function () {
	        return prop;
	    };
	    /*
	     * obj["set" + n] = function(value) {
	     * prop = value;
	     * }
	     */
	};
	
	/**********************************************************************
	 * Add properties to an instance
	 * Input -
	 * instance - add the properties to
	 * arguments - input arguments
	 * propertiesArray - array of properties to add
	 **********************************************************************/
	utilsLib.prototype.addProperties = function (instance, argumentsArray, propertiesArray, defaulsArray) {
	    var i;
	    for (i = 0; i < propertiesArray.length; ++i) {
	        if (argumentsArray.hasOwnProperty(propertiesArray[i])) {
	            this.addProperty(instance, propertiesArray[i], argumentsArray[propertiesArray[i]]);
	        } else if (defaulsArray !== undefined && defaulsArray !== null) {
	            this.addProperty(instance, propertiesArray[i], defaulsArray[i]);	
	        }
	    }
	};
	
	///****************************************************************
	// * Change first character of string to capital letter
	// * Input - string
	// ****************************************************************/
	utilsLib.prototype.capitaliseFirstLetter = function (string) {
	    var retVal = null;
	    if (string !== undefined && string !== null) {
	        retVal = string[0].toUpperCase() + string.slice(1);
	    }
	    return retVal;
	};
	return utilsLib;
}());