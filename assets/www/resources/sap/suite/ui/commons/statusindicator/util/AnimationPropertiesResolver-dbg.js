sap.ui.define([
	"jquery.sap.global",
	"sap/suite/ui/commons/statusindicator/Shape",
	"sap/suite/ui/commons/statusindicator/ShapeGroup",
	"sap/suite/ui/commons/statusindicator/CustomShape"
], function (jQuery, Shape, ShapeGroup, CustomShape) {
	"use strict";

	var AnimationPropertiesResolver = function (oStatusIndicator) {
		this._oStatusIndicator = oStatusIndicator;
	};

	/**
	 * Resolve the value for the given shape.
	 *
	 * @param {Shape} oShape
	 * @param iShapeValue
	 * @returns {int}
	 */
	AnimationPropertiesResolver.prototype.getValue = function (oShape, iShapeValue) {
		var oParent = oShape.getParent();
		if (!oParent instanceof ShapeGroup) {
			jQuery.sap.log.fatal("Shape should be always direct child of ShapeGroup.");
			return iShapeValue;
		}

		if (!this._oStatusIndicator._discreteThresholdsEnabled()) {
			return iShapeValue;
		}

		var iStatusIndicatorValue = this._getStatusIndicatorValue(oParent, iShapeValue);

		var oDiscreteThreshold = this._oStatusIndicator._getDiscreteThresholdForValue(iStatusIndicatorValue);
		var iCappedValue = oDiscreteThreshold ? oDiscreteThreshold.getValue() : 0;

		return this._getGroupValue(oParent, iCappedValue);
	};

	/**
	 * Returns the color that should be valid for the given shape and value
	 *
	 * @param oShape
	 * @param iShapeValue
	 */
	AnimationPropertiesResolver.prototype.getColor = function (oShape, iShapeValue) {
		var oParent = oShape.getParent();
		if (oParent instanceof CustomShape) {
			iShapeValue = oParent.getDisplayedValue();
			oParent = oParent.getParent();
		}

		var iStatusIndicatorValue = this._getStatusIndicatorValue(oParent, iShapeValue);

		var sNewFillColor = oShape._getCssFillColor();

		if (this._oStatusIndicator._propertyThresholdsEnabled()) {
			var oPropertyThreshold = this._oStatusIndicator._getPropertyThresholdForValue(iStatusIndicatorValue);
			if (oPropertyThreshold) {
				sNewFillColor = oPropertyThreshold.getFillColor();
			}
		}

		return sNewFillColor;
	};

	AnimationPropertiesResolver.prototype._getStatusIndicatorValue = function (oCurrentGroup, iShapeValue) {
		var that = this;
		var aGroups = this._oStatusIndicator.getGroups();

		var iAccValue = 0;
		aGroups.some(function (oGroup) {
			var fGroupRatio = oGroup.getWeight() / that._getTotalWeight();

			if (oGroup !== oCurrentGroup) {
				var iFullGroupValue = 100 * fGroupRatio;
				iAccValue += iFullGroupValue;
				return false;
			}

			var fGlobalValue = iShapeValue * fGroupRatio;
			iAccValue += fGlobalValue;
			return true;
		});
		return iAccValue;
	};

	AnimationPropertiesResolver.prototype._getGroupValue = function (oCurrentGroup, iStatusIndicatorValue) {
		var aGroups = this._oStatusIndicator.getGroups();
		var iTotalWeight = this._getTotalWeight();
		var iResult = 0;

		aGroups.some(function (oGroup) {
			var fGroupRatio = oGroup.getWeight() / iTotalWeight;
			var iNewGroupValue;

			if (iStatusIndicatorValue === 0) {
				iNewGroupValue = 0;
			} else if (iStatusIndicatorValue >= 100 * fGroupRatio) {
				iNewGroupValue = 100;
			} else {
				iNewGroupValue = iStatusIndicatorValue / fGroupRatio;
			}

			iStatusIndicatorValue -= iNewGroupValue * fGroupRatio;

			if (oCurrentGroup !== oGroup) {
				return false;
			}

			iResult = iNewGroupValue;
			return true;
		});

		return iResult;
	};

	AnimationPropertiesResolver.prototype._getTotalWeight = function () {
		return this._oStatusIndicator.getGroups().reduce(function (iAccumulator, oGroup) {
			return iAccumulator + oGroup.getWeight();
		}, 0);
	};

	return AnimationPropertiesResolver;
});