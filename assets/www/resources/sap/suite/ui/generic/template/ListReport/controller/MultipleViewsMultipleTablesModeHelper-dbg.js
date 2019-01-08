sap.ui.define(["jquery.sap.global", "sap/ui/base/Object"],
	function(jQuery, BaseObject) {
		"use strict";

		/*
		 * This class is a helper class for the generic class MultipleViewsHandler. More, precisely an instance of
		 * this class is created in the constructor of that class in case, that the multiple table mode of the multiple views feature
		 * has been switched on.
		 * The mode can be switched on and configured via the quickVariantSelectionX.variants section in the manifest.
		 * You can have either a SmartTable or a SmartChart per a tab.
		 * We check under the corresponding SelectionPresentationVariant/PresentationVariant/Vizualizations or PresentationVariant/Vizualizations the first entry in the collection.
		 *  If it is a UI.LineItem then a corresponding SmartTable will be generated. If it is a UI.Chart then a SmartChart is displayed.
		 */

		// oState is used as a channel to transfer data to the controller and back.
		// oController is the controller of the enclosing ListReport
		// oTemplateUtils are the template utils as passed to the controller implementation
		// fnSetInitialKey a function to set the initially set key
		function getMethods(oQuickVariantSelectionX, oState, oController, oTemplateUtils, fnSetInitialKey, mItemData) {

			var mDirtyMap = {};
			// Begin private instance methods

			function isTableDirty(oSmartTable) {
				return mDirtyMap[oSmartTable.getId()] || false;
			}

			function setTableDirty(oSmartTable, bDirty) {
				mDirtyMap[oSmartTable.getId()] = bDirty;
			}

			function setTablesToDirtyExcept(oSmartTable) {
				for (var i in mDirtyMap) {
					if (i !== oSmartTable.getId()) {
						mDirtyMap[i] = true;
					}
				}
			}

			function onDetailsActionPress(oEvent) {
				var oEventSource, oBindingContext;
				oEventSource = oEvent.getSource();
				oBindingContext = oEvent.getParameter("itemContexts") && oEvent.getParameter("itemContexts")[0];
				oTemplateUtils.oCommonEventHandlers.onListNavigate(oEventSource, oState, oBindingContext);
			}

			function onChartSelectData(oEvent) {
				var oChart, oSmartChart;
				oChart = oEvent.getSource();
				oSmartChart = oChart.getParent();
				oState.updateControlOnSelectionChange(oSmartChart);
			}

			function fnRegisterToChartEvents(oEvent) {
				var oChart, oSmartChart;
				oSmartChart = oEvent.getSource();
				oChart = oSmartChart.getChart();
				//attach to the selectData event of the sap.chart.Chart
				oChart.attachSelectData(onChartSelectData);
				oChart.attachDeselectData(onChartSelectData);
			}

			// Functions for storing and restoring the state of the controls
			function getContentForIappState(sSelectedKey) {
				var sKey, oTmpTable, oVariantsIds = {};
				for (sKey in mItemData) {
					oTmpTable = mItemData[sKey].implementingControl;
					oVariantsIds[oTmpTable.getId()] = oTmpTable.getCurrentVariantId() || "";
				}
				return {
					selectedTab: sSelectedKey,
					tableVariantIds: oVariantsIds
				};
			}

			function getSelectedKeyAndRestoreFromIappState(oGenericData){
				var j, oTmpTable, sVariantId;
				if (oGenericData) {
					if (oGenericData.tableVariantIds) {
						for (j in mItemData) {
							oTmpTable = mItemData[j].implementingControl;
							sVariantId = oGenericData.tableVariantIds[oTmpTable.getId()];
							if (sVariantId) {
								oTmpTable.setCurrentVariantId(sVariantId);
							}
						}
					}
					return oGenericData.selectedTab;
				}
			}

			// it is called per Table or Chart
			function fnInit(oEvent, setModelDataForItem) {
				var oControl, sId, sKey;
				oControl = oEvent.getSource();
				sId = oControl.getId();

				for (sKey in mItemData) {
					if (sId === mItemData[sKey].id) {
						var oSelectionVariantFilters = oTemplateUtils.oCommonUtils.getSelectionVariantFilters(oControl);
						setModelDataForItem(sKey, oControl, oSelectionVariantFilters);
					}
				}
				setTableDirty(oControl, false);
			}

			function onSelectedKeyChanged(sNewKey){
				oState.oSmartTable = mItemData[sNewKey].implementingControl;
			}

			// End private instance methods

			(function() { // constructor coding encapsulated in order to reduce scope of helper variables 
				var i, oCurrentControl, oIconTabBar, aTabs, oItem, sKey, oTmpTable, oItemData;

				oIconTabBar = oController.byId("template::IconTabBar");
				aTabs = oIconTabBar.getItems();

				for (i = 0; i < aTabs.length; i++) {
					oItem = aTabs[i];
					sKey = oItem.getKey();
					if (i === 0){ // initialize with the first item being selected
						fnSetInitialKey(sKey);
					}
					oTmpTable = oController.byId("listReport-" + sKey);
					if (!oState.oSmartTable) {
						oState.oSmartTable = oTmpTable;
					}
					oItemData = {
						id : oTmpTable.getId()
					};
					mItemData[sKey] = oItemData;
				}

				// Attach to “Search” event on SmartFilterBar ( Press on 'Go' button)
				oState.oSmartFilterbar.attachSearch(function(oEvent) {
					oCurrentControl = oState.oSmartTable;
					if (oTemplateUtils.oCommonUtils.isSmartChart(oCurrentControl)) {
						oCurrentControl.rebindChart(oEvent);
					} else if (oTemplateUtils.oCommonUtils.isSmartTable(oCurrentControl)) {
						oCurrentControl._reBindTable(oEvent);
					}
					setTablesToDirtyExcept(oState.oSmartTable);
					oState.oIappStateHandler.changeIappState(true, true);
				});
				if (oQuickVariantSelectionX.enableAutoBinding) {
					oState.oSmartFilterbar.search(); //trigger enableAutobinding without getting a cancelled batch request 
				}
			})();

			// public instance methods
			return {
				fnRegisterToChartEvents: fnRegisterToChartEvents,
				onDetailsActionPress: onDetailsActionPress,
				getContentForIappState: getContentForIappState,
				getSelectedKeyAndRestoreFromIappState: getSelectedKeyAndRestoreFromIappState,
				onSelectedKeyChanged: onSelectedKeyChanged,
				isTableDirty: isTableDirty,
				setTableDirty: setTableDirty,
				init: fnInit
			};
		}

		return BaseObject.extend("sap.suite.ui.generic.template.ListReport.controller.MultipleViewsMultipleTablesModeHelper", {
			constructor: function(oQuickVariantSelectionX, oState, oController, oTemplateUtils, fnSetInitialKey, mItemData) {
				jQuery.extend(this, getMethods(oQuickVariantSelectionX, oState, oController, oTemplateUtils, fnSetInitialKey, mItemData));
			}
		});
	});