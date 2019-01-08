/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */
sap.ui.define([
	"jquery.sap.global", "sap/ui/base/ManagedObject", "sap/m/MessageBox", "sap/ui/layout/form/SimpleForm", "sap/ui/comp/smartfield/SmartField", "sap/ui/comp/smartfield/SmartLabel", "sap/m/Dialog", "sap/ui/generic/app/util/ModelUtil", "sap/m/VBox", "sap/m/Text"
], function (jQuery, ManagedObject, MessageBox, SimpleForm, SmartField, SmartLabel, Dialog, ModelUtil, VBox, Text) {
	"use strict";

	var ActionUtil = ManagedObject.extend("sap.ui.generic.app.util.ActionUtil", {
		metadata: {
			properties: {
				/**
				 * The used controller.
				 */
				controller: {
					type: "object",
					group: "Misc",
					defaultValue: null
				},
				/**
				 * The used ApplicationController
				 */
				applicationController: {
					type: "object",
					group: "Misc",
					defaultValue: null
				},
				/* TODO Should maybe get an aggregation to reflect that it is an array */
				/**
				 * The contexts in which the action is called.
				 */
				contexts: {
					type: "object",
					group: "Misc",
					defaultValue: null
				},
				/**
				 * The callback that is called after the action has been successfully executed.
				 */
				successCallback: {
					type: "function",
					group: "Misc",
					defaultValue: null
				},
				/**
				 * The callback that is called after the action has been successfully executed.
				 */
				operationGrouping: {
					type: "string",
					group: "Misc",
					defaultValue: null
				}
			}
		}
	});

	/**
	 * Triggers the chain of the action call's preparation, its processing and its result handling.
	 * If there is a critical action, a confirmation dialog is displayed on the UI.
	 * <b>Note</b>: An action is considered as critical if the UI annotation <code>com.sap.vocabularies.Common.v1.IsActionCritical</code> is defined.
	 *
	 * @param {string} sFunctionImportPath The function import that is called
	 * @param {string} [sFunctionImportLabel] Optional parameter for the confirmation popup text
	 *
	 * @returns {Promise} There are two cases:
	 * Case 1: Action is triggered immediately w/o further user interaction (i.e. when no further
	 * parameters are needed or expected for processing).
	 * A <code>Promise</code> is returned that resolves immediately and provides as parameter an
	 * <code>Object</code> that contains another promise in the member <code>executionPromise</code>.
	 * Case 2: Action is triggered with a dialog beforehand that could be cancelled by the user.
	 * Same as above with the exception that the returned <code>Promise</code> is rejected directly
	 * when the user decides to cancel the action processing.
	 *
	 * @protected
	 */
	ActionUtil.prototype.call = function (sFunctionImportPath, sFunctionImportLabel) {
		var that = this;
		return new Promise(function (resolve, reject) {
			var mActionParams;
			that._oActionPromiseCallback = { resolve: resolve, reject: reject };

			that._sFunctionImportPath = sFunctionImportPath;

			var oController = that.getController();
			if (!oController) {
				reject("Controller not provided");
			}

			that._oMetaModel = oController.getView().getModel().getMetaModel();

			var sFunctionName = sFunctionImportPath.split('/')[1];

			//TODO Think about removing "global" variables for better readability / debugging
			that._oFunctionImport = that._oMetaModel.getODataFunctionImport(sFunctionName);
			that._sFunctionImportLabel = sFunctionImportLabel || sFunctionName;

			if (!that._oFunctionImport) {
				reject("Unknown Function Import " + sFunctionName);
			}

			if (that._isActionCritical()) {
				var sCustomMessageKey = "ACTION_CONFIRM|" + sFunctionName; // Key for i18n in application for custom message
				var sMsgBoxText;
				var oResourceBundle = oController.getOwnerComponent().getAppComponent && oController.getOwnerComponent().getAppComponent().getModel("i18n") && oController.getOwnerComponent().getAppComponent().getModel("i18n").getResourceBundle();
				if (oResourceBundle && oResourceBundle.hasText(sCustomMessageKey)) {
					sMsgBoxText = oResourceBundle.getText(sCustomMessageKey);
				} else {
					// Fallback in case key does not exist in i18n file of Application
					sMsgBoxText = sap.ui.getCore().getLibraryResourceBundle("sap.ui.generic.app").getText("ACTION_CONFIRM");
					sMsgBoxText = jQuery.sap.formatMessage(sMsgBoxText, that._sFunctionImportLabel);
				}
				MessageBox.confirm(sMsgBoxText, {
					title: that._sFunctionImportLabel,
					onClose: function (oAction) {
						if (oAction === "OK") {
							mActionParams = that._prepareParameters(that.getContexts());
							that._initiateCall(mActionParams);
						} else if (oAction === "CANCEL") {
							that._oActionPromiseCallback.reject();
						}
					},
					sClass: that._getCompactModeStyleClass()
				});
			} else {
				mActionParams = that._prepareParameters(that.getContexts());
				that._initiateCall(mActionParams);
			}
		});
	};

	ActionUtil.prototype._getCompactModeStyleClass = function () {
		if (this.getController().getView().$().closest(".sapUiSizeCompact").length) {
			return "sapUiSizeCompact";
		}
		return "";
	};

	/**
	 * checks if the action is critical
	 *
	 * @private
	 * @returns {boolean} true if the action is critical otherwise false
	 */
	ActionUtil.prototype._isActionCritical = function () {
		var oCritical = this._oFunctionImport["com.sap.vocabularies.Common.v1.IsActionCritical"];

		if (!oCritical) {
			return false;
		}
		if (oCritical.Bool === undefined) {
			return true;
		}

		return this._toBoolean(oCritical.Bool);
	};

	/**
	 * converts a parameter value to a boolean
	 *
	 * @param {object} oParameterValue The value to be converted
	 * @private
	 * @returns {boolean} Boolean value
	 */
	ActionUtil.prototype._toBoolean = function (oParameterValue) {
		if (typeof oParameterValue === "string") {
			var oValue = oParameterValue.toLowerCase();
			return !(oValue == "false" || oValue == "" || oValue == " ");
		}

		return !!oParameterValue;
	};

	/**
	 * Prepares the parameters which are needed as input for the action
	 *
	 * @param {array} 		aContexts Array of contexts used for action processing
	 *
	 * @returns {object} 	mActionParams Parameters that describe the Function Import:
	 * 						mActionParams.parameterData Array with mandatory parameters
	 *						mActionParams.additionalParameters Array with additional parameters
	 *
	 * @private
	 */
	ActionUtil.prototype._prepareParameters = function (aContexts) {

		var oSingleContext, oEntityType = null;

		// Multi action scenario or "no" scenario? --> If yes we do no preparation sugar
		if (jQuery.isArray(aContexts) && aContexts.length != 1) {
			return undefined;
		} else {
			oSingleContext = aContexts[0];
		}

		var oContextObject = oSingleContext.getObject();
		if (oSingleContext && oSingleContext.getPath()) {
			var sEntitySet = ModelUtil.getEntitySetFromContext(oSingleContext);
			var oEntitySet = this._oMetaModel.getODataEntitySet(sEntitySet, false);
			oEntityType = this._oMetaModel.getODataEntityType(oEntitySet.entityType, false);
		}

		var oKeyProperties = this._getPropertyKeys(oEntityType);
		var oParameterValue;
		var mActionParams = {
			parameterData: {},
			additionalParameters: []
		};

		if (this._oFunctionImport.parameter) {
			for (var i = 0; i < this._oFunctionImport.parameter.length; i++) {
				var oParameter = this._oFunctionImport.parameter[i];

				this._addParameterLabel(oParameter, oEntityType);

				var sParameterName = oParameter.name;
				var bIsKey = !!oKeyProperties[sParameterName];

				oParameterValue = undefined;
				if (oContextObject.hasOwnProperty(sParameterName)) {
					oParameterValue = oContextObject[sParameterName];
				} else if (bIsKey) {
					// parameter is key but not part of the current projection - raise error
					jQuery.sap.log.error("Key parameter of action not found in current context: " + sParameterName);
					throw new Error("Key parameter of action not found in current context: " + sParameterName);
				}

				mActionParams.parameterData[sParameterName] = oParameterValue;

				if (!bIsKey && oParameter.mode.toUpperCase() == "IN") {
					// offer as optional parameter with default value from context
					mActionParams.additionalParameters.push(oParameter);
				}
			}
		}
		return mActionParams;
	};

	/**
	 * returns a map containing all keys retrieved for the given entityType
	 *
	 * @param {object} oEntityType - the entity type for which the keys should be retrieved
	 * @private
	 * @returns {object} map containing the properties keys
	 */
	ActionUtil.prototype._getPropertyKeys = function(oEntityType) {
		var oKeyMap = {};

		if (oEntityType && oEntityType.key && oEntityType.key.propertyRef) {
			for (var i = 0; i < oEntityType.key.propertyRef.length; i++) {
				var sKeyName = oEntityType.key.propertyRef[i].name;
				oKeyMap[sKeyName] = true;
			}
		}
		return oKeyMap;
	};

	/**
	 * Initiate action call.
	 *
	 * @param {object} [mActionParams] Optional map with parameters that are used in action call.
	 *
	 */
	ActionUtil.prototype._initiateCall = function (mActionParams) {
		if (mActionParams != undefined && mActionParams.additionalParameters.length == 0) {
			this._call(mActionParams.parameterData);
		} else if (mActionParams != undefined && mActionParams.additionalParameters.length > 0) {
			var that = this;
			var mParameters = {
				urlParameters: {}
			};

			var oEntityContext = this.getContexts()[0];

			var oFuncHandle = this.getApplicationController().getNewActionContext(this._sFunctionImportPath, oEntityContext, mParameters);

			oFuncHandle.context.then(function (oActionContext) {
				var mParameterForm = that._buildParametersForm(mActionParams, oActionContext);

				for (var sKey in mActionParams.parameterData) {
					oActionContext.oModel.getData(oActionContext.sPath)[sKey] = mActionParams.parameterData[sKey];
				}
				var bActionPromiseDone = false;
				var oParameterDialog = new Dialog({
					title: that._sFunctionImportLabel,
					content: [
						mParameterForm.form
					],
					beginButton: new sap.m.Button({
						text: that._sFunctionImportLabel,
						press: function (oEvent) {
							if (mParameterForm.hasNoClientErrors()) {
								if (mParameterForm.getEmptyMandatoryFields().length == 0) {
									oParameterDialog.close();

									that._oActionPromiseCallback.resolve({
										executionPromise: oFuncHandle.result.then(function (aResults) {
											that._bExecutedSuccessfully = true;
											return aResults;
										}, function (oError) {
											that._bExecutedSuccessfully = false;
											//TODO: Think about throwing errors. Maybe not needed in a failing Promise...?
											throw oError;
										})
									});

									bActionPromiseDone = true;

									var sFunctionImportName = that._sFunctionImportPath.split('/')[1];
									that.getApplicationController().submitActionContext(oEntityContext, oActionContext, sFunctionImportName);

								} else {
									var oContent = new VBox();

									var sRootMessage = sap.ui.getCore().getLibraryResourceBundle("sap.ui.generic.app").getText("ACTION_MISSING_MANDATORY");

									for (var i = 0; i < mParameterForm.getEmptyMandatoryFields().length; i++) {
										var sText = jQuery.sap.formatMessage(sRootMessage, mParameterForm.getEmptyMandatoryFields()[i].getTextLabel());
										oContent.addItem(new Text({
											text: sText
										}));
									}

									MessageBox.error(oContent, {
										sClass: that._getCompactModeStyleClass()
									});
								}

							}
						}
					}),
					endButton: new sap.m.Button({
						text: sap.ui.getCore().getLibraryResourceBundle("sap.ui.generic.app").getText("ACTION_CANCEL"),
						press: function () {
							oParameterDialog.close();
							that._oActionPromiseCallback.reject();
							bActionPromiseDone = true;
						}
					}),
					afterClose: function (oControlEvent) {
						oParameterDialog.destroy();
						// Tidy up at the end: if the action hasn't been triggered, do the same as it was cancelled.
						if (!bActionPromiseDone) {
							that._oActionPromiseCallback.reject();
						}
					}
				}).addStyleClass("sapUiNoContentPadding");

				oParameterDialog.addStyleClass(that._getCompactModeStyleClass());

				oParameterDialog.setModel(oActionContext.oModel);
				oParameterDialog.open();
			});

		} else {
			//Take "the old" way -> prepare everything and call then callFunction with complete set of data
			this._call();
		}
	};

	ActionUtil.prototype._call = function (mUrlParameters) {
		var aCurrentContexts = this.getContexts();
		var mParameters = {
			urlParameters: mUrlParameters,
			operationGrouping: this.getOperationGrouping()
		};
		var oController = this.getController();
		var oApplicationController = this.getApplicationController() || oController.getApplicationController();
		var that = this;


		that._oActionPromiseCallback.resolve({
			executionPromise: oApplicationController.invokeActions(this._sFunctionImportPath, aCurrentContexts, mParameters).then(function (oResponse) {
				that._bExecutedSuccessfully = true;
				return oResponse;
			}, function (oError) {
				that._bExecutedSuccessfully = false;
				//TODO: Think about throwing errors. Maybe not needed in a failing Promise...?
				throw oError;
			})

		});
	};

	ActionUtil.prototype._getActionParameterData = function (oParameterModel) {
		var aMissingMandatoryParameters = [];

		// raw parameter list contains all action parameters as key/value - no check required
		var oRawParameterData = oParameterModel.getObject('/');
		var oPreparedParameterData = {};
		for (var i = 0; i < this._oFunctionImport.parameter.length; i++) {
			var oParameter = this._oFunctionImport.parameter[i];
			var sParameterName = oParameter.name;
			if (oRawParameterData.hasOwnProperty(sParameterName)) {
				var oValue = oRawParameterData[sParameterName];
				if (oValue === undefined) {
					// if parameter is nullable=true don't pass it at all to function import call
					// TODO check boolean handling - should undefined boolean value be sent as false to backend or not at all
					if (!this._toBoolean(oParameter.nullable)) {
						// defaulting for boolean - set to false - UI state undefined for checkbox
						// all other not null checks should have already been done by smart field - if not throw error - should not happen at all
						if (oParameter.type === 'Edm.Boolean') {
							oPreparedParameterData[sParameterName] = false;
						} else {
							aMissingMandatoryParameters.push(oParameter);
						}
					}
				} else {
					oPreparedParameterData[sParameterName] = oValue;
				}
			} else {
				throw new Error("Unknown parameter: " + sParameterName);
			}
		}

		return {
			preparedParameterData: oPreparedParameterData,
			missingMandatoryParameters: aMissingMandatoryParameters
		};
	};


	/**
	 * Initiate a form with all needed controls to allow providing missing
	 * parameters which are needed by the triggered action.
	 *
	 * @param {object} mParameters Map that contains the parameters - prefilled and additional
	 * @param {object} oContext Context object of the triggered action
	 *
	 * @returns {object} A map with the two members: "form" and "hasNoClientErrors"
	 *
	 * @private
	 */
	ActionUtil.prototype._buildParametersForm = function (mParameters, oContext) {
		var oForm = new SimpleForm({
			editable: true
		});

		oForm.setBindingContext(oContext);
		// list of all smart fields for input check
		var oField;
		var aFields = [];
		var sLabel;

		for (var i = 0; i < mParameters.additionalParameters.length; i++) {
			var oParameter = mParameters.additionalParameters[i];

			var sValueType = oParameter["com.sap.vocabularies.Common.v1.ValueListWithFixedValues"] ? "fixed-values" : undefined;

			//Create a smartfield with data form outside
			oField = new SmartField({
				value: '{' + oParameter.name + '}',
				textLabel: this._getParameterName(oParameter)
			});
			oField.data("configdata", {
				"configdata": {
					isInnerControl: false,
					path: oParameter.name,
					entitySetObject: {},
					annotations: {
						valuelist: oParameter["com.sap.vocabularies.Common.v1.ValueList"],
						valuelistType: sValueType
					},
					modelObject: oContext.oModel,
					entityType: oParameter.type,
					property: {
						property: oParameter,
						typePath: oParameter.name
					}
				}
			});

			//set mandatory if requested
			if (oParameter.nullable == "false") {
				oField.setMandatory(true);
			}

			aFields.push(oField);

			sLabel = new SmartLabel();
			sLabel.setLabelFor(oField);

			oForm.addContent(sLabel);
			oForm.addContent(oField);
		}

		// for now: always return false, as smart fields currently do not handle JSON models correctly
		var fnHasNoClientErrors = function () {
			var bNoClientErrors = true;
			for (var i = 0; i < aFields.length; i++) {
				if (aFields[i].getValueState() != "None") {
					bNoClientErrors = false;
					break;
				}
			}
			return bNoClientErrors;
		};

		var fnGetEmptyMandatoryFields = function () {
			var aMandatoryFields = jQuery.grep(aFields, function (oField) {
				return (oField.getMandatory() == true
					&& oField.getValue() == ""
					&& oField.getDataType() != "Edm.Boolean"
				);
			});
			return aMandatoryFields;
		};

		return {
			form: oForm,
			hasNoClientErrors: fnHasNoClientErrors,
			getEmptyMandatoryFields: fnGetEmptyMandatoryFields
		};
	};


	ActionUtil.prototype._getParameterName = function (oParameter) {
		// if no label is set for parameter use parameter name as fallback
		return oParameter["com.sap.vocabularies.Common.v1.Label"] ? oParameter["com.sap.vocabularies.Common.v1.Label"].String : oParameter.name;
	};

	ActionUtil.prototype._addParameterLabel = function (oParameter, oEntityType) {
		if (oEntityType && oParameter && !oParameter["com.sap.vocabularies.Common.v1.Label"]) {

			var oProperty = this._oMetaModel.getODataProperty(oEntityType, oParameter.name, false);
			if (oProperty && oProperty["com.sap.vocabularies.Common.v1.Label"]) {
				// copy label from property to parameter with same name as default if no label is set for function import parameter
				oParameter["com.sap.vocabularies.Common.v1.Label"] = oProperty["com.sap.vocabularies.Common.v1.Label"];
			}
		}
	};


	/**
	 * returns the actions function import label
	 *
	 * @protected
	 * @returns {string} the function import label
	 */
	ActionUtil.prototype.getFunctionImportLabel = function () {
		return this._sFunctionImportLabel;
	};


	/**
	 * returns true if the action has executed successfully
	 *
	 * @protected
	 * @returns {boolean} true if the action has executed successfully
	 */
	ActionUtil.prototype.getExecutedSuccessfully = function () {
		return this._bExecutedSuccessfully;
	};

	return ActionUtil;

}, /* bExport= */true);
