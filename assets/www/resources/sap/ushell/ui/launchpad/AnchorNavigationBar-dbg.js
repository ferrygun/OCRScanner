/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

// Provides control sap.ushell.ui.launchpad.AnchorNavigationBar.
sap.ui.define(['sap/m/Bar','sap/ushell/library','sap/ushell/override'],
	function(Bar, library, override) {
	"use strict";

/**
 * Constructor for a new ui/launchpad/AnchorNavigationBar.
 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given 
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * Add your documentation for the newui/launchpad/AnchorNavigationBar
 * @extends sap.m.Bar
 *
 * @constructor
 * @public
 * @name sap.ushell.ui.launchpad.AnchorNavigationBar
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
var AnchorNavigationBar = Bar.extend("sap.ushell.ui.launchpad.AnchorNavigationBar", /** @lends sap.ushell.ui.launchpad.AnchorNavigationBar.prototype */ { metadata : {

	library : "sap.ushell",
	properties : {

		/**
		 * A value for an optional accessibility label
		 */
		accessibilityLabel : {type : "string", defaultValue : null},

		/**
		 */
		selectedItemIndex : {type : "int", group : "Misc", defaultValue : 0},

		/**
		 */
		overflowEnabled : {type : "boolean", group : "Misc", defaultValue : true}
	},
	aggregations : {

		/**
		 */
		groups : {type : "sap.ushell.ui.launchpad.AnchorItem", multiple : true, singularName : "group"}
	},
	events : {

		/**
		 */
		afterRendering : {}, 

		/**
		 */
		itemPress : {}
	}
}});

/**
 * @name sap.ushell.ui.launchpad.AnchorNavigationBar
 *
 * @private
 */
/*global jQuery, sap*/

    // Overwrite update function (version without filter/sort support)
    var fnUpdateGroups = override.updateAggregatesFactory("groups");
    AnchorNavigationBar.prototype.updateGroups = function () {
        fnUpdateGroups.apply(this, arguments);
        if (this.getDomRef() && this.getGroups().length) {
            this.reArrangeNavigationBarElements();
        }
    };

    AnchorNavigationBar.prototype.init = function () {
        sap.ui.Device.resize.attachHandler(this.reArrangeNavigationBarElements, this);
        this.bGroupWasPressed = false;
        this.bIsRtl = sap.ui.getCore().getConfiguration().getRTL();

    };

    AnchorNavigationBar.prototype.handleExit = function () {
        if (this.oPopover) {
            this.oPopover.destroy();
        }
        if (this.oOverflowButton) {
            this.oOverflowButton.destroy();
        }
    };

    AnchorNavigationBar.prototype.updateVisibility = function () {
        var aGroups = this.getGroups(),
            visibleGroupsCounter = 0;

        for (var i = 0; i < aGroups.length; i++) {
            if (aGroups[i].getProperty("visible")) {
                visibleGroupsCounter++;
            }
        }

        if (visibleGroupsCounter > 1) {
            this.$().removeClass("sapUshellAnchorNavigationBarInvisible");
            this.$().next().removeClass("sapUshellSectionNoTop");
        } else {
            this.$().addClass("sapUshellAnchorNavigationBarInvisible");
            this.$().next().addClass("sapUshellSectionNoTop");
        }
    };

    AnchorNavigationBar.prototype.onAfterRendering = function () {
        this.reArrangeNavigationBarElements();
        var selectedItemIndex = this.getSelectedItemIndex() || 0;
        //call adjustItemSelection with timeout since after deletion of group
        //the dashboard scrolls and changes the selection wrongly
        //so wait a bit for the scroll and then adjust the selection
        setTimeout(function () {
            this.adjustItemSelection(selectedItemIndex);
        }.bind(this), 100);

        var aGroups = this.getGroups(),
            that = this;

        jQuery.each(aGroups, function (index, aGroup) {
            this.attachPress(function (oEvent) {
                that.fireItemPress({group: oEvent.getSource(), manualPress: true});
                that.bGroupWasPressed = true;
            });
        });
        if (this.bIsRtl) {
            jQuery(".sapUshellAnchorNavigationBarItemsScroll").addClass("sapUshellRtl");
        }
        jQuery(".sapUshellAnchorNavigationBarItemsScroll").scroll(this.setNavigationBarItemsVisibility.bind(this));
        this.updateVisibility();
        jQuery(".sapUshellAnchorItem:visible:first").attr("accesskey", "h");
    };

    AnchorNavigationBar.prototype.openOverflowPopup = function () {
        var overflowOpened = jQuery('.sapUshellAnchorItemOverFlow').hasClass("sapUshellAnchorItemOverFlowOpen");
        if (this.oOverflowButton && !overflowOpened) {
            this.oOverflowButton.firePress();
        }
    };

    AnchorNavigationBar.prototype.closeOverflowPopup = function () {
        if (this.oPopover){
            this.oPopover.close();
        }
    };

    AnchorNavigationBar.prototype.reArrangeNavigationBarElements = function () {
        this.anchorItems =  this.getVisibleGroups();
        var selectedItemIndex = this.getSelectedItemIndex() || 0;

        if (this.anchorItems.length) {
            //Make sure only one item is selected at a time
            this.adjustItemSelection(selectedItemIndex);
        }

        if (sap.ui.Device.system.phone && this.anchorItems.length) {
            this.anchorItems.forEach(function (oItem, index) {
                oItem.setIsGroupVisible(false);
            });
            this.anchorItems[this.getSelectedItemIndex()].setIsGroupVisible(true);
        } else {
            setTimeout(function () {
                this.setNavigationBarItemsVisibility();
            }.bind(this), 200);
        }
        this._adjustAnchorBarAriaProperties(this.anchorItems);
    };

    AnchorNavigationBar.prototype._scrollToGroupByGroupIndex = function (groupIndex, speed) {
        var anchorBar = sap.ui.Device.system.tablet ? jQuery(".sapUshellAnchorNavigationBarItemsScroll") : jQuery(".sapUshellAnchorNavigationBarItems"),
            anchorBarOffset = anchorBar.offset() ? anchorBar.offset().left : 0,
            jsSelectedItem = this.anchorItems[groupIndex].getDomRef(),
            oModel = this.getModel(),
            bMinimalAnimationMode = oModel.getProperty('/animationMode') === 'minimal',
            scrollSpeed = speed ? speed : 200,
            iAnimationDuration = bMinimalAnimationMode ? 0 : scrollSpeed,
            selectedItemOffset,
            scrollValueX;

        if (jsSelectedItem) {
            selectedItemOffset = jsSelectedItem.offsetLeft;
            //In RTL offsetLeft of the container and the inner item is not enough to calculate the scrollLeft position
            //Since the offsets of the elements can get large negative values, but scrollLeft will be always set to 0 in case of negative value
            //In order to calculate the relative scroll position of item inside the anchor bar, we calculate here the overall
            //Width of the anchor items and then add the selected group offset to it, by that preventing the scroll value from getting negative
            scrollValueX = this.bIsRtl ? this._normalizeScrollBarWidth() + selectedItemOffset + 64 : selectedItemOffset - anchorBarOffset - 48; // add 2rem space + 1rem padding for the left overflow arrow
            anchorBar.animate({scrollLeft : scrollValueX}, iAnimationDuration, this.setNavigationBarItemsVisibility.bind(this));
        }
    };
    /*
        Sums and returns all anchor items width values
     */
    AnchorNavigationBar.prototype._normalizeScrollBarWidth = function () {
        var iLastItemOffset = this.anchorItems[this.anchorItems.length - 1].getDomRef().offsetLeft,
            iFirstItemOffset = this.anchorItems[0].getDomRef().offsetLeft,
            iTotalItemsWidth = Math.abs(iLastItemOffset) - Math.abs(iFirstItemOffset);
            return iTotalItemsWidth;
    };

    AnchorNavigationBar.prototype.setNavigationBarItemsVisibility = function () {
        if (!sap.ui.Device.system.phone) {
            //check if to show or hide the popover overflow button
            if (this.anchorItems.length && (!this.isMostRightAnchorItemVisible() || !this.isMostLeftAnchorItemVisible()) || sap.ui.Device.system.phone) {
                this.oOverflowButton.removeStyleClass("sapUshellShellHidden");
                jQuery('.sapUshellAnchorItemOverFlow').removeClass("sapUshellShellHidden");
            } else if (this.oOverflowButton) {
                this.oOverflowButton.addStyleClass("sapUshellShellHidden");
                jQuery('.sapUshellAnchorItemOverFlow').addClass("sapUshellShellHidden");
            }
            //add left / right overflow indication on anchor items with respect to locale direction
            if (this.bIsRtl) {
                if (this.anchorItems.length && !this.isMostLeftAnchorItemVisible()) {
                    this.oOverflowRightButton.removeStyleClass("sapUshellShellHidden");
                    jQuery(".sapUshellAnchorNavigationBarItems").addClass("sapUshellOverflowLeft");
                } else if (this.oOverflowRightButton) {
                    this.oOverflowRightButton.addStyleClass("sapUshellShellHidden");
                    jQuery(".sapUshellAnchorNavigationBarItems").removeClass("sapUshellOverflowLeft");
                }
                if (this.anchorItems.length && !this.isMostRightAnchorItemVisible()) {
                    this.oOverflowLeftButton.removeStyleClass("sapUshellShellHidden");
                    jQuery(".sapUshellAnchorNavigationBarItems").addClass("sapUshellOverflowRight");
                } else if (this.oOverflowLeftButton) {
                    this.oOverflowLeftButton.addStyleClass("sapUshellShellHidden");
                    jQuery(".sapUshellAnchorNavigationBarItems").removeClass("sapUshellOverflowRight");
                }
            } else {

                if (this.anchorItems.length && !this.isMostLeftAnchorItemVisible()) {
                    this.oOverflowLeftButton.removeStyleClass("sapUshellShellHidden");
                    jQuery(".sapUshellAnchorNavigationBarItems").addClass("sapUshellOverflowLeft");
                } else if (this.oOverflowLeftButton) {
                    this.oOverflowLeftButton.addStyleClass("sapUshellShellHidden");
                    jQuery(".sapUshellAnchorNavigationBarItems").removeClass("sapUshellOverflowLeft");
                }
                if (this.anchorItems.length && !this.isMostRightAnchorItemVisible()) {
                    this.oOverflowRightButton.removeStyleClass("sapUshellShellHidden");
                    jQuery(".sapUshellAnchorNavigationBarItems").addClass("sapUshellOverflowRight");
                } else if (this.oOverflowRightButton) {
                    this.oOverflowRightButton.addStyleClass("sapUshellShellHidden");
                    jQuery(".sapUshellAnchorNavigationBarItems").removeClass("sapUshellOverflowRight");
                }
            }

            //remove the left padding from the first visible item
            jQuery(".sapUshellAnchorItem.firstItem").removeClass("firstItem");
            var jqFirstVisibleItem = jQuery(".sapUshellAnchorItem:visible").first();
            jqFirstVisibleItem.addClass("firstItem");
        } else {
            if (this.anchorItems.length) {
                this.oOverflowButton.removeStyleClass("sapUshellShellHidden");
                var selectedItemIndex = this.getSelectedItemIndex() || 0;
                if (this.oPopover){
                    this.oPopover.setTitle(this.anchorItems[selectedItemIndex].getTitle());
                }
            }
        }
    };

    AnchorNavigationBar.prototype.adjustItemSelection = function (iSelectedIndex) {
        setTimeout(function () {
            if (this.anchorItems && this.anchorItems.length) {
                this.anchorItems.forEach(function (oItem) {
                    oItem.setSelected(false);
                });
                this.anchorItems[iSelectedIndex].setSelected(true);

                //scroll to group
                this._scrollToGroupByGroupIndex(iSelectedIndex);
            }
        }.bind(this), 200);
    };

    AnchorNavigationBar.prototype.isMostRightAnchorItemVisible = function () {
        var jqNavigationBar = jQuery('.sapUshellAnchorNavigationBar'),
            navigationBarWidth = !jQuery.isEmptyObject(jqNavigationBar) ? jqNavigationBar.width() : 0,
            navigationBarOffset = !jQuery.isEmptyObject(jqNavigationBar) && jqNavigationBar.offset() ?
                jqNavigationBar.offset().left : 0,
            lastItem = this.bIsRtl ? this.anchorItems[0].getDomRef() : this.anchorItems[this.anchorItems.length - 1].getDomRef(),
            lastItemWidth = !jQuery.isEmptyObject(lastItem) ? jQuery(lastItem).width() : 0,
            lastItemOffset;
        //when the anchor bar isn't visible, the items gets negative width
        //use the minimal width for items instead
        if (lastItemWidth < 0) {
            lastItemWidth = 80;
        }
        lastItemOffset = lastItem && jQuery(lastItem).offset() ? jQuery(lastItem).offset().left : 0;

        //last item is completely shown in the navigation bar
        if (lastItemOffset + lastItemWidth <= navigationBarOffset +  navigationBarWidth) {
            return true;
        }
        return false;
    };

    AnchorNavigationBar.prototype.isMostLeftAnchorItemVisible = function () {
        var jqNavigationBar = jQuery('.sapUshellAnchorNavigationBar'),
            navigationBarOffsetLeft = !jQuery.isEmptyObject(jqNavigationBar) && jqNavigationBar.offset() ? jqNavigationBar.offset().left : 0,
            firstItem = this.bIsRtl ? this.anchorItems[this.anchorItems.length - 1].getDomRef() : this.anchorItems[0].getDomRef(),
            firstItemOffset = !jQuery.isEmptyObject(firstItem) && jQuery(firstItem).offset() ? jQuery(firstItem).offset().left : 0;

        //last item is not completely shown in the navigation bar
        if (firstItemOffset >= navigationBarOffsetLeft) {
            return true;
        }
        return false;
    };

    AnchorNavigationBar.prototype.setSelectedItemIndex = function (iSelectedIndex) {
        if (iSelectedIndex !== undefined) {
            this.setProperty("selectedItemIndex", iSelectedIndex, true);
        }
    };

    AnchorNavigationBar.prototype.setOverflowEnabled = function (bEnabled) {
        this.setProperty("overflowEnabled", bEnabled, true);
        if (this.oOverflowButton){
            this.oOverflowButton.setEnabled(bEnabled);
        }
    };

    AnchorNavigationBar.prototype._getOverflowLeftArrowButton = function () {
        this.oOverflowLeftButton = new sap.m.Button({
            icon: 'sap-icon://slim-arrow-left',
            tooltip: sap.ushell.resources.i18n.getText("scroll_beginning"),
            press: function (oEvent) {
                this._scrollToGroupByGroupIndex(0);
            }.bind(this)
        }).addStyleClass("sapUshellShellHidden");

        return this.oOverflowLeftButton;
    };

    AnchorNavigationBar.prototype._getOverflowRightArrowButton = function () {
        this.oOverflowRightButton = new sap.m.Button({
            icon: 'sap-icon://slim-arrow-right',
            tooltip: sap.ushell.resources.i18n.getText("scroll_end"),
            press: function (oEvent) {
                this._scrollToGroupByGroupIndex(this.anchorItems.length - 1);
            }.bind(this)
        }).addStyleClass("sapUshellShellHidden");

        return this.oOverflowRightButton;
    };

    AnchorNavigationBar.prototype._getOverflowButton = function () {
        // if already created - no need to create new button (same applies for popover)
        if (this.oOverflowButton) {
            return this.oOverflowButton;
        }

        this.oOverflowButton = new sap.m.Button("sapUshellAnchorBarOverflowButton",{
            icon: 'sap-icon://slim-arrow-down',
            tooltip: sap.ushell.resources.i18n.getText("more_groups"),
            enabled: this.getOverflowEnabled(),
            press: function (oEvent) {
                if (!this.oPopover){
                    this._initPopover();
                }
                /*
                 * UX requirement is that every click on the button will open/close the popover (according to its state)
                 *
                 * Due to a bug, which every click on the overflow button first causes event of onFocusOut on the Popover,
                 * every click on the button closed the popup and opened it again.
                 * There was a similar issue in the ShellAppTitle.
                 *
                 * After consulting Alexander Pashkov, and trying almost every feasible approach, this is the only
                 * stable fix we found.
                 *
                 * Meaning a different behavior for desktop & non-desktop devices
                 */
                var bOpen = false;
                var bClose = false;

                // if popover already open - close it
                // the above comments related only to IE , incidents:1680106054, 1780129003
                if(!sap.ui.Device.browser.internet_explorer) {
                    if (this.oPopover.isOpen()) {
                        bClose = true;
                    } else {
                        bOpen = true;
                    }
                }else{
                    if (!this.bOverFlowBtnClick) {
                        bOpen = true;
                    } else {
                        this.bOverFlowBtnClick = false;
                    }
                }

                // if we need to close the popover
                if (bClose) {
                    this.oPopover.close();
                } else if (bOpen) {
                    var oList = this.oPopover.getContent()[0];
                    // if we need to open the popover
                    this.anchorItems = this.getVisibleGroups();
                    oList.setModel(this.getModel());
                    var bActionModeActive = this.getModel().getProperty("/tileActionModeActive");
                    var visibleGroupFilter = new sap.ui.model.Filter('', 'EQ', 'a');
                    visibleGroupFilter.fnTest = function (itemModel) {
                        //Empty groups should not be displayed when personalization is off or if they are locked or default group not in action mode
                        if (!itemModel.visibilityModes[bActionModeActive ? 1 : 0]) {
                            return false;
                        }
                        return itemModel.isGroupVisible || bActionModeActive;
                    }.bind(this);
                    oList.bindItems({
                        path: "/groups",
                        template: new sap.ushell.ui.launchpad.GroupListItem({
                            title: "{title}",
                            groupId: "{groupId}",
                            index : "{index}"
                        }),
                        filters:[visibleGroupFilter]
                    });
                    var sSelectedGroupId = jQuery(".sapUshellAnchorItemSelected").attr("id");
                    var oSelectedGroup = sap.ui.getCore().byId(sSelectedGroupId);
                    jQuery.each(oList.getItems(), function(i, item) {
                        if (oSelectedGroup.mProperties.groupId === item.mProperties.groupId) {
                            item.addStyleClass("sapUshellAnchorPopoverItemSelected");
                        } else {
                            item.addStyleClass("sapUshellAnchorPopoverItemNonSelected");
                        }
                    });
                    jQuery('.sapUshellAnchorItemOverFlow').toggleClass("sapUshellAnchorItemOverFlowPressed", true);
                    this.oPopover.openBy(this.oOverflowButton);
                }
            }.bind(this)
        }).addStyleClass("sapUshellShellHidden").addStyleClass('sapContrastPlus');

        return this.oOverflowButton;
    };

    AnchorNavigationBar.prototype._initPopover = function () {
        var that = this;
        var oList = new sap.m.List({
            mode: sap.m.ListMode.SingleSelectMaster,
            rememberSelections: false,
            selectionChange: function (oEvent) {
                that.fireItemPress({group: oEvent.getParameter('listItem')});
                that.oPopover.close();
            }
        });

        // This parameter will be 'true' ONLY IF the click to close popover came from the overflow button
        // (see this.oPopover before close handler)
        this.bOverFlowBtnClick = false;

        this.oPopover = new sap.m.Popover("sapUshellAnchorBarOverflowPopover",{
            showArrow: false,
            showHeader: false,
            placement: "Left",
            content: [oList],
            horizontalScrolling: false,
            beforeOpen: function () {
                jQuery('.sapUshellAnchorItemOverFlow').addClass("sapUshellAnchorItemOverFlowOpen");
                //place the popover under the overflow button
                var jqOverflowBtn = jQuery(".sapUshellAnchorItemOverFlow"),
                    bIsRtl = sap.ui.getCore().getConfiguration().getRTL(),
                    offset = bIsRtl ? -1 * jqOverflowBtn.outerWidth() : jqOverflowBtn.outerWidth();
                this.setOffsetX(offset);
            },
            beforeClose: function () {
                // By using document.activeElement.id we can identify what is the element
                // that the user clicked on in order to close the popover
                // if he clicked on the overflow button, the flag will turn to true
                if (document.activeElement.id === this.oOverflowButton.getId()) {
                    this.bOverFlowBtnClick = true;
                }
            }.bind(this),
            afterClose: function () {
                jQuery('.sapUshellAnchorItemOverFlow').removeClass("sapUshellAnchorItemOverFlowOpen");
                jQuery('.sapUshellAnchorItemOverFlow').toggleClass("sapUshellAnchorItemOverFlowPressed", false);
            }
        }).addStyleClass("sapUshellAnchorItemsPopover")
            .addStyleClass('sapContrastPlus');

    };

    AnchorNavigationBar.prototype.getVisibleGroups = function () {
        return this.getGroups().filter(function (oGroup) {
            return oGroup.getVisible();
        });
    };

    AnchorNavigationBar.prototype._adjustAnchorBarAriaProperties = function (aGroups) {
        var i;

        for (i = 0; i < aGroups.length; i++) {
            var jsGroup = jQuery(aGroups[i].getDomRef());
            jsGroup.attr("aria-posinset", i + 1);
            jsGroup.attr("aria-setsize", aGroups.length);
        }
    };

    AnchorNavigationBar.prototype.exit = function () {
        if (this.oOverflowLeftButton){
            this.oOverflowLeftButton.destroy();
        }
        if (this.oOverflowRightButton){
            this.oOverflowRightButton.destroy();
        }
        if (this.oOverflowButton){
            this.oOverflowButton.destroy();
        }
        if (this.oPopover){
            this.oPopover.destroy();
        }
    };




	return AnchorNavigationBar;

});
