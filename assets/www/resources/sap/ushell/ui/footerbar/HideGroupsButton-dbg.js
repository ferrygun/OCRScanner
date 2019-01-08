/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

// Provides control sap.ushell.ui.footerbar.HideGroupsButton.
sap.ui.define([
		'sap/ushell/library',
		'sap/ushell/resources',
		'sap/ushell/ui/launchpad/AccessibilityCustomData',
		'sap/ushell/ui/launchpad/ActionItem'
	], function(library, resources, AccessibilityCustomData, ActionItem) {
	"use strict";

/**
 * Constructor for a new ui/footerbar/HideGroupsButton.
 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given 
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * A button to hide groups from the dashboard, for the UShell footerbar.
 * @extends sap.ushell.ui.launchpad.ActionItem
 *
 * @constructor
 * @public
 * @name sap.ushell.ui.footerbar.HideGroupsButton
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
var HideGroupsButton = ActionItem.extend("sap.ushell.ui.footerbar.HideGroupsButton", /** @lends sap.ushell.ui.footerbar.HideGroupsButton.prototype */ { metadata : {

	library : "sap.ushell",
	events : {

		/**
		 */
		save : {}
	}
}});

    /*global jQuery, sap*/

    /**
     * @name sap.ushell.ui.footerbar.HideGroupsButton
     */
    /*HideGroupsButton.prototype.init = function () {
        //call the parent sap.ushell.ui.launchpad.ActionItem init method
        if (ActionItem.prototype.init) {
            ActionItem.prototype.init.apply(this, arguments);
        }
        this.setIcon('sap-icon://group-2');
        this.setTooltip(resources.i18n.getText("hideGroupsBtn_tooltip"));
        this.setText(resources.i18n.getText("hideGroupsBtn_title"));
        this.attachPress(this.openHideGroupsDialog);
    };

    HideGroupsButton.prototype.openHideGroupsDialog = function () {
        jQuery.sap.require("sap.m.Dialog");
        jQuery.sap.require("sap.m.Button");
        jQuery.sap.require("sap.m.Table");
        jQuery.sap.require("sap.m.Switch");

        var that = this;
        this.oModel = this.getModel();

        this.handleChange = function (event) {
            var parent = event.oSource.getParent(),
                groupPath = parent.getBindingContextPath(),
                group = this.oModel.getProperty(groupPath);

            // update new state in the local model
            var changedGroup = jQuery.grep(this.aGroupsStates, function (oGroup) {
                return oGroup.groupId === group.groupId;
            })[0];
            if (changedGroup) {
                changedGroup.isGroupVisible = !changedGroup.isGroupVisible;
            }

            parent.toggleStyleClass('sapUshellHideGroupsTableItem');
            parent.getCells()[0].toggleStyleClass('sapUshellHideGroupsDisabledCell');
        }.bind(this);

        //Default group and locked groups cannot be switched to hidden. 
        var switchVisibleFormatter = function (enabled, locked) {
            return enabled && !locked;
        };

        this.groupsTableTemplate = new sap.m.ColumnListItem({
            cells: [
                new sap.m.Text({text: "{title}"}),
                new sap.m.Switch({
                    visible: {parts: [{path : "isEnabled"}, {path : "isGroupLocked"}], formatter : switchVisibleFormatter},
                    change: that.handleChange,
                    customTextOff: " ",
                    customTextOn: " ",
                    tooltip: resources.i18n.getText("hideGroups_switchTooltip")
                })
            ]
        });

        this.groupsTable = new sap.m.Table("sapUshellHideGroupsTable", {
            backgroundDesign: sap.m.BackgroundDesign.Transparent,
            showSeparators: sap.m.ListSeparators.Inner,
            columns: [
                new sap.m.Column({
                    vAlign: "Middle"
                }),
                new sap.m.Column({
                    hAlign: sap.ui.core.TextAlign.Right,
                    vAlign: "Middle",
                    width: "4.94rem"
                })
            ]
        });
        this.groupsTable.addStyleClass('sapUshellHideGroupsTable');

        var oOrigOnAfterRendering = this.groupsTable.onAfterRendering;
        this.groupsTable.onAfterRendering = function (event) {
            oOrigOnAfterRendering.apply(that.groupsTable, arguments);

            var items = event.srcControl.mAggregations.items;
            if (items) {
                var model = items[0].getModel(),
                    i,
                    group;
                for (i = 0; i < items.length; i++) {
                    group = model.getProperty(items[i].getBindingContextPath()); //get the related binded group from the model
                    items[i].getCells()[1].setState(group.isGroupVisible);
                    if (group && group.isGroupLocked && (group.tiles.length === 0 || !sap.ushell.utils.groupHasVisibleTiles(group.tiles))) { //Locked groups which has no tiles are filted out from the dashboard, grouplist panel and hide groups popup (or has tiles not supported in current device)
                        items[i].setVisible(false);
                    } else if (!items[i].getCells()[1].getState()) { //if it is disabled, need to mark the row with different background color
                        items[i].addStyleClass('sapUshellHideGroupsTableItem');
                        items[i].getCells()[0].addStyleClass('sapUshellHideGroupsDisabledCell');
                    }
                }
            }
            setTimeout(function () {
                jQuery('.sapMListTblRow').first().focus();
            }, 200);
        };

        this.groupsTable.setModel(this.getModel());

        var personalizationEnabled = this.getModel().getProperty("/personalization");
        var emptyGroupFilter = [];
        //When personalization is disabled, empty groups should not appear in the Hide Groups dialog
        //(as they are also not appearing in the dashboard and group list)
        if (!personalizationEnabled) {
            emptyGroupFilter.push(new sap.ui.model.Filter("tiles/length", sap.ui.model.FilterOperator.GT, 0));
        }

        this.groupsTable.bindItems({
            path: "/groups",
            template: this.groupsTableTemplate,
            filters: emptyGroupFilter
        });

        this.saveButton = new sap.m.Button("saveBtn", {
            text: resources.i18n.getText("okBtn"),
            press: function () {

                setTimeout(function () {
                    var oModel = this.getModel();
                    var groups = that.aGroupsStates;

                    if (groups) {
                        var oLaunchPageSrv = sap.ushell.Container.getService("LaunchPage");
                        var aHiddenGroupsIDs = [],
                            i,
                            id;

                        for (i = 0; i < groups.length; i++) {
                            if (!groups[i].isGroupVisible) {
                                id = oLaunchPageSrv.getGroupId(groups[i].object);
                                aHiddenGroupsIDs.push(id);
                            }
                        }
                        oLaunchPageSrv.hideGroups(aHiddenGroupsIDs).done(function () {
                            oModel.setProperty("/groups", groups);
                            that.handleToastMessage(aHiddenGroupsIDs.length);
                            that.fireSave();
                        }).fail(function () {
                            var errorMsg = new sap.ushell.ui.launchpad.EmbeddedSupportErrorMessage("HideGroupsErrorMessage", {
                                title: resources.i18n.getText("error"),
                                content: new sap.m.Text({
                                    text: resources.i18n.getText("hideGroups_error")
                                })
                            });
                            errorMsg.open();
                        });
                    }
                }.bind(this), 100);//There is a flickering when the dialog is closed in the first time. adding minimal timeout to prevent it.

                this.oDialog.close();
            }.bind(this)
        });

        this.handleToastMessage = function (numOfHiddenGroups) {
            var sMsg = "";
            if (typeof numOfHiddenGroups === undefined) {
                return;
            }

            if (numOfHiddenGroups === 0) {  //All groups are visible on your home page
                sMsg = resources.i18n.getText("hideGroups_none");
            } else if (numOfHiddenGroups === 1) {//1 group is hidden on your home page
                sMsg = resources.i18n.getText("hideGroups_single");
            } else {//{0} groups are hidden on your home page
                sMsg = resources.i18n.getText("hideGroups_multiple", numOfHiddenGroups);
            }
            sap.ushell.Container.getService("Message").show(sap.ushell.services.Message.Type.INFO, sMsg);
        };

        this.cancelButton = new sap.m.Button("CancelBtn", {
            text: resources.i18n.getText("cancelBtn"),
            press: function () {
                //Need to revert any model changes if took place by the user prior to pressing the cancel button
                if (that.aGroupsOriginalStates) {
                    var groups = this.getModel().getProperty('/groups'),
                        i;
                    for (i = 0; i < that.aGroupsOriginalStates.length; i++) {
                        if (groups[i].groupId === that.aGroupsOriginalStates[i].groupId) { //just to be sure that the groups order was not changed...if it was - skip this group (most chances are that there has been no change)
                            groups[i].isGroupVisible = that.aGroupsOriginalStates[i].isVisible;
                        }
                    }
                }
                this.oDialog.close();
            }.bind(this)
        });

        this.oDialog = new sap.m.Dialog({
            id: "groupsVisibilityDialog",
            title: resources.i18n.getText("hideGroups_title"),
            contentWidth : "29.6rem",
            contentHeight : "36.07rem",
            stretch: sap.ui.Device.system.phone,
            content : this.groupsTable,
            beginButton: this.saveButton,
            endButton: this.cancelButton,
            initialFocus: "groupsVisibilityDialog",
            afterClose: function () {
                this.oDialog.destroy();
            }.bind(this)
        }).addStyleClass("sapUshellGroupsVisibilityDialog");
        this.oDialog.addCustomData(new AccessibilityCustomData({
            key: "aria-label",
            value: resources.i18n.getText("hideGroupsDialog_ariaLabel"),
            writeToDom: true
        }));
        this.getModelStates = function (groups) {
            if (!groups) {
                return;
            }
            var aStates = [],
                i;
            for (i = 0; i < groups.length; i++) {
                aStates.push({
                    groupId: groups[i].groupId,
                    isVisible: groups[i].isGroupVisible
                });
            }
            return aStates;
        };

        this.aGroupsStates = this.oModel.getProperty('/groups');
        this.aGroupsOriginalStates = this.getModelStates(this.aGroupsStates);
        this.oDialog.open();
    };*/


	return HideGroupsButton;

});
