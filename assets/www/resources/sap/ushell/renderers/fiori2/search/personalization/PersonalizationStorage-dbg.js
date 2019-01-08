/* global sap, jQuery*/

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/personalization/FLPPersonalizationStorage',
    'sap/ushell/renderers/fiori2/search/personalization/BrowserPersonalizationStorage',
    'sap/ushell/renderers/fiori2/search/personalization/MemoryPersonalizationStorage',
    'sap/ushell/renderers/fiori2/search/SearchConfiguration'
], function(FLPPersonalizationStorage, BrowserPersonalizationStorage, MemoryPersonalizationStorage, SearchConfiguration) {
    "use strict";


    // =======================================================================
    // declare package
    // =======================================================================
    jQuery.sap.declare('sap.ushell.renderers.fiori2.search.personalization.PersonalizationStorage');

    var config = SearchConfiguration.getInstance();

    // =======================================================================
    // personalization storage
    // =======================================================================
    sap.ushell.renderers.fiori2.search.personalization.PersonalizationStorage = {

        instance: null,

        isLaunchpad: function() {
            try {
                return sap.ushell.Container.getService("Personalization") ? true : false;
            } catch (e) {
                return false;
            }
        },

        getInstance: function() {
            var that = this;
            if (this.instancePromise) {
                return this.instancePromise;
            }
            switch (config.personalizationStorage) {
                case 'auto':
                    if (this.isLaunchpad()) {
                        this.instancePromise = FLPPersonalizationStorage.getInstance();
                    } else {
                        this.instancePromise = BrowserPersonalizationStorage.getInstance();
                    }
                    break;
                case 'browser':
                    this.instancePromise = BrowserPersonalizationStorage.getInstance();
                    break;
                case 'flp':
                    this.instancePromise = FLPPersonalizationStorage.getInstance();
                    break;
                case 'memory':
                    this.instancePromise = MemoryPersonalizationStorage.getInstance();
                    break;
                default:
                    // nix
            }
            this.instancePromise.then(function(instance) {
                that.instance = instance;
            });
            return this.instancePromise;
        },

        getInstanceSync: function() {
            if (!this.instance) {
                throw 'No instance, call async method getInstance for getting the instance';
            }
            return this.instance;
        },

        isInitialized: function() {
            return !!this.instance;
        }
    };

    return sap.ushell.renderers.fiori2.search.personalization.PersonalizationStorage;
});
