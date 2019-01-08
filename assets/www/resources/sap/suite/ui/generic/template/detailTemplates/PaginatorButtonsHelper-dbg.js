sap.ui.define(["jquery.sap.global", "sap/ui/base/Object", "sap/suite/ui/generic/template/lib/testableHelper"], function(jQuery, BaseObject,
	testableHelper) {
	"use strict";

	var oTooltips = (function() {
		var oResource = sap.ui.getCore().getLibraryResourceBundle("sap.m");
		return {
			navDownTooltip: oResource.getText("FACETFILTER_NEXT"),
			navUpTooltip: oResource.getText("FACETFILTER_PREVIOUS")
		};
	})();

	function getMethods(oControllerBase, oController, oTemplateUtils) {
		var oTemplatePrivateModel = oTemplateUtils.oComponentUtils.getTemplatePrivateModel();
		var oTemplatePrivateGlobalModel = oController.getOwnerComponent().getModel("_templPrivGlobal");


		
		function computeAndSetVisibleParamsForNavigationBtns() {
			var oPaginatorInfo = oTemplateUtils.oComponentUtils.getPaginatorInfo();
			var bPaginatorAvailable = !!oPaginatorInfo && (!oControllerBase.fclInfo.isContainedInFCL || oTemplatePrivateGlobalModel.getProperty(
				"/generic/FCL/isVisuallyFullScreen"));
			var iLength = bPaginatorAvailable && (oPaginatorInfo.listBinding ? oPaginatorInfo.listBinding.getLength() : oPaginatorInfo.objectPageNavigationContexts.length);
			var bNavDownEnabled = bPaginatorAvailable && (oPaginatorInfo.selectedRelativeIndex !== (iLength - 1));
			var bNavUpEnabled = bPaginatorAvailable && oPaginatorInfo.selectedRelativeIndex > 0;
			oTemplatePrivateModel.setProperty("/objectPage/navButtons/navUpEnabled", bNavUpEnabled);
			oTemplatePrivateModel.setProperty("/objectPage/navButtons/navDownEnabled", bNavDownEnabled);
		}
		
		function fnHandleNavigateToObject(oPaginatorInfo, index){
			var oContext = oPaginatorInfo.objectPageNavigationContexts[index];
			oPaginatorInfo.selectedRelativeIndex = index;
			oTemplateUtils.oComponentUtils.setPaginatorInfo(oPaginatorInfo, false);
			var oNavigationInfo = oPaginatorInfo.navigitionInfoProvider(oContext);
			var oMyNavigationData = jQuery.extend({}, oNavigationInfo.navigationData);
			oMyNavigationData.replaceInHistory = true; // using the paginator buttons does not create a new history entry                         
			oTemplateUtils.oCommonUtils.navigateToContext(oNavigationInfo.context, oMyNavigationData);                         
		}

		function handleShowOtherObject(iStep) {
			var oBusyHelper = oTemplateUtils.oServices.oApplication.getBusyHelper();
			if (oBusyHelper.isBusy()) {
				return;
			}
			// now navigate to next object page
			var oPaginatorInfo = oTemplateUtils.oComponentUtils.getPaginatorInfo();
			var oListBinding = oPaginatorInfo.listBinding;
			var iNextIdx = oPaginatorInfo.selectedRelativeIndex + iStep;
			var aAllContexts = oPaginatorInfo.objectPageNavigationContexts;
			if (aAllContexts && aAllContexts[iNextIdx]) {
				fnHandleNavigateToObject(oPaginatorInfo, iNextIdx);
			} else {
				var oFetchNewRecordsPromise = new Promise(function(fnResolve, fnReject) {
					var iTableGrowingIncrement = oPaginatorInfo.growingThreshold || Math.ceil(oListBinding.getLength() / 5);
					var iStartingPoint = aAllContexts ? aAllContexts.length : iNextIdx;
					var newEndIdx = iStartingPoint + iTableGrowingIncrement;
					var fetchAndUpdateRecords = function(mParameters) {
						// get new fetched contexts and do stuff
						var aNewAllContexts = mParameters.getSource().getContexts(0, newEndIdx);
						oPaginatorInfo.objectPageNavigationContexts = aNewAllContexts;
						oListBinding.detachDataReceived(fetchAndUpdateRecords);
						// also.. navigate
						fnHandleNavigateToObject(oPaginatorInfo, iNextIdx);
						fnResolve();
					};
					oListBinding.attachDataReceived(fetchAndUpdateRecords);
					oListBinding.loadData(0, newEndIdx);
				});
				oBusyHelper.setBusy(oFetchNewRecordsPromise);
			}
		}
		
		function handleShowNextObject() {
			handleShowOtherObject(1);	
		}

		function handleShowPrevObject() {
			handleShowOtherObject(-1);
		}		

		oTemplatePrivateModel.setProperty("/objectPage/navButtons", jQuery.extend({
			navDownEnabled: false,
			navUpEnabled: false
		}, oTooltips));
		if (oControllerBase.fclInfo.isContainedInFCL) {
			var oFullscreenBinding = oTemplatePrivateGlobalModel.bindProperty("/generic/FCL/isVisuallyFullScreen");
			oFullscreenBinding.attachChange(computeAndSetVisibleParamsForNavigationBtns);
		}

		return {
			computeAndSetVisibleParamsForNavigationBtns: computeAndSetVisibleParamsForNavigationBtns,
			handleShowNextObject: handleShowNextObject,
			handleShowPrevObject: handleShowPrevObject
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.detailTemplates.PaginatorButtonsHelper", {
		constructor: function(oControllerBase, oController, oTemplateUtils) {
			jQuery.extend(this, (testableHelper.testableStatic(getMethods, "PaginatorButtonsHelper"))(oControllerBase, oController,
				oTemplateUtils));
		}
	});
});