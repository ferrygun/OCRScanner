// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview
 * Tile action mode implementation.
 *
 * In tile action mode the user can launch an action associated with a tile.
 * The mode is launched when clicking on one of the two activation buttons:
 * 1. In the user menu
 * 2. A floating button on the bottom-right corner on the launchpad.
 * Creation of the buttons depends on the following configuration properties:
 *  - enableActionModeMenuButton
 *  - enableActionModeFloatingButton
 *
 * Tile action mode can be activated only from the launchpad. it is not accessible from the catalog or from an application.
 * When the mode is active and the user clicks on a tile - the tile's corresponding actions are presented in an action sheet
 *  and the user can click/launch any of them.
 *
 * Every user action (e.g. menu buttons, drag-and-drop) except for clicking a tile - stops/deactivates the action mode.
 *
 * This module Contains the following:
 *  - Constructor function that creates action mode activation buttons
 *  - Activation handler
 *  - Deactivation handler
 *  - Rendering tile action menu
 *
 * @version 1.52.4
 */
/**
 * @namespace
 *
 * @name sap.ushell.components.flp.ActionMode
 *
 * @since 1.26.0
 * @private
 */
sap.ui.define([], function() {
	"use strict";

    /*global jQuery, sap, window, hasher, $ */
    /*jslint nomen: true */
    /**
     * Constructor function
     * Creates action mode activation buttons:
     *  1. A new button in the user menu
     *  2. A floating button
     */
    var ActionMode = function () {
            this.oEventBus = sap.ui.getCore().getEventBus();
            this.oEventBus.subscribe('launchpad', 'actionModeInactive', this.scrollToViewPoint, this);
            this.oEventBus.subscribe('launchpad', 'actionModeActive', this.scrollToViewPoint, this);

            this.viewPoint = undefined;

            this.init = function (oModel) {
                this.oModel = oModel;
            };
        };

   /**
    * Activation handler of tile actions mode 
    * 
    * Performs the following actions:
    * - Shows a toast message indicating the activated mode
    * - Sets the feature's model property to indicate that the feature is activated
    * - Registers deactivation click handler, called when the user clicks outside of a tile
    * - Adds the cover DIV to all tiles adding the mode's grey opacity and click handler for opening the actions menu
    * - Disables drag capability on tiles
    * - Changes the appearance of the floating activation button
    */
    ActionMode.prototype.activate = function () {
        var oTileActionsButton;

        this.oModel.setProperty('/tileActionModeActive', true);
        this.aOrigHiddenGroupsIds = sap.ushell.utils.getCurrentHiddenGroupIds(this.oModel);
        var oDashboardGroups = sap.ui.getCore().byId("dashboardGroups");
        oDashboardGroups.addLinksToUnselectedGroups();

        // Change action mode button display in the user actions menu
        oTileActionsButton = sap.ui.getCore().byId("ActionModeBtn");
        if (oTileActionsButton) {
            oTileActionsButton.setTooltip(sap.ushell.resources.i18n.getText("exitEditMode"));
            oTileActionsButton.setText(sap.ushell.resources.i18n.getText("exitEditMode"));
            if(oTileActionsButton.data("isShellHeader")){
                oTileActionsButton.setSelected(true);
            }
        }
        this.oEventBus.publish('launchpad', 'actionModeActive');
    };

    ActionMode.prototype.scrollToViewPoint = function () {
        var oData = this.viewPoint;
        oData.restoreLastFocusedTile = true;

        // if we switch from edit mode to non-edit mode
        if (!this.oModel.getProperty('/tileActionModeActive')) {

            // if before me switch to non-edit mode we were focused on the TileContainer header
            // we need to restore focus such as the tile that will be focused will belong to this group
            var jqLastFocusedHeader = jQuery(".sapUshellTileContainerHeader[tabindex=0]");
            if (jqLastFocusedHeader && jqLastFocusedHeader.length > 0) {
                var jqTileContainer = jqLastFocusedHeader[0].closest('.sapUshellTileContainer');
                if (jqTileContainer) {

                    // adding the focused header tile-container ID
                    oData.restoreLastFocusedTileContainerById = jqTileContainer.id;
                }
            }

        }

        oData.iDuration = 0;
        window.setTimeout(jQuery.proxy(this.oEventBus.publish, this.oEventBus, "launchpad", "scrollToGroup", oData), 0);
    };

    /**
     * Deactivation handler of tile actions mode
     *
     * Performs the following actions:
     * - Unregisters deactivation click handler
     * - Sets the feature's model property to indicate that the feature is deactivated
     * - Enables drag capability on tiles
     * - Destroys the tile actions menu control
     * - Removed the cover DIV from to all the tiles
     * - Adds the cover DIV to all tiles adding the mode's grey opacity and click handler for opening the actions menu
     * - Changes the appearance of the floating activation button
     */
    ActionMode.prototype.deactivate = function () {
        var tileActionsMenu = sap.ui.getCore().byId("TileActions"),
            oTileActionsButton;

        this.oModel.setProperty('/tileActionModeActive', false);
        this.oEventBus.publish("launchpad", 'actionModeInactive', this.aOrigHiddenGroupsIds);
        if (tileActionsMenu !== undefined) {
            tileActionsMenu.destroy();
        }
        sap.ui.require(['sap/m/MessageToast'],
            function (MessageToast) {
                MessageToast.show(sap.ushell.resources.i18n.getText("savedChanges"), {duration: 4000});
            });
        // Change action mode button display in the user actions menu
        oTileActionsButton = sap.ui.getCore().byId("ActionModeBtn");
        if (oTileActionsButton) {
            oTileActionsButton.setTooltip(sap.ushell.resources.i18n.getText("activateEditMode"));
            oTileActionsButton.setText(sap.ushell.resources.i18n.getText("activateEditMode"));
            if(oTileActionsButton.data("isShellHeader")) {
                oTileActionsButton.setSelected(false);
            }
        }
    };

    ActionMode.prototype.toggleActionMode = function (oModel, sSource, dashboardGroups) {
        var bTileActionModeActive = oModel.getProperty('/tileActionModeActive');
        var currentGroupIndex = oModel.getProperty('/topGroupInViewPortIndex');
        var sHomePageGroupDisplay = oModel.getProperty("/homePageGroupDisplay");
        if (!dashboardGroups) {
            dashboardGroups = [];
        }
        var visibleGroups = dashboardGroups.filter(function (group) {
            return group.getVisible();
        });

        var currentGroup = visibleGroups[currentGroupIndex];
        if (currentGroup) {
            var editModelDelta = bTileActionModeActive ? -49 : 49;
            var domRef = (sHomePageGroupDisplay === "tabs") ? dashboardGroups[0].getDomRef() : currentGroup.getDomRef();
            var groupScrolled = document.getElementById("sapUshellDashboardPage-cont").scrollTop - domRef.offsetTop;
            this.viewPoint = {
                group: visibleGroups[currentGroupIndex],
                fromTop: groupScrolled + editModelDelta
            };
        } else {
            this.viewPoint = {fromTop: 0};
        }


        if (bTileActionModeActive) {
            this.deactivate();
        } else {
            this.activate();
        }
    };

    /**
     * Apply action/edit mode CSS classes on a group.
     * This function is called when in edit/action mode and tiles were dragged,
     *  since the group is being re-rendered and the dashboard is still in action/edit mode
     */
    ActionMode.prototype.activateGroupEditMode = function (oGroup) {
        var jqGroupElement = jQuery(oGroup.getDomRef()).find('.sapUshellTileContainerContent');

        jqGroupElement.addClass("sapUshellTileContainerEditMode");
    };

   /**
    * Opens the tile menu, presenting the tile's actions
    *
    * Performs the following actions:
    * - Returning the clicked tile to its original appearance
    * - Tries to get an existing action sheet in case actions menu was already opened during this session of action mode 
    * - If this is the first time the user opens actions menu during this session of action mode - create a new action sheet
    * - Gets the relevant tile's actions from launch page service and create buttons accordingly
    * - Open the action sheet by the clicked tile
    *
    * @param oEvent Event object of the tile click action
    */
    ActionMode.prototype._openActionsMenu = function (oEvent, oView) {
        var that = this,
            oTileControl = oView ? oView : oEvent.getSource(),
            launchPageServ =  sap.ushell.Container.getService("LaunchPage"),
            aActions = [],
            oActionSheet = sap.ui.getCore().byId("TileActions"),
            index,
            noActionsButton,
            oButton,
            oAction,
            oTile,
            fnHandleActionPress,
            coverDiv,
            actionSheetIconInEditMode;

        if (oTileControl) {
            oTile = oTileControl.getBindingContext().getObject().object;
            aActions = launchPageServ.getTileActions(oTile);
        }
        that.oTileControl = oTileControl;
        jQuery(".sapUshellTileActionLayerDivSelected").removeClass("sapUshellTileActionLayerDivSelected");

        coverDiv = jQuery(oEvent.getSource().getDomRef()).find(".sapUshellTileActionLayerDiv");
        coverDiv.addClass("sapUshellTileActionLayerDivSelected");
        if (oActionSheet === undefined) {
            oActionSheet = new sap.m.ActionSheet("TileActions", {
                placement: sap.m.PlacementType.Bottom,
                afterClose: function () {
                    $(".sapUshellTileActionLayerDivSelected").removeClass("sapUshellTileActionLayerDivSelected");
                    var oEventBus = sap.ui.getCore().getEventBus();
                    oEventBus.publish("dashboard", "actionSheetClose", that.oTileControl);
                }
            });
        } else {
            oActionSheet.destroyButtons();
        }


        // in a locked group we do not show any action (this is here to prevent the tile-settings action added by Dynamic & Static tiles from being opened)
        // NOTE - when removeing this check (according to requirements by PO) - we must disable the tileSettings action in a different way
        if (aActions.length === 0 || oTileControl.oParent.getProperty("isGroupLocked")) {
            // Create a single button for presenting "Tile has no actions" message to the user
            noActionsButton = new sap.m.Button({
                text:  sap.ushell.resources.i18n.getText("tileHasNoActions"),
                enabled: false
            });
            oActionSheet.addButton(noActionsButton);
        } else {
            /*eslint-disable no-loop-func*/
            /*eslint-disable wrap-iife*/
            for (index = 0; index < aActions.length; index++) {
                oAction = aActions[index];
                // The press handler of a button (representing a single action) in a tile's action sheet
                fnHandleActionPress = function (oAction) {
                    return function () {
                        that._handleActionPress(oAction, oTileControl);
                    };
                }(oAction);
                oButton = new sap.m.Button({
                    text:  oAction.text,
                    icon:  oAction.icon,
                    press: fnHandleActionPress
                });
                oActionSheet.addButton(oButton);
            }
            /*eslint-enable no-loop-func*/
            /*eslint-enable wrap-iife*/
        }
        actionSheetIconInEditMode = oEvent.getSource().getActionSheetIcon ? oEvent.getSource().getActionSheetIcon() : undefined;
        //For tiles - actions menu is opened by "more" icon, for links, there is an action button
        //Which cannot be controlled by FLP code.
        //In case of link, we first try to access the "more" button and open an action sheet by it.
        //Otherwise the action sheet will not be located under the "more" button and other weird things will happen.
        if (actionSheetIconInEditMode) {
            oActionSheet.openBy(actionSheetIconInEditMode);
        } else {
            var oMoreAction = sap.ui.getCore().byId(oEvent.getSource().getId() + "-action-more");
            if (oMoreAction) {
                oActionSheet.openBy(oMoreAction);
            } else {
                oActionSheet.openBy(oEvent.getSource());
            }
        }
    };

    /**
     * Press handler of a button (representing a single action) in a tile's action sheet
     *
     * @param oAction The event object initiated by the click action on an element in the tile's action sheet.
     *               In addition to the text and icon properties, oAction contains one of the following:
     *               1. A "press" property that includes a callback function.
     *                  In this case the action (chosen by the user) is launched by calling the callback is called
     *               2. A "targetUrl" property that includes either a hash part of a full URL.
     *                  In this case the action (chosen by the user) is launched by navigating to the URL
     */
    ActionMode.prototype._handleActionPress = function (oAction, oTileControl) {
        if (oAction.press) {
            oAction.press.call(oAction, oTileControl);
        } else if (oAction.targetURL) {
            if (oAction.targetURL.indexOf("#") === 0) {
                hasher.setHash(oAction.targetURL);
            } else {
                window.open(oAction.targetURL, '_blank');
            }
        } else {
            sap.ui.require(['sap/m/MessageToast'],
                function (MessageToast) {
                    MessageToast.show("No Action");
                });
        }
    };

	return new ActionMode();

}, /* bExport= */ true);
