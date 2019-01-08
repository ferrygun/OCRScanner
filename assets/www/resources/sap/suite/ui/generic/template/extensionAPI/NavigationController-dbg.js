sap.ui.define(["jquery.sap.global", "sap/ui/base/Object"], function(jQuery, BaseObject) {
	"use strict";
	/**
	 * API to be used for navigation in extensions of Smart Template Applications. Breakout coding can access an instance
	 * of this class via {@link sap.suite.ui.generic.template.ListReport.extensionAPI.ExtensionAPI} or
	 * {@link sap.suite.ui.generic.template.ObjectPage.extensionAPI.ExtensionAPI}. Do not instantiate yourself.
	 * @class
	 * @name sap.suite.ui.generic.template.extensionAPI.NavigationController
	 * @public
	 */

	function getMethods(oTemplateUtils, oController, oState) {
		return /** @lends sap.suite.ui.generic.template.extensionAPI.NavigationController.prototype */ {
			/**
			 * Navigates to the given intent
			 * 
			 * @param {string} sOutbound The name of the outbound defined in the manifest
			 * @param {object} [mParameters] map with parameters for the navigation. If no parameters are provided, default are the parameters defined in the manifest
			 * @public
			 */
			navigateExternal: function(sOutbound, mParameters) {
				var oManifestEntry = oController.getOwnerComponent().getAppComponent().getManifestEntry("sap.app");
				var oOutbound = oManifestEntry.crossNavigation.outbounds[sOutbound];

				if (!oOutbound) {
					jQuery.sap.log.error("navigateExternal: mandatory parameter 'Outbound' is missing, or different from manifest entry");
					return;
				}

				if (mParameters){
					oOutbound.parameters = mParameters;
				} else {
					// todo: evaluate parameters
				}
				oTemplateUtils.oCommonUtils.navigateExternal(oOutbound, oState);
			},
			/**
			 * Triggers a navigation to another page within the application
			 * 
			 * @param {sap.ui.model.Context | String} vContext The target context for the navigation
			 * @param {object} [oNavigationData] object containing navigation data
			 * @param {string} [oNavigationData.navigationProperty] The navigation property identifying the target of the navigation
			 * @param {boolean} [oNavigationData.replaceInHistory] If this is truthy the page navigated to will replace the current page in the browser history
			 * @public
			 */
			navigateInternal: function(vContext, oNavigationData) {
				oTemplateUtils.oCommonUtils.navigateToContext(vContext, oNavigationData);
			},
			
			getCurrentKeys: function(){
				return oTemplateUtils.oComponentUtils.getCurrentKeys();
			}
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.extensionAPI.NavigationController", {
		constructor: function(oTemplateUtils, oController, oState) {
			jQuery.extend(this, getMethods(oTemplateUtils, oController, oState));
		}
	});
});