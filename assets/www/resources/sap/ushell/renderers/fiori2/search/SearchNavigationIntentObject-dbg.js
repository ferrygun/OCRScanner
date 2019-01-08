/* global jQuery, sap, window, document, console */

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/SearchNavigationObject'
], function(SearchNavigationObject) {
    "use strict";

    var _oCrossAppNav = sap.ushell && sap.ushell.Container && (sap.ushell.Container.getService("SmartNavigation") || sap.ushell.Container.getService("CrossApplicationNavigation"));

    return SearchNavigationObject.extend("sap.ushell.renderers.fiori2.search.SearchNavigationIntentObject", {

        constructor: function(params) {
            SearchNavigationObject.prototype.constructor.apply(this, arguments);
            this._externalTarget = params.externalTarget;
        },

        performNavigation: function(properties) {
            if (_oCrossAppNav) {
                this.trackNavigation(properties);
                _oCrossAppNav.toExternal(this._externalTarget);
            } else {
                sap.ushell.renderers.fiori2.search.SearchNavigationObject.prototype.performNavigation.apply(this, arguments);
            }
        },

        trackNavigation: function(properties) {
            SearchNavigationObject.prototype.trackNavigation.apply(this, arguments);
            if (_oCrossAppNav && _oCrossAppNav.trackNavigation) {
                /*_oCrossAppNav.trackNavigation({
                    target: {
                        shellHash: "SemanticObject-action?a=b"
                    }
                });

                _oCrossAppNav.trackNavigation({
                    target: {
                        semanticObject: "SemanticObject",
                        action: "action",
                        params: {
                            "a": "“B"
                        } // will not be tracked so could be omitted
                    }
                });*/

                _oCrossAppNav.trackNavigation({
                    target: this._externalTarget.target
                });
            }
        }
    });
});
