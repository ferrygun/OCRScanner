(function () {
    "use strict";
    /*global jQuery, sap */
    /*jslint nomen: true */
    jQuery.sap.require("sap.ushell.components.tiles.indicatorTileUtils.smartBusinessUtil");
    jQuery.sap.require("sap.ui.model.analytics.odata4analytics");
    sap.ui.getCore().loadLibrary("sap.suite.ui.commons");

    sap.ui.jsview("sap.ushell.components.tiles.indicatornumeric.NumericTile", {
        getControllerName: function () {
            return "sap.ushell.components.tiles.indicatornumeric.NumericTile";
        },
        createContent: function (oController) {
            //var preview = this.getViewData().chip.preview;
            var header = "Lorem ipsum";
            var subheader =  "Lorem ipsum";

            var titleObj = sap.ushell.components.tiles.indicatorTileUtils.util.getTileTitleSubtitle(this.getViewData().chip);
            if (titleObj.title && titleObj.subTitle){
                header = titleObj.title;
                subheader = titleObj.subTitle;
            }
            var oGenericTileData = {
                    subheader : subheader,
                    header : header,
                    footerNum : "",
                    footerComp : "",
                    scale: "",
                    unit: "",
                    value: "",
                    size:"Auto",
                    frameType:"OneByOne",
                    state: sap.m.LoadState.Loading,
                    valueColor:sap.m.ValueColor.Neutral,
                    indicator: sap.m.DeviationIndicator.None,
                    title : "",
                    footer : "",
                    description: ""
            };

            this.oNVConfContS = new sap.m.NumericContent({
                value : "{/value}",
                scale : "{/scale}",
                unit : "{/unit}",
                indicator : "{/indicator}",
                valueColor: "{/valueColor}",
                size : "{/size}",
                formatterValue : true,
                truncateValueTo : 5 ,
                nullifyValue : false
            });

            /*
             * @to be removed once suite.commons fix scaling this issue
             */

//            this.oNVConfContS.setScale = function(sText) {
//                if(!this.getFormatterValue()) {
//                    this.setProperty("scale", sText, true);
//                }
//                return this;
//            };
//            var oNVConfS = new sap.suite.ui.commons.TileContent({
//                unit : "{/unit}",
//                size : "{/size}",
//                footer : "{/footerNum}",
//                content: this.oNVConfContS
//            });
            this.oNVConfS = new sap.ushell.components.tiles.sbtilecontent({
                unit : "{/unit}",
                size : "{/size}",
                footer : "{/footerNum}",
                content: this.oNVConfContS
            });


//            this.oGenericTile = new sap.suite.ui.commons.GenericTile({
//                subheader : "{/subheader}",
//                frameType : "{/frameType}",
//                size : "{/size}",
//                header : "{/header}",
//                tileContent : [that.oNVConfS]
//            });

            this.oGenericTile = new sap.m.GenericTile({
                subheader : "{/subheader}",
                frameType : "{/frameType}",
                size : "{/size}",
                header : "{/header}",
                tileContent : [this.oNVConfS]
            });

            var oGenericTileModel = new sap.ui.model.json.JSONModel();
            oGenericTileModel.setData(oGenericTileData);
            this.oGenericTile.setModel(oGenericTileModel);

            return this.oGenericTile;
        }
    });
}());
