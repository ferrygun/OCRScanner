/* global sap, jQuery*/

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/personalization/Personalizer'
], function(Personalizer) {
    "use strict";


    // =======================================================================
    // declare package
    // =======================================================================
    jQuery.sap.declare('sap.ushell.renderers.fiori2.search.personalization.BrowserPersonalizationStorage');

    // =======================================================================
    // browser personalization storage
    // =======================================================================
    var module = sap.ushell.renderers.fiori2.search.personalization.BrowserPersonalizationStorage = function() {
        this.init.apply(this, arguments);
    };
    var BrowserPersonalizationStorage = module;

    module.prototype = {

        init: function() {

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
            if (jQuery.sap.storage && jQuery.sap.storage.isSupported()) {
                return true;
            } else {
                return false;
            }
        },

        _getStorage: function(key) {
            return jQuery.sap.storage.get("Search.Personalization." + key);
        },

        _putStorage: function(key, storage) {
            jQuery.sap.storage.put("Search.Personalization." + key, storage);
        }

    };

    module.getInstance = function() {
        return new jQuery.Deferred().resolve(new BrowserPersonalizationStorage());
    };

    return module;
});
