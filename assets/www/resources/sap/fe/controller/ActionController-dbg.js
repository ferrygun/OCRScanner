/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

sap.ui.define([
	"jquery.sap.global",
	"sap/ui/base/Object"
//	"sap/ui/core/mvc/Controller"
], function (jQuery, BaseObject) {
	"use strict";

	function getMethods(oTemplateUtils) {
		var oMessageUtils = oTemplateUtils.getMessageUtils();

		/*
		 Call Action
		 */

		function callAction(oEvent) {
			var mParameters = oEvent.getParameters(),
				fnSuccess = mParameters.success,
				fnError = mParameters.error,
				aContexts = mParameters.contexts,
				oModel = aContexts[0].getModel(),
				oAction,
				oBusyPromise,
				aActionPromises = [],
				sAction = mParameters.actionName + "(...)",
				bChangeSet = mParameters.mode === 'ChangeSet',
				sGroupId,
				i;

			if (mParameters.checkBusy) {
				if (oTemplateUtils && oTemplateUtils.getBusyHelper().isBusy()) {
					return fnError ? fnError("Application is busy") : jQuery.noop();
				}
			}

			for (i = 0; i < aContexts.length; i++) {
				oAction = oModel.bindContext(sAction, aContexts[i]);

				if (aContexts.length === 1) {
					aActionPromises.push(oAction.execute('$auto'));
					oBusyPromise = aActionPromises[0];
				} else {
					sGroupId = (bChangeSet) ? '$direct' : 'action' + i;
					aActionPromises.push(oAction.execute(sGroupId));
				}
			}

			if (aContexts.length > 1) {
				if (bChangeSet) {
					oBusyPromise = oModel.submitBatch("actions");
				} else {
					// temp solution only, to be clarified with OData model colleagues,
					// until then we pass the busy helper only the last promise which should be OK for now
					for (i = 0; i < aContexts.length; i++) {
						oBusyPromise = oModel.submitBatch("action" + i);
					}
				}

				if (mParameters.setBusy && oTemplateUtils) {
					oTemplateUtils.getBusyHelper().setBusy(oBusyPromise);
				}
			} else if (mParameters.setBusy && oTemplateUtils) {
				oTemplateUtils.getBusyHelper().setBusy(oBusyPromise);
			}

			function fnDifferentiate(promise) {
				return promise.then(function (v) {
						return {v: v, status: "resolved"};
					},
					function (e) {
						return {e: e, status: "rejected"};
					});
			}

			Promise.all(aActionPromises.map(fnDifferentiate)).then(function (results) {
				var rejectedItems = [];
				var iResultCount;
				for (iResultCount = 0; iResultCount < results.length; iResultCount++) {
					if (results[iResultCount].status === "rejected") {
						rejectedItems.push(results[iResultCount].e);
					}
				}
				if (rejectedItems.length > 0) {
					oMessageUtils.handleRequestFailed(rejectedItems);
				}

				for (iResultCount = 0; iResultCount < results.length; iResultCount++) {
					if (results[iResultCount].status === "resolved") {
						oMessageUtils.handleSuccess(oTemplateUtils.getText("SAPFE_ACTION_SUCCESS", mParameters.actionLabel));

						// This is needed because the OData model does not update the returned data, already requested
						// from the OData model. as this anyway refreshes the complete list binding we
						// take the first selected context and refresh the binding, this refreshes the table
						aContexts[0].getBinding().refresh("$auto");

						fnSuccess ? fnSuccess() : jQuery.noop();
					}
				}
			});
		}

		return {
			callAction: callAction
		};
	}

	return BaseObject.extend(
		"sap.fe.controller.ActionController", {
			constructor: function (oTemplateUtils) {
				jQuery.extend(this, getMethods(oTemplateUtils));
			}
		});
});
