sap.ui
	.define(["sap/suite/ui/generic/template/lib/TemplateAssembler"],
		function(TemplateAssembler) {
			"use strict";

			/**
			 * Static access to extension API for Smart Template Application development
			 * @namespace sap.suite.ui.generic.template.extensionAPI.extensionAPI
			 * @public
			 */

			return /** @lends sap.suite.ui.generic.template.extensionAPI.extensionAPI */ {
				/**
				 * @deprecated use <code>getExtensionAPIPromise</code> instead.
				 */
				getExtensionAPI: function(oControl) {
					return TemplateAssembler.getExtensionAPI(oControl);
				},
				
				/**
				 * Get the extension API valid for the specified control embedded in a Smart Template view.  Note that extension API
				 * can also be retrieved directly from the controller of the Smart Template view. Therefore, this method needs only
				 * be called in scenarios where this controller is not directly accessible. The most prominent use case for this would be
				 * the context of a controller of a view extension. In this case it is recommended to pass the extending view to this method. </br>
				 * Note that this method does not return the extension API directly, but a Promise that resolves to the extension API.
				 * Thus, a typical use of this method might look as follows: </br>
				 * <code>sap.ui.define(["sap/suite/ui/generic/template/extensionAPI/extensionAPI"], function(extensionAPI){</br>
				 *   ...</br>
				 *   extensionAPI.getExtensionAPIPromise(oView).then(function(oExtensionAPI){</br> 
				 *     oExtensionAPI.someMethod();</br> 
				 *   });</br>
				 *   ...</br>
				 * });</code>
				 *
				 * @param {sap.ui.core.Control} oControl a control which is embedded into a Smart Template view.
				 * @return {Promise} A <code>Promise</code> which resolves to the extension API for the embedding Smart Template view
				 * @public
				 */
				getExtensionAPIPromise: function(oControl) {
					return TemplateAssembler.getExtensionAPIPromise(oControl);
				}				
			};
		});