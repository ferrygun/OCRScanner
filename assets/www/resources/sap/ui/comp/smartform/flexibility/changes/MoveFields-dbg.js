/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
	"jquery.sap.global", "sap/ui/fl/changeHandler/Base", "sap/ui/fl/Utils", "sap/ui/fl/changeHandler/JsControlTreeModifier"
	], function (jQuery, Base, FlexUtils, JsControlTreeModifier) {
		"use strict";

		/**
		 * Change handler for moving of fields within/between groups.
		 * @alias sap.ui.comp.smartform.flexibility.changes.MoveFields
		 * @author SAP SE
		 * @version 1.52.4
		 * @experimental Since 1.27.0
		 */
		var MoveFields = { };

		MoveFields._checkCompleteChangeContentConditions = function(oSpecificChangeInfo) {
			if (!oSpecificChangeInfo.movedElements) {
				throw new Error("oSpecificChangeInfo.movedElements attribute required");
			}
			if (oSpecificChangeInfo.movedElements.length === 0) {
				throw new Error("MovedElements array is empty");
			}
			oSpecificChangeInfo.movedElements.forEach(function (oMoveField) {
				if (!oMoveField.id) {
					throw new Error("MovedElements element has no id attribute");
				}
				if (typeof (oMoveField.targetIndex) !== "number") {
					throw new Error("Index attribute at MovedElements element is no number");
				}
			});
		};

		MoveFields._buildStableChangeInfo = function(mMoveActionParameter){
			var sSourceParentId = mMoveActionParameter.source.id;
			var sTargetParentId = mMoveActionParameter.target.id;
			var mChangeData = {
				changeType : mMoveActionParameter.changeType,
				selector : {
					id : sSourceParentId
				},
				targetId : sTargetParentId !== sSourceParentId ? sTargetParentId : null
			};
			mChangeData[mMoveActionParameter.changeType] = [];

			mMoveActionParameter.movedElements.forEach(function(mMovedElement) {
				mChangeData[mMoveActionParameter.changeType].push({
					id : mMovedElement.id,
					index : mMovedElement.targetIndex
				});
			});

			return mChangeData;
		};

		/**
		 * Moves field(s) within a group or between groups.
		 *
		 * @param {object} oChange change object with instructions to be applied on the control
		 * @param {object} oGroup Smart form group instance which is referred to in change selector section
		 * @param {object} mPropertyBag - map of properties
		 * @param {object} mPropertyBag.view - view object or xml element representing an ui5 view
		 * @param {sap.ui.fl.changeHandler.BaseTreeModifier} mPropertyBag.modifier - modifier for the controls
		 * @param {sap.ui.core.UIComponent} mPropertyBag.appComponent - component in which the change should be applied
		 * @public
		 * @function
		 * @returns {boolean} true - if change could be applied
		 * @name sap.ui.comp.smartform.flexibility.changes.MoveFields#applyChange
		 */
		MoveFields.applyChange = function(oChange, oGroup, mPropertyBag) {
			function checkConditions(oChange, oModifier) {
				if (!oChange) {
					throw new Error("No change instance");
				}

				var oChangeContent = oChange.getContent();

				if (!oModifier.getAggregation(oGroup, "groupElements")) {
					FlexUtils.log.error("Object has no group elements aggregation", oModifier.getId(oGroup));
				}
				if (!oChangeContent || !oChangeContent.moveFields || oChangeContent.moveFields.length === 0) {
					throw new Error("Change format invalid");
				}
			}

			function getFieldControlOrThrowError(oMoveField, oModifier, oAppComponent, oView) {
				if (!oMoveField.selector && !oMoveField.id) {
					throw new Error("Change format invalid - moveFields element has no id attribute");
				}
				if (typeof (oMoveField.index) !== "number") {
					throw new Error("Change format invalid - moveFields element index attribute is no number");
				}

				return oModifier.bySelector(oMoveField.selector || oMoveField.id, oAppComponent, oView);
			}

			var oModifier = mPropertyBag.modifier;
			var oView = mPropertyBag.view;
			var oAppComponent = mPropertyBag.appComponent;

			checkConditions(oChange, oModifier);

			var oChangeContent = oChange.getContent();
			var oTargetGroup = oGroup;

			if (oChangeContent.targetSelector || oChangeContent.targetId) {
				oTargetGroup = oModifier.bySelector(oChangeContent.targetSelector || oChangeContent.targetId, oAppComponent, oView);
			}

			oChangeContent.moveFields.forEach(function (oMoveField) {
				var oField = getFieldControlOrThrowError(oMoveField, oModifier, oAppComponent, oView);

				if (!oField) {
					FlexUtils.log.warning("Field to move not found");
					return;
				}

				oModifier.removeAggregation(oGroup, "groupElements", oField, oView);
				oModifier.insertAggregation(oTargetGroup, "groupElements", oField, oMoveField.index);
			});

			return true;
		};

		/**
		 * Completes the change by adding change handler specific content
		 *
		 * @param {object} oChange change object to be completed
		 * @param {object} oSpecificChangeInfo with attribute moveFields which contains an array which holds objects which have attributes
		 * 				   id and index - id is the id of the field to move and index the new position of the field in the smart form group
		 * @param {object} mPropertyBag  - map of properties
		 * @param {sap.ui.core.UiComponent} mPropertyBag.appComponent component in which the change should be applied
		 * @public
		 * @function
		 * @name sap.ui.comp.smartform.flexibility.changes.MoveFields#completeChangeContent
		 */
		MoveFields.completeChangeContent = function(oChange, oSpecificChangeInfo, mPropertyBag) {
			this._checkCompleteChangeContentConditions(oSpecificChangeInfo);

			oSpecificChangeInfo = this._buildStableChangeInfo(oSpecificChangeInfo);

			var oChangeDefinition = oChange.getDefinition();
			var oAppComponent = mPropertyBag.appComponent;

			if (!oChangeDefinition.content) {
				oChangeDefinition.content = {};
			}
			if (!oChangeDefinition.content.moveFields) {
				oChangeDefinition.content.moveFields = [];
			}

			oSpecificChangeInfo.moveFields.forEach(function (oField) {
				var oFieldControl = JsControlTreeModifier.bySelector(oField.id, oAppComponent);
				var oSelector = JsControlTreeModifier.getSelector(oFieldControl, oAppComponent);

				oChangeDefinition.content.moveFields.push({
					selector: oSelector,
					index: oField.index
				});
			});

			if (oSpecificChangeInfo.targetId) {
				var oTargetControl = JsControlTreeModifier.bySelector(oSpecificChangeInfo.targetId, oAppComponent);
				oChangeDefinition.content.targetSelector = JsControlTreeModifier.getSelector(oTargetControl, oAppComponent);
			}
		};

		return MoveFields;
	},
/* bExport= */true);
