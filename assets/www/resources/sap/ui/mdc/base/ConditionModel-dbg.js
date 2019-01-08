/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */
sap.ui.define([
		'jquery.sap.global', 'sap/ui/model/json/JSONModel', 'sap/ui/model/Filter', 'sap/ui/mdc/base/FilterOperatorConfig'
	],
	function(jQuery, JSONModel, Filter, FilterOperatorConfig) {
		"use strict";

		/**
		 *
		 * @class JSON based Model for sap.ui.mdc.base.FilterField controls. The model stores the entered values as condition objects and applies the conditions to the ListBinding of e.g. a table.
		 * @extends sap.ui.model.json.JSONModel
		 *
		 * @author SAP SE
		 * @version 1.52.4
		 * @since 1.48.0
		 * @alias sap.ui.mdc.base.ConditionModel
		 *
		 * @private
		 * @experimental
		 * @sap-restricted
		 */
		var ConditionModel = JSONModel.extend("sap.ui.mdc.base.ConditionModel", {
			constructor: function() {
				JSONModel.apply(this, arguments);
				this.setSizeLimit(1000);

				this._oMessageBundle = sap.ui.getCore().getLibraryResourceBundle("sap.ui.mdc");
				sap.ui.getCore().attachLocalizationChanged(function() {
					this._oMessageBundle = sap.ui.getCore().getLibraryResourceBundle("sap.ui.mdc");
				}.bind(this));

				if (!this.getProperty("/conditions")) { // might already be initialized in the constructor
					this.setProperty("/conditions", []);
				}
				if (!this.getProperty("/fieldPath")) {
					this.setProperty("/fieldPath", {});
				}
			}
		});

		ConditionModel._mModels = {};

		ConditionModel.prototype.destroy = function() {
			JSONModel.prototype.destroy.apply(this, arguments);

			delete this._mFieldPath;
			delete this._oMessageBundle;
		};

		ConditionModel.prototype.clone = function(sFieldPath) {
			var oCM = new ConditionModel();

			//TODO the cloned CM get the same _oListBinding, so that the getFilterOperatorConfig() returns the same instance
			oCM._oListBinding = this._oListBinding;
			oCM.addFilterField(this.getFilterField(sFieldPath));

			var aConditions = this.getConditions(sFieldPath);
			var aClonedConditions = [];
			aConditions.forEach(function(e, i) {
				aClonedConditions.push(jQuery.extend(true, {}, e));
			});
			oCM.setConditions(aClonedConditions);

			return oCM;
		};

		ConditionModel.prototype.merge = function(sFieldPath, oCM, sSourceFieldPath) {
			this.removeAllConditions(sFieldPath);
			var aCleanedConditions = sap.ui.mdc.base.ConditionModel.removeEmptyConditions(oCM.getConditions(sSourceFieldPath));
			this.setConditions(aCleanedConditions);
			this.checkUpdate(true, true);
		};

		ConditionModel.mapConditions = function(aConditions, sTargetFieldPath) {
			if (sTargetFieldPath) {
				for (var i = 0; i < aConditions.length; i++) {
					aConditions[i].fieldPath = sTargetFieldPath;
				}
			}

			return aConditions;
		};

		ConditionModel.cloneConditions = function(aConditions) {
			return jQuery.extend(true, [], aConditions);
		};

		ConditionModel.removeEmptyConditions = function(aConditions) {
			for (var i = aConditions.length - 1; i > -1; i--) {
				if (aConditions[i].isEmpty) {
					aConditions.splice(parseInt(i, 10), 1);
				}
			}
			return aConditions;
		};


		/**
		 * @param oListBinding
		 * @param [sName]
		 */
		ConditionModel.getFor = function(oListBinding, sName) { // TODO: support sName for multiple models
			var sKey = ConditionModel._createKey(oListBinding, sName);
			var oCM = ConditionModel._mModels[sKey]; // TODO

			if (!oCM) {
				oCM = new ConditionModel();
				oCM._oListBinding = oListBinding;
				ConditionModel._mModels[sKey] = oCM;
			} else if (oCM._oListBinding !== oListBinding) {
				// update the oListBinding reverence
				oCM._oListBinding = oListBinding;
			}

			return oCM;
		};

		ConditionModel._createKey = function(oListBinding, sName) {
			return oListBinding.getModel().getId() + "--" + oListBinding.getPath() + "#" + (sName === undefined ? "" : sName);
		};

		/**
		 * @param oListBinding
		 * @param [sName]
		 */
		ConditionModel.prototype.setFor = function(oListBinding, sName) {
			delete ConditionModel._mModels[ConditionModel._createKey(this._oListBinding, sName)];
			this._oListBinding = oListBinding;
			ConditionModel._mModels[ConditionModel._createKey(this._oListBinding, sName)] = this;
			return this;
		};

		/**
		 * @param oConditionModel
		 * @param [sName]
		 */
		ConditionModel.destroyCM = function(oConditionModel, sName) {
			delete ConditionModel._mModels[ConditionModel._createKey(oConditionModel._oListBinding, sName)];
			oConditionModel.destroy();
		};

		ConditionModel._getAll = function(oListBinding) {
			var aOverallModels = [];
			var sKey = ConditionModel._createKey(oListBinding);
			sKey = sKey.slice(0, sKey.length - 1);
			for (var model in ConditionModel._mModels) {
				if (model.indexOf(sKey) === 0) {
					var oCM = ConditionModel._mModels[model];
					aOverallModels.push(oCM);
				}
			}

			return aOverallModels;
		};

		ConditionModel._getAllKeys = function(oListBinding) {
			var aOverallModelKeys = [];
			var sKey = ConditionModel._createKey(oListBinding);
			sKey = sKey.slice(0, sKey.length - 1);
			for (var model in ConditionModel._mModels) {
				if (model.indexOf(sKey) === 0) {
					aOverallModelKeys.push(model);
				}
			}

			return aOverallModelKeys;
		};

		ConditionModel.prototype.getConditions = function(sFieldPath) {
			//TODO: only works for simple flat condition model content
			var aResult = [];
			var aConditions = this.getProperty("/conditions");
			aConditions.forEach(function(oCondition) {
				if (!sFieldPath || oCondition.fieldPath === sFieldPath) {
					aResult.push(oCondition);
				}
			});
			return aResult;
		};

		ConditionModel.prototype.indexOf = function(oCondition) {
			var index = -1;
			var aConditions = this.getProperty("/conditions");
			var sCondition = JSON.stringify(oCondition);
			var sFieldPath = oCondition.fieldPath;
			aConditions.some(function(oCondition, i) {
				if (oCondition.fieldPath === sFieldPath) {
					if (JSON.stringify(oCondition) === sCondition) {
						index = i;
						return true;
					}
				}
				return false;
			});
			return index;
		};

		ConditionModel.prototype.exist = function(oCondition, sFieldPath) {
			return this.indexOf(oCondition, sFieldPath) >= 0;
		};

		ConditionModel.prototype.setConditions = function(aConditions) {
			for (var i = 0; i < aConditions.length; i++) {
				this.insertCondition(-1, aConditions[i], true);
			}
		};

		ConditionModel.prototype.addCondition = function(oCondition, bForceAdd) {
			return this.insertCondition(-1, oCondition, bForceAdd);
		};

		ConditionModel.prototype.insertCondition = function(index, oCondition, bForceAdd) {
			var sFieldPath = oCondition.fieldPath,
				aConditions;

			this._checkIsEmpty(oCondition);
			this._updateValues(oCondition);

			if (!bForceAdd) {
				var i = this.indexOf(oCondition);
				if (i >= 0) {
					return this.getConditions()[i];
				}
			}

			// add condition to model
			aConditions = this.getProperty("/conditions");
			if (index == -1) {
				aConditions.push(oCondition);
			} else {
				aConditions.splice(index, 0, oCondition);
			}

			this.checkUpdate(true, true);
			this._checkMaxConditions(sFieldPath);

			return oCondition;
		};

		/**
		 * creates a condition instance for the Item condition
		 *
		 * @param {string} sFieldPath the fieldPath name of the condition
		 * @param {string} sKey the operator for the condition
		 * @param {string} sDescription 
		 * @return {object} the new condition object with the given fieldPath, the operator EEQ and the sKey and sDescription as aValues. 
		 */
		ConditionModel.prototype.createItemCondition = function(sFieldPath, sKey, sDescription) {
			return this.createCondition(sFieldPath, "EEQ", [sKey, sDescription]);
		};

		/**
		 * creates a condition instance for the condition model
		 *
		 * @param {string} sFieldPath the fieldPath name of the condition
		 * @param {string} sOperator the operator for the condition
		 * @param {any[]} aValues the array of values for the condition
		 * @return {object} the new condition object with the given fieldPath, operator and values. 
		 */
		ConditionModel.prototype.createCondition = function(sFieldPath, sOperator, aValues) {
			var oCondition = { fieldPath: sFieldPath, operator: sOperator, values: aValues };
			this._checkIsEmpty(oCondition);
			this._updateValues(oCondition);
			return oCondition;
		};

		ConditionModel.prototype.removeCondition = function(sFieldPath, iIndex) {
			if (typeof sFieldPath === "object" && iIndex === undefined) {
				var oCondition = sFieldPath;
				sFieldPath = oCondition.fieldPath;
				iIndex = this.indexOf(oCondition);
			}

			//TODO: only works for simple flat condition model content
			var aConditions = this.getProperty("/conditions");
			if (aConditions.some(function(oProp, index, aConditions) {
					if (oProp.fieldPath === sFieldPath) {
						if (iIndex === 0) {
							aConditions.splice(index, 1);
							return true;
						}
						iIndex--;
						return false;
					}
					return false;
				})) {
				this.checkUpdate(true, true);
				this._checkMaxConditions(sFieldPath);
			}
		};

		ConditionModel.prototype.removeAllConditions = function(sFieldPath) {
			var aIndices = [];
			var aConditions = this.getProperty("/conditions");
			aConditions.forEach(function(oProp, i) {
				if (!sFieldPath || oProp.fieldPath === sFieldPath) {
					aIndices.push(i);
				}
			});

			aIndices.sort(function(a, b) { return a - b; });
			for (var i = aIndices.length - 1; i > -1; i--) {
				aConditions.splice(aIndices[i], 1);
			}

			this.checkUpdate(true, true);
		};

		/**
		 * Deletes conditions from the condition model based on the context
		 * @param {sap.ui.model.Context|sap.ui.model.Context[]} oContext a single context or array of contexts to delete.
		 * @private
		 */
		ConditionModel.prototype.deleteConditions = function(oContext, oBinding) {
			var sFieldPath;
			if (!oContext || !oBinding) {
				return;
			}
			//normalize oContext
			if (!jQuery.isArray(oContext)) {
				oContext = [oContext];
			}

			//access the data node for the list binding in the model as reference
			var aData = oBinding.oModel.getProperty(oBinding.getPath(), oBinding.getContext()) || [];

			if (jQuery.isArray(oContext) && aData.length > 0) {
				//collect the indices from the context of each context
				var aIndices = [],
					fn, i, n;
				if (Array.isArray(aData)) {
					for (i = 0; i < oContext.length; i++) {
						aIndices.push(aData.indexOf(oContext[i].getProperty()));
					}
					//in case of array, sort and delete reverse
					aIndices.sort(function(a, b) { return a - b; });
					fn = function(iIndex) {
						sFieldPath = aData[iIndex].fieldPath;
						aData.splice(iIndex, 1); //splice for array
					};
				} else if (typeof oData === "object") {
					for (n in aData) {
						var sIndex = oContext[i].getPath();
						sIndex = sIndex.substring(oContext[i].getPath().lastIndexOf("/") + 1);
						aIndices.push(n);
					}
					fn = function(sIndex) {
						delete aData[sIndex]; //delete for map
					};
				}
				//delete reverse
				for (i = aIndices.length - 1; i > -1; i--) {
					fn(aIndices[i]);
				}
			}
			oBinding.getModel().checkUpdate(true, true);

			this._checkMaxConditions(sFieldPath);
		};

		ConditionModel.prototype._checkIsEmpty = function(aConditions) {
			var oFilterOpConfig = this.getFilterOperatorConfig();

			aConditions = aConditions || this.getConditions();
			if (!Array.isArray(aConditions)) {
				aConditions = [aConditions];
			}

			aConditions.forEach(function(oCondition) {
				var oOperator = oFilterOpConfig.getOperator(oCondition.operator);
				oCondition.isEmpty = oOperator.isEmpty(oCondition);
			});
		};

		ConditionModel.prototype._updateValues = function(aConditions) {
			var oFilterOpConfig = this.getFilterOperatorConfig();

			aConditions = aConditions || this.getConditions();
			if (!Array.isArray(aConditions)) {
				aConditions = [aConditions];
			}

			aConditions.forEach(function(oCondition) {
				var oOperator = oFilterOpConfig.getOperator(oCondition.operator);

				//update the values array length 
				if (oCondition.operator !== "EEQ") {
					while (oCondition.values.length != oOperator.valueTypes.length) {
						if (oCondition.values.length < oOperator.valueTypes.length) {
							oCondition.values.push("");
						}
						if (oCondition.values.length > oOperator.valueTypes.length) {
							oCondition.values = oCondition.values.slice(0, oCondition.values.length - 1);
						}
					}
				}
			});
		};

		/**
		 * This function makes a required check for the given sFieldPath (or all).
		 * It only works when the Filterfields are attached to the ConditionModel. 
		 * The function is checking that for a required FilterField at least one condition exists.
		 * 
		 * @param {string} sFieldPath
		 * @return {boolean} true, if for a sFieldPath the FilterField with required=true no condition exists.
		 *
		 * @private
		 */
		ConditionModel.prototype._checkRequiredConditions = function(bShowMessage, sFieldPath) {
			var aFields = sFieldPath ? [sFieldPath] : Object.keys(this._mFieldPath || {});
			var bError = false;
			var sMsg = this._oMessageBundle.getText("conditionmodel.REQUIRED_CONDITION_MISSING");
			aFields.forEach(function(sFieldPath) {
				if (this._mFieldPath && this._mFieldPath[sFieldPath]) {
					var oFilterField = this._mFieldPath[sFieldPath];
					if (oFilterField.getRequired() && this.getConditions(sFieldPath).length <= 0) {
						if (bShowMessage) {
							this.addFieldPathMessage(sFieldPath, sMsg);
						}
						bError = true;
					} else {
						this.removeFieldPathMessage(sFieldPath, sMsg);
					}
				}
			}, this);

			return !bError;
		};

		/**
		 * This function makes a maxConditions check for the given sFieldPath (or all).
		 * It only works when the Filterfields are attached to the ConditionModel. 
		 * The function is checking that for a FilterField the number of conditions is <=maxCondition.
		 * 
		 * @param {string} sFieldPath
		 * @return {boolean} true, if for a sFieldPath the number of conditions > the FilterField.getMaxConditions.
		 *
		 * @private
		 */
		ConditionModel.prototype._checkMaxConditions = function(sFieldPath) {
			var aFields = sFieldPath ? [sFieldPath] : Object.keys(this._mFieldPath || {});
			var bError = false;
			aFields.forEach(function(sFieldPath) {
				if (this._mFieldPath && this._mFieldPath[sFieldPath]) {
					var oFilterField = this._mFieldPath[sFieldPath];
					var sMsg = this._oMessageBundle.getText("conditionmodel.TOO_MANY_CONDITIONS");

					if (oFilterField.getMaxConditions() >= 0 && this.getConditions(sFieldPath).length > oFilterField.getMaxConditions()) {
						this.addFieldPathMessage(sFieldPath, sMsg);
						bError = true;
					} else {
						this.removeFieldPathMessage(sFieldPath, sMsg);
					}
				}
			}, this);
			return !bError;
		};

		ConditionModel.prototype.addFilterField = function(oFilterField) {
			var sFieldPath = oFilterField.getFieldPath();
			if (!this._mFieldPath) {
				this._mFieldPath = {};
			}
			this._mFieldPath[sFieldPath] = oFilterField;

			var oFieldPath = this.getProperty("/fieldPath");
			if (!oFieldPath[sFieldPath]) {
				oFieldPath[sFieldPath] = {
					valueState: "None",
					valueStateText: "",
					messages: []
				};
			}
		};

		ConditionModel.prototype.getFilterField = function(sFieldPath) {
			var aFields = Object.keys(this._mFieldPath || {});
			return this._mFieldPath[sFieldPath || aFields[0]];
		};

		ConditionModel.prototype.getFilterFields = function() {
			var aFields = Object.keys(this._mFieldPath || {});
			var aFilterFields = [];
			aFields.forEach(function(sFieldPath) {
				aFilterFields.push(this._mFieldPath[sFieldPath]);
			}, this);
			return aFilterFields;
		};


		ConditionModel.prototype.removeFilterField = function(oFilterField) {
			var sFieldPath = oFilterField.getFieldPath();
			if (this._mFieldPath && this._mFieldPath[sFieldPath]) {
				delete this._mFieldPath[sFieldPath];
			}

			var oFieldPath = this.getProperty("/fieldPath");
			if (oFieldPath[sFieldPath]) {
				delete oFieldPath[sFieldPath];
			}
		};

		ConditionModel.prototype._getFieldPathProperty = function(sFieldPath) {
			return this.getProperty("/fieldPath/")[sFieldPath];
		};

		ConditionModel.prototype.addFieldPathMessage = function(sFieldPath, sMsg) {
			var oFieldPath = this._getFieldPathProperty(sFieldPath);

			if (!oFieldPath.messages.some(function(sItem, i) {
					if (sItem === sMsg) {
						return true;
					}
					return false;
				})) {
				oFieldPath.messages.push(sMsg);
			}

			this._updateValueState(sFieldPath);
		};

		ConditionModel.prototype.setUIMessage = function(sFieldPath, sMsg) {
			var oFieldPath = this._getFieldPathProperty(sFieldPath);

			oFieldPath.uiMessage = sMsg;

			this._updateValueState(sFieldPath);
		};


		ConditionModel.prototype.removeFieldPathMessage = function(sFieldPath, sMsg) {
			var iIndex;
			var oFieldPath = this._getFieldPathProperty(sFieldPath);
			if (oFieldPath.messages.some(function(sItem, i) {
					if (sItem === sMsg) {
						iIndex = i;
						return true;
					}
					return false;
				})) {
				oFieldPath.messages.splice(iIndex, 1);
			}

			this._updateValueState(sFieldPath);
		};

		ConditionModel.prototype.removeUIMessage = function(sFieldPath) {
			var oFieldPath = this._getFieldPathProperty(sFieldPath);

			delete oFieldPath.uiMessage;

			this._updateValueState(sFieldPath);
		};


		ConditionModel.prototype._updateValueState = function(sFieldPath) {
			var bUpdate = false,
				oFieldPath = this._getFieldPathProperty(sFieldPath),
				sValueState = "None",
				sValueStateText = "";

			if (oFieldPath.uiMessage) {
				sValueState = "Error";
				sValueStateText = oFieldPath.uiMessage;
			} else if (oFieldPath.messages.length > 0) {
				sValueState = "Error";
				sValueStateText = oFieldPath.messages[oFieldPath.messages.length - 1];
			}

			if (oFieldPath.valueState !== sValueState) {
				oFieldPath.valueState = sValueState;
				bUpdate = true;
			}

			if (oFieldPath.valueStateText !== sValueStateText) {
				oFieldPath.valueStateText = sValueStateText;
				bUpdate = true;
			}

			if (bUpdate) {
				this.checkUpdate(true, true);
			}
		};

		ConditionModel.prototype.isValid = function(bValidate, sFieldPath) {
			var aFields = sFieldPath ? [sFieldPath] : Object.keys(this._mFieldPath || {});
			var bValid = this._checkRequiredConditions(bValidate);
			aFields.forEach(function(sFieldPath) {
				var oFieldPath = this._getFieldPathProperty(sFieldPath);
				bValid = bValid && oFieldPath.valueState == "None";
			}, this);

			return bValid;
		};

		ConditionModel.prototype.applyFilters = function(bValidate) {
			if (this.isValid(bValidate)) {
				var oFilter = this.getAllFilters();
				if (oFilter) {
					this._oListBinding.filter(oFilter);
				} else { // no filters
					this._oListBinding.filter();
				}
				return true;
			}
			return false;
		};

		ConditionModel.prototype.getAllFilters = function() {
			var aOverallModels = ConditionModel._getAll(this._oListBinding);
			var aOverallFilters = [];
			aOverallModels.forEach(function(oCM) {
				var oFilter = oCM.getFilters();
				if (oFilter) {
					aOverallFilters.push(oFilter);
				}
			});

			var oFilter = null;
			if (aOverallFilters.length === 1) {
				oFilter = aOverallFilters[0]; // could omit this and have an ORed array with only one filter, but it's nice this way.
			} else if (aOverallFilters.length > 1) {
				oFilter = new Filter({ filters: aOverallFilters, and: true });
			}

			return oFilter;
		};


		/**
		 *
		 * @public
		 */
		ConditionModel.prototype.getFilterOperatorConfig = function() {
			var oModel = this._oListBinding && this._oListBinding.getModel();
			return FilterOperatorConfig.getFor(oModel);
		};


		ConditionModel.prototype.getFilters = function(sFieldPath) {
			var i, aLocalFilters, aOverallFilters = [],
				aConditions,
				oToAnyFilterParam, aSections, sNavPath, sPropertyPath;

			var oFilterOpConfig = this.getFilterOperatorConfig();

			var oFilterItemNameMap = {};
			if (sFieldPath === undefined) {
				aConditions = this.getConditions();
			} else
			if (typeof sFieldPath === "string") {
				aConditions = this.getConditions(sFieldPath);
			} else {
				aConditions = sFieldPath || [];
			}
			for (i = 0; i < aConditions.length; i++) {
				oFilterItemNameMap[aConditions[i].fieldPath] = true;
			}

			// OR-combine filters for each property
			for (var attrName in oFilterItemNameMap) {
				aLocalFilters = [];
				oToAnyFilterParam = null;

				for (i = 0; i < aConditions.length; i++) {
					if (aConditions[i].fieldPath === attrName) {
						var oOperator = oFilterOpConfig.getOperator(aConditions[i].operator);
						var oFilter = oOperator.getModelFilter(aConditions[i]);

						if (oFilter.sPath.indexOf('*/') > -1) {
							aSections = oFilter.sPath.split('*/');
							if (aSections.length === 2) {
								sNavPath = aSections[0];
								sPropertyPath = aSections[1];
								oFilter.sPath = 'L1/' + sPropertyPath;

								if (!oToAnyFilterParam) {
									oToAnyFilterParam = {
										path: sNavPath,
										operator: 'Any',
										variable: 'L1'
									};
								}
								aLocalFilters.push(oFilter);
							} else {
								throw new Error("Not Implemented");
							}
						} else {
							aLocalFilters.push(oFilter);
						}
					}
				}

				if (oToAnyFilterParam) {
					if (aLocalFilters.length === 1) {
						oToAnyFilterParam.condition = aLocalFilters[0];
					} else if (aLocalFilters.length > 1) {
						oToAnyFilterParam.condition = new Filter({ filters: aLocalFilters, and: false });
					}
					aLocalFilters = [new Filter(oToAnyFilterParam)];
				}

				if (aLocalFilters.length === 1) {
					aOverallFilters.push(aLocalFilters[0]); // could omit this and have an OR-ed array with only one filter, but it's nice this way.
				} else if (aLocalFilters.length > 1) {
					aOverallFilters.push(new Filter({ filters: aLocalFilters, and: false }));
				}
			}

			// AND-combine filters for different properties and apply filters
			if (aOverallFilters.length === 1) {
				return aOverallFilters[0]; // could omit this and have an ORed array with only one filter, but it's nice this way.
			} else if (aOverallFilters.length > 1) {
				return new Filter({ filters: aOverallFilters, and: true });
			} else { // no filters
				return null;
			}
		};

		ConditionModel.prototype.serialize = function() {
			var aConditions = jQuery.extend(true, [], this.getData().conditions);
			aConditions.forEach(function(oCondition) {
				delete oCondition.isEmpty;
			}, this);
			return '{"conditions":' + JSON.stringify(aConditions) + "}";
		};

		ConditionModel.prototype.serializeMeta = function() {
			var aFields = Object.keys(this._mFieldPath || {});
			var r = "";
			aFields.forEach(function(sFieldPath) {
				if (this.getData().fieldPath[sFieldPath].valueState !== "None") {
					r += JSON.stringify(this.getData().fieldPath[sFieldPath]);
				}
			}, this);

			return '{"fieldPath":' + r + "}";
		};

		ConditionModel.prototype.parse = function(sObjects) {
			var dateTimeReviver = function(key, value) {
				var a;
				if (!isNaN(parseInt(key, 10)) && (typeof value === 'string')) {
					a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).(\d{3})Z$/.exec(value);
					if (a) {
						return new Date(value);
					}
				}
				return value;
			};

			var mResult = this.getData();
			mResult.conditions = JSON.parse(sObjects, dateTimeReviver).conditions;
			this.setData(mResult);
		};

		ConditionModel.serialize = function(oListBinding) {
			var aOverallModelKeys = ConditionModel._getAllKeys(oListBinding);
			var sResult = "";

			aOverallModelKeys.forEach(function(oCMKey) {
				var oCM = ConditionModel._mModels[oCMKey];
				if (oCM.getData().conditions && oCM.getData().conditions.length > 0) {
					sResult += ">>>" + oCMKey + "<<<";
					sResult += oCM.serialize();
				}
			});

			return sResult;
		};

		ConditionModel.serializeMeta = function(oListBinding) {
			var aOverallModelKeys = ConditionModel._getAllKeys(oListBinding);
			var sResult = "";

			aOverallModelKeys.forEach(function(oCMKey) {
				var oCM = ConditionModel._mModels[oCMKey];
				sResult += oCM.serializeMeta();
			});

			return sResult;
		};

		ConditionModel.parse = function(sObjects) {
			var aConditions = sObjects.split(">>>");
			aConditions.forEach(function(sCondition) {
				var aParts = sCondition.split("<<<");
				if (aParts.length > 1) {
					if (ConditionModel._mModels[aParts[0]]) {
						ConditionModel._mModels[aParts[0]].parse(aParts[1]);
					} else {
						var oCM = new ConditionModel(); //TODO oListBinding missing
						oCM.parse(aParts[1]);
						ConditionModel._mModels[aParts[0]] = oCM;
					}
				}
			});
		};

		ConditionModel.createControl = function(oDataType, oOperator, sPath, index) {
			var type = oDataType;
			if (oOperator.valueTypes[index] !== "self" && oOperator.valueTypes[index]) {
				type = oOperator._createLocalType(oOperator.valueTypes[index]);
			}

			if (type && type.sName === "Date") {
				return new sap.m.DatePicker({
					value: { path: sPath, type: type, mode: 'TwoWay' }
				});
			} else {
				return new sap.m.Input({
					value: { path: sPath, type: type, mode: 'TwoWay' }
				});
			}
		};

		return ConditionModel;
	}, /* bExport= */ true);