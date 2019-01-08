// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview This file contains miscellaneous utility functions.
 */
/* global jQuery, sap */

/* eslint-disable no-undef */

this.sap = this.sap || {};

(function() {
    "use strict";
    /* global document, jQuery, sap */

    jQuery.sap.declare("sap.ushell.components.tiles.utilsRT");
    jQuery.sap.require("sap.ushell.components.tiles.utils");

    // namespace "sap.ushell.components.tiles.utils" ************************************
    sap = sap || {};
    sap.ushell = sap.ushell || {};
    sap.ushell.components = sap.ushell.components || {};
    sap.ushell.components.tiles = sap.ushell.components.tiles || {};
    sap.ushell.components.tiles.utilsRT = sap.ushell.components.tiles.utilsRT || {};

    if (sap.ushell.components.tiles.utilsRT.getConfiguration) {
        return;
    }
    /**
     * Read and initialize configuration object from given JSON string. Used by static and dynamic applaunchers.
     *
     * @param {string} sConfig Configuration string in JSON format
     * @param {boolean} bAdmin A flag that indicates, whether the configuration shall be shown in the Admin UI
     * @param {boolean} bEdit A flag that indicates, whether the configuration shall be shown in the Admin UI in edit mode (i.e., not on a tile)
     * @returns {object} Returns parsed and initialized configuration object
     */
    sap.ushell.components.tiles.utilsRT.getConfiguration = function(oTileApi, bAdmin, bEdit) {

        var oResourceBundle;
        var sConfig = oTileApi.configuration.getParameterValueAsString('tileConfiguration');
        try {
            var oConfig = JSON.parse(sConfig || "{}");
        } catch (e) {
            jQuery.sap.log.error(
                "Error while trying to parse tile configuration",
                e,
                "sap.ushell.components.tiles.utilsRT"
            );
            return {};
        }
        var oUtils = sap.ushell.components.tiles.utils;

        oConfig.editable = true;
        if (oTileApi.configurationUi && oTileApi.configurationUi.isReadOnly) {
            if (oTileApi.configurationUi.isReadOnly()) {
                oConfig.editable = false;
            }
        }

        // first try to get properties from bag

        var sTitle = oUtils.getTranslatedTitle(oTileApi);
        var sSubtitle = oUtils.getTranslatedSubtitle(oTileApi, oConfig);
        var sInfo = oUtils.getTranslatedProperty(oTileApi, oConfig, 'display_info_text');
        var sKeywords = oUtils.getTranslatedProperty(oTileApi, oConfig, 'display_search_keywords');

        if (bAdmin) {
            // resource bundle is only used in admin mode
            oResourceBundle = oUtils.getResourceBundleModel().getResourceBundle();

            if (bEdit && oTileApi.bag) {
                var orgLocale = oTileApi.bag.getOriginalLanguage();
                var localeLogonLanguage = sap.ui.getCore().getConfiguration().getLocale().getSAPLogonLanguage();
                var language = sap.ui.getCore().getConfiguration().getLanguage();
                oConfig.isLocaleSuitable = orgLocale === "" || orgLocale.toLowerCase() === localeLogonLanguage.toLowerCase() || orgLocale.toLowerCase() === language.toLowerCase();
                oConfig.orgLocale = orgLocale;
                oConfig.userLocale = localeLogonLanguage;

            }
        }
        // in Admin UI, we display sample values for info/title/subtitle if not defined in the configuration
        oConfig.display_icon_url = oConfig.display_icon_url || "";

        if (sInfo !== undefined) {
            oConfig.display_info_text = sInfo;
        } else if (oConfig.display_info_text === undefined) {
            if (bAdmin && !bEdit) {
                oConfig.display_info_text = "[" + oResourceBundle.getText("configuration.display_info_text") + "]";
            } else {
                oConfig.display_info_text = "";
            }
        }

        oConfig.navigation_semantic_object = oConfig.navigation_semantic_object || "";
        oConfig.navigation_semantic_action = oConfig.navigation_semantic_action || "";
        oConfig.navigation_semantic_parameters = oConfig.navigation_semantic_parameters || "";
        oConfig.display_number_unit = oConfig.display_number_unit || "";
        oConfig.display_number_factor = oConfig.display_number_factor || "";
        oConfig.service_refresh_interval = oConfig.service_refresh_interval ? parseInt(oConfig.service_refresh_interval, 10) : 0;
        oConfig.service_url = oConfig.service_url || "";
        oConfig.navigation_target_url = oConfig.navigation_target_url || "";
        if (bAdmin && oUtils.isInitial(sTitle)) {
            oConfig.display_title_text = bEdit ? "" : "[" + oResourceBundle.getText("configuration.display_title_text") + "]";
            oConfig.display_subtitle_text = bEdit ? "" : "[" + oResourceBundle.getText("configuration.display_subtitle_text") + "]";
        } else {
            oConfig.display_title_text = sTitle || oConfig.display_title_text || "";
            if (sSubtitle !== undefined) {
                oConfig.display_subtitle_text = sSubtitle;
            } else if (oConfig.display_subtitle_text === undefined) {
                oConfig.display_subtitle_text = "";
            }
        }
        oConfig.navigation_use_semantic_object = (oConfig.navigation_use_semantic_object === false ? false : true);
        oConfig.display_search_keywords = sKeywords || oConfig.display_search_keywords || "";

        // display sample value '1234' in Admin UI
        if (bAdmin) {
            oConfig.display_number_value = oConfig.display_number_value || 1234;
        }

        // If form factors were not configured yet, use default values
        oConfig.form_factors = oConfig.form_factors ? oConfig.form_factors : oUtils.getDefaultFormFactors();

        oConfig.desktopChecked = oConfig.form_factors.manual.desktop;
        oConfig.tabletChecked = oConfig.form_factors.manual.tablet;
        oConfig.phoneChecked = oConfig.form_factors.manual.phone;
        oConfig.manualFormFactor = !(oConfig.form_factors.appDefault) && oConfig.editable;
        oConfig.appFormFactor = oConfig.form_factors.appDefault;

        // The following line is workaround for the case that the form factor parameters were set by default
        // We don't want to save this unless the user specifically changed the form factor (uncheck and immediately recheck is considered a change)
        oConfig.formFactorConfigDefault = oConfig.form_factors.defaultParam ? true : false;
        if (oConfig.signature) {
            oConfig.rows = oUtils.getSignatureTableData(oConfig.signature, bEdit && oConfig.editable);
        } else {
            oConfig.rows = (oConfig.mapping_signature && oConfig.mapping_signature !== "*=*") ? oUtils.getMappingSignatureTableData(oConfig.mapping_signature, bEdit && oConfig.editable) : [
                oUtils.getEmptyRowObj(oConfig.editable)
            ];
        }
        if (oConfig.signature) {
            oConfig.isUnknownAllowed = (oConfig.signature.additional_parameters === "allowed" || oConfig.signature.additionalParameters === "allowed");
        } else {
            oConfig.isUnknownAllowed = (oConfig.mapping_signature !== undefined) ? oUtils.getAllowUnknownParametersValue(oConfig.mapping_signature) : true;
        }

        // Tile Action table data

        if (bAdmin) {
            // for designer
            oConfig.tile_actions_rows = oUtils.getTileNavigationActionsRows(oTileApi, oConfig.editable);
        } else {
            // for runtime - if actions are already in the configuration we keep them (HANA), otherwise try to construct them from bag (on ABAP)
            if (!oConfig.actions) {
                oConfig.actions = oUtils.getTileNavigationActions(oTileApi);
            }
        }

        return oConfig;
    };

    /*
     * Mapping of API fields to internal config string fields and to UI5 view properties: OData API INTERNAL UI5 VIEW property [wave1] icon ->
     * /config/display_icon_url -> icon title -> /config/display_title_text -> title number -> /data/display_number_value -> number numberUnit ->
     * /config/display_number_unit -> numberUnit info -> /config/display_info_text -> info infoState -> /data/display_info_state -> infoState
     * (Negative, Neutral, Positive, Critical) infoStatus* -> /data/display_info_state -> infoState (None, Success, Warning, Error) targetParams ->
     * /data/target_params -> append to targetURL [new in wave2] subtitle -> /config/display_subtitle_text -> subtitle stateArrow ->
     * /data/display_state_arrow -> stateArrow (None, Up, Down) numberState -> /data/display_number_state -> numberState (Negative, Neutral, Positive,
     * Critical) numberDigits -> /data/display_number_digits -> numberDigits (Digits after comma/period) numberFactor -> /data/display_number_factor ->
     * numberFactor scaling factor of number (e.g. "%", "M", "k") keywords -> /config/display_search_keyword-> not displayed string of (comma or space
     * delimited) keywords infoStatus is there for compatibility
     */
    /**
     * Get an object with attributes used by <code>DynamicTile</code>. Use values from static configuration as base and override by fields returned
     * in dynamic data.
     *
     * @param {string} oConfig Static configuration. Expects <code>display_icon_url</code>, <code>display_info_text</code>,
     *        <code>display_info_state</code>, <code>display_number</code>, <code>display_number_unit</code> and
     *        <code>display_title_text</code> in given object.
     * @param {string} oDynamicData Dynamic data to be mixed in. Updates all static configuration data by data contained in that object. If the object
     *        contains a <code>results</code> array. The <code>number</code> fields will be accumulated.
     * @returns {object} An object containing the fields from the tile configuration mixed with the fields from dynamic data
     */
    sap.ushell.components.tiles.utilsRT.getDataToDisplay = function(oConfig, oDynamicData) {
        var nSum = 0, i, n, oCurrentNumber, sCurrentTargetParams, oData = {
            display_icon_url: oDynamicData.icon || oConfig.display_icon_url || "",
            display_title_text: oDynamicData.title || oConfig.display_title_text || "",
            display_number_value: !isNaN(oDynamicData.number) ? oDynamicData.number : "...",
            display_number_unit: oDynamicData.numberUnit || oConfig.display_number_unit || "",
            display_info_text: oDynamicData.info || oConfig.display_info_text || "",
            display_info_state: oDynamicData.infoState || "Neutral",
            display_subtitle_text: oDynamicData.subtitle || oConfig.display_subtitle_text || "",
            display_state_arrow: oDynamicData.stateArrow || "None",
            display_number_state: oDynamicData.numberState || "Neutral",
            display_number_digits: oDynamicData.numberDigits >= 0 ? oDynamicData.numberDigits : 4,
            display_number_factor: oDynamicData.numberFactor || "",
            display_search_keyword: oDynamicData.keywords || oConfig.display_search_keyword || "",
            targetParams: []
        };
        if (oDynamicData.infoStatus) {
            // wave 1 compatability with "infoStatus" field
            oData.display_info_state = oDynamicData.infoStatus;
        }
        if (oDynamicData.targetParams) {
            oData.targetParams.push(oDynamicData.targetParams);
        }
        // accumulate results field
        if (oDynamicData.results) {
            for (i = 0, n = oDynamicData.results.length; i < n; i = i + 1) {
                oCurrentNumber = oDynamicData.results[i].number || 0;
                if (typeof oCurrentNumber === "string") {
                    oCurrentNumber = parseFloat(oCurrentNumber, 10);
                }
                nSum = nSum + oCurrentNumber;
                sCurrentTargetParams = oDynamicData.results[i].targetParams;
                if (sCurrentTargetParams) {
                    oData.targetParams.push(sCurrentTargetParams);
                }
            }
            oData.display_number_value = nSum;
        }
        if (!isNaN(oDynamicData.number)) {

            // in case number is string isNaN returns true, but we need either to trim() it as the redundant " "
            // such as in case of "579 " as a value (Bug), parsing it to float causes redundant '.' even where it should not
            if (typeof oDynamicData.number === "string") {
                oDynamicData.number = oDynamicData.number.trim();
            }
            //in case the number is "" we set value to "..." (due to internal #: 1780198502)
            if (oDynamicData.number === "") {
                oData.display_number_value = "...";
            } else {
                jQuery.sap.require("sap.ui.core.format.NumberFormat");
                var bShouldProcessDigits = this._shouldProcessDigits(oDynamicData.number, oDynamicData.numberDigits),
                maxCharactersInDisplayNumber = oData.display_icon_url ? 4 : 5;
                
                if (oDynamicData.number && oDynamicData.number.length >= maxCharactersInDisplayNumber || bShouldProcessDigits) {
                    var oNormalizedNumberData = this._normalizeNumber(oDynamicData.number, maxCharactersInDisplayNumber, oDynamicData.numberFactor, oDynamicData.numberDigits);
                    oData.display_number_factor = oNormalizedNumberData.numberFactor;
                    oData.display_number_value = oNormalizedNumberData.displayNumber;
                } else {
                    var oNForm = sap.ui.core.format.NumberFormat.getFloatInstance({maxFractionDigits: maxCharactersInDisplayNumber});
                    oData.display_number_value = oNForm.format(oDynamicData.number);
                }
            }
        }

        //Added as part of bug fix. Incident ID: 1670054463
        if (oData && oData.display_number_state) {
            switch (oData.display_number_state) {
                case "Positive":
                    oData.display_number_state = "Good";
                    break;
                case "Negative":
                    oData.display_number_state = "Error";
                    break;
            }
        }

        return oData;
    };

    sap.ushell.components.tiles.utilsRT.getTileSettingsAction = function(oModel, saveSettingsCallback, sType) {
        var oResourcesBundle = sap.ushell.components.tiles.utils.getResourceBundleModel().getResourceBundle();
        return {
            text: (!sType || sType == "tile") ? oResourcesBundle.getText('tileSettingsBtn') : oResourcesBundle.getText('linkSettingsBtn'),
            press: function() {

                var oAppData = {
                    showGroupSelection: false,
                    title: oModel.getProperty('/config/display_title_text'),
                    subtitle: oModel.getProperty('/config/display_subtitle_text')
                };
                //links and tiles settings view has different properties
                if (!sType || sType == 'tile') {
                    oAppData.info = oModel.getProperty('/config/display_info_text');
                    oAppData.icon = oModel.getProperty('/config/display_icon_url');
                    oAppData.keywords = oModel.getProperty('/config/display_search_keywords');
                } else if (sType == 'link') {
                    oAppData.showInfo = false;
                    oAppData.showIcon = false;
                    oAppData.showPreview = false;
                }

                var settingsView = sap.ui.view({
                    type: sap.ui.core.mvc.ViewType.JS,
                    viewName: "sap.ushell.ui.footerbar.SaveAsTile",
                    viewData: {
                        appData: oAppData
                    }
                });

                var oSimpleForm = new sap.ui.layout.form.SimpleForm({
                    id: 'tileSettings',
                    layout: sap.ui.layout.form.SimpleFormLayout.GridLayout,
                    content: [
                        settingsView
                    ]
                }).addStyleClass("sapUshellAddBookmarkForm");

                var okButton = new sap.m.Button('bookmarkOkBtn', {
                    text: oResourcesBundle.getText('okBtn'),
                    press: function() {
                        saveSettingsCallback(settingsView);
                        oDialog.close();
                    },
                    enabled: true
                }), cancelButton = new sap.m.Button('bookmarkCancelBtn', {
                    text: oResourcesBundle.getText('cancelBtn'),
                    press: function() {
                        oDialog.close();
                    }
                });

                // enforce the title input as a mandatory field
                var enableOKButton = function(title) {
                    okButton.setEnabled(title.trim() ? true : false);
                };
                settingsView.getTitleInput().attachLiveChange(function() {
                    enableOKButton(this.getValue());
                });

                var oDialog = new sap.m.Dialog({
                    id: 'settingsDialog',
                    title: (!sType || sType == "tile") ? oResourcesBundle.getText('tileSettingsDialogTitle') : oResourcesBundle.getText('linkSettingsDialogTitle'),
                    contentWidth: '400px',
                    content: oSimpleForm,
                    beginButton: okButton,
                    endButton: cancelButton,
                    horizontalScrolling: false,
                    afterClose: function() {
                        oDialog.destroy();
                    }
                });

                oDialog.open();
            }
        };
    };

    /**
     * @param {object} oConfig The configuration object (as returned by <code>getConfiguration</code>)
     * @returns {string} The relative navigation URL: '#', semantic object, '-', action, '?' parameters
     */
    sap.ushell.components.tiles.utilsRT.getSemanticNavigationUrl = function(oConfig) {
        // note: empty semantic objects and actions (?) are perfectly possible
        var sUrl = "#" + jQuery.trim(oConfig.navigation_semantic_object);
        sUrl += "-" + jQuery.trim(oConfig.navigation_semantic_action);
        // parameters are optional
        if (oConfig.navigation_semantic_parameters && jQuery.trim(oConfig.navigation_semantic_parameters).length > 0) {
            sUrl += "?" + jQuery.trim(oConfig.navigation_semantic_parameters);
        }
        return sUrl;
    };

    /*
     * Add target parameters returned from OData call to configured URL.
     */
    /**
     * Rewrites the given URL by appending target parameters.
     *
     * @param {string} sUrl The target URL to be rewritten
     * @param {object} oData The dynamic tile configuration as returned by <code>getDataToDisplay</code>
     * @returns {string} The rewritten URL containing teh target parameters
     */
    sap.ushell.components.tiles.utilsRT.addParamsToUrl = function(sUrl, oData) {
        var sParams = "", bUrlHasParams = sUrl.indexOf("?") !== -1, aTargetParams = oData.targetParams, i;

        if (aTargetParams && aTargetParams.length > 0) {
            for (i = 0; i < aTargetParams.length; i = i + 1) {
                sParams += aTargetParams[i];
                if (i < aTargetParams.length - 1) {
                    sParams += "&";
                }
            }
        }
        if (sParams.length > 0) {
            if (!bUrlHasParams) {
                sUrl += "?";
            } else {
                sUrl += "&";
            }
            sUrl += sParams;
        }
        return sUrl;
    };

    sap.ushell.components.tiles.utilsRT._normalizeNumber = function(numValue, maxCharactersInDisplayNumber, numberFactor, iNumberDigits) {
        jQuery.sap.require("sap.ui.core.format.NumberFormat");
        var number;

        if (isNaN(numValue)) {
            number = numValue;
        } else {
            var oNForm = sap.ui.core.format.NumberFormat.getFloatInstance({maxFractionDigits: iNumberDigits});

            if (!numberFactor) {
                if (numValue >= 1000000000) {
                    numberFactor = 'B';
                    numValue /= 1000000000;
                } else if (numValue >= 1000000) {
                    numberFactor = 'M';
                    numValue /= 1000000;
                } else if (numValue >= 1000) {
                    numberFactor = 'K';
                    numValue /= 1000;
                }
            }
            number = oNForm.format(numValue);
        }

        var displayNumber = number;
        //we have to crop numbers to prevent overflow
        var cLastAllowedChar = displayNumber[maxCharactersInDisplayNumber - 1];
        //if last character is '.' or ',', we need to crop it also
        maxCharactersInDisplayNumber -= (cLastAllowedChar === '.' || cLastAllowedChar === ',') ? 1 : 0;
        displayNumber = displayNumber.substring(0, maxCharactersInDisplayNumber);

        return {
            displayNumber: displayNumber,
            numberFactor: numberFactor
        };
    };

    sap.ushell.components.tiles.utilsRT._shouldProcessDigits = function(sDisplayNumber, iDigitsToDisplay) {
        var nNumberOfDigits;

        sDisplayNumber = typeof (sDisplayNumber) !== 'string' ? sDisplayNumber.toString() : sDisplayNumber;
        if (sDisplayNumber.indexOf('.') !== -1) {
            nNumberOfDigits = sDisplayNumber.split(".")[1].length;
            if (nNumberOfDigits > iDigitsToDisplay) {

                return true;
            }
        }

        return false;
    };
}());
