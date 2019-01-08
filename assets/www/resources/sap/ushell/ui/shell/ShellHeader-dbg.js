/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */
/*global jQuery, sap */
sap.ui.define(['jquery.sap.global', 'sap/ushell/library', './ShellHeadItem', './ShellHeadUserItem', './ShellTitle', './ShellAppTitle'],
    function (jQuery, ShellHeadItem, ShellHeadUserItem, ShellTitle) {
        "use strict";

        var iSearchMaxWidthValue = 0, iNextSearchMaxWidthValue = 0;
        var iLogoSize;
        var iLogoPaddingLeft;
        var iLogoPaddingRight;
        var iSearchPhoneStateThreshold;

        var ShellHeader = sap.ui.core.Control.extend("sap.ushell.ui.shell.ShellHeader", {

            MIN_PADDING_REM_VALUE_LARGE: 3,
            MIN_PADDING_REM_VALUE_SMALL: 1,
            MIN_PADDING_REM_VALUE_SMALL_FOR_SEARCH: 0.5,
            MIN_REM_VALUE_FOR_SEARCH_CONTAINER_SIZE : 9,
            APP_TITLE_MIN_VALUE : 3,
            TITLE_MIN_VALUE : 3,
            TITLE_MAX_WIDTH_VALUE : 12,

            metadata: {
                properties: {
                    logo: {type: "sap.ui.core.URI", defaultValue: ""},
                    showLogo: {type: "boolean", defaultValue: true},
                    searchState: {type: "string", defaultValue: "COL"},
                    ariaLabel: {type: "string", defaultValue: undefined},
                    showSeparators: {type : "boolean", group : "Appearance", defaultValue : true}
                },
                aggregations: {
                    headItems: {type: "sap.ushell.ui.shell.ShellHeadItem", multiple: true},
                    headEndItems: {type: "sap.ushell.ui.shell.ShellHeadItem", multiple: true},
                    search: {type: "sap.ui.core.Control", multiple: false},
                    user: {type: "sap.ushell.ui.shell.ShellHeadUserItem", multiple: false},
                    title: {type: "sap.ushell.ui.shell.ShellTitle", multiple: false},
                    appTitle: {type: "sap.ushell.ui.shell.ShellAppTitle", multiple: false}
                },
                events : {
                    searchSizeChanged : {}
                }
            },
            renderer: {
                render: function (rm, oHeader) {
                    var id = oHeader.getId();
                    rm.write("<div");
                    rm.writeControlData(oHeader);
                    if (oHeader.getAriaLabel()) {
                        rm.writeAccessibilityState({
                            label: oHeader.getAriaLabel(),
                            role: "banner"
                        });
                    }
                    rm.addClass("sapUshellShellHeader");
                    rm.writeClasses();
                    rm.write(">");
                    rm.write("<div id='", id, "-hdr-begin' class='sapUshellShellHeadBegin'>");
                    this.renderHeaderItems(rm, oHeader, true);
                    rm.write("</div>");

                    rm.write("<div id='", id, "-hdr-center' class='sapUshellShellHeadCenter' >");


                    this.renderTitle(rm, oHeader);
                    if (oHeader.getAppTitle()) {
                        this.renderAppTitle(rm, oHeader);
                    }
                    this.renderSearch(rm, oHeader);
                    rm.write("</div>");


                    rm.write("<div id='", id, "-hdr-end' class='sapUshellShellHeadEnd'>");
                    this.renderHeaderItems(rm, oHeader, false);
                    rm.write("</div>");
                    rm.write("<div tabindex='0' id='sapUshellHeaderAccessibilityHelper'  style='position: absolute'></div>");
                    rm.write("</div>");
                },
                renderSearch: function (rm, oHeader) {
                    var oSearch = oHeader.getSearch();
                    rm.write("<div id='", oHeader.getId(), "-hdr-search-container'");
                    rm.writeAttribute("class", "sapUshellShellSearch");
                    rm.addStyle("max-width", iSearchMaxWidthValue + "rem");

                    rm.writeStyles();
                    rm.write(">");
                    if (oSearch) {
                        rm.renderControl(oSearch);
                    }
                    rm.write("</div>");
                },
                renderTitle: function (rm, oHeader) {
                    var sClassName = "sapUshellShellHeadTitle";
                    if (oHeader.getAppTitle()) {
                        sClassName = "sapUshellShellHeadSubtitle";
                    }

                    rm.write("<div id='", oHeader.getId(), "-hdr-title' class='" + sClassName + "'");
                    rm.write(">");
                    rm.renderControl(oHeader.getTitle());
                    rm.write("</div>");
                },
                renderAppTitle: function (rm, oHeader) {
                    rm.write("<div id='", oHeader.getId(), "-hdr-appTitle' class='sapUshellShellHeadTitle'>");
                    rm.renderControl(oHeader.getAppTitle());
                    rm.write("</div>");
                },
                renderHeaderItems: function (rm, oHeader, begin) {
                    rm.write("<div class='sapUshellShellHeadContainer'>");
                    var tooltip,
                        oUser,
                        sUserName,
                        aItems = begin ? oHeader.getHeadItems() : oHeader.getHeadEndItems(),
                        i;
                    for (i = 0; i < aItems.length; i++) {
                        aItems[i]._headerHideSeperators = !oHeader.getShowSeparators();
                        rm.renderControl(aItems[i]);
                    }

                    oUser = oHeader.getUser();
                    if (!begin && oUser) {
                        rm.write("<a tabindex='0'");
                        rm.writeElementData(oUser);
                        rm.addClass("sapUshellShellHeadAction sapUshellShellHeadSeparator");
                        rm.writeClasses();
                        tooltip = oUser.getTooltip_AsString();
                        if (tooltip) {
                            rm.writeAttributeEscaped("title", tooltip);
                        }
                        if (oUser.getAriaLabel()) {
                            //Handle Aria Label rendering
                            rm.writeAccessibilityState({
                                label: oUser.getAriaLabel(),
                                haspopup: "true",
                                role: "button"
                            });
                        }
                        rm.write("><span id='", oUser.getId(), "-img' class='sapUshellShellHeadActionImg'></span>");
                        rm.write("<span id='" + oUser.getId() + "-name' class='sapUshellShellHeadActionName'");
                        rm.write(">");
                        sUserName = oUser.getUsername() || "";
                        rm.writeEscaped(sUserName);
                        rm.write("</span><span class='sapUshellShellHeadActionExp'></span></a>");
                    }

                    rm.write("</div>");
                    if (begin) {
                        this._renderLogo(rm, oHeader);
                    }
                },

                _renderLogo: function (rm, oHeader) {
                    var sLogoTooltip = sap.ushell.resources.i18n.getText("SHELL_LOGO_TOOLTIP"),
                        sIco = oHeader._getLogo(),
                        sClassName = "";
                    if (!oHeader.getShowLogo()) {
                        sClassName += "sapUshellShellHideIco";
                    } else {
                        sClassName += "sapUshellShellIco";
                    }
                    rm.write("<div class='" + sClassName + "'");
                    rm.write(">");
                    rm.write("<img id='", oHeader.getId(), "-icon'");
                    rm.writeAttributeEscaped("alt", sLogoTooltip);
                    rm.writeAttributeEscaped("title", sLogoTooltip);
                    rm.write("src='");
                    rm.writeEscaped(sIco);
                    rm.write("' style='", sIco ? "" : "display:none;", "'></img>");
                    rm.write("</div>");
                }
            }

        });

        /**
         * The search states that can be passed as a parameter to the setSearchState.
         * Values:
         * COL -
         * EXP -
         * EXP_S -
         */
        ShellHeader.prototype.SearchState = {
            COL: "COL",
            EXP: "EXP",
            EXP_S: "EXP_S"
        };

        ShellHeader.prototype.init = function () {
            var that = this;

            this._rtl = sap.ui.getCore().getConfiguration().getRTL();

            this._handleMediaChange = function (mParams) {
                if (!that.getDomRef()) {
                    return;
                }
                if (that.getSearchState() != this.SearchState.COL) {
                    this._setMaxWidthForAppTitleAndTitle();
                    that._handleSearchSizeChanged();
                    return;
                }
                that._refresh();
            };
            sap.ui.Device.media.attachHandler(this._handleMediaChange, this, sap.ui.Device.media.RANGESETS.SAP_STANDARD);

            this._handleResizeChange = function () {
                if (!that.getDomRef()) {
                    return;
                }
                var oUser = this.getUser();
                if (that.getUser()) {
                    oUser._checkAndAdaptWidth(!that.$("hdr-search").hasClass("sapUshellShellHidden") && !!that.getSearch());
                }

                if (that.getSearchState() != this.SearchState.COL) {
                    this._setMaxWidthForAppTitleAndTitle();
                    that._handleSearchSizeChanged();
                    return;
                }

                that._refresh();
            };
            sap.ui.Device.resize.attachHandler(this._handleResizeChange, this);

            this.data("sap-ui-fastnavgroup", "true", true); // Define group for F6 handling

            this.oTitle = null;
        };

        ShellHeader.prototype.exit = function () {
            sap.ui.Device.media.detachHandler(this._handleMediaChange, this, sap.ui.Device.media.RANGESETS.SAP_STANDARD);
            delete this._handleMediaChange;
            sap.ui.Device.resize.detachHandler(this._handleResizeChange, this);
            delete this._handleResizeChange;
            if (this.oTitle) {
                this.oTitle.destroy();
            }
        };

        ShellHeader.prototype.onAfterRendering = function () {
            var that = this;
            this._refresh();
            this.$("icon").one('load', function() {
                that._refresh();
            });
            this.$("hdr-center").toggleClass("sapUshellShellAnim", this.getParent().getShowAnimation());
            var oSearchContainerElement = this.$("hdr-search-container");
            if (iSearchMaxWidthValue != iNextSearchMaxWidthValue) {
                //we want to give the search-container display:none in order to prevent getting to the element in acc (in COL state)
                if (this.getSearchState() == this.SearchState.COL) {
                    oSearchContainerElement.one('transitionend', function(){
                        jQuery(this).addClass("sapUshellShellSearchHidden");
                    });
                }

                this._setSearchContainerMaxSize(iNextSearchMaxWidthValue, false);
                var searchSizeChangedData = {
                    remSize: this._convertPxToRem(this.getSearchContainerRect(iNextSearchMaxWidthValue).width),
                    isFullWidth: this.isPhoneState()
                };

                this.fireSearchSizeChanged(searchSizeChangedData);
            } else if (this.getSearchState() == this.SearchState.COL) {
                jQuery(oSearchContainerElement).addClass("sapUshellShellSearchHidden");
            }
        };

        ShellHeader.prototype.onThemeChanged = function () {
            if (this.getDomRef()) {
                this.invalidate();
            }
        };

        ShellHeader.prototype._getLogo = function () {
            var ico = this.getLogo();
            if (!ico) {
                jQuery.sap.require("sap.ui.core.theming.Parameters");
                ico = sap.ui.core.theming.Parameters._getThemeImage(null, true); // theme logo
            }
            return ico;
        };

        ShellHeader.prototype._handleSearchSizeChanged = function () {
            var actualMaxRemSize;
            if (this.getSearchState() == this.SearchState.COL) {
                return;
            } else if (this.getSearchState() == this.SearchState.EXP) {
                actualMaxRemSize = iSearchMaxWidthValue;
                this._handleExpSearchState(actualMaxRemSize);
            } else if (this.getSearchState() == this.SearchState.EXP_S) {
                actualMaxRemSize = this._handleExpSSearchState();
                this._setSearchContainerMaxSize(actualMaxRemSize);
            }

            var searchSizeChangedData = {
                remSize: this._convertPxToRem(this.getSearchContainerRect(actualMaxRemSize).width),
                isFullWidth: this.isPhoneState()
            };

            this.fireSearchSizeChanged(searchSizeChangedData);

        };

        ShellHeader.prototype._refresh = function () {
            var oUser = this.getUser();

            if (oUser) {
                oUser._refreshImage();
                oUser._checkAndAdaptWidth(!!this.getSearch());
            }

            //we need to save the logo-icon width for the setSearchState since once we hide it we cannot know what is the width
            if (!this.hasStyleClass("sapUshellShellHideLogo")) {
                this._saveLogoWidth();
            }

            this._setMaxWidthForAppTitleAndTitle();
            if (this.getSearchState() != this.SearchState.COL) {
                this._adjustHeaderWithSearch();
            }
            this._saveSearchPhoneStateThreshold();
        };

        ShellHeader.prototype._saveLogoWidth = function() {
            var oLogoJQ = this.$("hdr-begin").find(".sapUshellShellIco");
            if (oLogoJQ) {
                iLogoPaddingLeft = parseInt(oLogoJQ.css("padding-left"),10);
                iLogoPaddingRight = parseInt(oLogoJQ.css("padding-right"),10);
                iLogoSize = this.$("icon")[0].getBoundingClientRect().width;
            }
        };

        ShellHeader.prototype._convertPxToRem = function (pxValue) {
            var remSize = parseFloat(sap.ui.core.theming.Parameters.get("sapUiFontSize"));
            return pxValue / remSize;
        };

        ShellHeader.prototype._convertRemToPx = function (remValue) {
            var remSize = parseFloat(sap.ui.core.theming.Parameters.get("sapUiFontSize"));
            return remValue * remSize;
        };

        /**
         * The max-width of the appTitle is calculated to be the maximum available space there is in the hdr-center.
         * In L size - since there could be title (secondary), if the appTile doesn't have the minimum width -> the title (secondary)
         * truncate and after reaching the minimum size it disappears
         * In M size - if the appTile doesn't have the minimum width title can shrink in font size.
         * @private
         */
        ShellHeader.prototype._setMaxWidthForAppTitleAndTitle = function () {
            this._setMaxWidthForAppTitle();
            if (this.isLSize()) {
                this._setMaxWidthForTitle();
            } else {
                this._setAppTitleFontSize();
            }
        };

        /**
         * The max-width of the appTitle is calculate to be the maximum space there is in the hdr-center.
         * @private
         */
        ShellHeader.prototype._setMaxWidthForAppTitle = function () {
            var jqAppTitle = this.$("hdr-appTitle");
            var jqAppTitleSpan = this.$("hdr-appTitle").find(".sapUshellHeadTitle");

            if (!jqAppTitle.length) {
                return;
            }

            //if the font size was change need to return to the default one for the calculation
            //if the max - width was changed need to remove it for the calculation
            jqAppTitleSpan.removeClass('sapUshellHeadTitleWithSmallerFontSize');
            jqAppTitle.css({'max-width': 'none'});

            var iCenterWidth = this._calcCenterWidth();

            var iTitleWidth = 0;

            //if it is L-size and there is a title (secondary) we need to remove the title width from the max-width
            if (this.isLSize()) {
                var jqTitle = this.$("hdr-title");
                if (jqTitle.length) {
                    iTitleWidth = jqTitle[0].getBoundingClientRect().width;
                }
            }
            var iPaddingValue = this.isSSize() ? this.MIN_PADDING_REM_VALUE_SMALL : this.MIN_PADDING_REM_VALUE_LARGE;
            var iWidthForAppTitle = this._convertPxToRem(iCenterWidth - iTitleWidth) - 2* iPaddingValue;

            //if there is navigation menu -> need to add it to the min width value of the appTitle (1rem icon + 0.5rem padding)
            var jqNavigationMenu = jqAppTitle.find('.sapUshellShellHeadAction');
            var iAppTitleMinWidthValue = jqNavigationMenu.length ? this.APP_TITLE_MIN_VALUE + 1.5 : this.APP_TITLE_MIN_VALUE;

            if (iWidthForAppTitle < iAppTitleMinWidthValue) {
                iWidthForAppTitle = iAppTitleMinWidthValue;
            }

            jqAppTitle.css({
                'max-width': iWidthForAppTitle + "rem"
            });
        };

        /**
         * The function make sure the appTitle is in the center and do not overlapping the hdr-begin or hdr-end.
         * If it is not overlapping the function returns the center width. If the appTitle is overlapping the hdr-begin
         * or hdr-end the function remove from the header-width the max(hdr-begin, hdr-end) from both side
         * @private
         */
        ShellHeader.prototype._calcCenterWidth = function () {
            var appTitle = this.$("hdr-appTitle")[0].getBoundingClientRect();
            var hdrBegin = this.$("hdr-begin")[0].getBoundingClientRect();
            var hdrEnd = this.$("hdr-end")[0].getBoundingClientRect();

            var iCenterWidth;

            if (this._isOverlapping(hdrBegin, appTitle) || this._isOverlapping(appTitle, hdrEnd)) {
                var hdrBeginWidth = hdrBegin.width;
                var hdrEndWidth = hdrEnd.width;
                var hdrWidth = this.$()[0].getBoundingClientRect().width;
                iCenterWidth = hdrWidth - 2 * Math.max(hdrBeginWidth, hdrEndWidth);
            } else {
                var jqCenter = this.$("hdr-center");
                var iCenterWidth = jqCenter[0].getBoundingClientRect().width;
            }

            return iCenterWidth;
        };

        /**
         * If the title is overlapping the apptitle we reduce the max-width of the title and if it too small we remove it
         * @private
         */
        ShellHeader.prototype._setMaxWidthForTitle = function () {
            var jqTitle = this.$("hdr-title");

            if (!jqTitle.length) {
                return;
            }
            jqTitle.css({
                'max-width': this.TITLE_MAX_WIDTH_VALUE + "rem",
                'opacity': 1
            });

            var jqAppTitle = this.$("hdr-appTitle");

            //in case there is no appTitle the max-width do not need to be change
            if (!jqAppTitle || !jqAppTitle[0]) {
                return;
            }

            var iRemoveFromTitle = this._isOverlapping(jqTitle[0].getBoundingClientRect(),jqAppTitle[0].getBoundingClientRect(),this.MIN_PADDING_REM_VALUE_LARGE, false);
            if (iRemoveFromTitle) {
                var iTitleWidth = jqTitle[0].getBoundingClientRect().width;
                var iTitleMaxWidth = this._convertPxToRem(iTitleWidth- iRemoveFromTitle);
                if (iTitleMaxWidth < this.TITLE_MIN_VALUE) {
                    jqTitle.css({'opacity': 0});
                } else {
                    jqTitle.css({'max-width': iTitleMaxWidth + "rem"});
                }
            }
        };

        /**
         * In case we are in M size -> if there is not enought space for the App title (i.e -> it is trunced)
         * The font size should be change to a smaller font size
         * @private
         */
        ShellHeader.prototype._setAppTitleFontSize = function () {
            var oAppTitleJQ = this.$("hdr-appTitle").find(".sapUshellHeadTitle");
            if (oAppTitleJQ && oAppTitleJQ[0]) {
                var iScrollWidth = oAppTitleJQ[0].scrollWidth;
                var iClientWidth = oAppTitleJQ[0].clientWidth;
                if (iScrollWidth > iClientWidth) {
                    oAppTitleJQ.addClass('sapUshellHeadTitleWithSmallerFontSize');
                }
            }
        };

        /**
         * When the search is open (EXP or EXP_S) need to check if the search is ovelapping the appTitle
         * and if so need to adjust the apptitle max-width
         * @param newMaxWidthProperty - if the function is called after updating the max-width of the search-container,
         * since the property is changing in animation need to pass the new max-width value. If the function is called from
         * the refresh() function no need to pass this value
         * @private
         */
        ShellHeader.prototype._adjustHeaderWithSearch = function (newMaxWidthProperty) {
            var jqAppTitle = this.$("hdr-appTitle");
            if (!jqAppTitle.length || jqAppTitle.css('opacity') == "0" || jqAppTitle.css('display') == "none") {
                return;
            }

            var appTitleRect = jqAppTitle[0].getBoundingClientRect();
            var searchContainerRect;
            /* since the search-container max-width property is changing in an animation the width might not be updated yet.
             therfore we are using a "temp" div that simulate the search-container after the animation is done */
            if (newMaxWidthProperty) {
                searchContainerRect = this.getSearchContainerRect(newMaxWidthProperty);
            } else {
                var jqSearchContainer = this.$("hdr-search-container");
                searchContainerRect = this.getSearchContainerRect(parseFloat(jqSearchContainer.get(0).style.maxWidth));
            }

            var iOverlappingSearchOnAppTitle = this._isOverlapping(appTitleRect, searchContainerRect, this.MIN_PADDING_REM_VALUE_SMALL_FOR_SEARCH, true);
            if (!iOverlappingSearchOnAppTitle) {
                return;
            } else if (iOverlappingSearchOnAppTitle) {
                var iAppTitleWidth = appTitleRect.width;
                jqAppTitle.css({
                    'max-width': this._convertPxToRem(iAppTitleWidth - iOverlappingSearchOnAppTitle) + "rem"
                });

            }
        };

        ShellHeader.prototype.setAppTitle = function (oAppTitle) {
            oAppTitle.attachTextChanged(this._handleAppTitleChange,this);
            this.setAggregation("appTitle", oAppTitle, true);

        };

        ShellHeader.prototype.removeAppTitle = function (oAppTitle) {
            oAppTitle.detachedTextChanged(this._handleAppTitleChange);
            this.removeAggregation("appTitle");
        };

        ShellHeader.prototype._handleAppTitleChange = function() {
            if (!this.getDomRef()) {
                return;
            }
            if (this.getSearchState() != this.SearchState.COL) {
                this._setMaxWidthForAppTitleAndTitle();
                this._handleSearchSizeChanged();
            }
        };

        ShellHeader.prototype.setTitleControl = function (sTitle, oInnerControl) {
            this.oTitle = this.oTitle || sap.ui.getCore().byId("shellTitle");
            if (this.oTitle) {
                this.oTitle.destroy();
            }
            this.oTitle = new sap.ushell.ui.shell.ShellTitle("shellTitle", {
                text: sTitle,
                icon: sap.ui.core.IconPool.getIconURI("overflow")
            });
            this.oTitle.setInnerControl(oInnerControl);
            this.setTitle(this.oTitle);
        };

        ShellHeader.prototype.removeHeadItem = function (vItem) {
            if (typeof vItem === 'number') {
                vItem = this.getHeadItems()[vItem];
            }
            this.removeAggregation('headItems', vItem);
        };

        ShellHeader.prototype.addHeadItem = function (oItem) {
            this.addAggregation('headItems', oItem);
        };

        ShellHeader.prototype.isPhoneState = function () {
            var deviceType = sap.ui.Device.media.getCurrentRange(sap.ui.Device.media.RANGESETS.SAP_STANDARD).name;
            var bEnoughSpaceForSearch = true;
            var iHeaderWidth =  this.$().width();
            if (iHeaderWidth <= iSearchPhoneStateThreshold) {
                bEnoughSpaceForSearch = false;
            }
            return (sap.ui.Device.system.phone || deviceType == "Phone" || !bEnoughSpaceForSearch);
        };

        ShellHeader.prototype.isLSize = function () {
            var deviceRange = sap.ui.Device.media.getCurrentRange(sap.ui.Device.media.RANGESETS.SAP_STANDARD).name;
            return (deviceRange == "Desktop");
        };

        ShellHeader.prototype.isSSize = function () {
            var deviceRange = sap.ui.Device.media.getCurrentRange(sap.ui.Device.media.RANGESETS.SAP_STANDARD).name;
            return (sap.ui.Device.system.phone || deviceRange == "Phone");
        };

        ShellHeader.prototype.getSearchContainerRect = function (iMaxWidthRem) {
            //since the width is known only when the max-width animition ended we add a temporary div and get the width from it.
            var jqTempDiv = jQuery("<div> </div>").css("max-width", iMaxWidthRem + "rem");
            var jqTempWrapperDiv = jQuery("<div></div>").append(jqTempDiv).insertAfter(this.$("hdr-search-container"));
            jqTempDiv.addClass('sapUshellShellSearch');
            var tempDivRect = jqTempDiv[0].getBoundingClientRect();
            jqTempWrapperDiv.remove();
            return tempDivRect;
        };

        /**
         *
         * @param sStateName -
         * {ShellHeader.SearchState} [sStateName]
         *   The search state to be set.
         *   The validate values are - COL, EXP, EXP_S
         * @param {string} [maxRemSize]
         *  The required max width in rem
         *  @param {boolean} [bWithOverlay]
         *  If the state is EXP the overlay appears according to this parameter (the default is true)
         */
        ShellHeader.prototype.setSearchState = function (sStateName, maxRemSize, bWithOverlay) {
            if (typeof sStateName !== "string" || !this.SearchState.hasOwnProperty(sStateName)) {
                //throw exp
                return;
            }
            this.requiredRemSize = maxRemSize;
            this.setProperty('searchState', sStateName, false);
            var actualMaxRemSize;
            if (sStateName == this.SearchState.COL) {
                actualMaxRemSize = this._handleColSearchState(true);
            } else if (sStateName == this.SearchState.EXP) {
                if (bWithOverlay == undefined || bWithOverlay == null) {
                    this.bWithOverlay = true;
                } else {
                    this.bWithOverlay = bWithOverlay;
                }
                actualMaxRemSize = this._handleExpSearchState(maxRemSize, true);
            } else if (sStateName == this.SearchState.EXP_S) {
                actualMaxRemSize = this._handleExpSSearchState(maxRemSize, true);
            }

            this._setSearchContainerMaxSize(actualMaxRemSize, true);
        };

        /**
         * returns the current available size in the header without hiding any elements
         */
        ShellHeader.prototype.getSearchAvailableSize = function () {
            var availableSizeToAppTitle = this._convertPxToRem(this._getSizeToAppTitle());
            var searchAvailableSize = availableSizeToAppTitle - this._getMinPaddingRemSize();
            return (searchAvailableSize >= 0 ? searchAvailableSize : 0) ;
        };

        ShellHeader.prototype._getSizeToAppTitle = function() {
            var oCenterJQ = this.$("hdr-center");
            var oCenterElement = oCenterJQ[0];
            var oAppTitleJQ = this.$("hdr-appTitle").find(".sapUshellAppTitle");
            var oAppTitleElement = oAppTitleJQ[0];
            var iMaximumSizeToAppTitle;
            if (this._rtl) {
                iMaximumSizeToAppTitle = oAppTitleElement ? oAppTitleElement.getBoundingClientRect().left - oCenterElement.getBoundingClientRect().left : this._getSizeToTitle();
            } else {
                iMaximumSizeToAppTitle = oAppTitleElement ? oCenterElement.getBoundingClientRect().right - oAppTitleElement.getBoundingClientRect().right : this._getSizeToTitle();
            }

            return iMaximumSizeToAppTitle;
        };

        ShellHeader.prototype._getSizeToTitle = function() {
            var oCenterJQ = this.$("hdr-center");
            var oCenterElement = oCenterJQ[0];
            var oTitleJQ = this.$("hdr-title").find(".sapUshellHeadTitle");
            var oTitleElement = oTitleJQ[0];
            var iMaximumSizeToTitle;
            if (this._rtl) {
                iMaximumSizeToTitle = oTitleElement ? oTitleElement.getBoundingClientRect().left - oCenterElement.getBoundingClientRect().left : this._getSizeToLogo();
            } else {
                iMaximumSizeToTitle = oTitleElement ? oCenterElement.getBoundingClientRect().right - oTitleElement.getBoundingClientRect().right : this._getSizeToLogo();
            }
            return iMaximumSizeToTitle;
        };

        ShellHeader.prototype._getSizeToLogo = function() {
            var oCenterJQ = this.$("hdr-center");
            var oCenterElement = oCenterJQ[0];
            var oCenterElementWidth = oCenterElement.getBoundingClientRect().width + this._getSearchButtonWidth();
            var oLogoJQ = this.$("hdr-begin").find(".sapUshellShellIco");
            var oLogoElement = oLogoJQ[0];
            var bLogoHidden = false;
            if (this.hasStyleClass("sapUshellShellHideLogo")) {
                bLogoHidden = true;
            }
            //if the logo was already hidden (due to search opening) -> need to remove from the center width the logoWidth + the left padding
            if (oLogoElement && bLogoHidden) {
                var iLogoPadding = this._rtl ? iLogoPaddingRight : iLogoPaddingLeft;
                return oCenterElementWidth - iLogoSize - iLogoPadding;
            } else {
                //need to add the logo right padding since it is not part of the center
                var iLogoPadding = this._rtl ? iLogoPaddingLeft : iLogoPaddingRight;
                return oCenterElementWidth + iLogoPadding;
            }
        };

        ShellHeader.prototype._getMaxSize = function() {
            var oCenterJQ = this.$("hdr-center");
            var oCenterElement = oCenterJQ[0];
            var oLogoJQ = this.$("hdr-begin").find(".sapUshellShellIco");
            var oLogoElement = oLogoJQ[0];
            var bLogoHidden = false;
            if (this.hasStyleClass("sapUshellShellHideLogo")) {
                bLogoHidden = true;
            }
            var iSavedLogoSize;
            if (oLogoElement && !bLogoHidden) {
                var iLogoPadding = this._rtl ? iLogoPaddingLeft : iLogoPaddingRight;
                iSavedLogoSize = iLogoSize + iLogoPadding;
            } else {
                iSavedLogoSize = 0;
            }
            var iMaxSize = oCenterElement.getBoundingClientRect().width + this._getSearchButtonWidth() + iSavedLogoSize;
            return iMaxSize;
        };

        //if the search button is not yet invisible -> need to add the button width to the center container
        ShellHeader.prototype._getSearchButtonWidth = function() {
            var oSearchButtonElement = this.getHeadEndItems()[0];
            if (oSearchButtonElement && oSearchButtonElement.getVisible()) {
                var oSearchButtonElementDom = oSearchButtonElement.getDomRef();
                var iSearchButtonWidth = oSearchButtonElementDom.getBoundingClientRect().width;
                return iSearchButtonWidth;
            }
            return 0;
        };

        ShellHeader.prototype._handleColSearchState = function (stateChanged) {
            var shellLayout = this.getParent();
            if (shellLayout) {
                shellLayout.removeStyleClass("sapUshellShellShowSearchOverlay");
            }

            this.removeStyleClass("sapUshellShellHideLogo");
            this.removeStyleClass("sapUshellShellHideSubtitle");
            this.removeStyleClass("sapUshellShellHideAppTitle");

            if (this.isPhoneState()) {
                return this._handleColSearchStatePhone();
            }

            return 0;
        };

        /* When we are in the EXP search state, there are some element in the header that should be hidden according to the search-container max-size.
         The appTitle is hidden if the distance of the search-container from the appTitle is smaller then MIN_PADDING_REM_VALUE.
         The title and the appTitle is hidden if the distance of the search-container from the title is smaller then MIN_PADDING_REM_VALUE.
         The logo, the title and the appTitle is hidden if the distance of the search-container from the logo is smaller then MIN_PADDING_REM_VALUE.
         Any other elements should not be hidden.
         If we are in small size (phone state) -> the search-container gets the size of the whole header (100%)

         The return value will be the actual size the search-container gets or the required size if we are in small size (phone state)
         */
        ShellHeader.prototype._handleExpSearchState = function (requiredMaxRemSize, stateChanged) {
            if (this.isPhoneState()) {
                this._handleExpAndExpSSearchStatePhone();
                return requiredMaxRemSize;
            } else {
                return this._handleExpSearchStateLargeScreen(requiredMaxRemSize, stateChanged);
            }
        };

        ShellHeader.prototype._handleExpSearchStateLargeScreen = function (requiredMaxRemSize, stateChanged) {
            var actualMaxRemSize;

            this.removeStyleClass("sapUshellShellHideForPhone");

            var shellLayout = this.getParent();
            if (shellLayout && this.bWithOverlay) {
                shellLayout.addStyleClass("sapUshellShellShowSearchOverlay");
            }
            var iMaximumSizeInRem = this._convertPxToRem(this._getMaxSize());
            var iMaximumSizeToTileInRem = this._convertPxToRem(this._getSizeToTitle());
            var iMaximumSizeToAppTitleInRem = this._convertPxToRem(this._getSizeToAppTitle());
            var iMaximumSizeToLogoInRem = this._convertPxToRem(this._getSizeToLogo());

            if (requiredMaxRemSize > iMaximumSizeInRem) {
                this.addStyleClass("sapUshellShellHideLogo");
                this.addStyleClass("sapUshellShellHideSubtitle");
                this.addStyleClass("sapUshellShellHideAppTitle");
                actualMaxRemSize = iMaximumSizeInRem;
            } else if (requiredMaxRemSize > iMaximumSizeToLogoInRem - this._getMinPaddingRemSize()) {
                this.addStyleClass("sapUshellShellHideLogo");
                this.addStyleClass("sapUshellShellHideSubtitle");
                this.addStyleClass("sapUshellShellHideAppTitle");
                actualMaxRemSize = requiredMaxRemSize;

            } else if (requiredMaxRemSize > iMaximumSizeToTileInRem - this._getMinPaddingRemSize()) {
                this.addStyleClass("sapUshellShellHideSubtitle");
                this.addStyleClass("sapUshellShellHideAppTitle");
                this.removeStyleClass("sapUshellShellHideLogo");
                actualMaxRemSize = requiredMaxRemSize;
            } else if (requiredMaxRemSize > iMaximumSizeToAppTitleInRem - this._getMinPaddingRemSize()) {
                this.addStyleClass("sapUshellShellHideAppTitle");
                this.removeStyleClass("sapUshellShellHideSubtitle");
                this.removeStyleClass("sapUshellShellHideLogo");
                actualMaxRemSize = requiredMaxRemSize;
            } else {
                this.removeStyleClass("sapUshellShellHideAppTitle");
                this.removeStyleClass("sapUshellShellHideSubtitle");
                this.removeStyleClass("sapUshellShellHideLogo");
                actualMaxRemSize = requiredMaxRemSize;
            }
            return actualMaxRemSize;
        };

        /* When we are in the EXP_S search state, no element in the header should be hidden
         The search-container max-size is calculate according to the maximum space there is that will not hide the elements in the header
         */
        ShellHeader.prototype._handleExpSSearchState = function (requiredMaxRemSize, stateChanged) {
            var shellLayout = this.getParent();
            if (shellLayout) {
                shellLayout.removeStyleClass("sapUshellShellShowSearchOverlay");
            }
            if (this.isPhoneState()) {
                this._handleExpAndExpSSearchStatePhone();
                return requiredMaxRemSize;
            } else {
                var actualMaxRemSize = this._handleExpSSearchStateLargeScreen(requiredMaxRemSize, stateChanged);
                if (actualMaxRemSize > this.requiredRemSize) {
                    actualMaxRemSize = this.requiredRemSize;
                }
                return actualMaxRemSize;
            }
        };

        ShellHeader.prototype._handleExpSSearchStateLargeScreen = function (requiredMaxRemSize, stateChanged) {
            var actualMaxRemSize;
            this.removeStyleClass("sapUshellShellHideForPhone");

            var iMaximumSizeInRem = this._convertPxToRem(this._getSizeToAppTitle());
            if (iMaximumSizeInRem - this._getMinPaddingRemSize() < this.MIN_REM_VALUE_FOR_SEARCH_CONTAINER_SIZE) {
                iMaximumSizeInRem = this.MIN_REM_VALUE_FOR_SEARCH_CONTAINER_SIZE  + this._getMinPaddingRemSize();
            }
            if (!requiredMaxRemSize) {
                requiredMaxRemSize = iMaximumSizeInRem;
            }

            if (requiredMaxRemSize > iMaximumSizeInRem -  this._getMinPaddingRemSize()) {
                actualMaxRemSize = iMaximumSizeInRem -  this._getMinPaddingRemSize();
            } else {
                actualMaxRemSize = requiredMaxRemSize;
            }

            this.removeStyleClass("sapUshellShellHideLogo");
            this.removeStyleClass("sapUshellShellHideSubtitle");
            this.removeStyleClass("sapUshellShellHideAppTitle");
            return actualMaxRemSize;
        };

        ShellHeader.prototype._handleExpAndExpSSearchStatePhone = function () {
            this.addStyleClass("sapUshellShellHideForPhone");
            var shellLayout = this.getParent();
            if (shellLayout && this.getSearchState() == this.SearchState.EXP && this.bWithOverlay) {
                shellLayout.addStyleClass("sapUshellShellShowSearchOverlay");
            }
        };

        ShellHeader.prototype._handleColSearchStatePhone = function () {
            this.removeStyleClass("sapUshellShellHideForPhone");
            return 0;
        };

        ShellHeader.prototype._setSearchContainerMaxSize = function (actualMaxRemSize, stateChanged) {
            if (!stateChanged) {
                var oSearchContainerElement = this.$("hdr-search-container");
                oSearchContainerElement.css( "max-width", actualMaxRemSize + "rem" );

                iSearchMaxWidthValue = iNextSearchMaxWidthValue = actualMaxRemSize;
            } else {
                iNextSearchMaxWidthValue = actualMaxRemSize;
            }
            this._adjustHeaderWithSearch(actualMaxRemSize);
        };


        /*The function return the minimum distance we want to keep between the search container and the closet header element (title, appTitle or logo)
          If there is enough space (meaning the distance to the appTitle is at least 6rem, the return value will be 3rem, else the return value will be 0.5rem
         */
        ShellHeader.prototype._getMinPaddingRemSize = function () {
           if (this._convertPxToRem(this._getSizeToAppTitle()) < this.MIN_REM_VALUE_FOR_SEARCH_CONTAINER_SIZE) {
               return this.MIN_PADDING_REM_VALUE_SMALL_FOR_SEARCH;
           } else {
               return this.MIN_PADDING_REM_VALUE_LARGE;
           }
        };

        /*
        If there is no enough space for the search container (MIN_REM_VALUE_FOR_SEARCH_CONTAINER_SIZE) we will be at phone-state
        (no header elements except search-container).
        We need to save the phone-state threshold to indicate in resize if we need to exit this state
         */
        ShellHeader.prototype._saveSearchPhoneStateThreshold = function () {
            if (this.hasStyleClass("sapUshellShellHideForPhone")) {
                return;
            }
            var iSearchAvailableSize = this.getSearchAvailableSize();
            if (iSearchAvailableSize == 0) {
                iSearchAvailableSize = -this.MIN_PADDING_REM_VALUE_SMALL_FOR_SEARCH;
            }

            //check if we can truncate the appTitle (up to it minimum value)
            var iMaxRemToRemoveFromAppTitle = this._maxRemToRemoveFromAppTitle();
            if (iSearchAvailableSize + iMaxRemToRemoveFromAppTitle < this.MIN_REM_VALUE_FOR_SEARCH_CONTAINER_SIZE) {
                var iHeaderWidth =  this.$().width();
                iSearchPhoneStateThreshold = iHeaderWidth + this._convertRemToPx(this.MIN_REM_VALUE_FOR_SEARCH_CONTAINER_SIZE - iSearchAvailableSize - iMaxRemToRemoveFromAppTitle);
            }
            return iSearchPhoneStateThreshold;

        };

        /*
         return how much rem we can truncate from the appTitle in order to keep the minimum width value.
         */
        ShellHeader.prototype._maxRemToRemoveFromAppTitle = function () {
            var jqAppTitle = this.$("hdr-appTitle");
            var jqAppTitleSpan = jqAppTitle.find(".sapUshellHeadTitle");

            if (!jqAppTitle.length || !jqAppTitleSpan.length) {
                return 0;
            }

            var iAppTitleWidth = this._convertPxToRem(jqAppTitleSpan[0].getBoundingClientRect().width);
            var iMaxRemToRemove = (iAppTitleWidth - this.APP_TITLE_MIN_VALUE) > 0 ? (iAppTitleWidth - this.APP_TITLE_MIN_VALUE) : 0;
            return iMaxRemToRemove;
        };

        /**
         * The function checks if 2 header elements are overlapping. If the elements overlapping each other the function return
         * in how much px the elements overlapping each other. If not the function return 0
         * @param firstElementRect - the first element rect from the left (in rtl the first element from the right)
         * @param jqSecondElement - the second element rect from the left (in rtl the second element from the right)
         * @param iPaddingInRem - the padding value in rem, if there is s need to keep padding value between the elements
         * @param bPaddingAddToFirst - is set to true if the padding is added to the first element or the second one
         * @private
         */
        ShellHeader.prototype._isOverlapping = function (firstElementRect, secondElementRect, iPaddingInRem, bPaddingAddToFirst) {
            if (!iPaddingInRem) {
                iPaddingInRem = 0;
            }

            if (this._rtl) {
                var jqFirstElementLeft =  firstElementRect.left;
                var jqSecondElementRight = secondElementRect.right;
                if (bPaddingAddToFirst) {
                    //we want to add the padding to the first element and since we are in rtl -> the padding is removed from the left side of the first element
                    jqFirstElementLeft = jqFirstElementLeft - this._convertRemToPx(iPaddingInRem);
                } else {
                    jqSecondElementRight = jqSecondElementRight + this._convertRemToPx(iPaddingInRem);
                }
                if (jqFirstElementLeft < jqSecondElementRight) {

                    return jqSecondElementRight - jqFirstElementLeft;

                }
            } else {
                var jqFirstElementRight = firstElementRect.right;
                var jqSecondElementLeft = secondElementRect.left;
                if (bPaddingAddToFirst) {
                    jqFirstElementRight = jqFirstElementRight + this._convertRemToPx(iPaddingInRem);
                } else {
                    //we want to add the padding to the second element -> the padding is remove from the left side of the second element
                    jqSecondElementLeft = jqSecondElementLeft - this._convertRemToPx(iPaddingInRem);
                }
                if (jqSecondElementLeft < jqFirstElementRight) {
                    return jqFirstElementRight - jqSecondElementLeft;
                }
            }
            return 0;
        };

        return ShellHeader;

    }, /* bExport= */ true);
