jQuery.sap.declare("sap.rules.ui.parser.resources.vocabulary.lib.utilsBase");

jQuery.sap.require("sap.rules.ui.parser.infrastructure.util.constants");
jQuery.sap.require("sap.rules.ui.parser.resources.vocabulary.lib.constantsBase");
jQuery.sap.require("sap.rules.ui.parser.infrastructure.errorHandling.hrfException");




sap.rules.ui.parser.resources.vocabulary.lib.utilsBase = sap.rules.ui.parser.resources.vocabulary.lib.utilsBase|| {}; 
sap.rules.ui.parser.resources.vocabulary.lib.utilsBase.lib = (function() {

	var utilConstants = sap.rules.ui.parser.infrastructure.util.constants.lib;
	var vocaConstants = sap.rules.ui.parser.resources.vocabulary.lib.constantsBase.lib;
	var hrfException = sap.rules.ui.parser.infrastructure.errorHandling.hrfException.lib;
	
	function utilsBaseLib() {
		//Constructor to enable usage of public method on the client side.
		//This mechanism was used in HRF to enable association to corresponding namespace in the client side.
	}

	
	
	utilsBaseLib.prototype.getHanaDataType = function(modelType) {
		var columnType;
	
		switch (modelType) {
			case vocaConstants.BusinessDataType.Number:
				columnType = utilConstants.SQL_TYPES.DECIMAL + '(32,6)';
			break;
			
			case vocaConstants.BusinessDataType.TimeSpan:
				columnType = utilConstants.SQL_TYPES.INTEGER;
			break;
	
			case vocaConstants.BusinessDataType.String:
				columnType = utilConstants.SQL_TYPES.NVARCHAR + "(5000)";
			break;
	
			case vocaConstants.BusinessDataType.Timestamp:
				columnType = utilConstants.SQL_TYPES.TIMESTAMP;
			break;
	
			case vocaConstants.BusinessDataType.Boolean:
				columnType = utilConstants.SQL_TYPES.TINYINT;
			break;
	
			case vocaConstants.BusinessDataType.Time:
				columnType = utilConstants.SQL_TYPES.TIME;
			break;
			
			case vocaConstants.BusinessDataType.Date:
				columnType = utilConstants.SQL_TYPES.DATE;
			break;
	
			default:
				throw new hrfException.HrfException ("getHanaDataType: Unsupported column type= '" + modelType + "'");
		} // End of Switch
	
		return columnType;
	};
	
	//***************************************************************************
	//***************************************************************************
	utilsBaseLib.prototype.getBusinessDataType = function(hanaType) {
		var columnType;
		var ucType = hanaType.toUpperCase();
		switch (ucType) {
			case utilConstants.SQL_TYPES.CHAR: 
			case utilConstants.SQL_TYPES.VARCHAR: 
			case utilConstants.SQL_TYPES.NVARCHAR:
			case utilConstants.SQL_TYPES.ALPHANUM:
			case utilConstants.SQL_TYPES.SHORTTEXT:
				columnType = vocaConstants.BusinessDataType.String;
			break;
			
			case utilConstants.SQL_TYPES.DATE:
				columnType = vocaConstants.BusinessDataType.Date;
			break;
			
			case utilConstants.SQL_TYPES.TIME:
				columnType = vocaConstants.BusinessDataType.Time;
			break;
			
			case utilConstants.SQL_TYPES.TINYINT:
			case utilConstants.SQL_TYPES.SMALLINT:
			case utilConstants.SQL_TYPES.INTEGER:
			case utilConstants.SQL_TYPES.BIGINT:
			case utilConstants.SQL_TYPES.SMALLDECIMAL:
			case utilConstants.SQL_TYPES.DECIMAL:
			case utilConstants.SQL_TYPES.REAL:
			case utilConstants.SQL_TYPES.DOUBLE:
				columnType = vocaConstants.BusinessDataType.Number;
			break;
			
			case utilConstants.SQL_TYPES.TIMESTAMP:
			case utilConstants.SQL_TYPES.SECONDDATE:
				columnType = vocaConstants.BusinessDataType.Timestamp;
			break;
			
			default:
				throw new hrfException.HrfException ("getBusinessDataType: Unsupported column type= '" + hanaType + "'");
		}
	
		return columnType;
	};
	
	
	//***************************************************************************
	//***************************************************************************
	utilsBaseLib.prototype.convertBooleanToTinyInt = function(booleanValue) {
		
		if (booleanValue === 'true' || booleanValue === true) {
			return '1';
		}
		
		return '0';
	};
	
	
	return {
		utilsBaseLib: utilsBaseLib
	}; 

}());

