/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

// Provides control sap.ushell.ui.launchpad.LinkTileWrapper.
sap.ui.define(['sap/ui/core/Control',
               'sap/ushell/library',
               'sap/ushell/override'],
    function (Control, library, override) {
        "use strict";

        /**
         * Constructor for a new ui/launchpad/LinkTileWrapper.
         *
         * @param {string} [sId] id for the new control, generated automatically if no id is given
         * @param {object} [mSettings] initial settings for the new control
         *
         * @class
         * A link tile to be displayed in the tile container. This control acts as container for specialized tile implementations.
         * @extends sap.ui.core.Control
         *
         * @constructor
         * @public
         * @name sap.ushell.ui.launchpad.LinkTileWrapper
         * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
         */
        var LinkTileWrapper = Control.extend("sap.ushell.ui.launchpad.LinkTileWrapper", /** @lends sap.ushell.ui.launchpad.LinkTileWrapper.prototype */ { metadata : {

            library : "sap.ushell",
            properties : {

                /**
                 */
                uuid : {type : "string", group : "Misc", defaultValue : null},

                /**
                 */
                tileCatalogId : {type : "string", group : "Misc", defaultValue : null},

                /**
                 * Hyperlink target
                 */
                target : {type : "string", group : "Misc", defaultValue : null},

                /**
                 */
                visible : {type : "boolean", group : "Misc", defaultValue : true},

                /**
                 * Technical information about the tile which is logged when the tile is clicked
                 */
                debugInfo : {type : "string", group : "Misc", defaultValue : null},

                /**
                 */
                animationRendered : {type : "boolean", group : "Misc", defaultValue : false},

                /**
                 */
                isLocked : {type : "boolean", group : "Misc", defaultValue : false},

                /**
                 */
                tileActionModeActive : {type : "boolean", group : "Misc", defaultValue : false},

                /**
                 */
                ieHtml5DnD : {type : "boolean", group : "Misc", defaultValue : false}
            },
            aggregations : {

                /**
                 */
                tileViews : {type : "sap.ui.core.Control", multiple : true, singularName : "tileView"},

                /**
                 */
                footItems : {type : "sap.ui.core.Control", multiple : true, singularName : "footItem"}
            },
            events : {

                /**
                 */
                press : {},

                /**
                 */
                coverDivPress : {},

                /**
                 */
                afterRendering : {},

                /**
                 */
                showActions : {}
            }
        }});

        /*global jQuery, sap*/
        /**
         * @name sap.ushell.ui.launchpad.LinkTileWrapper
         *
         * @private
         */
        /*global jQuery, sap, window */
        /*jslint nomen: true*/

        LinkTileWrapper.prototype.ontap = function (event, ui) {
            // dump debug info when tile is clicked
            jQuery.sap.log.info(
                "Tile clicked:",
                this.getDebugInfo(),
                "sap.ushell.ui.launchpad.LinkTileWrapper"
            );

            // NOTE: for now, the on press animation is not used, as it caused too much
            // confusion
            return;
        };

        LinkTileWrapper.prototype.destroy = function (bSuppressInvalidate) {
            this.destroyTileViews();
            Control.prototype.destroy.call(this, bSuppressInvalidate);
        };

        LinkTileWrapper.prototype.addTileView = function (oObject, bSuppressInvalidate) {
            var AccessibilityCustomData = sap.ui.require('sap/ushell/ui/launchpad/AccessibilityCustomData');

            // Workaround for a problem in addAggregation. If a child is added to its current parent again,
            // it is actually removed from the aggregation. Prevent this by removing it from its parent first.
            oObject.setParent(null);
            // Remove tabindex from links and group-header actions
            // so that the focus will not be automatically set on the first link or group action when returning to the launchpad
            oObject.addCustomData(new AccessibilityCustomData({
                key: "tabindex",
                value: "-1",
                writeToDom: true
            }));
            sap.ui.base.ManagedObject.prototype.addAggregation.call(this, "tileViews", oObject, bSuppressInvalidate);
        };

        LinkTileWrapper.prototype.destroyTileViews = function () {
            // Don't delete the tileViews when destroying the aggregation. They are stored in the model and must be handled manually.
            if (this.mAggregations.tileViews) {
                this.mAggregations.tileViews.length = 0;
            }
        };

        LinkTileWrapper.prototype.onAfterRendering = function () {
            this.fireAfterRendering();
        };

        LinkTileWrapper.prototype._launchTileViaKeyboard = function (oEvent) {
            if (oEvent.target.tagName !== "BUTTON") {
                var oTileUIWrapper = this.getTileViews()[0],
                    bPressHandled = false,
                    oClickEvent;

                if (oTileUIWrapper.firePress) {

                    //Since firePress doesn't dispatch the event for sap.m.Link (due to UI5 bug), we'll use an alternate way to simulate the press.
                    //oTileUIWrapper.firePress({id: this.getId()});

                    //TODO: remove this once firePress in sap.m.Link bug is resolved.
                    oClickEvent = document.createEvent('MouseEvents');
                    oClickEvent.initEvent('click'/* event type */, false, true); // non-bubbling, cancelable
                    oTileUIWrapper.getDomRef().dispatchEvent(oClickEvent);

                    //If oTileUIWrapper is a View or a Component.
                } else {
                    while (oTileUIWrapper.getContent && !bPressHandled) {
                        //Limitation: since there's no way to know which of the views is the currently presented one, we assume it's the first one.
                        oTileUIWrapper = oTileUIWrapper.getContent()[0];
                        if (oTileUIWrapper.firePress) {
                            oTileUIWrapper.firePress({id: this.getId()});
                            bPressHandled = true;
                        }
                    }
                }
            }
        };

        LinkTileWrapper.prototype.onsapenter = function (oEvent) {
            this._launchTileViaKeyboard(oEvent);
        };

        LinkTileWrapper.prototype.onsapspace = function (oEvent) {
            this._launchTileViaKeyboard(oEvent);
        };

        LinkTileWrapper.prototype.onclick = function (oEvent) {
            if (this.getTileActionModeActive()) {
                //If we are in Edit Mode, we'd like to suppress links from launching.
                oEvent.preventDefault();
            } else {
                var oCurrentLink = this.getTileViews()[0].getContent ? oCurrentLink.getContent()[0] : this.getTileViews()[0];

                // Publish the link-click event with the relevant href value.
                // The href value is added to the event since the URL hash was not changed yet
                // and the subscriber to this event might need the new hash (e.g. UsageAnalytics)
                sap.ui.getCore().getEventBus().publish("launchpad", "dashboardTileLinkClick");
            }
        };

        LinkTileWrapper.prototype.setVisible = function (bVisible) {
            this.setProperty("visible", bVisible, true); // suppress rerendering
            return this.toggleStyleClass("sapUshellHidden", !bVisible);
        };

        LinkTileWrapper.prototype.setAnimationRendered = function (bVal) {
            this.setProperty('animationRendered', bVal, true); // suppress re-rendering
        };

        LinkTileWrapper.prototype._handleTileShadow = function (jqTile, args) {
            if (jqTile.length) {
                jqTile.unbind('mouseenter mouseleave');
                var updatedShadowColor,
                    tileBorderWidth = jqTile.css("border").split("px")[0],
                    oModel = this.getModel();
                //tile has border
                if (tileBorderWidth > 0) {
                    updatedShadowColor = jqTile.css("border-color");
                } else {
                    updatedShadowColor = this.getRgba();
                }

                jqTile.hover(
                    function () {
                        if (!oModel.getProperty('/tileActionModeActive')) {
                            var sOriginalTileShadow = jQuery(jqTile).css('box-shadow'),
                                sTitleShadowDimension = sOriginalTileShadow ? sOriginalTileShadow.split(') ')[1] : null,
                                sUpdatedTileShadow;

                            if (sTitleShadowDimension) {
                                sUpdatedTileShadow = sTitleShadowDimension + " " + updatedShadowColor;
                                jQuery(this).css('box-shadow', sUpdatedTileShadow);
                            }
                        }
                    },
                    function () {
                        jQuery(this).css('box-shadow', '');
                    }
                );
            }
        };

        LinkTileWrapper.prototype.setUuid = function (sUuid) {
            this.setProperty("uuid", sUuid, true); // suppress rerendering
            return this;
        };

        return LinkTileWrapper;
    });
