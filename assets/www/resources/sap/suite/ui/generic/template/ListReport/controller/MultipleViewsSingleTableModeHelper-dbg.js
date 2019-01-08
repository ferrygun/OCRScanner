sap.ui.define(["jquery.sap.global", "sap/ui/base/Object"],
	function(jQuery, BaseObject) {
		"use strict";

		/*
		 * This class is a helper class for the generic class MultipleViewsHandler. More, precisely an instance of
		 * this class is created in the constructor of that class in case, that the single table mode of the multiple views feature
		 * has been switched on.
		 * The mode can be switched on and configured via the quickVariantSelection.variants section in the manifest.
		 * Note that, if the mode is switched on, it is realized either by a sap.m.SegmentedButton or by a sap.m.Select.
		 * The decision which control is used is taken while the view is templated. Thus, it is already available when the
		 * corresponding instance of this class is created.
		 * Note that the views are specified by different variants which all use the same SmartTable which is based on one entity set 
		 * In both cases the realizing control possesses items (instances of sap.ui.core.Item) which represent the different views. 
		 * The keys of these items corresponds to the keys used in the manifest for the corresponding views.
		 * During templating the configuration of the views has been inserted as customData into the corresponding items.
		 * Visually the items are displayed with a text which is derived from the information they display.
		 * Depending on the showCounts property in the manifest these texts are either fixed (in this case they are already set during templating) or enhanced by the counts for the different views.
		 * In the second case the counts have to be determined at the right point in time and the texts have to be Cd accordingly.
		 */

		// oState is used as a channel to transfer data with the controller. Properties oSmartTable and oIappStateHandler are used
		// oController is the controller of the enclosing ListReport
		// oTemplateUtils are the template utils as passed to the controller implementation
		// fnSetInitialKey a function to set the initially set key
		function getMethods(oState, oController, oTemplateUtils, fnSetInitialKey) {

			// Begin private instance methods

			// Functions for storing and restoring the state of the controls

			function getContentForIappState(sSelectedKey) {
				return {
					selectedKey: sSelectedKey
				};
			}

			function getSelectedKeyAndRestoreFromIappState(oGenericData) {
				if (oGenericData) {
					return oGenericData.selectedKey;
				}
			}

			// method to be called in onTableInit() of the smart table used to realize all the views (which is actually oState.oSmartTable)
			function fnInit(oEvent, setModelDataForItem) {
				var oImplementingControl = oController.byId("template::SegmentedButton") || oController.byId("template::VariantSelect");
				var aPossibleItems = oImplementingControl.getItems(); // retrieve items to transfer the custom data into the maps used in this class
				for (var i = 0; i < aPossibleItems.length; i++) {
					var oItem = aPossibleItems[i];
					var sKey = oItem.getKey();
					if (i === 0) { // initialize with the first item being selected
						fnSetInitialKey(sKey);
					}
					var oSelectionVariantFilters = oTemplateUtils.oCommonUtils.getSelectionVariantFilters(oState.oSmartTable, oItem);
					setModelDataForItem(sKey, oItem, oSelectionVariantFilters);
				}
			}

			// End private instance methods

			// public instance methods
			return {
				getContentForIappState: getContentForIappState,
				getSelectedKeyAndRestoreFromIappState: getSelectedKeyAndRestoreFromIappState,
				init: fnInit
			};
		}

		return BaseObject.extend("sap.suite.ui.generic.template.ListReport.controller.MultipleViewsSingleTableModeHelper", {
			constructor: function(oQuickVariantSelection, oState, oController, oTemplateUtils, fnSetInitialKey) {
				jQuery.extend(this, getMethods(oState, oController, oTemplateUtils, fnSetInitialKey));
			}
		});
	});