// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
//define a root UIComponent which exposes the main view
sap.ui.define(['sap/ui/core/UIComponent'],
	function(UIComponent) {
	"use strict";

var Component = UIComponent.extend("sap.ushell.components.factsheet.Component", {
    oMainView : null,

    // use inline declaration instead of component.json to save 1 round trip
    metadata: {
        version : "1.52.4",
        library : "sap.ushell.components.factsheet",
        dependencies : {
            libs : [ "sap.m", "sap.ui.vbm", "sap.suite.ui.commons", "sap.ui.layout", "sap.viz" ],
            components : []
        }
    },

    createContent: function () {
        var oComponentData = this.getComponentData();
        // startup parameters are passed as a property bag as componentData.startupParameters
        var oStartupParameters = ( oComponentData && oComponentData.startupParameters) || {};
        // factsheet component needs 100% height otherwise it does not work
        this.oMainView = sap.ui.view({
            type: sap.ui.core.mvc.ViewType.JS,
            viewName:  "sap.ushell.components.factsheet.views.ThingViewer",
            viewData: oStartupParameters,
            height: "100%"
        }).addStyleClass("ThingViewer");

        return this.oMainView;
    },

    exit: function () {
        window.console.log("On Exit of factsheet Component.js called : this.getView().getId()" + this.getId());
    },

    // this event does not exist !?
    onExit: function () {
        window.console.log("On Exit of factsheet Component.js called : this.getView().getId()" + this.getId());
    }
});

jQuery.sap.setObject("factsheet.Component", Component);

	return Component;

});
