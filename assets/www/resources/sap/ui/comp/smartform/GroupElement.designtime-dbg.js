/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides the Design Time Metadata for the sap.ui.comp.smartform.GroupElement control
sap.ui.define([
	"sap/ui/comp/smartform/SmartForm",
	"sap/m/FlexBox"
], function(SmartForm, FlexBox) {
	"use strict";

	var fnHasMandatoryFields = function(oGroupElement) {
		var aElements = oGroupElement.getElements();
		if (aElements.length === 0) {
			return false;
		}
		for (var j = 0; j < aElements.length; j++) {
			var oElement = aElements[j];
			if (oElement.getMandatory && oElement.getMandatory()) {
				return true;
			}
		}
		return false;
	};

	var fnGetControlsCount = function (oSelectedElement) {
		if (oSelectedElement.getElements && oSelectedElement.getElements()) {
			return oSelectedElement.getElements().length;
		}
		return 0;
	};

	var fnEnableCheck = function (aControls) {
		var iControlsCount = 0;
		aControls.forEach(function (oControl) {
			iControlsCount += fnGetControlsCount(oControl);
		});

		if (iControlsCount < 2 || iControlsCount > 3) {
			return false;
		}
		return true;
	};

	return {
		name: {
			singular : "FIELD_CONTROL_NAME",
			plural : "FIELD_CONTROL_NAME_PLURAL"
		},
		isVisible: function(oGroupElement) {
			return oGroupElement.isVisible();
		},
		aggregations: {
			label: {
				ignore: true
			},
			elements: {
				ignore: false,
				propagateMetadata : function(oElement){
					// Actions for controls in GroupElement should be disabled, except for Smartlink (inside a SmartField or not)
					if (oElement.getMetadata().getName() !== "sap.ui.comp.navpopover.SmartLink" &&
						!(oElement.getMetadata().getName() === "sap.ui.comp.smartfield.SmartField" &&
						oElement.getSemanticObjectController && oElement.getSemanticObjectController())){
						return {
							actions: null
						};
					}
				}
			},
			fields: {
				ignore: true
			}
		},
		actions: {
			remove: {
				changeType: "hideControl",
				getConfirmationText: function(oGroupElement) {
					// TODO: move text to comp
					var oTextResources = sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp");
					if (fnHasMandatoryFields(oGroupElement)) {
						var sGroupElement = oGroupElement.getLabelText() || oGroupElement.getId();
						return oTextResources.getText("GROUP_ELEMENT_DESIGN_TIME_REMOVE_MANDATORY_FIELD_MESSAGE", sGroupElement);
					}
				}
			},
			reveal : {
				changeType : "unhideControl"
			},
			rename: {
				changeType: "renameField",
				isEnabled: function(oControl) {
					if (oControl._getLabel()) {
						return true;
					}
					return false;
				},
				domRef: function(oControl) {
					return oControl._getLabel().getDomRef();
				}
			},
			combine: {
				changeType: "combineFields",
				changeOnRelevantContainer : true,
				isEnabled : function (aControls) {
					return fnEnableCheck(aControls);
				},
				getState : function(oControl, oChangeDefinition, mPropertyBag) {
					var oModifier = mPropertyBag.modifier;
					var oAppComponent = mPropertyBag.appComponent;
					var oGroupElement, oParent;
					var oState = {
						elementState : []
					};
					var aGroupElements = oChangeDefinition.content.combineFieldSelectors;
					aGroupElements.forEach(function(sGroupElementId) {
						oGroupElement = oModifier.bySelector(sGroupElementId, oAppComponent);
						oParent = oGroupElement.getParent();
						var aElements = oGroupElement.getElements();
						var aElementsLabels = [];
						for (var i = 0; i < aElements.length; i++) {
							var oElement = aElements[i];
							var sLabel = "";
							if (oElement.getTextLabel) {
								sLabel = oElement.getTextLabel();
							}
							aElementsLabels.push(sLabel);
						}
						oState.elementState.push({
							groupElement : oGroupElement,
							parent : oParent,
							groupElementIndex : oParent.getGroupElements().indexOf(oGroupElement),
							content : aElements,
							label: oGroupElement.getLabel(),
							elementsLabels: aElementsLabels
						});
					});
					return oState;
				},
				restoreState : function(oControl, oState) {
					oState.elementState.forEach(function(oElementState) {
						if (oElementState.parent.getGroupElements().indexOf(oElementState.groupElement) === -1) {
							// Removed groups are placed in the "dependents" aggregation, so here they must be cleaned up
							oElementState.groupElement.getParent().removeDependent(oElementState.groupElement);
							oElementState.parent.insertGroupElement(oElementState.groupElement, oElementState.groupElementIndex);
						} else {
							oElementState.groupElement.removeAllElements();
						}
					});
					oState.elementState.forEach(function(oElementState) {
						oElementState.content.forEach(function(oField, index) {
							oElementState.groupElement.insertElement(oField, index);
							if (oField.setTextLabel) {
								oField.setTextLabel(oElementState.elementsLabels[index]);
							}
						});
						oElementState.groupElement.setLabel(oElementState.label);
					});
				}
			},
			split: {
				changeType: "splitField",
				changeOnRelevantContainer : true,
				getControlsCount : function(oGroupElement) {
					return fnGetControlsCount(oGroupElement);
				}
			}
		},
		// TODO Clarify concept to reuse these functions/functionality in Group.designtime.js
		functions: {
			hasMandatoryFields: fnHasMandatoryFields
		},
		properties: {
			useHorizontalLayout: {
				ignore: true
			},
			horizontalLayoutGroupElementMinWidth: {
				ignore: true
			},
			elementForLabel: {
				ignore: true
			}
		}
	};

}, /* bExport= */true);
