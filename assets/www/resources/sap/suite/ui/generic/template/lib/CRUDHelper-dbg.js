sap.ui.define(["jquery.sap.global", "sap/ui/base/Object", "sap/ui/model/Context", "sap/suite/ui/generic/template/lib/MessageUtils", "sap/ui/model/Filter", "sap/ui/model/FilterOperator"],
	function(jQuery, BaseObject, Context, MessageUtils, Filter, FilterOperator) {
		"use strict";

		// create a new onstance for the specified entity set with the given binding path.
		// Returns a promise that resolves to the context.
		// Note that this context is only virtual in non-draft scenarios.
		// In draft scenarios the creation of the draft may fail. In this case the returned Promise is rejected.
		function create(oDraftController, sEntitySet, sBindingPath, oModel, setEditableNDC, vPredefinedValues) {
			sBindingPath = sBindingPath || "/" + sEntitySet;
			if (oDraftController.getDraftContext().isDraftEnabled(sEntitySet)) { // draft case
				return oDraftController.createNewDraftEntity(sEntitySet, sBindingPath, vPredefinedValues).then(function(oResponse) {
					return oResponse.context; // map response onto the contained context
				});
			}
			// non-draft case
			setEditableNDC(true);
			var oCreateContext = oModel.createEntry(sBindingPath, {
				properties: vPredefinedValues,
				batchGroupId: "Changes",
				changeSetId: "Changes"
			});
			return Promise.resolve(oCreateContext);
		}

		function fnReadDraftAdminstrativeData(oModel, sBindingPath, oTemplateContract) {
			var oPromise = new Promise(function(resolve, reject) {
				oModel.read(sBindingPath, {
					urlParameters: {
						"$expand": "DraftAdministrativeData"
					},
					success: function(oResponse) {
						resolve(oResponse);
					},
					error: function(oResponse) {
						reject(oResponse);
					}
				});
			});
			// not really needed for navigation (as there is always another promise still running), but maybe for internal
			// edit - and it doesn't hurt anyway
			oTemplateContract.oBusyHelper.setBusy(oPromise, true);
			return oPromise;
		}
		/*
		 * functionality similar to routingHelper - START - refactoring
		 * */
		function fnReadDraftAdminstrativeDataWithSemanticKey(oTransactionController, sEntitySet, aKeys, oStartupParameters, oModel, oTemplateContract) {
			var oPromise = new Promise(function(resolve, reject) {
				var i, iLen, sProperty, sValue, aFilters = [];
				if (aKeys && oStartupParameters && oModel) {
					iLen = aKeys.length;
					for (i = 0; i < iLen; i++) {
						// get property from property path
						sProperty = aKeys[i].PropertyPath;
						// get value from parameter array (should have only 1)
						sValue = oStartupParameters[sProperty][0];
						aFilters.push(new Filter(sProperty, FilterOperator.EQ, sValue));
					}
					if (oTransactionController.getDraftController()
							.getDraftContext().isDraftEnabled(sEntitySet)) {
						var oDraftFilter = new Filter({
							filters: [new Filter("IsActiveEntity", "EQ", false),
							          new Filter("SiblingEntity/IsActiveEntity", "EQ", null)],
							          and: false
						});
						aFilters.push(oDraftFilter);
					}
					var oCompleteFilter = new Filter(aFilters, true);
					oModel.read("/" + sEntitySet, {
						urlParameters: {
							"$expand": "DraftAdministrativeData"
						},
						filters: [oCompleteFilter],
						success: function(oResult) {
							var oRowResult = fnReadObjectProcessResults(oResult, oModel, oStartupParameters);
							if (oRowResult) {
								resolve(oRowResult);
							} else {
								reject(oResult);
							}
						},
						error: function(oResponse) {
							reject(oResponse);
						}
					});
				}
			});
			// not really needed for navigation (as there is always another promise still running), but maybe for internal
			// edit - and it doesn't hurt anyway
			oTemplateContract.oBusyHelper.setBusy(oPromise, true);
			return oPromise;
		}

		function fnReadObjectProcessResults(oResult, oModel, oStartupParameters) {


			var oRow, i, iLength, oRowResult;
			if (oResult && oResult.results){
				iLength = oResult.results.length;
				if (iLength == 0) {
					oRowResult = null;
				} else if (iLength == 1) {
					oRowResult = oResult.results[0];
				} else if (iLength >= 1) {
					var aDrafts  = [];
					var aActive = [];
					for (i = 0; i < iLength; i++) {
						oRow = oResult.results[i];
						if (oRow && oRow.IsActiveEntity) {
							aActive.push(oRow);
						} else if (oRow && oRow.IsActiveEntity == false) {
							aDrafts.push(oRow);
						}
					}
					if (aActive.length == 0 && aDrafts.length >= 2){
						//DraftUUID match?
						var oDraftRow;
						for (var j = 0; j < aDrafts.length; j++) {
							oDraftRow = aDrafts[j];
							if (oDraftRow.DraftUUID == oStartupParameters.DraftUUID){
								//show corresponding object
								oRowResult = oDraftRow;
								break;
							}
						}
						if (!oRowResult){
							oRowResult = aDrafts[0];
						}
					} else if (aActive.length == 1 && aDrafts.length == 1){
						//no DraftUUID check
						oRowResult = aActive[0];
					} else if (aActive.length == 1 && aDrafts.length >= 2){
						oRowResult = aActive[0];
					}
				}
			}
			return oRowResult;
		}

		/*
		 * functionality similar to routingHelper - END
		 * */

		/*
		 * This method is called during startup and ensures that all changes performed on draft objects are
		 * automatically saved.
		 * This is done by registering to the propertyChange-event of the OData model of the app.
		 * Note that this affects even changes that are done in breakouts or reuse componentgs as long as they use the standard OData model.
		 * Components using different channels (e.g. another OData model) for storing the data need to use method
		 * sap.suite.ui.generic.template.ObjectPage.extensionAPI.DraftTransactionController.saveDraft()
		*/
		function enableAutomaticDraftSaving(oTemplateContract){
			var oAppComponent = oTemplateContract.oAppComponent;
			var oModel = oAppComponent.getModel();
			var oMetaModel = oModel.getMetaModel();
			var oNavigationController = oAppComponent.getNavigationController();
			var oApplicationController = oAppComponent.getApplicationController(); // instance of sap.ui.generic.app.ApplicationController
			var oDraftContext = oApplicationController.getTransactionController().getDraftController().getDraftContext();
			var fnErrorHandler = function(oError){
					/* TODO: change handleError API
				 we anyway want to modify the API for the handleError method. Until then we use the
				 mParameters to pass the needed resourceBundle and navigation Controller
				*/
				oTemplateContract.oApplicationProxy.getResourceBundleForEditPromise().then(function(oResourceBundle){
					MessageUtils.handleError(MessageUtils.operations.modifyEntity, null, null, oError, {
						resourceBundle: oResourceBundle,
						navigationController: oNavigationController,
						model: oModel
					});
					MessageUtils.handleTransientMessages(oTemplateContract.oApplicationProxy.getDialogFragment);
				});
			};
			var fnPropertyChanged = function(oEvent){
				var oContext = oEvent.getParameter("context");
				// Ignore all cases which are non-draft
				if (!oDraftContext.hasDraft(oContext)){
					return;
				}
				// for parameters of function imports special paths are introduced in the model, that are not known in the metamodel
				// as we don't need a merge call for changes to these properties, we can just ignore them
				if (!oMetaModel.getODataEntitySet(oContext.getPath().split("(")[0].substring(1))){
					return;
				}
				var sPath = oEvent.getParameter("path");
				// delegate the draft saving to the ApplicationController
				oApplicationController.propertyChanged(sPath, oContext).catch(fnErrorHandler);
				//update the draft has modified information in ContextBookKeeping Map
				oTemplateContract.oApplicationProxy.markCurrentDraftAsModified();
			};
			oModel.attachPropertyChange(fnPropertyChanged); // ensure that the handler is called whenever a user input (affecting the OData model) is performed
		}

		function fnUnsavedChangesDialog(oTemplateContract, oDraftAdministrativeData, fnBeforeDialogCallback) {
			return new Promise(function(resolve, reject) {
				var oUnsavedChangesDialog = oTemplateContract.oApplicationProxy.getDialogFragment(
					// todo: To avoid this undesired call from lib to object page, maybe the fragment should be moved to lib
					"sap.suite.ui.generic.template.ObjectPage.view.fragments.UnsavedChangesDialog", {
						onEdit: function() {
							oUnsavedChangesDialog.close();
							resolve();
						},
						onCancel: function() {
							oUnsavedChangesDialog.close();
							reject();
						}
					}, "Dialog");
				var sUnsavedChangesQuestion = oTemplateContract.getText("DRAFT_LOCK_EXPIRED", [oDraftAdministrativeData.LastChangedByUserDescription ||
					oDraftAdministrativeData.LastChangedByUser
				]);
				oUnsavedChangesDialog.getModel("Dialog").setProperty("/unsavedChangesQuestion", sUnsavedChangesQuestion);
				// promise from navigation controller needs to be resolved, as otherwise busyHelper would block the dialog
				(fnBeforeDialogCallback || jQuery.noop)();
				oTemplateContract.oBusyHelper.getUnbusy().then(function() {
					oUnsavedChangesDialog.open();
				});
			});
		}

		function edit(oTransactionController, sEntitySet, sBindingPath, oModel, oTemplateContract,
			fnBeforeDialogCallback, aKeys, oStartupParameters) {
			//refactoring needed
			if (sBindingPath === "" && aKeys && oStartupParameters ){
				return new Promise(function(resolve, reject) {
					fnReadDraftAdminstrativeDataWithSemanticKey(oTransactionController, sEntitySet, aKeys, oStartupParameters, oModel, oTemplateContract).then(
						function(oResponse) {
							var sResponseBindingPath = "/" + oModel.createKey(sEntitySet, oResponse);
							var oBindingContext = new Context(oModel, sResponseBindingPath);
							if (!oResponse.DraftAdministrativeData || oResponse.DraftAdministrativeData.DraftIsCreatedByMe) {
								// no or own draft
								resolve(oTransactionController.editEntity(oBindingContext, false));
							} else if (oResponse.DraftAdministrativeData.InProcessByUser) { // locked
								reject({
									lockedByUser: oResponse.DraftAdministrativeData.InProcessByUserDescription || oResponse.DraftAdministrativeData.InProcessByUser
								});
							} else { // unsaved changes
								fnUnsavedChangesDialog(oTemplateContract, oResponse.DraftAdministrativeData,
									fnBeforeDialogCallback).then(
									function() {
										resolve(oTransactionController.editEntity(oBindingContext, false));
									},
									function() {
										reject({
											lockedByUser: oResponse.DraftAdministrativeData.LastChangedByUserDescription || oResponse.DraftAdministrativeData.LastChangedByUser
										});
									});
							}
						},
						function(oResponse) {
							// DraftAdminData read failed
							reject({
								draftAdminReadResponse: oResponse
							});
						});
				});
			}
			var oDraftContext = oTransactionController.getDraftController().getDraftContext();
			var oBindingContext = new Context(oModel, sBindingPath);
			if (oDraftContext.isDraftEnabled(sEntitySet)) {
				// todo: enable preserveChanges
				if (true || !oDraftContext.hasPreserveChanges(oBindingContext)) {
					return new Promise(function(resolve, reject) {
						fnReadDraftAdminstrativeData(oModel, sBindingPath, oTemplateContract).then(
							function(oResponse) {
								if (!oResponse.DraftAdministrativeData || oResponse.DraftAdministrativeData.DraftIsCreatedByMe) {
									// no or own draft
									resolve(oTransactionController.editEntity(oBindingContext, false));
								} else if (oResponse.DraftAdministrativeData.InProcessByUser) { // locked
									reject({
										lockedByUser: oResponse.DraftAdministrativeData.InProcessByUserDescription || oResponse.DraftAdministrativeData.InProcessByUser
									});
								} else { // unsaved changes
									fnUnsavedChangesDialog(oTemplateContract, oResponse.DraftAdministrativeData,
										fnBeforeDialogCallback).then(
										function() {
											resolve(oTransactionController.editEntity(oBindingContext, false));
										},
										function() {
											reject({
												lockedByUser: oResponse.DraftAdministrativeData.LastChangedByUserDescription || oResponse.DraftAdministrativeData.LastChangedByUser
											});
										});
								}
							},
							function(oResponse) {
								// DraftAdminData read failed
								reject({
									draftAdminReadResponse: oResponse
								});
							});
					});
				}
			} else {
				oTemplateContract.oApplicationProxy.setEditableNDC(true);
				return Promise.resolve({
					context: oBindingContext
				});
			}
		}

		return {
			create: create,
			edit: edit,
			enableAutomaticDraftSaving: enableAutomaticDraftSaving
		};
	}
);