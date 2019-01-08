/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

/**
 * @namespace Provides validator functions for the personalization dialog
 * @name sap.ui.comp.personalization.Validator
 * @author SAP SE
 * @version 1.52.4
 * @private
 * @since 1.48.0
 */
sap.ui.define([
	'sap/m/library', 'sap/ui/core/MessageType'
], function(MLibrary, MessageType) {
	"use strict";
	var Validator = {

		/**
		 * Also if in case of the AnalyticalTable the inResult=true we have to show warning if the column is not visible.
		 */
		checkGroupAndColumns: function(sTableType, oSetting, oPayload, oColumnKey2ColumnMap, oPersistentDataTotal, aResult) {
			if (sTableType !== sap.ui.comp.personalization.TableType.AnalyticalTable || !oSetting.group || !oSetting.columns) {
				return Promise.resolve(aResult);
			}
			var oRB = sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp");
			for ( var sColumnKey in oColumnKey2ColumnMap) {
				var bColumnSelected = oSetting.columns.controller.isColumnSelected(oPayload.columns, oPersistentDataTotal.columns, sColumnKey);
				var bGroupSelected = oSetting.group.controller.isGroupSelected(oPayload.group, oPersistentDataTotal.group, sColumnKey);
				if (bGroupSelected && !bColumnSelected) {
					aResult.push({
						columnKey: sColumnKey,
						panelTypes: [
							sap.m.P13nPanelType.group, sap.m.P13nPanelType.columns
						],
						messageType: MessageType.Warning,
						messageText: oRB.getText("PERSODIALOG_MSG_GROUPING_NOT_POSSIBLE_DESCRIPTION")
					});
				}
			}
			return Promise.resolve(aResult);
		},

		checkSaveChanges: function(sTableType, oSetting, oPayload, aResult) {
			if (sTableType !== sap.ui.comp.personalization.TableType.SelectionWrapper || !oSetting.selection || !oSetting.selection.payload || !oPayload || !oPayload.selection) {
				return Promise.resolve(aResult);
			}
			var aMSelectionItems = oPayload.selection.selectionItems.map(function(oMItem) {
				return {
					columnKey: oMItem.columnKey,
					visible: oMItem.selected
				};
			});
			return oSetting.selection.payload.callbackSaveChanges(aMSelectionItems).then(function(bSaved) {
				if (bSaved) {
					return aResult;
				}
				aResult.push({
					panelTypes: [
						sap.m.P13nPanelType.selection
					],
					messageType: MessageType.Error,
					messageText: sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("PERSODIALOG_MSG_CHANGES_SAVE_FAILED")
				});
				return aResult;
			});
		}
	};
	return Validator;
}, /* bExport= */true);
