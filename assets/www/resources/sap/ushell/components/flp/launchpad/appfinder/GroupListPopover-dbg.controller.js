// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(function () {
	"use strict";

    /*global jQuery, sap, window */
    /*jslint nomen: true */

    sap.ui.controller("sap.ushell.components.flp.launchpad.appfinder.GroupListPopover", {
        onInit: function () {
            var oView = this.getView(),
                groupData = oView.getViewData().groupData;
            this.oPopoverModel = new sap.ui.model.json.JSONModel({userGroupList: groupData});
            oView.oPopover.setModel(this.oPopoverModel);
        },

        okButtonHandler: function (oEvent) {
            oEvent.preventDefault();
            oEvent._bIsStopHandlers = true;
            var oView = this.getView(),
            userGroupList = this.oPopoverModel.getProperty("/userGroupList"),
            returnChanges = {
              addToGroups: [],
              removeFromGroups: [],
              newGroups: [],
              allGroups: userGroupList
            };
            userGroupList.forEach(function (group) {
                if (group.selected === group.initiallySelected) {
                    return;
                }
                if (group.selected) {
                    returnChanges.addToGroups.push(group.oGroup);
                } else {
                    returnChanges.removeFromGroups.push(group.oGroup);
                }
            });
            if (oView.newGroupInput && oView.newGroupInput.getValue().length) {
                returnChanges.newGroups.push(oView.newGroupInput.getValue());
            }
            oView.oPopover.close();
            oView.deferred.resolve(returnChanges);
        },

        _closeButtonHandler: function (oEvent) {
            //oEvent.preventDefault();
            oEvent._bIsStopHandlers = true;
            var oView = this.getView();
            oView.oPopover.close();
            oView.deferred.reject();
        },
	       _createGroupAndSaveTile : function (oTileContext, newGroupName) {
						var oDashboardManager = sap.ushell.components.flp.launchpad.getDashboardManager(),
								deferred = jQuery.Deferred(),
								promise = oDashboardManager.createGroupAndSaveTile( {
										catalogTileContext : oTileContext,
										newGroupName: newGroupName
								});

						promise.done(function (data) {
								deferred.resolve(data);
						});

						return deferred;
				},

        /**
         * On clicking an item in the group list (displayListItem):
         * 1. Check if the relevant tile was added or removed to/from the associated group
         * 2. Call the actual add/remove functionality
         */
        groupListItemClickHandler: function (obj) {
            obj.oSource.setSelected(!obj.oSource.getSelected());
            var sItemModelPath = obj.oSource.getBindingContextPath(),
                oPopoverModel = obj.oSource.getModel(),
                bSelected = obj.oSource.getSelected() ? true : false;
            this.addRemoveTileFromGroup(sItemModelPath, oPopoverModel, bSelected);
        },

        getGroupsBeforeChanges : function (sPath) {
            var oModel = this.getView().getViewData().sourceContext.oModel;
            return oModel.getProperty(sPath +  "/associatedGroups");
        },

        getGroupsAfterChanges : function (sPath) {
            var oGroupsPopover = sap.ui.getCore().byId("groupsPopover");
            return oGroupsPopover.getModel().getProperty("/userGroupList");
        },

        /**
         * Handler for checking/unchecking group item in the tile groups popover.
         * - If the group is locked - ignore it 
         */
        checkboxClickHandler: function (oObjData) {
            var oView = this.getView(),
                sPath = oView.getViewData().sourceContext.sPath,
                aGroupsBeforeChanges = this.getGroupsBeforeChanges(sPath),
                aGroupsAfterChanges = this.getGroupsAfterChanges(),
                oLaunchPageService = sap.ushell.Container.getService("LaunchPage"),
                oPopoverModel = oObjData.oSource.getModel(),
                bSelected = oObjData.getParameter("selected"),
                indexBefore = 0,
                i = 0,
                done = false,
                sGroupModelPath;

            while (oLaunchPageService.isGroupLocked(aGroupsAfterChanges[i].oGroup.object) === true) {
                i++;
            }
            for (i; i < aGroupsAfterChanges.length; i++) {
                var existsBefore = false;
                if (done === true) {
                    break;
                }
                for (indexBefore = 0; indexBefore < aGroupsBeforeChanges.length; indexBefore++) {
                    if (oLaunchPageService.getGroupId(aGroupsAfterChanges[i].oGroup.object) === aGroupsBeforeChanges[indexBefore]) {
                        existsBefore = true;
                        //check if there is a need to remove tile
                        if (aGroupsAfterChanges[i].selected === false) {
                            done = true;
                            sGroupModelPath = ("/userGroupList/" + i);
                            this.addRemoveTileFromGroup(sGroupModelPath, oPopoverModel, bSelected);
                            break;
                        }
                    }
                }
                //Uncheck
                if(aGroupsAfterChanges[i].selected === true && existsBefore === false) {
                	sGroupModelPath = ("/userGroupList/" + i);
                    //afterChanges[i].oGroup.index
                    this.addRemoveTileFromGroup(sGroupModelPath, oPopoverModel, bSelected);
                    break;
                }
            }
        },

        /**
         * Add/remove a tile to/from a group
         * The adding/removing action is done by calls to catalogController.
         * The array associatedGroups in the tile's model is updated accordingly
         */
        addRemoveTileFromGroup: function (sItemModelPath, oPopoverModel, bToAdd) {

            var that = this.getView(),
                catalogController = this.getView().getViewData().catalogController,
                catalogModel = this.getView().getViewData().catalogModel,
                oTileContext = this.getView().getViewData().sourceContext,
                groupList = catalogModel.getProperty("/groups"),
                index = groupList.indexOf(oPopoverModel.getProperty(sItemModelPath).oGroup),
                oGroupContext = new sap.ui.model.Context(catalogModel, "/groups/" + index),
                launchPageService = sap.ushell.Container.getService("LaunchPage"),
                sGroupId = launchPageService.getGroupId(catalogModel.getProperty("/groups/" + index).object);

            // The tile is added to the group
            if (bToAdd) {
                var oAddPromise =  catalogController._addTile(oTileContext, oGroupContext);

                oAddPromise.done(function (data) {
                    var catalogTilePath = that.getViewData().sourceContext,
                        aCurrentTileGroups = catalogModel.getProperty(catalogTilePath + "/associatedGroups");

                    aCurrentTileGroups.push(sGroupId);
                    catalogModel.setProperty(catalogTilePath + "/associatedGroups", aCurrentTileGroups );
                })
            }
            // The tile is removed from the group
            else {
                var sTileCatalogId = oTileContext.getModel().getProperty(oTileContext.getPath()).id,
                    oRemovePromise = catalogController._removeTile(sTileCatalogId, index);

                oRemovePromise.done(function (data) {
                    var catalogTilePath = that.getViewData().sourceContext,
                        aCurrentTileGroups = catalogModel.getProperty(catalogTilePath + "/associatedGroups"),
                        indexToRemove = jQuery.inArray(sGroupId, aCurrentTileGroups);

                    if (indexToRemove >= 0) {
                    	aCurrentTileGroups.splice(indexToRemove, 1);
                    }
                    catalogModel.setProperty(catalogTilePath + "/associatedGroups", aCurrentTileGroups);
                })
            }
        },

          _switchGroupsPopoverButtonPress: function () {
              var groupsPopoverId = "groupsPopover-popover";
              if (sap.ui.Device.system.phone) {
                  // a different popover is used for phones
                  groupsPopoverId = "groupsPopover-dialog";
              }
              if (sap.ui.getCore().byId(groupsPopoverId).getContent()[0].getId() === "newGroupNameInput") {
					var userGroupList = this.oPopoverModel.getProperty("/userGroupList"),
                        returnChanges = {
                            addToGroups: [],
		                    removeFromGroups: [],
		                    newGroups: [],
		                    allGroups: userGroupList
						};
                    if (this.getView().newGroupInput.getValue().length) {
                        returnChanges.newGroups.push(this.getView().newGroupInput.getValue());
                    }
					this.getView().oPopover.close();
					this.getView().deferred.resolve(returnChanges);
            } else {
                this._closeButtonHandler(this);
            }
        },

        _navigateToCreateNewGroupPane: function () {
            var oView = this.getView();
            if (!oView.headBarForNewGroup) {
                oView.headBarForNewGroup = oView._createHeadBarForNewGroup();
            }
            if (!oView.newGroupInput) {
                oView.newGroupInput = oView._createNewGroupInput();
            }
            oView.oPopover.removeAllContent();
            oView.oPopover.addContent(oView.newGroupInput);
            oView.oPopover.setCustomHeader(oView.headBarForNewGroup);
            oView.oPopover.setContentHeight("");
            setTimeout(function(){
              oView.oPopover.getBeginButton().setText(sap.ushell.resources.i18n.getText("okDialogBtn"));
            },0);
            if (oView.oPopover.getEndButton()){
                oView.oPopover.getEndButton().setVisible(true);
            }

            if (
                sap.ui.getCore().byId("groupsPopover-popover") &&
                (sap.ui.getCore().byId("groupsPopover-popover").getContent()[0].getId() === "newGroupNameInput") && !oView.oPopover.getEndButton()
            ){
                oView.oPopover.setEndButton(oView._createCancelButton());
            };
            setTimeout(function(){
              oView.oPopover.getEndButton().setText(sap.ushell.resources.i18n.getText("cancelBtn"));
            },0);
            if (oView.getViewData().singleGroupSelection){
                this._setFooterVisibility(true);
            };
            setTimeout(function () {
                oView.newGroupInput.focus();
            }, 0);
        },
        setSelectedStart: function (start) {
            this.start = start;
        },
        _afterCloseHandler: function () {
            var oView = this.getView(),
            catalogModel = this.getView().getViewData().catalogModel;
            // catalog view is active. Not needed in user menu and SAP menu
            if (catalogModel) {
                var selectedEnd = catalogModel.getProperty(this.getView().getViewData().sourceContext + "/associatedGroups");
                this.showToastMessage(selectedEnd, this.start);
            }
            oView.oGroupsContainer.destroy();
            if (oView.headBarForNewGroup) {
                oView.headBarForNewGroup.destroy();
            }
            if (oView.newGroupInput) {
                oView.newGroupInput.destroy();
            }
            oView.oPopover.destroy();
            oView.destroy();
        },

        showToastMessage: function (end, start) {

                var added = 0,
                    removed = 0,
                    firstAddedGroupTitle,
                    firstRemovedGroupTitle,
                    endSelected = {};

                end.forEach (function (eGroup, eIndex){
                    endSelected[eGroup] = eGroup;//performance improve..
                })
                start.forEach (function (sGroup, sIndex) {
                    if (endSelected[sGroup.id]) {
                        if (sGroup.selected === false){
                            added++;
                            firstAddedGroupTitle = sGroup.title;
                        }
                    }
                    else{
                        if(sGroup.selected === true){
                            removed++;
                            firstRemovedGroupTitle = sGroup.title;
                        }
                    }

                })

                var message = this.getView().getViewData().catalogController.prepareDetailedMessage(this.getView().getViewData().title, added, removed, firstAddedGroupTitle, firstRemovedGroupTitle);
                if(message){
                    sap.m.MessageToast.show(message, {
                        duration: 6000,// default
                        width: "15em",
                        my: "center bottom",
                        at: "center bottom",
                        of: window,
                        offset: "0 -50",
                        collision: "fit fit"
                    });
                }
         },

        _backButtonHandler: function () {
            var oView = this.getView();
            oView.oPopover.removeAllContent();
            if (oView.getViewData().singleGroupSelection){
                this._setFooterVisibility(false);
            }

            if (!sap.ui.Device.system.phone) {
                oView.oPopover.setContentHeight(oView.iPopoverDataSectionHeight + "px");
            } else {
                oView.oPopover.setContentHeight("100%");
            }

            oView.oPopover.setVerticalScrolling(true);
            oView.oPopover.setHorizontalScrolling(false);
            oView.oPopover.addContent(oView.oGroupsContainer);
            oView.oPopover.setTitle(sap.ushell.resources.i18n.getText("addTileToGroups_popoverTitle"));
            oView.oPopover.setCustomHeader();
            oView.newGroupInput.setValue('');
            if (sap.ui.getCore().byId("groupsPopover-popover") && (sap.ui.getCore().byId("groupsPopover-popover").getContent()[0].getId() != "newGroupNameInput")){
                oView.oPopover.getEndButton().setVisible(false);
            };
            setTimeout(function(){
              oView.oPopover.getBeginButton().setText(sap.ushell.resources.i18n.getText("close"));
            },0);
        },

        _setFooterVisibility: function(bVisible){
            //as there is not public API to control the footer we get the control by its id
            //and set its visibility
            var oFooter = sap.ui.getCore().byId("groupsPopover-footer");
            if (oFooter){
                oFooter.setVisible(bVisible);
            }
        }
    });

/*


*/
}, /* bExport= */ false);
