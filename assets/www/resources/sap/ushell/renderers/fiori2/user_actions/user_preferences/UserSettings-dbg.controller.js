sap.ui.define(['sap/ushell/ui/launchpad/AccessibilityCustomData'],
	function(AccessibilityCustomData) {
	"use strict";

    /*global jQuery, sap, setTimeout, clearTimeout */
    /*jslint plusplus: true, nomen: true */
    sap.ui.controller("sap.ushell.renderers.fiori2.user_actions.user_preferences.UserSettings", {
        onInit: function () {
            var oView = this.getView(),
                that = this;
            this.navBackButton = new sap.m.ToggleButton({
                icon: sap.ui.Device.system.phone ? "sap-icon://nav-back" : "sap-icon://menu2",
                press: function (e) {
                    if (sap.ui.Device.system.phone) {
                        oView.getSplitApp().backDetail();
                        that._handleNavButton();
                        this.setPressed(false);

                    } else {
                        if (oView.getSplitApp().isMasterShown()) {
                            oView.getSplitApp().hideMaster();
                            this.setTooltip(sap.ushell.resources.i18n.getText("ToggleButtonShow"));
                            this.setPressed(false);
                        } else {
                            oView.getSplitApp().showMaster();
                            this.setTooltip(sap.ushell.resources.i18n.getText("ToggleButtonHide"));
                            this.setPressed(true);
                        }
                    }
                },
                tooltip: sap.ushell.resources.i18n.getText("ToggleButtonShow")
            });
            if (oView && oView.getSplitApp()) {
                oView.getSplitApp().attachAfterMasterClose(that, function () {
                    that._handleNavButton.apply(that);
                });
                oView.getSplitApp().attachAfterMasterOpen(that, function () {
                    that._handleNavButton.apply(that);
                });
            }
        },
        _handleNavButton: function () {
            var oView = this.getView();
            if (oView && oView.getSplitApp() && oView.getSplitApp().getCurrentDetailPage()) {
                if (!oView.getSplitApp().isMasterShown()) {
                    oView.splitAppHeaderBar.addContentLeft(this.navBackButton);
                } else {
                    if (sap.ui.Device.system.phone || sap.ui.Device.orientation.landscape) {
                        oView.splitAppHeaderBar.removeAllContentLeft();
                    }
                }
            }
        },
        getOriginalDialogContent: function () {
            if (!this.oInitialContent) {
                var oEntryList;
                oEntryList = this.getEntryListControl();
                //Master-Detail layout
                this.oInitialContent = new sap.ui.layout.VerticalLayout('userPreferencesLayout', {
                    content: [oEntryList]
                }).addStyleClass("sapUshellUserSettingLayout");
                this.aDanglingControls.push(this.oInitialContent);
            }
            return this.oInitialContent;
        },
        createDetailPage: function (entryId, entryPath, title, content) {
            var that = this,
                oView = that.getView(),
                oObjectHeader = new sap.m.ObjectHeader({
                    title: title,
                    backgroundDesign: sap.m.BackgroundDesign.Solid

                }).addStyleClass("sapUshellUserSettingDetailHeader");
            if (entryId === "userAccountEntry") {
                oObjectHeader.setIcon(that.getUserImage(sap.ui.core.IconPool.getIconURI("sap-icon://person-placeholder")));
                oObjectHeader.setTitle(sap.ushell.Container.getUser().getFullName());
            }
            var oPage = new sap.m.Page('detail' + content.getId(), {
                content: [oObjectHeader, content],
                showHeader: false
            });
            oPage.addStyleClass("sapUsheUserSettingDetaildPage");
            oPage.onAfterRendering = function () {
                that._handleNavButton();
            }

            oView.aDanglingControls.push(oPage);
            oView.getModel().setProperty(entryPath + "/contentResult", oPage);
            oView.getSplitApp().addDetailPage(oPage);
            that.navToDetail(oPage.getId());
        },
        getUserImage: function (defultIconURI) {
            var userImage = sap.ushell.Container.getUser().getImage();
            return userImage ? userImage : defultIconURI;
        },
        getListPressHandler: function (selectedItem, eventId) {
            var that = this,
                isContentValid = true,
                entryPath = selectedItem.getBindingContext().getPath(),
                oView = this.getView(),
                oContent = oView.getModel().getProperty(entryPath + "/contentResult"),
                oBusyIndicator = null,// oBusyIndicator is initialized only when bShowBusyIndicator === true
                bShowBusyIndicator = true,
                bIsBusyIndicatorShown = false,
                entry = oView.getModel().getProperty(entryPath),
                contentFunction = entry.contentFunc,
                oContentPromise,
                oKeyValueContent;

            // Clear selection from list.
            if (sap.ui.Device.system.phone) {
                selectedItem.setSelected(false);
            }

            if (oContent) {
                that.navToDetail(oContent.getId(), eventId);
                that._handleNavButton();
            } else {
                if (typeof contentFunction === "function") {
                    oView.getModel().setProperty(entryPath + "/isDirty", true);//Set isDirty = true to the entry. Relevant for saving flow.
                    oContentPromise = contentFunction();
                    oContentPromise.done(function (contentResult) {
                        bShowBusyIndicator = false;
                        if (bIsBusyIndicatorShown === true) {
                            // that.oDialog.removeAllContent();
                            oBusyIndicator.destroy();//oBusyIndicator is destroyed only when it is actually presented
                        }

                        if (contentResult instanceof sap.ui.core.Control) {
                            that.createDetailPage.apply(that, [entry.entryHelpID, entryPath, entry.title, contentResult]);
                        } else {
                            isContentValid = false;
                        }
                    });

                    oContentPromise.fail(function () {
                        bShowBusyIndicator = false;
                        if (bIsBusyIndicatorShown === true) {
                            //handle failure
                            oBusyIndicator.destroy();//oBusyIndicator is destroyed only when it is actually presented
                        }
                        isContentValid = false;
                    });

                    oContentPromise.always(function () {
                        if (isContentValid === false) {
                            var oErrorContent = new sap.m.FlexBox("userPrefErrorFlexBox", {
                                height: "5rem",
                                alignItems: sap.m.FlexAlignItems.Center,
                                justifyContent: sap.m.FlexJustifyContent.Center,
                                items: [new sap.m.Text("userPrefErrorText", {text: oView.translationBundle.getText("loadingErrorMessage")})]
                            });
                            oView.aDanglingControls.push(oErrorContent);
                            oView.getModel().setProperty(entryPath + "/contentResult", oErrorContent);
                            oView.getSplitApp().addDetailPage(oErrorContent);
                            that.navToDetail(oErrorContent.getId());
                        }
                    });
                    if (bShowBusyIndicator === true) {
                        oBusyIndicator = new sap.m.BusyIndicator('userPrefLoadingBusyIndicator', {size: "2rem"});
                        this.aDanglingControls.push(oBusyIndicator);
                        bIsBusyIndicatorShown = true;
                    }
                    // In case contentFunction if not of type "function", in this case the details part includes key/value
                } else {
                    entry.valueArgument().done(function (sValue) {
                        oKeyValueContent = that._getKeyValueContent(entry, sValue);
                        that.createDetailPage(entry.entryHelpID, entryPath, entry.title, oKeyValueContent);
                    }).fail(function (e) {
                        oKeyValueContent = that._getKeyValueContent(entry);
                        that.createDetailPage(entry.entryHelpID, entryPath, entry.title, oKeyValueContent);
                    });
                }
            }
        },
        /**
         * Creating UI for presenting Key/Value in the details area of the user settings UI
         */
        _getKeyValueContent: function (oEntry, sEntryValue) {
            var oKeyLabel,
                oValueLabel,
                oBox,
                sValue = sEntryValue ? sEntryValue : " ",
                sFBoxAlignItems = sap.ui.Device.system.phone ? 'Start' : 'Center',
                sFlexWrap = sap.ui.Device.system.phone ? 'Wrap' : 'NoWrap',
                sFBoxDirection = sap.ui.Device.system.phone ? 'Column' : 'Row';

            oKeyLabel = new sap.m.Label({
                text: oEntry.title + ":"
            }).addStyleClass('sapUshellUserSettingsDetailsKey');

            oValueLabel = new sap.m.Input({
                value: sValue,
                editable: false
            }).addStyleClass('sapUshellUserSettingsDetailsValue');

            oBox = new sap.m.FlexBox({
                alignItems: sFBoxAlignItems,
                wrap: sFlexWrap,
                direction: sFBoxDirection,
                items: [
                    oKeyLabel,
                    oValueLabel
                ]
            });
            return oBox;
        },

        createMasterPages: function () {
            var that = this,
                oEntryTemplate = that.getUserSettingsEntryTemplate();
            // temporary remove the search control for wave 1702
            /*this.oSearch = new sap.m.SearchField({
                enabled: false,
                liveChange: function (input) {
                    var val = input.getParameter("newValue");
                    that.oMasterEntryList.getBinding("items").filter([new sap.ui.model.Filter("title", sap.ui.model.FilterOperator.Contains, val), new sap.ui.model.Filter("visible", sap.ui.model.FilterOperator.EQ, true)]);
                }
            });*/
            this.aDanglingControls = this.getView().aDanglingControls;
            this.oMasterEntryList = new sap.m.List('userSettingEnteryList', {
                items: {
                    path: "/userPreferences/entries",
                    template: oEntryTemplate
                },
                mode: "SingleSelectMaster",
                select: function (ev) {
                    that.getListPressHandler(ev.getSource().getSelectedItem(), ev.getId());
                }
            });
            var origOnAfterRendering = this.oMasterEntryList.onAfterRendering;
            this.oMasterEntryList.onAfterRendering = function () {
                var aEntries = this.getItems();
                var entryPath;
                //Execute the genuine onAfterRendering logic of the list.
                origOnAfterRendering.apply(this, arguments);
                //for each item in the list we need to add XRay help id
                //for each item in the list we need to execute the relevant function to get the entry value
                for (var i = 0; i < aEntries.length; i++) {
                    entryPath = aEntries[i].getBindingContext().getPath();
                    that._setEntryValueResult(entryPath);
                }
                if (!sap.ui.Device.system.phone) {
                    this.setSelectedItem(this.getItems()[0]);
                    that.getListPressHandler(this.getSelectedItem());
                }
               /* setTimeout(function () {
                    that.oSearch.setEnabled(true);
                }, 0);*/
            };
            var oPage = new sap.m.Page("userSettingMaster", {
                showHeader: false,
                content: [/*this.oSearch,*/ this.oMasterEntryList]
            }).addStyleClass("sapUshellUserSettingMaster");
            that.aDanglingControls.push(/*this.oSearch,*/ this.oMasterEntryList, oPage);
            return oPage;
        },
        _setEntryValueResult: function (entryPath) {
            var oView = this.getView(),
                oModel = oView.getModel(),
                isEditable = oModel.getProperty(entryPath + "/editable"),
                valueArgument = oModel.getProperty(entryPath + "/valueArgument"),
                oValuePromise;

            if (typeof valueArgument === "function") {
                //Display "Loading..." and disable the entry until the value result is available
                oModel.setProperty(entryPath + "/valueResult", oView.translationBundle.getText("genericLoading"));
                oModel.setProperty(entryPath + "/editable", false);
                oValuePromise = valueArgument();
                if (oValuePromise) {
                    oValuePromise.done(function (valueResult) {
                        oModel.setProperty(entryPath + "/editable", isEditable);
                        var bVisible = true;
                        if (oModel.getProperty(entryPath + "/visible") !== undefined) {
                            bVisible = oModel.getProperty(entryPath + "/visible");
                        } else if (oModel.getProperty(entryPath + "/defaultVisibility") !== undefined) {
                            bVisible = oModel.getProperty(entryPath + "/defaultVisibility") ;
                        }
                        oModel.setProperty(entryPath + "/visible", typeof (valueResult) === 'object' ? !!valueResult.value : bVisible);
                        oModel.setProperty(entryPath + "/valueResult", typeof (valueResult) === 'object' ? valueResult.displayText : valueResult);
                    });
                    oValuePromise.fail(function () {
                        oModel.setProperty(entryPath + "/valueResult", oView.translationBundle.getText("loadingErrorMessage"));
                    });
                }
            } else if (!!valueArgument) {//if valueArgument is not null or undefined, we would like to present it
                oModel.setProperty(entryPath + "/valueResult", valueArgument);
                oModel.setProperty(entryPath + "/editable", isEditable);
            } else {//in any other case (valueArgument is not function \ String \ Number \ Boolean)
                oModel.setProperty(entryPath + "/valueResult", oView.translationBundle.getText("loadingErrorMessage"));
            }
        },
        getUserSettingsEntryTemplate: function () {
            var that = this,
                oItem = new sap.m.StandardListItem({
                    title: "{title}",
                    description: "{valueResult}",
                    icon: {
                        path: "icon",
                        formatter: function (entryIcon) {
                            if (entryIcon === "sap-icon://account") {
                                entryIcon = that.getUserImage("sap-icon://account");
                            }
                            return entryIcon ? entryIcon : "sap-icon://action-settings";
                        }
                    },
                    type: sap.ui.Device.system.phone ? "Navigation" : "Inactive",
                    visible: {
                        parts: [
                            {path: 'visible'},
                            {path: 'defaultVisibility'},
                            {path: '/userPreferences/profiling/length'}
                        ],
                        formatter: function (visible, defaultVisibility) {
                            if (this.getTitle() === sap.ushell.resources.i18n.getText("userProfiling")) {
                                var profilingEntries = this.getModel().getProperty("/userPreferences/profiling");
                                //remove usage analytics entry if its not enabled
                                profilingEntries.forEach(function (entry, index) {
                                    if (entry.entryHelpID === "usageAnalytics") {
                                        if (!sap.ushell.Container.getService("UsageAnalytics").systemEnabled() || !sap.ushell.Container.getService("UsageAnalytics").isSetUsageAnalyticsPermitted()) {
                                            profilingEntries.splice(index, 1);
                                        }
                                    }
                                }, this);
                                return (profilingEntries !== undefined && profilingEntries.length > 0);
                            } else {
                                if (visible !== undefined) {
                                    return visible;
                                } else {
                                    return (defaultVisibility !== undefined) ? defaultVisibility : true;
                                }
                            }
                        }
                    },
                    customData: new AccessibilityCustomData({
                        key: "aria-label",
                        value: {
                            parts: [
                                {path: 'title'},
                                {path: 'valueResult'}
                            ],
                            formatter: function (sTitle, sValue) {
                                sValue = sValue ? sValue : "";
                                return sTitle + " " + sValue;
                            }
                        },
                        writeToDom: true
                    })
                }).addStyleClass("sapUshellUserSettingMasterListItem");
            return oItem;
        },
        navToDetail: function(sId, eventId) {
            var view = this.getView(),
                splitApp= view.getSplitApp();

            splitApp.toDetail(sId);
            //Since we cannot use autofocus property of splitApp navcontainer, we have to implement it explicitly
            if (eventId === "select") {
                this.applyFocus(sId);
            }
            if (splitApp.getMode() === "ShowHideMode"){
                splitApp.hideMaster();
            }
        },
        applyFocus: function (sId) {
            if (!sap.ui.Device.system.phone) {
                var elFirstToFocus = jQuery.sap.byId(sId).firstFocusableDomRef();

                if (elFirstToFocus) {
                    jQuery.sap.focus(elFirstToFocus);
                }
            }
        },
        onExit: function () {
            this.getView().aDanglingControls.forEach(function (oControl) {
                if (oControl) {
                    if (oControl.destroyContent) {
                        oControl.destroyContent();
                    }
                    oControl.destroy();
                }
            });
        }
    });


}, /* bExport= */ false);
