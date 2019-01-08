/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define(['jquery.sap.global', 'sap/ui/core/CustomData', 'sap/ushell/library'],
    function (jQuery, CustomData, library) {
        "use strict";

        var CustomData = CustomData.extend("sap.ovp.ui.CustomData");
           // fnOrigcheckWriteToDom = CustomData.prototype._checkWriteToDom;


        CustomData.prototype._checkWriteToDom = function (oRelated) {
            var sKey = this.getKey().toLowerCase(),
                bIsAccessibilityOn = sap.ui.getCore().getConfiguration().getAccessibility();
            if (!bIsAccessibilityOn) {
                return;
            }
            if (!this.getWriteToDom()) {
                return null;
            }
            var value = this.getValue();

            if (typeof value != "string") {
                jQuery.sap.log.error("CustomData with key " + sKey + " should be written to HTML of " + oRelated + " but the value is not a string.");
                return null;
            }

            if (!(sap.ui.core.ID.isValid(sKey)) || (sKey.indexOf(":") != -1)) {
                jQuery.sap.log.error("CustomData with key " + sKey + " should be written to HTML of " + oRelated + " but the key is not valid (must be a valid sap.ui.core.ID without any colon).");
                return null;
            }

            if (sKey == jQuery.sap._FASTNAVIGATIONKEY) {
                value = /^\s*(x|true)\s*$/i.test(value) ? "true" : "false"; // normalize values
            } else if (sKey.indexOf("sap-ui") == 0) {
                jQuery.sap.log.error("CustomData with key " + sKey + " should be written to HTML of " + oRelated + " but the key is not valid (may not start with 'sap-ui').");
                return null;
            }
            return {key: sKey, value: value};
        };

        return CustomData;

    }, /* bExport= */ true);
