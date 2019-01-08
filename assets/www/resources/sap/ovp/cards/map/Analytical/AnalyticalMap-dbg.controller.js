(function() {
	"use strict";
	/*global sap, jQuery */

	sap.ui.controller("sap.ovp.cards.map.Analytical.AnalyticalMap", {

		onInit: function(evt) {
			var mapInstance = this.getView().byId("vbi");

			mapInstance.addEventDelegate({
						"onAfterRendering": function () {
							var allRegions = this.getAllRegionCodes(mapInstance);
							mapInstance.zoomToRegions(allRegions);

							var colorPaletteType = this.getCardPropertiesModel().getProperty("/colorpalette");
							if (colorPaletteType === "qualitative") {
								var items = mapInstance.getAggregation("regions");

								var colourPalette = ["sapUiChartPaletteQualitativeHue1", "sapUiChartPaletteQualitativeHue2", "sapUiChartPaletteQualitativeHue3", 
											   "sapUiChartPaletteQualitativeHue4", "sapUiChartPaletteQualitativeHue5", "sapUiChartPaletteQualitativeHue6",
											   "sapUiChartPaletteQualitativeHue7", "sapUiChartPaletteQualitativeHue8", "sapUiChartPaletteQualitativeHue9",
											   "sapUiChartPaletteQualitativeHue10", "sapUiChartPaletteQualitativeHue11"];

								items.forEach(function(item, index) {
									var colour = sap.ui.core.theming.Parameters.get(colourPalette[ index % colourPalette.length ]);
									item.setColor( colour );
								});
							}
						}
			}, this);
		},

		getAllRegionCodes: function(map) {
			var regions = [];

			map.getAggregation("regions").forEach(function(item) {
				var code = item.mProperties.code;
				regions.push(code);
			});
			return regions;
		},

		regionClick: function (oEvent) {
            /*
             On region click of OVP Cards used as an API in other Applications
             */
                var aNavigationFields = this.getEntityNavigationEntries(oEvent.getSource().getBindingContext(), this.getCardPropertiesModel().getProperty("/annotationPath"));
                this.doNavigation(oEvent.getSource().getBindingContext(), aNavigationFields[0]);
        },

		onAfterRendering: function() {
		},

		onBeforeRendering: function() {
		}
	});
})();
