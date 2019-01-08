/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

 sap.ui.define(
     ["jquery.sap.global", "../Extension"],
     function (jQuery, SapUiVtmExtension) {

        "use strict";

        /**
         * Constructor for a new InitialViewExtension.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @name sap.ui.vtm.extensions.InitialViewExtension
         * @public
         * @class
         * Adds a behavior that zooms to all (or a specific view) after the first viewable has loaded successfully.
         * @author SAP SE
         * @version 1.52.0
         * @constructor
         * @param {string?} sId id for the new {@link sap.ui.vtm.extensions.InitialViewExtension} instance.
         * @param {object?} mSettings Object with initial property values, aggregated objects etc. for the new {@link sap.ui.vtm.extensions.InitialViewExtension} instance.
         * @extends sap.ui.vtm.Extension
         * @implements sap.ui.vtm.interfaces.IInitialViewExtension
         */
         var InitialViewExtension = SapUiVtmExtension.extend("sap.ui.vtm.extensions.InitialViewExtension", /** @lends sap.ui.vtm.extensions.InitialViewExtension.prototype */ {
             metadata: {
                 interfaces: [
                     "sap.ui.vtm.interfaces.IInitialViewExtension"
                 ],
                 properties: {
                     /**
                      * Specifies a predefined view to use.
                      * If a specific view is not specified this extension will zoom to fit all geometry without changing the camera angle.
                      */
                     predefinedView: {
                         type: "sap.ui.vtm.PredefinedView"
                     }
                 }
             },

             constructor: function(sId, mSettings) {
                 SapUiVtmExtension.apply(this, arguments); // Force non-lazy construction
             },

            initialize: function(vtm) {
                var initialLoadOccurred = false;

                vtm.getScene().attachLoadCompleted(function(event) {
                    var panels = vtm.getPanels();
                    var loadSucceeded = event.getParameter("succeeded");

                    if (!this.getEnabled() || !loadSucceeded || initialLoadOccurred || !panels.length) {
                        return;
                    }

                    initialLoadOccurred = true;

                    var viewLinkingExtension = vtm.getExtensionByInterface("sap.ui.vtm.interfaces.IViewLinkingExtension");
                    var viewLinkingEnabled = viewLinkingExtension && viewLinkingExtension.getEnabled();
                    var predefinedView = this.getPredefinedView();
                    
                    var setView = function(panel) {
                        var viewport = panel.getViewport();
                        if (predefinedView) {
                            viewport.setPredefinedView(predefinedView);
                        } else {
                            viewport.zoomToAll(0);
                        }
                    };

                    if (viewLinkingEnabled) {
                        var panel = vtm.getActivePanel() || panels[0];
                        setView(panel);
                    } else {
                        panels.forEach(setView);
                    }
                }.bind(this));
            }
         });

         return InitialViewExtension;
     });