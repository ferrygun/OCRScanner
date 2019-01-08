// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview This file contains miscellaneous utility functions.
 * They are for exclusive use within the unified shell unless otherwise noted.
 */

sap.ui.define(function() {
    "use strict";

    /*global dispatchEvent, document, jQuery, URI, localStorage, sap, clearTimeout, setTimeout */

    // ensure that sap.ushell exists
    var utils = {};

    /**
     * Tells whether the given value is an array.
     *
     * @param {object} o
     *   any value
     * @returns {boolean}
     *   <code>true</code> if and only if the given value is an array
     * @private
     * @since 1.34.0
     */
    utils.isArray = function (o) {
        // see Crockford page 61
        return Object.prototype.toString.apply(o) === '[object Array]';
    };

    /**
     * Allows to access a member with names containing a dot represented as '|'
     * @param {object} oObject a javascript object
     * @param {string} sAccessPath  an accesss path, e.g. sap|flp.type
     * representing  o["sap.flp"].type
     * @returns {any} the value of the member or undefined if access path not found
     * @since 1.40.0
     * @private
     */
    utils.getMember = function (oObject,sAccessPath) {
        var oPathSegments = sAccessPath.split("."),
            oNextObject = oObject;
        if (!oObject) {
            return undefined;
        }
        oPathSegments.forEach(function(sSegment) {
            if (typeof oNextObject !== "object") {
                return undefined;
            }
            oNextObject = oNextObject[sSegment.replace(/[|]/g,".")];
        });
        return oNextObject;
    };

    utils.addTime = function (sId, sInfo, iEnd) {
        if (!window["sap-ushell-startTime"]) {
            window["sap-ushell-startTime"] = Date.now();
        }
        var iStart = window["sap-ushell-startTime"];
        iEnd = iEnd || Date.now();
        if (iEnd < iStart) {
            iEnd = iStart + 1;
        }
        jQuery.sap.measure.add("sap.ushell.fromStart." + sId, sInfo, iStart, iEnd, iEnd - iStart, iEnd - iStart);
    };
    /**
     * Creates an <code>Error</code> object and logs the error message immediately.
     * Class representing an error that is written to the log.
     *
     * @param {string} sMessage
     *   the error message
     * @param {string} [sComponent]
     *   the error component to log
     * @class
     * @constructor
     * @private
     * @since 1.15.0
     */
    utils.Error = function (sMessage, sComponent) {
        this.name = "sap.ushell.utils.Error";
        this.message = sMessage;
        jQuery.sap.log.error(sMessage, null, sComponent);
    };

    utils.Error.prototype = new Error();

    /**
     * Wrapper for localStorage.setItem() including exception handling
     * caused by exceeding storage quota limits
     * or exception is always thrown (safari private browsing mode)
     *
     * @param {string} sKey
     *   the key for the storage entry
     * @param {string} sValue
     *   the value for the storage entry
     * @param {boolean} [bLocalEvent=false]
     *   when true the storage event is also fired for the source window
     *
     * @since 1.21.2
     * @private
     */
    utils.localStorageSetItem = function (sKey, sValue, bLocalEvent) {
        var oEvent;
        try {
            localStorage.setItem(sKey, sValue);
            if (bLocalEvent) {
                oEvent = document.createEvent("StorageEvent");
                // Events are fired only if setItem works
                // If we want to decouple this (to have eventing to the same window)
                // we have to provide a wrapper for localStorage.getItem and -removeItem() also
                oEvent.initStorageEvent("storage", false, false,
                        sKey, "", sValue, "", localStorage);
                dispatchEvent(oEvent);
            }
        } catch (e) {
            jQuery.sap.log.warning("Error calling localStorage.setItem(): " + e, null,
                "sap.ushell.utils");
        }
    };

    /**
     * Getter for <code>localStorage</code> to facilitate testing.
     *
     * @returns {Storage}
     *   the local storage instance
     * @private
     * @since 1.34.0
     */
    utils.getLocalStorage = function () {
        return window.localStorage;
    };

    /**
     * Returns an unique ID based on jQuery.sap.uid().
     *
     * @param {function || array} vTestCondition
     *   Can be either an array of all already existing IDs or a function which must check if the
     *   new generated ID is unique.
     *   In case of an array generateUniqueId will generate new IDs as long as it finds one which
     *   is unique.
     *   In case of a function it will be called with every generated ID. The function shall
     *   check if the generated ID is unique and shall return true in that case;
     * @returns {string}
     *   An unique ID which passed the fnCheckId test.
     * @private
     * @since 1.42.0
     */
    utils.generateUniqueId = function (vTestCondition) {
        var sUniqueId,
            aExistingIds,
            fnIsUniqueId;

        if (jQuery.isArray(vTestCondition)) {
            aExistingIds = vTestCondition;

            fnIsUniqueId = function (sGeneratedId) {
                return aExistingIds.indexOf(sGeneratedId) === -1;
            };
        } else {
            fnIsUniqueId = vTestCondition;
        }

        do {
            sUniqueId = jQuery.sap.uid();
        } while (!fnIsUniqueId(sUniqueId)); // accept falsy values

        return sUniqueId;
    };

    /**
     * For a demo platform logout no redirect happens but a reload is made
     * to take care that the progress indicator is gone.
     * Used e.g. in ContainerAdapter as part of the local platform.
     *
     * @private
     * @since 1.34.0
     */
    utils.reload = function () {
        location.reload();
    };

    /**
     * Given a link tag ( a ) or a window object, calculate the origin (protocol, host, port)
     * especially for cases where the .origin property is not present on the DOM Member
     * (IE11)
     * @param {object} oDomObject a location bearig object, e.g. a link-tag DOMObject or a window
     * @returns {string} a string containing protocol :// host : port (if present),
     *  e.g. "http://www.sap.com:8080" or "https://uefa.fifa.com"
     * @private
     */
    utils.calculateOrigin = function (oDomObject) {
        var oURI;
        if (oDomObject.origin) {
            return oDomObject.origin;
        }
        if (oDomObject.protocol && oDomObject.hostname) {
            return oDomObject.protocol + "//" + oDomObject.hostname + (oDomObject.port ? ':' + oDomObject.port : '');
        }
        if (oDomObject.href) {
            oURI = new URI(oDomObject.href);
            //beware, URI treats : not as part of the protocol
            return oURI.protocol() + "://" + oURI.hostname() + (oURI.port() ? ':' + oURI.port() : '');
        }
    };

    /**
     * Exposes a private epcm object used for the NWBC for Desktop integration
     * @return {object} a native browser object
     * @private
     *
     */
    utils.getPrivateEpcm = function () {
        if (window.external && window.external && typeof window.external.getPrivateEpcm !== "undefined") {
            return window.external.getPrivateEpcm();
        }
        return undefined;
    };
    /**
     * Detect whether the browser can open WebGui applications natively.
     *
     * This is expected to happen from NWBC Version 6 onward.
     *
     * NWBC exposes a feature bit vector via the getNwbcFeatureBits method of
     * the private epcm object.  This is expected to be a
     * string in hex format representing 4 bits, where the least significant
     * bit represents native navigation capability. For example: "B" = 1011,
     * last bit is 1, therefore native navigation capability is enabled.
     *
     * @return {boolean}
     *     whether the browser can open SapGui applications natively
     */
    utils.hasNativeNavigationCapability = function () {
        return utils.isFeatureBitEnabled(1);
    };

    /**
     * Detect whether NWBC can logout natively.
     *
     * NWBC exposes a feature bit vector via the getNwbcFeatureBits method of
     * the private epcm object.  This is expected to be a
     * string in hex format representing 4 bits, where the 2nd least significant
     * bit represents native logout capability. For example: "B" = 1011,
     * second last bit is 1, therefore native logout capability is enabled.
     *
     * @return {boolean}
     *     whether the browser can logout natively
     */
    utils.hasNativeLogoutCapability = function () {
        return utils.isFeatureBitEnabled(2);
    };

    /**
     * Determines whether a certain NWBC feature is enabled using
     * the NWBC feature bit vector.
     *
     * @param {number} iFeatureBit
     *     the position of the feature bit to check, starting from the
     *     rightmost bit of the NWBC feature bit vector
     * @return {boolean}
     *     whether the feature bit is enabled or not
     */
    utils.isFeatureBitEnabled = function (iFeatureBit) {
        var sFeaturesHex = "0",
            oPrivateEpcm;

        // Try to get the Feature version number
        oPrivateEpcm = utils.getPrivateEpcm();
        if (oPrivateEpcm) {
            try {
                sFeaturesHex = oPrivateEpcm.getNwbcFeatureBits();
                jQuery.sap.log.debug("Detected epcm getNwbcFeatureBits returned feature bits: " + sFeaturesHex);
            } catch (e) {
                jQuery.sap.log.error(
                    "failed to get feature bit vector via call getNwbcFeatureBits on private epcm object",
                    e.stack,
                    "sap.ushell.utils"
                );
            }
        }
        return (parseInt(sFeaturesHex, 16) & iFeatureBit) > 0;
    };

    /**
     * Method to determine whether the given application type can be treated as
     * an "NWBC" application type  (e.g. NWBC, TR).
     *
     * @param {string} sApplicationType
     *   the type of the application
     *
     * @returns {boolean}
     *   whether the ApplicationType is NWBC related or not
     *
     * @private
     * @since 1.36.0
     */
    utils.isApplicationTypeNWBCRelated = function (sApplicationType) {
        return sApplicationType === "NWBC" || sApplicationType === "TR";
    };

    /**
     * Appends the ID of the user to the given URL.  The ID of the user is
     * retrived via the UserInfo service, and appended blindly to the given
     * URL. This method tries to detect whether a previous parameter was
     * already appended and use the <code>?</code> or <code>&</code> separator
     * for the parameter accordingly.
     *
     * @param {string} sParamName
     *   the name of the parameter that needs to be appended.
     * @param {string} sUrl
     *   a URL with or without the sap-user parameter.
     *
     * @returns {string}
     *   the URL with the user id parameter appended.
     *
     * @private
     * @since 1.34.0
     */
    utils.appendUserIdToUrl = function (sParamName, sUrl) {
        var sUserId = sap.ushell.Container.getService("UserInfo").getUser().getId(),
            sSep = sUrl.indexOf("?") >= 0 ? "&" : "?";

        return sUrl + sSep + sParamName + "=" + sUserId;
    };

    /**
     * Determine whether the input oResolvedNavigationTarget represents a
     * WebGui application that can be navigated natively by the browser.
     *
     * @param {object} oResolvedNavigationTarget the resolution result at least properties
     *  applicationType
     * @returns {boolean}
     *      true iff the resolution result represents a response which is to be treated by the Fiori Desktop client
     * @private
     */
    utils.isNativeWebGuiNavigation = function (oResolvedNavigationTarget) {
        if (this.hasNativeNavigationCapability() && oResolvedNavigationTarget && oResolvedNavigationTarget.applicationType === "TR") {
            return true;
        }
        return false;
    };

    /**
     * A mapping from arbitrary string(!) keys (including "get" or "hasOwnProperty") to
     * values of any type.
     * Creates an empty map.
     * @class
     * @since 1.15.0
     */
    utils.Map = function () {
        this.entries = {};
    };

    /**
     * Associates the specified value with the specified key in this map. If the map previously
     * contained a mapping for the key, the old value is replaced by the specified value. Returns
     * the old value. Note: It might be a good idea to assert that the old value is
     * <code>undefined</code> in case you expect your keys to be unique.
     *
     * @param {string} sKey
     *   key with which the specified value is to be associated
     * @param {any} vValue
     *   value to be associated with the specified key
     * @returns {any}
     *   the old value
     * @since 1.15.0
     */
    utils.Map.prototype.put = function (sKey, vValue) {
        var vOldValue = this.get(sKey);
        this.entries[sKey] = vValue;
        return vOldValue;
    };

    /**
     * Returns <tt>true</tt> if this map contains a mapping for the specified key.
     *
     * @param {string} sKey
     *   key whose presence in this map is to be tested
     * @returns {boolean}
     *   <tt>true</tt> if this map contains a mapping for the specified key
     * @since 1.15.0
     */
    utils.Map.prototype.containsKey = function (sKey) {
        if (typeof sKey !== "string") {
            throw new utils.Error("Not a string key: " + sKey, "sap.ushell.utils.Map");
        }
        return Object.prototype.hasOwnProperty.call(this.entries, sKey);
    };

    /**
     * Returns the value to which the specified key is mapped, or <code>undefined</code> if this map
     * contains no mapping for the key.
     * @param {string} sKey
     *   the key whose associated value is to be returned
     * @returns {any}
     *   the value to which the specified key is mapped, or <code>undefined</code> if this map
     *   contains no mapping for the key
     * @since 1.15.0
     */
    utils.Map.prototype.get = function (sKey) {
        if (this.containsKey(sKey)) {
            return this.entries[sKey];
        }
        //return undefined;
    };

    /**
     * Returns an array of this map's keys. This array is a snapshot of the map; concurrent
     * modifications of the map while iterating do not influence the sequence.
     * @returns {string[]}
     *   this map's keys
     * @since 1.15.0
     */
    utils.Map.prototype.keys = function () {
        return Object.keys(this.entries);
    };

    /**
     * Removes a key together with its value from the map.
     * @param {string} sKey
     *  the map's key to be removed
     * @since 1.17.1
     */
    utils.Map.prototype.remove = function (sKey) {
        delete this.entries[sKey];
    };

    /**
     * Returns this map's string representation.
     *
     * @returns {string}
     *   this map's string representation
     * @since 1.15.0
     */
    utils.Map.prototype.toString = function () {
        var aResult = ['sap.ushell.utils.Map('];
        aResult.push(JSON.stringify(this.entries));
        aResult.push(')');
        return aResult.join('');
    };


    /**
     * returns the Parameter value of a boolean
     * "X", "x", "true" and all case variations are true,
     * "false" and "" and all case variations are false
     *  all others and not specified return undefined
     *  @param {string} sParameterName
     *     The name of the parameter to look for, case sensitive
     *  @param {string} [sParams]
     *     specified parameter (search string), if not specified, search part of current url is used
     *  @returns {boolean} true, false or undefined
     */
    utils.getParameterValueBoolean = function (sParameterName, sParams) {
        var aArr = jQuery.sap.getUriParameters(sParams).mParams && jQuery.sap.getUriParameters(sParams).mParams[sParameterName],
            aTruthy = ["true", "x"],
            aFalsy = ["false", ""],
            sValue;
        if (!aArr || aArr.length === 0) {
            return undefined;
        }
        sValue = aArr[0].toLowerCase();
        if (aTruthy.indexOf(sValue) >= 0) {
            return true;
        }
        if (aFalsy.indexOf(sValue) >= 0) {
            return false;
        }
        return undefined;
    };

    /**
     * Calls the given success handler (a)synchronously. Errors thrown in the success handler are
     * caught and the error message is reported to the error handler; if an error stack is
     * available, it is logged.
     *
     * @param {function ()} fnSuccess
     *   no-args success handler
     * @param {function (string)} [fnFailure]
     *   error handler, taking an error message; MUST NOT throw any error itself!
     * @param {boolean} [bAsync=false]
     *   whether the call shall be asynchronously
     * @since 1.28.0
     */
    utils.call = function (fnSuccess, fnFailure, bAsync) {
        // Be aware of that this function is also defined as "sap.ui2.srvc.call".
        // Only difference is error logging to UI5. Please keep aligned!
        var sMessage;

        if (bAsync) {
            setTimeout(function () {
                utils.call(fnSuccess, fnFailure, false);
            }, 0);
            return;
        }

        try {
            fnSuccess();
        } catch (e) {
            sMessage = e.message || e.toString();
            jQuery.sap.log.error("Call to success handler failed: " + sMessage,
                e.stack, //may be undefined: only supported in Chrome, FF; not in Safari, IE
                "sap.ushell.utils");
            if (fnFailure) {
                fnFailure(sMessage);
            }
        }
    };

    /**
     * Setting Tiles visibility using the Visibility contract, according to the view-port's position.
     */
    utils.handleTilesVisibility = function () {
        utils.getVisibleTiles();
    };

    /**
     * Refresh the visible Dynamic Tiles
     */
    utils.refreshTiles = function () {
        var oEventBus = sap.ui.getCore().getEventBus();
        oEventBus.publish("launchpad", "refresTiles");
    };

    /**
     * Setting Tiles visibility using the Visibility contract as not visible.
     *
     * The affected tiles are only the visible tiles according to the view port's position.
     *
     * This action happens immediately with no timers or timeouts.
     */
    utils.setTilesNoVisibility = function () {
        // this method currently is used upon navigation (i.e. Shell.controlelr - openApp)
        // as there is logic that is running in the background such as OData count calls of the dynamic tiles
        // which are still visible at navigation (as no one had marked it otherwise).
        var oEventBus = sap.ui.getCore().getEventBus();
        oEventBus.publish("launchpad", "setTilesNoVisibility");
    };

    /**
     * Gets a hash and returns only the semanticObject-action part of it
     * @param {string} hash shell hash
     * @returns {string} Semantic Object action part of hash, false in case of a syntactically wrong hash
     */
    utils.getBasicHash = function (hash) {
        // Check hash validity
        if (!utils.validHash(hash)) {
            jQuery.sap.log.debug("Utils ; getBasicHash ; Got invalid hash");
            return false;
        }

        var oURLParsing = sap.ushell.Container.getService("URLParsing"),
            oShellHash = oURLParsing.parseShellHash(hash);

        return oShellHash ?  oShellHash.semanticObject + "-" + oShellHash.action : hash;
    };

    utils.validHash = function (hash) {
        return (hash && hash.constructor === String && jQuery.trim(hash) !== "");
    };

    utils.handleTilesOpacity = function (oModel) {
        jQuery.sap.require("sap.ui.core.theming.Parameters");

        var aTilesOpacityValues,
            currentTile,
            appUsagePromise,
            sColor = sap.ui.core.theming.Parameters.get("sapUshellTileBackgroundColor"),
            rgbColor = this.hexToRgb(sColor),
            jqTiles,
            calculatedOpacity,
            RGBAformat,
            jqTile,
            sCurrentHash,
            rgbaValue,
            oContext,
            pathSegments,
            groupind,
            tileInd,
            index,
            oUserRecentsService = sap.ushell.Container.getService("UserRecents");

        //In case of custom theme where UI5 parameters are not used - tiles opacity cannot be supported
        if (rgbColor) {
            RGBAformat = "rgba(" + rgbColor.r + "," + rgbColor.g + "," + rgbColor.b + ",{0})";
            appUsagePromise = oUserRecentsService.getAppsUsage();

            appUsagePromise.done(function (appUsage) {
                aTilesOpacityValues = appUsage.usageMap;
                jqTiles = jQuery('.sapUshellTile').not('.sapUshellTileFooter');
                var groups = oModel.getProperty("/groups");
                oModel.setProperty('/animationRendered', true);

                for (index = 0; index < jqTiles.length; index++) {
                    jqTile = jQuery(jqTiles[index]);
                    sCurrentHash = this.getBasicHash(jqTile.find('.sapUshellTileBase').attr('data-targeturl'));
                    if (sCurrentHash) {
                        calculatedOpacity = this.convertToRealOpacity(aTilesOpacityValues[sCurrentHash], appUsage.maxUsage);
                        rgbaValue = RGBAformat.replace("{0}", calculatedOpacity);
                        currentTile = sap.ui.getCore().byId(jqTile.attr('id'));
                        oContext = currentTile.getBindingContext();
                        pathSegments = oContext.sPath.split('/');
                        groupind = pathSegments[2];
                        tileInd = pathSegments[4];
                        groups[groupind].tiles[tileInd].rgba = rgbaValue;
                    }
                }

                oModel.setProperty("/groups", groups);
            }.bind(this));
        }

    };

    utils.convertToRealOpacity = function (amountOfUsage, max) {
        var aOpacityLevels = [1, 0.95, 0.9, 0.85, 0.8],
            iOpacityVariance = Math.floor(max / aOpacityLevels.length),
            iOpacityLevelIndex;

        if (!amountOfUsage) {
            return aOpacityLevels[0];
        }
        if (!max) {
            return aOpacityLevels[aOpacityLevels.length - 1];
        }
        iOpacityLevelIndex = Math.floor((max - amountOfUsage) / iOpacityVariance);
        return iOpacityLevelIndex < aOpacityLevels.length ? aOpacityLevels[iOpacityLevelIndex] : aOpacityLevels[aOpacityLevels.length - 1];
    };

    utils.getCurrentHiddenGroupIds = function (oModel) {
        var oLaunchPageService = sap.ushell.Container.getService("LaunchPage"),
            aGroups = oModel.getProperty('/groups'),
            aHiddenGroupsIDs = [],
            sGroupId,
            groupIndex,
            bGroupVisible;

        for (groupIndex in aGroups) {
            //check if have property isGroupVisible on aGroups if undefined set isGroupVisible true;
            bGroupVisible = aGroups[groupIndex]?aGroups[groupIndex].isGroupVisible:true;
            //In case of edit mode - it may be that group was only created in RT and still doesn't have an object property
            if (aGroups[groupIndex].object) {
                sGroupId = oLaunchPageService.getGroupId(aGroups[groupIndex].object);
            }
            if (!bGroupVisible && sGroupId !== undefined) {
                aHiddenGroupsIDs.push(sGroupId);
            }
        }
        return aHiddenGroupsIDs;
    };

    utils.hexToRgb = function (hex) {
        var bIsHexIllegal = !hex || hex[0] != '#' || (hex.length  != 4 && hex.length != 7),
            result;

        //If hex consists of three-character RGB notation, convert it into six-digit form
        hex = !bIsHexIllegal && hex.length === 4 ? '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3] : hex;
        result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    /**
     * Gets the device's form factor. Based on <code>sap.ui.Device.system</code> from SAPUI5.
     * @returns {string}
     *   the device's form factor ("desktop", "tablet" or "phone")
     * @since 1.25.1
     */
    utils.getFormFactor = function () {
        // be aware of that this function is also defined as sap.ui2.srvc.getFormFactor. Keep in sync!
        var oSystem = sap.ui.Device.system;

        if (oSystem.desktop) {
            return oSystem.SYSTEMTYPE.DESKTOP;
        }
        if (oSystem.tablet) {
            return oSystem.SYSTEMTYPE.TABLET;
        }
        if (oSystem.phone) {
            return oSystem.SYSTEMTYPE.PHONE;
        }
      // returns undefined
    };

    /**
     * Iterate over all the Tiles and mark each one as visible or non-visible
     * according to the view-port's position.
     *
     * @returns {Array} Array of Tile objects, each one includes the flag "isDisplayedInViewPort" indicating its visibility
     */
    utils.getVisibleTiles = function () {

        var nWindowHeight = document.body.clientHeight,
            oControl = sap.ui.getCore().byId("dashboardGroups"),
            oNavContainer = sap.ui.getCore().byId("viewPortContainer"),
            groupsIndex,
            tilesIndex,
            aElementsInd,
            group,
            groupTiles,
            groupLinks,
            oTile,
            tileDomRef,
            tileOffset,
            tileTop,
            tileBottom,
            shellHdrHeight = jQuery('#shell-hdr').height(),
            aTiles = [],
            aGrpDomElement,
            bIsInDashBoard,
            aVisibleTiles = [],
            oEventBus = sap.ui.getCore().getEventBus(),
            aGroups,
            oElementsByType,
            oElements,
            isDisplayedInViewPort;
        //in case of user move to new tab
        if ( window.document.hidden ) {
            oEventBus.publish("launchpad", "onHiddenTab");
        };

        if (oControl && oControl.getGroups() && oNavContainer) {
            //verify we are in the dashboard page
            aGrpDomElement = jQuery(oControl.getDomRef());
            bIsInDashBoard = aGrpDomElement ? aGrpDomElement.is(":visible") : false;
            aGroups = oControl.getGroups();

            // Loop over all Groups
            //jQuery.each(aGroups, function(groupIndex) {
            for (groupsIndex = 0; groupsIndex < aGroups.length; groupsIndex = groupsIndex + 1) {
                group = aGroups[groupsIndex];
                groupTiles = group.getTiles();
                groupLinks = group.getLinks();

                oElementsByType = [groupTiles, groupLinks];
                for (aElementsInd = 0; aElementsInd < oElementsByType.length; aElementsInd++) {
                    oElements = oElementsByType[aElementsInd];

                    if (oElements) {
                        // Loop over all Tiles in the current Group
                        for (tilesIndex = 0; tilesIndex < oElements.length; tilesIndex++) {

                            oTile = oElements[tilesIndex];

                            if (!bIsInDashBoard || window.document.hidden) {
                                // if current state is not dashboard ("Home") set not visible
                                aTiles.push(oTile);
                            } else {
                                tileDomRef = jQuery(oTile.getDomRef());
                                tileOffset = tileDomRef.offset();

                                if (tileOffset) {
                                    tileTop = tileDomRef.offset().top;
                                    tileBottom = tileTop + tileDomRef.height();

                                    // If the Tile is located above or below the view-port
                                    isDisplayedInViewPort = group.getVisible() && (tileBottom > shellHdrHeight - 300) && (tileTop < nWindowHeight + 300);

                                    if (isDisplayedInViewPort) {
                                        aVisibleTiles.push({
                                            oTile: utils.getTileModel(oTile),
                                            iGroup: groupsIndex,
                                            bIsExtanded: (tileBottom > shellHdrHeight) && (tileTop < nWindowHeight)? false: true
                                        });
                                    } else {
                                        if (aVisibleTiles.length > 0) {
                                            oEventBus.publish("launchpad", "visibleTilesChanged", aVisibleTiles);
                                            return aTiles;
                                        }
                                    }
                                    aTiles.push(oTile);
                                }
                            }
                        } // End of Tiles loop
                    }
                }
            } // End of Groups loop
        }

        if (aVisibleTiles.length > 0) {
            oEventBus.publish("launchpad", "visibleTilesChanged", aVisibleTiles);
        }

        return aTiles;
    };

    utils.getTileModel = function (ui5TileObject) {
        var bindingContext = ui5TileObject.getBindingContext();
        return bindingContext.getObject() ? bindingContext.getObject() : null;
    };

    utils.getTileObject = function (ui5TileObject) {
        var bindingContext = ui5TileObject.getBindingContext();
        return bindingContext.getObject() ? bindingContext.getObject().object : null;
    };

    utils.addBottomSpace = function () {
        var fnAddBottomSpaceAfterAllContentLoaded = function () {
            var jqContainer = jQuery('#dashboardGroups').find('.sapUshellTileContainer:visible');
            var lastGroup = jqContainer.last(),
                headerHeight = jQuery(".sapUshellShellHead > div").height(),
                lastGroupHeight = lastGroup.parent().height(),
                groupTitleMarginTop = parseInt(lastGroup.find(".sapUshellContainerTitle").css("margin-top"), 10),
                groupsContainerPaddingBottom = parseInt(jQuery('.sapUshellDashboardGroupsContainer').css("padding-bottom"), 10),
                nBottomSpace;

            if (jqContainer.length === 1) {
                nBottomSpace = 0;
            } else {
                nBottomSpace = jQuery(window).height() - headerHeight - lastGroupHeight - groupTitleMarginTop - groupsContainerPaddingBottom;
                nBottomSpace = (nBottomSpace < 0) ? 0 : nBottomSpace;
            }

            // Add margin to the bottom of the screen in order to allow the lower TileContainer (in case it is chosen)
            // to be shown on the top of the view-port
            jQuery('.sapUshellDashboardGroupsContainer').css("margin-bottom", nBottomSpace + "px");
            sap.ui.getCore().getEventBus().unsubscribe("launchpad", "dashboardModelContentLoaded", fnAddBottomSpaceAfterAllContentLoaded, this);
        }.bind(this);
        sap.ui.getCore().getEventBus().subscribe("launchpad", "dashboardModelContentLoaded", fnAddBottomSpaceAfterAllContentLoaded, this);

    };

    utils.calcVisibilityModes = function (oGroup, personalization) {
        var bIsVisibleInNormalMode = true,
            bIsVisibleInActionMode = true,
            hasVisibleTiles = utils.groupHasVisibleTiles(oGroup.tiles, oGroup.pendingLinks ? oGroup.pendingLinks : oGroup.links);

        //tileActionModeActive = false
        if (!hasVisibleTiles && (!personalization || (oGroup.isGroupLocked) || (oGroup.isDefaultGroup))) {
            bIsVisibleInNormalMode = false;
        }

        //tileActionModeActive = true
        if (!hasVisibleTiles && (!personalization)) {
            bIsVisibleInActionMode = false;
        }

        return [bIsVisibleInNormalMode, bIsVisibleInActionMode];

    };

    utils.groupHasVisibleTiles = function (groupTiles, groupLinks) {
        var visibleTilesInGroup = false,
            tileIndex,
            tempTile,
            tiles = !groupTiles ? [] : groupTiles,
            links = !groupLinks ? [] : groupLinks;

        tiles = tiles.concat(links);

        if (!tiles.length) {
            return false;
        }

        for (tileIndex = 0; tileIndex < tiles.length; tileIndex = tileIndex + 1) {
            tempTile = tiles[tileIndex];
            // Check if the Tile is visible on the relevant device
            if (tempTile.isTileIntentSupported) {
                visibleTilesInGroup = true;
                break;
            }
        }
        return visibleTilesInGroup;
    };

    /**
     * #
     * @param {function} fnFunction
     *    the function
     * @param {array} aArguments
     *    the arguments
     * @param {string[]} aArgumentsNames
     *    array of the argument names for non-trivial functions with more than one argument
     * @returns {jQuery.Deferred.promise|function}
     *    a promise or a function
     */
    utils.invokeUnfoldingArrayArguments = function (fnFunction, aArguments) {
        var that = this,
            aArgArray,
            oDeferred,
            aPromises,
            aRes,
            thePromise;

        if (!jQuery.isArray(aArguments[0])) {
            // invoke directly
            return fnFunction.apply(this, aArguments);
        }
        // process as array
        aArgArray = aArguments[0];

        if (aArgArray.length === 0) {
            // empty array
            return new jQuery.Deferred().resolve([]).promise();
        }
        oDeferred = new jQuery.Deferred();
        aPromises = [];
        aRes = [];
        thePromise = new jQuery.Deferred().resolve();

        aArgArray.forEach(function (nThArgs, iIndex) {
            if (!jQuery.isArray(nThArgs)) {
                jQuery.sap.log.error("Expected Array as nTh Argument of multivalue invokation: first Argument must be array of array of arguments: single valued f(p1,p2), f(p1_2,p2_2), f(p1_3,p2_3) : multivalued : f([[p1,p2],[p1_2,p2_2],[p1_3,p2_3]]");
                throw new Error("Expected Array as nTh Argument of multivalue invokation: first Argument must be array of array of arguments: single valued f(p1,p2), f(p1_2,p2_2), f(p1_3,p2_3) : multivalued : f([[p1,p2],[p1_2,p2_2],[p1_3,p2_3]]");
            }
            // nThArgs is an array of the arguments
            var pr = fnFunction.apply(that, nThArgs),
                pr2 = new jQuery.Deferred();

            pr.done(function () {
                var a = Array.prototype.slice.call(arguments);
                aRes[iIndex] = a;
                pr2.resolve();
            }).fail(pr2.reject.bind(pr2));
            aPromises.push(pr2.promise());
            thePromise = jQuery.when(thePromise, pr2);
        });

        jQuery.when.apply(jQuery, aPromises).done(function () {
            oDeferred.resolve(aRes);
        }).fail(function () {
            oDeferred.reject("failure");
        });

        // invoke direclty
        return oDeferred.promise();
    };

    /*
     * Returns whether client side nav target resolution is enabled.
     *
     * @returns {boolean}
     *    whether client side nav target resolution is enabled.
     *
     * @private
     */
    utils.isClientSideNavTargetResolutionEnabled = function () {
        var bDefaultEnabled = true,
            sLocalStorageClientSetting;

        if (jQuery.sap.storage === undefined) { // in case it's called before jQuery.sap.storage is defined (e.g., tests)
            sLocalStorageClientSetting = window.localStorage.getItem("targetresolution-client");
            sLocalStorageClientSetting = (
                sLocalStorageClientSetting === false   ||
                sLocalStorageClientSetting === "false" ||
                sLocalStorageClientSetting === ""
            ) ? false : true;

        } else {
            sLocalStorageClientSetting = jQuery.sap.storage(
                jQuery.sap.getObject("jQuery.sap.storage.Type.local"),
                "targetresolution"
            ).get("client");
        }

        // Check when disabled
        if (sLocalStorageClientSetting === "" ||
                sLocalStorageClientSetting === false ||
                utils.getParameterValueBoolean("sap-ushell-nav-cs") === false) {

            return false;
        }

        // Default behavior
        return bDefaultEnabled;
    };
    utils._getCurrentDate = function () {
        return new Date();
    };

    utils._convertToUTC = function (date) {
        var utc_timestamp = Date.UTC(date.getUTCFullYear(),date.getUTCMonth(), date.getUTCDate() ,
            date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
        return utc_timestamp;
    };

    utils.formatDate = function (sCreatedAt) {
        var iCreatedAt,
            iNow,
            iTimeGap,
            iDays,
            iHours,
            iMinutes;

        iCreatedAt = utils._convertToUTC(new Date(sCreatedAt));
        iNow = utils._convertToUTC(utils._getCurrentDate());
        iTimeGap = iNow - iCreatedAt;
        iDays = parseInt(iTimeGap / (1000 * 60 * 60 * 24), 10);
        if (iDays > 0) {
            if (iDays === 1) {
                return sap.ushell.resources.i18n.getText("time_day", iDays);
            }
            return sap.ushell.resources.i18n.getText("time_days", iDays);
        }
        iHours = parseInt(iTimeGap / (1000 * 60 * 60), 10);
        if (iHours > 0) {
            if (iHours === 1) {
                return sap.ushell.resources.i18n.getText("time_hour", iHours);
            }
            return sap.ushell.resources.i18n.getText("time_hours", iHours);
        }
        iMinutes = parseInt(iTimeGap / (1000 * 60), 10);
        if (iMinutes > 0) {
            if (iMinutes === 1) {
                return sap.ushell.resources.i18n.getText("time_minute", iMinutes);
            }
            return sap.ushell.resources.i18n.getText("time_minutes", iMinutes);
        }
        return sap.ushell.resources.i18n.getText("just_now");
    };

    utils.toExternalWithParameters = function (sSemanticObject, sAction, aParameters) {
        var oCrossAppNavService = sap.ushell.Container.getService("CrossApplicationNavigation"),
            oTargetObject = {},
            oParametersObject = {},
            index,
            sTempParamKey,
            sTempParamValue;

        // Building the parameters object to the navigation action
        oTargetObject.target = {
            semanticObject: sSemanticObject,
            action: sAction
        };

        // Preparing the navigation parameters according to the notification's data
        if (aParameters && aParameters.length > 0) {
            oParametersObject = {};
            for (index = 0; index < aParameters.length; index++) {
                sTempParamKey = aParameters[index].Key;
                sTempParamValue = aParameters[index].Value;
                oParametersObject[sTempParamKey] = sTempParamValue;
            }
            oTargetObject.params = oParametersObject;
        }

        // Navigate
        oCrossAppNavService.toExternal(oTargetObject);
    };

    /**
     * Moves an element (specified by the index) inside of an array to a new index
     *
     * @param {array} aArray
     *  The array which contains all relevant elements
     * @param {number} nSourceIndex
     *  The index of the element which needs to be moved
     * @param {number} nTargetIndex
     *  The index where to element should be moved to
     * @returns {array}
     *  The array after the move of the element.
     * @throws
     *  throws exception "Incorrect input parameters passed",
     *      if no array or an empty array is provided
     *  throws exception "Index out of bounds"
     *      if nTargetIndex or nSourceIndex are out of bounds of the array
     *
     * @since 1.39.0
     * @public
     */
    utils.moveElementInsideOfArray = function (aArray, nSourceIndex, nTargetIndex) {
        if (!utils.isArray(aArray) || nSourceIndex === undefined || nTargetIndex === undefined) {
            throw "Incorrect input parameters passed";
        }
        if (nSourceIndex >= aArray.length  || nTargetIndex >= aArray.length ||
        nTargetIndex < 0 || nSourceIndex < 0 )  {
            throw "Index out of bounds";
        }

        var oElement = aArray.splice(nSourceIndex, 1)[0];
        aArray.splice(nTargetIndex, 0, oElement);
        return aArray;
    };

    /**
     * Changes an input target object by assigning each property of one
     * or more objects to it.
     *
     * @param {object} oTarget
     *    the base object
     * @param {...object} oSource
     *    one or more source objects to extend the target with
     * @returns {object}
     *    the extended target object
     * @private
     */
    utils.shallowMergeObject = function (oTarget /*, ...rest */) {
        return Array.prototype.slice.call(arguments, 1, arguments.length)
            .map(function (oSource) {
                return {
                    sourceObject: oSource,
                    properties: Object.keys(oSource)
                };
            })
            .reduce(function (oResult, oSource) {
                oSource.properties.forEach(function (sProperty) {
                    oResult[sProperty] = oSource.sourceObject[sProperty];
                });
                return oResult;
            }, oTarget);
    };

    return utils;

}, /* bExport= */ true);
