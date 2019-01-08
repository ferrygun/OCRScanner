sap.ui.define([
   "sap/ui/model/resource/ResourceModel"
], function (ResourceModel) {
    'use strict';

    var resourceBundleContext = {};
    resourceBundleContext.lib = (function () {
        var i18nModel = new ResourceModel({
            bundleName: "sap/rules/ui/parser/i18n.messages_descriptions"
        });
        var i18n_opMessages_Model = new ResourceModel({
            bundleName: "sap/rules/ui/parser/i18n.op_messages_descriptions"
        });
        return {
            getString: function (messageKey, paramsArray, fileEnum) {
                var oBundle;
                var fileEnumEndWith = fileEnum.split(".");
                fileEnumEndWith = fileEnum.split(".")[fileEnumEndWith.length - 1];
                if (fileEnum && fileEnumEndWith === "op_messages_descriptions") {
                    oBundle = i18n_opMessages_Model.getResourceBundle();
                } else {
                    oBundle = i18nModel.getResourceBundle();
                }
                var sMsg = oBundle.getText(messageKey);
                //Replacing {#} with params here as a workaround to support single qoutes such as '{0}'
                var i;
                if (paramsArray){
	                for (i = 0; i < paramsArray.length; i++) { 
						if (sMsg.indexOf("{" + i + "}") > -1){
							sMsg = sMsg.replace("{" + i + "}", paramsArray[i]);
						}
					}
                }
                jQuery.sap.log.debug("code: " + messageKey + ", params: " + paramsArray + "\nMessage: " + sMsg);
                return sMsg;
            }
        };
    } ());
    return resourceBundleContext;
}, true /* export to global namespace */);