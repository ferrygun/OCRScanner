/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2017 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([
        "sap/ovp/cards/AppSettingsUtils"
    ],
    function(AppSettingsUtils) {
        "use strict";

        return {
            actions: {
                settings: function() {
                    return {
                        isEnabled: true,
                        handler: function(oElement, fGetUnsavedChanges) {
                            AppSettingsUtils.getDialogBox(oElement).then(function(oDialogBox) {
                                oDialogBox.open();
                            });
                            return Promise.resolve([]);
                        }
                    };
                }
            },
            name: {
                singular: sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("Card"),
                plural: sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("Cards")
            }
        };
    }, false);
