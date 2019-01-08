// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The Unified Shell's UserDefaultParameters service provides
 *               read and write access to the User Default Parameter values.
 *               This is *not* an application facing service, but for Shell
 *               Internal usage.
 *               This service should be accessed by the application
 *               via the CrossApplicationNavigation service.
 *
 * @version 1.52.4
 */
sap.ui.define([
    'sap/ui/base/EventProvider'
], function (EventProvider) {
    "use strict";
    /*global jQuery, sap, setTimeout, clearTimeout, window */

    var sEventNameValueStored = "valueStored";
    var sRelevantStoreDeltaMembers = [ "value", "noEdit", "noStore", "extendedValue", "alwaysAskPlugin"];
    /**
     * The Unified Shell's UserDefaultParameters service
     * This method MUST be called by the Unified Shell's container only, others
     * MUST call <code>sap.ushell.Container.getService("UserDefaultParameters")</code>.
     * Constructs a new instance of the UserDefaultParameters service.
     *
     * @param {object} oAdapter
     *   The service adapter for the UserDefaultParameters service,
     *   as already provided by the container
     * @param {object} oContainerInterface interface
     * @param {string} sParameter Service instantiation
     * @param {object} oConfig service configuration (not in use)
     *
     *
     * @private
     * @constructor
     * @class
     * @see sap.ushell.services.Container#getService
     *
     * @since 1.32.0
     */
    function UserDefaultParameters (oAdapter, oContainerInterface, sParameter, oConfig) {
        this._aPlugins = []; // list of registered plugins, in order
        this._oUserDefaultParametersNames = undefined;
        var that = this, oStoreValueEventProvider = new EventProvider();
        /**
         * Obtain an integer representing the priority of the plugin
         *
         * @param {object} oPlugin a plug-in
         *
         * @returns {number} an integer value (default 0) representing the priority of the plug-in
         *
         */
        function getPrio(oPlugin) {
            var val = (typeof oPlugin.getComponentData === "function" &&  oPlugin.getComponentData() && oPlugin.getComponentData().config && oPlugin.getComponentData().config["sap-priority"]) || 0;
            if (typeof val !== "number" || isNaN(val)) {
                return 0;
            }
            return val;
        }

        /**
        * Plugins with higher priority are moved to *lower* places in the queue
        *
        * @param {array} aPlugins list of present plugins, modified!
        * @param {object} oPlugin the plugin to insert
        *
        * @returns {array}
        *  amended list of plugins
        *
        * @private
        *
        * @since 1.32.0
        */
        this._insertPluginOrdered = function (aPlugins, oPlugin) {
            var prioPlugin = getPrio(oPlugin),
                i,
                prioNth;
            for (i = 0; (i < aPlugins.length) && oPlugin; ++i) {
                prioNth = getPrio(aPlugins[i]);
                if (oPlugin && (prioPlugin > prioNth)) {
                    aPlugins.splice(i,0, oPlugin); // insert at index i;
                    oPlugin = undefined;
                }
            }
            if (oPlugin) {
                aPlugins.push(oPlugin);
            }
            return aPlugins;
        };

        // PLUGIN Registratiion  IFFacingPlugin
        /**
         * @param {object} oPlugin the Plugin to register with the service
         * @public
         * @alias sap.ushell.services.UserDefaultParameters#registerPlugin
         */
        this.registerPlugin = function (oPlugin) {
            this._aPlugins = this._insertPluginOrdered(this._aPlugins, oPlugin);
        };

        /**
         * Iterates the plugins and searches for a parameter that is
         * handled by the plugin to deliver a value
         *
         * @param {number} iIndex Index of the plugin
         * @param {array} aPlugins Array of the plugins which have been registered with the service
         * @param {string} sParameterName Name of the parameter (search criteria)
         * @param {object} aValue Value which will be returned if it is handled by any plugin
         * @param {object} oDeferred Promise including aValue
         *
         *
         * @private
         * @see sap.ushell.services.Container#getService
         *
         * @since 1.32.0
         */
        function iterateOverPluginsToGetDefaultValue(iIndex, aPlugins, sParameterName, aValue, oDeferred) {
            if (iIndex >= aPlugins.length) {
                oDeferred.resolve(aValue);
                return;
            }
            // every method is optional!
            if (typeof aPlugins[iIndex].getUserDefault !== "function") {
                iterateOverPluginsToGetDefaultValue(iIndex + 1, aPlugins, sParameterName, aValue, oDeferred);
                return;
            }
            aPlugins[iIndex].getUserDefault(sParameterName, aValue).done(function(aNewValue) {
                if (aNewValue) {
                    iterateOverPluginsToGetDefaultValue(iIndex + 1, aPlugins, sParameterName, aNewValue, oDeferred);
                } else {
                    iterateOverPluginsToGetDefaultValue(iIndex + 1, aPlugins, sParameterName, aValue, oDeferred);
                }
            }).fail(function() {
                jQuery.sap.log.error("invocation of getUserDefault(\"" + sParameterName + "\") for plugin " + that._getComponentNameOfPlugin(aPlugins[iIndex]) + " rejected.", null,
                "sap.ushell.services.UserDefaultParameters");
                iterateOverPluginsToGetDefaultValue(iIndex + 1, aPlugins, sParameterName, aValue, oDeferred);
            });
            return;
        }

        function clone(aObject) {
            return jQuery.extend(true,{},aObject);
        }

        this._getStoreDate = function() {
            return new Date().toString();
        };

//        /**
//         * Determines whether sParameterName is used as an extended parameter
//         * @param {string} sParameterName parameter name
//         * @returns {boolean} true if sParameterName is a parameter which is not used as an Extended Parameter
//         */
//        this._isNotExtendedAnymore = function(sParameterName) {
//            sap.ushell.Container.getService("ClientSideTargetResolution").getUserDefaultParameterNames(true).done(function(oParametersAndExtendedParameters) {
//                var oExtractedArrays = that._extractKeyArrays(oParametersAndExtendedParameters);
//                var aExtendedParameterNames = oExtractedArrays.extended;
//                return aExtendedParameterNames.indexOf(sParameterName) >= 0;
//            });
//        };

        /**
         * Stores the value & persists it.
         * Note, if oValueObject is undefined, the value is deleted!
         *
         * @param {string} sParameterName Name of the parameter for the value which has to be saved
         * @param {object} oValueObject Value which has to be saved
         * @param {boolean} bFromEditor  true if invoked from editor, in this case an undefined value is interpreted as a "delete value operation"
         * @returns {object}
         *      A jQuery promise
         *
         * @private
         * @constructor
         * @class
         * @see sap.ushell.services.Container#getService
         *
         * @since 1.32.0
         */
        this._storeValue = function(sParameterName, oValueObject, bFromEditor) {
            var resultPromise = new jQuery.Deferred();
            var oDeferred = new jQuery.Deferred();
            if (bFromEditor && oValueObject.extendedValue) {
                sap.ushell.Container.getService("ClientSideTargetResolution").getUserDefaultParameterNames(true).done(function(oParametersAndExtendedParameters) {
                    var oExtractedArrays = that._extractKeyArrays(oParametersAndExtendedParameters);
                    var aExtendedParameterNames = oExtractedArrays.extended;
                    oDeferred.resolve(aExtendedParameterNames.indexOf(sParameterName) < 0); // !not present!
                })
                .fail(function() { oDeferred.resolve(false); }); // should not happen
            } else {
                oDeferred.resolve(false);
            }
            oDeferred.done(function(bRemoveExtendedValue) {
                if (bRemoveExtendedValue) {
                    oValueObject.extendedValue = undefined;
                }
                if (bFromEditor && that._isInitial(oValueObject)) {
                    oValueObject = undefined; // indicates removal
                } else {
                    oValueObject._shellData = jQuery.extend(true,{ storeDate : that._getStoreDate() }, oValueObject._shellData);
                }
                sap.ushell.Container.getService("UserDefaultParameterPersistence").saveParameterValue(sParameterName, oValueObject).always(function() {
                    var oStoreValue = {
                        parameterName : sParameterName,
                        parameterValue: clone(oValueObject)
                    };
                    oStoreValueEventProvider.fireEvent(sEventNameValueStored, oStoreValue);
                    resultPromise.resolve(sParameterName);
                });
            });
            return resultPromise.promise();
        };

        /**
         * Obtain a present value from the internal store, may return an
         * *empty* <code>{value : undefined}</code> object if not present.
         *
         * @param {string} sParameterName Name of the parameter for the value which has to be received
         * @returns {object}
         *      A jQuery promise
         *
         * @private
         * @see sap.ushell.services.Container#getService
         *
         * @since 1.32.0
         */
        this._getCurrentValue = function(sParameterName) {
            var oDeferred = new jQuery.Deferred();
            sap.ushell.Container.getService("UserDefaultParameterPersistence").loadParameterValue(sParameterName).done(function (aValue) {
                oDeferred.resolve(aValue);
            }).fail(function() {
                oDeferred.resolve({ value : undefined });
            });
            return oDeferred.promise();
        };

        /**
         * Determine whether the value represents a value which has never been set
         * @param {object} oValue value object
         * @returns {boolean} boolean indicating whether oValue represents a Never set Value
         */
        this._isNeverSetValue = function(oValue) {
            return !oValue || (!oValue._shellData && !oValue.value && !oValue.extendedValue);
        };

        /**
         * Determine whether the value is completely empty
         * @param {object} oValue value object
         * @returns {boolean} boolean indicating whether oValue represents a Never set Value
         */
        this._isInitial = function(oValue) {
            return !(oValue && (oValue.value || oValue.extendedValue));
        };

        this._isStoreDistinct = function(oValueObject1, oValueObject2) {
            return !sRelevantStoreDeltaMembers.every(function(sMember) {
                return (oValueObject1[sMember] === oValueObject2[sMember]
                    || jQuery.sap.equal(oValueObject1[sMember],oValueObject2[sMember]));
            });
        };

        /**
         * Obtains a list of user default parameter names which are available for the respective end user.
         *
         * @returns {object}
         *      A jQuery promise, whose done handler receives a rich parameter
         *      object containing the following structure:
         *
         *      <code>
         *      {
         *          aAllParameterNames: [],
         *          aExtendedParameterNames: [],
         *          oMetadataObject: {}
         *      }
         *      </code>.
         *
         *      The promise will typically always be resolved.
         *      In case there are no user default parameter names found, an empty object will be received.
         *
         *      Note: oMetadataObject is the object representation of aAllParameterNames, which is an array.
         */
        this._getUserDefaultParameterNames = function() {
            if (!this._oUserDefaultParametersNames) {
                this._oUserDefaultParametersNames = new jQuery.Deferred();
                sap.ushell.Container.getService("ClientSideTargetResolution").getUserDefaultParameterNames(true).done(function(oParametersAndExtendedParameters) {
                    var oExtractedArrays = that._extractKeyArrays(oParametersAndExtendedParameters);
                    var aExtendedParameterNames = oExtractedArrays.extended;
                    var aAllParameterNames = oExtractedArrays.allParameters;
                    var oMetadataObject = that._arrayToObject(aAllParameterNames);
                    if (oMetadataObject.length === 0) {
                        // if array is empty, nothing to display in editor
                        that._oUserDefaultParametersNames.resolve({});
                    } else {
                        that._oUserDefaultParametersNames.resolve({ aAllParameterNames : aAllParameterNames, aExtendedParameterNames : aExtendedParameterNames, oMetadataObject: oMetadataObject });
                    }
                });
            }
            return this._oUserDefaultParametersNames.promise();
        };

        this._isRelevantParameter = function(sParamName) {
            var oDeferred = new jQuery.Deferred();
            this._getUserDefaultParameterNames().done(function(oResult) {
                if (oResult.aAllParameterNames && oResult.aAllParameterNames.indexOf(sParamName) !== -1) {
                    oDeferred.resolve();
                } else {
                    oDeferred.reject();
                }
            });
            return oDeferred.promise();
        };

        /**
         * Attempt to determine whether there are user default parameters
         * maintainable for the end user or not.
         *
         * @returns {object}
         *      A jQuery promise, whose done handler receives as first argument a boolean
         *      which has the value <code>true</code> if user default parameters are
         *      maintainable, and <code>false</code> if not.
         *      The promise will typically always be resolved.
         *      Note: In case an error occurs, the first argument of the done handler is <code>undefined</code>.
         */
        this.hasRelevantMaintainableParameters = function () {
            var that = this,
                oResultDeferred = new jQuery.Deferred(),
                bHasRelevantParameters = false,
                aGetValuePromises = [];

            that._getUserDefaultParameterNames().done(function(oParameterNames) {
                if (!jQuery.isEmptyObject(oParameterNames) && oParameterNames.aAllParameterNames) {
                    oParameterNames.aAllParameterNames.forEach(function (sParameterName) {
                        var oGetValuePromise = that.getValue(sParameterName);
                        aGetValuePromises.push(oGetValuePromise);
                        oGetValuePromise.done(function (oValue) {
                            if (oValue && !oValue.hasOwnProperty("noEdit")) {
                                bHasRelevantParameters = true;
                                return;
                            }
                        });
                    });
                    jQuery.when.apply(undefined, aGetValuePromises).done(function() {
                        oResultDeferred.resolve(bHasRelevantParameters);
                    }).fail(function () {
                        oResultDeferred.resolve();
                    });
                } else {
                    oResultDeferred.resolve();
                }
            });
            return oResultDeferred.promise();
        };

        /**
         * Attempt to determine a value for the parameter name
         * <code>sParameterName</code>.
         *
         * @param {string} sParameterName
         *      Name of a parameter to be returned
         * @returns {object}
         *      A jQuery promise, whose done handler receives as first argument a rich parameter
         *      object containing a value, e.g. <code>{ value : "value" }</code>.
         *      The promise will typically always be resolved.
         *      Note: It will always return an object, the value property may be
         *      <code>undefined</code> if no value could be retrieved.
         */
        this.getValue = function (sParameterName) {
            // strategy is as follows
            // a) get value from persistence,
            // b) if required ask all plugins in order whether they want to alter value
            // c) return value
            // c2) if value was altered, including set to undefined,
            //    [not on critical path] update value in remote persistences
            //    (potentially deleting value if set to undefined!)
            var that = this,
                oDeferred = new jQuery.Deferred(),
                oDeferred2 = new jQuery.Deferred();
            this._isRelevantParameter(sParameterName).fail(function() {
                // no relevant parameter -> no value
                oDeferred.resolve({});
            }).done(function() {
                that._getCurrentValue(sParameterName).done(function(aValue) {
                    var aOriginalValue;
                    if (!aValue) {
                        aValue = { };
                    }
                    aOriginalValue = clone(aValue);
                    if ( (aValue._shellData || !that._isInitial(aValue)) && !aValue.noStore && !aValue.alwaysAskPlugin) {
                        oDeferred2.resolve(aValue);
                    } else {
                        sap.ushell.Container.getService("PluginManager").loadPlugins("UserDefaults").done(function () {
                            iterateOverPluginsToGetDefaultValue(0, that._aPlugins, sParameterName, aValue, oDeferred2);
                        }).fail(function() {
                            jQuery.sap.log.error("Cannot get value for " + sParameterName + ". One or more plugins could not be loaded.");
                            oDeferred2.reject("Initialization of plugins failed");
                        });
                    }
                    oDeferred2.done(function (aNewValue) {
                        if (that._isNeverSetValue(aOriginalValue) || that._isStoreDistinct(aOriginalValue,aNewValue)) {
                            that._storeValue(sParameterName, aNewValue);
                        }
                        oDeferred.resolve(aNewValue);
                    }).fail(oDeferred.reject.bind(oDeferred));
                });
            });
            return oDeferred.promise();
        };


        this._addParameterValuesToParameters = function(oParameters, aParameterNames) {
            var oDeferred = new jQuery.Deferred();
            var aPromises = [];
            var that = this;
            aParameterNames.forEach(function(sParameterName) {
                var oNthPromise = that.getValue(sParameterName);
                aPromises.push(oNthPromise);
                oNthPromise.done(function (oValueObject) {
                    // what about if noEdit -> remove!
                    oParameters[sParameterName].valueObject = oValueObject;
                });
            });
            jQuery.when.apply(jQuery, aPromises).done(oDeferred.resolve.bind(oDeferred,oParameters)).fail(oDeferred.reject.bind(oDeferred,oParameters));
            return oDeferred.promise();
        };

        this._arrayToObject = function(aParameterNames) {
            var oRes =  {};
            aParameterNames.forEach(function(sParameterName) {
                oRes[sParameterName] = {   };
            });
            return oRes;
        };

        this._getComponentNameOfPlugin = function(oPlugin) {
            if (typeof oPlugin !== "object" || typeof oPlugin.getMetadata !== "function"
                || !oPlugin.getMetadata() || typeof oPlugin.getMetadata().getComponentName !== "function") {
                return "'name of plugin could not be determined'";
            }
            return oPlugin.getMetadata().getComponentName() || "";
        };

        /**
         * given
         * @param {object} oDeferred a jQuery Deferred, which is to be resolved if the execution
         *  succeeded
         * @param {array} aAllParameterNames all assigned parameter names as array of strings
         * @param {array} aExtendedParameterNames the parameter names as array of strings
         * @param {object} oMetadataObject a raw metadata object, not yet amended by plugin data
         * @private
         */
        this._getEditorDataAndValue = function (oDeferred, aAllParameterNames, aExtendedParameterNames, oMetadataObject) {
            var that = this;
            var aPromises = [];
            var aResultsOfMetadataPluginCalls = [];
            that._aPlugins.forEach(function(oPlugin, iIndex) {
                if (typeof oPlugin.getEditorMetadata === "function") {
                    var nThPromise = new jQuery.Deferred();
                    aPromises.push(nThPromise);
                    try {
                        var iPromisesLength = aPromises.length - 1;
                        oPlugin.getEditorMetadata(oMetadataObject).done(function(oResultMetadata) {
                            aResultsOfMetadataPluginCalls[iPromisesLength] = oResultMetadata;
                        }).always(function() {
                            nThPromise.resolve();
                        }).fail(function() {
                            jQuery.sap.log.error("EditorMetadata for plugin " + that._getComponentNameOfPlugin(oPlugin) + "cannot be invoked.", null,
                            "sap.ushell.services.UserDefaultParameters");
                            nThPromise.resolve();
                        });
                    } catch (ex) {
                        jQuery.sap.log.error("Error invoking getEditorMetaData on plugin: " + ex + ex.stack, null,
                        "sap.ushell.services.UserDefaultParameters");
                        nThPromise.resolve();
                    }
                }
            });

            jQuery.when.apply(jQuery, aPromises).done(function() {
                // all metadata present
                var aParameterNamesWithoutMetadata = [];
                var oParametersWithMetadata = aResultsOfMetadataPluginCalls.reverse().reduce(function(oPreviousValue, oNthResult) {
                    aAllParameterNames.forEach(function(sParameterName) {
                        if (oNthResult[sParameterName] && oNthResult[sParameterName].editorMetadata) {
                            oPreviousValue[sParameterName].editorMetadata = oNthResult[sParameterName].editorMetadata;
                        }
                    });
                    return oPreviousValue;
                }, oMetadataObject);
                aAllParameterNames.forEach(function(sParameterName) {
                    if (!(oParametersWithMetadata[sParameterName] && oParametersWithMetadata[sParameterName].editorMetadata)) {
                        aParameterNamesWithoutMetadata.push(sParameterName);
                    }
                });

                // blend in parameters
                that._addParameterValuesToParameters(oParametersWithMetadata, aAllParameterNames).done(function(oParameters) {
                    // create a deep copy
                    var oParametersDeepCopy = jQuery.extend(true, {}, oParameters),
                        aKeys;
                    // mark extended parameters!
                    aExtendedParameterNames.forEach(function(sParameterName) {
                        if (oParametersDeepCopy[sParameterName]) {
                            oParametersDeepCopy[sParameterName].editorMetadata = oParametersDeepCopy[sParameterName].editorMetadata || {};
                            oParametersDeepCopy[sParameterName].editorMetadata.extendedUsage = true;
                        }
                    });
                    // remove all noEdit parameters
                    aKeys = Object.keys(oParametersDeepCopy).splice(0);
                    aKeys.forEach(function(sParameterName) {
                        var idx;
                        if (oParametersDeepCopy[sParameterName].valueObject &&
                            oParametersDeepCopy[sParameterName].valueObject.noEdit === true) {
                            delete oParametersDeepCopy[sParameterName];
                            // also from the error log list (noEdit parameters w.o. editorMetadata are no cause of concern)
                            idx = aParameterNamesWithoutMetadata.indexOf(sParameterName);
                            if (idx >= 0) {
                                aParameterNamesWithoutMetadata.splice(idx,1);
                            }
                        }
                    });
                    if (aParameterNamesWithoutMetadata.length > 0) {
                        jQuery.sap.log.error("The following parameter names have no editor metadata and thus likely no configured plugin:\n\"" + aParameterNamesWithoutMetadata.join("\",\n\"") + "\".");
                    }
                    oDeferred.resolve(oParametersDeepCopy);
                }).fail(oDeferred.reject.bind(oDeferred));
            });
        };

        /**
         * Obtain the set or parameters, including values and metadata
         * for the UserDefaultParameterEditor
         *
         * This set is defined by all parameter values relevant for a given user
         * as determined by all values contained in Target mappings currently assigned to
         * the user
         *
         * @returns {jQuery.Deferred} promise
         * The first argument of the resolved promise is an object with parameter names as members
         *
         * The order of parameters is suitable order for parameter display.
         *
            <pre>{
                CostCenter: {
                    valueObject: {
                        "value": "1000",
                        "noEdit": false, // filtered out
                        "noStore": true // not relevant for editor
                    },
                    "editorMetadata":{
                        "displayText": "Company code",
                        "description": "This is the company code",
                        "groupId": "EXAMPLE-FIN-GRP1",
                        "groupTitle": "FIN User Defaults (UShell examples)",
                        "parameterIndex": 2,
                        "editorInfo": {
                           "odataURL": "/sap/opu/odata/sap/ZFIN_USER_DEFAULTPARAMETER_SRV",
                           "entityName": "Defaultparameter",
                           "propertyName": "CompanyCode",
                           "bindingPath": "/Defaultparameters('FIN')"
                        }
                    }
                },
                Plant: {
                    valueObject: {
                        "value": "4711",
                        "extendedValue": {
                            "Ranges": [
                                {
                                    "Sign": "I",
                                    "Option": "EQ",
                                    "Low": "4800",
                                    "High": null
                                }, {
                                    "Sign": "I",
                                    "Option": "BT",
                                    "Low": "6000",
                                    "High": "8500"
                              }
                           ]
                        },
                        "noEdit": false, // filtered out
                        "noStore": true // not relevant for editor
                    },
                    "editorMetadata":{
                        "displayText": "Company code",
                        "description": "This is the company code",
                        "groupId": "EXAMPLE-FIN-GRP1",
                        "groupTitle": "FIN User Defaults (UShell examples)",
                        "parameterIndex": 2,
                        "extendedUsage" : true,
                        "editorInfo": {
                           "odataURL": "/sap/opu/odata/sap/ZFIN_USER_DEFAULTPARAMETER_SRV",
                           "entityName": "Defaultparameter",
                           "propertyName": "CompanyCode",
                           "bindingPath": "/Defaultparameters('FIN')"
                        }
                    }
                }
            }</pre>
         * the list will not contain values which have noEdit set
         *
         * Note: whether maintenance of extended User Default values is to be enabled is
         * indicated by the boolean <code>extendedUsage</code> property(!), not
         * by the presence of an extendedValue.
         * When editing a simple user default ( extendedUsage : undefined ) the extendedValue
         * property is to be ignored
         *
         * The promise will typically always be resolved.
         * The first argument of the resolved response is
         * a list value object:
         * <code>{ value : sValueOrUndefined }</code>
         * Note: It will always return an object, the value property may be
         * undefined if no value could be retrieved.
         */
        this.editorGetParameters = function() {
            var oDeferred = new jQuery.Deferred();
            var that = this;
            this._getUserDefaultParameterNames().done(function(oParametersAndExtendedParameters) {
               if (oParametersAndExtendedParameters.oMetadataObject.length === 0) {
                   // if array is empty, nothing to display in editor
                   oDeferred.resolve({});
               } else {
                   sap.ushell.Container.getService("PluginManager").loadPlugins("UserDefaults").done(function () {
                       that._getEditorDataAndValue(oDeferred, oParametersAndExtendedParameters.aAllParameterNames, oParametersAndExtendedParameters.aExtendedParameterNames, oParametersAndExtendedParameters.oMetadataObject);
                   }).fail(function() {
                       jQuery.sap.log.error("One or more plugins could not be loaded");
                       oDeferred.reject("Initialization of plugins failed");
                   });
               }
            });
            return oDeferred.promise();
        };

        this._extractKeyArrays = function(oParametersAndExtendedParameters) {
            var oResult = {
                    extended : [],
                    simple : [],
                    allParameters : []
            };
            oResult.simple = (oParametersAndExtendedParameters
                      && oParametersAndExtendedParameters.simple
                      && Object.keys(oParametersAndExtendedParameters.simple).sort()) || [];
            oResult.extended = (oParametersAndExtendedParameters
                    && oParametersAndExtendedParameters.extended
                    && Object.keys(oParametersAndExtendedParameters.extended).sort()) || [];
            oResult.allParameters = oResult.simple.concat(oResult.extended.filter(function(sString) { return oResult.simple.indexOf(sString) < 0;})).sort();
            return oResult;
        };


        /**
         * Stores the value & persists it.
         * Note, if oValueObject is undefined, the value is deleted!
         *
         * @param {string} sParameterName Name of the parameter for the value which has to be saved
         * @param {object} oValueObject Value which has to be saved
         * @returns {object}
         *      A jQuery promise
         *
         * @private
         * @see sap.ushell.services.Container#getService
         *
         * @since 1.32.0
         */
        this.editorSetValue = function(sParameterName, oValueObject) {
            // an undefined oValueObject means deleting the parameter for the persistence, this is
            // handled by the UserDefaultParameterPersistence service
            return this._storeValue(sParameterName, oValueObject, true);
        };

        /**
         * Attaches a listener to the valueStored event.
         *
         * @param  {function} fnFunction
         *     Event handler to be attached.
         *
         * @methodOf sap.ushell.services.UserDefaultParameters#
         * @name attachValueStored
         * @since 1.34.0
         * @public
         * @alias sap.ushell.services.UserDefaultParameters#attachValueStored
         */
        this.attachValueStored = function (fnFunction) {
            oStoreValueEventProvider.attachEvent(sEventNameValueStored, fnFunction);
        };

        /**
         * Detaches a listener from the valueStored event.
         *
         * @param  {function} fnFunction
         *     Event handler to be detached.
         *
         * @methodOf sap.ushell.services.UserDefaultParameters#
         * @name detachValueStored
         * @since 1.34.0
         * @public
         * @alias sap.ushell.services.UserDefaultParameters#detachValueStored
         */
        this.detachValueStored = function (fnFunction) {
            oStoreValueEventProvider.detachEvent(sEventNameValueStored, fnFunction);
        };
    };

    UserDefaultParameters.hasNoAdapter = true;
    return UserDefaultParameters;
}, true /* bExport */);
