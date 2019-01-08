// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define(['sap/ui/core/IconPool','sap/ushell/components/tiles/utils'],
	function(IconPool, utils) {
	"use strict";

    /* global document, jQuery, sap */
    sap.ui.getCore().loadLibrary("sap.m");
    sap.ui.controller("sap.ushell.components.tiles.action.ActionTile", {
        onInit: function() {
            var oView = this.getView();
            var oViewData = oView.getViewData();
            var oResourceModel = utils.getResourceBundleModel();
            var oTileApi = oViewData.chip; // instance                                                                                                                                                                    // API
            var oConfig = utils.getActionConfiguration(oTileApi);
            var oModel;
            var that = this;

            function formatDisplayText(sSemanticObject, sSemanticAction) {
                var oBundle = oResourceModel.getResourceBundle(), sResult = oBundle.getText("configuration.semantic_object") + ":\n" + sSemanticObject + "\n\n" + oBundle.getText("configuration.semantic_action") + ":\n" + sSemanticAction;
                return sResult;
            }

            oView.setModel(oResourceModel, "i18n");
            oModel = new sap.ui.model.json.JSONModel({
                config: oConfig,
                displayText: formatDisplayText(oConfig.semantic_object, oConfig.semantic_action)
            });
            oView.setModel(oModel);

            // implement configurationUi contract: setup configuration UI
            if (oTileApi.configurationUi.isEnabled()) {
                // attach configuration UI provider, which is essentially a components.tiles.action.Configuration
                oTileApi.configurationUi.setUiProvider(function() {
                    var oConfigurationUi = utils.getConfigurationUi(that.getView(), "sap.ushell.components.tiles.action.Configuration");
                    oTileApi.configurationUi.attachCancel(this.onCancelConfiguration.bind(null, oConfigurationUi));
                    oTileApi.configurationUi.attachSave(this.onSaveConfiguration.bind(this, oConfigurationUi, formatDisplayText)); // mind the
                                                                                                                                    // closure
                    return oConfigurationUi;
                }.bind(this));

                oView.byId("actionTile").setTooltip(oResourceModel.getResourceBundle().getText("edit_configuration.tooltip"));
            }
        },

        onPress: function(oEvent) {
            // trigger to show the configuration UI if the tile is pressed in Admin mode
            var oTileApi = this.getView().getViewData().chip;
            if (oTileApi.configurationUi.isEnabled()) {
                oTileApi.configurationUi.display();
            }
        },

        // configuration save handler
        // The target mapping tile is enhanced with mapping_signature and supported form_factors properties.
        onSaveConfiguration: function(oConfigurationView, fnFormatDisplayText) {
            var
            // the deferred object required from the configurationUi contract
            oDeferred = jQuery.Deferred(), oModel = oConfigurationView.getModel(),
            // tile model placed into configuration model by getConfigurationUi
            oTileModel = oModel.getProperty("/tileModel"), oTileApi = oConfigurationView.getViewData().chip;

            // error handler
            function logErrorAndReject(oError) {
                jQuery.sap.log.warning(oError, null, "sap.ushell.components.tiles.action.ActionTile.controller");
                oDeferred.reject(oError);
            }

            // If the input fields icon, semantic object and action are failing the input validations, then through an error message requesting the
            // user to enter/correct those fields
            var bReject = utils.checkTMInputOnSaveConfig(oConfigurationView);
            if (bReject) {
                oDeferred.reject("mandatory_fields_missing");
                return oDeferred.promise();
            }

            // Before saving the model data, check if Mapping signature table contains duplicate parameter names
            // in this case the save will fail and all the data will be lost as this is the designer behavior.
            if (utils.tableHasDuplicateParameterNames(oModel.getProperty("/config/rows"))) {
                var oBundle = utils.getResourceBundleModel().getResourceBundle();
                oDeferred.reject(oBundle.getText("configuration.signature.uniqueParamMessage.text"));
            } else { // only if the data is valid proceed with the save operation
                // Decide according to special flag if the setting in form factor are default
                // if so , the configuration should not be saved - this is crucial for the backend checks
                var oFormFactor = oModel.getProperty("/config/formFactorConfigDefault") ? undefined : utils.buildFormFactorsObject(oModel);
                var sMappingSignature = utils.getMappingSignatureString(oModel.getProperty("/config/rows"), oModel.getProperty("/config/isUnknownAllowed"));
                var oMappingSignature = utils.getMappingSignature(oModel.getProperty("/config/rows"), oModel.getProperty("/config/isUnknownAllowed"));
                // get the configuration to save from the model
                var configToSave = {
                    semantic_object: jQuery.trim(oModel.getProperty("/config/semantic_object")) || "",
                    semantic_action: jQuery.trim(oModel.getProperty("/config/semantic_action")) || "",
                    display_title_text: jQuery.trim(oModel.getProperty("/config/display_title_text")) || "",
                    url: jQuery.trim(oModel.getProperty("/config/url")) || "",
                    ui5_component: jQuery.trim(oModel.getProperty("/config/ui5_component")) || "",
                    navigation_provider: jQuery.trim(oModel.getProperty("/config/navigation_provider")),
                    navigation_provider_role: jQuery.trim(oModel.getProperty("/config/navigation_provider_role")) || "",
                    navigation_provider_instance: jQuery.trim(oModel.getProperty("/config/navigation_provider_instance")) || "",
                    target_application_id: jQuery.trim(oModel.getProperty("/config/target_application_id")) || "",
                    target_application_alias: jQuery.trim(oModel.getProperty("/config/target_application_alias")) || "",
                    transaction: {
                        code: jQuery.trim(oModel.getProperty("/config/transaction/code"))
                    },
                    web_dynpro: {
                      application: jQuery.trim(oModel.getProperty("/config/web_dynpro/application")),
                      configuration: jQuery.trim(oModel.getProperty("/config/web_dynpro/configuration"))
                    },
                    target_system_alias: jQuery.trim(oModel.getProperty("/config/target_system_alias")),
                    display_info_text: jQuery.trim(oModel.getProperty("/config/display_info_text")),
                    form_factors: oFormFactor, // retrieve a structure describing form factor's mode (from application or admin selection) + form
                                                // factors values.
                    mapping_signature: sMappingSignature,
                    signature: oMappingSignature
                };
                // use bag in order to store translatable properties
                var tilePropertiesBag = oTileApi.bag.getBag('tileProperties');
                tilePropertiesBag.setText('display_title_text', configToSave.display_title_text);

                // use configuration contract to write parameter values
                oTileApi.writeConfiguration.setParameterValues({
                    tileConfiguration: JSON.stringify(configToSave)
                },
                // success handler
                function() {
                    var oConfigurationConfig = utils.getActionConfiguration(oTileApi, false);
                    var oTileConfig = utils.getActionConfiguration(oTileApi, true);
                    // switching the model under the tile -> keep the tile model
                    oModel = new sap.ui.model.json.JSONModel({
                        config: oConfigurationConfig,
                        tileModel: oTileModel
                    });
                    oConfigurationView.setModel(oModel);
                    // update model (no merge)
                    oTileModel.setData({
                        config: oTileConfig,
                        displayText: fnFormatDisplayText(oTileConfig.semantic_object, oTileConfig.semantic_action)
                    }, false);
                    // Added for new LPD_CUST implementation
                    tilePropertiesBag.save(
                    // success handler
                    function() {
                        jQuery.sap.log.debug("property bag 'tileProperties' saved successfully");
                        // update possibly changed values via contracts
//                        if (oTileApi.title) {
//                            oTileApi.title.setTitle(configToSave.display_title_text,
//                            // success handler
//                            function() {
//                                oDeferred.resolve();
//                            }, logErrorAndReject // error handler
//                            );
//                        } else {
                            oDeferred.resolve();
//                        }
                    }, logErrorAndReject // error handler
                    );
                }, logErrorAndReject // error handler
                );
            }
            return oDeferred.promise();
        },

        // configuration cancel handler
        onCancelConfiguration: function(oConfigurationView) {
            // re-load old configuration and display
            var oViewData = oConfigurationView.getViewData();
            var oModel = oConfigurationView.getModel();
            // tile model placed into configuration model by getConfigurationUi
            var oTileModel = oModel.getProperty("/tileModel");
            var oTileApi = oViewData.chip;
            var oCurrentConfig = utils.getActionConfiguration(oTileApi, false);
            oConfigurationView.getModel().setData({
                config: oCurrentConfig,
                tileModel: oTileModel
            }, false);
        }
    });


}, /* bExport= */ true);
