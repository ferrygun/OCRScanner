jQuery.sap.registerPreloadedModules({
"name":"Component-preload",
"version":"2.0",
"modules":{
	"sap/ushell/components/tiles/cdm/applauncherdynamic/Component.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
(function() {
    "use strict";
    /* global jQuery, sap */
    jQuery.sap.declare("sap.ushell.components.tiles.cdm.applauncherdynamic.Component");


    sap.ui.define([
        "sap/ui/core/UIComponent"
    ], function (UIComponent) {

        return UIComponent.extend("sap.ushell.components.tiles.cdm.applauncherdynamic.Component", {
            metadata : {},

            // create content
            createContent : function () {

                // take tile configuration from manifest - if exists
                // take tile personalization from component properties - if exists
                // merging the tile configuration and tile personalization
                var oComponentData = this.getComponentData();
                var oProperties = oComponentData.properties || {};
                var oP13n = oProperties.tilePersonalization || {};

                // adding indicator-data source properties to configuration
                var oIndicatorDataSource = oProperties.indicatorDataSource;
                if (oIndicatorDataSource && oIndicatorDataSource.path) {
                    oP13n.serviceUrl = oIndicatorDataSource.path;
                    oP13n.serviceRefreshInterval = oIndicatorDataSource.refresh;
                }

                // adding sap-system to configuration
                var oStartupParams = oComponentData.startupParameters;
                if (oStartupParams && oStartupParams["sap-system"] && oStartupParams["sap-system"][0]) {
                    //sap-system is always an array. we take the first value
                    oP13n["sap-system"] = oStartupParams["sap-system"][0];
                }

                /**
                 * in case service url is not absolut path and data source is provided, we assume this is a relative path to the provided datasource
                 * and we need to apply the sap-system as well if exist
                 */
                if (oP13n.serviceUrl && oP13n.serviceUrl.charAt(0) !== "/" && oProperties.dataSource && oProperties.dataSource.uri){
                    //first take the service url
                    var sServiceUrl = oProperties.dataSource.uri;
                    //if system is provided we need to add it making sure we strip the ending '/' if exist
                    if (oP13n["sap-system"]){
                        if (sServiceUrl.charAt(sServiceUrl.length - 1) === "/"){
                            sServiceUrl = sServiceUrl.slice(0, sServiceUrl.length - 1);
                        }
                        sServiceUrl += ";o=" + oP13n["sap-system"];
                    }
                    //making sure that the url has a '/' at the end
                    if (sServiceUrl.charAt(sServiceUrl.length - 1) !== "/"){
                        sServiceUrl += "/";
                    }
                    //then we add the path to the specific entity (at this point we know its a relative path)
                    sServiceUrl += oP13n.serviceUrl;
                    oP13n.serviceUrl = sServiceUrl;
                }


                var oTile = sap.ui.view({
                    type : sap.ui.core.mvc.ViewType.JS,
                    viewName : "sap.ushell.components.tiles.cdm.applauncherdynamic.DynamicTile",
                    viewData: {
                        properties: oProperties,
                        configuration: oP13n
                    }
                });

                this._oController = oTile.getController();
                return oTile;
            },

            // interface to be provided by the tile
            tileSetVisualProperties : function (oNewVisualProperties) {
                if (this._oController) {
                    this._oController.updateVisualPropertiesHandler(oNewVisualProperties);
                }
            },

            // interface to be provided by the tile
            tileRefresh : function () {
                if (this._oController) {
                    this._oController.refreshHandler();
                }
            },

            // interface to be provided by the tile
            tileSetVisible : function (bIsVisible) {
                if (this._oController) {
                    this._oController.visibleHandler(bIsVisible);
                }
            },

            exit : function () {
                this._oController = null;
            }
        });
    });
}());

},
	"sap/ushell/components/tiles/cdm/applauncherdynamic/DynamicTile.controller.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define(['sap/ui/core/IconPool','sap/ui/thirdparty/datajs','sap/ushell/components/tiles/utils'],
	function(IconPool, datajs, utils) {
	"use strict";

    /*global jQuery, OData, sap, setTimeout, hasher */
    sap.ui.getCore().loadLibrary("sap.m");
    sap.ui.controller("sap.ushell.components.tiles.cdm.applauncherdynamic.DynamicTile", {

        // handle to control/cancel browser's setTimeout()
        timer : null,

        // handle to control/cancel data.js OData.read()
        oDataRequest : null,

        _getConfiguration : function() {

            var oViewData = this.getView().getViewData(), oConfig = {};
            oConfig.configuration = oViewData.configuration;
            oConfig.properties = oViewData.properties;

            // a special handling for info, as by the configuration we should not get info anymore.
            // nevertheless - it is used by the dynamic-data response. So we must initialze it to be empty string
            // in case it is not supplied.
            oConfig.properties.info =  oConfig.properties.info || "";

            // default values for the dynamic data
            oConfig.properties.number_value = '...';            // number
            oConfig.properties.number_value_state = 'Neutral';  // number's color
            oConfig.properties.number_state_arrow = 'None';     // indicator arrow direction
            oConfig.properties.number_factor = '';              // number scale factor
            oConfig.properties.number_unit = '';                // number unit

            // adding sap-system
            var sSystem = oConfig.configuration["sap-system"];
            var sTargetURL = oConfig.properties.targetURL;
            if (sTargetURL && sSystem) {
                // adjust the targetURL with the sap-system parameter
                sTargetURL += ((sTargetURL.indexOf("?") < 0) ? "?" : "&") + "sap-system=" + sSystem;
                oConfig.properties.targetURL = sTargetURL;
            }

            return oConfig;
        },


        onInit : function () {
            var oView = this.getView();
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(this._getConfiguration());

            // set model, add content
            oView.setModel(oModel);

            // retrieve data initially
            this.initUpdateDynamicData();
        },

        // loads data once if not in configuration mode
        refreshHandler: function () {
            this.loadData(0);
        },

        // load data in place in case setting visibility from false to true
        // with no additional timer registered
        visibleHandler: function (isVisible) {
            if (isVisible) {
                if (!this.oDataRequest) {
                    //tile is visible and data wasn't requested yet
                    this.refreshHandler(this);
                }
            } else {
                this.stopRequests();
            }
        },

        updateVisualPropertiesHandler: function(oNewProperties) {

            // existing properties
            var oPropertiesData = this.getView().getModel().getProperty("/properties");
            var bChanged = false;

            // override relevant property
            if (typeof oNewProperties.title !== 'undefined') {
                oPropertiesData.title = oNewProperties.title;
                bChanged = true;
            }
            if (typeof oNewProperties.subtitle !== 'undefined') {
                oPropertiesData.subtitle = oNewProperties.subtitle;
                bChanged = true;
            }
            if (typeof oNewProperties.icon !== 'undefined') {
                oPropertiesData.icon = oNewProperties.icon;
                bChanged = true;
            }
            if (typeof oNewProperties.targetURL !== 'undefined') {
                oPropertiesData.targetURL = oNewProperties.targetURL;
                bChanged = true;
            }
            if (typeof oNewProperties.info !== 'undefined') {
                oPropertiesData.info = oNewProperties.info;
                bChanged = true;
            }

            if (bChanged) {
                this.getView().getModel().setProperty("/properties", oPropertiesData);
            }
        },

        // convenience function to stop browser's timeout and OData calls
        stopRequests: function () {
            if (this.timer) {
                clearTimeout(this.timer);
            }
            if (this.oDataRequest) {
                try {
                    this.oDataRequest.abort();
                }catch (e){
                    jQuery.sap.log.warning(e.name,e.message);
                }
            }
        },

        // trigger to show the configuration UI if the tile is pressed in Admin mode
        onPress: function (oEvent) {
            if (oEvent.getSource().getScope && oEvent.getSource().getScope() === sap.m.GenericTileScope.Display) {
                var sTargetURL = this.getView().getModel().getProperty("/properties/targetURL");
                if (!sTargetURL) {
                    return;
                } else if (sTargetURL[0] === '#') {
                    hasher.setHash(sTargetURL);
                } else {
                    window.open(sTargetURL, '_blank');
                }
            }
        },

        // dynamic data updater
        initUpdateDynamicData: function () {
            var oView = this.getView(),
                sServiceUrl = oView.getModel().getProperty("/configuration/serviceUrl"),
                iServiceRefreshInterval = oView.getModel().getProperty("/configuration/serviceRefreshInterval");

            // if not service refresh interval - load number with no wait (interval is 0)
            if (!iServiceRefreshInterval) {
                iServiceRefreshInterval = 0;

            } else if (iServiceRefreshInterval < 10) {
                // log in English only
                jQuery.sap.log.warning(
                    "Refresh Interval " + iServiceRefreshInterval + " seconds for service URL " + sServiceUrl
                    + " is less than 10 seconds, which is not supported. Increased to 10 seconds automatically.",
                    null, "sap.ushell.components.tiles.cdm.applauncherdynamic.DynamicTile.controller"
                );

                // interval of 10 seconds is the minimum allowed for cyclic dynamic data fetching
                // (value of 0 means that no timer is used, e.g. no cyclic fetching but only once).
                iServiceRefreshInterval = 10;
            }
            if (sServiceUrl) {
                this.loadData(iServiceRefreshInterval);
            }
        },

        extractData : function (oData) {
            var name,
                aKeys = ["results", "icon", "title", "number", "numberUnit", "info", "infoState", "infoStatus", "targetParams", "subtitle", "stateArrow", "numberState", "numberDigits", "numberFactor"];

            if (typeof oData === "object" && Object.keys(oData).length === 1) {
                name = Object.keys(oData)[0];
                if (jQuery.inArray(name, aKeys) === -1) {
                    return oData[name];
                }
            }
            return oData;
        },

        successHandleFn: function (oResult) {
            var oConfiguration = this.getView().getModel().getProperty("/configuration");
            var oData = oResult;

            this.oDataRequest = undefined;

            if (typeof oResult === "object") {
                var uriParamInlinecount = jQuery.sap.getUriParameters(oConfiguration.serviceUrl).get("$inlinecount");
                if (uriParamInlinecount && uriParamInlinecount === "allpages") {
                    oData = {number: oResult.__count};
                } else {
                    oData = this.extractData(oData);
                }
            } else if (typeof oResult === "string") {
                oData = {number: oResult};
            }

            // fetching a merged configuration which includes overrides from the dynamic data received
            this.updatePropertiesHandler(oData);
        },

        // error handler
        errorHandlerFn: function (oMessage) {
            // reset the odata-request member
            this.oDataRequest = undefined;

            var sMessage = oMessage && oMessage.message ? oMessage.message : oMessage,
                oResourceBundle = utils.getResourceBundleModel().getResourceBundle(),
                sUrl = this.getView().getModel().getProperty("/configuration/serviceUrl");

            if (oMessage.response) {
                sMessage += " - " + oMessage.response.statusCode + " " + oMessage.response.statusText;
            }

            // log error
            jQuery.sap.log.error(
                "Failed to update data via service " + sUrl + ": " + sMessage,
                null, "sap.ushell.components.tiles.cdm.applauncherdynamic.DynamicTile"
            );

            // update model
            this.updatePropertiesHandler({
                number: "???",
                info: oResourceBundle.getText("dynamic_data.error")
            });
        },


        // loads data from backend service
        loadData: function (iServiceRefreshInterval) {
            var sUrl = this.getView().getModel().getProperty("/configuration/serviceUrl");
            if (!sUrl) {
                return;
            }

            //set the timer if required
            if (iServiceRefreshInterval > 0) {

                // log in English only
                jQuery.sap.log.info(
                    "Wait " + iServiceRefreshInterval + " seconds before calling " + sUrl + " again", null,
                    "sap.ushell.components.tiles.cdm.applauncherdynamic.DynamicTile.controller"
                );

                // call again later
                this.timer = setTimeout(this.loadData.bind(this, iServiceRefreshInterval, false), (iServiceRefreshInterval * 1000));
            }

            // if there is no current request
            if (!this.oDataRequest) {

                this.oDataRequest = OData.read(
                    {
                        requestUri: sUrl,
                        headers: {
                            "Cache-Control": "no-cache, no-store, must-revalidate",
                            "Pragma": "no-cache",
                            "Expires": "0"
                        }
                    },
                    this.successHandleFn.bind(this),
                    this.errorHandlerFn.bind(this)
                );
            }
        },

        // destroy handler stops requests
        onExit: function () {
            this.stopRequests();
        },

        /*
         * Add target parameters returned from OData call to configured URL.
         */
        /**
         * Rewrites the given URL by appending target parameters.
         *
         * @param {string} sUrl The target URL to be rewritten
         * @param {array} aTargetParams The array of parameters to add to the URL
         * @returns {string} The rewritten URL containing the target parameters
         */
        addParamsToUrl : function(sUrl, aTargetParams) {
            var sParams = "", bUrlHasParams = sUrl.indexOf("?") !== -1, i;

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
        },

        _normalizeNumber: function(numValue, maxCharactersInDisplayNumber, numberFactor, iNumberDigits) {
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
    },
        /**
         * Get an object with attributes used by <code>DynamicTile</code>. Use values from static configuration as base and override by fields returned
         * in dynamic data.
         *
         * @param {string} oConfig Static configuration. Expects properties and dynamicData, in given object (each has its own fields).
         * @param {string} oDynamicData Dynamic data to be mixed in. Updates all static configuration data by data contained in that object. If the object
         *        contains a <code>results</code> array. The <code>number</code> fields will be accumulated.
         * @returns {object} An object containing the fields from the tile configuration mixed with the fields from dynamic data
         */
        updatePropertiesHandler : function(oData) {
            var errorText = utils.getResourceBundleModel().getResourceBundle().getText("dynamic_data.error");
            var nSum = 0, i, n, oCurrentNumber,
                sCurrentTargetParams,
                oProperties = this.getView().getModel().getProperty("/properties"),
                oUpdatedProperties = {

                    title :     oData.title      || oProperties.title     || "",
                    subtitle :  oData.subtitle   || oProperties.subtitle  || "",
                    icon :      oData.icon       || oProperties.icon      || "",
                    targetURL : oData.targetURL  || oProperties.targetURL || "",

                    number_value : !isNaN(oData.number)      ? oData.number         : "...",
                    number_digits:  oData.numberDigits >= 0  ? oData.numberDigits   : 4,

                    info: oProperties.info == errorText      ? oData.info ||  ""    :  oData.info || oProperties.info || "",

                    number_unit:            oData.numberUnit     || oProperties.number_unit         || "",
                    number_state_arrow:     oData.stateArrow     || oProperties.number_state_arrow  || "None",
                    number_value_state:     oData.numberState    || oProperties.number_value_state  || "Neutral",
                    number_factor:          oData.numberFactor   || oProperties.number_factor       || ""
                };

            // push target parameters to local array
            var aTargetURLParams = [];
            if (oData.targetParams) {
                aTargetURLParams.push(oData.targetParams);
            }

            // accumulate results field
            if (oData.results) {
                for (i = 0, n = oData.results.length; i < n; i = i + 1) {
                    oCurrentNumber = oData.results[i].number || 0;
                    if (typeof oCurrentNumber === "string") {
                        oCurrentNumber = parseInt(oCurrentNumber, 10);
                    }
                    nSum = nSum + oCurrentNumber;
                    sCurrentTargetParams = oData.results[i].targetParams;
                    if (sCurrentTargetParams) {

                        // push target parameters to local array
                        aTargetURLParams.push(sCurrentTargetParams);
                    }
                }
                oUpdatedProperties.number_value = nSum;
            }


            // add target URL properties from local array to targetURL in case needed
            if (aTargetURLParams.length > 0) {
                oUpdatedProperties.targetURL = this.addParamsToUrl(oUpdatedProperties.targetURL, aTargetURLParams);
            }



            if (!isNaN(oData.number)) {

                // in case number is string isNaN returns true, but we need either to trim() it as the redundant " "
                // such as in case of "579 " as a value (Bug), parsing it to float causes redundant '.' even where it should not
                if (typeof oData.number === "string") {
                    oData.number = oData.number.trim();
                }

                jQuery.sap.require("sap.ui.core.format.NumberFormat");
                var bShouldProcessDigits = this._shouldProcessDigits(oData.number, oData.numberDigits),
                    maxCharactersInDisplayNumber = oUpdatedProperties.icon ? 4 : 5;

                if (oData.number && oData.number.length >= maxCharactersInDisplayNumber || bShouldProcessDigits) {
                    var oNormalizedNumberData = this._normalizeNumber(oData.number, maxCharactersInDisplayNumber, oData.numberFactor, oData.numberDigits);

                    oUpdatedProperties.number_factor = oNormalizedNumberData.numberFactor;
                    oUpdatedProperties.number_value = oNormalizedNumberData.displayNumber;
                } else {
                    var oNForm = sap.ui.core.format.NumberFormat.getFloatInstance({maxFractionDigits: maxCharactersInDisplayNumber});

                    oUpdatedProperties.number_value = oNForm.format(oData.number);
                }
            }

            //Added as part of bug fix. Incident ID: 1670054463
            if (oUpdatedProperties.number_value_state) {

                switch (oUpdatedProperties.number_value_state) {
                    case "Positive":
                        oUpdatedProperties.number_value_state = "Good";
                        break;
                    case "Negative":
                        oUpdatedProperties.number_value_state = "Error";
                        break;
                }
            }


            // set data to display
            this.getView().getModel().setProperty("/properties", oUpdatedProperties);
        },

        _shouldProcessDigits : function(sDisplayNumber, iDigitsToDisplay) {
            var nNumberOfDigits;

            sDisplayNumber = typeof (sDisplayNumber) !== 'string' ? sDisplayNumber.toString() : sDisplayNumber;
            if (sDisplayNumber.indexOf('.') !== -1) {
                nNumberOfDigits = sDisplayNumber.split(".")[1].length;
                if (nNumberOfDigits > iDigitsToDisplay) {

                    return true;
                }
            }

            return false;
        }
    });


}, /* bExport= */ true);
},
	"sap/ushell/components/tiles/cdm/applauncherdynamic/DynamicTile.view.js":function(){// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(function() {
	"use strict";

    sap.ui.jsview("sap.ushell.components.tiles.cdm.applauncherdynamic.DynamicTile", {
        getControllerName: function () {
            return "sap.ushell.components.tiles.cdm.applauncherdynamic.DynamicTile";
        },
        createContent: function (oController) {
            this.setHeight('100%');
            this.setWidth('100%');

            jQuery.sap.require('sap.m.GenericTile');
            var oController = this.getController();

            return new sap.m.GenericTile({
                size:       'Auto',
                header:     '{/properties/title}',
                subheader:  '{/properties/subtitle}',
                tileContent: [new sap.m.TileContent({
                    size: 'Auto',
                    footer: '{/properties/info}',
                    footerColor: '{/data/display_info_state}',
                    unit:   '{/properties/number_unit}',
                    content: [new sap.m.NumericContent({
                        truncateValueTo: 5,//Otherwise, The default value is 4.
                        scale:      '{/properties/number_factor}',
                        value:      '{/properties/number_value}',
                        indicator:  '{/properties/number_state_arrow}',
                        valueColor: '{/properties/number_value_state}',
                        icon:       '{/properties/icon}',
                        width: '100%'
                    })]
                })],
                press : [ oController.onPress, oController ]
            });
        }

    });


}, /* bExport= */ true);
},
	"sap/ushell/components/tiles/cdm/applauncherdynamic/i18n/i18n.properties":'\n#XTIT: Title of Dynamic App Launcher\ntitle=Dynamic App Launcher\n',
	"sap/ushell/components/tiles/cdm/applauncherdynamic/manifest.json":'{\n    "_version": "1.1.0",\n    "sap.flp": {\n        "type": "tile",\n        "tileSize": "1x1"\n    },\n    "sap.app": {\n        "id": "sap.ushell.components.tiles.cdm.applauncherdynamic",\n        "_version": "1.0.0",\n        "type": "component",\n        "applicationVersion": {\n            "version": "1.0.0"\n        },\n        "title": "{{title}}",\n        "description": "",\n        "tags": {\n            "keywords": []\n        },\n        "ach": "CA-FE-FLP-EU"\n    },\n    "sap.ui": {\n        "_version": "1.1.0",\n        "icons": {\n            "icon": ""\n        },\n        "deviceTypes": {\n            "desktop": true,\n            "tablet": true,\n            "phone": true\n        },\n        "supportedThemes": [\n            "sap_hcb",\n            "sap_belize",\n            "sap_belize_plus"\n        ]\n    },\n    "sap.ui5": {\n        "_version": "1.1.0",\n        "componentName": "sap.ushell.components.tiles.cdm.applauncherdynamic",\n        "dependencies": {\n            "minUI5Version": "1.42",\n            "libs": {\n                "sap.m": {}\n            }\n        },\n        "models": {\n            "i18n": {\n                "type": "sap.ui.model.resource.ResourceModel",\n                "uri": "i18n/i18n.properties"\n            }\n        },\n        "rootView": "sap.ushell.components.tiles.cdm.applauncherdynamic",\n        "handleValidation": false\n    }\n}'
}});
