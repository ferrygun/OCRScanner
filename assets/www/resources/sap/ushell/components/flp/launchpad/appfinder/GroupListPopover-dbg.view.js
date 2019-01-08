// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap */
    /*jslint nomen: true */


    sap.ui.jsview("sap.ushell.components.flp.launchpad.appfinder.GroupListPopover", {
        /*
            view receives viewData with following structure
            {
                groupData: [
                    {
                        initiallySelected: true,
                        selected: true,
                        oGroup: group1Object
                    },
                    {
                        initiallySelected: false,
                        selected: false,
                        oGroup: group2Object
                    }
                ]
                enableHideGroups: true,
                enableHelp: true,
                singleGroupSelection: false
         }
         */

        createContent: function (oController) {
            this.iPopoverDataSectionHeight = 192;
            this.oGroupsContainer = this._createPopoverContainer(this.iPopoverDataSectionHeight);
            this.oLaunchPageService = sap.ushell.Container.getService("LaunchPage");

            this.oPopover = sap.ui.getCore().byId("groupsPopover") || new sap.m.ResponsivePopover({
                id : "groupsPopover",
                placement : "Auto",
                title: sap.ushell.resources.i18n.getText("addTileToGroups_popoverTitle"),
                contentWidth: '20rem',
                beginButton: this._createCloseButton(),
                content: this.oGroupsContainer,
                afterClose: this.getController()._afterCloseHandler.bind(this.getController())
            });

            this.oPopover.setInitialFocus('newGroupItem');
            //return this.oPopover;
        },

        open: function (openByControl) {
            if (document.body.clientHeight - openByControl.getDomRef().getBoundingClientRect().bottom >= 310) {
                this.oPopover.setPlacement("Bottom");
            }
            this.oPopover.openBy(openByControl);
            if (this.getViewData().singleGroupSelection) {
                this.getController()._setFooterVisibility(false);
            }
            this.deferred = jQuery.Deferred();
            return this.deferred.promise();
        },

        _createPopoverContainer: function (iPopoverDataSectionHeight) {
            var oNewGroupItemList = this._createNewGroupUiElements(),
                oGroupList = this._createPopoverGroupList();

            var popoverContainer = sap.ui.getCore().byId("popoverContainer") || new sap.m.ScrollContainer({
                    id: "popoverContainer",
                    horizontal : false,
                    vertical : true,
                    content: [oNewGroupItemList, oGroupList]
                });

            if (!sap.ui.Device.system.phone) {
                popoverContainer.setHeight((iPopoverDataSectionHeight - 2) + "px");
            } else {
                popoverContainer.setHeight("100%");
            }

            return popoverContainer;
        },

        _createNewGroupUiElements: function () {
            var oNewGroupItem = sap.ui.getCore().byId("newGroupItem") || new sap.m.StandardListItem({
                id : "newGroupItem",
                title : sap.ushell.resources.i18n.getText("newGroup_listItemText"),
                type : "Navigation",
                press : this.getController()._navigateToCreateNewGroupPane.bind(this.getController())
            });
            var oNewGroupItemList = new sap.m.List({});
            // if xRay is enabled
            if (this.getViewData().enableHelp) {
                oNewGroupItem.addStyleClass('help-id-newGroupItem');// xRay help ID
            }
            oNewGroupItemList.addItem(oNewGroupItem);

            oNewGroupItemList.addEventDelegate({
                onsapdown: function (oEvent) {
                    try {
                        oEvent.preventDefault();
                        oEvent._bIsStopHandlers = true;
                        var jqFirstGroupListItem = jQuery("#popoverContainer .sapMListModeMultiSelect li, #popoverContainer .sapMListModeSingleSelectMaster li").first();
                        jqFirstGroupListItem.focus();
                    } catch (e) {
                        // continue regardless of error
                    }
                },
                onsaptabnext: function (oEvent) {
                    try {
                        oEvent.preventDefault();
                        oEvent._bIsStopHandlers = true;
                        var jqCloseButton = jQuery("#closeButton");
                        jqCloseButton.focus();
                    } catch (e) {
                        // continue regardless of error
                    }
                }
            });

            return oNewGroupItemList;
        },

        _createNewGroupInput: function () {
            var oNewGroupNameInput = new sap.m.Input({
                id : "newGroupNameInput",
                type : "Text",
                placeholder : sap.ushell.resources.i18n.getText("new_group_name")
            });
            oNewGroupNameInput.setValueState(sap.ui.core.ValueState.None);
            oNewGroupNameInput.setPlaceholder(sap.ushell.resources.i18n.getText("new_group_name"));
            oNewGroupNameInput.enabled = true;
            oNewGroupNameInput.addStyleClass("sapUshellCatalogNewGroupInput");
            return oNewGroupNameInput;
        },

        _createHeadBarForNewGroup: function () {
            var oBackButton = new sap.m.Button({
                icon: sap.ui.core.IconPool.getIconURI("nav-back"),
                press : this.getController()._backButtonHandler.bind(this.getController()),
                tooltip : sap.ushell.resources.i18n.getText("newGroupGoBackBtn_tooltip")
            });
            oBackButton.addStyleClass("sapUshellCatalogNewGroupBackButton");

            // new group panel's header
            var oHeadBar = new sap.m.Bar({
                contentLeft : [oBackButton],
                contentMiddle : [
                    new sap.m.Label({
                        text : sap.ushell.resources.i18n.getText("newGroup_popoverTitle")
                    })
                ]
            });
            return oHeadBar;
        },

        getControllerName: function () {
            return "sap.ushell.components.flp.launchpad.appfinder.GroupListPopover";
        },

        _createPopoverGroupList: function () {

            var oListItemTemplate = new sap.m.DisplayListItem({
                label : "{oGroup/title}",
                selected : "{selected}",
                tooltip: "{oGroup/title}",
                type: sap.m.ListType.Active,
                press: this.getController().groupListItemClickHandler.bind(this.getController())
            });
            var aUserGroupsFilters = [];
            aUserGroupsFilters.push(new sap.ui.model.Filter("oGroup/isGroupLocked", sap.ui.model.FilterOperator.EQ, false));
            if (this.getViewData().enableHideGroups) {
                aUserGroupsFilters.push(new sap.ui.model.Filter("oGroup/isGroupVisible", sap.ui.model.FilterOperator.EQ, true));
            }
            var bSingleSelection = this.getViewData().singleGroupSelection,
             	oList = new sap.m.List({
                    mode : bSingleSelection ? sap.m.ListMode.SingleSelectMaster : sap.m.ListMode.MultiSelect,
                    growing: true,
                    growingThreshold: 200,
                    items: {
                        path: "/userGroupList",
                        template: oListItemTemplate,
                        filters: aUserGroupsFilters
                    }
                });

            if (bSingleSelection){
                oList.attachSelect(this.getController().okButtonHandler.bind(this.getController()));
            } else {
                // While clicking on the checkbox - Check if a group was added or removed
                oList.attachSelectionChange(this.getController().checkboxClickHandler.bind(this.getController()));
            }

            oList.addEventDelegate({
                //used for accessibility, so "new group" element will be a part of it
                onsapup: function (oEvent) {
                    try {
                        oEvent.preventDefault();

                        var jqNewGroupItem,
                            currentFocusGroup = jQuery(":focus");
                        if (currentFocusGroup.index() == 0) {   //first group in the list
                            jqNewGroupItem = jQuery("#newGroupItem");
                            jqNewGroupItem.focus();
                            oEvent._bIsStopHandlers = true;
                        }
                    } catch (e) {
                        // continue regardless of error
                        jQuery.sap.log.error("Groups popup Accessibility `up` key failed");
                    }
                }
            });
            return oList;
        },

        _createOkButton: function () {
            var oOkBtn = new sap.m.Button( {
                id : "okButton",
                press : this.getController().okButtonHandler.bind(this.getController()),
                text : sap.ushell.resources.i18n.getText("okBtn")
            });

            oOkBtn.addEventDelegate({
                onsaptabprevious: function(oEvent) {
                    try {
                        oEvent.preventDefault();
                        oEvent._bIsStopHandlers = true;
                        var jqNewGroupItem = jQuery("#newGroupItem");
                        if (!jqNewGroupItem.length) {
                            jqNewGroupItem = jQuery("#newGroupNameInput input");
                        }
                        jqNewGroupItem.focus();
                    } catch (e) {
                        // continue regardless of error
                        jQuery.sap.log.error("Groups popup Accessibility `shift-tab` key failed");
                    }
                }
            });
            return oOkBtn;
        },

        _createCancelButton: function () {
            return new sap.m.Button({
                id : "cancelButton",
                press: this.getController()._closeButtonHandler.bind(this.getController()),
                text : sap.ushell.resources.i18n.getText("cancelBtn")
            });
        },

        _createCloseButton: function () {
            return sap.ui.getCore().byId("closeButton") || new sap.m.Button({
                id : "closeButton",
                press: this.getController()._switchGroupsPopoverButtonPress.bind(this.getController()),
                text : sap.ushell.resources.i18n.getText(sap.ushell.resources.i18n.getText("close"))
            });
        }
    });


}, /* bExport= */ false);
