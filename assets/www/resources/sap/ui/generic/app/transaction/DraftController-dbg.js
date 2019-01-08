/*
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([	"jquery.sap.global", "./BaseController", "./DraftContext" ], function(jQuery, BaseController, DraftContext) {
	"use strict";

	/* global Promise */

	/**
	 * Constructor for a new draft controller instance.
	 *
	 * @public
	 * @class Gives access to runtime draft handling for applications. Assuming state-less communication, each single data modification request (or
	 *        change set in an OData $batch request) is a "mini-transaction", which saves data to the database. The class implements the transactional
	 *        interaction patterns specified for OData services that support draft documents and provides methods for draft-specific actions, for
	 *        example validate, prepare, activate.
	 *
	 *        Additionally, it handles transactional request processing, ensures concurrency control and correct
	 *        ETag handling. It provides access to the simple interaction patterns of runtime handling for drafts according to the draft
	 *        specification. These can be combined as required by client applications. Additionally, error handling is provided to notify client
	 *        implementations of error situations. The event <code>fatalError</code> is thrown, if fatal errors occur during execution of OData
	 *        requests.
	 * @author SAP SE
	 * @version 1.52.4
	 * @since 1.30.0
	 * @alias sap.ui.generic.app.transaction.DraftController
	 * @param {sap.ui.model.odata.ODataModel} oModel The OData model currently used
	 * @param {sap.ui.generic.app.util.Queue} oQueue Optional HTTP request queue
	 * @throws {Error} Throws an error if no model is handed over as input parameter
	 */
	var DraftController = BaseController.extend("sap.ui.generic.app.transaction.DraftController", {
		metadata: {
			publicMethods: [
				"getDraftContext", "getDraftForActiveEntity", "createNewDraftEntity", "createEditDraftEntity", "validateDraftEntity", "validateDraft", "prepareDraft", "prepareDraftEntity", "saveAndPrepareDraftEntity", "activateDraftEntity", "isActiveEntity", "hasActiveEntity", "destroy"
			]
		},

		constructor: function(oModel, oQueue) {
			BaseController.apply(this, [
				oModel, oQueue
			]);
			this.sName = "sap.ui.generic.app.transaction.DraftController";
			this._oContext = null;
		}
	});

	/**
	 * Returns the current draft context instance. If no instance exists, it is created lazily.
	 *
	 * @returns {sap.ui.generic.app.transaction.DraftContext} The current draft context instance
	 * @public
	 */
	DraftController.prototype.getDraftContext = function() {
		if (!this._oContext) {
			this._oContext = new DraftContext(this._oModel);
		}

		return this._oContext;
	};

	/**
	 * Creates a new draft instance.
	 *
	 * @param {string} sEntitySet The name of the entity set
	 * @param {string} sPath Path identifying the new entity instance
	 * @param {map} mParameters Parameters to control the behavior of the request
	 * @param {string} mParameters.batchGroupId The ID of the batch group to use
	 * @param {string} mParameters.changeSetId The ID of the change set to use
	 * @param {array | object} [mParameters.predefinedValues] An array that specifies a set of properties or the entry
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution
	 * @throws {Error} Throws an error if no entity set is handed over as input parameter
	 * @private
	 */
	DraftController.prototype.createDraft = function(sEntitySet, sPath, mParameters) {
		var that = this;

		if (!sEntitySet) {
			throw new Error("No entity set");
		}

		mParameters = mParameters || {};

		return new Promise(function(resolve, reject) {
			var fnSuccess = function(oData, oResponse) {
				resolve({
					responseData: oData,
					httpResponse: oResponse
				});
			};

			var createdContext;
			var fnError = function(oError){
				that._oModel.deleteCreatedEntry(createdContext);
				reject(oError);
			};

			createdContext = that._oModel.createEntry(sPath, {
				properties: mParameters.predefinedValues,
				success: fnSuccess,
				error: fnError,
				batchGroupId: mParameters.batchGroupId,
				changeSetId: mParameters.changeSetId
			});
		});
	};

	/**
	 * Validates a draft in the back-end.
	 *
	 * @param {sap.ui.model.Context} oContext The given binding context
	 * @param {map} mParameters Parameters to control the behavior
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution
	 * @throws {Error} Throws an error if no context is handed over as input parameter or if the function import does not exist or the action input
	 *         parameters are invalid
	 * @private
	 */
	DraftController.prototype.validateDraft = function(oContext, mParameters) {
		if (!oContext.getModel().getObject(oContext.getPath()).IsActiveEntity) {
			var oImport = this.getDraftContext().getODataDraftFunctionImportName(oContext, "ValidationFunction");
			return this._callAction(oImport, oContext, mParameters);
		} else {
			return Promise.resolve();
		}
	};

	/**
	 * Prepares a draft in the back-end.
	 *
	 * @param {sap.ui.model.Context} oContext The given binding context
	 * @param {map} mParameters Parameters to control the behavior
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution
	 * @throws {Error} Throws an error if no context is handed over as input parameter or if the function import does not exist or the action input
	 *         parameters are invalid
	 * @private
	 */
	DraftController.prototype.prepareDraft = function(oContext, mParameters) {
		if (!oContext.getModel().getObject(oContext.getPath()).IsActiveEntity) {
			var oImport;
	
			mParameters = mParameters || {};
			mParameters.urlParameters = mParameters.urlParameters || {};
	
			oImport = this.getDraftContext().getODataDraftFunctionImportName(oContext, "PreparationAction");
			return this._callAction(oImport, oContext, mParameters);
		} else {
			return Promise.resolve();
		}

	};

	/**
	 * Activates a draft in the back-end.
	 *
	 * @param {sap.ui.model.Context} oContext The given binding context
	 * @param {map} mParameters Parameters to control the behavior
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution
	 * @throws {Error} Throws an error if no context is handed over as input parameter or if the function import does not exist or the action input
	 *         parameters are invalid
	 * @private
	 */
	DraftController.prototype.activateDraft = function(oContext, mParameters) {
		var oImport = this.getDraftContext().getODataDraftFunctionImportName(oContext, "ActivationAction");
		return this._callAction(oImport, oContext, mParameters);
	};

	/**
	 * Creates an edit draft in the back-end.
	 *
	 * @param {sap.ui.model.Context} oContext The given binding context
	 * @param {map} mParameters Parameters to control the behavior
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution
	 * @throws {Error} Throws an error if no context is handed over as input parameter or if no EditAction exists
	 *         or if mParameters are invalid
	 * @private
	 */
	DraftController.prototype.editDraft = function(oContext, mParameters) {
		var sImportName = this.getDraftContext().getODataDraftFunctionImportName(oContext, "EditAction");
		if (sImportName){
			return this._callAction(sImportName, oContext, mParameters);
		}
		throw new Error(oContext ? "No Edit action defined for the given context" : "No context provided for the Edit action");
	};

	/**
	 * Removes a draft in the back-end.
	 *
	 * @param {sap.ui.model.Context} oContext The given binding context
	 * @param {map} mParameters Parameters to control the behavior
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution
	 * @throws {Error} Throws an error if no context is handed over as input parameter
	 * @private
	 */
	DraftController.prototype.discardDraft = function(oContext, mParameters) {
		if (!oContext) {
			throw new Error("No context");
		}

		return this._remove(oContext.getPath(), mParameters);
	};

	/**
	 * Retrieves a possibly existing draft entity for the given active entity using the binding context of the active entity from the back-end.
	 *
	 * @param {sap.ui.model.Context} oContext The binding context of the active entity
	 * @param {map} mParameters Parameters to control the behavior
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution
	 * @throws {Error} Throws an error if no context is handed over as input parameter
	 * @private
	 * @since 1.32.0
	 */
	DraftController.prototype.getDraftForActive = function(oContext, mParameters) {
		var that = this;

		if (!oContext) {
			throw new Error("No context");
		}

		mParameters = mParameters || {};
		mParameters.urlParameters = {
			"$expand": "SiblingEntity"
		};

		return this._read(oContext.getPath(), mParameters).then(function(oResponse) {
			if (oResponse.responseData && oResponse.responseData.hasOwnProperty("SiblingEntity")) {
				oResponse.context = that._oModel.getContext("/" + that._oModel.getKey(oResponse.responseData.SiblingEntity));
				return oResponse;
			}

			throw new Error("No draft entity could be found");
		});
	};

	/**
	 * Retrieves a possibly existing draft entity for the given active entity using the binding context of the active entity from the back-end.
	 *
	 * @param {sap.ui.model.Context} oContext The binding context of the active entity
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution
	 * @throws {Error} Throws an error if no context is handed over as input parameter
	 * @public
	 * @since 1.32.0
	 */
	DraftController.prototype.getDraftForActiveEntity = function(oContext) {
		var oPromise, oPromise2, that = this, mParameters = {
			batchGroupId: "Changes",
			changeSetId: "Changes",
			noShowSuccessToast: true,
			forceSubmit: true
		};

		oPromise = this.getDraftForActive(oContext, mParameters).then(function(oResponse) {
			return oResponse;
		}, function(oResponse) {
			throw that._normalizeError(oResponse);
		});
		oPromise2 = this.triggerSubmitChanges(mParameters);

		// continue, if all "sub-ordinate" promises have been resolved.
		return this._returnPromiseAll([
			oPromise, oPromise2
		]);
	};

	/**
	 * Creates a new edit draft on the client and sends it to the back-end. Additionally, possible changes that have been collected on the client are
	 * sent to the back-end.
	 *
	 * @param {string} sEntitySet The name of the entity set
	 * @param {string} sPath Path identifying the new entity instance
	 * @param {array | object} [vPredefinedValues] An array that specifies a set of properties or the entry
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution of the request
	 * @public
	 */
	DraftController.prototype.createNewDraftEntity = function(sEntitySet, sPath, vPredefinedValues) {
		var that = this;
		var sId4BatchGroupAndChangeSet = "Changes";
		var mParameters1 = {
			predefinedValues: vPredefinedValues,
			batchGroupId: sId4BatchGroupAndChangeSet,
			changeSetId: sId4BatchGroupAndChangeSet
		};

		var oPromise1 = this.createDraft(sEntitySet, sPath, mParameters1).then(function(oResponse) {
			return that._normalizeResponse(oResponse, true);
		}, function(oResponse) {
			var oResponseOut = that._normalizeError(oResponse);
			throw oResponseOut;
		});
		
		var mParameters2 = {
			batchGroupId: sId4BatchGroupAndChangeSet,
			changeSetId: sId4BatchGroupAndChangeSet,
			noShowSuccessToast: true,
			forceSubmit: true,
			failedMsg: "New draft document could not be created"
		};
		var oPromise2 = this.triggerSubmitChanges(mParameters2).then(function() {
			return oPromise1.then(function(oResponse) {
				var bIsActiveEntity, bHasDraftEntity, oResponseEntity, oResponseOut = that._normalizeResponse(oResponse, true);

				// mind nesting of promises and error situation.
				if (oResponseOut.context) {
					oResponseEntity = oResponseOut.context.getObject();
				}

				if (!oResponseEntity) {
					jQuery.sap.log.error("Activate function returned no entity");
					return Promise.reject(new Error("Activate function returned no entity"));
				}
				bIsActiveEntity = that._oDraftUtil.isActiveEntity(oResponseEntity);
				if (bIsActiveEntity) {
					jQuery.sap.log.error("New draft entity is not marked as draft - isActiveEntity = " + bIsActiveEntity);
					return Promise.reject("New draft entity is not marked as draft - isActiveEntity = " + bIsActiveEntity);
				}
				bHasDraftEntity = that._oDraftUtil.hasDraftEntity(oResponseEntity);
				if (bHasDraftEntity) {
					jQuery.sap.log.error("Wrong value for HasTwin of new draft entity - HasDraftEntity = " + bHasDraftEntity);
					return Promise.reject(new Error("Wrong value for HasTwin of new draft entity - HasDraftEntity = " + bHasDraftEntity));
				}

				return oResponseOut;
			});
		});

		// continue, if all "sub-ordinate" promises have been resolved.
		return this._returnPromiseAll([
			oPromise1, oPromise2
		]);
	};

	/**
	 * Creates an edit draft in the back-end. Additionally, possible changes that have been collected on the client are sent to the back-end.
	 *
	 * @param {sap.ui.model.Context} oContext The given binding context
	 * @param {boolean} [bPreserveChanges] Set to <code>true</code> to avoid the creation of a new draft when unsaved changes exist in the back-end
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution
	 * @public
	 */
	DraftController.prototype.createEditDraftEntity = function(oContext, bPreserveChanges) {
		var oPromise, oPromise2, that = this, mParameters = {
			batchGroupId: "Changes",
			changeSetId: "Changes",
			successMsg: "Draft for document was created",
			failedMsg: "Could not create draft for document",
			forceSubmit: true,
			context: oContext
		};
		if (bPreserveChanges) {
			mParameters.urlParameters = { PreserveChanges: true };
		}

		oPromise = this.editDraft(oContext, mParameters).then(function(oResponse) {
			var bIsActiveEntity, oResponseEntity, oResponseOut;

			oResponseOut = that._normalizeResponse(oResponse, true);

			// mind nesting of promises and error situation.
			if (oResponseOut.context) {
				oResponseEntity = oResponseOut.context.getObject();
			}

			if (!oResponseEntity) {
				jQuery.sap.log.error("Activate function returned no entity");
				return Promise.reject(new Error("Activate function returned no entity"));
			}

			bIsActiveEntity = that._oDraftUtil.isActiveEntity(oResponseEntity);
			if (bIsActiveEntity) {
				jQuery.sap.log.error("Edit function returned an entity which is not a draft instance - IsActiveEntity = " + bIsActiveEntity);
				return Promise.reject(new Error("Returned entity ist not a draft instance - IsActiveEntity = " + bIsActiveEntity));
			}

			return oResponseOut;
		}, function(oResponse) {
			var oResponseOut = that._normalizeError(oResponse);
			throw oResponseOut;
		});
		oPromise2 = this.triggerSubmitChanges(mParameters);

		// continue, if all "sub-ordinate" promises have been resolved.
		return this._returnPromiseAll([
			oPromise, oPromise2
		]);
	};

	/**
	 * Submits changes to the back-end and prepares an existing draft entity in the back-end for later activation by invoking the validation action.
	 * 
	 * @param {sap.ui.model.Context} oContext The given binding context
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution
	 * @public
	 */
	DraftController.prototype.validateDraftEntity = function(oContext) {
		var oPromise, oPromise2, that = this, mParameters = {
			batchGroupId: "Changes",
			changeSetId: "Changes",
			context: oContext,
			forceSubmit: true
		};

		oPromise = this.validateDraft(oContext, mParameters).then(function(oResponse) {
			return that._normalizeResponse(oResponse, true);
		}, function(oResponse) {
			var oResponseOut = that._normalizeError(oResponse);
			throw oResponseOut;
		});
		oPromise2 = this.triggerSubmitChanges(mParameters);

		// continue, if all "sub-ordinate" promises have been resolved.
		return this._returnPromiseAll([
			oPromise, oPromise2
		]);
	};

	/**
	 * Submits changes to the back-end and prepares a draft entity in the back-end for later activation by invoking the preparation action.
	 * 
	 * @param {sap.ui.model.Context} oContext The given binding context
	 * @param {map} mParameters Parameters to control the behavior of the request
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution
	 * @public
	 */
	DraftController.prototype.saveAndPrepareDraftEntity = function(oContext, mParameters) {
		var oPromise, oPromise2, that = this;

		mParameters = mParameters || {};
		mParameters.batchGroupId = "Changes";
		mParameters.changeSetId = "Changes";
		mParameters.successMsg = "Saved";
		mParameters.failedMsg = "Save failed";
		mParameters.context = oContext;
		mParameters.forceSubmit = true;

		oPromise = this.prepareDraft(oContext, mParameters).then(function(oResponse) {
			var bIsActiveEntity, oResponseEntity, oResponseOut;

			// mind nesting of promises and error situation.
			oResponseOut = that._normalizeResponse(oResponse, true);

			if (oResponseOut.context) {
				oResponseEntity = oResponseOut.context.getObject();
			}

			if (!oResponseEntity) {
				jQuery.sap.log.error("Activate function returned no entity");
				return Promise.reject(new Error("Activate function returned no entity"));
			}

			bIsActiveEntity = that._oDraftUtil.isActiveEntity(oResponseEntity);
			if (bIsActiveEntity) {
				jQuery.sap.log.error("Prepare function returned an entity which is not a draft instance - IsActiveEntity = " + bIsActiveEntity);
				return Promise.reject(new Error("Returned entity ist not a draft instance - IsActiveEntity = " + bIsActiveEntity));
			}

			return oResponseOut;
		}, function(oResponse) {
			var oResponseOut = that._normalizeError(oResponse);
			throw oResponseOut;
		});

		// to make sure that read operations and the prepare action are processed in the same OData request hand in the batch group.
		if (mParameters.binding) {
			mParameters.binding.refresh(true, "Changes");
		}

		oPromise2 = this.triggerSubmitChanges(mParameters);

		// continue, if all "sub-ordinate" promises have been resolved.
		return this._returnPromiseAll([
			oPromise, oPromise2
		]);
	};

	/**
	 * Submits changes to the back-end and prepares an existing draft entity in the back-end for later activation by invoking the preparation action.
	 * 
	 * @param {sap.ui.model.Context} oContext The given binding context
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution
	 * @public
	 */
	DraftController.prototype.prepareDraftEntity = function(oContext) {
		var that = this;

		return this.prepareDraft(oContext).then(function(oResponse) {
			var oResponseOut, oResponseEntity;

			oResponseOut = that._normalizeResponse(oResponse, true);
			oResponseEntity = oResponseOut.context.getObject();

			if (that._oDraftUtil.isActiveEntity(oResponseEntity)) {
				jQuery.sap.log.error("Prepare function returned an entity which is not a draft instance - IsActiveEntity = " + true);
				return Promise.reject(new Error("Returned entity ist not a draft instance - IsActiveEntity = " + true));
			}

			return oResponseOut;
		}, function(oResponse) {
			var oResponseOut = that._normalizeError(oResponse);
			throw oResponseOut;
		});
	};

	/**
	 * Submits changes to the back-end and activates a draft entity in the back-end.
	 * 
	 * @param {sap.ui.model.Context} oContext The given binding context
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution
	 * @public
	 */
	DraftController.prototype.activateDraftEntity = function(oContext) {
		var oPromise, oPromise2, that = this, mParameters = {
			batchGroupId: "Changes",
			changeSetId: "Changes",
			successMsg: "Document activated",
			failedMsg: "Activation of document failed",
			forceSubmit: true,
			context: oContext
		};

		oPromise = this.activateDraft(oContext, mParameters).then(function(oResponse) {
			var bIsActiveEntity, oResponseEntity, oResponseOut;

			// mind nesting of promises and error situation.
			oResponseOut = that._normalizeResponse(oResponse, true);

			if (oResponseOut.context) {
				oResponseEntity = oResponseOut.context.getObject();
			}

			if (!oResponseEntity) {
				jQuery.sap.log.error("Activate function returned no entity");
				return Promise.reject(new Error("Activate function returned no entity"));
			}

			bIsActiveEntity = that._oDraftUtil.isActiveEntity(oResponseEntity);
			if (!bIsActiveEntity) {
				jQuery.sap.log.error("Activate function returned an entity which is still a draft instance - IsActiveEntity = " + bIsActiveEntity);
				return Promise.reject(new Error("Returned entity is still a draft instance - IsActiveEntity = " + bIsActiveEntity));
			}

			return oResponseOut;
		}, function(oResponse) {
			var oResponseOut = that._normalizeError(oResponse);
			throw oResponseOut;
		});
		oPromise2 = this.triggerSubmitChanges(mParameters);

		// continue, if all "sub-ordinate" promises have been resolved.
		return this._returnPromiseAll([
			oPromise, oPromise2
		]);
	};

	/**
	 * Checks whether an entity set is active. The entity set name is derived from the given binding context
	 * 
	 * @param {sap.ui.model.Context} oContext The given binding context
	 * @returns {boolean} <code>true</code>, if a given entity set is active, <code>false</code> otherwise
	 * @throws {Error} Throws an error if no context is handed over as input parameter
	 * @public
	 */
	DraftController.prototype.isActiveEntity = function(oContext) {
		if (this.getDraftContext().hasDraft(oContext)) {
			return this._oDraftUtil.isActiveEntity(oContext.getObject());
		}

		return true;
	};

	/**
	 * Checks whether an entity has an active entity associated.
	 * 
	 * @param {sap.ui.model.Context} oContext The given binding context
	 * @returns {boolean} <code>true</code>, if an active entity exists, <code>false</code> otherwise
	 * @public
	 * @since 1.32.0
	 */
	DraftController.prototype.hasActiveEntity = function(oContext) {
		return this._oDraftUtil.hasActiveEntity(oContext.getObject());
	};

	/**
	 * Frees all resources claimed during the life-time of this instance.
	 * 
	 * @public
	 */
	DraftController.prototype.destroy = function() {
		if (this._oContext) {
			this._oContext.destroy();
		}

		this._oContext = null;
		this._oModel = null;

		BaseController.prototype.destroy.apply(this, []);
	};

	return DraftController;

}, true);