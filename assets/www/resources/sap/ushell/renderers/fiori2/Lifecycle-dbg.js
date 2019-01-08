// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/*global jQuery, sap */
 /**
  * Handling of lifecycle events in fiori2 renderer.<br>
  * For each current relevant event - this module publishes the corresponding lifecycle event.<br><br>
  * On loading this module subscribes the handler lifecycleEventHandler to the relevant five current/old events, <br>
  * represented by the properties of oEventMap (i.e. rendererLoaded, componentCreated, etc...).<br>
  * lifecycleEventHandler uses oEventMap to get the name of the relevant lifecycle event<br>
  * and publishes it with the namespace "sap.ushell"
  */
sap.ui.define(function() {
	"use strict";

    var sLifecycleEventNamespace = "sap.ushell",
        sEventName,
        // Object that maps the current event name to an object that includes:
        // - The current event's namespace (i.e. oldNamesoace)
        // - The name of the corresponding lifecycle event that should be published with the namepsace "sap.ushell"
        oEventMap = {
            rendererLoaded : {
                oldNamespace : "sap.ushell.renderers.fiori2.Renderer",
                newEventName : "rendererLoaded"
            },
            componentCreated : {
                oldNamespace : "sap.ushell.components.container.ApplicationContainer",
                newEventName : "appComponentLoaded"
            },
            appOpened : {
                oldNamespace : "launchpad",
                newEventName : "appOpened"
            },
            appClosed : {
                oldNamespace : "launchpad",
                newEventName : "appClosed"
            },
            coreExtLoaded : {
                oldNamespace : "launchpad",
                newEventName : "coreResourcesFullyLoaded"
            }
        };

    function _publishEvent(sNamespace, sEventName, oData) {
        setTimeout(function () {
            sap.ui.getCore().getEventBus().publish(sLifecycleEventNamespace, sEventName, oData);
        }, 0);
    }

    /**
     * Handler for one the the relevant current/old events.
     * When this method is invoked it published the corresponding lifecycle event.
     * Uses oEventMap to get the name of the relevant lifecycle event and publishes it with the namespace "sap.ushell"
     */
    function lifecycleEventHandler(sNamespace, sEvent, oData) {
        var oMappedEvent = oEventMap[sEvent];

        if (oMappedEvent !== undefined) {
            _publishEvent(sLifecycleEventNamespace, oMappedEvent.newEventName, oData);
        }
    }

    // For each key in the map (i.e. current/old event name) subscribe to the event <oldNamespace>.<old event>
    // with the callback lifecycleEventHandler
    for (sEventName in oEventMap) {
        sap.ui.getCore().getEventBus().subscribe(
            oEventMap[sEventName].oldNamespace,
            sEventName,
            lifecycleEventHandler
        );
    }


}, /* bExport= */ false);
