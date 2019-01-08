/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
	"jquery.sap.global", "sap/ui/fl/changeHandler/Base", "sap/ui/fl/Utils", "sap/ui/fl/changeHandler/JsControlTreeModifier"
	], function (jQuery, Base, FlexUtils, JsControlTreeModifier) {
		"use strict";

		/**
		 * Change handler for moving of groups inside a smart form.
		 * @alias sap.ui.fl.changeHandler.MoveGroups
		 * @author SAP SE
		 * @version 1.52.4
		 * @experimental Since 1.27.0
		 */
		var MoveGroups = { };

		MoveGroups._checkCompleteChangeContentConditions = function(oSpecificChangeInfo) {
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

		MoveGroups._buildStableChangeInfo = function(mMoveActionParameter){
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
		 * Moves group(s) inside a smart form.
		 *
		 * @param {object} oChange change object with instructions to be applied on the control
		 * @param {object|Element} oSmartForm Smart form instance which is referred to in change selector section
		 * @param {object} mPropertyBag - map of properties
		 * @param {sap.ui.fl.changeHandler.BaseTreeModifier} mPropertyBag.modifier - modifier for the controls
		 * @param {sap.ui.core.UIComponent} mPropertyBag.appComponent - component in which the change should be applied
		 * @param {object} mPropertyBag.view - view object or xml element representing an ui5 view
		 * @function
		 * @returns {boolean} true - if change could be applied
		 * @name sap.ui.comp.smartform.flexibility.changes.MoveGroups#applyChange
		 */
		MoveGroups.applyChange = function(oChange, oSmartForm, mPropertyBag) {
			function checkConditions(oChange, oModifier) {
				if (!oChange) {
					throw new Error("No change instance");
				}

				var oChangeContent = oChange.getContent();

				if (!oModifier.getAggregation(oSmartForm, "groups")) {
					FlexUtils.log.error("Object has no smartform elements aggregation", oModifier.getId(oSmartForm));
				}
				if (!oChangeContent || !oChangeContent.moveGroups || oChangeContent.moveGroups.length === 0) {
					throw new Error("Change format invalid");
				}
			}

			function getGroupControlOrThrowError(oMoveGroup, oModifier, oAppComponent, oView) {
				if (!oMoveGroup.selector && !oMoveGroup.id) {
					throw new Error("Change format invalid - moveGroups element has no id attribute");
				}
				if (typeof (oMoveGroup.index) !== "number") {
					throw new Error("Change format invalid - moveGroups element index attribute is no number");
				}

				return oModifier.bySelector(oMoveGroup.selector || oMoveGroup.id, oAppComponent, oView);
			}

			var oModifier = mPropertyBag.modifier;
			var oView = mPropertyBag.view;
			var oAppComponent = mPropertyBag.appComponent;

			checkConditions(oChange, oModifier);

			var oChangeContent = oChange.getContent();

			oChangeContent.moveGroups.forEach(function (oMoveGroup) {
				var oGroup = getGroupControlOrThrowError(oMoveGroup, oModifier, oAppComponent, oView);

				if (!oGroup) {
					FlexUtils.log.warning("Group to move not found");
					return;
				}

				oModifier.removeAggregation(oSmartForm, "groups", oGroup, oView);
				oModifier.insertAggregation(oSmartForm, "groups", oGroup, oMoveGroup.index);
			});

			return true;
		};

		/**
		 * Completes the change by adding change handler specific content
		 *
		 * @param {object} oChange change object to be completed
		 * @param {object} oSpecificChangeInfo with attribute moveGroups which contains an array which holds objects which have attributes
		 * 				   id and index - id is the id of the group to move and index the new position of the group in the smart form
		 * @param {object} mPropertyBag - map of properties
		 * @param {sap.ui.core.UiComponent} mPropertyBag.appComponent component in which the change should be applied
		 * @public
		 * @function
		 * @name sap.ui.comp.smartform.flexibility.changes.MoveGroups#completeChangeContent
		 */
		MoveGroups.completeChangeContent = function(oChange, oSpecificChangeInfo, mPropertyBag) {
			this._checkCompleteChangeContentConditions(oSpecificChangeInfo);

			oSpecificChangeInfo = this._buildStableChangeInfo(oSpecificChangeInfo);

			var oChangeJson = oChange.getDefinition();

			if (!oChangeJson.content) {
				oChangeJson.content = {};
			}
			if (!oChangeJson.content.moveGroups) {
				oChangeJson.content.moveGroups = [];
			}

			var aMovedGroups = oSpecificChangeInfo.moveGroups.map(function (oGroup) {
				var oGroupControl = sap.ui.getCore().byId(oGroup.id);
				var oSelector = JsControlTreeModifier.getSelector(oGroupControl, mPropertyBag.appComponent);
				oChangeJson.content.moveGroups.push({
					selector: oSelector,
					index: oGroup.index
				});
				return oGroupControl;
			});
			oChange.addDependentControl(aMovedGroups, "movedGroups", mPropertyBag);
		};

		return MoveGroups;
	},
/* bExport= */true);
