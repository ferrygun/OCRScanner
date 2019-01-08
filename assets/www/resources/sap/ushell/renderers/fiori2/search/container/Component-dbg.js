// iteration 0 ok

sap.ui.define(['sap/ui/core/UIComponent'], function(UIComponent) {
    "use strict";

    // new Component
    return UIComponent.extend("sap.ushell.renderers.fiori2.search.container.Component", {

        metadata: {

            version: "1.52.4",

            library: "sap.ushell.renderers.fiori2.search.container",

            includes: [],

            dependencies: {
                libs: ["sap.m"],
                components: []
            },

            config: {
                title: sap.ushell.resources.i18n.getText("searchAppTitle"),
                compactContentDensity: true,
                cozyContentDensity: true
            }
        },

        createContent: function() {
            return sap.ui.view({
                id: "searchContainerApp",
                viewName: "sap.ushell.renderers.fiori2.search.container.App",
                type: sap.ui.core.mvc.ViewType.JS
            });
        }
    });
});
