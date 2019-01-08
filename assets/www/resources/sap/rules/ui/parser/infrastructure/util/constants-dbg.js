jQuery.sap.declare("sap.rules.ui.parser.infrastructure.util.constants");

sap.rules.ui.parser.infrastructure.util.constants = sap.rules.ui.parser.infrastructure.util.constants|| {}; 
sap.rules.ui.parser.infrastructure.util.constants.lib = (function() {

	var consts = {};
	 
		 	
	/**************************************************************
	 *  General 
	 **************************************************************/
	consts.CONDITION_DATA_TYPE = "Condition";
	consts.CONDITION_LENGTH = "5000";
	
	consts.DELTA_TYPE_OP = {
			CREATE : "CREATE",
			UPDATE : "UPDATE",
			DELETE : "DELETE"
	};
	
	/*******************************************************************************
	 * SQL
	 ******************************************************************************/
	consts.SQL_TYPES = {
		CHAR : "CHAR",
		NVARCHAR : "NVARCHAR",
		VARCHAR : "VARCHAR",
		ALPHANUM : "ALPHANUM",
		SHORTTEXT : "SHORTTEXT",
	
		DATE : "DATE",
		TIME : "TIME",
		
		TIMESTAMP : "TIMESTAMP",
		LONGDATE : "LONGDATE",
		SECONDDATE : "SECONDDATE",
	
		INTEGER : "INTEGER",
		BIGINT : "BIGINT",
		DECIMAL : "DECIMAL",
		SMALLDECIMAL : "SMALLDECIMAL",
		REAL : "REAL",
		DOUBLE : "DOUBLE",
		SMALLINT : "SMALLINT",
		TINYINT : "TINYINT"
	};
	
	/**************************************************************
	 *  Json Path  
	 **************************************************************/
	consts.JSON_PATH_ROOT = "$";
	
	
	return consts;
}());