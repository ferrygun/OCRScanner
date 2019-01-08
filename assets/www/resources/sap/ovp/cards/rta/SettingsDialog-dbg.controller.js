sap.ui.define([ 'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    '/sap/ui/fl/descriptorRelated/api/DescriptorChangeFactory',
    '/sap/ui/fl/descriptorRelated/api/DescriptorInlineChangeFactory',
    'sap/ovp/cards/CommonUtils',
    'sap/ovp/cards/SettingsUtils',
    'sap/m/Button',
    'sap/m/Dialog',
    'sap/m/Text',
    'sap/ui/comp/valuehelpdialog/ValueHelpDialog',
    'sap/ovp/cards/rta/SettingsDialogConstants',
    'sap/m/MessageBox',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator'
], function(Controller, JSONModel, DescriptorChangeFactory, DescriptorInlineChangeFactory,
            commonUtils, settingsUtils, Button, Dialog, Text, ValueHelpDialog, SettingsConstants,
            MessageBox, Filter, FilterOperator) {
    'use strict';

    return Controller.extend('sap.ovp.cards.rta.SettingsDialog', {

        /* To store manifest setting of selected Card*/
        _oCardManifestSettings : {},
        /*To store the elements that do not require refresh when updated*/
        _aRefreshNotRequired : SettingsConstants._aRefreshNotRequired,
        _aRefreshRequired : SettingsConstants._aRefreshRequired,

        onInit : function() {
            /*Attaching CreateAndSubmitChange button to oSaveButton*/
            settingsUtils.oSaveButton.attachPress(this.createAndSubmitChange,this);
            settingsUtils.oResetButton.attachPress(this.onResetButton,this);
            settingsUtils.oMessagePopOverButton.attachPress(this.handleMessagePopoverPress, this);
        },

        onAfterRendering : function() {
            settingsUtils.dialogBox.addStyleClass("sapOvpSettingsDialogBox");
            this.setEnablePropertyForResetAndSaveButton(false);
            this._oCardManifestSettings = this.getView().getModel().getData();
            this._oOriginalCardManifestSettings = jQuery.extend(true, {}, this._oCardManifestSettings);
            var oView = this.getView(),
                oVisibilityModel = oView.getModel("visibility"),
                dialogCard = oView.byId("dialogCard");
            if (!dialogCard.getVisible()) {
                dialogCard = oView.byId("dialogCardNoPreview");
            }
            dialogCard.getDomRef().style.minHeight = this._oCardManifestSettings.dialogBoxHeight + 'px';
            oView.byId("SettingsDialogScrollContainerForForm").getDomRef().style.height =
                (oVisibilityModel.getProperty("/viewSwitchEnabled")) ? this.getValueInRemString(settingsUtils.iContentHeightForDialogWithViewSwitch)
                    : this.getValueInRemString(settingsUtils.iContentHeightForDialog);
            oView.byId("dialogCardOverlay").getDomRef().style.minHeight = this._oCardManifestSettings.dialogBoxHeight + 'px';
            var sapOvpSettingsForm = oView.byId("sapOvpSettingsForm");
            if(sapOvpSettingsForm) {
                sapOvpSettingsForm.getDomRef().style.width = "calc(100% - " + (this._oCardManifestSettings.dialogBoxWidth + 1) + "rem)";
            }
            setTimeout( function(){
                var dialogCard = this.getView().byId("dialogCard");
                if (dialogCard.getVisible()) {
                    dialogCard.setBusy(false);
                }
            }.bind(this), 2000);
        },

        validateInputField: function (oEvent) {
            var oMessagesModel, aMessages, iCounterAll, iCounterError;
            var oSource = oEvent.getSource();
            if (!oSource.getValue()) {
                settingsUtils.oSaveButton.setEnabled(true);
                oMessagesModel = settingsUtils.oMessagePopOver.getModel();
                aMessages = oMessagesModel.getProperty("/Messages");
                iCounterAll = oMessagesModel.getProperty("/Counter/All");
                iCounterError = oMessagesModel.getProperty("/Counter/Error");

                var sTitle = (oSource.getId().indexOf("sapOvpSettingsViewName") !== -1) ?
                    "This is a mandatory field. Please enter a View Name." :
                    sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText('OVP_KEYUSER_INPUT_ERROR');
                aMessages.push({
                    'type': "Error",
                    'title': sTitle,
                    'fieldName': oSource.getId(),
                    'counter': iCounterError + 1
                });
                oMessagesModel.setProperty("/Messages", aMessages);
                oMessagesModel.setProperty("/Counter/All", iCounterAll + 1);
                oMessagesModel.setProperty("/Counter/Error", iCounterError + 1);
                oMessagesModel.refresh(true);
            } else {
                settingsUtils.oSaveButton.setEnabled(true);
                oMessagesModel = settingsUtils.oMessagePopOver.getModel();
                aMessages = oMessagesModel.getProperty("/Messages");
                iCounterAll = oMessagesModel.getProperty("/Counter/All");
                iCounterError = oMessagesModel.getProperty("/Counter/Error");

                for (var i = 0; i < aMessages.length; i++) {
                    if (aMessages[i].fieldName === oSource.getId()) {
                        aMessages.splice(i, 1);
                        iCounterAll--;
                        iCounterError--;
                        i--;
                    }
                }

                oMessagesModel.setProperty("/Messages", aMessages);
                oMessagesModel.setProperty("/Counter/All", iCounterAll);
                oMessagesModel.setProperty("/Counter/Error", iCounterError);
                oMessagesModel.refresh(true);
                this.updateCard(oEvent);
            }
        },
        addView : function(oEvent) {
            //adding Mandatory field as is.
            this.setEnablePropertyForResetAndSaveButton(true);
            var defaultDataPointAnnotationPath,
                oCardManifestSettings = this._oCardManifestSettings;
            if(oCardManifestSettings.dataPointAnnotationPath && oCardManifestSettings.dataPoint &&
                oCardManifestSettings.dataPoint.length) {
                defaultDataPointAnnotationPath = oCardManifestSettings.dataPoint[0].value;
            }
            if(oCardManifestSettings.tabs && oCardManifestSettings.tabs.length) {
                oCardManifestSettings.newViewCounter++;
                oCardManifestSettings.tabs.push({
                    annotationPath: oCardManifestSettings.lineItem[0].value,
                    dataPointAnnotationPath: defaultDataPointAnnotationPath,
                    value: 'View ' + oCardManifestSettings.newViewCounter
                });
                var selectedKey = oCardManifestSettings.tabs.length;
                oCardManifestSettings.aViews.push({
                    text: 'View ' + oCardManifestSettings.newViewCounter,
                    key: selectedKey,
                    isLaterAddedView: true,
                    isViewResetEnabled: false
                });
                this.selectViewSwitch(oEvent, selectedKey);
            } else {
                oCardManifestSettings.tabs = [{}];
                SettingsConstants.tabFields.forEach(function (tabField) {
                    oCardManifestSettings.tabs[0][tabField] = oCardManifestSettings[tabField];
                }.bind(this));
                oCardManifestSettings.tabs[0].value = "View 1";
                if (oCardManifestSettings.template === "sap.ovp.cards.charts.analytical") {
                    oCardManifestSettings.tabs.push({
                        chartAnnotationPath: oCardManifestSettings.chart[0].value,
                        dataPointAnnotationPath: defaultDataPointAnnotationPath,
                        value: 'View 2'
                    });
                } else {
                    oCardManifestSettings.tabs.push({
                        annotationPath: oCardManifestSettings.lineItem[0].value,
                        dataPointAnnotationPath: defaultDataPointAnnotationPath,
                        value: 'View 2'
                    });
                }

                oCardManifestSettings.selectedKey = 1;
                oCardManifestSettings.defaultViewSelected = 1;
                oCardManifestSettings.aViews = [{
                    text: 'Main',
                    key: 0,
                    isLaterAddedView: false,
                    isViewResetEnabled: false
                }, {
                    text: 'View 1 (default view)',
                    key: 1,
                    initialSelectedKey: 1,
                    isLaterAddedView: false,
                    isViewResetEnabled: false
                }, {
                    text: 'View 2',
                    key: 2,
                    isLaterAddedView: true,
                    isViewResetEnabled: false
                }];
                oCardManifestSettings.newViewCounter = 2;
                this.selectViewSwitch(oEvent, 1);
            }
        },
        deleteView: function(oEvent) {
            this.setEnablePropertyForResetAndSaveButton(true);
            var oCardManifestSettings = this._oCardManifestSettings,
                selectedKey = parseInt(oCardManifestSettings.selectedKey,10);
            oCardManifestSettings.tabs.splice(selectedKey-1,1);
            oCardManifestSettings.aViews.splice(selectedKey,1);
            if(selectedKey === oCardManifestSettings.defaultViewSelected) {
                oCardManifestSettings.defaultViewSelected = 1;
                oCardManifestSettings.aViews[selectedKey].text = oCardManifestSettings.aViews[selectedKey].text + ' (default view)';
            }
            oCardManifestSettings.aViews.forEach(function(view,index) {
               if(index >= selectedKey) {
                   view.key--;
               }
            });
            if(oCardManifestSettings.tabs.length == 1) {
                SettingsConstants.tabFields.forEach(function (tabField) {
                    oCardManifestSettings[tabField] = oCardManifestSettings.tabs[0][tabField];
                }.bind(this));
                delete oCardManifestSettings.selectedKey;
                delete oCardManifestSettings.defaultViewSelected;
                delete oCardManifestSettings.tabs;
                delete oCardManifestSettings.aViews;
                settingsUtils.addManifestSettings(oCardManifestSettings);
                settingsUtils.setVisibilityForFormElements(oCardManifestSettings);
                this.getView().getModel('visibility').refresh();
                this.getView().getModel().refresh();
                this._fCardWithRefresh();
            } else {
                oCardManifestSettings.selectedKey = 1;
                this.selectViewSwitch(oEvent, oCardManifestSettings.selectedKey);
            }
        },
        resetView: function() {
            var oCardManifestSettings = this._oCardManifestSettings,
                iSelectedKey = parseInt(oCardManifestSettings.selectedKey,10),
                oSelectedView = oCardManifestSettings.aViews[iSelectedKey],
                iDefaultViewSelected = oCardManifestSettings.defaultViewSelected;
            if(!oSelectedView.isLaterAddedView) {
                var kpiStateOfCurrentCard = oCardManifestSettings.dataPointAnnotationPath ? true : false,
                    kpiStateOfOriginalCard = this._oOriginalCardManifestSettings.dataPointAnnotationPath ? true : false;
                if(iSelectedKey) {
                    var initialSelectedKey = oCardManifestSettings.aViews[iSelectedKey].initialSelectedKey;
                    SettingsConstants.tabFields.forEach(function(field) {
                        if (field !== 'dataPointAnnotationPath' || kpiStateOfCurrentCard) {
                            /* None of the field is of type object hence direct copy is fine.*/
                            if (this._oOriginalCardManifestSettings.tabs && this._oOriginalCardManifestSettings.tabs.length) {
                                oCardManifestSettings[field] = this._oOriginalCardManifestSettings.tabs[initialSelectedKey - 1][field];
                            } else {
                                oCardManifestSettings[field] = this._oOriginalCardManifestSettings[field];
                            }
                            oCardManifestSettings.tabs[iSelectedKey - 1][field] = oCardManifestSettings[field];
                        }
                    }.bind(this));
                    if(!this._oOriginalCardManifestSettings.tabs || !this._oOriginalCardManifestSettings.tabs.length) {
                        oCardManifestSettings.newViewCounter++;
                        oCardManifestSettings.tabs[iSelectedKey-1].value = "View " + oCardManifestSettings.newViewCounter;
                    }
                    if(iSelectedKey === oCardManifestSettings.defaultViewSelected) {
                        oCardManifestSettings.aViews[iSelectedKey].text = oCardManifestSettings.tabs[iSelectedKey-1].value + ' (default view)';
                    } else {
                        oCardManifestSettings.aViews[iSelectedKey].text = oCardManifestSettings.tabs[iSelectedKey-1].value;
                    }

                } else {
                    SettingsConstants.mainFields.forEach(function(field) {
                        /* None of the field is of type object hence direct copy is fine.*/
                        oCardManifestSettings[field] = this._oOriginalCardManifestSettings[field];
                    }.bind(this));
                    if(kpiStateOfCurrentCard !== kpiStateOfOriginalCard) {
                        if(kpiStateOfOriginalCard) {
                            oCardManifestSettings.tabs.forEach(function (tab) {
                               if (tab.prevDataPointAnnotationPath) {
                                   tab.dataPointAnnotationPath  = tab.prevDataPointAnnotationPath;
                               } else {
                                   tab.dataPointAnnotationPath = oCardManifestSettings.dataPoint[0].value;
                               }
                            }.bind(this));
                            oCardManifestSettings.dataPointAnnotationPath = oCardManifestSettings.tabs[iDefaultViewSelected].dataPointAnnotationPath;
                        } else {
                            oCardManifestSettings.tabs.forEach(function (tab) {
                                tab.prevDataPointAnnotationPath = tab.dataPointAnnotationPath;
                                tab.dataPointAnnotationPath = undefined;
                            }.bind(this));
                        }
                    }
                }
            } else {
                var dataPointAnnotationPath;
                if(oCardManifestSettings.dataPointAnnotationPath) {
                    dataPointAnnotationPath = oCardManifestSettings.dataPoint[0].value;
                }
                oCardManifestSettings.newViewCounter++;
                if (oCardManifestSettings.template === "sap.ovp.cards.charts.analytical") {
                    oCardManifestSettings.tabs[iSelectedKey-1] = {
                        chartAnnotationPath: oCardManifestSettings.chart[0].value,
                        dataPointAnnotationPath: dataPointAnnotationPath,
                        value: 'View ' + oCardManifestSettings.newViewCounter
                    };
                } else {
                    oCardManifestSettings.tabs[iSelectedKey-1] = {
                        annotationPath: oCardManifestSettings.lineItem[0].value,
                        dataPointAnnotationPath: dataPointAnnotationPath,
                        value: 'View ' + oCardManifestSettings.newViewCounter
                    };
                }
                if(iSelectedKey === oCardManifestSettings.defaultViewSelected) {
                    oCardManifestSettings.aViews[iSelectedKey].text = 'View ' + oCardManifestSettings.newViewCounter + ' (default view)';
                } else {
                    oCardManifestSettings.aViews[iSelectedKey].text = 'View ' + oCardManifestSettings.newViewCounter;
                }
                SettingsConstants.tabFields.forEach(function(field) {
                    /* None of the field is of type object hence direct copy is fine.*/
                    oCardManifestSettings[field] = oCardManifestSettings.tabs[iSelectedKey-1][field];
                }.bind(this));
            }
            oCardManifestSettings.isViewResetEnabled = false;
            oCardManifestSettings.aViews[iSelectedKey].isViewResetEnabled = false;
            settingsUtils.addManifestSettings(oCardManifestSettings);
            settingsUtils.setVisibilityForFormElements(oCardManifestSettings);
            this.getView().getModel('visibility').refresh();
            this.getView().getModel().refresh();
            this._fCardWithRefresh();
        },
        selectViewSwitch : function(oEvent, selectedKey) {
            var oCardManifestSettings = this._oCardManifestSettings;
            if(!selectedKey) {
                selectedKey = oEvent.getSource().getSelectedIndex();
            }
            if(this.defaultViewSwitch) {
                this.defaultViewSwitch.setEnabled(true);
            }
            this.setEnablePropertyForResetAndSaveButton(true);

            //If selectedkey is zero then showMain view else subView
            if(!selectedKey) {
                /*By Default value get set to string zero . Setting it to interger zero*/
                /*Show main veiw with properties of the default view selected*/
                var iDefaultViewSelected = oCardManifestSettings.defaultViewSelected;
                oCardManifestSettings.selectedKey = selectedKey;
                oCardManifestSettings.mainViewSelected = true;
                oCardManifestSettings.isViewResetEnabled = oCardManifestSettings.aViews[selectedKey].isViewResetEnabled;
                SettingsConstants.tabFields.forEach(function (field) {
                   oCardManifestSettings[field] = oCardManifestSettings.tabs[iDefaultViewSelected-1][field];
                }.bind(this));
                settingsUtils.addManifestSettings(oCardManifestSettings);
                settingsUtils.setVisibilityForFormElements(oCardManifestSettings);
                this.getView().getModel('visibility').refresh();
                this.getView().getModel().refresh();
                this._fCardWithRefresh();
            } else {
                oCardManifestSettings.mainViewSelected = false;
                oCardManifestSettings.isViewResetEnabled = oCardManifestSettings.aViews[selectedKey].isViewResetEnabled;
                var dialogCard = this.getView().byId("dialogCard");
                if (dialogCard.getVisible()) {
                    var oRootControl = dialogCard.getComponentInstance().getRootControl();
                    var oController = oRootControl.getController();
                    /*this will set the selectedkey for the manifest settings*/
                    oController.changeSelection(selectedKey, true, oCardManifestSettings);
                    settingsUtils.addManifestSettings(oCardManifestSettings);
                    settingsUtils.setVisibilityForFormElements(oCardManifestSettings);
                    this.getView().getModel('visibility').refresh();
                    this.getView().getModel().refresh();
                }
            }
        },

        setCurrentActivePageForCarouselCard : function (iIndex) {
            var dialogCard = this.getView().byId("dialogCard");
            if (dialogCard.getVisible()) {
                var oComponent = dialogCard.getComponentInstance(),
                    oRootControl = oComponent.getRootControl(),
                    oCarousel = oRootControl.byId("pictureCarousel");
                if (oCarousel) {
                    var aPages = oCarousel.getPages(),
                        newActivePage = aPages[iIndex];
                    oCarousel.setActivePage(newActivePage);
                }
            }
        },

        onSelectionChange : function (oEvent) {
            var oSource = oEvent.getSource(),
                oModel = oSource.getModel(),
                aStaticContent = oModel.getData().staticContent,
                oSelectedItem = oSource.getSelectedItem(),
                oSelectedItemData = oSelectedItem.getBindingContext().getObject(),
                oVisibilityModel = oSource.getModel("visibility");
            for (var i = 0; i < aStaticContent.length; i++) {
                if (aStaticContent[i].id === oSelectedItemData.id) {
                    oVisibilityModel.setProperty("/moveToTheTop", !(1 === aStaticContent.length || i === 0));
                    oVisibilityModel.setProperty("/moveUp", !(1 === aStaticContent.length || i === 0));
                    oVisibilityModel.setProperty("/moveDown", !(1 === aStaticContent.length || i === (aStaticContent.length - 1)));
                    oVisibilityModel.setProperty("/moveToTheBottom", !(1 === aStaticContent.length || i === (aStaticContent.length - 1)));
                    oVisibilityModel.setProperty("/delete", true);
                    oModel.setProperty("/selectedItemIndex", i);
                    oVisibilityModel.refresh(true);
                    break;
                }
            }
        },

        setEnablePropertyForResetAndSaveButton : function (bEnabled) {
            settingsUtils.oResetButton.setEnabled(bEnabled);
            settingsUtils.oSaveButton.setEnabled(bEnabled);
        },

        getValueInRemString : function (iValue) {
            return iValue + 'rem';
        },

        _getSelectedItemIndex : function (oModel) {
            return oModel.getProperty("/selectedItemIndex");
        },

        _getLastItemIndex : function (oModel) {
            return this._getStaticContentArray(oModel).length - 1;
        },

        _getStaticContentArray : function (oModel) {
            return oModel.getProperty("/staticContent");
        },

        _setStaticContentArray : function (oModel, aStaticContent) {
            oModel.setProperty("/staticContent", aStaticContent);
        },

        _setSelectedItemAndScrollToElement : function (iIndex, bHaveDelegate) {
            var oView = this.getView(),
                oList = oView.byId("sapOvpStaticLinkListLineItem"),
                oScrollContainer = oView.byId("scrollContainer");

            var oItem = oList.getItems()[iIndex];
            if (bHaveDelegate) {
                this._oList = oList;
                this._oItem = oItem;
                this._oScrollContainer = oScrollContainer;
                var oDelegateOnAfter = {
                    onAfterRendering: function (oEvent) {
                        this._oList.removeEventDelegate(this._oDelegateOnAfter);
                        this._oScrollContainer.scrollToElement(this._oItem);
                        delete this._oDelegateOnAfter;
                        delete this._oList;
                        delete this._oScrollContainer;
                        delete this._oItem;
                    }
                };
                this._oDelegateOnAfter = oDelegateOnAfter;
                oList.addEventDelegate(oDelegateOnAfter, this);
            } else {
                oScrollContainer.scrollToElement(oItem);
            }
            oList.setSelectedItem(oItem);
            oList.fireSelectionChange();
        },

        _arrangeStaticContent : function (oModel, iFrom, iTo) {
            var aStaticContent = this._getStaticContentArray(oModel);
            // Change Position
            aStaticContent.splice(iTo, 0, aStaticContent.splice(iFrom, 1)[0]);
            this._setStaticContentArray(oModel, aStaticContent);
            this._setSelectedItemAndScrollToElement(iTo);
        },

        _filterTable : function (oEvent, aFields, sId) {
            var sQuery = oEvent.getParameter("query"),
                oGlobalFilter = null,
                aFilters = [];

            for (var i = 0; i < aFields.length; i++) {
                aFilters.push(new Filter(aFields[i], FilterOperator.Contains, sQuery));
            }

            if (sQuery) {
                oGlobalFilter = new Filter(aFilters, false);
            }

            this.getView().byId(sId).getBinding("items").filter(oGlobalFilter, "Application");
        },

        filterLinksTable : function (oEvent) {
            this._filterTable(oEvent, ["name", "value"], "tableFilterLinks");
        },

        filterIconTable : function (oEvent) {
            this._filterTable(oEvent, ["Icon", "Name"], "tableFilter");
        },

        filterImageTable : function (oEvent) {
            this._filterTable(oEvent, ["Name"], "tableFilterImage");
        },

        getIndexFromIdForStaticLinkList : function (sId) {
            var aSplitIds = sId.split("-");
            return aSplitIds[aSplitIds.length - 1];
        },

        _createLabel : function (sHeaderPath) {
            return new sap.m.Label({
                text : sHeaderPath
            });
        },

        _createIcon : function (sContentRowPath) {
            return new sap.ui.core.Icon({
                src : "{" + sContentRowPath + "}"
            });
        },

        _createImage : function (sContentRowPath) {
            return new sap.m.Image({
                src : "{" + sContentRowPath + "}",
                width: "3rem",
                height: "3rem"
            });
        },

        _createText : function (sContentRowPath) {
            return new sap.m.Text({
                text : "{" + sContentRowPath + "}"
            });
        },

        _createColumnHeader : function (sPath) {
            return new sap.m.Column({
                header : [
                    this._createLabel(sPath)
                ]
            });
        },

        _createColumnCells : function (oTable, sPath, sId) {
            var aColumnCells;
            if (sId === "tableFilterImage") {
                aColumnCells = [
                    this._createImage("Image"),
                    this._createText("Name")
                ];
            } else if (sId === "tableFilterLinks") {
                aColumnCells = [
                    this._createText("name"),
                    this._createText("value")
                ];
            } else {
                aColumnCells = [
                    this._createIcon("Icon"),
                    this._createText("Name"),
                    this._createText("Icon")
                ]
            }
            oTable.bindItems("/" + sPath, new sap.m.ColumnListItem({
                cells : aColumnCells
            }));
        },

        _addColumnHeader : function (oTable, sId) {
            if (sId === "tableFilterImage") {
                oTable.addColumn(this._createColumnHeader("Image"));
                oTable.addColumn(this._createColumnHeader("Name"));
            } else {
                oTable.addColumn(this._createColumnHeader("Icon"));
                oTable.addColumn(this._createColumnHeader("Name"));
                oTable.addColumn(this._createColumnHeader("Code"));
            }
        },

        _getColumnHeader : function (sId) {
            if (sId === "tableFilterImage") {
                return [
                    this._createColumnHeader("Image"),
                    this._createColumnHeader("Name")
                ];
            } else if (sId === "tableFilterLinks") {
                return [
                    this._createColumnHeader("Application Name"),
                    this._createColumnHeader("Technical Name")
                ];
            } else {
                return [
                    this._createColumnHeader("Icon"),
                    this._createColumnHeader("Name"),
                    this._createColumnHeader("Code")
                ];
            }
        },

        /*Creating the Table*/
        _createTable : function (sId, fSearchHandler) {
            return new sap.m.Table({
                id : this.getView().getId() + "--" + sId,
                mode : sap.m.ListMode.SingleSelectLeft,
                inset : false,
                fixedLayout : false,
                headerToolbar : new sap.m.Toolbar({
                    content: [
                        new sap.m.ToolbarSpacer({
                            width: "60%"
                        }),
                        new sap.m.SearchField({
                            placeholder: "Search",
                            search: fSearchHandler.bind(this)
                        })
                    ]
                }),
                columns :  this._getColumnHeader(sId)
            });
        },

        _getImageData : function () {
            var aImageItemList = [];

            aImageItemList.push({
                'Name': 'AW.png',
                'Image': sap.ovp.cards.linklist.AnnotationHelper.formUrl(this.getView().getModel().getProperty('/baseUrl'), 'img/AW.png')
            });

            return aImageItemList;
        },

        _getIconData : function (sIconUri) {
            var oIconPool = sap.ui.core.IconPool,
                aIcons = oIconPool.getIconNames(),
                aItemList = [];

            if (sIconUri) {
                var sName = sIconUri.split("://")[1],
                    iIndex = aIcons.indexOf(sName);
                aIcons.splice(iIndex, 1);
                aItemList.push({
                    'Name': sName,
                    'Icon': oIconPool.getIconURI(sName)
                });
            }

            for (var i = 0; i < aIcons.length; i++) {
                aItemList.push({
                    'Name': aIcons[i],
                    'Icon': oIconPool.getIconURI(aIcons[i])
                });
            }

            return aItemList;
        },

        _getLinkListItemId : function (oModel, iIndex) {
            return oModel.getProperty("/staticContent/" + iIndex + "/index");
        },

        _makeLinkListItemId : function (iIndex) {
            return "linkListItem--" + iIndex;
        },

        _makeLinkListItemIndex : function (iIndex) {
            return "Index--" + iIndex;
        },

        getIconAndImageDataModel : function (sIconUri) {
            /*Setting model to the table row*/
            return new sap.ui.model.json.JSONModel({
                'Icons': this._getIconData(sIconUri),
                'Images': this._getImageData()
            });
        },

        getSubHeader : function () {
            var oIconTabBar = new sap.m.IconTabBar({
                selectedKey: "ICON",
                select: function (oEvent) {
                    //Code for tab change goes here
                    var sKey = oEvent.getParameter("key");
                    if (sKey === "IMAGE") {
                        this.valueHelpDialog.setTable(this._oTableImage);
                        if (typeof this._oTableImage.getColumns === "function" && this._oTableImage.getColumns().length === 0) {
                            this._addColumnHeader(this._oTableImage, "tableFilterImage");
                        }
                    } else {
                        this.valueHelpDialog.setTable(this._oTable);
                        if (typeof this._oTable.getColumns === "function" && this._oTable.getColumns().length === 0) {
                            this._addColumnHeader(this._oTable, "tableFilter");
                        }
                    }
                }.bind(this)
            });
            var aTabs = ["ICON", "IMAGE"];
            for (var i = 0; i < aTabs.length; i++) {
                var iconTabFilter = new sap.m.IconTabFilter({
                    text: aTabs[i],
                    key: aTabs[i]
                });
                oIconTabBar.addItem(iconTabFilter);
            }
            return new sap.m.Toolbar({
                content: [
                    oIconTabBar
                ]
            });
        },

        destroyTemplatesAndObjects : function () {
            var oView = this.getView();
            var oTableFilterImage = oView.byId("tableFilterImage");
            if (oTableFilterImage) {
                oTableFilterImage.destroy();
            }
            var oTableFilter = oView.byId("tableFilter");
            if (oTableFilter) {
                oTableFilter.destroy();
            }
            var oTableFilterLinks = oView.byId("tableFilterLinks");
            if (oTableFilterLinks) {
                oTableFilterLinks.destroy();
            }
            delete this._oEvent;
            delete this._iCurrentRow;
            delete this._oModel;
            delete this._oVisibilityModel;
        },

        onExternalUrlChange : function (oEvent) {
            this.setEnablePropertyForResetAndSaveButton(true);
        },

        onLinkSourceChange : function (oEvent) {
            var oSource = oEvent.getSource(),
                oModel = oSource.getModel(),
                oVisibilityModel = oSource.getModel("visibility"),
                iIndex = this.getIndexFromIdForStaticLinkList(oSource.getId()),
                iSelectedIndex = oEvent.getParameter("selectedIndex"),
                oStaticLink = oVisibilityModel.getProperty("/staticLink"),
                oLinks = oVisibilityModel.getProperty("/links"),
                sId = this._getLinkListItemId(oModel, parseInt(iIndex));

            if (iSelectedIndex === 0) {
                oStaticLink[sId] = false;
                oLinks[sId] = true;
                oModel.setProperty("/staticContent/" + iIndex + "/targetUri", undefined);
            } else {
                oStaticLink[sId] = true;
                oLinks[sId] = false;
                oModel.setProperty("/staticContent/" + iIndex + "/semanticObject", undefined);
                oModel.setProperty("/staticContent/" + iIndex + "/action", undefined);
            }
            oVisibilityModel.setProperty("/staticLink", oStaticLink);
            oVisibilityModel.setProperty("/links", oLinks);
            oVisibilityModel.refresh(true);
            oModel.refresh(true);
            this.setEnablePropertyForResetAndSaveButton(true);
        },

        onRemoveVisualPress : function (oEvent) {
            var oSource = oEvent.getSource(),
                oModel = oSource.getModel(),
                oVisibilityModel = oSource.getModel("visibility"),
                iIndex = this.getIndexFromIdForStaticLinkList(oSource.getId()),
                sId = this._getLinkListItemId(oModel, parseInt(iIndex)),
                oRemoveVisual = oVisibilityModel.getProperty("/removeVisual");

            oRemoveVisual[sId] = false;
            oVisibilityModel.setProperty("/removeVisual", oRemoveVisual);
            oVisibilityModel.refresh(true);
            oModel.setProperty("/staticContent/" + iIndex + "/imageUri", undefined);
            oModel.refresh(true);
            this.updateCard(oEvent, "sapOvpSettingsStaticLinkListRemoveVisual");
        },

        createValueHelpDialogForInternalUrl : function (oEvent) {
            var oSource = oEvent.getSource(),
                oModel = oSource.getModel(),
                oExtraStaticCardPropertiesModel = oSource.getModel("staticCardProperties"),
                oVisibilityModel = oSource.getModel("visibility"),
                iIndex = this.getIndexFromIdForStaticLinkList(oSource.getId());

            this._oEvent = jQuery.extend({}, oEvent);
            this._iCurrentRow = iIndex;
            this._oModel = oModel;
            this._oVisibilityModel = oVisibilityModel;

            /*Creating the Table*/
            var oTable = this._createTable("tableFilterLinks", this.filterLinksTable);

            /*Data to Show in Table*/
            /*Setting model to the table row*/
            oTable.setModel(oExtraStaticCardPropertiesModel);

            this._createColumnCells(oTable, "links", "tableFilterLinks");
            this._oTable = oTable;

            /*Creating the value Help Dialog*/
            this.valueHelpDialog = new ValueHelpDialog({
                title: "Application",
                contentWidth: "100%",
                contentHeight: this.getValueInRemString(settingsUtils.iContentHeightForDialog),
                supportMultiselect: false,
                ok: function (oEvent) {
                    var oSelectedItem = this._oTable.getSelectedItem(),
                        sIntent = oSelectedItem.getBindingContext().getProperty("value"),
                        aIntentParts = sIntent.slice(1).split("-"),
                        sSemanticObject = aIntentParts[0],
                        sAction = aIntentParts[1];

                    this._oModel.setProperty("/staticContent/" + this._iCurrentRow + "/semanticObject", sSemanticObject);
                    this._oModel.setProperty("/staticContent/" + this._iCurrentRow + "/action", sAction);
                    this._oModel.refresh(true);
                    this.setEnablePropertyForResetAndSaveButton(true);
                    this.destroyTemplatesAndObjects();
                    this.valueHelpDialog.close();
                }.bind(this)
            });

            this.valueHelpDialog.addStyleClass("sapOvpSettingsDialogBox");

            this.valueHelpDialog.attachCancel(function() {
                this.destroyTemplatesAndObjects();
                this.valueHelpDialog.close();
            }.bind(this));
            this.valueHelpDialog.setTable(oTable);

            /*Preselecting the table item*/
            oTable.setSelectedItem(oTable.getItems()[0]);

            this.valueHelpDialog.open();
        },

        onChangeVisualPress : function (oEvent) {
            var oSource = oEvent.getSource(),
                oModel = oSource.getModel(),
                oVisibilityModel = oSource.getModel("visibility"),
                iIndex = this.getIndexFromIdForStaticLinkList(oSource.getId()),
                sIconUri = oModel.getProperty("/staticContent/" + iIndex + "/imageUri"),
                bNotIcon = sap.ovp.cards.linklist.AnnotationHelper.isImageUrlStaticData(sIconUri);

            this._oEvent = jQuery.extend({}, oEvent);
            this._iCurrentRow = iIndex;
            this._oModel = oModel;
            this._oVisibilityModel = oVisibilityModel;

            /*Creating the Table*/
            var oTable = this._createTable("tableFilter", this.filterIconTable);

            /*Data to Show in Table*/
            /*Setting model to the table row*/
            var oRowsModel = (bNotIcon) ? this.getIconAndImageDataModel() : this.getIconAndImageDataModel(sIconUri);
            oTable.setModel(oRowsModel);

            this._createColumnCells(oTable, "Icons", "tableFilter");
            this._oTable = oTable;

            //oTable.attachSelectionChange(this.updateTheLineItemSelected.bind(this));

            /*Creating the Table*/
            var oTableImage = this._createTable("tableFilterImage", this.filterImageTable);

            oTableImage.setModel(oRowsModel);

            this._createColumnCells(oTableImage, "Images", "tableFilterImage");
            this._oTableImage = oTableImage;

            // subHeader
            var oToolBar = this.getSubHeader();

            /*Creating the value Help Dialog*/
            this.valueHelpDialog = new ValueHelpDialog({
                title: "Visual",
                contentWidth: "100%",
                contentHeight: this.getValueInRemString(settingsUtils.iContentHeightForDialog),
                supportMultiselect: false,
                ok: function (oEvent) {
                    var oTable, sPropertyName,
                        sId = this._getLinkListItemId(this._oModel, parseInt(this._iCurrentRow)),
                        oRemoveVisual = this._oVisibilityModel.getProperty("/removeVisual");

                    oRemoveVisual[sId] = true;
                    this._oVisibilityModel.setProperty("/removeVisual", oRemoveVisual);
                    this._oVisibilityModel.refresh(true);
                    if (this._sTableName === "tableFilterImage") {
                        oTable = this._oTableImage;
                        sPropertyName = "Image";
                    } else {
                        oTable = this._oTable;
                        sPropertyName = "Icon";
                    }
                    var oSelectedItem = oTable.getSelectedItem(),
                        oSelectedItemContext = oSelectedItem.getBindingContext(),
                        sUri = oSelectedItemContext.getProperty(sPropertyName);
                    this._oModel.setProperty("/staticContent/" + this._iCurrentRow + "/imageUri", sUri);
                    this._oModel.refresh(true);
                    this.updateCard(this._oEvent, "sapOvpSettingsStaticLinkListChangeVisual");
                    this.destroyTemplatesAndObjects();
                    this.valueHelpDialog.close();
                }.bind(this)
            });

            this.valueHelpDialog.attachSelectionChange(function (oEvent) {
                var oTableSelectionParams = oEvent.getParameter("tableSelectionParams");

                if (oTableSelectionParams.id.indexOf("tableFilterImage") === -1) {
                    this._sTableName = "tableFilter";
                } else {
                    this._sTableName = "tableFilterImage";
                }
            }.bind(this));

            this.valueHelpDialog.addStyleClass("sapOvpSettingsDialogBox");

            this.valueHelpDialog.attachCancel(function() {
                this.destroyTemplatesAndObjects();
                this.valueHelpDialog.close();
            }.bind(this));
            this.valueHelpDialog.setTable(oTable);
            this.valueHelpDialog.setSubHeader(oToolBar);

            /*Preselecting the table item*/
            oTable.setSelectedItem(oTable.getItems()[0]);

            this.valueHelpDialog.open();

        },

        handleMessagePopoverPress : function (oEvent) {
            settingsUtils.oMessagePopOver.openBy(oEvent.getSource());
        },

        onShowMorePress : function (oEvent) {
            var oSource = oEvent.getSource(),
                oModel = oSource.getModel(),
                oVisibilityModel = oSource.getModel("visibility"),
                iIndex = this.getIndexFromIdForStaticLinkList(oSource.getId()),
                sId = this._getLinkListItemId(oModel, parseInt(iIndex)),
                bShowMore = oVisibilityModel.getProperty("/showMore/" + sId);

            if (bShowMore) {
                oVisibilityModel.setProperty("/showMore/" + sId, false);
            } else {
                oVisibilityModel.setProperty("/showMore/" + sId, true);
            }
            oVisibilityModel.refresh(true);
        },

        onPressDelete : function (oEvent) {
            this._oEvent = jQuery.extend({}, oEvent);
            MessageBox.confirm(
                "Do you want to delete the Line Item",
                {
                    actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                    icon: MessageBox.Icon.INFORMATION,
                    title: "Information",
                    initialFocus: MessageBox.Action.CANCEL,
                    onClose: function(sAction) {
                        if (sAction === "OK") {
                            var oSource = this._oEvent.getSource(),
                                oVisibilityModel = oSource.getModel("visibility"),
                                oModel = oSource.getModel(),
                                aStaticContent = this._getStaticContentArray(oModel),
                                iIndex = this._getSelectedItemIndex(oModel),
                                sId = this._getLinkListItemId(oModel, iIndex),
                                oStaticLink = oVisibilityModel.getProperty("/staticLink"),
                                oLinks = oVisibilityModel.getProperty("/links"),
                                oRemoveVisual = oVisibilityModel.getProperty("/removeVisual"),
                                oShowMore = oVisibilityModel.getProperty("/showMore");

                            delete oStaticLink[sId];
                            delete oLinks[sId];
                            delete oRemoveVisual[sId];
                            delete oShowMore[sId];
                            oVisibilityModel.setProperty("/staticLink", oStaticLink);
                            oVisibilityModel.setProperty("/links", oLinks);
                            oVisibilityModel.setProperty("/removeVisual", oRemoveVisual);
                            oVisibilityModel.setProperty("/showMore", oShowMore);
                            aStaticContent.splice(iIndex, 1);
                            this._setStaticContentArray(oModel, aStaticContent);
                            oModel.refresh(true);
                            if (aStaticContent.length > 0) {
                                this._setSelectedItemAndScrollToElement(Math.min(parseInt(iIndex), aStaticContent.length - 1), true);
                            }
                            if (aStaticContent.length <= 1) {
                                oVisibilityModel.setProperty("/delete", false);
                            }
                            oVisibilityModel.refresh(true);
                            this.updateCard(this._oEvent, "sapOvpSettingsStaticLinkListDelete");
                        }
                        delete this._oEvent;
                    }.bind(this)
                }
            );
        },

        onPressAdd : function (oEvent) {
            var oSource = oEvent.getSource(),
                oVisibilityModel = oSource.getModel("visibility"),
                oModel = oSource.getModel(),
                aStaticContent = this._getStaticContentArray(oModel),
                iLineItemIdCounter = oModel.getProperty("/lineItemIdCounter"),
                sId = this._makeLinkListItemId(iLineItemIdCounter + 1),
                sIndex = this._makeLinkListItemIndex(iLineItemIdCounter + 1),
                oStaticLink = oVisibilityModel.getProperty("/staticLink"),
                oLinks = oVisibilityModel.getProperty("/links"),
                oRemoveVisual = oVisibilityModel.getProperty("/removeVisual"),
                oShowMore = oVisibilityModel.getProperty("/showMore");

            oModel.setProperty("/lineItemIdCounter", iLineItemIdCounter + 1);
            aStaticContent.unshift({
                "id": sId,
                "index": sIndex,
                "title": "Default Title",
                "subTitle": "",
                "imageUri": "",
                "imageAltText": "",
                "targetUri": "",
                "openInNewWindow": ""
            });
            oStaticLink[sIndex] = true;
            oLinks[sIndex] = false;
            oRemoveVisual[sIndex] = false;
            oShowMore[sIndex] = true;
            oVisibilityModel.setProperty("/staticLink", oStaticLink);
            oVisibilityModel.setProperty("/links", oLinks);
            oVisibilityModel.setProperty("/removeVisual", oRemoveVisual);
            oVisibilityModel.setProperty("/showMore", oShowMore);
            oVisibilityModel.refresh(true);
            this._setStaticContentArray(oModel, aStaticContent);
            oModel.refresh(true);
            this._setSelectedItemAndScrollToElement(0);
            this.updateCard(oEvent, "sapOvpSettingsStaticLinkListAdd");
        },

        onPressMoveToTheTop : function (oEvent) {
            var oModel = oEvent.getSource().getModel();
            this._arrangeStaticContent(oModel, this._getSelectedItemIndex(oModel), 0);
            this.updateCard(oEvent, "sapOvpSettingsStaticLinkListSort");
        },

        onPressMoveUp : function (oEvent) {
            var oModel = oEvent.getSource().getModel(),
                iIndex = this._getSelectedItemIndex(oModel);
            this._arrangeStaticContent(oModel, iIndex, iIndex - 1);
            this.updateCard(oEvent, "sapOvpSettingsStaticLinkListSort");
        },

        onPressMoveDown : function (oEvent) {
            var oModel = oEvent.getSource().getModel(),
                iIndex = this._getSelectedItemIndex(oModel);
            this._arrangeStaticContent(oModel, iIndex, iIndex + 1);
            this.updateCard(oEvent, "sapOvpSettingsStaticLinkListSort");
        },

        onPressMoveToTheBottom : function (oEvent) {
            var oModel = oEvent.getSource().getModel(),
                iIndexFrom = this._getSelectedItemIndex(oModel),
                iIndexTo = this._getLastItemIndex(oModel);
            this._arrangeStaticContent(oModel, iIndexFrom, iIndexTo);
            this.updateCard(oEvent, "sapOvpSettingsStaticLinkListSort");
        },

        onResetButton : function () {
            this.setEnablePropertyForResetAndSaveButton(false);
            this._oCardManifestSettings = jQuery.extend(true, {}, this._oOriginalCardManifestSettings);
            var oCardPropertiesModel = new sap.ui.model.json.JSONModel(this._oCardManifestSettings);
            settingsUtils.setVisibilityForFormElements(this._oCardManifestSettings);
            this.getView().getModel('visibility').refresh();

            this.getView().setModel(oCardPropertiesModel);
            this.getView().getModel().refresh();
            this._fCardWithRefresh();
        },
        setBusy : function (bBusy) {
            if (bBusy) {
//                this.getView().byId("dialogCard").addStyleClass("componentContainerBusy");
                this.getView().addStyleClass("dialogContainerOverlay");
                var dialogCard = this.getView().byId("dialogCard");
                if (dialogCard.getVisible()) {
                    dialogCard.getComponentInstance().getRootControl().setBusy(bBusy);
                }
            } else {
//                this.getView().byId("dialogCard").removeStyleClass("componentContainerBusy");
                this.getView().removeStyleClass("dialogContainerOverlay");
//                this.getView().byId("dialogCard").setBusy(bBusy);
                setTimeout( function(){
                    var dialogCard = this.getView().byId("dialogCard");
                    if (dialogCard.getVisible()) {
                        dialogCard.getComponentInstance().getRootControl().setBusy(bBusy);
                    }
                }.bind(this), 2000);
            }
            
//            this.getView().byId("dialogCard").setBusy(bBusy);

        },

        _fCardWithoutRefresh : function (oEvent, updatedElementProps) {
            var oView = this.getView(),
                oCardManifestSettings = this._oCardManifestSettings,
                oComponentInstance = oView.byId("dialogCard").getComponentInstance(),
                oRootControl = oComponentInstance.getRootControl(),
                oElement,
                isViewSwitchEnabled = false,
                iSelectedKey;
            if(oCardManifestSettings.tabs && oCardManifestSettings.tabs.length) {
                isViewSwitchEnabled = true;
                iSelectedKey = parseInt(oCardManifestSettings.selectedKey,10);
            }
            if (updatedElementProps.formElementId === "sapOvpSettingsLineItemTitle" ||
                updatedElementProps.formElementId === "sapOvpSettingsLineItemSubTitle") {
                oElement = oRootControl.byId(updatedElementProps.cardElementId + "--" + oView.getModel().getProperty("/lineItemId"));
            } else {
                oElement = oRootControl.byId(updatedElementProps.cardElementId);
            }
            switch (updatedElementProps.formElementId) {
                case "sapOvpSettingsLineItemTitle":
                case "sapOvpSettingsLineItemSubTitle":
                case "sapOvpSettingsTitle" :
                case "sapOvpSettingsValueSelectionInfo" :
                    oElement.setText(oEvent.getSource().getValue());
                    break;
                case "sapOvpSettingsSubTitle" :
                    var oCardController = oRootControl.getController(),
                        oCardPropertiesModel = oCardController.getCardPropertiesModel();
                    oCardPropertiesModel.setProperty("/subTitle", oEvent.getSource().getValue());
                    oCardController._setSubTitleWithUnitOfMeasure();
                    break;
                case "sapOvpViewName":
                    var oManifestModel = oView.getModel(),
                        viewName = oCardManifestSettings.viewName;
                    oElement.getItems()[iSelectedKey-1].setText(viewName);
                    oCardManifestSettings.tabs[iSelectedKey-1].value = viewName;
                    if(oCardManifestSettings.defaultViewSelected === iSelectedKey) {
                        viewName = viewName + " (default view)";
                    }
                    oCardManifestSettings.aViews[iSelectedKey].text = viewName;
                    oManifestModel.refresh();
                    break;
                case "sapOvpDefaultViewSwitch":
                    if(oEvent.getSource().getState()) {
                        var defaultSelectedKey = oCardManifestSettings.defaultViewSelected,
                            oManifestModel = oView.getModel();
                        oCardManifestSettings.defaultViewSelected = iSelectedKey;
                        oCardManifestSettings.aViews[defaultSelectedKey].text = oCardManifestSettings.tabs[defaultSelectedKey-1].value;
                        oCardManifestSettings.aViews[iSelectedKey].text += " (default view)";
                        oManifestModel.refresh();
                        this.defaultViewSwitch = oEvent.getSource();
                        this.defaultViewSwitch.setEnabled(false);
                    }
                    break;
                case "sapOvpSettingsIdentification" :
                    if(isViewSwitchEnabled) {
                        oCardManifestSettings.tabs[iSelectedKey-1][updatedElementProps.updateProperty] = oCardManifestSettings[updatedElementProps.updateProperty];
                    }
                    break;
                case "sapOvpSettingsKPIHeaderSwitch" :
                    var oVisibilityModel = oView.getModel("visibility"),
                        oVisibilityData = oVisibilityModel.getData();
                    oVisibilityData.dataPoint = false;
                    oVisibilityData.valueSelectionInfo = false;
                    if(isViewSwitchEnabled) {
                        oCardManifestSettings.tabs.forEach(function(tab) {
                            tab.prevDataPointAnnotationPath = tab.dataPointAnnotationPath;
                            tab.dataPointAnnotationPath = undefined;
                        });
                    } else {
                        var sDataPointAnnotationPath = oCardManifestSettings.dataPointAnnotationPath;
                        if (sDataPointAnnotationPath) {
                            oCardManifestSettings.prevDataPointAnnotationPath = sDataPointAnnotationPath;
                        }
                        oCardManifestSettings.dataPointAnnotationPath = undefined;
                    }
                    oVisibilityModel.refresh(true);
                    oElement.destroy();
                    break;
                default :
                    break;
            }
        },

        _fCardWithRefresh : function (oEvent, updateProperty) {
            var sPrevDataPointAnnotationPath,defaultViewSelected,oView,oVisibilityModel,oVisibilityData,
                oCardManifestSettings = this._oCardManifestSettings,
                oSettingDialog = this.getView(),
                oComponentContainer = oSettingDialog.byId('dialogCard'),
                card = oComponentContainer.getComponentInstance().getComponentData(),
                sCardId = card.cardId,
                modelName = card.manifest.cards[sCardId].model,
                oManifest = {
                    cards: {}
                },
                isViewSwitchEnabled = false,
                iSelectedKey;
            if(oCardManifestSettings.tabs && oCardManifestSettings.tabs.length) {
                isViewSwitchEnabled = true;
                /*selectedKey gets set to string from UI select Box*/
                iSelectedKey = parseInt(oCardManifestSettings.selectedKey,10);
            }

            switch (updateProperty) {
                case "subTitleSwitch" :
                    oView = this.getView();
                    oVisibilityModel = oView.getModel("visibility");
                    if (oEvent.getSource().getState()) {
                        if (isViewSwitchEnabled) {
                            defaultViewSelected = oCardManifestSettings.defaultViewSelected;
                            oCardManifestSettings.tabs.forEach(function (tab) {
                                sPrevDataPointAnnotationPath = tab.prevDynamicSubtitleAnnotationPath;
                                if (sPrevDataPointAnnotationPath) {
                                    tab.dynamicSubtitleAnnotationPath = sPrevDataPointAnnotationPath;
                                } else {
                                    tab.dynamicSubtitleAnnotationPath = oCardManifestSettings.dynamicSubTitle[0].value;
                                }
                            }.bind(this));
                            oCardManifestSettings.dynamicSubtitleAnnotationPath = oCardManifestSettings.tabs[defaultViewSelected - 1].dynamicSubtitleAnnotationPath;
                        } else {
                            sPrevDataPointAnnotationPath = oCardManifestSettings.prevDynamicSubtitleAnnotationPath;
                            if (sPrevDataPointAnnotationPath) {
                                oCardManifestSettings.dynamicSubtitleAnnotationPath = sPrevDataPointAnnotationPath;
                            } else {
                                oCardManifestSettings.dynamicSubtitleAnnotationPath = oCardManifestSettings.dynamicSubTitle[0].value;
                            }
                        }
                        oSettingDialog.byId("sapOvpSettingsDynamicSubTitle").setSelectedKey(oCardManifestSettings.dynamicSubtitleAnnotationPath);
                    } else {
                        if(isViewSwitchEnabled) {
                            oCardManifestSettings.tabs.forEach(function(tab) {
                                tab.prevDynamicSubtitleAnnotationPath = tab.dynamicSubtitleAnnotationPath;
                                tab.dynamicSubtitleAnnotationPath = undefined;
                            });
                            oCardManifestSettings.dynamicSubtitleAnnotationPath = undefined;
                        } else {
                            var sDataPointAnnotationPath = oCardManifestSettings.dynamicSubtitleAnnotationPath;
                            if (sDataPointAnnotationPath) {
                                oCardManifestSettings.prevDynamicSubtitleAnnotationPath = sDataPointAnnotationPath;
                            }
                            oCardManifestSettings.dynamicSubtitleAnnotationPath = undefined;
                        }
                    }
                    oVisibilityModel.setProperty("/subTitle",
                        settingsUtils.getVisibilityOfElement(oCardManifestSettings, 'subTitle', isViewSwitchEnabled));
                    oVisibilityModel.setProperty("/dynamicSubTitle",
                        settingsUtils.getVisibilityOfElement(oCardManifestSettings, 'dynamicSubTitle', isViewSwitchEnabled)
                        && !!oCardManifestSettings["dynamicSubTitle"] && !!oCardManifestSettings["dynamicSubTitle"].length);
                    oVisibilityModel.refresh(true);
                    break;
                case "kpiHeader" :
                    oView = this.getView();
                    oVisibilityModel = oView.getModel("visibility");
                    oVisibilityData = oVisibilityModel.getData();
                    oVisibilityData.valueSelectionInfo = true;
                    oVisibilityData.dataPoint = true;
                    if(oCardManifestSettings.tabs && oCardManifestSettings.tabs.length ) {
                        oVisibilityData.dataPoint = settingsUtils.getVisibilityOfElement(oCardManifestSettings, 'dataPoint', true);
                    }
                    if(!oCardManifestSettings.valueSelectionInfo) {
                        oCardManifestSettings.valueSelectionInfo = " ";
                    }
                    if (isViewSwitchEnabled) {
                        defaultViewSelected = oCardManifestSettings.defaultViewSelected;
                        oCardManifestSettings.tabs.forEach(function (tab) {
                            sPrevDataPointAnnotationPath = tab.prevDataPointAnnotationPath;
                            if(sPrevDataPointAnnotationPath) {
                                tab.dataPointAnnotationPath = sPrevDataPointAnnotationPath;
                            } else {
                                tab.dataPointAnnotationPath = oCardManifestSettings.dataPoint[0].value;
                            }
                        }.bind(this));
                        oCardManifestSettings.dataPointAnnotationPath = oCardManifestSettings.tabs[defaultViewSelected-1].dataPointAnnotationPath;
                    } else {
                        sPrevDataPointAnnotationPath = oCardManifestSettings.prevDataPointAnnotationPath;
                        if (sPrevDataPointAnnotationPath) {
                            oCardManifestSettings.dataPointAnnotationPath = sPrevDataPointAnnotationPath;
                        } else {
                            oCardManifestSettings.dataPointAnnotationPath = oCardManifestSettings.dataPoint[0].value;
                        }
                    }
                    oVisibilityModel.refresh(true);
                    break;
                case "listType" :
                    oEvent.getSource().getState() ? (oCardManifestSettings[updateProperty] = "extended") : (oCardManifestSettings[updateProperty] = "condensed");
                    break;
                case "listFlavor" :
                    oEvent.getSource().getState() ? (oCardManifestSettings[updateProperty] = "bar") : (oCardManifestSettings[updateProperty] = "");
                    break;
                case "sortBy" :
                    oView = this.getView();
                    oVisibilityModel = oView.getModel("visibility");
                    oVisibilityData = oVisibilityModel.getData();
                    if(!!oCardManifestSettings.sortBy !== oVisibilityData.sortOrder ) {
                        oVisibilityData.sortOrder = !!oCardManifestSettings.sortBy;
                        oVisibilityModel.refresh();
                    }
                case "listFlavorForLinkList":
                case "sortOrder":
                    break;
                case "annotationPath":
                case "chartAnnotationPath":
                case "presentationAnnotationPath":
                case "selectionAnnotationPath":
                    break;
                case "dataPointAnnotationPath":
                    if (isViewSwitchEnabled) {
                        oCardManifestSettings.tabs[iSelectedKey-1][updateProperty] = oCardManifestSettings[updateProperty];
                    }
                    break;
                case "add":
                case "removeVisual":
                case "changeVisual":
                case "sort":
                case "delete":
                    break;
                default :
                    break;
            }
            oManifest.cards[sCardId] = {
                model: modelName,
                template: card.template,
                settings: oCardManifestSettings
            };

            this.setBusy(true);
            var oPromise = commonUtils.createCardComponent(oSettingDialog, oManifest, 'dialogCard');
            oPromise.then(function(){
                this.setBusy(false);
            }.bind(this));
            oPromise.catch(function(){
                this.setBusy(false);
            }.bind(this));
        },

        updateCard : function(oEvent, sId) {
            /*Reset Card Level Button*/
            var oCardManifestSettings = this._oCardManifestSettings,
                dialogCard = this.getView().byId("dialogCard");
            this.setEnablePropertyForResetAndSaveButton(true);
            if (dialogCard.getVisible()) {
                /*Reset View Level Button*/
                if (oCardManifestSettings.tabs && oCardManifestSettings.tabs.length) {
                    /*selectedKey gets set to string from UI select Box*/
                    var iSelectedKey = parseInt(oCardManifestSettings.selectedKey, 10);
                    oCardManifestSettings.isViewResetEnabled = true;
                    oCardManifestSettings.aViews[iSelectedKey].isViewResetEnabled = true;
                }
                var oSource = oEvent.getSource(),
                    sourceElementId = (sId) ? sId : oSource.getId(),
                    bCardWithoutRefresh = false;
                if (sourceElementId.indexOf("sapOvpStaticLinkListLineItem") !== -1) {
                    var oCardPropertiesModel = oSource.getModel(),
                        aStaticContent = oCardPropertiesModel.getData().staticContent,
                        iIndex = this.getIndexFromIdForStaticLinkList(sourceElementId);

                    // Setting the Active Page in Case of Carousel Card
                    this.setCurrentActivePageForCarouselCard(iIndex);

                    oCardPropertiesModel.setProperty("/lineItemId", aStaticContent[iIndex].id);
                    if (sourceElementId.indexOf("sapOvpSettingsLineItemTitle") !== -1) {
                        sourceElementId = "sapOvpSettingsLineItemTitle";
                    } else if (sourceElementId.indexOf("sapOvpSettingsLineItemSubTitle") !== -1) {
                        sourceElementId = "sapOvpSettingsLineItemSubTitle";
                    }
                }
                for (var i = 0; i < this._aRefreshNotRequired.length; i++) {
                    if (sourceElementId.indexOf(this._aRefreshNotRequired[i].formElementId) > -1) {
                        if (this._aRefreshNotRequired[i].isKpiSwitch && oEvent.getSource().getState()) {
                            break;
                        }
                        this._fCardWithoutRefresh(oEvent, this._aRefreshNotRequired[i]);
                        bCardWithoutRefresh = true;
                        break;
                    }
                }
                if (!bCardWithoutRefresh) {
                    for (var j = 0; j < this._aRefreshRequired.length; j++) {
                        if (sourceElementId.indexOf(this._aRefreshRequired[j].formElementId) > -1) {
                            this.setBusy(true);
                            this._fCardWithRefresh(oEvent, this._aRefreshRequired[j].updateProperty);
                            break;
                        }
                    }
                }
            }
        },
        onExit: function () {
            settingsUtils.oSaveButton.detachPress(this.createAndSubmitChange,this);
            settingsUtils.oResetButton.detachPress(this.createAndSubmitChange,this);
        },
        updateTheLineItemSelected: function (event) {
            /*Getting the Value from the value seleciton info dialog*/
            var selectedItem = event.getSource().getSelectedItem().getBindingContext().getObject().Qualifier,
                oCardManifestSettings = this._oCardManifestSettings,
            /*selectedKey gets set to string from UI select Box*/
                iSelectedKey;
            if(oCardManifestSettings.tabs && oCardManifestSettings.tabs.length) {
                iSelectedKey = parseInt(oCardManifestSettings.selectedKey,10);
            }
            /*Updating the selected values to the Model*/
            oCardManifestSettings.lineItemQualifier = selectedItem;
            oCardManifestSettings.annotationPath = 'com.sap.vocabularies.UI.v1.LineItem#' + selectedItem;
            if (selectedItem === 'Default') {
                oCardManifestSettings.annotationPath = 'com.sap.vocabularies.UI.v1.LineItem';
            }
            if(oCardManifestSettings.tabs && oCardManifestSettings.tabs.length) {
                oCardManifestSettings.tabs[iSelectedKey-1].annotationPath =
                    oCardManifestSettings.annotationPath;
            }
            /*Updating the Value to lineItem Input*/
            this.getView().byId("sapOvpSettingsLineItem").setValue(selectedItem);

            /*Updating the card view*/
            this._fCardWithRefresh(event,'annotationPath');
            /*Reset Card Level Button*/
            this.setEnablePropertyForResetAndSaveButton(true);
            /*Reset View Level Button*/
            if(oCardManifestSettings.tabs && oCardManifestSettings.tabs.length) {
                oCardManifestSettings.isViewResetEnabled = true;
                oCardManifestSettings.aViews[iSelectedKey].isViewResetEnabled = true;
            }
            this.valueHelpDialog.close();
        },
        getListItems : function() {
            /*Getting the  iContext for sap.ovp.annotationHelper Function*/
            var aItemList = [],
                oCardManifestSettings = this._oCardManifestSettings,
                oSettingDialog = this.getView(),
                oComponentContainer = oSettingDialog.byId('dialogCard'),
                card = oComponentContainer.getComponentInstance().getComponentData(),
                lineItemBindingPath = oCardManifestSettings.entityType.$path + '/' + oCardManifestSettings.annotationPath,
                oModel = card.model.getMetaModel(),
                iContext = oModel.getContext(oModel.resolve(lineItemBindingPath, this.oView.getBindingContext()));

            /*Forming Visible Fields String*/
            ////For Condensed List
            var maxDataFields = 2,
                maxDataPoints = 1,
                noOfDataFieldsReplaceableByDataPoints = 0;
            if (oCardManifestSettings.listFlavor === 'bar') {
                //For Condensed List  Bar Card :- Max Data Fields = 2 and Max DataPoints = 1 and Replaceable fields are 0
                maxDataFields = 1;
                maxDataPoints = 2;
            }

            if (oCardManifestSettings.listType && oCardManifestSettings.listType.toLowerCase() === 'extended') {
                //For Extended List Card :- Max Data Fields = 6 and Max DataPoints =  and Replaceable fields are 0
                maxDataFields = 6;
                maxDataPoints = 3;
                noOfDataFieldsReplaceableByDataPoints = 3;
                if (oCardManifestSettings.listFlavor === 'bar') {
                    //For Extended Bar List Card
                    maxDataFields = 5;
                }
            } else if (oCardManifestSettings.contentFragment === "sap.ovp.cards.table.Table") {
                //For Table Card Max Data :- Fields = 3 and Max DataPoints = 1 and Replaceable fields are 1
                maxDataFields = 3;
                maxDataPoints = 1;
                noOfDataFieldsReplaceableByDataPoints = 1;
            }
            oCardManifestSettings.lineItem.forEach(function (lineItem) {
                var aDataPointsObjects = sap.ovp.cards.AnnotationHelper.getSortedDataPoints(iContext,lineItem.fields),
                    aDataFieldsObjects = sap.ovp.cards.AnnotationHelper.getSortedDataFields(iContext,lineItem.fields),
                    dataFields = [],
                    dataPoints = [];
                aDataPointsObjects.forEach(function (fields) {
                    if (fields.Title) {
                        dataPoints.push(fields.Title.String);
                    }
                });
                aDataFieldsObjects.forEach(function (fields) {
                    if (fields.Label) {
                        dataFields.push(fields.Label.String);
                    }
                });
                var noOfDataPointsUsed = Math.min(dataPoints.length, maxDataPoints),
                    noOfDataPointsOccupyingDataFieldsSpace = Math.min(noOfDataFieldsReplaceableByDataPoints,noOfDataPointsUsed),
                    visibleField = dataFields.slice(0, maxDataFields - noOfDataPointsOccupyingDataFieldsSpace)
                        .concat(dataPoints.slice(0, noOfDataPointsUsed));
                visibleField.map(function(field){
                    return field.charAt(0).toUpperCase() + field.substr(1);
                });
                aItemList.push({
                    Qualifier: lineItem.name,
                    VisibleFields: visibleField.toString()
                });
            });
            return aItemList;
        },
        openLineItemValueHelpDialog: function(oEvent) {
            /*Creating the Table*/
            var oTable = new sap.m.Table({
                mode : sap.m.ListMode.SingleSelectLeft,
                inset : false,
                fixedLayout : false,
                columns : [
                    new sap.m.Column({
                        header :[
                            new sap.m.Label({
                                text : sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText('OVP_KEYUSER_LINEITEM_QUAL')
                            }) ]
                    }),
                    new sap.m.Column({
                        header :[
                            new sap.m.Label({
                                text : sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("OVP_KEYUSER_VISIBLE_FIELDS")
                            }) ]
                    })
                ]
            });
            oTable.bindItems("/", new sap.m.ColumnListItem({
                cells : [ new sap.m.Text({text : "{Qualifier}"}),
                    new sap.m.Text({text : "{VisibleFields}"})
                ]
            }));
            oTable.attachSelectionChange(this.updateTheLineItemSelected.bind(this));


            /*Creating the value Help Dialog*/
            this.valueHelpDialog = new ValueHelpDialog({
                title: sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("OVP_KEYUSER_LINEITEM_ANNO"),
                contentWidth: "100%",
                contentHeight: this.getValueInRemString(settingsUtils.iContentHeightForDialog + 0.125),
                supportMultiselect: false
            });
            this.valueHelpDialog.attachCancel(function() {
                this.valueHelpDialog.close();
            }.bind(this));
            this.valueHelpDialog.setTable(oTable);

            this.valueHelpDialog.addStyleClass("sapOvpSettingsDialogBox");

            /*Data to Show in Table*/
            this.aItemList = this.getListItems();

            /*Setting model to the table row*/
            var oRowsModel = new sap.ui.model.json.JSONModel();
            oRowsModel.setData(this.aItemList);
            this.valueHelpDialog.getTable().setModel(oRowsModel);

            /*Preselecting the table item*/
            oTable.getItems().forEach(function(item) {
                if (item.getBindingContext().getObject().Qualifier === this._oCardManifestSettings.lineItemQualifier) {
                    item.setSelected(true);
                }
            }.bind(this));

            this.valueHelpDialog.open();

        },

        generateId : function(sCardId, sPath, sPropertyName) {
            return settingsUtils.sApplicationId + "_sap.ovp.cards." + sCardId + "." + sPath + "." + sPropertyName;
        },

        createTranslationTextObject : function(sValue) {
            return {
                "type": "XTIT",
                "maxLength": 40,
                "value": {
                    "": sValue,
                    "en": sValue
                }
            };
        },

        createAndSubmitChange : function() {
            var i, j, k, sPropertyName, aStaticContent, aOriginalStaticContent,
                aTabs, aOriginalTabs, oText, oParameters = {
                    card: {}
                }, oCardManifest = jQuery.extend(true, {}, settingsUtils.oAppDescriptor), oFlexCardManifest = {};
            var cardId = "customer." + oCardManifest.id;
            oFlexCardManifest.cardId = cardId;
            /**
             * Deleting unnecessary Manifest settings
             */
            delete oCardManifest.id;
            delete oCardManifest.settings.baseUrl;
            if (oCardManifest.settings["staticContent"]) {
                for (i = 0; i < oCardManifest.settings["staticContent"].length; i++) {
                    delete oCardManifest.settings["staticContent"][i].id;
                }
            }

            /**
             * Adding/Removing staticContent and tabs elements from Manifest
             * which do/don't exist in the updated Manifest
             */
            // StaticContent
            aStaticContent = this._oCardManifestSettings["staticContent"];
            aOriginalStaticContent = this._oOriginalCardManifestSettings["staticContent"];
            if (aStaticContent && aOriginalStaticContent) {
                if (aStaticContent.length < aOriginalStaticContent.length) {
                    oCardManifest.settings["staticContent"].splice(aStaticContent.length, aOriginalStaticContent.length - aStaticContent.length);
                } else if (aStaticContent.length > aOriginalStaticContent.length) {
                    for (i = 0; i < aStaticContent.length - aOriginalStaticContent.length; i++) {
                        oCardManifest.settings["staticContent"].push({});
                    }
                }
            }
            // Tabs
            aTabs = this._oCardManifestSettings["tabs"];
            if (!aTabs) {
                delete this._oCardManifestSettings.selectedKey;
            }
            aOriginalTabs = this._oOriginalCardManifestSettings["tabs"];
            if (aTabs || aOriginalTabs) {
                if (!aTabs) {
                    if (oCardManifest.settings["tabs"]) {
                        delete oCardManifest.settings["tabs"];
                    }
                } else if (!aOriginalTabs || aTabs.length > aOriginalTabs.length) {
                    var len;
                    if (!aOriginalTabs) {
                        len = aTabs.length;
                        oCardManifest.settings["tabs"] = [];
                    } else {
                        len = aTabs.length - aOriginalTabs.length;
                    }
                    for (i = 0; i < len; i++) {
                        oCardManifest.settings["tabs"].push({});
                    }
                } else if (aTabs.length < aOriginalTabs.length) {
                    oCardManifest.settings["staticContent"].splice(aTabs.length, aOriginalTabs.length - aTabs.length);
                }
            }
            oFlexCardManifest.settings = jQuery.extend(true, {}, oCardManifest.settings);

            /**
             * Making an Object oText containing translation properties
             * type is "XTIT"
             * maxLength is 40
             */
            var aCardSettingsWithText = SettingsConstants.cardSettingsWithText;
            for (i = 0; i < aCardSettingsWithText.length; i++) {
                var sId;
                if (typeof aCardSettingsWithText[i] == "string") {
                    if (this._oCardManifestSettings[aCardSettingsWithText[i]] != this._oOriginalCardManifestSettings[aCardSettingsWithText[i]]) {
                        if (this._oCardManifestSettings[aCardSettingsWithText[i]]) {
                            if (!oText) {
                                oText = {};
                            }
                            sId = this.generateId(cardId, "settings", aCardSettingsWithText[i]);
                            if (this._oCardManifestSettings[aCardSettingsWithText[i]]) {
                                oCardManifest.settings[aCardSettingsWithText[i]] = "{{" + sId + "}}";
                                oFlexCardManifest.settings[aCardSettingsWithText[i]] = this._oCardManifestSettings[aCardSettingsWithText[i]];
                                oText[sId] = this.createTranslationTextObject(this._oCardManifestSettings[aCardSettingsWithText[i]]);
                            }
                        } else {
                            delete oCardManifest.settings[aCardSettingsWithText[i]];
                            delete oFlexCardManifest.settings[aCardSettingsWithText[i]];
                        }
                    }
                } else if (typeof aCardSettingsWithText[i] == "object") {
                    // TODO: Check the translation scenario when position of link list items are changed
                    if (aCardSettingsWithText[i].hasOwnProperty("staticContent")) {
                        if (aStaticContent && aOriginalStaticContent) {
                            for (j = 0; j < aStaticContent.length; j++) {
                                for (k = 0; k < aCardSettingsWithText[i]["staticContent"].length; k++) {
                                    sPropertyName = aCardSettingsWithText[i]["staticContent"][k];
                                    if (j >= aOriginalStaticContent.length ||
                                        aStaticContent[j][sPropertyName] != aOriginalStaticContent[j][sPropertyName]) {
                                        if (!oText) {
                                            oText = {};
                                        }
                                        sId = this.generateId(cardId, "settings.staticContent_" + j, sPropertyName);
                                        if (aStaticContent[j][sPropertyName]) {
                                            oCardManifest.settings["staticContent"][j][sPropertyName] = "{{" + sId + "}}";
                                            oFlexCardManifest.settings["staticContent"][j][sPropertyName] = aStaticContent[j][sPropertyName];
                                            oText[sId] = this.createTranslationTextObject(aStaticContent[j][sPropertyName]);
                                        }
                                    }
                                }
                            }
                        }
                    } else if (aCardSettingsWithText[i].hasOwnProperty("tabs")) {
                        if (aTabs || aOriginalTabs) {
                            if (aTabs) {
                                for (j = 0; j < aTabs.length; j++) {
                                    for (k = 0; k < aCardSettingsWithText[i]["tabs"].length; k++) {
                                        sPropertyName = aCardSettingsWithText[i]["tabs"][k];
                                        if (!aOriginalTabs || j >= aOriginalTabs.length ||
                                            aTabs[j][sPropertyName] != aOriginalTabs[j][sPropertyName]) {
                                            if (!oText) {
                                                oText = {};
                                            }
                                            sId = this.generateId(cardId, "settings.tabs_" + j, sPropertyName);
                                            if (aTabs[j][sPropertyName]) {
                                                oCardManifest.settings["tabs"][j][sPropertyName] = "{{" + sId + "}}";
                                                oFlexCardManifest.settings["tabs"][j][sPropertyName] = aTabs[j][sPropertyName];
                                                oText[sId] = this.createTranslationTextObject(aTabs[j][sPropertyName]);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            /**
             * Making an Object oParameters containing card properties
             */
            var aCardSettingsWithOutText = SettingsConstants.cardSettingsWithOutText;
            for (i = 0; i < aCardSettingsWithOutText.length; i++) {
                if (typeof aCardSettingsWithOutText[i] == "string") {
                    if (this._oCardManifestSettings[aCardSettingsWithOutText[i]] != this._oOriginalCardManifestSettings[aCardSettingsWithOutText[i]]) {
                        if (this._oCardManifestSettings[aCardSettingsWithOutText[i]]) {
                            oCardManifest.settings[aCardSettingsWithOutText[i]] = this._oCardManifestSettings[aCardSettingsWithOutText[i]];
                            oFlexCardManifest.settings[aCardSettingsWithOutText[i]] = this._oCardManifestSettings[aCardSettingsWithOutText[i]];
                        } else {
                            delete oCardManifest.settings[aCardSettingsWithOutText[i]];
                            delete oFlexCardManifest.settings[aCardSettingsWithOutText[i]];
                        }
                    }
                } else if (typeof aCardSettingsWithOutText[i] == "object") {
                    if (aCardSettingsWithOutText[i].hasOwnProperty("staticContent")) {
                        if (aStaticContent && aOriginalStaticContent) {
                            for (j = 0; j < aStaticContent.length; j++) {
                                for (k = 0; k < aCardSettingsWithOutText[i]["staticContent"].length; k++) {
                                    sPropertyName = aCardSettingsWithOutText[i]["staticContent"][k];
                                    if (j >= aOriginalStaticContent.length ||
                                        aStaticContent[j][sPropertyName] != aOriginalStaticContent[j][sPropertyName]) {
                                        if (aStaticContent[j][sPropertyName]) {
                                            oCardManifest.settings["staticContent"][j][sPropertyName] = aStaticContent[j][sPropertyName];
                                            oFlexCardManifest.settings["staticContent"][j][sPropertyName] = aStaticContent[j][sPropertyName];
                                        } else {
                                            delete oCardManifest.settings["staticContent"][j][sPropertyName];
                                            delete oFlexCardManifest.settings["staticContent"][j][sPropertyName];
                                        }
                                    }
                                }
                            }
                        }
                    } else if (aCardSettingsWithOutText[i].hasOwnProperty("tabs")) {
                        if (aTabs || aOriginalTabs) {
                            if (aTabs) {
                                for (j = 0; j < aTabs.length; j++) {
                                    for (k = 0; k < aCardSettingsWithOutText[i]["tabs"].length; k++) {
                                        sPropertyName = aCardSettingsWithOutText[i]["tabs"][k];
                                        if (!aOriginalTabs || j >= aOriginalTabs.length ||
                                            aTabs[j][sPropertyName] != aOriginalTabs[j][sPropertyName]) {
                                            if (aTabs[j][sPropertyName]) {
                                                oCardManifest.settings["tabs"][j][sPropertyName] = aTabs[j][sPropertyName];
                                                oFlexCardManifest.settings["tabs"][j][sPropertyName] = aTabs[j][sPropertyName];
                                            } else {
                                                delete oCardManifest.settings["tabs"][j][sPropertyName];
                                                delete oFlexCardManifest.settings["tabs"][j][sPropertyName];
                                            }
                                            if (!aOriginalTabs) {
                                                delete oCardManifest.settings[sPropertyName];
                                                delete oFlexCardManifest.settings[sPropertyName];
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            oParameters.card[cardId] = oCardManifest;
            /**
             * Update card payLoad Contains
             * @type Object
             * Example:
             * {
             *      "appDescriptorChange": {
             *          "parameters": {
             *              "card": {
             *                  "ovpSampleProject_card00": {
             *                      "model": "SEPMRA_OVW",
             *                      "template": "sap.ovp.cards.stack",
             *                      "settings": {
             *                          "title": "{{sap.ovp.demo_sap.ovp.cards.ovpSampleProject_card00.settings.title}}",
             *                          "subTitle": "{{sap.ovp.demo_sap.ovp.cards.ovpSampleProject_card00.settings.subTitle}}",
             *                          "entitySet": "SEPMRA_C_OVW_Employees",
             *                          "addODataSelect": false,
             *                          "annotationPath": "com.sap.vocabularies.UI.v1.LineItem"
             *                      }
             *                  }
             *              }
             *          },
             *          "texts": {
             *              "sap.ovp.demo_sap.ovp.cards.ovpSampleProject_card00.settings.title": {
             *                  "type": "XTIT",
             *                  "maxLength": 40,
             *                  "value": {
             *                      "": "title text",
             *                      "en": "title text in en"
             *                  }
             *              },
             *              "sap.ovp.demo_sap.ovp.cards.ovpSampleProject_card00.settings.subTitle": {
             *                  "type": "XTIT",
             *                  "maxLength": 40,
             *                  "value": {
             *                      "": "subTitle text",
             *                      "en": "subTitle text in en"
             *                  }
             *              }
             *          }
             *      },
             *      "flexibilityChange": this._oCardManifestSettings
             * }
             */
            var payLoad = {};
            payLoad['appDescriptorChange'] = {
                'parameters': oParameters
            };
            if (oText) {
                payLoad['appDescriptorChange']['texts'] = oText;
            }
            payLoad['flexibilityChange'] = oFlexCardManifest;
            // TODO: Remove this when there is an update change type available in semantic merger
            payLoad['deleteCard'] = {
                'parameters': {
                    'cardId': cardId
                }
            };
            this.settingsResolve(payLoad);
            settingsUtils.dialogBox.close();
        }

    });
});
