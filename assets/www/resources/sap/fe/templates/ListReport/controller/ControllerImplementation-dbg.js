/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

/* global hasher */
sap.ui.define([
	"jquery.sap.global",
	"sap/ui/mdc/base/ConditionModel"
], function (jQuery, ConditionModel) {
	"use strict";

	return {
		getMethods: function (oViewProxy, oTemplateUtils, oController) {

			var oTable, oFilterBar;

			function fnCreateAppState() {
				var sFilterBarAppState = oFilterBar.getAppState();

				if (!sFilterBarAppState) {
					// no app state exists and filter bar does not have any app state relevant changes, there is
					// no need to generate an app state
					return;
				}

				var oAppState = {
					filterBar: sFilterBarAppState
				};

				oTemplateUtils.setAppStateContainer(oAppState);
			}

			function fnApplyAppState(oAppState) {
				if (!oAppState) {
					oAppState = oTemplateUtils.getAppStateContainer(oController.getView());
				}

				if (oAppState) {
					return oFilterBar.setAppState(oAppState.filterBar);
				}
			}

			/*
			 This coding is deactivated as the FLP does not yet support dynamic tiles for OData v4 - activate once
			 the FLP supports OData v4 as well
			 This coding needs to be adapted to the refactoring then for example ListBindingInfo shall be used
			 instead of the ListBinding

			 function fnCreateRequestUrl(oBinding, sPath, oContext, aUrlParams, bBatch){
			 // create the url for the service
			 var sNormalizedPath,
			 aAllUrlParameters = [],
			 sUrl = "";

			 if (sPath && sPath.indexOf('?') !== -1 ) {
			 sPath = sPath.substr(0, sPath.indexOf('?'));
			 }

			 if (!oContext && !jQuery.sap.startsWith(sPath,"/")) {
			 jQuery.sap.log.fatal(oBinding + " path " + sPath + " must be absolute if no Context is set");
			 }

			 sNormalizedPath = oBinding.getModel().resolve(sPath, oContext);

			 //An extra / is present at the end of the sServiceUrl, taking the normalized url from index 1
			 if (!bBatch) {
			 sUrl = oBinding.getModel().sServiceUrl + sNormalizedPath.substr(1);
			 } else {
			 sUrl = sNormalizedPath.substr(sNormalizedPath.indexOf('/') + 1);
			 }

			 if (aUrlParams) {
			 aAllUrlParameters = aAllUrlParameters.concat(aUrlParams);
			 }

			 if (aAllUrlParameters && aAllUrlParameters.length > 0) {
			 sUrl += "?" + aAllUrlParameters.join("&");
			 }
			 return sUrl;
			 }

			 function fnGetDownloadUrl(oBinding) {
			 var aParams = [];

			 if (oBinding.sFilterParams) {
			 aParams.push(oBinding.sFilterParams);
			 }

			 if (oBinding.sCustomParams) {
			 aParams.push(oBinding.sCustomParams);
			 }

			 if (oBinding.mParameters) {
			 if (oBinding.mParameters.$count) {
			 aParams.push("$count="+oBinding.mParameters.$count);
			 }

			 if (oBinding.mParameters.$filter) {
			 aParams.push("$filter=("+oBinding.mParameters.$filter.replace(/'/g,"%27").replace(/ /g,"%20")+")");
			 }

			 if (oBinding.mParameters.$select) {
			 aParams.push("$select="+oBinding.mParameters.$select.replace(/'/g,"%27").replace(/,/g,"%2c"));
			 }

			 // we can skip the $expand for now as the count shall be the same to avoid unnecessary read requests in the backend
			 // if (oBinding.mParameters.$expand) {
			 // 	aParams.push("$expand="+oBinding.mParameters.$expand.replace(/'/g,"%27").replace(/\//g,"%2f"));
			 // }

			 // we set $top to 0 to avoid that any data is requested - we are only interested in the count
			 aParams.push("$top=0");
			 }

			 var sPath = oBinding.getModel().resolve(oBinding.sPath,oBinding.oContext);

			 if (sPath) {
			 return fnCreateRequestUrl(oBinding,sPath, null, aParams);
			 }
			 }*/

			function fnSetShareModel() {
				var fnGetUser = jQuery.sap.getObject("sap.ushell.Container.getUser");
				//var oManifest = oController.getOwnerComponent().getAppComponent().getMetadata().getManifestEntry("sap.ui");
				//var sBookmarkIcon = (oManifest && oManifest.icons && oManifest.icons.icon) || "";

				//shareModel: Holds all the sharing relevant information and info used in XML view
				var oShareInfo = {
					bookmarkTitle: document.title, //To name the bookmark according to the app title.
					bookmarkCustomUrl: function () {
						var sHash = hasher.getHash();
						return sHash ? ("#" + sHash) : window.location.href;
					},
					/*
					 To be activated once the FLP shows the count - see comment above
					 bookmarkServiceUrl: function() {
					 //var oTable = oTable.getInnerTable(); oTable is already the sap.fe table (but not the inner one)
					 // we should use table.getListBindingInfo instead of the binding
					 var oBinding = oTable.getBinding("rows") || oTable.getBinding("items");
					 return oBinding ? fnGetDownloadUrl(oBinding) : "";
					 },*/
					isShareInJamActive: !!fnGetUser && fnGetUser().isJamActive()
				};
				var oTemplatePrivateModel = oController.getOwnerComponent().getModel("_templPriv");
				oTemplatePrivateModel.setProperty("/listReport/share", oShareInfo);
			}

			// Generation of Event Handlers
			return {
				onInit: function () {
					oTable = oController.byId("template::Table");
					oFilterBar = oController.getView().byId("template::FilterBar");

					// set filter bar to disabled until app state is loaded
					oFilterBar.setEnabled(false);

					fnSetShareModel();

					// handle app state
					oTemplateUtils.getAppStateLoaded().then(function () {
						var oAppState = oTemplateUtils.getAppStateContainer(oController.getView());
						if (oAppState) {
							// an app state exists, apply it
							fnApplyAppState(oAppState).then(function () {
								// enable filterbar once the app state is applied
								oFilterBar.setEnabled(true);
							});
						} else {
							oFilterBar.setEnabled(true);
						}

						// attach to further app state changed
						oTemplateUtils.attachAppStateChanged(fnApplyAppState);

					});
				},

				handlers: {
					onSearch: function () {
						if (oFilterBar.getLiveUpdate() === false) {
							/* we do not support the GO-Button in the first delivery although it's implemented in the table and filterBar.
							 one missing part is the app state - here we need to add the information that the GO button was pressed once
							 we officially support the Go button as well
							 */
							fnCreateAppState();
						}
					},
					onFilterBarChange: function () {
						if (oFilterBar.getLiveUpdate()) {
							fnCreateAppState();
						}
						if (!oFilterBar.isReady()) {
							oTable.setShowOverlay();
						}
					},
					onItemPress: function (oEvent) {
						// Handling for navigating to another app when clicking on an item
						var oManifest = oController.getOwnerComponent().getAppComponent().getMetadata().getManifest();
						var sEntitySet = oController.getOwnerComponent().getEntitySet();
						var oEntitySet = oManifest["sap.fe"].entitySets[sEntitySet];
						var sOutbound = oEntitySet.entry.default.outbound;


						if (oManifest["sap.app"] && oManifest["sap.app"].crossNavigation && oManifest["sap.app"].crossNavigation.outbounds && oManifest["sap.app"].crossNavigation.outbounds[sOutbound]) {
							var oDisplayOutbound = oManifest["sap.app"].crossNavigation.outbounds[sOutbound];
							var oParameters = {};
							if (oDisplayOutbound.parameters) {
								var oBindingContext = oEvent.getParameters().listItem.getBindingContext();
								for (var sParameter in oDisplayOutbound.parameters) {
									if (oDisplayOutbound.parameters[sParameter].value.format === "binding") {
										oParameters[sParameter] = oBindingContext.getProperty(oDisplayOutbound.parameters[sParameter].value.value);
									}
								}
							}
							var oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
							oCrossAppNavigator && oCrossAppNavigator.toExternal({
								target: {
									semanticObject: oDisplayOutbound.semanticObject,
									action: oDisplayOutbound.action
								},
								params: oParameters
							});
						}


					},

					callAction: function (oEvent) {
						oTemplateUtils.getActionController().callAction(oEvent);
					},

					showError: function (oEvent) {
						// handling error after onDataReceived by the table to show message box
						var oSourceEvent = oEvent.getParameters();
						var oError = oSourceEvent.getParameter("error");
						oTemplateUtils.getMessageUtils().handleRequestFailed(oError);
					},

					onShareListReportActionButtonPress: function (oEvent) {
						var localI18nRef = oController.getView().getModel("sap.fe.i18n").getResourceBundle();
						if (!this._oShareActionButton) {
							//TODO: oCommonUtils was not defined for oTemplateUtils
							this._oShareActionButton = sap.ui.xmlfragment(
								"sap.fe.templates.listReport.view.fragments.ShareSheet", {
									shareEmailPressed: function () {
										sap.m.URLHelper.triggerEmail(null, localI18nRef.getText("SAPFE_EMAIL_SUBJECT", [document.title]), document.URL);
									},
									//TODO: JAM integration to be implemented
									shareJamPressed: function () {
									}
								});
							this.getView().addDependent(this._oShareActionButton);
						}
						this._oShareActionButton.openBy(oEvent.getSource());

					}

				},
				formatters: {},

				extensionAPI: null
			};
		}
	};

});
