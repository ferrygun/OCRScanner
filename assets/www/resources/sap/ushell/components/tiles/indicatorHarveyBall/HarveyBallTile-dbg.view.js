sap.ui.define([
		'sap/ca/ui/model/format/NumberFormat',
		'sap/ui/model/analytics/odata4analytics',
		'sap/ushell/components/tiles/indicatorTileUtils/smartBusinessUtil'
	], function(NumberFormat, odata4analytics, smartBusinessUtil) {
	"use strict";

    /*global jQuery, sap */
    /*jslint nomen: true */
    sap.ui.getCore().loadLibrary("sap.suite.ui.commons");

    sap.ui.jsview("tiles.indicatorHarveyBall.HarveyBallTile", {
        getControllerName: function () {
            //return "tiles.indicatorHarveyBall.HarveyBallTile"; commented to prevent the tile from loading
        },
        createContent: function (oController) {
            var microChart = new sap.suite.ui.commons.HarveyBallMicroChart({
                total:"{/value}",
                size:"{/size}",
                totalLabel:"{/totalLabel}",
                items:[new sap.suite.ui.commons.HarveyBallMicroChartItem({
                           fraction:"{/fractionValue}",
                           fractionLabel:"{/fractionLabel}",
                           color: "{/color}"
                       })]
            });

            var tileContent = new sap.suite.ui.commons.TileContent({
                size : "{/size}",
                content: microChart
            });

            this.oTile = new sap.suite.ui.commons.GenericTile({
                subheader : "{/subheader}",
                frameType : "{/frameType}",
                size : "{/size}",
                header : "{/header}",
                tileContent : [tileContent]
            });
            //return this.oTile; commented to prevent the tile from loading
        }
    });


}, /* bExport= */ true);
