/* global jQuery, sap */
// iteration 0 ok

// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define([
    'sap/m/MessageToast',
    'sap/ushell/renderers/fiori2/search/SearchShellHelper'
], function(MessageToast, SearchShellHelper) {
    "use strict";

    return sap.ui.controller("sap.ushell.renderers.fiori2.search.container.App", {
        onInit: function() {
            this.oShellNavigation = sap.ushell.Container.getService("ShellNavigation");
            this.oShellNavigation.hashChanger.attachEvent("hashChanged", this.hashChanged);

            if (SearchShellHelper.oSearchFieldGroup === undefined) {
                SearchShellHelper.init();
            }
            SearchShellHelper.setSearchState('EXP_S');

            // do not hide search bar, when search app runs
            if (sap.ui.Device.system.tablet || sap.ui.Device.system.phone) {
                sap.ushell.services.AppConfiguration.setHeaderHiding(false);
            }

        },

        hashChanged: function(oEvent) {
            var model = sap.ushell.renderers.fiori2.search.getModelSingleton();
            model.deserializeURL();
        },

        onExit: function() {

            this.oShellNavigation.hashChanger.detachEvent("hashChanged", this.hashChanged);

            // dstroy TablePersoDialog when exit search app.
            // avoid to create same-id-TablePersoDialog triggered by oTablePersoController.active() in search.view.js
            if (sap.ui.getCore().byId('searchContainerResultsView') &&
                sap.ui.getCore().byId('searchContainerResultsView').oTablePersoController &&
                sap.ui.getCore().byId('searchContainerResultsView').oTablePersoController.getTablePersoDialog()) {
                sap.ui.getCore().byId('searchContainerResultsView').oTablePersoController.getTablePersoDialog().destroy();
            }

            if (SearchShellHelper.getDefaultOpen() !== true) {
                SearchShellHelper.setSearchState('COL');
            } else {
                SearchShellHelper.setSearchState('EXP');
            }

            // allow to hide search bar, when search app exits
            if (sap.ui.Device.system.tablet || sap.ui.Device.system.phone) {
                sap.ushell.services.AppConfiguration.setHeaderHiding(true);
            }
            if (this.oView.oPage.oFacetDialog) {
                this.oView.oPage.oFacetDialog.destroy();
            }
        }
    });
});
