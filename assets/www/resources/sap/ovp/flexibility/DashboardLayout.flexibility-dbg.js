sap.ui.define([
    "sap/ui/fl/changeHandler/BaseRename",
    "sap/ovp/changeHandler/HideCardContainer",
    "sap/ovp/changeHandler/UnhideCardContainer",
    "sap/ovp/changeHandler/UnhideControl"
], function (BaseRename, HideCardContainer, UnhideCardContainer, UnhideControl) {
    "use strict";
    return {
        "moveControls": {
            "changeHandler": "default",
            "layers": {
                "CUSTOMER_BASE": false,
                "CUSTOMER": false,
                "USER": false
            }
        },
        "unhideControl": UnhideControl,
        "unhideCardContainer": UnhideCardContainer,
        "hideCardContainer": HideCardContainer,
        /**
         * Personalization change handlers
         */
        "manageCardsForDashboardLayout": {
        	changeHandler: {
        		applyChange : function(oChange, oPanel, mPropertyBag){
            		//store the incoming change to the main controller for user before rendering
            		var oMainController = mPropertyBag.appComponent.getRootControl().getController();
            		oMainController.storeIncomingDeltaChanges(oChange.getContent());
                    return true;
                },
                completeChangeContent : function(oChange, oSpecificChangeInfo, mPropertyBag) {
                	oChange.setContent(oSpecificChangeInfo.content);
                	return;
                }
        	},
        	layers: {
                "USER": true  // enables personalization which is by default disabled
            }
        },
        "viewSwitch": {
            changeHandler: {
                applyChange: function (oChange, oPanel, mPropertyBag) {
                    var oMainController = mPropertyBag.appComponent.getRootControl().getController();
                    oMainController.appendIncomingDeltaChange(oChange);
                    return true;
                },
                completeChangeContent: function (oChange, oSpecificChangeInfo, mPropertyBag) {
                    return;
                }
            },
            layers: {
                "USER": true  // enables personalization which is by default disabled
            }
        },
        "visibility": {
            changeHandler: {
                applyChange: function (oChange, oPanel, mPropertyBag) {
                    var oMainController = mPropertyBag.appComponent.getRootControl().getController();
                    oMainController.appendIncomingDeltaChange(oChange);
                    return true;
                },
                completeChangeContent: function (oChange, oSpecificChangeInfo, mPropertyBag) {
                    return;
                }
            },
            layers: {
                "USER": true  // enables personalization which is by default disabled
            }
        },
        "dragOrResize": {
            changeHandler: {
                applyChange: function (oChange, oPanel, mPropertyBag) {
                    var oMainController = mPropertyBag.appComponent.getRootControl().getController();
                    oMainController.appendIncomingDeltaChange(oChange);
                    return true;
                },
                completeChangeContent: function (oChange, oSpecificChangeInfo, mPropertyBag) {
                    return;
                }
            },
            layers: {
                "USER": true  // enables personalization which is by default disabled
            }
        }
    };
}, /* bExport= */true);