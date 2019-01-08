sap.ui.define([], function() {
	"use strict";
	var P13nPanelFormatter = {

		showCount: function(iCountOfSelectedItems, iCountOfItems) {
			return sap.ui.getCore().getLibraryResourceBundle("sap.m").getText('COLUMNSPANEL_SELECT_ALL_WITH_COUNTER', [
				iCountOfSelectedItems, iCountOfItems
			]);
		},

		determineCount: function(aItems) {
			this._updateCounts();
			return P13nPanelFormatter.showCount(this.getCountOfSelectedItems(), this.getCountOfItems());
		},

		isTrue: function(oValue) {
			return !!oValue;
		},

		showDimMeasureType: function(oMItem) {
			if (oMItem.aggregationRole === "dimension") {
				return sap.ui.getCore().getLibraryResourceBundle("sap.m").getText('COLUMNSPANEL_TYPE_DIMENSION');
			}
			if (oMItem.aggregationRole === "measure") {
				return sap.ui.getCore().getLibraryResourceBundle("sap.m").getText('COLUMNSPANEL_TYPE_MEASURE');
			}
			return;
		},

		createChartRoleTypes: function(sId, oBindingContext) {
			var oAvailableRoleType = oBindingContext.getObject();
			return new sap.ui.core.Item({
				key: oAvailableRoleType.key,
				text: oAvailableRoleType.text
			});
		}
	};

	return P13nPanelFormatter;
}, /* bExport= */true);
