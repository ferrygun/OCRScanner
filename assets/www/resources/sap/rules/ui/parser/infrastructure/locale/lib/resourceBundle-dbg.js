jQuery.sap.declare("sap.rules.ui.parser.infrastructure.locale.lib.resourceBundle");

jQuery.sap.require("sap.rules.ui.parser.infrastructure.locale.lib.resourceBundleContext");
 
 
sap.rules.ui.parser.infrastructure.locale.lib.resourceBundle = sap.rules.ui.parser.infrastructure.locale.lib.resourceBundle|| {}; 
sap.rules.ui.parser.infrastructure.locale.lib.resourceBundle.lib = (function () {
	var instance = null;
	// Singletone
	function ResourceBundle(){
		var ResourceBundleContext = sap.rules.ui.parser.infrastructure.locale.lib.resourceBundleContext.lib;
		return {
			getString : function(messageKey, bindArray, fileEnum){
				var str = ResourceBundleContext.getString(messageKey, bindArray, fileEnum);
				return str;
			}
		};
	}
	
	return {
		getInstance : function() {
			if (!instance) {
				instance = new ResourceBundle();
				instance.constructor = null;
			}
			return instance;
		}
	};
}());
	