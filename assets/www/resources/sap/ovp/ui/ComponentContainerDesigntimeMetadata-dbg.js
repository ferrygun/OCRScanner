/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */

sap.ui.define([
	'jquery.sap.global',
	'sap/ui/fl/changeHandler/JsControlTreeModifier',
    "sap/ovp/cards/CommonUtils",
    "sap/ovp/cards/SettingsUtils",
    "sap/m/Dialog",
    "sap/m/Button"
], function(jQuery, JsControlTreeModifier, CommonUtils, SettingsUtils, Dialog, Button) {
	"use strict";

	return {
		name: {
            singular: sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("Card"),
            plural: sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("Cards")
        },
        actions: {
            remove: {
				changeType: "hideCardContainer",
				changeOnRelevantContainer: true
			},
			reveal: {
				changeType: "unhideCardContainer",
				changeOnRelevantContainer: true
			},
            settings: function() {
                return {
                    isEnabled: true,
                    changeOnRelevantContainer: true,
                    handler: function(oSelectedElement, fGetUnsavedChanges) {
                        return SettingsUtils.getDialogBox(oSelectedElement).then(function(mChangeContent) {
                            return [
                                    {
                                        // appDescriptorChange does not need a selector control
                                        // TODO: Remove this when there is an update change type available in semantic merger
                                        appComponent: oSelectedElement.getComponentInstance().getComponentData().appComponent,
                                        changeSpecificData: {
                                            appDescriptorChangeType: "appdescr_ovp_removeCard",
                                            content: mChangeContent.deleteCard
                                        }
                                    },
                                    {
                                        // appDescriptorChange does not need a selector control
                                        appComponent: oSelectedElement.getComponentInstance().getComponentData().appComponent,
                                        changeSpecificData: {
                                            appDescriptorChangeType: "appdescr_ovp_addNewCard",
                                            content: mChangeContent.appDescriptorChange
                                        }
                                    },
                                    {
                                        selectorControl: oSelectedElement.getComponentInstance().getComponentData().appComponent.getRootControl().getController().getLayout(),
                                        changeSpecificData : {
                                            runtimeOnly: true, //UI change would be used only at runtime to modify the app; it will not be persisted
                                            changeType : "cardSettings",
                                            content : mChangeContent.flexibilityChange//toUIChange(mChangeContent) // Allows for different parameters in runtime or descriptor change
                                        }
                                    }
                                ];
                        });
                    }
                };
            }
        }
    };
},
/* bExport= */true);
