// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/ushell/utils"
], function (utils) {
    "use strict";
    /*global jQuery, sap, window, hasher */

    /**
     * AppConfiguration service.
     *
     * @public
     */
    function AppConfiguration() {
        var oMetadata = {},
            bApplicationInInitMode = true,
            oCurrentApplication = null,
            oCurrentOpenedApplication = null,
            aIdsOfAddedButtons = [],
            aAppRequestsQueue = [];

        /**
         * Due to preformace changes on component (app) loading, it is possible that an application would be initialized before
         * the shell state was changed, therefore we listen to the appOpened event and keep a reference to the opened app metadata
         * object, to verify that the setHeaderHiding and addApplicationSettingsButtons APIs are called only after the application
         * is actually opened.
         *
         * @private
         */
        sap.ui.getCore().getEventBus().subscribe("sap.ushell.renderers.fiori2.Renderer", "appOpened", applicationOpenedHandler, this);

        function applicationOpenedHandler(sChannelId, sEventId, oData) {
            // update the opened application object
            bApplicationInInitMode = false;
            oCurrentOpenedApplication = oData;
            //check the app requests queue and call all the requests if any
            if (aAppRequestsQueue.length){
                for (var i = 0; i < aAppRequestsQueue.length; i++){
                    aAppRequestsQueue[i]();
                }
                aAppRequestsQueue.length = 0;
            }
        }

        /**
         * Adds an entry to user recent activity list.
         * The list of recent activities will be displayed in the MeArea of FLP application (fiori 2.0)
         * This method should be used by applications of special types. like "Search", "OVP", "Co-Pilot" and "FactSheet"
         * This method should be only called in the "exit" method of applications Component.js in order to assure that
         * it will be added to recent activities.
         * For these applications the unique identifier of the entry is url and not appId, so in order to add different
         * entry, different url should be specified, otherwise the entry will be updated with a new timestamp
         * Only applications of type Search and Co-Pilot can set their icon.
         * @param {object} oRecentActivity
         *
         * @example Of oRecentActivity object - all properties are mandatory:
         * <code>
         *     {
         *          title: 'Sample Activity Entry',
         *          appType: 'OVP',
         *          appId: "#Action-todefaultapp",
         *          url: "#Action-todefaultapp?param1"
         *     }
         * </code>
         *
         * @example Of oRecentActivity object for application of type Search and Co-Pilot:
         * <code>
         *     {
         *          icon: 'sap-icon://search',//not mandatory. In case icon is not set, a default one will be used
         *          title: 'Sample Activity Entry',
         *          appType: 'Search',
         *          appId: "#Action-todefaultapp",
         *          url: "#Action-todefaultapp?param1"
         *     }
         * </code>
         *
         *
         * @private
         */
        this.addActivity = function (oRecentActivity) {
            var oUserRecentsSrvc = sap.ushell.Container.getService("UserRecents");
            return oUserRecentsSrvc.addActivity(oRecentActivity);

        };
        this.setApplicationInInitMode = function () {
            bApplicationInInitMode  = true;
        };
        this.getApplicationRequestQueue = function () {
            return aAppRequestsQueue;
        };
        /**
         * Returns the current application.
         *
         *
         * @returns {object}
         *   a copy of the metadata object
         *
         * @private
         */
        this.getCurrentAppliction = function (oApplication) {
            return oCurrentApplication;
        };
        // Fixes typo error in the naming of `this.getCurrentAppliction
        this.getCurrentApplication = this.getCurrentAppliction;
        /**
         * Returns the current metadata.
         *
         * {
         *      title: {string}
         *      library: {string}
         *      version: {string}
         *      fullWidth: {boolean}
         * }
         *
         * @returns {object}
         *   a copy of the metadata object
         *
         * @private
         */
        this.getMetadata = function (oApplication) {
            if (!oApplication) {
                oApplication = oCurrentApplication;
            }

            if (oApplication) {
                var sHash = hasher && hasher.getHash ? hasher.getHash() : '',
                    sKey = this._processKey(sHash);

                if (!(oMetadata.hasOwnProperty(sKey))
                    || !oMetadata[sKey].complete) {
                    this.addMetadata(oApplication, sKey);
                }

                // If metadata was not created - create it now as an empty object
                if (!oMetadata[sKey]) {
                    oMetadata[sKey] = {
                        complete: false
                    };
                }
                // If title doesn't exist in the metadata - try to get it from the result of navTergetResolution,
                //  or use the default application title
                if (!oMetadata[sKey].title) {
                    oMetadata[sKey].title = oApplication.text || sap.ushell.resources.i18n.getText("default_app_title");
                }
                return oMetadata[sKey];
            }
            return {};
        };

        /**
         * @private
         */

        this._processKey = function (sCompleteHash) {
            var sIntent = sCompleteHash.split('?')[0],
                sParams = sCompleteHash.split('?')[1],
                sSplitedParams,
                oParams = {},
                aSortedParmasKeys,
                sProcessedParams = '',
                sPrefix = '',
                oParsedShellHash;

            if (sParams) {
                sSplitedParams = sParams.split('&');
                sSplitedParams.forEach(function(item){
                    var aCurrentParam = item.split('=');

                    oParams[aCurrentParam[0]] = aCurrentParam[1];
                });
                aSortedParmasKeys = Object.keys(oParams).sort();
                aSortedParmasKeys.forEach(function (sKey, iIndex) {
                    sPrefix = iIndex ? '&' : '?';
                    sProcessedParams += sPrefix + sKey + '=' + oParams[sKey];
                });

                return sIntent + sProcessedParams;
            }

            oParsedShellHash = sap.ushell.Container.getService("URLParsing").parseShellHash(sCompleteHash);
            sIntent = oParsedShellHash ? oParsedShellHash.semanticObject + "-" + oParsedShellHash.action : "";

            return sIntent;
        };
        /**
         * @private
         */
        this.setCurrentApplication = function (oApplication) {
            oCurrentApplication = oApplication;

            //make sure that the queue is empty for the new app
            //if there was an error in an application initialization
            //the queue may have entries of another application
            if (aAppRequestsQueue.length) {
                aAppRequestsQueue.length = 0;
            }
        };

        /*
         * Sets the hiding of the shell header.
         * It is meant to be used by applications that want to modify the default behavior of the shell header.
         *
         * @param {boolean} boolean value for setting enable/disable header hiding
         *
         * @private
         */
        this.setHeaderHiding = function (bHeaderHiding) {
            if (sap.ui.Device.system.phone) {
                //in case current application is not yet open we delay the call
                //till it would be opened
                if (oCurrentApplication === oCurrentOpenedApplication) {
                    setHeaderHiding(bHeaderHiding);
                } else {
                    aAppRequestsQueue.push(function () {
                        setHeaderHiding(bHeaderHiding);
                    });
                }
            } else {
                jQuery.sap.log.warning("Application configuration could not be trigger setHeaderHiding on Shell as the running device is not a phone");
            }
        };
        /**
         * @private
         */
        function setHeaderHiding(bHeaderHiding) {
            var oRenderer = sap.ushell.Container.getRenderer("fiori2");
            if (oRenderer) {
                oRenderer.setHeaderHiding(bHeaderHiding);
            }
        }

        /*
         * Adds buttons to the action sheet in the shell header.
         * This function always overrides the already existing application settings buttons with the new buttons.
         * It is meant to be used by applications that want to add their own settings button to the shell header.
         *
         * @param {array} array of sap.m.Button controls
         *
         * @private
         * */
        this.addApplicationSettingsButtons = function (aButtons) {
            //in case current application is not yet open we delay the call
            //till it would be opened.
            /**
             * oCurrentApplication should not be null as the setCurrentApplication API must be set before
             * application is loaded!, however currently it may happend in case abap is loading the application
             * inside when the target is resolved in abap.js before the shell.controller sets the application.
             * and therefore we are making sure that the oCurrentApplication is not null so the app settings button will not
             * appear in the home screen. this check may be removed once this issue will be resolved
             * see ticket #1680036349
             */
            /**
             * We check only the equality between the url's because it is sufficient condition to identify an app.
             * We also check the existence of both url's to avoid edge case of "undefined === undefined" which results in true
             * See ticket 1670473374
             */
            if (bApplicationInInitMode){
                aAppRequestsQueue.push(function () {
                    addApplicationSettingsButtons(aButtons);
                });
            } else {
                addApplicationSettingsButtons(aButtons);
            }
        };
        /**
         * @private
         */
        function addApplicationSettingsButtons(aButtons) {
            var i,
                aIds = [],
                oRenderer = sap.ushell.Container.getRenderer("fiori2");

            for (i = 0; i < aButtons.length; i++) {
                var oCurrentButton = aButtons[i];
                aIds.push(oCurrentButton.getId());
                oCurrentButton.setIcon(oCurrentButton.getIcon() || sap.ui.core.IconPool.getIconURI('customize'));
                //in case the button has the text "Settings" we change it to "App Setting" in order prevent name collision
                if (sap.ushell.resources.i18n.getText("userSettings") === oCurrentButton.getProperty("text")) {
                    oCurrentButton.setProperty("text", sap.ushell.resources.i18n.getText("userAppSettings"));
                }
                oCurrentButton.setType(sap.m.ButtonType.Unstyled);
            }
            if (sap.ushell.Container && oRenderer) {
                if (aIdsOfAddedButtons.length) {
                    //remove buttons that were added earlier
                    oRenderer.hideActionButton(aIdsOfAddedButtons, true);
                }
                aIdsOfAddedButtons = aIds;
                oRenderer.showActionButton(aIds, true, undefined, true);
            }
        }

        /**
         * Sets the title of the browser tabSets the title of the browser tab.
         *
         * @param {string} sTitle title
         *
         * @private
         */
        this.setWindowTitle = function (sTitle) {
            window.document.title = sTitle;
        };

        /**
         * Sets the icons of the browser.
         *
         * @param {object} oIconsProperties Icon properties
         * An object holding icon URLs
         *
         * @private
         */
        this.setIcons = function (oIconsProperties) {
            jQuery.sap.setIcons(oIconsProperties);
        };

        /**
         * Sets the application screen size to full width
         *
         * @param {boolean} bValue
         * A Boolean value indicating if the application fills the full width of the screen
         *
         * @public
         * @alias sap.ushell.services.AppConfiguration#setApplicationFullWidth
         */
        this.setApplicationFullWidth = function (bValue) {
            var oViewPortContainer = sap.ui.getCore().byId("viewPortContainer");

            oViewPortContainer.setApplicationFullWidth(bValue);
        };

        /**
         * Get a settings control to display about dialog and system infos.
         *
         * @returns {object} jQuery.deferred.promise object that when resolved, returns a settings control which can be embedded where ever its needed
         *
         * @since 1.48
         *
         * @private
         */
        this.getSettingsControlAsync = function () {
            var oDeferred = new jQuery.Deferred();
            sap.ui.require(["sap/ushell/ui/footerbar/SettingsButton"],
                function (SettingsButton) {
                    oDeferred.resolve(new SettingsButton());
                });
            return oDeferred.promise();
        };

        /**
         * Get a settings control to display about dialog and system infos.
         *
         * @returns {sap.ushell.ui.footerbar.SettingsButton}
         *      a settings control which can be embedded where ever its needed
         *
         * @deprecated since version 1.48 (as a result of XMLHttpRequest spec prohibiting the sending of synchronous requests). 
         * Use <code>getSettingsControlAsync<code> instead
         *
         * @private
         */
        this.getSettingsControl = function () {
            var sSettingButtonPath = "sap/ushell/ui/footerbar/SettingsButton",
                sOldSettingButtonPath = "sap.ushell.ui.footerbar.SettingsButton",
                SettingsControlContructor = sap.ui.require(sSettingButtonPath);

            if (SettingsControlContructor) {
                return new SettingsControlContructor();
            }
            jQuery.sap.require(sOldSettingButtonPath);
            SettingsControlContructor = jQuery.sap.getObject(sOldSettingButtonPath);
            return new SettingsControlContructor();
        };

        /**
         * @private
         */
        this.getApplicationName = function (oApplication) {
            /*jslint regexp: true */
            var aMatches,
                sAdditionalInformation = (oApplication && oApplication.additionalInformation) || null;

            if (sAdditionalInformation) {
                // SAPUI5.Component=<fully-qualified-component-name>
                aMatches = /^SAPUI5\.Component=(.+)$/i.exec(sAdditionalInformation);
                if (aMatches) {
                    // determine namespace, view name, and view type
                    return aMatches[1];
                }
            }
            return null;
        };
        /**
         * @private
         */
        this.getApplicationUrl = function (oApplication) {
            var sUrl = (oApplication && oApplication.url) || null,
                sSegmentToDetermineWebGUITransaction = "P_TCODE",
                iIndexOfQuestionmark;

            if (sUrl) {

                if (oApplication.applicationType === "NWBC" && sUrl.indexOf(sSegmentToDetermineWebGUITransaction)) {
                    //in case it is a WebGUI transaction then return the whole URL of the application
                    return sUrl;
                }
                iIndexOfQuestionmark = sUrl.indexOf("?");
                if (iIndexOfQuestionmark >= 0) {
                    // pass GET parameters of URL via component data
                    // as member startupParameters  ( to allow blending with other oComponentData usage, e.g.
                    // extensibility use case
                    sUrl = sUrl.slice(0, iIndexOfQuestionmark);
                }
                if (sUrl.slice(-1) !== '/') {
                    sUrl += '/'; // ensure URL ends with a slash
                }
            }
            return sUrl;
        };

        /**
         * Reads a property value from the configuration
         *
         * Value translation is required if the configuration includes another property whose key is composed of the original key + the string "Resource".
         * e.g. For translating the value of the property "title" - there's another configuration property: "titleResource": "TITLE_KEY".
         * The value (e.g. "TITLE_KEY") is the translation key in the resource bundle
         *
         * @private
         */
        this.getPropertyValueFromConfig = function (oConfig, sPropertyKey, oResourceBundle) {
            var oValue;

            if (oResourceBundle && oConfig.hasOwnProperty(sPropertyKey + "Resource")) {
                oValue = oResourceBundle.getText(oConfig[sPropertyKey + "Resource"]);
            } else if (oConfig.hasOwnProperty(sPropertyKey)) {
                oValue = oConfig[sPropertyKey];
            }

            return oValue;
        };

        /**
         * Reads a property value from the manifest
         *
         * @private
         */
        this.getPropertyValueFromManifest = function (oLocalMetadataComponent, oProperties, sPropertyKey) {
            var sManifestEntryKey = oProperties[sPropertyKey].manifestEntryKey,
                sManifestPropertyPath = oProperties[sPropertyKey].path,
                oManifestEntry = oLocalMetadataComponent.getManifestEntry(sManifestEntryKey);

            return jQuery.sap.getObject(sManifestPropertyPath, undefined, oManifestEntry);
        };

        /**
         * Adds the application metadata to oMetadata object.
         * Application metadata is taken from the manifest/descriptor (1st priority), if exists, and from the component configuration (2nd priority).
         *
         * @param {object} oApplication Includes data for launching the application, such as applicationType, url, etc..
         * @param {string} sKey - the complete url hash of the application which consists of the app Intent and the parameters in lexicographically sorted order.
         * @private
         */
        this.addMetadata = function (oApplication, sKey) {
            try {
                var sComponentName = this.getApplicationName(oApplication),
                    sUrl = this.getApplicationUrl(oApplication),
                    oLocalMetadataComponent,
                    oConfig,
                    // Hash object that maps application metadata property (i.e. property name) to its corresponding entry and path
                    //  in the application descriptor (i.e. manifest file), if exists
                    oProperties = {
                        "fullWidth" :              {"manifestEntryKey" : "sap.ui", "path": "fullWidth"},
                        "hideLightBackground" :    {"manifestEntryKey" : "sap.ui", "path": "hideLightBackground"},
                        "title"   :                {"manifestEntryKey" : "sap.app", "path": "title"},
                        "icon"    :                {"manifestEntryKey" : "sap.ui", "path": "icons.icon"},
                        "favIcon" :                {"manifestEntryKey" : "sap.ui", "path": "icons.favIcon"},
                        "homeScreenIconPhone"    : {"manifestEntryKey" : "sap.ui", "path": "icons.phone"},
                        "homeScreenIconPhone@2"  : {"manifestEntryKey" : "sap.ui", "path": "icons.phone@2"},
                        "homeScreenIconTablet"   : {"manifestEntryKey" : "sap.ui", "path": "icons.tablet"},
                        "homeScreenIconTablet@2" : {"manifestEntryKey" : "sap.ui", "path": "icons.tablet@2"},
                        "startupImage320x460"    : {"manifestEntryKey" : "sap.ui", "path": "icons.startupImage640x920"},
                        "startupImage640x920"    : {"manifestEntryKey" : "sap.ui", "path": "icons.startupImage640x920"},
                        "startupImage640x1096"   : {"manifestEntryKey" : "sap.ui", "path": "icons.startupImage640x1096"},
                        "startupImage768x1004"   : {"manifestEntryKey" : "sap.ui", "path": "icons.startupImage768x1004"},
                        "startupImage748x1024"   : {"manifestEntryKey" : "sap.ui", "path": "icons.startupImage748x1024"},
                        "startupImage1536x2008"  : {"manifestEntryKey" : "sap.ui", "path": "icons.startupImage1536x2008"},
                        "startupImage1496x2048"  : {"manifestEntryKey" : "sap.ui", "path": "icons.startupImage1496x2048"},
                        "compactContentDensity"  : {"manifestEntryKey" : "sap.ui5", "path": "contentDensities.compact"},
                        "cozyContentDensity"  : {"manifestEntryKey" : "sap.ui5", "path": "contentDensities.cozy"}
                    },
                    potentiallyRelativeUrls,
                    sComponentUrl,
                    isUrlRelative,
                    bManifestExists,
                    sPropertyKey,
                    sConfigResourceBundleUrl,
                    oResourceBundle,
                    oComponentHandle = oApplication && oApplication.componentHandle;

                if (sKey) {

                    if (!(oMetadata.hasOwnProperty(sKey))) {

                        oMetadata[sKey] = {
                            complete : false
                        }; //independent from application type - create an object for metadata; initialize the complete flag with false!
                    }

                    if (!oMetadata[sKey].complete) {

                        if (oComponentHandle) {
                            oLocalMetadataComponent = oComponentHandle.getMetadata();
                        } else if (sComponentName) {
                            jQuery.sap.log.warning("No component handle available for '" + sComponentName + "'; SAPUI5 component metadata is incomplete",
                                null, "sap.ushell.services.AppConfiguration");
                            return;
                        }

                        if (oLocalMetadataComponent) {

                            oConfig = oLocalMetadataComponent.getConfig();
                            bManifestExists = (oLocalMetadataComponent.getManifest() !== undefined);
                            oMetadata[sKey].complete = true;
                            // If configuration exists and no resource bundle was created from the manifest
                            if (oConfig) {
                                sConfigResourceBundleUrl = oConfig.resourceBundle || "";
                                if (sConfigResourceBundleUrl) {
                                    if (sConfigResourceBundleUrl.slice(0, 1) !== '/') {
                                        sConfigResourceBundleUrl = sUrl + sConfigResourceBundleUrl;
                                    }
                                    oResourceBundle = jQuery.sap.resources({
                                        url: sConfigResourceBundleUrl,
                                        locale : sap.ui.getCore().getConfiguration().getLanguage()
                                    });
                                }
                            }

                            // Loop over all property names, and for each one - get the value from the manifest or from the application configuration
                            for (sPropertyKey in oProperties) {
                                if (oProperties.hasOwnProperty(sPropertyKey)) {
                                    if (bManifestExists) {
                                        // Get property value from the manifest
                                        oMetadata[sKey][sPropertyKey] = this.getPropertyValueFromManifest(oLocalMetadataComponent, oProperties, sPropertyKey);
                                    }

                                    // If application configuration exists  and the property value was not found in the manifest -
                                    // look for it in the configuration
                                    if (oConfig  && oMetadata[sKey][sPropertyKey] === undefined) {
                                        // Get property value from the configuration
                                        oMetadata[sKey][sPropertyKey] = this.getPropertyValueFromConfig(oConfig, sPropertyKey, oResourceBundle);
                                    }
                                }
                            }
                            oMetadata[sKey].version = oLocalMetadataComponent.getVersion();
                            oMetadata[sKey].libraryName = oLocalMetadataComponent.getLibraryName();
                        } else if (utils.isApplicationTypeNWBCRelated(oApplication.applicationType)) {
                            var sWdaApplicationUrlString = "/~canvas;window=app/wda/",
                                iIndexOfWdaApplicationUrlString = oApplication.url.indexOf(sWdaApplicationUrlString),
                                sWebGUIApplicationUrlString = "/bc/gui/sap/its/webgui",
                                iIndexOfWebGUIApplicationUrlString = oApplication.url.indexOf(sWebGUIApplicationUrlString);
                            if (iIndexOfWdaApplicationUrlString >= 0) {
                                //WebDynproABAPApplication
                                ///ui2/nwbc/~canvas;window=app/wda/S_EPM_FPM_PD/?sap-wd-configId=s_epm_fpm_pd
                                oMetadata[sKey].libraryName = oApplication.url.substring(
                                    (iIndexOfWdaApplicationUrlString + sWdaApplicationUrlString.length),
                                    oApplication.url.indexOf("/", (iIndexOfWdaApplicationUrlString + sWdaApplicationUrlString.length))
                                );
                            }
                            oMetadata[sKey].complete = true;
                            if (iIndexOfWebGUIApplicationUrlString >= 0) {
                                //WebGUITransaction
                                ///sap/bc/gui/sap/its/webgui;~sysid=XXX;~service=3255?%7etransaction=SU01&%7enosplash=1
                                var sETransactionString = "etransaction=",
                                    iETransactionStart = oApplication.url.indexOf(sETransactionString, iIndexOfWebGUIApplicationUrlString + sWebGUIApplicationUrlString.length),
                                    iETransactionEndDetermination = oApplication.url.indexOf("&", iETransactionStart),
                                    iETransactionEnd =  (iETransactionEndDetermination >= 0) ? iETransactionEndDetermination : oApplication.url.length;
                                oMetadata[sKey].libraryName = oApplication.url.substring(
                                    iETransactionStart + sETransactionString.length,
                                    iETransactionEnd
                                ) + " (TCODE)";
                            }
                        } else {
                            jQuery.sap.log.warning("No technical information for the given application could be determined", null, "sap.ushell.services.AppConfiguration");
                        }
                    }
                    /*
                     * Special behavior for relative URLs:
                     * Relative URLs are considered relative to the folder containing the Component.js,
                     * which requires adjustments here. Otherwise the browser would interpret them as
                     * relative to the location of the HTML file, which might be different and also
                     * hard to guess for app developers.
                     */
                    potentiallyRelativeUrls = [
                        "favIcon",
                        "homeScreenIconPhone",
                        "homeScreenIconPhone@2",
                        "homeScreenIconTablet",
                        "homeScreenIconTablet@2",
                        "startupImage320x460",
                        "startupImage640x920",
                        "startupImage640x1096",
                        "startupImage768x1004",
                        "startupImage748x1024",
                        "startupImage1536x2008",
                        "startupImage1496x2048"
                    ];

                    sComponentUrl = (sUrl && sUrl[sUrl.length - 1] === '/') ?
                            sUrl.substring(0, sUrl.length - 1) : sUrl;

                    isUrlRelative = function (sUrl) {
                        /*jslint regexp : true*/
                        if (sUrl.match(/^https?:\/\/.*/)) {
                            return false;
                        }
                        return sUrl && sUrl[0] !== '/';
                    };

                    potentiallyRelativeUrls.forEach(function (sPropName) {
                        var sOrigValue = oMetadata[sKey][sPropName],
                            sFinalValue = null;
                        // Some URL properties might not be defined.
                        if (sOrigValue) {
                            sFinalValue = isUrlRelative(sOrigValue) ?
                                    sComponentUrl + "/" + sOrigValue : sOrigValue;
                        }
                        oMetadata[sKey][sPropName] = sFinalValue;
                    });
                }
            } catch (err) {
                jQuery.sap.log.warning("Application configuration could not be parsed");
            }
        };

    } // Metadata


    /**
     * The Unified Shell App configuration service as a singleton object.
     *
     * @class The unified shell's AppConfiguration service.
     *
     * @name sap.ushell.services.AppConfiguration
     * @since 1.15.0
     * @public
     */
    return new AppConfiguration();

}, true/* bExport */);
