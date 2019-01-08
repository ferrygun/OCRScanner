// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The <code>sap.ushell.User</code> object with related functions.
 */

sap.ui.define(['./utils'],
    function(utils) {
    "use strict";

    /*global jQuery, sap, URI */
    // "private" methods (static) without need to access properties -------------

    /**
     * Clone a JSON object.
     *
     * @param {object} oObject object to clone
     * @returns {object} copy of the input object
     *
     * @private
     */
    function clone(oObject) {
        if (oObject === undefined) {
            return undefined;
        }
        return jQuery.extend(true, {}, oObject);
    }

    function getOrigin(oUri) {
        var sOrigin;

        if (oUri.host && typeof oUri.host === "function" && oUri.host()) {
            sOrigin = oUri.host();
            if (typeof oUri.protocol === "function" && oUri.protocol()) {
                sOrigin = oUri.protocol() + "://" + sOrigin;
            }
            return sOrigin;
        }
        return "";
    }

    /**
     * Determines if a theme is a SAP theme
     * @param {string} sTheme
     *      Theme to be tested
     * @returns {boolean}
     *      <code>true</code> if the theme is an SAP theme
     * @private
     */
    function isSapTheme(sTheme) {
        return sTheme.indexOf("sap_") === 0;
    }

    // "public class" -----------------------------------------------------------

    /**
     * Constructs a new representation (wrapper) of the user object as loaded by the
     * startup service.
     * @class
     * @param {object} oContainerAdapterConfig
     *    the result of the startup service call
     * @since 1.15.0
     */
    var User = function (oContainerAdapterConfig) {
        // actually the parameter contains the container adapter config
        var aChangedProperties = [],
            oBootTheme,
            oSystemTheme,
            oCurrentTheme,
            oNextStartupTheme,
            oEventProvider = new sap.ui.base.EventProvider();
        // constructor code below

        /**
         * Returns this user's email address.
         *
         * @returns {string}
         *   this user's email address
         * @since 1.15.0
         */
        this.getEmail = function () {
            return oContainerAdapterConfig.email;
        };

        /**
         * Returns this user's first name.
         *
         * @returns {string}
         *   this user's first name
         * @since 1.15.0
         */
        this.getFirstName = function () {
            return oContainerAdapterConfig.firstName;
        };

        /**
         * Returns this user's full name.
         *
         * @returns {string}
         *   this user's full name
         * @since 1.15.0
         */
        this.getFullName = function () {
            return oContainerAdapterConfig.fullName;
        };

        /**
         * Returns this user's ID.
         *
         * @returns {string}
         *   this user's ID
         * @since 1.15.0
         */
        this.getId = function () {
            return oContainerAdapterConfig.id;
        };

        /**
         * Returns this user's language.
         *
         * @returns {string}
         *   this user's language
         * @since 1.15.0
         */
        this.getLanguage = function () {
            return oContainerAdapterConfig.language;
        };

        /**
         * Returns this user's language tag as defined by this
         * <a href="http://tools.ietf.org/html/bcp47">spec</a>.
         *
         * @returns {string}
         *   this user's language tag according to BCP 47
         * @since 1.15.0
         */
        this.getLanguageBcp47 = function () {
            return oContainerAdapterConfig.languageBcp47;
        };

        /**
         * Returns this user's last name.
         *
         * @returns {string}
         *   this user's last name
         * @since 1.15.0
         */
        this.getLastName = function () {
            return oContainerAdapterConfig.lastName;
        };

        /**
         * Returns a URI to this user's image.
         *
         * @returns {string}
         *   a URI to this user's image
         * @since 1.21.1
         */
        this.getImage = function () {
            return oContainerAdapterConfig.image;
        };

        /**
         * Sets the URI of this user's image.
         *
         * @param {string} [sUserImageURI]
         *  The user image URI.
         * @since 1.35.0
         */
        this.setImage = function (sUserImageURI) {
            oContainerAdapterConfig.image = sUserImageURI;
            oEventProvider.fireEvent('onSetImage', sUserImageURI);
        };

        /**
         * Attaches an event handler fnFunction to be called upon the 'onSetImage' event of this sap.ushell.User.
         * Event is fired upon user image setting
         *
         * @param {function} [fnFunction]
         *  The function to be called when the event occurs.
         * @param {object} [oData]
         *  An application-specific payload object that will be passed to the event handler along with the event object when firing the event.
         * @since 1.35.0
         */
        this.attachOnSetImage = function (fnFunction ,oData) {
            oEventProvider.attachEvent('onSetImage', fnFunction, oData);
        };

        /**
         * Returns <code>true</code> if SAP Jam is active for this user.
         *
         * @returns {boolean}
         *   <code>true</code> if SAP Jam is active for this user
         * @since 1.15.0
         */
        this.isJamActive = function () {
            return oContainerAdapterConfig.isJamActive === true;
        };

        /**
         * Returns <code>true</code> if language is personalized for this user.
         * If not - the user takes the language from the browser
         *
         * @returns {boolean}
         *   <code>true</code> if language is personalized for this user
         * @since 1.48.0
         */
        this.isLanguagePersonalized = function () {
            return oContainerAdapterConfig.isLanguagePersonalized === true;
        };

        /**

        /**
         * Returns this user's current theme.
         *
         * @param {string} [sThemeFormat]
         *  Format of the value to be returned.
         *  If not supplied the theme name (with no path) is returned.
         *  Possible types defined in sap.ushell.User.prototype.constants.themeFormat:
         *  ORIGINAL_THEME either supplied by bootstrap or by user preferences
         *  THEME_NAME_PLUS_URL
         *      e.g. mytheme@https://server.company.com/theme/path/sap-client=000/~2324edfj534ft43~
         *      If no URL is available it will return only the theme name.
         *  NWBC
         *      returns the value for calling WDA & SAP GUI via NWBC
         * @returns {string}
         *   this user's selected theme
         * @since 1.15.0
         */
        this.getTheme = function (sThemeFormat) {
            if (sThemeFormat === User.prototype.constants.themeFormat.ORIGINAL_THEME) {
                return oCurrentTheme.originalTheme.theme;
            }
            if (sThemeFormat === User.prototype.constants.themeFormat.THEME_NAME_PLUS_URL) {
                return oCurrentTheme.theme + (oCurrentTheme.locationPath ? "@" + oCurrentTheme.locationOrigin + oCurrentTheme.locationPath : "");
            }
            if (sThemeFormat === User.prototype.constants.themeFormat.NWBC) {
                if (isSapTheme(oCurrentTheme.theme)) {
                    return oCurrentTheme.theme;
                        // the theme is fetched from the system the web content is served
                } else {
                   return this.getTheme(User.prototype.constants.themeFormat.THEME_NAME_PLUS_URL);
                       // custom themes are there only on the front-end server
                }
            }
            return oCurrentTheme.theme; //to stay compatible
        };

        /**
         * Sets this user's selected theme and applies it.
         * Also the theme is prepared to be stored as next start theme on the front-end server.
         * The save itself has to be triggered by method updateUserPreferences of the UserInfo service.
         * The theme can have the following formats:
         * - <SAP theme> (starts with sap_)
         *   Theme will be loaded from the standard UI5 theme path from the front-end server
         * - <custom theme> (does not start with sap_)
         *   Theme will be loaded from the standard custom theme path (system theme root)
         *   from the front-end server
         * - <theme name>@<theme path>
         *   Theme will be loaded from the supplied path from the front-end server
         * - <theme name>@<theme URL> (not only the theme path but has also the origin)
         *   Theme will be loaded from the supplied URL. There could occur same origin issues.
         * The theme root where the theme to be applied is read from is determined considering the
         * theme name. If the theme starts with sap_ the theme is read from the standard UI5
         * theme path. For all other themes the front-end server's system theme root is used.
         *
         * @param {string} sNewTheme
         *   The theme to be applied
         * @since 1.15.0
         */
        this.setTheme = function (sNewTheme) {
            if (this.isSetThemePermitted() === false) {
                var sErrorMsg = "setTheme not permitted";
                jQuery.sap.log.error(sErrorMsg);
                throw new Error(sErrorMsg);
            }
            oCurrentTheme = this._amendTheme({
                theme: sNewTheme,
                root: ""
            }, oSystemTheme);
            if (sNewTheme !== oNextStartupTheme.originalTheme.theme) {
                this.setChangedProperties({
                    propertyName: "theme",
                    name: "THEME"
                }, oNextStartupTheme.originalTheme.theme, sNewTheme);
                oNextStartupTheme = oCurrentTheme;
            }
            // oCurrentTheme is set completely -> apply the theme
            if (oCurrentTheme.suppliedRoot) {
                sap.ui.getCore().applyTheme(oCurrentTheme.theme, oCurrentTheme.suppliedRoot + "/UI5/");
                // the supplied path is the first choice
            } else if (oCurrentTheme.path) {
                sap.ui.getCore().applyTheme(oCurrentTheme.theme, oCurrentTheme.path + "/UI5/");
                // second choice is the ammended path
            } else {
                sap.ui.getCore().applyTheme(oCurrentTheme.theme);
                // sap_ theme from the front-end server
            }
        };

        /**
         * Sets this user's selected language and applies it.
         * Also the language is prepared to be stored as next start language on the front-end server.
         * The save itself has to be triggered by method updateUserPreferences of the UserInfo service.
         *
         * @param {string} sNewLanguage
         *   The theme to be applied
         * @since 1.46.0
         */
        this.setLanguage = function (sNewLanguage) {
            if (sNewLanguage) {
                this.setChangedProperties({
                    propertyName: "language",
                    name: "LANGUAGE"
                }, oContainerAdapterConfig.language, sNewLanguage);
                oContainerAdapterConfig.language = sNewLanguage;
            }
        };

        /**
         * Returns <code>true</code> if accessibility is active for this user.
         *
         * @returns {boolean}
         *   <code>true</code> if accessibility is active for this user
         * @since 1.15.0
         */
        this.getAccessibilityMode = function () {
            return oContainerAdapterConfig.accessibility;
        };

        /**
         * Set this user's Accessibility mode.
         *
         * @param {boolean} bAccessibility
         *      <code>true</code> if accessibility shall be active for this user
         * @since 1.15.0
         */
        this.setAccessibilityMode = function (bAccessibility) {
            if (this.isSetAccessibilityPermitted() === false) {
                var sErrorMsg = "setAccessibilityMode not permitted";
                jQuery.sap.log.error(sErrorMsg);
                throw new Error(sErrorMsg);
            }

            oContainerAdapterConfig.accessibility = bAccessibility;
        };

        /**
         * Return <code>true</code> if user is permitted to modify accessibility property.
         *
         * @returns {boolean}
         *   <code>true</code> if user is permitted to modify accessibility property.
         * @since 1.15.0
         */
        this.isSetAccessibilityPermitted = function () {
            return oContainerAdapterConfig.setAccessibilityPermitted;
        };

        /**
         * Return <code>true</code> if user is permitted to modify theme property.
         *
         * @returns {boolean}
         *   <code>true</code> if user is permitted to modify theme property.
         * @since 1.15.0
         */
        this.isSetThemePermitted = function () {
            return oContainerAdapterConfig.setThemePermitted;
        };

        /**
         * Returns the content density mode for this user.
         *
         * @returns {string}
         *   the content density mode for this user
         * @see #setContentDensity
         * @since 1.30.0
         */
        this.getContentDensity = function () {
            return oContainerAdapterConfig.contentDensity;
        };

        /**
         * Set the user's content density mode (e.g. "cozy", "compact"...)
         * @param {string} sContentDensity content density mode (e.g. "cozy", "compact"...)
         *
         * @throws Throws {sErrorMsg} if the configuration of ContentDensity for the user is not permitted
         * @see #isSetContentDensityPermitted
         * @since 1.30.0
         */
        this.setContentDensity = function (sContentDensity) {
            if (this.isSetContentDensityPermitted() === false) {
                var sErrorMsg = "setContentDensity not permitted";
                jQuery.sap.log.error(sErrorMsg);
                throw new Error(sErrorMsg);
            }
            this.setChangedProperties({
                propertyName: "contentDensity",
                name: "CONTENT_DENSITY"
            }, oContainerAdapterConfig.contentDensity, sContentDensity);// test that setChangedProperties is called if it is allowed to change contentDensity
            //
            oContainerAdapterConfig.contentDensity = sContentDensity;
        };


        /**
         * Returns <code>true</code> if user has the permission to modify
         * content density property.
         *
         * @returns {boolean}
         *   <code>true</code> if user is permitted to modify content density property.
         *
         * @see #setContentDensity
         *
         * @since 1.30.0
         */
        this.isSetContentDensityPermitted = function () {
            return oContainerAdapterConfig.setContentDensityPermitted;
        };

        /**
         * Returns this user's array of changed properties.
         *
         * @returns {string}
         *   this user's array of changed properties
         * @since 1.23.0
         */
        this.getChangedProperties = function () {
            return jQuery.extend(true, [], aChangedProperties); // return a clone
        };

        /**
         * Updates the ChangedProperties attributes array on each setter invocation
         *
         * @param {object} property
         *      property to change
         * @param {string} currentValue
         *      current property value
         * @param {string} newValue
         *      value after update of the properties is done
         * @since 1.23.0
         */
        this.setChangedProperties = function (property, currentValue, newValue) {
            aChangedProperties.push({ propertyName : property.propertyName, name : property.name, oldValue : currentValue, newValue : newValue });
        };

        /**
         * Cleans the ChangedProperties array
         *
         * @since 1.23.0
         */
        this.resetChangedProperties = function () {
            aChangedProperties = [];
        };

        this.getTrackUsageAnalytics = function () {
            return oContainerAdapterConfig.trackUsageAnalytics;
        };

        this.setTrackUsageAnalytics = function (bTrackUsageAnalytics) {
            this.setChangedProperties({
                propertyName: "trackUsageAnalytics",
                name: "TRACKING_USAGE_ANALYTICS"
            }, oContainerAdapterConfig.trackUsageAnalytics, bTrackUsageAnalytics);
            oContainerAdapterConfig.trackUsageAnalytics = bTrackUsageAnalytics;
        };
        // TO DO Would a resetChangedProperty - reset a specific property instead of the whole array -  not make more sense?

        // ------- Constructor -------
        oSystemTheme = {
            locationPathUi5: (new URI(jQuery.sap.getModulePath(""))).absoluteTo(document.location).pathname(),
                // ensure an absolute path
            locationPathCustom: oContainerAdapterConfig.themeRoot || "",
            locationOrigin: getOrigin(new URI(document.location))
        };
        if (!oSystemTheme.locationPathUi5) {
            jQuery.sap.log.warning("User: Could not set UI5 location path");
        }
        if (!oSystemTheme.locationPathCustom) {
            jQuery.sap.log.warning("User: Could not set location path for custom themes");
        }
        if (!oSystemTheme.locationOrigin) {
            jQuery.sap.log.warning("User: Could not set front-end server location origin");
        }
        oBootTheme = oContainerAdapterConfig.bootTheme || {theme: "", root: ""};
        oCurrentTheme = this._amendTheme(oBootTheme, oSystemTheme);
        oNextStartupTheme = oCurrentTheme;
    };

    /**
     * Completes missing parts of a theme data set returning a new object
     * @param {object} oThemeInput
     *      Input theme object
     *      {
     *          theme: <theme_name> plus optional theme path or URL
     *          root:  <theme path or URL>
     *      }
     * @param {object} oSystemTheme
     *      Theme data from the front-end server
     *      {
     *          locationPathUi5: <location path from where the sap_ themes are loaded from>
     *          locationPathCustom: <stantard location path from where the custom themes are loaded from>
     *          locationOrigin: <origin of the front-end server URL>
     *      }
     * @returns {object}
     *      {
     *          originalTheme: {
     *              theme: <theme name plus optional origin and path>,
     *              root: <might be empty
     *              suppliedRoot: <either split from the theme or the root member
     *          },
     *          theme: <theme name>,
     *          path: <theme path>,
     *          locationPath: <path of the theme loading URL>,
     *          locationOrigin: <origin of the theme loading URL>
     *      }
     * @private
     */
    User.prototype._amendTheme = function (oThemeInput, oSystemTheme) {
        var oThemeResult = {},
            aThemeParts,
            oRootParts;

        function splitRootAndAmend (sRoot, oSystemTheme) {
            var oUrl,
                sOrigin,
                oParts = {};

            oUrl = new URI(sRoot);
            sOrigin = getOrigin(oUrl);
            if (sOrigin) {
                oParts.locationOrigin = sOrigin;
                oParts.locationPath = oUrl.path();
            } else {
                // root has no origin -> use the system origin
                oParts.locationOrigin = oSystemTheme.locationOrigin;
                oParts.locationPath = sRoot;
            }
            return oParts;
        }

        if (!oThemeInput || !oThemeInput.theme || !oSystemTheme) {
            return {
                originalTheme: {
                    theme: "",
                    root: ""
                },
                theme: "",
                suppliedRoot: "",
                path: "",
                locationPath: "",
                locationOrigin: ""
            };
        }
        oThemeResult.originalTheme = clone(oThemeInput);
        if (oThemeResult.originalTheme.theme.indexOf("@") > 0) {
            aThemeParts = oThemeResult.originalTheme.theme.split('@', 2);
            oThemeResult.theme = aThemeParts[0];
            oThemeResult.suppliedRoot = aThemeParts[1];
            oRootParts = splitRootAndAmend(aThemeParts[1], oSystemTheme);
            oThemeResult.locationPath = oRootParts.locationPath;
            oThemeResult.path = oThemeResult.locationPath;
            oThemeResult.locationOrigin = oRootParts.locationOrigin;
            return oThemeResult;
        }
        oThemeResult.theme = oThemeResult.originalTheme.theme; // contains no path
        if (oThemeResult.originalTheme.root) {
            oThemeResult.suppliedRoot = oThemeResult.originalTheme.root;
            oRootParts = splitRootAndAmend(oThemeResult.originalTheme.root, oSystemTheme);
            oThemeResult.locationPath = oRootParts.locationPath;
            oThemeResult.path = oThemeResult.locationPath;
            oThemeResult.locationOrigin = oRootParts.locationOrigin;
            return oThemeResult;
        }
        // no root supplied
        oThemeResult.suppliedRoot = "";
        if (isSapTheme(oThemeResult.theme)) {
            // no root & sap theme
            oThemeResult.locationOrigin = oSystemTheme.locationOrigin;
            oThemeResult.locationPath = oSystemTheme.locationPathUi5;
            oThemeResult.path = "";
            return oThemeResult;
        }
        oThemeResult.locationOrigin = oSystemTheme.locationOrigin;
        oThemeResult.locationPath = oSystemTheme.locationPathCustom;
        oThemeResult.path = oThemeResult.locationPath;
        return oThemeResult;
    };

    User.prototype.constants = {
            /**
             * Enum for theme format.
             * @readonly
             * @enum {String}
             * ORIGINAL_THEME:
             *     either supplied by bootstrap or by user preferences
             * THEME_NAME_PLUS_URL:
             *     e.g. mytheme@https://server.company.com/theme/path/sap-client=000/~2324edfj534ft43~
             * NWBC:
             *     for calling WDA & SAP GUI via NWBC;
             *         for sap_ themes -> only theme name;
             *         for custom themes -> THEME_NAME_PLUS_URL
             * * @since 1.34.0
             */
            themeFormat : {
                ORIGINAL_THEME: "O",
                    // either supplied by bootstrap or by user preferences
                THEME_NAME_PLUS_URL: "N+U",
                    // e.g. mytheme@https://server.company.com/theme/path/sap-client=000/~2324edfj534ft43~
                NWBC: "NWBC"
                    // for calling WDA & SAP GUI via NWBC
            }
        };


    return User;

}, /* bExport= */ true);
