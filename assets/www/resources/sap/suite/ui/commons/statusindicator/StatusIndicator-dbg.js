/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

/* globals Promise:true */

// Provides control sap.suite.ui.commons.StatusIndicator.
sap.ui.define([
		"jquery.sap.global",
		"../library",
		"sap/ui/core/Control",
		"sap/ui/core/Core",
		"sap/suite/ui/commons/statusindicator/util/AnimationPropertiesResolver"
	],
	function (jQuery, library, Control, Core, AnimationPropertiesResolver) {
		"use strict";

		/**
		 * Constructor for a new StatusIndicator.
		 *
		 * @param {string} [sId] id for the new control, generated automatically if no id is given
		 * @param {object} [mSettings] initial settings for the new control
		 *
		 * @class
		 * The status indicator control displays a value between 0 and 100.
		 *
		 * A status indicator may consist of multiple groups that gradually display the value. The shapes in the first
		 * group are filled first, the shapes in the second group second, and so on.
		 *
		 * The value of the status indicator is distributed between the groups depending on their weight.
		 *
		 * The filling of the shapes in the groups can be proportional to the value of the status indicator or can be
		 * based on thresholds specified in the <code>discreteThresholds</code> aggregation.

		 * @extends sap.ui.core.Control
		 *
		 * @author SAP SE
		 * @version 1.52.3
		 * @since 1.50
		 *
		 * @constructor
		 * @public
		 * @alias sap.suite.ui.commons.statusindicator.StatusIndicator
		 * @ui5-metamodel This control/element will also be described in the UI5 (legacy) design time metamodel.
		 */
		var StatusIndicator = Control.extend("sap.suite.ui.commons.statusindicator.StatusIndicator",
			/** @lends sap.suite.ui.commons.StatusIndicator.prototype */
			{
				metadata: {
					library: "sap.suite.ui.commons",
					properties: {

						/**
						 * Width of the status indicator.
						 */
						width: {type: "sap.ui.core.CSSSize", group: "Dimension", defaultValue: "100%"},

						/**
						 * Height of the status indicator.
						 */
						height: {type: "sap.ui.core.CSSSize", group: "Dimension", defaultValue: "100%"},

						/**
						 * Percentage value, between 0 and 100, that the status indicator reflects.
						 */
						value: {type: "int", defaultValue: 0},

						/**
						 * Defines the view box surrounding the shapes included in the status indicator.
						 */
						viewBox: {type: "string", defaultValue: null},

						/**
						 * ARIA label for this control to be used by screen reader software.
						 */
						ariaLabel: {type: "string", defaultValue: null}
					},
					defaultAggregation: "groups",
					aggregations: {

						/**
						 * Groups of shapes that display the status indicator's percentage value.
						 * A status indicator must always include at least one group.
						 */
						groups: {type: "sap.suite.ui.commons.statusindicator.ShapeGroup", multiple: true},

						/**
						 * Defines how shapes are filled based on the status indicator's percentage value.
						 */
						propertyThresholds: {
							type: "sap.suite.ui.commons.statusindicator.PropertyThreshold",
							multiple: true
						},

						/**
						 * Specifies discrete thresholds for the status indicator. If discrete thresholds are set,
						 * the status indicator adjusts its appearance to the closest threshold value that is not
						 * greater than the actual percentage value of the status indicator. For example, if the
						 * following discrete thresholds are specified:
						 * <ul>
						 *     <li><code>value = "20"</code></li>
						 *     <li><code>value = "60"</code></li>
						 *     <li><code>value = "100"</code></li>
						 * </ul>
						 * The status indicator displays the following percentage values:
						 * <ul>
						 *     <li><code>0</code> if the actual value is 15</li>
						 *     <li><code>20</code> if the actual value is 20</li>
						 *     <li><code>20</code> if the actual value is 55</li>
						 *     <li><code>60</code> if the actual value is 60</li>
						 *     <li><code>60</code> if the actual value is 79</li>
						 *     <li><code>100</code> if the actual value is 100</li>
						 * </ul>
						 * Please note that these thresholds affect only the appearance of the status inicator, not
						 * its stored value.
						 */
						discreteThresholds: {
							type: "sap.suite.ui.commons.statusindicator.DiscreteThreshold",
							multiple: true
						}
					},
					associations: {

						/**
						 * Controls or IDs that provide a description for this control. Can be used by screen reader software.
						 */
						ariaDescribedBy: {type: "sap.ui.core.Control", multiple: true, singularName: "ariaDescribedBy"},

						/**
						 * Controls or IDs that label this control. Can be used by screen reader software.
						 */
						ariaLabelledBy: {type: "sap.ui.core.Control", multiple: true, singularName: "ariaLabelledBy"}
					},
					events: {

						/**
						 * This event is fired when the user clicks or taps the status indicator.
						 */
						press: {}
					}
				}
			});

		StatusIndicator.prototype.init = function () {
			if (Control.prototype.init) { // check whether superclass implements the method
				Control.prototype.init.apply(this, arguments); // call the method with the original arguments
			}

			this._sortedPropertyThresholds = [];
			this._sortedDiscreteThresholds = [];
			this._bStarted = false;
			this._oCurrentAnimationPromise = null;
			this._oAnimationPropertiesResolver = new AnimationPropertiesResolver(this);
		};

		StatusIndicator.prototype._internalIds = Object.freeze({
			svgNodeId: "svg"
		});

		StatusIndicator.prototype.addPropertyThreshold = function (oThreshold) {
			this.addAggregation("propertyThresholds", oThreshold, true);
			if (this._sortedPropertyThresholds.filter(function (e) {
					return e.getToValue() === oThreshold.getToValue();
				}).length > 0) {
				jQuery.sap.log.fatal("There are two or more property thresholds with the same toValue in thresholds " +
					"aggregation. The last threshold from them has the highest priority");
			}
			this._sortedPropertyThresholds.push(oThreshold);
			this._sortedPropertyThresholds.sort(function (a, b) {
				return a.getToValue() - b.getToValue();
			});
		};

		StatusIndicator.prototype.addDiscreteThreshold = function (oThreshold) {
			this.addAggregation("discreteThresholds", oThreshold, true);
			if (this._sortedDiscreteThresholds.filter(function (e) {
					return e.getValue() === oThreshold.getValue();
				}).length > 0) {
				jQuery.sap.log.fatal("There are two or more discrete thresholds with the same value in thresholds " +
					"aggregation. The last threshold from them has the highest priority");
			}
			this._sortedDiscreteThresholds.push(oThreshold);
			this._sortedDiscreteThresholds.sort(function (a, b) {
				return a.getValue() - b.getValue();
			});
		};

		StatusIndicator.prototype._discreteThresholdsEnabled = function () {
			return this._sortedDiscreteThresholds.length > 0;
		};

		StatusIndicator.prototype._getDiscreteThresholdForValue = function (iValue) {
			var oResult = null;

			this._sortedDiscreteThresholds.every(function (oThreshold) {
				if (iValue >= oThreshold.getValue()) {
					oResult = oThreshold;
					return true;
				}
			});

			return oResult;
		};

		StatusIndicator.prototype._propertyThresholdsEnabled = function () {
			return this._sortedPropertyThresholds.length > 0;
		};

		StatusIndicator.prototype._getPropertyThresholdForValue = function (iValue) {
			var oResult = null;

			this._sortedPropertyThresholds.some(function (oThreshold) {
				if (iValue <= oThreshold.getToValue()) {
					oResult = oThreshold;
					return true;
				}
			});

			return oResult;
		};

		StatusIndicator.prototype._getFullId = function (sInternalId) {
			return this.getId() + "-" + sInternalId;
		};

		StatusIndicator.prototype.onBeforeRendering = function () {
			var that = this;

			this.getGroups().forEach(function (oGroup) {
				oGroup._injectAnimationPropertiesResolver(that._oAnimationPropertiesResolver);
			});
		};

		StatusIndicator.prototype.onAfterRendering = function () {
			this._start();
		};

		StatusIndicator.prototype._start = function () {
			this._bStarted = true;
			this._propagateValueToGroups();
		};

		StatusIndicator.prototype._shouldInvertGroupUpdateOrder = function (aGroupsWithValues) {
			var iTargetGroupIndex;

			aGroupsWithValues.some(function (oGroupWithValue, iIndex) {
				iTargetGroupIndex = iIndex;

				return oGroupWithValue.newValue !== 100;
			});

			var iGroupDisplayingBoundaryIndex;

			this.getGroups().some(function (oGroup, iIndex) {
				iGroupDisplayingBoundaryIndex = iIndex;

				return !oGroup._showsFullProgress();
			});

			return (iTargetGroupIndex < iGroupDisplayingBoundaryIndex);
		};

		StatusIndicator.prototype._propagateValueToGroups = function () {
			var aGroupsWithValues = this._computeGroupValueDistribution();
			var bInvertUpdateOrder = this._shouldInvertGroupUpdateOrder(aGroupsWithValues);

			if (bInvertUpdateOrder) {
				aGroupsWithValues = aGroupsWithValues.reverse();
			}

			this._updateAccessibilityDOM();
			this._oCurrentAnimationPromise = aGroupsWithValues.reduce(function (oAccumulatorPromise, oGroupWithValue) {
				return oAccumulatorPromise.then(function (oResult) {
					if (oResult && oResult.cancelled) {
						jQuery.sap.log.debug("Group animation cancelled.");
						return oResult;
					} else {
						return oGroupWithValue.group._setValue(oGroupWithValue.newValue);
					}
				});
			}, Promise.resolve());

			return this._oCurrentAnimationPromise;
		};

		StatusIndicator.prototype._computeGroupValueDistribution = function () {
			var iValueToBeDistributed = this.getValue();
			var iTotalWeight = this._getTotalWeight();

			return this.getGroups().map(function (oGroup) {
				var fGroupRatio = oGroup.getWeight() / iTotalWeight;
				var iNewGroupValue;

				if (iValueToBeDistributed === 0) {
					iNewGroupValue = 0;
				} else if (iValueToBeDistributed >= 100 * fGroupRatio) {
					iNewGroupValue = 100;
				} else {
					iNewGroupValue = Math.round(iValueToBeDistributed / fGroupRatio);
				}

				iValueToBeDistributed -= Math.round(iNewGroupValue * fGroupRatio);

				return {
					group: oGroup,
					newValue: iNewGroupValue
				};
			});
		};

		/**
		 * @param {int} iValue Value that should be displayed
		 *
		 * @public
		 * @returns {Object} self
		 * Sets the status indicator percentage value.
		 */
		StatusIndicator.prototype.setValue = function (iValue) {
			iValue = Math.round(iValue);

			if (iValue > 100) {
				iValue = 100;
			}
			if (iValue < 0) {
				iValue = 0;
			}

			this.setProperty("value", iValue, true);

			if (this._bStarted) {
				this._propagateValueToGroups();
			}

			return this;
		};

		StatusIndicator.prototype._getTotalWeight = function () {
			return this.getGroups().reduce(function (iAccumulator, oGroup) {
				return iAccumulator + oGroup.getWeight();
			}, 0);
		};

		StatusIndicator.prototype.ontap = StatusIndicator.prototype.firePress;

		StatusIndicator.prototype.onsapenter = StatusIndicator.prototype.firePress;

		StatusIndicator.prototype.onsapspace = StatusIndicator.prototype.firePress;

		StatusIndicator.prototype._getGroupElements = function () {
			// Value distribution can be computed and initial group values can be set only after all groups are added
			// and the control is being prepared for the rendering.
			var aGroupsWithValues = this._computeGroupValueDistribution();

			aGroupsWithValues.forEach(function (oGroupWithValue) {
				oGroupWithValue.group._setInitialValue(oGroupWithValue.newValue);
			});

			return this.getGroups().reduce(function (aAccumulator, oGroup) {
				return aAccumulator.concat(oGroup._getHtmlElements());
			}, []);
		};

		StatusIndicator.prototype._updateAccessibilityDOM = function () {
			var iValue = this.getValue();
			this.$().attr("aria-valuenow", iValue);
			this.$().attr("aria-valuetext", this._createValueTextMessage(iValue));
		};

		StatusIndicator.prototype._createValueTextMessage = function (iValue) {
			var sDiscreteAriaLabel = null;
			var bAboveDiscrete = null;
			var sPropertyAriaLabel = null;

			var oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.suite.ui.commons");

			if (this._discreteThresholdsEnabled()) {
				var oDiscreteThreshold = this._getDiscreteThresholdForValue(iValue);

				if (oDiscreteThreshold) {
					sDiscreteAriaLabel = oDiscreteThreshold.getAriaLabel();
					bAboveDiscrete = true;
				} else {
					sDiscreteAriaLabel = this._sortedDiscreteThresholds[0].getAriaLabel();
					bAboveDiscrete = false;
				}
			}

			if (this._propertyThresholdsEnabled()) {
				var oPropertyThreshold = this._getPropertyThresholdForValue(iValue);

				if (oPropertyThreshold) {
					sPropertyAriaLabel = oPropertyThreshold.getAriaLabel();
				}
			}

			var sValueText;

			if (sDiscreteAriaLabel) {
				if (sPropertyAriaLabel) {
					if (bAboveDiscrete) {
						sValueText = oResourceBundle.getText("STATUS_INDICATOR_VALUE_ABOVE_THRESHOLD_COLOR", [iValue, sDiscreteAriaLabel, sPropertyAriaLabel]);
					} else {
						sValueText = oResourceBundle.getText("STATUS_INDICATOR_VALUE_BELOW_THRESHOLD_COLOR", [iValue, sDiscreteAriaLabel, sPropertyAriaLabel]);
					}
				} else {
					if (bAboveDiscrete) {
						sValueText = oResourceBundle.getText("STATUS_INDICATOR_VALUE_ABOVE_THRESHOLD", [iValue, sDiscreteAriaLabel]);
					} else {
						sValueText = oResourceBundle.getText("STATUS_INDICATOR_VALUE_BELOW_THRESHOLD", [iValue, sDiscreteAriaLabel]);
					}
				}
			} else if (sPropertyAriaLabel) {
				sValueText = oResourceBundle.getText("STATUS_INDICATOR_VALUE_COLOR", [iValue, sPropertyAriaLabel]);
			} else {
				sValueText = oResourceBundle.getText("STATUS_INDICATOR_VALUE", [iValue]);
			}
			return sValueText;
		};

		return StatusIndicator;

	}, /* bExport= */ true);
