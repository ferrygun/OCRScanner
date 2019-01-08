// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap, console, window, $ */
    /*jslint plusplus: true, nomen: true*/

    sap.ui.controller("sap.ushell.components.flp.launchpad.group_list.GroupList", {
        onInit : function () {
            this.sViewId = "#" + this.getView().getId();
            this.sGroupListId = "#" + this.getView().oGroupList.getId();
            this.handleScroll = this._fHandleScroll.bind(this);
        },
        onAfterRendering : function () {
            this.jqView = jQuery(this.sViewId);
            this.jgGroupList = jQuery(this.sGroupListId);

            var oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.unsubscribe("grouplist", "ScrollAnimationEnd", this._handleScrollAnimationEnd, this);
            oEventBus.subscribe("grouplist", "ScrollAnimationEnd", this._handleScrollAnimationEnd, this);
            oEventBus.unsubscribe("grouplist", "DashboardRerender", this._addScroll, this);
            oEventBus.subscribe("grouplist", "DashboardRerender", this._addScroll, this);
            oEventBus.unsubscribe("launchpad", "dashboardScroll", this.handleScroll, this);
            oEventBus.subscribe("launchpad", "dashboardScroll", this.handleScroll, this);

            this._addScroll();
        },

        _addScroll : function () {
            var that = this;

            //setTimeout is required because for some reason the event handler is not called when 'scroll' event is fired
            setTimeout(function () {
                this.dashboardElement = document.querySelector(".sapUshellDashboardView section");
                if (this.dashboardElement) {
                    this.dashboardElement.removeEventListener('scroll', that.handleScroll);
                    this.dashboardElement.addEventListener('scroll', that.handleScroll);
                }
            }.bind(this), 0);
        },

        _fHandleScroll : function () {
            var oModel = this.getView().getModel(),
                iTopViewPortGroupIndex = oModel.getProperty("/topGroupInViewPortIndex");

            // If scroll handler was called while performing a scroll-to-group action -
            // then nothing should be done except for tiles visibility calculation
            if (!oModel.getProperty("/scrollingToGroup")) {
                if (!oModel.getProperty("/groupList-skipScrollToGroup")) {
                    var groupItems = jQuery('#groupList li.sapUshellGroupLI');
                    var selectedGroupListItem = groupItems.removeClass('sapUshellSelected').eq(iTopViewPortGroupIndex);
                    selectedGroupListItem.addClass('sapUshellSelected');
                    var groupListScrollElement = document.getElementById('groupListPage-cont');
                    var groupListScrollTop = groupListScrollElement.scrollTop;
                    var groupListScrollBottom = groupListScrollTop + groupListScrollElement.offsetHeight;
                    var groupOffsetTop = selectedGroupListItem[0] ? selectedGroupListItem[0].offsetTop : undefined;
                    if (groupOffsetTop < groupListScrollTop) {
                        jQuery('#groupListPage section').animate({scrollTop: groupItems[iTopViewPortGroupIndex].offsetTop}, 0);
                    } else if (groupOffsetTop + selectedGroupListItem[0].offsetHeight > groupListScrollBottom) {
                        jQuery('#groupListPage section').animate({scrollTop: groupListScrollTop + groupItems[iTopViewPortGroupIndex].offsetHeight}, 0);
                    }
                }
                sap.ushell.utils.handleTilesVisibility();
            }
        },

        _handleGroupListItemPress : function (oEvent) {
            var oSource = oEvent.getSource(),
                focus;

            //to support accessibility tab order we set focus in press in case edit mode is off
            focus = oEvent.getParameter("action") === "sapenter";
            this._handleScrollToGroup(oSource, false, focus);
        },

        _handleScrollToGroup : function (oGroupItem, groupChanged, focus) {
            if (!oGroupItem) {
                return;
            }
            var that = this;
            document.querySelector(".sapUshellDashboardView").removeEventListener('scroll', that.handleScroll);

            this._publishAsync("launchpad", "scrollToGroup", {
                group : oGroupItem,
                groupChanged : groupChanged,
                focus : focus
            });
        },

        _handleScrollAnimationEnd : function () {
            var that = this;
            document.querySelector(".sapUshellDashboardView").addEventListener('scroll', that.handleScroll);
            this.getView().getModel().setProperty("/scrollingToGroup", false);
        },

        _publishAsync : function (sChannelId, sEventId, oData) {
            var oBus = sap.ui.getCore().getEventBus();
            window.setTimeout($.proxy(oBus.publish, oBus, sChannelId, sEventId, oData), 1);
        }
    });


}, /* bExport= */ true);
