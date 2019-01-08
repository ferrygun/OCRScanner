jQuery.sap.declare("sap.rules.ui.parser.businessLanguage.lib.valueHelpValidator");

jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.constants");
jQuery.sap.require("sap.rules.ui.parser.businessLanguage.lib.parseUtils");

sap.rules.ui.parser.businessLanguage.lib.valueHelpValidator = sap.rules.ui.parser.businessLanguage.lib.valueHelpValidator|| {}; 
sap.rules.ui.parser.businessLanguage.lib.valueHelpValidator.lib = (function() {
	
	var constantsLib = sap.rules.ui.parser.businessLanguage.lib.constants.lib;
	var parseUtils = sap.rules.ui.parser.businessLanguage.lib.parseUtils.lib;
	var parseUtilsLib = new parseUtils.parseUtilsLib();
	
	// This method checks if given ValueHelp already exists in Info array
	function getValueHelpIndexInInfoArray (id, infoCollection)
	{
		var i = 0;
		for (i = 0; i < infoCollection.length; ++i)
		{ // Go over info array
			if (infoCollection[i].id === id)
			{ // Already exists
				return i;
			}
		}
		return -1;
	}
	
	// This method returns core value, without quotes
	function getCoreValue (value, businessDataType)
	{
		if ( (businessDataType === constantsLib.TYPE_STRING) ||
			 (businessDataType === constantsLib.TYPE_DATE) ||
			 (businessDataType === constantsLib.TYPE_TIMESTAMP) ||
			 (businessDataType === constantsLib.TYPE_TIME) )
		{ // Remove the quotes where exist
			return value.slice(1, -1);
		}
		return value;
	}
	
	// This method adds an element for current Value Help
	function addValueHelpToInfoArray (token, infoCollection, modelManager)
	{
		var info = {};
		info.id = token.info.id;
		
		var valueHelpData = modelManager.vocaRTServ.getValueList (modelManager.vocabulary, token.info.id);
		
		// Get Value Help metadata from Vocabulary RTS
		if (valueHelpData.hasOwnProperty (constantsLib.propertiesEnum.metadata) &&
			valueHelpData.hasOwnProperty (constantsLib.propertiesEnum.businessType)	)
		{
			var metadata = valueHelpData[constantsLib.propertiesEnum.metadata];
			metadata.businessDataType = valueHelpData[constantsLib.propertiesEnum.businessType];
			info.metadata = metadata;
		}
		
		info.values = [];
		info.values.push (getCoreValue (token.token, info.metadata.businessDataType) );
		infoCollection.push (info);
	}
	
	// This method adds value to values array only if does not exist yet
	function addUniqueValueHelpValue (value, valuesArray)
	{
		var i = 0;
		for (i = 0; i < valuesArray.length; ++i)
		{
			if (value === valuesArray[i])
			{
				return;
			} // End of If
		} // End of For

		// Does not exist yet - add it
		valuesArray.push (value);
	}
	
	// This method executes the first stage of Value Help Validation - collecting Value Help Info from the expression  
	function collectValueHelpInfo (parser, expression, modelManager, responseObject)
	{
		var infoCollection = [];
		var indexInInfo = 0;
		
		// Get expression tokens
		var tokens = responseObject.tokens ||
						parseUtilsLib.buildTokenTypes(parser, expression, modelManager);

		var i = 0;
		for (i = 0; i < tokens.length; ++i)
		{ // Go over expression tokens
			if (tokens[i].tokenType === constantsLib.tokenTypesEnum.valueList)
			{ // If current token is of type valueList
				
				// Check if there is already such element in array
				indexInInfo = getValueHelpIndexInInfoArray (tokens[i].info.id,
															infoCollection);
				if (indexInInfo === -1)
				{ // No such element - add it
					addValueHelpToInfoArray (tokens[i], infoCollection, modelManager);
				}
				else
				{ // Such VH data already exists - add the value to it
					addUniqueValueHelpValue (
							getCoreValue (tokens[i].token,
										  infoCollection[indexInInfo].metadata.businessDataType),
							infoCollection[indexInInfo].values);
					
				} // End of Else
			}
		} // End of For
		
		if (infoCollection.length > 0)
		{ // At least one Value Help exists in expression
			// Hang the tag valueHelp with the data on the response object
			responseObject[constantsLib.propertiesEnum.valueHelp] = {};
			responseObject[constantsLib.propertiesEnum.
			               valueHelp][constantsLib.propertiesEnum.
			                          info] = infoCollection;
		}
	}
	
	// This method collects Value Help error 
	function findInvalidVHValueInExpression (value, valueHelpId, tokens, parser, expression, modelManager, responseObject)
	{
		if (tokens.length === 0)
		{ // If no tokens yet - we are in the first Value Help error
			tokens = parseUtilsLib.buildTokenTypes (parser, expression, modelManager);
		}
		
		// Get business data type of the Value Help
		var businessDataType = null;
		var valueHelpData = modelManager.vocaRTServ.getValueList (modelManager.vocabulary, valueHelpId);
		if (valueHelpData.hasOwnProperty (constantsLib.propertiesEnum.businessType)	)
		{
			businessDataType = valueHelpData[constantsLib.propertiesEnum.businessType];
		}
		
		var error_msg = {args : []};
		var parseResults = {};
		var i = 0;
		for (i = 0; i < tokens.length; ++i)
		{ // Go over expression tokens
			if ( (tokens[i].tokenType === constantsLib.tokenTypesEnum.valueList) &&
				 (tokens[i].info.id === valueHelpId) && 
				 (getCoreValue (tokens[i].token, businessDataType) === value) )
			{
				// Handle Error
				error_msg.key = "error_in_expression_invalid_value_from_external_list_message";
				error_msg.args[0] = getCoreValue (tokens[i].token, businessDataType); 
				modelManager.parseResult.cursorPosition = tokens[i].start;
				parseUtilsLib.handleError (error_msg.key, error_msg.args, modelManager);
				
				// Hang relevant fields on responseObject
				parseResults = modelManager.parseResult.getParseResults();
				responseObject.status = parseResults.status;
				responseObject.errorDetails = parseResults.errorDetails;
				responseObject.errorID = parseResults.errorID;
				responseObject.cursorPosition = parseResults.cursorPosition;
				
				return true; // Current invalid Value Help Value found in expression
			} // End of If
		} // End of For
		return false; // Current invalid Value Help Value not found in expression
	}
	
	// This method executes the second stage of Value Help Validation - validating VH values  
	function validateValueHelp (infoCollection, parser, expression, modelManager,
								responseObject)
	{
		var tokens = responseObject.tokens || []; 
		var value = "";
		var values = [];
		var vhErrorFound = false;
		var i = 0;
		for (i = 0; i < infoCollection.length; ++i)
		{ // Go over info array
			if (! infoCollection[i].hasOwnProperty (constantsLib.propertiesEnum.values) )
			{ // No values sent for this Value Help - skip 
				continue;
			}

		
			values = infoCollection[i][constantsLib.propertiesEnum.values];
			for (value in values)
			{ // Go over values map
				if(values.hasOwnProperty (value) )
				{
					if (!values[value])
					{ // Value is not valid - add the error
						vhErrorFound = 
							findInvalidVHValueInExpression (value, infoCollection[i][constantsLib.propertiesEnum.id], tokens, parser,
										   			        expression, modelManager, responseObject);
						if (vhErrorFound)
						{ // There is at least one VH error in this expression - return
							return;
						}
					}
				} // End of If
			}// End of For (values) 
		} // End of For (infoCollection) 
	}
	
	var handleExternalValueHelp = function(parser, expression, modelManager, responseObject)
	{
		if (modelManager.flags [constantsLib.propertiesEnum.valueHelp] &&
			modelManager.flags [constantsLib.propertiesEnum.valueHelp].
					hasOwnProperty (constantsLib.propertiesEnum.collectInfo) &&
					modelManager.flags [constantsLib.propertiesEnum.
					                    valueHelp][constantsLib.propertiesEnum.
					                               collectInfo] === true
			)
		{ // We are in the first stage - collecting Value Help info
			collectValueHelpInfo (parser, expression, modelManager, responseObject); 
		}
		if (modelManager.flags [constantsLib.propertiesEnum.valueHelp] &&
			modelManager.flags [constantsLib.propertiesEnum.valueHelp].
				hasOwnProperty (constantsLib.propertiesEnum.info)	
				)
		{ // We are in the second stage - validating Value Help values
			validateValueHelp (modelManager.flags [constantsLib.propertiesEnum.
			                                       valueHelp][constantsLib.propertiesEnum.
			                                                  info],
			                   parser, expression, modelManager,
			                                                  responseObject);
		}
	};
	
	return {
		"handleExternalValueHelp": handleExternalValueHelp,
		"getValueHelpIndexInInfoArray": getValueHelpIndexInInfoArray
	};
	
}());