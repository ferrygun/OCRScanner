/* global jQuery, sap, window */

(function(global) {
    "use strict";

    sap.ui.define([
        'sap/ushell/renderers/fiori2/search/controls/SearchResultListSelectionHandler',
        'sap/ushell/renderers/fiori2/search/esh/api/release/sina'
    ], function(DefaultSearchResultListSelectionHandlerControl) {

        var DefaultSearchResultListSelectionHandlerModuleName = DefaultSearchResultListSelectionHandlerControl.getMetadata().getName();

        // =======================================================================
        // declare package
        // =======================================================================
        jQuery.sap.declare('sap.ushell.renderers.fiori2.search.SearchConfiguration');

        // =======================================================================
        // url parameter meta data
        // =======================================================================
        var urlParameterMetaData = {
            multiSelect: {
                type: 'bool'
            },
            sinaProvider: {
                type: 'string'
            },
            odataProvider: {
                type: 'bool'
            },
            searchBusinessObjects: {
                type: 'bool'
            },
            charts: {
                type: 'bool'
            },
            maps: {
                type: 'bool'
            },
            newpie: {
                type: 'bool'
            },
            personalizationStorage: {
                type: 'string'
            }
        };

        // =======================================================================
        // search configuration
        // =======================================================================
        var SearchConfiguration = sap.ushell.renderers.fiori2.search.SearchConfiguration = function() {
            this.init.apply(this, arguments);
        };

        SearchConfiguration.prototype = {

            init: function(params) {
                // read global config
                try {
                    var config = global['sap-ushell-config'].renderers.fiori2.componentData.config.esearch;
                    jQuery.extend(true, this, config);
                } catch (e) { /* nothing to do.. */ }
                // handle outdated parameters
                this.handleOutdatedConfigurationParameters();
                // for parameters without values set the defaults
                this.setDefaults();
                // overwrite parameters by url
                this.readUrlParameters();
                // set module load paths
                this.setModulePaths();
                // create default config for data sources
                this.createDefaultDataSourceConfig();
            },

            setModulePaths: function() {
                if (!this.modulePaths) {
                    return;
                }
                for (var i = 0; i < this.modulePaths.length; ++i) {
                    var modulePath = this.modulePaths[i];
                    jQuery.sap.registerModulePath(modulePath.moduleName, modulePath.urlPrefix);
                }
            },

            handleOutdatedConfigurationParameters: function() {
                try {

                    // get config
                    var config = global['sap-ushell-config'].renderers.fiori2.componentData.config;

                    // due to historical reasons the config parameter searchBusinessObjects is not in esearch but in parent object
                    // copy this parameter to config object
                    if (config.searchBusinessObjects !== undefined && this.searchBusinessObjects === undefined) {
                        if (config.searchBusinessObjects === 'hidden' || config.searchBusinessObjects === false) {
                            this.searchBusinessObjects = false;
                        } else {
                            this.searchBusinessObjects = true;
                        }
                    }

                    // copy shell configuration parameter enableSearch to config object
                    if (config.enableSearch !== undefined && this.enableSearch === undefined) {
                        this.enableSearch = config.enableSearch;
                    }

                } catch (e) { /* nothing to do.. */ }
            },

            setDefaults: function() {
                if (this.searchBusinessObjects === undefined) {
                    this.searchBusinessObjects = true;
                }
                if (this.odataProvider === undefined) {
                    this.odataProvider = false;
                }
                if (this.multiSelect === undefined) {
                    this.multiSelect = true;
                }
                if (this.charts === undefined) {
                    this.charts = true;
                }
                if (this.maps === undefined) {
                    this.maps = false;
                }
                if (this.newpie === undefined) {
                    this.newpie = false;
                }
                if (this.dataSources === undefined) {
                    this.dataSources = {};
                }
                if (this.enableSearch === undefined) {
                    this.enableSearch = true;
                }
                if (this.personalizationStorage === undefined) {
                    this.personalizationStorage = 'auto';
                }
                this.dataSourceConfigurations = this.semanticObjects || {}
                this.semanticObjects = undefined;

                // Special logic for Document Result List Item
                // this.dataSourceConfigurations['fileprocessorurl'] = this.dataSourceConfigurations['fileprocessorurl'] || {};
                // this.dataSourceConfigurations['fileprocessorurl'].searchResultListItem = this.dataSourceConfigurations['fileprocessorurl'].searchResultListItem || 'sap.ushell.renderers.fiori2.search.controls.SearchResultListItemDocument';
                this.documentDataSource = {
                    searchResultListItem: 'sap.ushell.renderers.fiori2.search.controls.SearchResultListItemDocument'
                };

                //Special logic for Note Result List Item
                this.dataSourceConfigurations['noteprocessorurl'] = this.dataSourceConfigurations['noteprocessorurl'] || {};
                this.dataSourceConfigurations['noteprocessorurl'].searchResultListItem = this.dataSourceConfigurations['noteprocessorurl'].searchResultListItem || 'sap.ushell.renderers.fiori2.search.controls.SearchResultListItemNote';
                this.dataSourceConfigurations['noteprocessorurl'].searchResultListSelectionHandler = this.dataSourceConfigurations['noteprocessorurl'].searchResultListSelectionHandler || 'sap.ushell.renderers.fiori2.search.controls.SearchResultListSelectionHandlerNote';
            },

            prepareDataSourceConfigurationForCertainObjectTypes: function(semanticObjectName, dataSourcesHints) {
                var dataSourceConfiguration = this.dataSourceConfigurations[semanticObjectName] || {};

                // Use SearchResultListItemDocument control for document-like objects.
                // Can be overriden by another control in ushell configuration.
                if (dataSourcesHints && dataSourcesHints.isDocumentConnector) {
                    if (!dataSourceConfiguration.searchResultListItem) {
                        dataSourceConfiguration.searchResultListItem = this.documentDataSource.searchResultListItem;
                    } else {
                        var message = "Will attempt to load '" + dataSourceConfiguration.searchResultListItem + "' instead of '" + this.documentDataSource.searchResultListItem + "' for semantic object '" + semanticObjectName + "'";
                        jQuery.sap.log.warning(message, 'sap.ushell.renderers.fiori2.search.SearchConfiguration');
                    }
                }

                this.dataSourceConfigurations[semanticObjectName] = dataSourceConfiguration;
                return dataSourceConfiguration;
            },

            createDefaultDataSourceConfig: function() {
                this.defaultDataSourceConfig = {
                    searchResultListItem: undefined,
                    searchResultListItemControl: undefined,

                    searchResultListItemContent: undefined,
                    searchResultListItemContentControl: undefined,

                    searchResultListSelectionHandler: DefaultSearchResultListSelectionHandlerModuleName,
                    searchResultListSelectionHandlerControl: DefaultSearchResultListSelectionHandlerControl
                };
            },

            readUrlParameters: function() {
                var parameters = this.parseUrlParameters();
                for (var parameter in parameters) {
                    if (parameter === 'demoMode') {
                        this.searchBusinessObjects = true;
                        this.enableSearch = true;
                        continue;
                    }

                    var parameterMetaData = urlParameterMetaData[parameter];
                    if (!parameterMetaData) {
                        continue;
                    }
                    var value = parameters[parameter];
                    switch (parameterMetaData.type) {
                        case 'bool':
                            value = (value === 'true' || value === '');
                            break;
                        default:
                    }
                    this[parameter] = value;
                }
            },

            parseUrlParameters: function() {
                var oURLParsing = sap.ushell.Container.getService("URLParsing");
                var params = oURLParsing.parseParameters(global.location.search);
                var newParams = {};
                // params is an object with name value pairs. value is always an array with values
                // (useful if url parameter has multiple values)
                // Here only the first value is relevant
                for (var key in params) {
                    var value = params[key];
                    if (value.length !== 1) {
                        continue;
                    }
                    value = value[0];
                    if (typeof value !== 'string') {
                        continue;
                    }
                    newParams[key] = value;
                }
                return newParams;
            },

            // use this as an early initialization routine
            loadCustomModulesAsync: function() {
                var that = this;
                if (that._loadCustomModulesProm) {
                    return that._loadCustomModulesProm;
                }

                var dataSourceConfigurationProm, dataSourceConfigurationsProms = [];

                for (var semanticObjectName in that.dataSourceConfigurations) {
                    dataSourceConfigurationProm = that.loadCustomModulesForSemanticObjectAsync(semanticObjectName);
                    dataSourceConfigurationsProms.push(dataSourceConfigurationProm);
                }

                that._loadCustomModulesProm = Promise.all(dataSourceConfigurationsProms);
                return that._loadCustomModulesProm;
            },


            loadCustomModulesForDataSourcesAsync: function(dataSources, dataSourcesHints) {
                var dataSourcesLoadingProms = [];
                for (var i = 0; i < dataSources.length; i++) {
                    var dataSourceHints = Array.isArray(dataSourcesHints) && dataSourcesHints.length > i && dataSourcesHints[i] || {};
                    var dataSourceLoadingProm = this.loadCustomModulesForDataSourceAsync(dataSources[i], dataSourceHints);
                    dataSourcesLoadingProms.push(dataSourceLoadingProm);
                }
                return Promise.all(dataSourcesLoadingProms);
            },


            loadCustomModulesForDataSourceAsync: function(dataSource, dataSourceHints) {
                dataSourceHints = dataSourceHints || {};
                var semanticObjectName = this._getSemanticObjectNameFromDataSource(dataSource);
                return this.loadCustomModulesForSemanticObjectAsync(semanticObjectName, dataSourceHints);
            },

            loadCustomModulesForSemanticObjectAsync: function(semanticObjectName, dataSourceHints) {

                if (!semanticObjectName) {
                    return Promise.resolve();
                }

                this._dataSourceLoadingProms = this._dataSourceLoadingProms || {};

                var dataSourceLoadingProm = this._dataSourceLoadingProms[semanticObjectName];
                if (!dataSourceLoadingProm) {
                    var customControlAttrNames = [{
                        moduleAttrName: "searchResultListItem",
                        controlAttrName: "searchResultListItemControl"
                    }, {
                        moduleAttrName: "searchResultListItemContent",
                        controlAttrName: "searchResultListItemContentControl"
                    }, {
                        moduleAttrName: "searchResultListSelectionHandler",
                        controlAttrName: "searchResultListSelectionHandlerControl"
                    }];

                    var dataSourceConfiguration = this.prepareDataSourceConfigurationForCertainObjectTypes(semanticObjectName, dataSourceHints);

                    var customControlProm, customControlProms = [];

                    for (var i = 0; i < customControlAttrNames.length; i++) {
                        customControlProm = this._doLoadCustomModulesAsync(semanticObjectName, dataSourceConfiguration, customControlAttrNames[i].moduleAttrName, customControlAttrNames[i].controlAttrName);
                        customControlProms.push(customControlProm);
                    }

                    dataSourceLoadingProm = Promise.all(customControlProms);
                    dataSourceLoadingProm._resolvedOrFailed = false;
                    dataSourceLoadingProm.then(function() {
                        dataSourceLoadingProm._resolvedOrFailed = true;
                    });
                    this._dataSourceLoadingProms[semanticObjectName] = dataSourceLoadingProm;
                }
                return dataSourceLoadingProm;
            },


            // Helper function to keep 'dataSourceConfiguration' instance unchanged within
            // its scope while the main function loops over all instances
            _doLoadCustomModulesAsync: function(semanticObjectName, dataSourceConfiguration, moduleAttrName, controlAttrName, defaultModuleName, defaultControl) {
                var that = this;
                return new Promise(function(resolve, reject) {
                    if (dataSourceConfiguration[moduleAttrName] &&
                        (!dataSourceConfiguration[controlAttrName] || dataSourceConfiguration[controlAttrName] == that.defaultDataSourceConfig[controlAttrName])) {
                        try {
                            sap.ui.require([
                                dataSourceConfiguration[moduleAttrName].replace(/[.]/g, '/')
                            ], function(customControl) {
                                dataSourceConfiguration[controlAttrName] = customControl;
                                resolve();
                            });
                        } catch (e) {
                            var message = "Could not load custom module '" + dataSourceConfiguration[moduleAttrName] + "' for data source with semantic object name '" + semanticObjectName + "'. ";
                            message += "Falling back to default data source configuration.";
                            jQuery.sap.log.warning(message, 'sap.ushell.renderers.fiori2.search.SearchConfiguration');
                            dataSourceConfiguration[moduleAttrName] = defaultModuleName || that.defaultDataSourceConfig[moduleAttrName];
                            dataSourceConfiguration[controlAttrName] = defaultControl || that.defaultDataSourceConfig[controlAttrName];
                            resolve();
                        }
                    } else {
                        if (!dataSourceConfiguration[controlAttrName]) {
                            dataSourceConfiguration[moduleAttrName] = defaultModuleName || that.defaultDataSourceConfig[moduleAttrName];
                            dataSourceConfiguration[controlAttrName] = defaultControl || that.defaultDataSourceConfig[controlAttrName];
                        }
                        resolve();
                    }
                });
            },


            getDataSourceConfig: function(dataSource) {

                var semanticObjectName = this._getSemanticObjectNameFromDataSource(dataSource);

                if (!semanticObjectName ||
                    (this._dataSourceLoadingProms &&
                        this._dataSourceLoadingProms[semanticObjectName] &&
                        !this._dataSourceLoadingProms[semanticObjectName]._resolvedOrFailed)) {
                    // If the data source doesn't have a semantic name, then there
                    // can't be a custom configuration of any kind for it.
                    // Also return the default data source if the custom modules
                    // for this particular data source aren't loaded yet.
                    return this.defaultDataSourceConfig;
                }

                var config = this.dataSourceConfigurations[semanticObjectName];
                if (!config) {
                    config = this.defaultDataSourceConfig;
                    this.dataSourceConfigurations[semanticObjectName] = config;
                }

                return config;
            },


            _getSemanticObjectNameFromDataSource: function(dataSource) {
                var semanticObjectName = dataSource.semanticObjectType;
                if (!semanticObjectName && dataSource.semanticObjectTypes && dataSource.semanticObjectTypes.length == 1) {
                    semanticObjectName = dataSource.semanticObjectTypes[0];
                }
                return semanticObjectName;
            },

            isLaunchpad: function() {
                try {
                    return !!sap.ushell.Container.getService("CrossApplicationNavigation");
                } catch (e) {
                    return false;
                }
            },

            getSina: function() {
                if (!this.isSinaRegistered) {
                    if (!this.odataProvider && this.isLaunchpad()) {
                        // inav2
                        sap.ushell.Container.addRemoteSystem(
                            new sap.ushell.System({
                                alias: "ENTERPRISE_SEARCH",
                                platform: "abap",
                                baseUrl: "/ENTERPRISE_SEARCH"
                            })
                        );
                        this.sina = global.sina.getSina();
                        //                    } else if (this.sinaProvider === "INAV2") {
                        //                        this.sina = global.sina.getSina();
                    } else {
                        this.sina = global.sina.getSina({
                            'impl_type': "odata2",
                            'servicePath': window.location.pathname.slice(0, window.location.pathname.indexOf('/sap/ushell/renderers/fiori2/search/container/')) + '/es/odata/callbuildin.xsjs'
                        });
                    }
                }
                this.isSinaRegistered = true;
                return this.sina;
            }
        };

        var searchConfiguration;

        SearchConfiguration.getInstance = function() {
            if (searchConfiguration) {
                return searchConfiguration
            }
            searchConfiguration = new SearchConfiguration();
            return searchConfiguration;
        }

        return SearchConfiguration;
    });
})(window);
