/* global sap, jQuery*/

sap.ui.define([], function() {
    "use strict";

    // =======================================================================
    // declare package
    // =======================================================================
    jQuery.sap.declare('sap.ushell.renderers.fiori2.search.personalization.Personalizer');

    // =======================================================================
    // personalizer
    // =======================================================================
    var Personalizer = sap.ushell.renderers.fiori2.search.personalization.Personalizer = function() {
        this.init.apply(this, arguments);
    };

    Personalizer.prototype = {

        init: function(key, personalizationStorageInstance) {
            this.key = key;
            this.personalizationStorageInstance = personalizationStorageInstance;
        },

        getKey: function() {
            return this.key;
        },

        setPersData: function(data) {
            return (new jQuery.Deferred()).resolve(this.personalizationStorageInstance.setItem(this.key, data));
        },

        getPersData: function() {
            return (new jQuery.Deferred()).resolve(this.personalizationStorageInstance.getItem(this.key));
        }
    };

    return Personalizer;
});
