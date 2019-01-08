/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

sap.ui.define([
	"jquery.sap.global",
	"sap/ui/base/Object",
	"sap/fe/core/internal/testableHelper"
], function (jQuery, BaseObject, testableHelper) {
	"use strict";

	// Class for busy handling
	// This class enables the notion of a 'busy session'.
	// More precisely: At each point in time the app is either in a busy session or is not.
	// Reasons for being in a busy session can be set by calling methods setBusy or setBusyReason (see below).
	// Note that each busy reason has a lifetime.
	// A new busy session is started, as soon as the two following two conditions are fulfilled:
	// - The app is currently not in a busy session
	// - There is at least one (living) busy reason
	// A busy session potentially ends when the number of living busy reasons is reduced to zero. However, the end of the busy session is
	// potponed until a navigation which is currently active has finished and the current thread execution has come to an end. When a new
	// busy reason has been set meanwhile (and is still alive) the busy session is prolonged accordingly.
	//
	// The following features are connected to a busy session:
	// - A busy indication is displayed while the app is in a busy session. This busy indication may either be displayed immediately or with the standard
	//   busy delay (can be parametrized when setting the busy reason)
	// - When a busy session starts all transient messages are removed from the Apps message model
	// - When a busy session ends all transient messages being contained in the message model are displayed to the user and removed from the message model
	// Moreover, this class provides the possibility to interact with busy sessions/reasons (see methods isBusy and getUnbusy).
	function getMethods(oTemplateContract) {
		var mBusyReasons = {}; // currently living busy reasons of type string
		var bIsBusy = false; // is the app in a busy session
		var bBusyDirty = false; // is it already ensured that fnApplyBusy will be called
		var iBusyPromiseCount = 0; // number of currently living busy reasons of type Promise
		var iBusyDelay = oTemplateContract.oNavContainer.getBusyIndicatorDelay(); // standard busy delay of the App
		var oUnbusyPromise = Promise.resolve(); // a Promise which is resolved as soon as no busy session is running
		var fnUnbusyResolve = jQuery.noop; // function to be called when the current busy session ends

		// Returns information whether there is currently a living busy reason
		function isBusy() {
			return iBusyPromiseCount !== 0 || !jQuery.isEmptyObject(mBusyReasons);
		}

		var fnApplyBusyImmediately; // declare here to avoid use before declaration. Function that calls fnApplyBusy with bImmediate = true.
		// This function has the following tasks:
		// - If a busy session is running but no busy reason is available -> end the busy session (and thus display transient messages)
		// - Is a busy session is running set the app to busy, otherwise set it to unbusy
		// Note that ending the busy session will be postponed if a navugation is currently active and parameter bImmediate is false.
		// In this case the busy session might be prolonged if a new busy reason is set in the meantime
		function fnApplyBusy(bImmediate) {
			var bIsBusyNew = isBusy();
			if (bIsBusyNew || bImmediate) {
				bBusyDirty = false;
				oTemplateContract.oNavContainer.setBusy(bIsBusyNew);
				if (bIsBusyNew !== bIsBusy) {
					bIsBusy = bIsBusyNew;
					if (!bIsBusy) { // end of a busy session
						oTemplateContract.oNavContainer.setBusyIndicatorDelay(iBusyDelay);
						//MessageUtils.handleTransientMessages(oTemplateContract.oApplicationProxy.getDialogFragment);
						fnUnbusyResolve();
					}
				}
			} else {
				/* as we have only one page we don't need to wait until the navigation is done - therefore we call the
				   fnApplyBusyImmediately directly - once we introduce the  navigation we need to wait until the
				   navigation is done - see as example the implementation in the v2 library:
				   oTemplateContract.oApplicationProxy.getCurrentDisplayObject().promise.then(fnApplyBusyImmediately, fnApplyBusyImmediately);
				 */
				fnApplyBusyImmediately();
			}
		}

		fnApplyBusyImmediately = fnApplyBusy.bind(null, true);

		// Ensure that method fnApplyBusy is called
		// If bImmediate is true the busy delay is temporarily set to 0 and fnApplyBusy is called synchronously.
		// Otherwise the call of fnApplyBusy is postponed until the current thread is finished.
		function fnEnsureApplyBusy(bImmediate) {
			if (bImmediate) {
				oTemplateContract.oNavContainer.setBusyIndicatorDelay(0);
				fnApplyBusy();
			} else if (!bBusyDirty) {
				bBusyDirty = true;
				setTimeout(fnApplyBusy, 0);
			}
		}

		// function to be called when any Promise that serves as a busy reason is settled
		function fnBusyPromiseResolved() {
			iBusyPromiseCount--;
			if (!iBusyPromiseCount) {
				fnEnsureApplyBusy(false);
			}
		}

		// this method is called when a busy reason is set. It starts a busy session unless the App is already in a busy session.
		function fnMakeBusy() {
			if (bIsBusy) {
				return;  // App is already in a busy session
			}
			// Start a new busy session
			bIsBusy = true;
			oUnbusyPromise = new Promise(function (fnResolve) {
				fnUnbusyResolve = fnResolve;
			});
			// All transient messages still being contained in the message model belong to previous actions.
			// Therefore, we remove them. If they have not been shown yet, it is anyway to late to show them when this busy session has ended.
			//MessageUtils.removeTransientMessages();
		}

		// Sets or resets a busy reason of type string (parameter sReason).
		// Parameter bIsActive determines whether the busy reason is set or reset.
		// Note that resetting a reason applies to all living reasons using the same string (so calling this method with the same reason does not accumulate)
		// bImmediate is only evaluated when bIsActive is true. In this case it determines whether the busy indication should be displayed immediately or with
		// the usual delay.
		// Note that it is preferred to use method setBusy to set a busy reason
		function setBusyReason(sReason, bIsActive, bImmediate) {
			if (bIsActive) {
				fnMakeBusy();
				mBusyReasons[sReason] = true;
			} else {
				delete mBusyReasons[sReason];
			}
			fnEnsureApplyBusy(bImmediate);
		}

		// Sets a Promise (oBusyEndedPromise) as busy reason. This busy reason is alive until the promise is settled.
		// bImmediate determines whether the busy indication should be displayed immediately or with the usual delay.
		// Edge case: oBusyEndedPromise is already settled when this method is called (and the app is currently not in a busy session).
		// In this case, nevertheless a (probably short-living) busy session is started, such that the interaction with the message model is as defined above
		function setBusy(oBusyEndedPromise, bImmediate) {
			iBusyPromiseCount++;
			fnMakeBusy();
			oBusyEndedPromise.then(fnBusyPromiseResolved, fnBusyPromiseResolved);
			fnEnsureApplyBusy(bImmediate);
		}

		return {
			setBusyReason: setBusyReason,
			setBusy: setBusy,
			isBusy: isBusy,
			getUnbusy: function () { // returns a Promise that is resolved as soon as the App is not in a busy session
				return oUnbusyPromise;
			}
		};
	}

	return BaseObject.extend("sap.fe.core.BusyHelper", {
		constructor: function (oTemplateContract) {
			jQuery.extend(this, (testableHelper.testableStatic(getMethods, "BusyHelper"))(oTemplateContract));
		}
	});
});
