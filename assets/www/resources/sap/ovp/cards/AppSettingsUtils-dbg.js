/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */

sap.ui.define([
        'jquery.sap.global',
        "sap/m/Dialog",
        "sap/m/Button",
    ], function(jQuery, Dialog, Button) {
        "use strict";

        var oAppSettingsUtils = {

            dialogBox: undefined,
            oSaveButton: undefined,
            oResetButton: undefined,
            getDialogBox: function(oComponentContainer) {
                return new Promise(function(resolve, reject) {
                    var oOriginalAppLevelSettings,oAppLevelSettings,oAppSettingsView,
                        oAppLevelSettingsModel;
                    if (!this.dialogBox) {
                        // settings dialog save button
                        // Attached this button to 'this' scope to get it in setting controller and attach save
                        // function to it.
                        this.oSaveButton = new Button({
                            text: sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("save"),
                            type: "Emphasized"
                        });
                        // settings dialog close button
                        var oCancelButton = new Button( {
                            text: sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("cancelBtn")
                        });
                        this.oResetButton = new Button({
                            text: sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("resetButton")
                        });
                        // settings dialog
                        this.dialogBox = new Dialog({
                            title: sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("settingsDialogTitle"),
                            buttons: [this.oSaveButton, oCancelButton, this.oResetButton],
                            // destroy the view on close of dialog (?)
                            // TODO: confirm if we can just destroy the card component, rest of the things can be updated via model data binding
                            afterClose: function(oEvent) {
                                this.dialogBox.destroyContent();
                            }.bind(this)
                        });
                        this.dialogBox.addStyleClass("sapOvpSettingsDialogBox");
                        this.dialogBox.setBusyIndicatorDelay(0);
                        oCancelButton.attachPress(function(oEvent) {
                            this.dialogBox.close();
                        }.bind(this));
                    }
                    if(oComponentContainer.getParent()) {
                        oOriginalAppLevelSettings = oComponentContainer.getParent().getModel("ui").getData();
                        oAppLevelSettings = jQuery.extend(true, {}, oOriginalAppLevelSettings);
                        var oModel = oComponentContainer.getModel(oAppLevelSettings.globalFilterModel),
                            oMetaModel = oModel.getMetaModel(),
                            aEntitySet = oMetaModel.getODataEntityContainer().entitySet;
                        oAppLevelSettings["allEntityTypes"] = [];
                        for (var i = 0; aEntitySet && i < aEntitySet.length; i++) {
                            var sEntityTypeName = aEntitySet[i].entityType;
                            oAppLevelSettings["allEntityTypes"].push({name: oMetaModel.getODataEntityType(sEntityTypeName).name});
                        }
                        if(oAppLevelSettings.globalFilterEntityType) {
                            oAppLevelSettings.showGlobalFilters = true;
                        } else {
                            oAppLevelSettings.showGlobalFilters = false;
                        }
                        if(!oAppLevelSettings.containerLayout) {
                            oAppLevelSettings.containerLayout = "fixed";
                        }
                        oAppLevelSettingsModel = new sap.ui.model.json.JSONModel(oAppLevelSettings);
                        oAppSettingsView = new sap.ui.view("appSettingsView", {
                            viewName: "sap.ovp.cards.rta.AppSettingsDialog",
                            type: sap.ui.core.mvc.ViewType.XML
                        });
                        oAppSettingsView.setModel(oAppLevelSettingsModel);
                        this.dialogBox.addContent(oAppSettingsView);
                        oAppSettingsView.loaded().then(function(oView) {
                            resolve(this.dialogBox);
                        }.bind(this));
                    }
                }.bind(this));
            }

        };

        return oAppSettingsUtils;
    },
    /* bExport= */true);
