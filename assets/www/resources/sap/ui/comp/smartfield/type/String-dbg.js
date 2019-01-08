/*
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

/**
 * String data type that supports field-control.
 *
 * @name sap.ui.comp.smartfield.type.String
 * @author SAP SE
 * @version 1.52.4
 * @private
 * @since 1.28.0
 * @extends sap.ui.model.odata.type.String
 */
sap.ui.define(["sap/ui/model/odata/type/String" ], function(StringBase) {
	"use strict";

	var StringType = StringBase.extend("sap.ui.comp.smartfield.type.String", {
		constructor: function(oFormatOptions, oConstraints) {
			StringBase.apply(this, arguments);
			this.oFieldControl = null;
		}
	});

	StringType.prototype.parseValue = function(sValue, sSourceType) {
		var oReturn = StringBase.prototype.parseValue.apply(this, arguments);

		if (typeof this.oFieldControl === "function") {
			this.oFieldControl(sValue, sSourceType);
		}

		return oReturn;
	};

	StringType.prototype.getName = function() {
		return "sap.ui.comp.smartfield.type.String";
	};

	return StringType;
});
