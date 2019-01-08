/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// -------------------------------------------------------------------------------
// Helper class used for generic ODataModel related handling
// -------------------------------------------------------------------------------
sap.ui.define(["sap/ui/model/odata/v2/ODataModel"], function(ODataModelV2) {
	"use strict";

	/**
	 * Object used to for generic ODataModel related handling
	 * 
	 * @private
	 * @experimental This module is only for internal/experimental use!
	 */
	var ODataModelUtil = {
		/**
		 * Static function that takes care of ODataModel initialisation (all parameters are mandatory)
		 * 
		 * @param {Object} oSmartControl - the Smart control (e.g. SmartTable, SmartFilter)
		 * @param {function} fModelInitCallback - the callback function (will be triggered in the SmartControl scope)
		 * @private
		 */
		handleModelInit: function(oSmartControl, fModelInitCallback) {
			var bLoadMetadataAsync = false, oModel;
			if (oSmartControl && !oSmartControl._bMetaModelLoadAttached && fModelInitCallback) {
				oModel = oSmartControl.getModel();
				if (oModel) {
					// Check if ODataMetaModel was loaded
					// If not, delay the creation of table content/helpers until ODataMetaModel is loaded!
					// Do this only for async ODataModel
					if (oModel.getMetadata() && oModel instanceof sap.ui.model.odata.v2.ODataModel) {
						bLoadMetadataAsync = true; // always true for v2.ODataModel
					} else if (oModel.bLoadMetadataAsync || (oModel.getServiceMetadata && !oModel.getServiceMetadata())) {
						bLoadMetadataAsync = true; // assume async if bLoadMetadataAsync or if no service metadata has been loaded for the ODataModel
					}
					oSmartControl._bMetaModelLoadAttached = true;
					if (bLoadMetadataAsync && oModel.getMetaModel() && oModel.getMetaModel().loaded) {
						// wait for the ODataMetaModel loaded promise to be resolved
						oModel.getMetaModel().loaded().then(fModelInitCallback.bind(oSmartControl));
					} else {
						// Could be a non ODataModel or a synchronous ODataModel --> just create the necessary helpers
						fModelInitCallback.apply(oSmartControl);
					}
				}
			}
		}
	};

	return ODataModelUtil;

}, /* bExport= */true);
