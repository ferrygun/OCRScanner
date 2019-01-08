jQuery.sap.declare("sap.suite.ui.generic.template.lib.FlexEnabler");

/**
 * Temporary notepad control to enable UI5 flexibility in list report.
 */
sap.ui.core.Control.extend("sap.suite.ui.generic.template.lib.FlexEnabler", {
	metadata: {
		properties: {
			/**
			 * Specifies whether the SAPUI5 flexibility features should be switched on.
			 */
			flexEnabled: {
				type: "boolean",
				group: "Misc",
				defaultValue: true
			}
		}
	},
	renderer: function(oRm, oControl) {
		"use strict";
	}
});
