/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */
/*global jQuery, sap, window, document*/
// Provides control sap.ushell.ui.shell.ShellLayout.
sap.ui.define(['jquery.sap.global', 'sap/ui/Device', 'sap/ui/core/Control', 'sap/ushell/library',
        './ShellHeader', './SplitContainer', './ToolArea'/*, './RightFloatingContainer', './FloatingContainer', './ShellFloatingActions'*/],
    function (jQuery, Device, Control, ShellHeader, SplitContainer, ToolArea/*, ShellFloatingActions*/) {
        "use strict";

    /**
     * Constructor for a new ShellLayout.
     *
     * @param {string} [sId] id for the new control, generated automatically if no id is given
     * @param {object} [mSettings] initial settings for the new control
     *
     * @class
     * The shell layout is the base for the shell control which is meant as root control (full-screen) of an application.
     * It was build as root control of the Fiori Launchpad application and provides the basic capabilities
     * for this purpose. Do not use this control within applications which run inside the Fiori Lauchpad and
     * do not use it for other scenarios than the root control usecase.
     * @extends sap.ui.core.Control
     *
     * @author SAP SE
     * @version 1.52.4
     *
     * @constructor
     * @private
     * @since 1.25.0
     * @alias sap.ushell.ui.shell.ShellLayout
     * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
     */
        var ShellLayout = Control.extend("sap.ushell.ui.shell.ShellLayout", /** @lends sap.ushell.ui.shell.ShellLayout.prototype */ { metadata : {

            properties : {
                /**
                 * Whether the header can be hidden (manually or automatically). This feature is only available when touch events are supported.
                 */
                headerHiding : {type : "boolean", group : "Appearance", defaultValue : false},

                /**
                 * If set to false, no header (and no items, search, ...) is shown.
                 */
                headerVisible : {type : "boolean", group : "Appearance", defaultValue : true},

                toolAreaVisible: {type : "boolean", group : "Appearance", defaultValue : false},
                
                floatingContainerVisible: {type : "boolean", group : "Appearance", defaultValue : false},

                backgroundColorForce: {type : "boolean", group : "Appearance", defaultValue : true},

                showBrandLine: {type : "boolean", group : "Appearance", defaultValue : true},

                showAnimation: {type : "boolean", group : "Appearance", defaultValue : true},

                enableCanvasShapes: {type : "boolean", group : "Appearance", defaultValue : false}
            },
            aggregations : {
                /**
                 * The control to appear in the header area.
                 */
                header : {type : "sap.ushell.ui.shell.ShellHeader", multiple : false},

                /**
                 * The control to appear in the sidebar (left) area.
                 */
                toolArea : {type : "sap.ushell.ui.shell.ToolArea", multiple : false},

                /**
                 * The control to appear in the (right) area for the alerts.
                 */
                rightFloatingContainer : {type : "sap.ushell.ui.shell.RightFloatingContainer", multiple : false},

                /**
                 * Private storage for the internal split container for the canvas.
                 */
                canvasSplitContainer : {type : "sap.ushell.ui.shell.SplitContainer", multiple : false},

                /**
                 * The action button which is rendered floating in the shell content area. If a custom header is set this aggregation has no effect.
                 */
                floatingActionsContainer : {type : "sap.ushell.ui.shell.ShellFloatingActions", multiple : false}
            },
            associations : {
                floatingContainer : {type : "sap.ushell.ui.shell.FloatingContainer", multiple : false}
            }
        }});

        ShellLayout._SIDEPANE_WIDTH_PHONE = 13;
        ShellLayout._SIDEPANE_WIDTH_TABLET = 13;
        ShellLayout._SIDEPANE_WIDTH_DESKTOP = 15;
        ShellLayout._HEADER_ALWAYS_VISIBLE = true; /*Whether header hiding is technically possible (touch enabled)*/
        ShellLayout._HEADER_AUTO_CLOSE = true;
        ShellLayout._HEADER_TOUCH_TRESHOLD = 15;
        if (Device.browser.chrome && Device.browser.version < 36) {
            //see https://groups.google.com/a/chromium.org/forum/#!topic/input-dev/Ru9xjSsvLHw --> chrome://flags/#touch-scrolling-mode
            ShellLayout._HEADER_TOUCH_TRESHOLD = 10;
        }

        ShellLayout.prototype.init = function () {
            this._rtl = sap.ui.getCore().getConfiguration().getRTL();
            this._showHeader = true;
            this._iHeaderHidingDelay = 3000; /*Currently hidden but maybe a property later (see getter and setter below)*/
            this._useStrongBG = false;

            Device.media.attachHandler(this._handleMediaChange, this, Device.media.RANGESETS.SAP_STANDARD);
        };

        ShellLayout.prototype.exit = function () {
            Device.media.detachHandler(this._handleMediaChange, this, Device.media.RANGESETS.SAP_STANDARD);
        };

        ShellLayout.prototype.onAfterRendering = function () {
            var that = this;

            function headerFocus(oBrowserEvent) {
                var oEvent = jQuery.event.fix(oBrowserEvent);
                if (jQuery.sap.containsOrEquals(that.getDomRef("hdr"), oEvent.target)) {
                    that._timedHideHeader(oEvent.type === "focus");
                }
            }

            if (window.addEventListener && !ShellLayout._HEADER_ALWAYS_VISIBLE) {
                var oHdr = this.getDomRef("hdr");
                oHdr.addEventListener("focus", headerFocus, true);
                oHdr.addEventListener("blur", headerFocus, true);
            }
            this.getCanvasSplitContainer()._applySecondaryContentSize();
            this._setSidePaneWidth();
        };

        ShellLayout.prototype.renderFloatingContainerWrapper = function () {
            var floatingContainerWrapper = document.getElementById("sapUshellFloatingContainerWrapper"),
                body = document.getElementsByTagName('body'),
                storage = jQuery.sap.storage ? jQuery.sap.storage(jQuery.sap.storage.Type.local, "com.sap.ushell.adapters.local.FloatingContainer") : undefined;

            if (!floatingContainerWrapper){
                floatingContainerWrapper = document.createElement("DIV");
                floatingContainerWrapper.setAttribute("id", 'sapUshellFloatingContainerWrapper');
                floatingContainerWrapper.setAttribute("class", 'sapUshellShellFloatingContainerWrapper sapUshellShellHidden');
                body[0].appendChild(floatingContainerWrapper);
            }

            if (storage && storage.get("floatingContainerStyle")) {
                floatingContainerWrapper.setAttribute("style", storage.get("floatingContainerStyle"));
            }
        };

        ShellLayout.prototype.renderFloatingContainer = function (oFloatingContainer) {
            this.renderFloatingContainerWrapper();

            if (oFloatingContainer && !oFloatingContainer.getDomRef()) {
                jQuery('#sapUshellFloatingContainerWrapper').toggleClass("sapUshellShellHidden", true);
                oFloatingContainer.placeAt("sapUshellFloatingContainerWrapper");
            }
        };

        ShellLayout.prototype.onThemeChanged = function () {
            this._refreshAfterRendering();
        };

        (function () {

            function _updateHeader(oShell) {
                if (oShell._startY === undefined || oShell._currY === undefined) {
                    return;
                }

                var yMove = oShell._currY - oShell._startY;
                if (Math.abs(yMove) > ShellLayout._HEADER_TOUCH_TRESHOLD) {
                    oShell._doShowHeader(yMove > 0);
                    oShell._startY = oShell._currY;
                }
            }

            if (Device.support.touch) {

                ShellLayout._HEADER_ALWAYS_VISIBLE = false;

                ShellLayout.prototype.ontouchstart = function (oEvent) {
                    this._startY = oEvent.touches[0].pageY;
                    if (this._startY > 2 * 48) { /*Only when touch starts "nearby" the header*/
                        this._startY = undefined;
                    }
                    this._currY = this._startY;
                };

                ShellLayout.prototype.ontouchend = function () {
                    _updateHeader(this);
                    this._startY = undefined;
                    this._currY = undefined;
                };

                ShellLayout.prototype.ontouchcancel = ShellLayout.prototype.ontouchend;

                ShellLayout.prototype.ontouchmove = function (oEvent) {
                    this._currY = oEvent.touches[0].pageY;
                    _updateHeader(this);
                };
            }
        })();

        //***************** API / Overridden generated API *****************

        ShellLayout.prototype.setHeaderHiding = function (bEnabled) {
            bEnabled = !!bEnabled;
            return this._modifyAggregationOrProperty(function (bRendered) {
                return this.setProperty("headerHiding", bEnabled, bRendered);
            }, function () {
                this._doShowHeader(!bEnabled ? true : this._showHeader);
            });
        };

        /*Not public, Maybe API later*/
        ShellLayout.prototype.setHeaderHidingDelay = function (iDelay) {
            this._iHeaderHidingDelay = iDelay;
            return this;
        };

        /*Not public, Maybe API later*/
        ShellLayout.prototype.getHeaderHidingDelay = function () {
            return this._iHeaderHidingDelay;
        };

        ShellLayout.prototype.setToolAreaVisible = function (bVisible) {
            this.setProperty("toolAreaVisible", !!bVisible, true);
            this.getToolArea().$().toggleClass("sapUshellShellHidden", !bVisible);
            this.getCanvasSplitContainer()._applySecondaryContentSize();
            return this;
        };

        ShellLayout.prototype.setFloatingContainer = function (oContainer) {
            this.setAssociation('floatingContainer', oContainer, true);
            this.renderFloatingContainer(oContainer);
        };

        ShellLayout.prototype.setFloatingContainerVisible = function (bVisible) {
            // setting the actual ShellLayout property
            this.setProperty("floatingContainerVisible", !!bVisible, true);
            if (this.getDomRef()) {
                var storage = jQuery.sap.storage ? jQuery.sap.storage(jQuery.sap.storage.Type.local, "com.sap.ushell.adapters.local.FloatingContainer") : undefined,
                    floatingContainerWrapper = document.getElementById("sapUshellFloatingContainerWrapper");
                // Only in case this is first time the container is opened and there is no style for it in local storage
                if (bVisible && storage && !storage.get("floatingContainerStyle")) {
                    var emSize = jQuery(".sapUshellShellHeadItm").position() ? jQuery(".sapUshellShellHeadItm").position().left : 0;
                    var iLeftPos = (jQuery(window).width() - jQuery("#shell-floatingContainer").width() - emSize) * 100 / jQuery(window).width();
                    var iTopPos = jQuery(".sapUshellShellHeadContainer").height() * 100 / jQuery(window).height();
                    floatingContainerWrapper.setAttribute("style", "left:" + iLeftPos + "%;" + "top:" + iTopPos + "%;position:absolute;");
                    storage.put("floatingContainerStyle", floatingContainerWrapper.getAttribute("style"));
                }
                jQuery('.sapUshellShellFloatingContainerWrapper').toggleClass("sapUshellShellHidden", !bVisible);

            }
            return this;
        };

        ShellLayout.prototype.setFloatingActionsContainer = function (oContainer) {
            this.setAggregation('floatingActionsContainer', oContainer, true);
        };

        ShellLayout.prototype.setHeaderVisible = function (bHeaderVisible) {
            this.setProperty("headerVisible", !!bHeaderVisible, true);
            this.$().toggleClass("sapUshellShellNoHead", !bHeaderVisible);
            return this;
        };

        /*Restricted API for Launchpad to set a Strong BG style*/
        ShellLayout.prototype._setStrongBackground = function (bUseStongBG) {
            this._useStrongBG = !!bUseStongBG;
            this.$("strgbg").toggleClass("sapUiStrongBackgroundColor", this._useStrongBG);
        };

        //***************** Private Helpers *****************

        ShellLayout.prototype._modifyAggregationOrProperty = function (fUpdate, oDoIfRendered) {
            var bRendered = !!this.getDomRef();
            var res = fUpdate.apply(this, [bRendered]);
            if (bRendered && oDoIfRendered) {
                if (oDoIfRendered instanceof sap.ushell.ui.shell.shell_ContentRenderer) {
                    oDoIfRendered.render();
                } else {
                    oDoIfRendered.apply(this);
                }
            }
            return res;
        };

        ShellLayout.prototype._doShowHeader = function (bShow) {
            var bWasVisible = this._showHeader;
            this._showHeader = this._isHeaderHidingActive() ? !!bShow : true;

            this.$().toggleClass("sapUshellShellHeadHidden", !this._showHeader).toggleClass("sapUshellShellHeadVisible", this._showHeader);

            if (this._showHeader) {
                this._timedHideHeader();
            }

            if (bWasVisible !== this._showHeader && this._isHeaderHidingActive()) {
                jQuery.sap.delayedCall(500, this, function () {
                    try {
                        var oResizeEvent = document.createEvent("UIEvents");
                        oResizeEvent.initUIEvent("resize", true, false, window, 0);
                        window.dispatchEvent(oResizeEvent);
                    } catch (e) {
                        jQuery.sap.log.error(e);
                    }
                });
            }
        };

        ShellLayout.prototype._timedHideHeader = function (bClearOnly) {
            if (this._headerHidingTimer) {
                jQuery.sap.clearDelayedCall(this._headerHidingTimer);
                this._headerHidingTimer = null;
            }

            if (bClearOnly || !ShellLayout._HEADER_AUTO_CLOSE || !this._isHeaderHidingActive() || this._iHeaderHidingDelay <= 0) {
                return;
            }

            this._headerHidingTimer = jQuery.sap.delayedCall(this._iHeaderHidingDelay, this, function () {
                if (this._isHeaderHidingActive() && this._iHeaderHidingDelay > 0 && !jQuery.sap.containsOrEquals(this.getDomRef("hdr"), document.activeElement)) {
                    this._doShowHeader(false);
                }
            });
        };

        ShellLayout.prototype._isHeaderHidingActive = function () {
            // Not active if no touch, or the hiding is deactivated via API
            if (ShellLayout._HEADER_ALWAYS_VISIBLE || !this.getHeaderHiding() || sap.ushell.ui.shell.shell_iNumberOfOpenedShellOverlays > 0 || !this.getHeaderVisible()) {
                return false;
            }
            return true;
        };

        ShellLayout.prototype._setSidePaneWidth = function (sRange) {
            var oSplitContainer = this.getCanvasSplitContainer();
            if (oSplitContainer) {
                if (!sRange) {
                    sRange = Device.media.getCurrentRange(Device.media.RANGESETS.SAP_STANDARD).name;
                }

                var w = ShellLayout["_SIDEPANE_WIDTH_" + sRange.toUpperCase()] + "rem";
                oSplitContainer.setSecondaryContentSize(w);
            }
        };

        ShellLayout.prototype._handleMediaChange = function (mParams) {
            if (!this.getDomRef()) {
                return false;
            }
            this._setSidePaneWidth(mParams.name);
            this.getCanvasSplitContainer()._applySecondaryContentSize();
        };

        ShellLayout.prototype._refreshAfterRendering = function () {
            var oDom = this.getDomRef();

            if (!oDom) {
                return false;
            }

            this._timedHideHeader();

            return true;
        };

        return ShellLayout;

    }, /* bExport= */ true);
