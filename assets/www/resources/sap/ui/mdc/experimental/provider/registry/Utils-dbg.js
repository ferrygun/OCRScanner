/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	"sap/ui/core/Control", "sap/m/library", "sap/ui/mdc/experimental/provider/model/ModelAdapter"
], function(Control, mLibrary, ModelAdapter) {
	"use strict";

	var InputType = mLibrary.InputType;

	return {
		convertToInputType: function(oAdapter) {
			switch (oAdapter.semantics) {
				case ModelAdapter.Semantics.password:
					return InputType.Password;
				case ModelAdapter.Semantics.eMail:
					return InputType.Email;
				case ModelAdapter.Semantics.phoneNumber:
					return InputType.Tel;
				case ModelAdapter.Semantics.url:
					return InputType.Url;
				default:
					var ui5Type = oAdapter.ui5Type;

					switch (ui5Type) {
						case "sap.ui.model.odata.type.Int16":
						case "sap.ui.model.odata.type.Int32":
						case "sap.ui.model.odata.type.Int64":
						case "sap.ui.model.odata.type.Decimal":
						case "sap.ui.model.odata.type.Double":
							return InputType.Number;
						case "sap.ui.model.odata.type.TimeOfDay":
							return InputType.Time;
						case "sap.ui.model.odata.type.DateTime":
						case "sap.ui.model.odata.type.DateTimeBase":
							return InputType.DateTime;
						case "sap.ui.model.odata.type.DateTimeOffset":
						case "sap.ui.model.odata.type.Date":
							return InputType.Date;
						default:
							return InputType.Text;
					}
			}
		},

		getNameSpaceInfo: function(sClassName) {
			var oNameSpaceInfo = {};

			oNameSpaceInfo.className = sClassName;
			var aModule = sClassName.split(".");
			oNameSpaceInfo.localName = aModule.pop();
			oNameSpaceInfo.nameSpace = aModule.join(".");

			return oNameSpaceInfo;
		},

		className: function(xmlNode) {
			// localName for standard browsers, baseName for IE, nodeName in the absence of namespaces
			var localName = xmlNode.localName || xmlNode.baseName || xmlNode.nodeName;

			if (!localName) {
				return undefined;
			}

			return xmlNode.namespaceURI + "." + localName;
		}
	};

});
