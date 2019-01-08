/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */
/*global jQuery, sap */
// Provides control sap.ushell.ui.shell.ShellHeadItem.
sap.ui.define(['jquery.sap.global', 'sap/ui/core/Control', 'sap/ui/core/IconPool', 'sap/ushell/library'],
    function (jQuery, Control, IconPool) {
        "use strict";



        /**
         * Constructor for a new ShellHeadItem.
         *
         * @param {string} [sId] id for the new control, generated automatically if no id is given
         * @param {object} [mSettings] initial settings for the new control
         *
         * @class
         * Header Action item of the Shell.
         * @extends sap.ui.core.Control
         *
         * @author SAP SE
         * @version 1.52.4
         *
         * @constructor
         * @private
         * @since 1.15.1
         * @alias sap.ushell.ui.shell.ShellHeadItem
         * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
         */
        var ShellHeadItem = Control.extend("sap.ushell.ui.shell.ShellHeadItem", /** @lends sap.ushell.ui.shell.ShellHeadItem.prototype */ {
            metadata: {

                properties: {

                    /**
                     * If set to true, a divider is displayed before the item.
                     * @deprecated Since version 1.18.
                     * Dividers are not supported anymore.
                     */
                    startsSection: {
                        type: "boolean",
                        group: "Appearance",
                        defaultValue: false,
                        deprecated: true
                    },

                    /**
                     * If set to true, a separator is displayed after the item.
                     * @since 1.22.5
                     */
                    showSeparator: {
                        type: "boolean",
                        group: "Appearance",
                        defaultValue: true
                    },
                    /**
                     * If set to false, the button isn't clickable and displayed as disabled.
                     * @since 1.38
                     */
                    enabled: {
                        type: "boolean",
                        group: "Appearance",
                        defaultValue: true
                    },

                    /**
                     * If set to true, the item gets a special design.
                     */
                    selected: {
                        type: "boolean",
                        group: "Appearance",
                        defaultValue: false
                    },

                    /**
                     * If set to true, a theme dependent marker is shown on the item.
                     * @deprecated Since version 1.18.
                     * Markers should not be used anymore.
                     */
                    showMarker: {
                        type: "boolean",
                        group: "Appearance",
                        defaultValue: false,
                        deprecated: true
                    },

                    /**
                     * The icon of the item, either defined in the sap.ui.core.IconPool or an URI to a custom image. An icon must be set.
                     */
                    icon: {
                        type: "sap.ui.core.URI",
                        group: "Appearance",
                        defaultValue: null
                    },

                    target: {
                        type: "sap.ui.core.URI",
                        group: "Appearance",
                        defaultValue: null
                    },

                    ariaLabel: {
                        type: "string",
                        group: "Appearance",
                        defaultValue: null
                    },

                    /**
                     * The text of the item. Text is only visible if the item is not rendered as part of the Header
                     * i.e. if it is rendered as part of an overflow button in a Popover
                     * @since 1.38
                     */
                    text: {
                        type: "string",
                        group: "Appearance",
                        defaultValue: null
                    },

                    /**
                     * Invisible items are not shown on the UI.
                     * @since 1.18
                     */
                    visible: {
                        type: "boolean",
                        group: "Appearance",
                        defaultValue: true
                    },

                    floatingNumber: {
                        type: "int",
                        group: "Appearance",
                        defaultValue: null
                    },

                    floatingNumberMaxValue: {
                        type: "int",
                        group: "Appearance",
                        defaultValue: 999
                    }
                },
                events: {

                    /**
                     * Event is fired when the user presses the item.
                     */
                    press: {}
                }
            },
            renderer: {
                render: function (rm, oItem) {
                    if ((oItem.getTarget() || "") !== "") {
                        rm.write("<a tabindex='0' href='");
                        rm.writeEscaped(oItem.getTarget());
                        rm.write("'");
                    } else {
                        rm.write("<a tabindex='0'");
                    }
                    rm.writeAccessibilityState(oItem, {
                        role: 'button'
                    });
                    rm.writeControlData(oItem);
                    rm.addClass("sapUshellShellHeadItm");
                    var bRenderText = oItem._shouldRenderText();
                    if (bRenderText) {
                        rm.addClass("sapUshellShellHeadItmText");
                    }

                    if (oItem._headerHideSeperators) {
                        rm.addClass("sapUshellHeaderHideSeparators");
                    }

                    if (!oItem.getEnabled()) {
                        rm.addClass("sapUshellShellHeadItmDisabled");
                    }

                    if (oItem.getFloatingNumber && oItem.getFloatingNumber() > 0 && oItem.getVisible()) {
                        // Verify that the floating number is not bigger than the maximum
                        var sFloatingNumber = oItem.getDisplayFloatingNumber();
                        rm.addClass("sapUshellShellHeadItmCounter");
                        rm.writeAttribute("data-counter-content", sFloatingNumber);
                    }
                    if (oItem.getStartsSection()) {
                        rm.addClass("sapUshellShellHeadItmDelim");
                    }
                    if (oItem.getShowSeparator()) {
                        rm.addClass("sapUshellShellHeadItmSep");
                    }
                    if (!oItem.getVisible()) {
                        rm.addClass("sapUshellShellHidden");
                    }
                    if (oItem.getAriaLabel()) {
                        //Handle Aria Label rendering
                        rm.writeAccessibilityState({
                            label: oItem.getAriaLabel(),
                            role: "button"
                        });
                    }
                    if (oItem.getSelected()) {
                        rm.addClass("sapUshellShellHeadItmSel");
                    }
                    if (oItem.getShowMarker()) {
                        rm.addClass("sapUshellShellHeadItmMark");
                    }
                    rm.writeClasses();
                    var tooltip = oItem.getTooltip_AsString();
                    if (tooltip) {
                        rm.writeAttributeEscaped("title", tooltip);
                    }
                    rm.write("><span></span><div class='sapUshellShellHeadItmMarker'><div></div></div>");
                    if (bRenderText) {
                        rm.write("<b class='sapUshellShellHeadItmCenterText'>");
                        rm.writeEscaped(oItem.getText());
                        rm.write("</b>");
                    }
                    rm.write("</a>");
                }
            }
        });

        ShellHeadItem.prototype._shouldRenderText = function () {
            if (this.getText() && this.getParent()) {
                return !(this.getParent() instanceof sap.ushell.ui.shell.ShellHeader);
            }
            return false;
        };

        ShellHeadItem.prototype.onAfterRendering = function () {
            this._refreshIcon();
        };

        ShellHeadItem.prototype.onclick = function (oEvent) {

            if (this.getEnabled()) {
                this.firePress();
                // IE always interprets a click on an anker as navigation and thus triggers the
                // beforeunload-event on the window. Since a ShellHeadItem never has a valid href-attribute,
                // the default behavior should never be triggered
                if (!this.getTarget()) {
                    oEvent.preventDefault();
                }
            }
        };

        ShellHeadItem.prototype.onsapspace = function () {
            var oDomRef = this.getDomRef();
            if (oDomRef) {
                oDomRef.click();
            }
        };

        ShellHeadItem.prototype.onsapenter = function () {
            this.onsapspace();
        };

        ShellHeadItem.prototype.setStartsSection = function (bStartsSection) {
            bStartsSection = !!bStartsSection;
            this.setProperty("startsSection", bStartsSection, true);
            this.$().toggleClass("sapUshellShellHeadItmDelim", bStartsSection);
            return this;
        };


        ShellHeadItem.prototype.setShowSeparator = function (bShowSeparator) {
            bShowSeparator = !!bShowSeparator;
            this.setProperty("showSeparator", bShowSeparator, true);
            this.$().toggleClass("sapUshellShellHeadItmSep", bShowSeparator);
            return this;
        };


        ShellHeadItem.prototype.setSelected = function (bSelected) {
            bSelected = !!bSelected;
            this.setProperty("selected", bSelected, true);
            this.$().toggleClass("sapUshellShellHeadItmSel", bSelected);
            return this;
        };

        ShellHeadItem.prototype.setEnabled = function (bEnabled) {
            bEnabled = !!bEnabled;
            this.setProperty("enabled", bEnabled, true);
            this.$().toggleClass("sapUshellShellHeadItmDisabled", !bEnabled);
            return this;
        };

        ShellHeadItem.prototype.setAriaLabel = function (sAriaLabel) {
            this.setProperty('ariaLabel', sAriaLabel);
            return this;
        };


        ShellHeadItem.prototype.setVisible = function (bVisible) {
            if (sap.ui.Device.system.phone) {
                this.setProperty("visible", !!bVisible, false);
            } else {
                this.setProperty("visible", !!bVisible, true);
            }
            if (bVisible) {
                this.$().removeClass('sapUshellShellHidden');
            } else {
                this.$().addClass('sapUshellShellHidden');
            }
            return this;
        };


        ShellHeadItem.prototype.setShowMarker = function (bMarker) {
            bMarker = !!bMarker;
            this.setProperty("showMarker", bMarker, true);
            this.$().toggleClass("sapUshellShellHeadItmMark", bMarker);
            return this;
        };


        ShellHeadItem.prototype.setIcon = function (sIcon) {
            this.setProperty("icon", sIcon, true);
            if (this.getDomRef()) {
                this._refreshIcon();
            }
            return this;
        };


        ShellHeadItem.prototype._refreshIcon = function () {
            var $Ico = jQuery(this.$().children()[0]);
            var sIco = this.getIcon();
            if (IconPool.isIconURI(sIco)) {
                var oIconInfo = IconPool.getIconInfo(sIco);
                $Ico.html("").css("style", "");
                if (oIconInfo) {
                    $Ico.text(oIconInfo.content).css("font-family", "'" + oIconInfo.fontFamily + "'");
                }
            } else {
                var $Image = this.$("img-inner");
                if ($Image.length === 0 || $Image.attr("src") !== sIco) {
                    jQuery(this.$().children()[0]).addClass('userImgSpan');
                    jQuery(this.$().children().first().before("<div class='userImg'></div>"));
                    $Ico.css("style", "").html("<img id='" + this.getId() + "-img-inner' src='" + jQuery.sap.encodeHTML(sIco) + "'></img>");
                }
            }
        };

        ShellHeadItem.prototype.getDisplayFloatingNumber = function () {
            var iNumber = this.getFloatingNumber(),
                iMaxValueNumber = this.getFloatingNumberMaxValue();
            var sDisplayNumber = iNumber + "";
            if (iNumber > iMaxValueNumber) {
                sDisplayNumber = iMaxValueNumber + "+";
            }
            return sDisplayNumber;
        };

        // in case someone already using the API sap.ushell.renderers.fiori2.RendererExtensions.addHeaderItem
        // with sap.ui.unified.ShellHeadItem() instance
        jQuery.sap.declare('sap.ui.unified.ShellHeadItem');
        sap.ui.unified.ShellHeadItem = ShellHeadItem;

        return ShellHeadItem;

    }, /* bExport= */ true);