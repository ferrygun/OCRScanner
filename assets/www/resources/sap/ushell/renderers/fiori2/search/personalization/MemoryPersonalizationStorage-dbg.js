/* global sap, jQuery*/

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/personalization/Personalizer'
], function(Personalizer) {
    "use strict";

    // =======================================================================
    // declare package
    // =======================================================================
    jQuery.sap.declare('sap.ushell.renderers.fiori2.search.personalization.MemoryPersonalizationStorage');

    // =======================================================================
    // memory personalization storage
    // =======================================================================
    var module = sap.ushell.renderers.fiori2.search.personalization.MemoryPersonalizationStorage = function() {
        this.init.apply(this, arguments);
    };
    var MemoryPersonalizationStorage = module;

    module.prototype = {

        init: function() {
            this.dataMap = {};
        },

        getItem: function(key) {
            if (!this._isStorageSupported()) {
                throw 'not supported storage';
            }
            return this._getStorage(key);
        },

        setItem: function(key, data) {
            if (!this._isStorageSupported()) {
                throw 'not supported storage';
            }
            this._putStorage(key, data);
        },

        getPersonalizer: function(key) {
            return new Personalizer(key, this);
        },

        _isStorageSupported: function() {
            return true;
        },

        _getStorage: function(key) {
            return this.dataMap[key];
        },

        _putStorage: function(key, storage) {
            this.dataMap[key] = storage;
        }

    };

    module.getInstance = function() {
        return new jQuery.Deferred().resolve(new MemoryPersonalizationStorage());
    };

    return module;
});
