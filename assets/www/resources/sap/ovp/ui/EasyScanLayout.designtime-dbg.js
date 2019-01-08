/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2017 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/comp/navpopover/RTAHandler",
               "sap/ovp/ui/ComponentContainerDesigntimeMetadata"],
    function(RTAHandler, ComponentContainerDesigntimeMetadata) {
    "use strict";
    
    return {
        actions: {
            reveal: {
                changeType: "unhideControl"
            }
        },
        aggregations: {
            content : {
                domRef : ".sapUiComponentContainer",
                actions : {
                    move: "moveControls",
                    changeOnRelevantContainer: true
                },
                propagateMetadata: function (oElement) {
                	var sType = oElement.getMetadata().getName();
                	if (sType === "sap.ui.core.ComponentContainer") {
                		return ComponentContainerDesigntimeMetadata;
                	} else {
                		return {
                			actions: null
                		};
                	}
                },
                propagateRelevantContainer: false
            }
        },
        name: {
        	singular: sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("Card"),
            plural: sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("Cards")
        }
    };
}, false);
