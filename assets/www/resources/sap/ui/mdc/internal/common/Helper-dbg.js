/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

(function () {
	"use strict";

	/*
	 This class contains annotation helpers that can be used by all control helpers
	 */

	jQuery.sap.declare("sap.ui.mdc.internal.common.Helper");

	sap.ui.mdc.internal.common.Helper = {

		isSemanticKey: function (oContext, oValue) {
			var sEntity = oContext.getPath().split('/')[1];
			var aSemanticKeys = oContext.getModel().getObject("/" + sEntity + "/@com.sap.vocabularies.Common.v1.SemanticKey");
			if (aSemanticKeys) {
				for (var i = 0; i < aSemanticKeys.length; i++) {
					if (aSemanticKeys[i].$PropertyPath === oValue.$Path) {
						return true;
					}
				}
			}
			return false;
		},

		replaceSpecialCharsInId: function (sId) {
			if (sId.indexOf(" ") >= 0) {
				jQuery.sap.log.error("Annotation Helper: Spaces are not allowed in ID parts. Please check the annotations, probably something is wrong there.");
			}
			return sId.replace(/@/g, "").replace(/\//g, "::").replace(/#/g, "::");
		},

		_getEntitySetPath: function (oModel, sPropertyPath) {
			var iLength;
			var sEntitySetPath = sPropertyPath.slice(0, sPropertyPath.indexOf("/", 1));
			if (oModel.getObject(sEntitySetPath + "/$kind") === "EntityContainer") {
				iLength = sEntitySetPath.length + 1;
				sEntitySetPath = sPropertyPath.slice(iLength, sPropertyPath.indexOf("/", iLength));
			}
			return sEntitySetPath;
		}
	};


	sap.ui.mdc.internal.common.Helper.isSemanticKey.requiresIContext = true;


})();
