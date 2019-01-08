/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

//Provides class sap.fe.model.DraftModel
sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v4/ODataListBinding",
	"sap/ui/model/odata/v4/Context",
	"sap/ui/model/Filter",
	"sap/ui/base/ManagedObject",
	"sap/ui/model/ChangeReason",
	"sap/ui/model/resource/ResourceModel",
	"sap/fe/core/internal/testableHelper"
], function (JSONModel, ODataListBinding, Context, Filter, ManagedObject, ChangeReason, ResourceModel, testableHelper) {
	"use strict";

	var MODELUPGRADENAMESPACE = "_$DraftModel";
	/* Just for support one can switch this in the debugger to have the internal private data added to the model */
	var bAddPrivateDataToModel = false;
	var REGEXFOREDITSTATEFILTER = /( and )?\(*IsActiveEntity eq.*$/g;

	/* Container for internal state per model. Needs to be destroyed with the model */
	var oPrivatModelData = {};

	/* Allow access for unit tests only */
	testableHelper.testableStatic(function () {
		bAddPrivateDataToModel = true;
	}, "addPrivateDataToModel");


	/**
	 * Stores private data
	 * @param {sap.ui.model.odata.v4.ODataModel} oModel OData v4 model instance
	 * @param {String} sKey key that is the target for the data in the object
	 * @param {Object} oData data to be stored
	 */
	function storeData(oModel, sKey, oData) {
		var oModelId = typeof oModel === "string" ? oModel : oModel.getId(),
			oPrivateData = oPrivatModelData[oModelId] = oPrivatModelData[oModelId] || {};
		oPrivateData[sKey] = oData;
		if (bAddPrivateDataToModel && !oModel[MODELUPGRADENAMESPACE]) {
			oModel[MODELUPGRADENAMESPACE] = oPrivateData;
		}
	}

	/**
	 * Retrieves private data from the model
	 * @param {sap.ui.model.odata.v4.ODataModel} oModel OData v4 model instance
	 * @param {String} sKey key that is the target for the data in the object
	 * @returns {Object} oData data to be stored
	 */
	function getData(oModel, sKey) {
		var oModelId = typeof oModel === "string" ? oModel : oModel.getId();
		return oPrivatModelData[oModelId] && oPrivatModelData[oModelId][sKey];
	}

	/**
	 * Enum for edit state of a document in an draft enabled service collection.
	 * Allows to simplify filtering on a set of documents as described by the
	 * individual state
	 * @alias sap.fe.model.DraftModel.EDITSTATE
	 * @readonly
	 * @enum {String}
	 * @private
	 * @sap-restricted
	 */
	var EDITSTATE = {
		/**
		 * Active documents that don't have a corresponding draft and all own draft documents
		 * @private
		 * @sap-restricted
	 	 */
		ALL: "0",
		/**
		 * Active documents that don't have a draft document
		 * @private
		 * @sap-restricted
		 */
		UNCHANGED: "1",
		/**
		 * Own draft documents
		 * @private
		 * @sap-restricted
		 */
		OWN_DRAFT: "2",
		/**
		 * Active documents that are locked by other users
		 * @private
		 * @sap-restricted
		 */
		LOCKED: "3",
		/**
		 * Active documents that have draft documents by other users
		 * @private

		 * @sap-restricted
		 */
		UNSAVED_CHANGES: "4"
	};
	testableHelper.testableStatic(EDITSTATE, "EDITSTATE");

	/**
	 * Transforms the internal editState into static filters for the list binding
	 * @param {String} sEditState id of the editState to be transformed
	 * @returns {String} OData compatible part of a $filter expression reflecting the state
	 */
	function getFilterForEditState(sEditState) {
		var sFilter = "";
		switch (sEditState) {
			case EDITSTATE.UNCHANGED:
				sFilter = "(IsActiveEntity eq true and HasDraftEntity eq false)";
				break;
			case EDITSTATE.OWN_DRAFT:
				sFilter = "(IsActiveEntity eq false)";
				break;
			case EDITSTATE.LOCKED:
				sFilter = "(IsActiveEntity eq true and SiblingEntity/IsActiveEntity eq null and DraftAdministrativeData/InProcessByUser ne '')";
				break;
			case EDITSTATE.UNSAVED_CHANGES:
				sFilter = "(IsActiveEntity eq true and SiblingEntity/IsActiveEntity eq null and DraftAdministrativeData/InProcessByUser eq '')";
				break;
			default:
				//EDITSTATE.ALL
				sFilter = "(IsActiveEntity eq false or SiblingEntity/IsActiveEntity eq null)";
				break;
		}
		return sFilter;
	}

	/* Allow access for unit tests only */
	testableHelper.testableStatic(getFilterForEditState, "getFilterForEditState");

	/**
	 * Get all EntitySets with all EntitySet annotations
	 * @param {sap.ui.model.odata.v4.ODataModel} oModel OData v4 model instance
	 * @returns {Array} Array of entity sets including annotations in @ and @sapui.name
	 */
	function getAllEntitySets(oModel) {
		var oMetaModel = oModel.getMetaModel(),
			aEntitySets = getData(oModel, "aEntitySets"),
			containerPromise = aEntitySets ? Promise.resolve(aEntitySets) : oMetaModel && oMetaModel.requestObject("/").then(function (oEntityContainer) {
				var aPromises = [];
				Object.keys(oEntityContainer).forEach(function (key) {
					var oElement = oEntityContainer[key], oPromise;
					if (oElement.$kind === "EntitySet") {
						oPromise = oMetaModel.requestObject("/" + key + "@");
						/* eslint max-nested-callbacks: 0 */
						aPromises.push(oPromise.then(function (oEntitySetAnnotations) {
							var oEntitySetAnnotation = {};
							/* Merge annotations to the entitySet object */
							oEntitySetAnnotation["@"] = oEntitySetAnnotations;
							oEntitySetAnnotation["@sapui.name"] = key;
							return oEntitySetAnnotation;
						}));
					}
				});
				return Promise.all(aPromises);
			});
		return containerPromise;
	}

	/**
	 * Creates an operation context binding for the given operation
	 * @param {sap.ui.model.odata.v4.Context} oContext The context that should be bound to the operation
	 * @param {String} sOperation The operation (action or function import)
	 * @return {sap.ui.model.odata.v4.ODataContextBinding} The context binding of the bound operation
	 */
	function createOperation(oContext, sOperation) {
		var oModel = oContext.getModel();
		return oModel.bindContext(sOperation + "(...)", oContext);
	}

	/* function templates of operations */

	/**
	 * Activates a draft document. The draft will replace the sibling entity and will be deleted by the backend
	 * @function
	 * @name sap.fe.model.DraftModel.upgradedContext#executeDraftActivationAction
	 * @returns {Promise.<sap.ui.model.odata.v4.Context>} Resolve function returns the context of the operation
	 * @private
	 * @sap-restricted
	 */
	function executeDraftActivationAction() {
		if (!this.getProperty("IsActiveEntity")) {
			var oOperation = createOperation(this, arguments[0]);
			return oOperation.execute().then(function() {
				return oOperation;
			});
		} else {
			throw new Error("The activation action cannot be executed on an active document");
		}
	}

	/**
	 * Execute a preparation action
	 * @function
	 * @name sap.fe.model.DraftModel.upgradedContext#executeDraftPreparationAction
	 * @param {String} [sideEffectsQualifier] Limits the prepare activities to a given side effects group specified by this qualifier
	 * @returns {Promise.<sap.ui.model.odata.v4.Context>} Resolve function returns the context of the operation
	 * @private
	 * @sap-restricted
	 */
	function executeDraftPreparationAction(sideEffectsQualifier) {
		if (!this.getProperty("IsActiveEntity")) {
			var oOperation = createOperation(this, arguments[0]);
			/* Fix arguments */
			sideEffectsQualifier = arguments[1];
			if (typeof sideEffectsQualifier === "undefined") {
				sideEffectsQualifier = "";
			}
			oOperation.setParameter("SideEffectsQualifier", sideEffectsQualifier);
			return oOperation.execute().then(function() {
				return oOperation;
			});
		} else {
			throw new Error("The preparation action cannot be executed on an active document");
		}
	}

	/**
	 * Executes validation of a draft function
	 * @function
	 * @name sap.fe.model.DraftModel.upgradedContext#executeDraftValidationFunction
	 * @returns {Promise.<sap.ui.model.odata.v4.Context>} Resolve function returns the context of the operation
	 * @private
	 * @sap-restricted
	 */
	function executeDraftValidationFunction() {
		if (!this.getProperty("IsActiveEntity")) {
			var oOperation = createOperation(this, arguments[0]);
			return oOperation.execute().then(function() {
				return oOperation;
			});
		} else {
			throw new Error("The validation function cannot be executed on an active document");
		}
	}

	/**
	 * Creates a new draft from an active document
	 * @function
	 * @name sap.fe.model.DraftModel.upgradedContext#executeDraftEditAction
	 * @param {Boolean} preserveChanges
	 *  <ul>
	 * 		<li>true - existing changes from another user that are not locked are preserved and an error message (http status 409) is send from the backend</li>
	 * 		<li>false - existing changes from another user that are not locked are overwritten</li>
	 * 	</ul>
	 * @returns {Promise.<sap.ui.model.odata.v4.Context>} Resolve function returns the context of the operation
	 * @private
	 * @sap-restricted
	 */
	function executeDraftEditAction(preserveChanges) {
		if (this.getProperty("IsActiveEntity")) {
			var oOperation = createOperation(this, arguments[0]);
			/* Fix arguments */
			preserveChanges = arguments[1];
			oOperation.setParameter("PreserveChanges", preserveChanges);
			return oOperation.execute().then(function() {
				return oOperation;
			});
		} else {
			throw new Error("The edit action cannot be executed on a draft document");
		}
	}

	/**
	 * @classdesc
	 * Only for documentation of the methods that are mixed into the {@link sap.ui.model.odata.v4.Context}
	 * if the context is part of a draft entitySet
	 * @namespace
	 * @alias sap.fe.model.DraftModel.upgradedContext
	 * @experimental This module is only for experimental use!
	 * @private
	 * @sap-restricted
	 */
	var oOperationTemplates = {
		/* draftOperations: */
		"ActivationAction": executeDraftActivationAction,
		"PreparationAction": executeDraftPreparationAction,
		"ValidationFunction": executeDraftValidationFunction,
		/* documentOperations: */
		"EditAction": executeDraftEditAction
	};

	/**
	 * Adds methods for creating bound operations on the context object
	 * @param {sap.ui.model.odata.v4.Context} oContext The context object that should get the operations
	 * @param {Object} oEntitySet The entitySet for the context
	 */
	function addOperationsToContext(oContext, oEntitySet) {
		var oOperations = oEntitySet["@"]["@com.sap.vocabularies.Common.v1.DraftRoot"];
		Object.keys(oOperations).forEach(function (operationName) {
			var sOperation = oOperations[operationName];
			oContext["executeDraft" + operationName] = oOperationTemplates[operationName].bind(oContext, sOperation);
		});
	}

	/**
	 * Check if this is a draft model.<br/>
	 *
	 * A model is considered a draft model if at least one entitySet of the OData service is annotated with one of the terms
	 * <ul>
	 *   <li>com.sap.vocabularies.Common.v1.DraftRoot</li>
	 *   <li>com.sap.vocabularies.Common.v1.DraftNode</li>
	 * </ul>
	 *
	 * @function
	 * @name sap.fe.model.DraftModel#isDraftModel
	 * @param {sap.ui.model.odata.v4.ODataModel} oModel OData v4 model instance
	 * @returns {Promise.<Boolean>} True if Draft Model
	 * @private
	 * @sap-restricted
	 * @static
	 */
	function isDraftModel(oModel) {
		/* Strategy: check if at least one entitySet is draft enabled */
		/* Load EntityContainer */
		return getAllEntitySets(oModel).then(function (aEntitySetWithAnnotations) {
			/* All entitySet annotations are avaialable */
			var aDraftEntitySetAnnotations = aEntitySetWithAnnotations.filter(function (oEntitySet) {
				var oAnnotations = oEntitySet["@"] || {};
				return oAnnotations.hasOwnProperty("@com.sap.vocabularies.Common.v1.DraftRoot") || oAnnotations.hasOwnProperty("@com.sap.vocabularies.Common.v1.DraftNode");
			}),
				isDraft = Array.isArray(aDraftEntitySetAnnotations) && aDraftEntitySetAnnotations.length > 0;
			if (isDraft) {
				/* it is very likely that we need the entiySet data again so save it to the model */
				storeData(oModel, "aEntitySets", aEntitySetWithAnnotations);
				storeData(oModel, "aDraftEntitySets", aDraftEntitySetAnnotations);
			}
			return isDraft;
		});
	}

	/**
	 * Merges a custom $filter in mParameters with the given edit state filter
	 * @param {String} sEditState id of the editState to be merged to the custom filter
	 * @param {String} sFilter the custome filter string
	 * @returns {String} The merged filter string (for $filter)
	 */
	function mergeEditStateFilterToFilter(sEditState, sFilter) {
		var sFilterValue = getFilterForEditState(sEditState, "");
		if (sFilter) {
			sFilter = "(" + sFilter + ") and " + sFilterValue;
		} else {
			sFilter = sFilterValue;
		}
		return sFilter;
	}

	/**
	 * Upgrades an OData v4 model to a draft model
	 *
	 * The model will overwrite the following methods to be able to serve data and keep state in an internal
	 * JSONModel:
	 *  <ul>
	 *        <li>bindList <ul>
	 *           <li>to add static filters to $filter and $expand to the binding for draft enabled EntitySets<li>
	 *        </ul></li>
	 * </ul>
	 * @param {sap.ui.model.odata.v4.ODataModel} oModel OData v4 model instance
	 * @private
	 */
	function _upgrade(oModel) {
		var fnOriginal = {},
			mListBindings = {},
			iListBindingIndex = -1, //index for mListBindings
			oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.fe"),
			oModelData = {
				/**
				 * editStates
				 * @constant For filtering documents by state e.g. own drafts, unchanged documents, etc
				 * @type {map}
				 */
				"editStates": [
					{ id: EDITSTATE.ALL, name: oResourceBundle.getText("SAPFE_DRAFT_ALL_FILTER") },
					{ id: EDITSTATE.UNCHANGED, name: oResourceBundle.getText("SAPFE_DRAFT_UNCHANGED_FILTER") },
					{ id: EDITSTATE.OWN_DRAFT, name: oResourceBundle.getText("SAPFE_DRAFT_OWN_DRAFT_FILTER") },
					{ id: EDITSTATE.LOCKED, name: oResourceBundle.getText("SAPFE_DRAFT_LOCKED_FILTER") },
					{ id: EDITSTATE.UNSAVED_CHANGES, name: oResourceBundle.getText("SAPFE_DRAFT_UNSAVED_CHANGES_FILTER") }
				],

				/*  We need the properties at least per entitySet (maybe even navigation props) */
				"entitySets": {}
			}, oInternalModel,
			aDraftEntitySets = getData(oModel, "aDraftEntitySets");

		storeData(oModel, "mListBindings", mListBindings);
		/* Allow access for unit tests only */
		testableHelper.testableStatic(function (oModel) {
			return getData(oModel, "mListBindings");
		}, "getOverwrittenListBindings");

		/* Work on draft entity sets */
		aDraftEntitySets.forEach(function (entitySet) {
			/* Create a draft management section for each draft entity set */
			oModelData.entitySets[entitySet["@sapui.name"]] = {
				editState: "0" //Default 'All'
			};
		});

		/* Provide access function */
		oInternalModel = new JSONModel(oModelData);

		storeData(oModel, "oDraftAccessModel", oInternalModel);
		oModel.getDraftAccessModel = getDraftAccessModel;
		/* React on internal model updates */
		oInternalModel.attachPropertyChange(function (oEvent) {
			var oParameter = oEvent.getParameters(),
				sPath = oParameter && (oParameter.path.indexOf("/entitySets") === 0 ? oParameter.path.split("/")[2] : false);
			if (sPath) {
				sPath = "/" + sPath;
				Object.keys(mListBindings).forEach(function (sKey) {
					var oBinding = mListBindings[sKey],
						mParameters = oBinding.mParameters, sCurrentFilter = "",
						sEditStateFilter = "", aResult = [];
					/* Check only list binding */
					if (oBinding instanceof ODataListBinding && oBinding.getPath() === sPath) {
						/* Change static filter values according to the edit state */
						sCurrentFilter = mParameters["$filter"];
						if (sCurrentFilter) {
							/* get rid of old edit state so the custom filter remains */
							aResult = sCurrentFilter.match(REGEXFOREDITSTATEFILTER);
							if (Array.isArray(aResult) && aResult[0]) {
								sEditStateFilter = aResult[0];
								sCurrentFilter = sCurrentFilter.replace(sEditStateFilter, "");
								//Remove first and last paranthesis */
								sCurrentFilter = sCurrentFilter.substr(1).slice(0, -1);
							}
						}
						mParameters["$filter"] = mergeEditStateFilterToFilter(oParameter.value, sCurrentFilter);
						oBinding.applyParameters(mParameters);
						oBinding.reset(sap.ui.model.ChangeReason.Change);
					}
				});
			}
		});

		/* Overwrite bindList */
		fnOriginal.bindList = oModel.bindList;
		oModel.bindList = function (sPath, oContext, vSorters, vFilters, mParameters) {
			/* Special handling for draft entity sets */
			var oEntitySetState = oInternalModel.getObject("/entitySets" + sPath),
				oListBinding, fnChangeParameters;

			if (oEntitySetState) {
				/* upgrade mParameters of ListBindng of Draft EntitySets only */
				var	sExpand = "";
				mParameters = mParameters || {};
				sExpand = mParameters.$expand;
				/* merge given $expand */
				if (sExpand) {
					if (sExpand.indexOf("DraftAdministrativeData") < 0) {
						sExpand += ",DraftAdministrativeData";
					}
				} else {
					sExpand = "DraftAdministrativeData";
				}
				mParameters.$expand = sExpand;
				mParameters.$filter = mergeEditStateFilterToFilter(oEntitySetState.editState, mParameters.$filter);
			}
			/* argument 4 is mParameters */
			arguments[4] = mParameters;
			oListBinding = fnOriginal.bindList.apply(this, arguments);

			if (oEntitySetState) {
				/* overwrite changeParameters method of ListBinding of Draft EntitySets only */
				fnChangeParameters = oListBinding.changeParameters;
				oListBinding.changeParameters = function (mParameters) {
					var oEntitySetState = oInternalModel.getObject("/entitySets" + sPath);
					mParameters.$filter = mergeEditStateFilterToFilter(oEntitySetState.editState, mParameters.$filter);
					return fnChangeParameters.call(this, mParameters);
				};
				/* keep a list of overwritten ListBindings */
				mListBindings[++iListBindingIndex] = oListBinding;
				/* overwrite destroy to remove from list. Since iListBindingIndex is native type we need a factory function */
				oListBinding.destroy = (function(index) {
					return function() {
						delete mListBindings[index];
						return ODataListBinding.prototype.destroy.apply(this, arguments);
					};
				})(iListBindingIndex);
			}
			return oListBinding;
		};

		/* Overwrite Context contstructor to add methods for bound (draft) operations if needed */
		fnOriginal.create = Context.create;
		Context.create = function (oModel, oBinding, sPath, iIndex, oCreatePromise) {
			var oContext = fnOriginal.create.apply(null, arguments),
				bFoundDraftEntitySet = false;
			/* Only manipulate if this is context of an upgraded model */
			if (getData(oModel, "bUpgraded") && sPath) {
				aDraftEntitySets.forEach(function (entitySet) {
					/* run only once so check if bFoundDraftEntitySet is not true already */
					var isDraftEntitySetPath = !bFoundDraftEntitySet && sPath.indexOf(entitySet["@sapui.name"]) === 1;
					if (isDraftEntitySetPath) {
						bFoundDraftEntitySet = true;
						addOperationsToContext(oContext, entitySet);
					}
				});
			}
			return oContext;
		};

		/* Clean up internal data in the destroy method */
		fnOriginal.modelDestroy = oModel.destroy;
		oModel.destroy = function () {
			delete oPrivatModelData[this.getId()];
			return fnOriginal.modelDestroy.apply(this, arguments);
		};
		/* Mark it as upgraded */
		storeData(oModel, "bUpgraded", true);
	}

	/**
	 * Upgrades an OData v4 model to a Draft Model. Throws an error if it is not a draft enabled service
	 * <p>The result of this function will mix new functions into instances of the following classes
	 * 	<ul>
	 * 		<li>{@link sap.ui.model.odata.v4.ODataModel}</li>
	 * 		<li>{@link sap.ui.model.odata.v4.Context}</li>
	 * </ul>
	 * Read the sections {@link sap.fe.model.DraftModel.upgradedModel}
	 * and {@link sap.fe.model.DraftModel.upgradedContext} for more information about the added functions
	 * </p>
	 * @example <caption>Example usage of upgrade</caption>
	 * var oModel = new ODataModel(...);
	 * DraftModel.upgrade(oModel).then(function() {
	 * 	oView.setModel(oModel);
	 * 	oView.setModel(oModel.getDraftAccessModel(), "$draft");
	 * });
	 * @function
	 * @name sap.fe.model.DraftModel#upgrade
	 * @param {sap.ui.model.odata.v4.ODataModel} oModel OData v4 model instance
	 * @returns {Promise} Resolves once the model is upgraded
	 * @throws Will throw an error if the service doesn't have any draft entity sets
	 * @private
	 * @sap-restricted
	 * @static
	 */
	function upgrade(oModel) {
		/* only upgrade draft models */
		return isDraftModel(oModel).then(function (isDraft) {
			if (isDraft) {
				/* preparation */
				_upgrade(oModel);
			} else {
				throw new Error("The model is not draft enabled");
			}
		});
	}

	/**
	 * Upgrades an OData v4 model to a Draft Model if it is a draft enbled service and
	 * leave it as is if not.
	 * @see {@link sap.fe.model.DraftModel#upgrade} for more information
	 * @function
	 * @name sap.fe.model.DraftModel#upgradeOnDemand
	 * @param {sap.ui.model.odata.v4.ODataModel} oModel OData v4 model instance
	 * @returns {Promise.<Boolean>} True if Draft Model detected and upgraded
	 * @private
	 * @sap-restricted
	 * @static
	 */
	function upgradeOnDemand(oModel) {
		/* only upgrade draft models */
		return isDraftModel(oModel).then(function (isDraft) {
			if (isDraft) {
				/* preparation */
				_upgrade(oModel);
			}
			return isDraft;
		});
	}

	/**
	 * Mixin for {@link sap.ui.model.odata.v4.ODataModel}. Returns the internal JSON Model aka DraftAccessModel
	 * @example <caption>The model can be set to a control or view as any other model</caption>
	 * oView.setModel(oModel.getDraftAccessModel(), "$draft");
	 * @function
	 * @name sap.fe.model.DraftModel.upgradedModel#getDraftAccessModel
	 * @returns {sap.ui.model.json.JSONModel} The interal DraftAccessModel
	 * @private
	 * @sap-restricted
	 */
	function getDraftAccessModel() {
		return getData(this, "oDraftAccessModel");
	}

	/**
	 * @classdesc
	 * Only for documentation of the methods that are mixed into the {@link sap.ui.model.odata.v4.ODataModel}
	 * after it has been upgraded to a sap.fe.model.DraftModel
	 * @namespace
	 * @alias sap.fe.model.DraftModel.upgradedModel
	 *
	 * @experimental This module is only for experimental use!
	 * @private
	 * @sap-restricted
	 */
	var upgradedModel = {}; /* eslint no-unused-vars: 0 */

	/**
	 * @classdesc
	 * Static Draft 2.0 Model transformation for {@link sap.ui.model.odata.v4.ODataModel}
	 * to simplify programming against the draft enabled OData services with sapui5
	 *
	 * @see {@link sap.ui.model.odata.v4.ODataModel}
	 * @namespace
	 * @alias sap.fe.model.DraftModel
	 * @private
	 * @sap-restricted
	 * @experimental This module is only for experimental use! <br/><b>This is only a POC and maybe deleted</b>
	 * @since 1.48.0
	 */
	var DraftModel = {
		upgrade: upgrade,
		upgradeOnDemand: upgradeOnDemand,
		isDraftModel: isDraftModel,
		EDITSTATE: EDITSTATE
	};

	return DraftModel;

}, /* bExport= */true);
