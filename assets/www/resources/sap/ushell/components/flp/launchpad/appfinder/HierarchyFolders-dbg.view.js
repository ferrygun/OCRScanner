// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap, jQuery */
    /*jslint nomen: true */

    sap.ui.jsview("sap.ushell.components.flp.launchpad.appfinder.HierarchyFolders", {

        createContent: function (oController) {
            var that = this;
            this.translationBundle = sap.ushell.resources.i18n;

            this.treePath = "";

            this.systemSelectorText = new sap.m.Text({
                text: {
                    path: "easyAccessSystemsModel>/systemSelected",
                    formatter: oController.systemSelectorTextFormatter.bind(oController)
                }
            });

            this.oItemTemplate = new sap.m.StandardListItem({
                title: "{easyAccess>text}",
                type: "Navigation",
                press: function () {
                    var path = this.getBindingContextPath();
                    that.getViewData().navigateHierarchy(path, true);
                }
            });

            this.oList = new sap.m.List({
                showSeparators: sap.m.ListSeparators.None,
                items: {
                    path: "easyAccess>" + this.treePath + "/folders",
                    template: this.oItemTemplate
                },
                updateFinished: function () {
                    var aListItems = this.getItems();

                    that.finishEasyAccessAnimation(true);
                    aListItems.forEach(function (oListItem) {
                        //UI5 Doesn't support 'space' and 'enter' press behavior alignment while it is required by UX defentions.
                        oListItem.onsapspace = oListItem.onsapenter;
                    });
                },
                noDataText: {
                    path: "easyAccessSystemsModel>/systemSelected",
                    formatter: function (oSystemSelected) {
                        if (oSystemSelected) {
                            return that.translationBundle.getText("easyAccessFolderWithNoItems");
                        }
                    }
                }
            });

            this.pageMenu = new sap.m.Page({
                showNavButton: false,
                enableScrolling: true,
                headerContent:  new sap.m.Bar({
                    contentLeft: [new sap.m.Label({text: {
                                parts: ["easyAccessSystemsModel>/systemSelected"],
                                formatter: oController.systemSelectorTextFormatter.bind(oController)
                            }})],
                    contentRight: [new sap.m.Button({
                        text: this.translationBundle.getText("action_change"),
                        type: sap.m.ButtonType.Transparent,
                        visible: {
                            path: "easyAccessSystemsModel>/systemsList",
                            formatter: function (systemsList) {
                                return systemsList.length > 1;
                            }
                        },
                        press: [oController.onSystemSelectionPress, oController]
                    })]
                }).addStyleClass("sapUshellEasyAccessMasterPageHeader"),
                content: this.oList
            });

            this.pageMenu.attachNavButtonPress(function () {
                var pathChunks = this.treePath.split("/");
                var newPathChunks = pathChunks.slice(0, pathChunks.length - 2);
                this.getViewData().navigateHierarchy(newPathChunks.join("/"), false);
            }.bind(this));

            return this.pageMenu;
        },

        getControllerName: function () {
            return "sap.ushell.components.flp.launchpad.appfinder.HierarchyFolders";
        },

        finishEasyAccessAnimation: function () {
            if (!this.jqFolderClone) {
                return;
            }

            if (this.forwardAnimation) {
                this.pageMenu.$().addClass("forwardToViewAnimation");
                this.jqFolderClone.addClass("forwardOutOfViewAnimation");
            } else {
                this.pageMenu.$().addClass("backToViewAnimation");
                this.jqFolderClone.addClass("backOutOfViewAnimation");
            }
            this.jqFolderClone.on("animationend", function () {
                this.pageMenu.$().removeClass("forwardToViewAnimation backToViewAnimation");
                var backButton = this.pageMenu.$().find(".sapMBarLeft button");
                if (backButton.length) {
                    backButton.focus();
                } else {
                    //timeout needed becouse firefox hides menu without it
                    setTimeout(function () {
                        this.pageMenu.$().find("header + header").focus();
                    }.bind(this));
                }
                if (this.jqFolderClone) {
                    this.jqFolderClone.remove();
                }
            }.bind(this));
        },

        prepareEasyAccessAnimation: function (forward) {
            this.forwardAnimation = forward;
            this.jqFolderClone = this.pageMenu.$().clone().removeAttr("data-sap-ui").css("z-index", "1");
            this.jqFolderClone.find("*").removeAttr("id");
            this.pageMenu.$().parent().append(this.jqFolderClone);
        },

        updatePageBindings: function (path, forwardAnimation) {
            var bShowBack = path.split("/").length > 2;
            this.treePath = path;
            this.pageMenu.setShowNavButton(bShowBack);
            this.pageMenu.setShowSubHeader(!bShowBack);
            this.prepareEasyAccessAnimation(forwardAnimation);
            this.oList.bindItems("easyAccess>" + path + "/folders", this.oItemTemplate);
        }
    });


}, /* bExport= */ true);
