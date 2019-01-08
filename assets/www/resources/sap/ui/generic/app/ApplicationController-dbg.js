/*
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define(["jquery.sap.global", "./transaction/BaseController", "./transaction/TransactionController", "sap/ui/generic/app/util/ModelUtil"], function (jQuery, BaseController, TransactionController, ModelUtil) {
	"use strict";

	/* global Promise */

	/**
	 * Constructor for application controller.
	 *
	 * @param {sap.ui.model.odata.v2.ODataModel} oModel The OData model currently used
	 * @param {sap.ui.core.mvc.View} oView The current view
	 *
	 * @throws {Error} If no model is handed over as input parameter
	 *
	 * @class Application Controller.
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @public
	 * @experimental Since 1.32.0
	 * @since 1.32.0
	 * @alias sap.ui.generic.app.ApplicationController
	 */
	var ApplicationController = BaseController.extend("sap.ui.generic.app.ApplicationController", {

		constructor: function (oModel, oView) {
			BaseController.apply(this, [
				oModel
			]);

			this._oGroupChanges = {};
			this.sName = "sap.ui.generic.app.ApplicationController";
			this._initModel(oModel);
			this.registerView(oView);
		}
	});

	/**
	 * Notifies the application controller of a change of a property. Please note that the method is not meant for
	 * productive use currently. It is experimental.
	 *
	 * @param {string} sPath The path to the changed property
	 * @param {object} oContext The binding context in which the change occured
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution of the action
	 * @experimental Since 1.32.0
	 * @public
	 */
	ApplicationController.prototype.propertyChanged = function (sPath, oContext) {
		var that = this, mParameters = {
			batchGroupId: "Changes",
			changeSetId: "Changes",
			onlyIfPending: true,
			noShowResponse: true,
			noBlockUI: true,
			draftSave: true // propertyChanged is currently only called for drafts therefore set this statically
		}, oSideEffect, oEntityType = {};


		// check if this change is part of a side effects group
		if (oContext && oContext instanceof sap.ui.model.Context) {
			var sEntitySet = ModelUtil.getEntitySetFromContext(oContext);
			var oMetaModel = oContext.getModel().getMetaModel();
			var sEntityType = oMetaModel.getODataEntitySet(sEntitySet).entityType;
			oEntityType = oMetaModel.getODataEntityType(sEntityType);
		}

		for (var p in oEntityType) {
			if (jQuery.sap.startsWith(p, "com.sap.vocabularies.Common.v1.SideEffects")) {

				oSideEffect = oEntityType[p];

				if (oSideEffect.SourceProperties && oSideEffect.SourceProperties.length) {
					for (var i = 0; i < oSideEffect.SourceProperties.length; i++) {
						if (oSideEffect.SourceProperties[i].PropertyPath === sPath) {
							that.registerGroupChange(that._getSideEffectsQualifier(p));
						}
					}
				}
			}
		}

		return new Promise(function (resolve, reject) {
			// queue the propertyChanged event in order to synchronize it correctly
			// with the sideEffects validateFieldGroup event
			setTimeout(function () {
				that.triggerSubmitChanges(mParameters).then(function (oResponse) {
					resolve(oResponse);
				}, function (oError) {
					reject(oError);
				});
			});
		});
	};

	/**
	 * Registers a change for the given group id.
	 *
	 * @param {string} sGroupId The group id where changes were done
	 * @experimental Since 1.32.0
	 * @public
	 */
	ApplicationController.prototype.registerGroupChange = function (sGroupId) {
		this._oGroupChanges[sGroupId] = true;
	};

	/**
	 * Registers the given view with the Application Controller.
	 *
	 * @param {sap.ui.core.mvc.View} oView The view to be registered
	 * @experimental Since 1.32.0
	 * @public
	 */
	ApplicationController.prototype.registerView = function (oView) {
		var that = this;

		if (oView) {
			// attach to the field group validation event.
			this._fnAttachValidateFieldGroup = function (oEvent) {
				var sID, oID, len, i, aIDs = [];

				var oBindingContext = this.getBindingContext();
				if (!oBindingContext) {
					return false;
				}

				if (!that.getTransactionController().getDraftController().getDraftContext().hasDraft(oBindingContext)) {
					// in case of non-draft do not immediately execute side effect, detach event
					this.detachValidateFieldGroup(that._fnAttachValidateFieldGroup);
					return false;
				}

				if (oEvent.mParameters.fieldGroupIds) {
					len = oEvent.mParameters.fieldGroupIds.length;
				}

				for (i = 0; i < len; i++) {
					sID = oEvent.mParameters.fieldGroupIds[i];
					oID = oView.data(sID);

					// make sure it is one of our IDs.
					if (oID) {
						aIDs.push({
							uuid: sID,
							objid: oID
						});
					}
				}

				that._onValidateFieldGroup(aIDs, oView);
			};
			oView.attachValidateFieldGroup(this._fnAttachValidateFieldGroup);
		}
	};

	/**
	 * Parameterizes the OData model.
	 *
	 * @param {sap.ui.model.odata.ODataModel} oModel The OData model currently used
	 * @private
	 */
	ApplicationController.prototype._initModel = function (oModel) {
		// set binding mode and refresh after change.
		oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
		oModel.setRefreshAfterChange(false);

		// set the batch groups:
		// it should be deferred, as it is for batching actions
		oModel.setDeferredBatchGroups([
			"Changes"
		]);
		oModel.setChangeBatchGroups({
			"*": {
				batchGroupId: "Changes",
				changeSetId: "Changes",
				single: false
			}
		});
	};

	/**
	 * Event handler for field-group-validation event of the view.
	 *
	 * @param {array} aGroups Field group IDs
	 * @param {object} oView reference to the view
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution of the submit
	 * @private
	 */
	ApplicationController.prototype._onValidateFieldGroup = function (aGroups, oView) {
		var i, len = aGroups.length, fRequest, mRequests = {
			bGlobal: false,
			aRequests: []
		};

		// calculate the requests to be triggered.
		for (i = 0; i < len; i++) {
			this._executeFieldGroup(aGroups[i], mRequests, oView);
		}

		// execute the requests to be triggered.
		len = mRequests.aRequests.length;

		for (i = 0; i < len; i++) {
			fRequest = mRequests.aRequests[i];
			fRequest(mRequests.bGlobal);
		}

		// global side effect: so execute refresh of the complete model.
		if (mRequests.bGlobal) {
			this._oModel.refresh(true, false, "Changes");
		}

		// trigger flush.
		var oPromise = this.triggerSubmitChanges({
			batchGroupId: "Changes",
			noShowSuccessToast: true,
			forceSubmit: true,
			noBlockUI: true,
			urlParameters: {},
			draftSave: this._oModel.hasPendingChanges()
		});

		this.fireEvent("beforeSideEffectExecution", {
			promise: oPromise,
			valueChange: mRequests.bValueChange,
			validationMessage: mRequests.bValidationMessage,
			fieldControl: mRequests.bFieldControl
		});

		return oPromise;
	};

	/**
	 * Executes the side effects for a single field group.
	 *
	 * @param {object} oGroup The given field group
	 * @param {map} mRequests Collection of all requests
	 * @param {object} oView Reference to the view
	 * @returns {boolean} <code>true</code> if the field group action has been executed otherwise <code>false</code>
	 * @private
	 */
	ApplicationController.prototype._executeFieldGroup = function (oGroup, mRequests, oView) {
		var sSideEffectsQualifier, oContext, oSideEffect, mParams = {
			batchGroupId: "Changes",
			changeSetId: "SideEffects",
			noShowSuccessToast: true,
			forceSubmit: true,
			noBlockUI: true,
			urlParameters: {}
		};

		sSideEffectsQualifier = this._getSideEffectsQualifier(oGroup.objid.name);

		// set the side effects qualifier as action input.
		mParams.urlParameters.SideEffectsQualifier = sSideEffectsQualifier;

		// create a new context and get the side effect.
		oContext = this._oModel.getContext(oGroup.objid.context);
		oSideEffect = this._getSideEffect(oGroup.objid);

		// check whether to stop.
		if (this._hasClientErrors(oGroup.uuid, oView)) {
			return false;
		}

		if (!this._oGroupChanges[sSideEffectsQualifier] && !this._oModel.hasPendingChanges()) {
			return false;
		}

		// set changes tracking to false.
		this._oGroupChanges[sSideEffectsQualifier] = false;

		// execute the side effect.
		this._executeSideEffects(oSideEffect, oContext, mParams, mRequests);

		return true;
	};

	/**
	 * Determines the side effect qualifier
	 *
	 * @param {string} sAnnotation The annotation path
	 * @returns {string} the side effect qualifier or empty in case of no qualifier
	 *
	 * @private
	 */
	ApplicationController.prototype._getSideEffectsQualifier = function (sAnnotation) {
		var sSideEffectQualifier = sAnnotation.replace("com.sap.vocabularies.Common.v1.SideEffects", "");
		if (sSideEffectQualifier.indexOf("#") === 0) {
			sSideEffectQualifier = sSideEffectQualifier.replace("#", "");
		}
		return sSideEffectQualifier;
	};


	/**
	 * Executes a side effects for given action contexts
	 *
	 * @param {object} oSideEffect The side effects annotation
	 * @param {sap.ui.model.Context} aContexts The given contexts
	 *
	 * @private
	 */
	ApplicationController.prototype._executeSideEffectsForActions = function (oSideEffect, aContexts) {
		var fnRequest;
		var sConstantForBoundEntity = "_it/";
		var mRequests = {
			bGlobal: false,
			aRequests: []
		};
		var mParams = {
			batchGroupId: "Changes",
			changeSetId: "SideEffects",
			noShowSuccessToast: true,
			forceSubmit: true,
			noBlockUI: true,
			urlParameters: {}
		};
		var i = 0;

		/*
		 As agreed with SAP consumption team in OData V2 we use the constant _it to define that the targets are relative
		 to the instance for which the action is executed for (bound action) - we remove this strings as the internal
		 _executeSideEffect method already requires a context (= the action context) and executes all side effects
		 relative from this context.
		 */

		if (oSideEffect.TargetEntities && oSideEffect.TargetEntities.length) {

			for (i = 0; i < oSideEffect.TargetEntities.length; i++) {
				if (oSideEffect.TargetEntities[i].NavigationPropertyPath.indexOf(sConstantForBoundEntity) === 0) {
					oSideEffect.TargetEntities[i].NavigationPropertyPath = oSideEffect.TargetEntities[i].NavigationPropertyPath.substr(4);
				}
			}
		}
		if (oSideEffect.TargetProperties && oSideEffect.TargetProperties.length) {
			for (i = 0; i < oSideEffect.TargetProperties.length; i++) {
				if (oSideEffect.TargetProperties[i].PropertyPath.indexOf(sConstantForBoundEntity) === 0) {
					oSideEffect.TargetProperties[i].PropertyPath = oSideEffect.TargetProperties[i].PropertyPath.substr(4);
				}
			}
		}

		for (i = 0; i < aContexts.length; i++) {
			this._executeSideEffects(oSideEffect, aContexts[i], mParams, mRequests);

			if (mRequests.aRequests[0]) {
				fnRequest = mRequests.aRequests[0];
				fnRequest(mRequests.bGlobal);
				mRequests.aRequests = [];
			}
		}

		if (mRequests.bGlobal) {
			this._oModel.refresh(true, false, "Changes");
		}
	};


	/**
	 * Executes a side effects annotation.
	 *
	 * @param {object} oSideEffects The side effects annotation
	 * @param {sap.ui.model.Context} oContext The given binding context
	 * @param {map} mParameters Parameters to control the behavior of the request
	 * @param {map} mRequests Collection of all requests
	 *
	 * @private
	 */
	ApplicationController.prototype._executeSideEffects = function (oSideEffects, oContext, mParameters, mRequests) {
		var that = this, fFunction, sMethod, mMethods = {
			"ValidationMessage": "validateDraft",
			"ValueChange": "prepareDraft"
		};

		if (!oSideEffects.EffectTypes || !oSideEffects.EffectTypes.EnumMember) {
			// although effect type is mandatory according to the specification we set value change as fallback
			oSideEffects.EffectTypes = {
				EnumMember: "ValueChange"
			};
		}

		// check whether validate or prepare function has to be executed.
		if (that.getTransactionController().getDraftController().getDraftContext().hasDraft(oContext)) {
			sMethod = mMethods[oSideEffects.EffectTypes.EnumMember];
		}
		mRequests.bValueChange = oSideEffects.EffectTypes.EnumMember === "ValueChange" ? true : mRequests.bValueChange;
		mRequests.bValidationMessage = oSideEffects.EffectTypes.EnumMember === "ValidationMessage" ? true : mRequests.bValidationMessage;
		mRequests.bFieldControl = oSideEffects.EffectTypes.EnumMember === "FieldControlChange" ? true : mRequests.bFieldControl;

		// collect URL parameters and check for global prepare.
		this._setSelect(oSideEffects, mParameters, mRequests, oContext);

		// set the function to be executed to create the request.
		fFunction = function (bGlobal) {
			// for field control no preparation or validation action shall be executed.
			if (sMethod) {
				that.getTransactionController().getDraftController()[sMethod](oContext, mParameters);
			}

			if (!bGlobal) {
				that._read(oContext.getPath(), mParameters);
			}
		};
		mRequests.aRequests.push(fFunction);
	};

	/**
	 * Checks the controls of the given group for client errors.
	 *
	 * @param {string} sGroupId The Id of the group.
	 * @param {object} oView Reference to the view
	 * @returns {boolean} <code>true</code> if client errors exist otherwise <code>false</code>.
	 * @private
	 */
	ApplicationController.prototype._hasClientErrors = function (sGroupId, oView) {
		var i, len, oControl, aControls;

		aControls = oView.getControlsByFieldGroupId(sGroupId);

		if (aControls) {
			len = aControls.length;

			for (i = 0; i < len; i++) {
				oControl = aControls[i];

				if (oControl && oControl.getParent) {
					oControl = oControl.getParent(); // get parental SmartField

					if (oControl && oControl.checkClientError && oControl.checkClientError()) {
						return true;
					}
				}
			}
		}

		return false;
	};

	/**
	 * Creates a $select statement for rereading an entity based upon the side effects annotation.
	 *
	 * @param {object} oSideEffects The side effects annotation
	 * @param {map} mParameters Parameters to control the behavior of the request
	 * @param {map} mRequests Collection of all requests
	 * @param {sap.ui.model.Context} oContext The given binding context
	 *
	 * @private
	 */
	ApplicationController.prototype._setSelect = function (oSideEffects, mParameters, mRequests, oContext) {
		var i, len = 0, oTarget, aSelect = [], aExpand = [], aTargetEntities = [], sNavigationPath;

		if (!mRequests.bGlobal) {
			if ((!oSideEffects.TargetEntities || oSideEffects.TargetEntities.length === 0) && (!oSideEffects.TargetProperties || oSideEffects.TargetProperties.length === 0)) {
				mRequests.bGlobal = true;
				return;
			}

			if (oSideEffects.TargetEntities) {
				len = oSideEffects.TargetEntities.length;

				if (len > 0) {
					for (i = 0; i < len; i++) {
						oTarget = oSideEffects.TargetEntities[i];

						if (oTarget.NavigationPropertyPath === "") {
							aSelect.push('*');
						} else {
							aSelect.push(oTarget.NavigationPropertyPath);
							if (aExpand.indexOf(oTarget.NavigationPropertyPath) === -1) {
								aExpand.push(oTarget.NavigationPropertyPath);
							}
						}
						aTargetEntities.push(oTarget.NavigationPropertyPath);
					}
				}
			}

			if (oSideEffects.TargetProperties) {
				len = oSideEffects.TargetProperties.length;

				if (len > 0) {
					for (i = 0; i < len; i++) {
						oTarget = oSideEffects.TargetProperties[i];
						sNavigationPath = "";

						if (oTarget.PropertyPath.indexOf("/") !== -1) {
							var sEntitySet = ModelUtil.getEntitySetFromContext(oContext);
							var oMetaModel = this._oModel.getMetaModel();
							var sEntityType = oMetaModel.getODataEntitySet(sEntitySet).entityType;
							var oEntityType = oMetaModel.getODataEntityType(sEntityType);
							var aParts = oTarget.PropertyPath.split("/");
							var oAssociationEnd;

							if (aParts.length > 1) {
								for (var j = 0; j < (aParts.length - 1); j++) {
									oAssociationEnd = oMetaModel.getODataAssociationEnd(oEntityType, aParts[j]);
									if (oAssociationEnd) {
										oEntityType = oMetaModel.getODataEntityType(oAssociationEnd.type);
										if (sNavigationPath) {
											sNavigationPath = sNavigationPath + "/";
										}
										sNavigationPath = sNavigationPath + aParts[j];
									} else {
										// we reached a complex type
										break;
									}
								}
							}
						}

						if (aTargetEntities.indexOf(sNavigationPath) === -1) {
							// only in case not complete entity is read use $select for this entity

							if (sNavigationPath && aExpand.indexOf(sNavigationPath) === -1) {
								aExpand.push(sNavigationPath);
							}

							aSelect.push(oTarget.PropertyPath);
						}
					}
				}
			}
		}

		if (aSelect.length > 0) {
			mParameters.readParameters = [
				"$select=" + aSelect.join(",")
			];

			if (aExpand.length > 0) {
				mParameters.readParameters.push("$expand=" + aExpand.join(','));
			}
		}
	};

	/**
	 * Returns the side effect annotation for a given field group ID.
	 *
	 * @param {object} oID Field group ID
	 * @returns {object} The side effect annotation for a given ID
	 * @private
	 */
	ApplicationController.prototype._getSideEffect = function (oID) {
		var oMeta, oResult, sMethod, sFullname;

		oMeta = this._oModel.getMetaModel();
		sMethod = "getOData" + oID.originType.substring(0, 1).toUpperCase() + oID.originType.substring(1);

		if (oID.originNamespace) {
			sFullname = oID.originNamespace + "." + oID.originName;
		} else {
			sFullname = oID.originName;
		}

		if (oMeta[sMethod]) {
			oResult = oMeta[sMethod](sFullname);

			if (oResult) {
				return oResult[oID.name];
			}
		}

		throw "Unknown SideEffect originType: " + oID.originType;
	};

	/**
	 * Returns the current transaction controller instance.
	 *
	 * @returns {sap.ui.generic.app.transaction.TransactionController} The transaction controller instance
	 *
	 * @public
	 */
	ApplicationController.prototype.getTransactionController = function () {
		// create the transaction controller lazily.
		if (!this._oTransaction) {
			this._oTransaction = new TransactionController(this._oModel, this._oQueue, {
				noBatchGroups: true
			});
		}

		return this._oTransaction;
	};

	/**
	 * Invokes an action for every provided context where the properties are taken as input from.
	 * The changes are submitted directly to the back-end.
	 *
	 * @param {string} sFunctionName The name of the function or action that shall be triggered.
	 * @param {array} aContexts The given binding contexts where the parameters of the action shall be filled from.
	 * @param {map} mParameters Parameters to control the behavior of the request.
	 * @param {String} mParameters.operationGrouping if set to "com.sap.vocabularies.UI.v1.OperationGroupingType/ChangeSet"
	 * 				   for every actition call a new group is used.
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution of the action
	 * @throws {Error} Throws an error if the OData function import does not exist or the action input parameters are invalid
	 *
	 * @public
	 */
	ApplicationController.prototype.invokeActions = function (sFunctionName, aContexts, mParameters) {
		var oContext, i, len, fnChanges, aPromises = [], oSideEffect;
		mParameters = mParameters || {};

		len = aContexts.length;
		fnChanges = this._getChangeSetFunc(sFunctionName, aContexts, mParameters.operationGrouping);

		if (len === 0) {
			aPromises.push(this._invokeAction(sFunctionName, null, null, mParameters.urlParameters));
		} else {
			// Fire all Actions and bring them in order
			for (i = 0; i < len; i++) {
				aPromises.push(this._invokeAction(sFunctionName, aContexts[i], fnChanges(i), mParameters.urlParameters));
			}
		}

		// check if side effect is annotated and if a validate or prepare shall be sent
		var oFunctionImport = this._oModel.getMetaModel().getODataFunctionImport(sFunctionName);
		for (var p in oFunctionImport) {
			if (jQuery.sap.startsWith(p, "com.sap.vocabularies.Common.v1.SideEffects")) {
				oSideEffect = oFunctionImport[p];
				break;
			}
		}

		if (oSideEffect) {
			this._executeSideEffectsForActions(oSideEffect, aContexts);
		}

		// trigger submitting the batch.
		mParameters = {
			batchGroupId: "Changes",
			changeSetId: "Action" + fnChanges(i + 1),
			successMsg: "Call of action succeeded",
			failedMsg: "Call of action failed",
			//urlParameters: mParameters.urlParameters,
			forceSubmit: true,
			context: oContext
		};

		aPromises.push(this.triggerSubmitChanges(mParameters));

		return this._newPromiseAll(aPromises).then(function (aResponses) {
			var i, bAtLeastOneSuccess = false;

			if (aResponses && aResponses.length > aContexts.length) {
				aResponses.pop(); //last response from triggerSubmitChanges, remove to the outside world
			}

			if (aContexts.length <= aResponses.length) {
				for (i = 0; i < aContexts.length; i++) {
					aResponses[i].actionContext = aContexts[i];
					if (!aResponses[i].error) {
						bAtLeastOneSuccess = true;
					}
				}
				if (aContexts.length === 0) {
					for (i = 0; i < aResponses.length; i++) {
						if (!aResponses[i].error) {
							bAtLeastOneSuccess = true;
						}
					}
				}
			}

			if (bAtLeastOneSuccess) {
				return aResponses;
			} else {
				return Promise.reject(aResponses);
			}
		});
	};


	/**
	 * executes annotated side effect for properties/navigation properties or navigation entities. If no properties
	 * or entities are passed the unspecified side effect is executed which reads either the annotated targets of the
	 * unspecified side effect or in case of no available annotation a complete model refresh
	 *
	 * @param {sap.ui.model.Context} oContext The given binding context
	 * @param {array} aSourceProperties An array of properties of the given context or properties in a 1:1 association
	 * 								    for those side effects shall be executed
	 * @param {array} aSourceEntities An array of entities (navigation properties) for those side effects shall be executed.
	 * @param {boolean} bForceGlobalRefresh If not set to <code>false</code> explicitly a global model refresh is triggered.
	 *
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution of the action.
	 *
	 * @public
	 */
	ApplicationController.prototype.executeSideEffects = function (oContext, aSourceProperties, aSourceEntities, bForceGlobalRefresh) {
		var oSideEffect, sNavigationPath, sProperty, bExecuteSideEffect, fnRequest, sQualifier;
		var bGlobal = !aSourceProperties && !aSourceEntities;
		var mRequests = {
			bGlobal: false,
			aRequests: []
		};
		var mParams = {
			batchGroupId: "Changes",
			changeSetId: "SideEffects",
			noShowSuccessToast: true,
			forceSubmit: true,
			noBlockUI: true,
			urlParameters: {}
		};
		var sEntitySet = ModelUtil.getEntitySetFromContext(oContext);
		var oMetaModel = oContext.getModel().getMetaModel();
		var sEntityType = oMetaModel.getODataEntitySet(sEntitySet).entityType;
		var oEntityType = oMetaModel.getODataEntityType(sEntityType);
		var i = 0;

		bForceGlobalRefresh = !(bForceGlobalRefresh === false);

		aSourceEntities = aSourceEntities || [];
		aSourceProperties = aSourceProperties || [];

		var fnExecuteSideEffect = function (oSideEffect) {

			// set the side effects qualifier as action input.
			if (sQualifier) {
				mParams.urlParameters.SideEffectsQualifier = sQualifier;
			} else {
				delete mParams.urlParameters.SideEffectsQualifier;
			}

			this._executeSideEffects(oSideEffect, oContext, mParams, mRequests);
			if (mRequests.aRequests[0]) {
				fnRequest = mRequests.aRequests[0];
				fnRequest(mRequests.bGlobal);
				mRequests.aRequests = [];
			}
		}.bind(this);

		for (var p in oEntityType) {
			if (jQuery.sap.startsWith(p, "com.sap.vocabularies.Common.v1.SideEffects")) {
				oSideEffect = oEntityType[p];
				bExecuteSideEffect = false;

				sQualifier = this._getSideEffectsQualifier(p);

				if (bGlobal) {
					if (!oSideEffect.SourceProperties && !oSideEffect.SourceEntities) {
						fnExecuteSideEffect(oSideEffect);
						bExecuteSideEffect = true;
						break;
					}
				} else {
					if (oSideEffect.SourceEntities && oSideEffect.SourceEntities.length) {
						for (i = 0; i < oSideEffect.SourceEntities.length; i++) {
							sNavigationPath = oSideEffect.SourceEntities[i].NavigationPropertyPath;
							if (aSourceEntities.indexOf(sNavigationPath) !== -1) {
								bExecuteSideEffect = true;
							}
						}
					}
					if (!bExecuteSideEffect && oSideEffect.SourceProperties && oSideEffect.SourceProperties.length) {
						for (i = 0; i < oSideEffect.SourceProperties.length; i++) {
							sProperty = oSideEffect.SourceProperties[i].PropertyPath;
							if (aSourceProperties.indexOf(sProperty) !== -1) {
								bExecuteSideEffect = true;
							}
						}
					}
					if (bExecuteSideEffect) {
						fnExecuteSideEffect(oSideEffect);
					}
				}
			}
		}

		if (mRequests.bGlobal || (bGlobal && !bExecuteSideEffect)) {

			if (bGlobal && bForceGlobalRefresh) {

				// global side effect, no side effect annotated therefore fallback is a prepare
				//if bForceGlobalRefresh is true,then refresh
				fnExecuteSideEffect({});
			}
			// unspecified side effect: so execute refresh of the complete model.
			// if false then do not update model.
			if (bForceGlobalRefresh) {
				this._oModel.refresh(true, false, "Changes");
			}
		}


		// trigger flush.
		var oPromise = this.triggerSubmitChanges({
			batchGroupId: "Changes",
			noShowSuccessToast: true,
			forceSubmit: true,
			noBlockUI: true,
			urlParameters: {},
			draftSave: this._oModel.hasPendingChanges()
		});

		this.fireEvent("beforeSideEffectExecution", {
			promise: oPromise,
			valueChange: mRequests.bValueChange,
			validationMessage: mRequests.bValidationMessage,
			fieldControl: mRequests.bFieldControl
		});

		return oPromise;
	};

	/**
	 * Returns a promise which resolves if the given promises have been executed with at least one successfully. It rejects if all given promises were rejected.
	 *
	 * @param {array} aPromises Array containing promises and a flag if the result should be included in the response
	 * @returns {object} A promise which will wait for all given promises to finish
	 * @private
	 */
	ApplicationController.prototype._newPromiseAll = function (aPromises) {
		var aResponses = [];
		var oReadyPromise = Promise.resolve(null);

		aPromises.forEach(function (oPromise) {
			oReadyPromise = oReadyPromise.then(function () {
				return oPromise;
			}).then(function (oResponse) {
				aResponses.push({ response: oResponse });
			}, function (oError) {
				aResponses.push({ error: oError });
			});
		});

		return oReadyPromise.then(function () {
			return Promise.resolve(aResponses);
		});
	};

	/**
	 * Returns a function to calculate the changeset ID (used in action processing). If only
	 * one context instance is supplied, only one changeset is created, which contains the action
	 * invocation and possibly existing changes. When two or more contexts are provided there are
	 * two possible ways to handle:
	 * - one changeset for property/entity changes and one changeset per action invocation could be created
	 * or
	 * - possible changes and all the action invocations could be put into the same change set.
	 *
	 * Which way of processing is used depends on the action's annotations.
	 *
	 * @param {string} sFunctionName The name of the function or action.
	 * @param {array} aContexts The given binding contexts.
	 * @param {string} sOperationGrouping If this is set to "com.sap.vocabularies.UI.v1.OperationGroupingType/ChangeSet" single contexts are used.
	 * @returns {function} A function to calculate the change set ID.
	 *
	 * @private
	 */
	ApplicationController.prototype._getChangeSetFunc = function (sFunctionName, aContexts, sOperationGrouping) {
		var len = aContexts.length;
		var fnSingle = function () {
			return "Changes";
		};

		// make sure that always the same change set is used, if the action is executed for one context instance only.
		if (len === 1) {
			return fnSingle;
		}

		// OperationGrouping ChangeSet results that all action calls are put into one changeSet
		if (sOperationGrouping === "com.sap.vocabularies.UI.v1.OperationGroupingType/ChangeSet") {
			return fnSingle;
		}

		// return as default different change set IDs for multiple contexts - at least for the time being.
		return function (i) {
			return "Changes" + i;
		};
	};

	/**
	 * Creates a context for an action call (OData function import)
	 *
	 * @param {string} sFunctionName Name of the function import that shall be triggered.
	 * @param {object} oEntityContext The given binding context of the object on which the action is called.
	 * @param {map} mParameters Parameters to control the behavior of the request.
	 *
	 * @returns {map} A <code>map</code> that contains two Promises:
	 *                <code>context</code> which provides the action-specific model context to the resolve function
	 *                <code>result</code> which resolves when the success handler is called and rejects when the error handler is called;
	 * 				  The result of the promises is noramlized in both cases, error and success.
	 *
	 * @since 1.38
	 * @experimental
	 * @public
	 */
	ApplicationController.prototype.getNewActionContext = function (sFunctionName, oEntityContext, mParameters) {

		var that = this;
		mParameters = jQuery.extend({
			batchGroupId: "Changes",
			changeSetId: "SingleAction",
			successMsg: "Call of action succeeded",
			failedMsg: "Call of action failed",
			forceSubmit: true,
			context: oEntityContext,
			functionImport: this._oMeta.getODataFunctionImport(sFunctionName.split("/")[1])
		}, mParameters);

		var oFuncHandle = this._createFunctionContext(oEntityContext, mParameters);

		// Add "formatters" for error and success messages
		oFuncHandle.result = oFuncHandle.result.then(function (oResponse) {
			return that._normalizeResponse(oResponse, true);
		}, function (oResponse) {
			var oOut = that._normalizeError(oResponse);
			throw oOut;
		});

		return oFuncHandle;
	};

	/**
	 * Builds a consistent chain for all given actions and their implicit dependencies (e.g. side effects)
	 * and submits the changes to the back-end.
	 *
	 * @param {object} oEntityContext the context of the entity the function import is called on
	 * @param {object} oActionContext Either one or an array of action context objects
	 *        created by {@link sap.ui.generic.app.ApplicationController#createActionContext}
	 * @param {string} sFunctionName The name of the function or action
	 *
	 * @since 1.38
	 * @experimental
	 * @private
	 */
	ApplicationController.prototype.submitActionContext = function (oEntityContext, oActionContext, sFunctionName) {
		var oSideEffect;

		// check if side effect is annotated and if a validate or prepare shall be sent
		var oFunctionImport = this._oModel.getMetaModel().getODataFunctionImport(sFunctionName);
		for (var p in oFunctionImport) {
			if (jQuery.sap.startsWith(p, "com.sap.vocabularies.Common.v1.SideEffects")) {
				oSideEffect = oFunctionImport[p];
				break;
			}
		}

		if (oSideEffect) {
			//execute side effect on entity
			this._executeSideEffectsForActions(oSideEffect, [oEntityContext]);
		}


		this.triggerSubmitChanges({
			batchGroupId: "Changes",
			successMsg: "Call of action succeeded",
			failedMsg: "Call of action failed",
			//urlParameters: mParameters.urlParameters,
			forceSubmit: true,
			context: oActionContext
		});
	};

	/**
	 * Invokes an action with the given name and submits changes to the back-end.
	 *
	 * @param {string} sFunctionName The name of the function or action.
	 * @param {sap.ui.model.Context} oContext The given binding context.
	 * @param {string} sChangeSetID the ID of the change set to place the action invocation in.
	 * @param {map} mUrlParams Parameter map with additional URL parameters.
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution of the action.
	 * @throws {Error} Throws an error if the OData function import does not exist or the action input parameters are invalid.
	 *
	 * @experimental Since 1.32.0
	 *
	 * @private
	 */
	ApplicationController.prototype._invokeAction = function (sFunctionName, oContext, sChangeSetID, mUrlParams) {
		var that = this;
		var mParameters = {
			batchGroupId: "Changes",
			changeSetId: sChangeSetID,
			successMsg: "Call of action succeeded",
			failedMsg: "Call of action failed",
			urlParameters: mUrlParams,
			forceSubmit: true,
			context: oContext
		};

		return this._callAction(sFunctionName, oContext, mParameters).then(function (oResponse) {
			return that._normalizeResponse(oResponse, true);
		}, function (oResponse) {
			var oOut = that._normalizeError(oResponse);
			throw oOut;
		});
	};

	/**
	 * Frees all resources claimed during the life-time of this instance.
	 *
	 * @experimental Since 1.32.0
	 * @public
	 */
	ApplicationController.prototype.destroy = function () {
		BaseController.prototype.destroy.apply(this, []);

		if (this._oTransaction) {
			this._oTransaction.destroy();
		}

		this._oModel = null;
		this._oTransaction = null;
		this._oGroupChanges = null;
	};

	return ApplicationController;

}, true);
