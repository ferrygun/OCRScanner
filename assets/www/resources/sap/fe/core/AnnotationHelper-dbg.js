/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

(function () {
	"use strict";

	/*
	 This class contains annotation helpers that might be used from several templates or controls
	 */

	jQuery.sap.declare("sap.fe.core.AnnotationHelper");

	sap.fe.core.AnnotationHelper = {
		/* this helper can be activated to debug template processing
		 debug: function (oContext) {
		 //debugger;
		 },
		 */

		/*
		 getUI5Type : function(oInterface, sEntitySet, sFilterItemPath){
		 var oMetaModel = oInterface.getInterface(0).getModel();
		 if (typeof sFilterItemPath === 'object'){
		 // we need to get the filterItem name via @sapui.name
		 sFilterItemPath = oMetaModel.getObject(oInterface.getInterface(1).getPath() + '@sapui.name');
		 }

		 return oMetaModel.getUI5Type("/" + sEntitySet + "/" + sFilterItemPath).getName();
		 },
		 */

		getLineItemPresentation: function (oParamModel) {
			var mParameter = oParamModel.getObject();
			var oMetaModel = mParameter.metaModel;
			var oModel = oParamModel.getModel();
			var oWorkingContext;
			if (oModel.getProperty("/workingContext")) {
				oWorkingContext = oModel.getProperty("/workingContext");
			} else {
				oWorkingContext = sap.fe.core.AnnotationHelper._getWorkingContext(oMetaModel, mParameter.entitySet, undefined);
				oModel.setProperty("/workingContext", oWorkingContext);
			}
			return oMetaModel.getMetaContext(oWorkingContext.lineItemPath);
		},

		getChartPresentation: function (oParamModel) {
			var mParameter = oParamModel.getObject();
			var oMetaModel = mParameter.metaModel;
			var oModel = oParamModel.getModel();
			var oWorkingContext;
			if (oModel.getProperty("/workingContext")) {
				oWorkingContext = oModel.getProperty("/workingContext");
			} else {
				oWorkingContext = sap.fe.core.AnnotationHelper._getWorkingContext(oMetaModel, mParameter.entitySet, undefined);
				oModel.setProperty("/workingContext", oWorkingContext);
			}
			return oMetaModel.getMetaContext(oWorkingContext.chartPath);
		},

		_getWorkingContext: function (oMetaModel, sEntitySet, sQualifier) {
			var sAnnotationPath,
				oWorkingContext = {},
				selectionPresentationVariant,
				presentationVariant,
				sEntitySetPath = '/' + sEntitySet;

			/* Find SelectionPresentationVariant */
			sAnnotationPath = sEntitySetPath + "/@com.sap.vocabularies.UI.v1.SelectionPresentationVariant" + (sQualifier ? "#" + sQualifier : "");
			oWorkingContext.selectionPresentationVariant = oMetaModel.getObject(sAnnotationPath);
			oWorkingContext.selectionPresentationVariantQualifier = sAnnotationPath.split("#")[1] || "";
			oWorkingContext.selectionPresentationVariantPath = sAnnotationPath;
			selectionPresentationVariant = oWorkingContext.selectionPresentationVariant;
			/* Find PresentationVariant */
			if (selectionPresentationVariant && selectionPresentationVariant.PresentationVariant) {
				if (selectionPresentationVariant.PresentationVariant.$Path) {
					//Path for PV is specified
					sAnnotationPath = sEntitySetPath + "/" + selectionPresentationVariant.PresentationVariant.$Path;
				} else {
					//PV is defined inline and NOT via path
					sAnnotationPath = sAnnotationPath + "/PresentationVariant";
				}
			} else {
				sAnnotationPath = sEntitySetPath + "/@com.sap.vocabularies.UI.v1.PresentationVariant" + (sQualifier ? "#" + sQualifier : "");
			}
			if (typeof sAnnotationPath === "string") {
				oWorkingContext.presentationVariant = oMetaModel.getObject(sAnnotationPath);
				oWorkingContext.presentationVariantPath = sAnnotationPath;
				oWorkingContext.presentationVariantQualifier = sAnnotationPath.split("#")[1] || "";
				presentationVariant = oWorkingContext.presentationVariant;
			}
			/* Determine LineItem and Chart via PV */
			if (presentationVariant && presentationVariant.Visualizations) {
				presentationVariant.Visualizations.forEach(function (visualization) {
					sAnnotationPath = sEntitySetPath + '/' + visualization.$AnnotationPath;
					if (visualization.$AnnotationPath.indexOf("com.sap.vocabularies.UI.v1.LineItem") > -1) {
						oWorkingContext.lineItem = oMetaModel.getObject(sAnnotationPath);
						oWorkingContext.lineItemPath = sAnnotationPath;
						oWorkingContext.lineItemQualifier = sAnnotationPath.split("#")[1] || "";
					}
					if (visualization.$AnnotationPath.indexOf("com.sap.vocabularies.UI.v1.Chart") > -1) {
						oWorkingContext.chart = oMetaModel.getObject(sAnnotationPath);
						oWorkingContext.chartPath = sAnnotationPath;
						oWorkingContext.chartQualifier = sAnnotationPath.split("#")[1] || "";
					}
				});
			}

			/* Fall back to defaults without qualifier */
			if (!oWorkingContext.lineItem) {
				sAnnotationPath = sEntitySetPath + "/@com.sap.vocabularies.UI.v1.LineItem";
				oWorkingContext.lineItem = oMetaModel.getObject(sAnnotationPath);
				oWorkingContext.lineItemPath = sAnnotationPath;
				oWorkingContext.lineItemQualifier = "";
			}
			if (!oWorkingContext.chart) {
				sAnnotationPath = sEntitySetPath + "/@com.sap.vocabularies.UI.v1.Chart";
				oWorkingContext.chart = oMetaModel.getObject(sAnnotationPath);
				oWorkingContext.chartPath = sAnnotationPath;
				oWorkingContext.chartQualifier = "";
			}
			return oWorkingContext;
		},

		hasNavigation: function (oParamModel) {
			/*
			 this is a very basic implementation, it just checks if for the entity set a entry default configuration
			 with an outbound is defined - this is currently the only situation in which we support navigation.
			 this coding needs to be enhanced in the future
			 */
			var oEntitySet = oParamModel.manifest["sap.fe"].entitySets[oParamModel.entitySet];

			return oEntitySet && oEntitySet.entry && oEntitySet.entry.default && oEntitySet.entry.default.outbound || false;

		},

		replaceSpecialCharsInId: function (sId) {
			if (sId.indexOf(" ") >= 0) {
				jQuery.sap.log.error("Annotation Helper: Spaces are not allowed in ID parts. Please check the annotations, probably something is wrong there.");
			}
			return sId.replace(/@/g, "").replace(/\//g, "::").replace(/#/g, "::");
		}
	};

	sap.fe.core.AnnotationHelper.getLineItemPresentation.requiresIContext = true;
	sap.fe.core.AnnotationHelper.getChartPresentation.requiresIContext = true;
	// sap.fe.core.AnnotationHelper.isRequiredInFilter.requiresIContext = true;

})();
