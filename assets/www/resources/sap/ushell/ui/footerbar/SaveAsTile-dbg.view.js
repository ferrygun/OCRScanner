// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap, hasher, document */
    /*jslint plusplus: true, nomen: true */

    sap.ui.jsview("sap.ushell.ui.footerbar.SaveAsTile", {
        getControllerName : function () {
            return "sap.ushell.ui.footerbar.SaveAsTile";
        },
        createContent: function (oController) {
            this.oResourceBundle = sap.ushell.resources.i18n;
            this.viewData = this.getViewData() || {};
            this.appData = this.viewData.appData || {};
            this.oTitleInput = new sap.m.Input('bookmarkTitleInput', {
                tooltip: this.oResourceBundle.getText("bookmarkDialogoTitle_tooltip"),
                value: {
                    path: "/title",
                    mode: sap.ui.model.BindingMode.TwoWay
                }
            }).addStyleClass("sapUshellInputField");
            this.oTitleInput.addAriaLabelledBy("titleLbl");
            this.oSubTitleInput = new sap.m.Input('bookmarkSubTitleInput', {
                tooltip: this.oResourceBundle.getText("bookmarkDialogoSubTitle_tooltip"),
                value: {
                    path: "/subtitle",
                    mode: sap.ui.model.BindingMode.TwoWay
                }
            }).addStyleClass("sapUshellInputField");
            this.oSubTitleInput.addAriaLabelledBy("subtitleLbl");
            this.oInfoInput = new sap.m.Input('bookmarkInfoInput', {
                tooltip: this.oResourceBundle.getText("tileSettingsDialog_informationField"),
                value: {
                    path: "/info",
                    mode: sap.ui.model.BindingMode.TwoWay
                },
                visible: "{/showInfo}"
            }).addStyleClass("sapUshellInputField");
            this.oInfoInput.addAriaLabelledBy("infoLbl");

            var tileInitSettings = {
                    numberValue: "{/numberValue}",
                    title : "{/title}",
                    subtitle: "{/subtitle}",
                    info: "{/info}",
                    icon: "{/icon}",
                    infoState: "{/infoState}",
                    numberFactor: "{/numberFactor}",
                    numberUnit: "{/numberUnit}",
                    numberDigits: "{/numberDigits}",
                    numberState: "{/numberState}",
                    stateArrow: "{/stateArrow}",
                    targetURL: "{/targetURL}",
                    keywords: "{/keywords}"
                },
                fnParseTileValueColor = function (tileValueColor) {
                    var returnValue = tileValueColor;

                    switch (tileValueColor) {
                        case "Positive":
                            returnValue = "Good";
                            break;
                        case "Negative":
                            returnValue = "Critical";
                            break;
                    }

                    return returnValue;
                };

            var oTile, serviceUrl;
            // If the viewData contains 'serviceUr', it means we need to instantiate GenericTile as 'dynamic'.
            if (this.viewData.serviceUrl) {
                oTile = new sap.m.GenericTile({
                    header: tileInitSettings.title,
                    subheader: tileInitSettings.subtitle,
                    size: "Auto",
                    tileContent: [new sap.m.TileContent({
                        size: "Auto",
                        footer: tileInitSettings.info,
                        unit: tileInitSettings.numberUnit,
                        //We'll utilize NumericContent for the "Dynamic" content.
                        content: [new sap.m.NumericContent({
                            scale: tileInitSettings.numberFactor,
                            value: tileInitSettings.numberValue,
                            truncateValueTo: 5,//Otherwise, The default value is 4.
                            valueColor: fnParseTileValueColor(tileInitSettings.numberState),
                            indicator: tileInitSettings.stateArrow,
                            icon: tileInitSettings.icon,
                            width: "100%"
                        })]
                    })]

                });
                serviceUrl = (typeof (this.viewData.serviceUrl) === "function") ? this.viewData.serviceUrl() : this.viewData.serviceUrl;
                oController.calcTileDataFromServiceUrl(serviceUrl);
            } else {
                oTile = new sap.m.GenericTile({
                    header: tileInitSettings.title,
                    subheader: tileInitSettings.subtitle,
                    size: "Auto",
                    tileContent: [new sap.m.TileContent({
                        size: "Auto",
                        footer: tileInitSettings.info,
                        content: new sap.m.NumericContent({
                            icon: tileInitSettings.icon,
                            value: ' ',//The default value is 'o', That's why we instantiate with empty space.
                            width: "100%"
                        })
                    })]
                });
            }
            this.setTileView(oTile);

            var tileWrapper = new sap.ushell.ui.launchpad.Tile({
                "long" : false,
                tileViews : [oTile],
                afterRendering: function (oEvent) {
                    var jqTile = jQuery(this.getDomRef()),
                        jqGenericTile = jqTile.find(".sapMGT");

                    // remove focus from tile
                    jqGenericTile.removeAttr("tabindex");
                }
            }).addStyleClass("sapUshellBookmarkFormPreviewTileMargin");

            var oPreview = new sap.m.Label("previewLbl", {text: " " +  this.oResourceBundle.getText('previewFld'), visible: "{/showPreview}"}),
                oTitle = new sap.m.Label("titleLbl", {required: true, text: " " +  this.oResourceBundle.getText('titleFld'), labelFor: this.oTitleInput}),
                oSubTitle = new sap.m.Label("subtitleLbl", {text: this.oResourceBundle.getText('subtitleFld'), labelFor: this.oSubTitleInput}),
                oInfo = new sap.m.Label("infoLbl", {text: this.oResourceBundle.getText('tileSettingsDialog_informationField'), labelFor: this.oInfoInput, visible: "{/showInfo}"}),
                oPreviewBackgroundElement = new sap.ui.core.HTML("previewBackgroundElement", {content: "<div class='sapUshellShellBG sapContrastPlus sapUiStrongBackgroundColor'></div>"}),
                hbox = new sap.m.FlexBox("saveAsTileHBox", {
                     items: [oPreviewBackgroundElement, tileWrapper],
                     alignItems : sap.m.FlexAlignItems.Center,
                     justifyContent: sap.m.FlexJustifyContent.Center,
                     renderType: sap.m.FlexRendertype.Bare,
                    visible: "{/showPreview}"
                }).addStyleClass("sapUshellShellBG").addStyleClass("sapUshellBookmarkFormPreviewBoxBottomMargin");
            oTitle.setLabelFor('bookmarkTitleInput');
            oSubTitle.setLabelFor('bookmarkSubTitleInput');
            oInfo.setLabelFor('bookmarkInfoInput');

            var oGroupsLabel = new sap.m.Label("groupLbl", {
                text: this.oResourceBundle.getText('GroupListItem_label'),
                visible: "{/showGroupSelection}"
            });
            this.oGroupsSelect = new sap.m.Select("groupsSelect", {
                tooltip: this.oResourceBundle.getText('bookmarkDialogoGroup_tooltip'),
                items : {
                    path : "/groups",
                    template : new sap.ui.core.ListItem({
                        text : "{title}"
                    })
                },
                width: "100%",
                visible: {
                    parts: ["/showGroupSelection", "/groups"],
                    formatter: function (bShowGroupSelection, aGroups) {
                        if (bShowGroupSelection && !(aGroups && aGroups.length)){
                            this.oController.loadPersonalizedGroups();
                        }
                        return bShowGroupSelection;
                    }.bind(this)
                }
            });
            this.oGroupsSelect.addAriaLabelledBy("groupLbl");



            return [
                oPreview,
                hbox,
                oTitle,
                this.oTitleInput,
                oSubTitle,
                this.oSubTitleInput,
                oInfo,
                this.oInfoInput,
                oGroupsLabel,
                this.oGroupsSelect
            ];
        },
        getTitleInput: function () {
            return this.oTitleInput;
        },
        getTileView: function () {
            return this.tileView;
        },
        setTileView: function (oTileView) {
            this.tileView = oTileView;
        },
        getBookmarkTileData: function () {
            var selectedGroupData;
            if (this.oGroupsSelect && this.oGroupsSelect.getSelectedItem()) {
                selectedGroupData = this.oGroupsSelect.getSelectedItem().getBindingContext().getObject();
            }

            // customUrl - Will be used to navigate from the new tile.
            var sURL;
            // in case customUrl is supplied
            if (this.viewData.customUrl) {
                // check if a function was passed as customUrl
                if (typeof (this.viewData.customUrl) === "function") {
                        // resolve the function to get the value for the customUrl
                        sURL = this.viewData.customUrl();
                } else {
                    // Provided as a string
                    // In case customURL will be provided (as a string) containing an hash part, it must be supplied non-encoded,
                    // or it will be resolved with duplicate encoding and can cause nav errors.
                    sURL = this.viewData.customUrl;
                }
            } else {
                // In case an hash exists, hasher.setHash() is used for navigation. It also adds encoding.
                // Otherwise use window.location.href
                sURL = hasher.getHash() ? ('#' + hasher.getHash()) : window.location.href;
            }

            return {
                title : this.oTitleInput.getValue() ? this.oTitleInput.getValue().substring(0, 256).trim() : '',
                subtitle : this.oSubTitleInput.getValue() ? this.oSubTitleInput.getValue().substring(0, 256).trim() : '',
                url : sURL,
                icon : this.getModel().getProperty('/icon'),
                info : this.oInfoInput.getValue() ? this.oInfoInput.getValue().substring(0, 256).trim() : '',
                numberUnit : this.viewData.numberUnit,
                serviceUrl : typeof (this.viewData.serviceUrl) === "function" ? this.viewData.serviceUrl() : this.viewData.serviceUrl,
                serviceRefreshInterval : this.viewData.serviceRefreshInterval,
                group : selectedGroupData,
                keywords :  this.viewData.keywords
            };
        }
    });


}, /* bExport= */ false);
