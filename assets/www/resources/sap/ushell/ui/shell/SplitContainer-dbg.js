/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */
/*global jQuery, sap, window*/
// Provides control sap.ushell.ui.shell.SplitContainer.
sap.ui.define(['jquery.sap.global', 'sap/ui/core/Control', 'sap/ui/core/theming/Parameters', 'sap/ushell/library', './ShellUtilities'],
    function (jQuery, Control, Parameters) {
        "use strict";

        /**
         * Constructor for a new SplitContainer.
         *
         * @param {string} [sId] id for the new control, generated automatically if no id is given
         * @param {object} [mSettings] initial settings for the new control
         *
         * @class
         * Provides a main content and a secondary content area
         * @extends sap.ui.core.Control
         *
         * @author SAP SE
         * @version 1.52.4
         *
         * @constructor
         * @private
         * @since 1.15.0
         * @experimental Since version 1.15.0.
         * API is not yet finished and might change completely
         * @alias sap.ushell.ui.shell.SplitContainer
         * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
         */
        var SplitContainer = Control.extend("sap.ushell.ui.shell.SplitContainer", /** @lends sap.ushell.ui.shell.SplitContainer.prototype */ { metadata : {

            library : "sap.ushell.ui.shell",
            properties : {
                /**
                 * Shows / Hides the secondary area.
                 */
                showSecondaryContent : {type : "boolean", group : "Appearance", defaultValue : null},
                /**
                 * The width if the secondary content. The height is always 100%.
                 */
                secondaryContentSize : {type : "sap.ui.core.CSSSize", group : "Appearance", defaultValue : '250px'},
                /**
                 * Do not use. Use secondaryContentSize instead.
                 * @deprecated Since version 1.22.
                 *
                 * Only available for backwards compatibility.
                 */
                secondaryContentWidth : {type : "sap.ui.core.CSSSize", group : "Appearance", defaultValue : '250px', deprecated: true},
                /**
                 * Whether to show the secondary content on the left ("Horizontal", default) or on the top ("Vertical").
                 * @since 1.22.0
                 */
                orientation : {type : "sap.ui.core.Orientation", group : "Appearance", defaultValue : sap.ui.core.Orientation.Horizontal}
            },
            defaultAggregation : "content",
            aggregations : {
                /**
                 * The content to appear in the main area.
                 */
                content : {type : "sap.ui.core.Control", multiple : true, singularName : "content"},
                /**
                 * The secondary content to appear in the secondary area.
                 */
                secondaryContent : {type : "sap.ui.core.Control", multiple : true, singularName : "secondaryContent"},
                /**
                 * The sub header to appear in the main area.
                 */
                subHeader : {type : "sap.ui.core.Control", multiple : true, singularName : "subHeader"}
            }
        }});

        (function (window) {
        ////////////////////////////////////////// Public Methods //////////////////////////////////////////

            SplitContainer.prototype.init = function () {
                this.bRtl  = sap.ui.getCore().getConfiguration().getRTL();

                this._paneRenderer = new sap.ushell.ui.shell.shell_ContentRenderer(this, this.getId() + "-panecntnt", "secondaryContent");
                this._subHeadersRenderer = new sap.ushell.ui.shell.shell_ContentRenderer(this, this.getId() + "-canvassubHeader", "subHeader");
                this._canvasRenderer = new sap.ushell.ui.shell.shell_ContentRenderer(this, this.getId() + "-canvasrootContent", "content");
                //this._bRootContent = true;
                // By default move the content when the secondaryContent is shown
                this._moveContent = true;
            };

            SplitContainer.prototype.exit = function () {
                this._paneRenderer.destroy();
                delete this._paneRenderer;
                this._canvasRenderer.destroy();
                delete this._canvasRenderer;
                this._subHeadersRenderer.destroy();
                delete this._subHeadersRenderer;

                delete this._contentContainer;
                delete this._secondaryContentContainer;
            };
        ////////////////////////////////////////// onEvent Methods /////////////////////////////////////////

            SplitContainer.prototype.onAfterRendering = function () {
                // Shortcuts to the main DOM containers
                this._contentContainer = this.$("canvas");
                this._secondaryContentContainer = this.$("pane");
                this._toolArea = this.getParent() && this.getParent().getToolArea && this.getParent().getToolArea() ? this.getParent().getToolArea() : {};
                this._shellLayout = this.getParent();
                this._applySecondaryContentSize();
            };

        ////////////////////////////////////////// Private Methods /////////////////////////////////////////
        /**
         * Applies the current status to the content areas (CSS left and width properties).
         *
         * @private
         */
            SplitContainer.prototype._applySecondaryContentSize = function () {
                // Only set if rendered...
                if (this.getDomRef()) {
                    var bVertical = this.getOrientation() === sap.ui.core.Orientation.Vertical;
                    var sSize, sOtherSize;
                    var sDir, sOtherDir, sDirValue;
                    var sSizeValue = this.getSecondaryContentSize();
                    var bShow = this.getShowSecondaryContent();

                    if (bVertical) {
                        // Vertical mode
                        sSize = "height";
                        sOtherSize =  "width";
                        sDir = "top";
                        sOtherDir = this.bRtl ? "right" : "left";
                    } else {
                        // Horizontal mode
                        sSize = "width";
                        sOtherSize =  "height";
                        sDir = this.bRtl ? "right" : "left";
                        sOtherDir = "top";
                    }

                    if (this._closeContentDelayId) {
                        jQuery.sap.clearDelayedCall(this._closeContentDelayId);
                    }

                    this._secondaryContentContainer.css(sSize, sSizeValue);
                    this._secondaryContentContainer.css(sOtherSize, "");
                    if (this.getParent().getToolAreaVisible && !this.getParent().getToolAreaVisible()) {
                        sDirValue = "0";
                    } else {
                        sDirValue = this._toolArea.getSize ? this._toolArea.getSize() : "0";
                    }

                    this._secondaryContentContainer.css(sDir, bShow ? sDirValue : "-" + sSizeValue);
                    this._secondaryContentContainer.css(sOtherDir, "");

                    // Move main content if it should be completely visible. @see _handleMediaChange()
                    if (this._moveContent) {
                        sSizeValue = this._adjustSecondaryContentSize();
                        this._contentContainer.css(sDir, bShow ? sSizeValue : sDirValue);
                    } else {
                        this._contentContainer.css(sDir, sDirValue);
                    }

                    if (!bShow) {
                        // The theming parameter is something along the lines of "500ms", the "ms"-part is
                        // ignored by parseInt.
                        // TODO: Cache the value.
                        var iHideDelay = parseInt(
                            Parameters.get("sapUshellSplitContAnimationDuration"),
                            10
                        );
                        // Maybe we could also allow "s"-values and then multiply everything below 20 with 1000...?

                        this._closeContentDelayId = jQuery.sap.delayedCall(iHideDelay, this, function () {
                            if (this._secondaryContentContainer) {
                                this._secondaryContentContainer.toggleClass("sapUshellSplitContSecondClosed", true);
                            }
                        });
                    } else {
                        this._secondaryContentContainer.toggleClass("sapUshellSplitContSecondClosed", false);
                    }

                }
            };


            /**
             * Optimization method that prevents the normal render from rerendering the whole control.
             * See _ContentRenderer in file shared.js for details.
             *
             * @param {function} fMod Method that is called to perform the requested change
             * @param {sap.ui.core.Renderer} oDoIfRendered Renderer Instance
             * @returns {any} the return value from the first parameter
             *
             * @private
             */
            SplitContainer.prototype._modifyAggregationOrProperty = function (fMod, oDoIfRendered) {
                var bRendered = !!this.getDomRef();
                var res = fMod.apply(this, [bRendered]);
                if (bRendered && oDoIfRendered) {
                    oDoIfRendered.render();
                }
                return res;
            };

            SplitContainer.prototype._adjustSecondaryContentSize = function () {
                var sContentSize = this.getProperty("secondaryContentSize"),
                    sBarSize = this._shellLayout.getToolAreaVisible && this._shellLayout.getToolAreaVisible() ? this._toolArea.getSize() : "0rem";
                sContentSize = parseFloat(sContentSize, 10) + parseFloat(sBarSize, 10) + "rem";

                return sContentSize;
            };

        //////////////////////////////////////// Overridden Methods ////////////////////////////////////////

        //////////////////////////// Property "showSecondaryContent" ///////////////////////////////

            SplitContainer.prototype.setShowSecondaryContent = function (bShow) {
                var bRendered = this.getDomRef();
                this.setProperty("showSecondaryContent", !!bShow, bRendered);

                this._applySecondaryContentSize();
                return this;
            };

        ///////////////////////////// Property "secondaryContentSize" /////////////////////////////

            SplitContainer.prototype.setSecondaryContentSize = function (sSize) {
                this.setProperty("secondaryContentSize", sSize, true);
                this._applySecondaryContentSize();
                return this;
            };

        // Backwards compatibility with old property name

            SplitContainer.prototype.getSecondaryContentWidth = function () {
                jQuery.sap.log.warning(
                    "SplitContainer: Use of deprecated property \"SecondaryContentWidth\", please use " +
                    "\"SecondaryContentSize\" instead."
                );
                return this.getSecondaryContentSize.apply(this, arguments);
            };

            SplitContainer.prototype.setSecondaryContentWidth = function () {
                jQuery.sap.log.warning(
                    "SplitContainer: Use of deprecated property \"SecondaryContentWidth\", please use " +
                    "\"SecondaryContentSize\" instead."
                );
                return this.setSecondaryContentSize.apply(this, arguments);
            };

        /////////////////////////////////// Aggregation "content" //////////////////////////////////

            SplitContainer.prototype.insertContent = function (oContent, iIndex) {
                return this._modifyAggregationOrProperty(function (bRendered) {
                    return this.insertAggregation("content", oContent, iIndex, bRendered);
                }, this._canvasRenderer);
            };
            SplitContainer.prototype.addContent = function (oContent) {
                return this._modifyAggregationOrProperty(function (bRendered) {
                    return this.addAggregation("content", oContent, bRendered);
                }, this._canvasRenderer);
            };
            SplitContainer.prototype.removeContent = function (vIndex) {
                return this._modifyAggregationOrProperty(function (bRendered) {
                    return this.removeAggregation("content", vIndex, bRendered);
                }, this._canvasRenderer);
            };
            SplitContainer.prototype.removeAllContent = function () {
                return this._modifyAggregationOrProperty(function (bRendered) {
                    return this.removeAllAggregation("content", bRendered);
                }, this._canvasRenderer);
            };
            SplitContainer.prototype.destroyContent = function () {
                return this._modifyAggregationOrProperty(function (bRendered) {
                    return this.destroyAggregation("content", bRendered);
                }, this._canvasRenderer);
            };

        ////////////////////////////// Aggregation "secondaryContent" //////////////////////////////

            SplitContainer.prototype.insertSecondaryContent = function (oContent, iIndex) {
                return this._modifyAggregationOrProperty(function (bRendered) {
                    return this.insertAggregation("secondaryContent", oContent, iIndex, bRendered);
                }, this._paneRenderer);
            };
            SplitContainer.prototype.addSecondaryContent = function (oContent) {
                return this._modifyAggregationOrProperty(function (bRendered) {
                    return this.addAggregation("secondaryContent", oContent, bRendered);
                }, this._paneRenderer);
            };
            SplitContainer.prototype.removeSecondaryContent = function (vIndex) {
                return this._modifyAggregationOrProperty(function (bRendered) {
                    return this.removeAggregation("secondaryContent", vIndex, bRendered);
                }, this._paneRenderer);
            };
            SplitContainer.prototype.removeAllSecondaryContent = function( ) {
                return this._modifyAggregationOrProperty(function (bRendered) {
                    return this.removeAllAggregation("secondaryContent", bRendered);
                }, this._paneRenderer);
            };
            SplitContainer.prototype.destroySecondaryContent = function () {
                return this._modifyAggregationOrProperty(function (bRendered) {
                    return this.destroyAggregation("secondaryContent", bRendered);
                }, this._paneRenderer);
            };

            ////////////////////////////// Aggregation "subHeader" //////////////////////////////

            SplitContainer.prototype.addSubHeader = function (oContent) {
                return this._modifyAggregationOrProperty(function (bRendered) {
                    return this.addAggregation("subHeader", oContent, bRendered);
                }, this._subHeadersRenderer);
            };
            SplitContainer.prototype.removeSubHeader = function () {
                return this._modifyAggregationOrProperty(function (bRendered) {
                    return this.removeAllAggregation("subHeader", bRendered);
                }, this._subHeadersRenderer);
            };
            SplitContainer.prototype.destroySubHeader = function () {
                return this._modifyAggregationOrProperty(function (bRendered) {
                    return this.destroyAggregation("subHeader", bRendered);
                }, this._subHeadersRenderer);
            };


        })(window);


        return SplitContainer;

    }, /* bExport= */ true);
