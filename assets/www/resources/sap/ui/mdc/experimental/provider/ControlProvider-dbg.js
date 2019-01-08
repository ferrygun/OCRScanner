sap.ui.define([
	"sap/ui/base/ManagedObject", "sap/ui/base/BindingParser"
], function(ManagedObject, BindingParser) {
	"use strict";

	var ControlProvider = {
		mProvidedProperties: {

		},
		mProvidedFunctions: {

		}
	};

	/**
	 * Sets the provided property information from the metadata interpretation
	 *
	 * @param {element} oControl The managed object
	 * @param {string} sProperty The name of the control property
	 * @param {any} vValue The value of the property that is provided
	 * @public
	 */
	ControlProvider.provideAttribute = function(oNode, sAttribute, vValue) {
		if (vValue != null) {
			oNode.setAttribute(sAttribute, vValue);
		}
	};

	/**
	 * Sets the provided property information from the metadata interpretation
	 *
	 * @param {element} oControl The managed object
	 * @param {string} sProperty The name of the control property
	 * @param {any} vValue The value of the property that is provided
	 * @public
	 */
	ControlProvider.provideProperty = function(oControl, sProperty, vValue, sAdditionalInfo) {
		if (vValue != null) {
			var oBinding, oProperty = oControl.getMetadata().getProperty(sProperty);

			if (!oProperty) {
				return;
			}

			if (ControlProvider.isPropertyAllowedToBeProvided(oControl, sProperty, vValue)) {
				oControl._oProviderData.mProvidedProperties[sProperty] = { value: vValue, info: sAdditionalInfo};

				oBinding = ControlProvider.getAsBinding(vValue);
				if (oBinding) {
					oControl.bindProperty(sProperty, oBinding);
				} else {
					oProperty.set(oControl, vValue);

				}
			}
		}
	};

	/**
	 * Sets the provided aggegration information from the metadata interpretation
	 *
	 * @param {element} oControl The managed object
	 * @param {string} sAggregation The name of the control aggregation
	 * @param {any} vValue The value of the property that is provided
	 * @param {Control} oTemplate The template
	 * @param {boolean} Whether the aggregation is sharable
	 * @public
	 */
	ControlProvider.provideAggregation = function(oControl, sAggregation, vValue, oTemplate, bShareable) {
		if (vValue != null) {
			var oBinding, oAggregationInfo = oControl.getMetadata().getAggregation(sAggregation);

			if (!oAggregationInfo) {
				return;
			}

			if (ControlProvider.isPropertyAllowedToBeProvided(oControl, sAggregation, vValue)) {
				oControl._oProviderData.mProvidedProperties[sAggregation] = vValue;
				oBinding = ControlProvider.getAsBinding(vValue);
				oBinding.template = oTemplate;
				oBinding.templateShareable = bShareable;

				oControl.bindAggregation(sAggregation, oBinding);
			}
		}
	};

	/**
	 * Sets the function that we be runned to prepare the copies from this control as a template
	 *
	 * @param {element} oControl The managed object
	 * @param {string} sFuncName The name of the function that takes the control a input
	 * @param {function} The function that should be runned to prepare clones
	 * @public
	 */
	ControlProvider.providePrepareCloneFunction = function(oControl, sFuncName, fnFunction) {
		oControl._oProviderData.mProvidedFunctions[sFuncName] = fnFunction;
		fnFunction(oControl);
	};

	/**
	 * Run all the functions that are meant to be runned after cloning a control
	 *
	 * @param {element} oControl The managed object
	 * @private
	 */
	ControlProvider.prepareClone = function(oClone) {
		var aFunctions = oClone._oProviderData.mProvidedFunctions;

		for ( var i in aFunctions) {
			aFunctions[i](oClone);
		}
	};

	/**
	 * Checks if a certain property has already been provided
	 *
	 * @param {element} oControl The managed object
	 * @param {string} sProperty The name of the control property
	 * @param {any} vValue The value of the property that is provided
	 * @public
	 */
	ControlProvider.isPropertyAlreadyProvided = function(oControl, sProperty, vValue) {
		if (oControl._oProviderData.mProvidedProperties[sProperty] && oControl._oProviderData.mProvidedProperties[sProperty] === vValue) {
			return true;
		}

		return false;
	};

	/**
	 * Checks if a property can be provided
	 *
	 * @param {element} oControl The managed object
	 * @param {string} sProperty The name of the control property
	 * @param {any} vValue The value of the property that is provided
	 * @public
	 */
	ControlProvider.isPropertyAllowedToBeProvided = function(oControl, sProperty, vValue) {
		if (oControl.isPropertyInitial(sProperty)) {
			return true;
		}

		if (ControlProvider.isPropertyAlreadyProvided(oControl, sProperty, vValue) && oControl._oProviderData.mProvidedProperties[sProperty] !== vValue) {
			return true;
		}

		return false;
	};

	/**
	 * Checks if control a certain control can be provided from information of another control
	 *
	 * @param {element} oControl The control that will be provided from the provider control
	 * @param {element} oProviderControl The control that is used as template to provide the provided control
	 */
	ControlProvider.canControlBeProvided = function(oControl, oProviderControl) {
		// still not provided
		if (!oControl) {
			return false;
		}

		if (!oControl._oProviderData) {
			oControl._oProviderData = {
				mProvidedProperties: {},// init provided properties
				mProvidedFunctions: {},// init provided properties
				providedFrom: oProviderControl
			// flag the provider control
			};
			return true;
		} else if (oControl._oProviderData.providedFrom && oControl._oProviderData.providedFrom === oProviderControl) {
			return true;
		}

		return false;
	};

	/**
	 * Sets the provided property information from the metadata interpretation
	 *
	 * @param {any} vBinding The binding as string
	 * @public
	 */
	ControlProvider.getAsBinding = function(vBinding) {
		if (typeof vBinding == 'string') {
			return ManagedObject.bindingParser(vBinding);
		} else if (typeof vBinding == 'object') {
			return vBinding;
		}
		return undefined;
	};

	/**
	 * Get the binding as a string
	 */
	ControlProvider.getAsString = function(vBinding) {
		if (typeof vBinding == 'string') {
			return vBinding;
		} else if (typeof vBinding == 'object') {
			var sResult = JSON.stringify(vBinding);

			sResult = sResult.replace(new RegExp("\"path\"", "g"),"path");
			sResult = sResult.replace(new RegExp("\"parts\"", "g"),"parts");
			sResult = sResult.replace(new RegExp("\"parameters\"", "g"),"parameters");
			sResult = sResult.replace(new RegExp("\"expand\"", "g"),"expand");
			sResult = sResult.replace(new RegExp("\"", "g"),"'");

			return sResult;
		}
		return undefined;
	};

	ControlProvider.mergeBindings = function(aBindings, fnFormatter) {
		var sBinding = "{ parts: [" + aBindings.join(",") + "] }";
		var oBindingInfo = ControlProvider.getAsBinding(sBinding);

		oBindingInfo.formatter = [
			fnFormatter
		];

		return oBindingInfo;
	};

	/**
	 * Returns the provided data as mapping
	 *
	 * @param {element} oControl The control that was provided
	 * @return {object} oResult a mapping containing the provided aggregations and their values
	 */
	ControlProvider.getProvidedData = function(oControl) {
		var oResult = {};

		if (oControl) {
			oResult = oControl._oProviderData ? oControl._oProviderData.mProvidedProperties : {};
		}

		return oResult;

	};

	return ControlProvider;
});
