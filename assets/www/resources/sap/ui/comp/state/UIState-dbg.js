/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
	"sap/ui/base/ManagedObject"
], function(ManagedObject) {
	"use strict";

	/**
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class Creates a new instance of an UIState class.
	 * @extends sap.ui.base.ManagedObject
	 * @author SAP SE
	 * @version 1.52.4
	 * @constructor
	 * @public
	 * @since 1.50
	 * @alias sap.ui.comp.state.UIState
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var UIState = ManagedObject.extend("sap.ui.comp.state.UIState", /** @lends sap.ui.comp.state.UIState */
	{
		metadata: {
			library: "sap.ui.comp",
			properties: {
				/**
				 * Object representing the presentation variant.
				 * The structure looks like:
				 * <pre><code>
				 *	{
				 *		ContextUrl: {string},
				 *		MaxItems: {int},
				 *	  	SortOrder: [],
				 *		GroupBy: [],
				 *		Total: [],
				 *		RequestAtLeast: [],
				 *		Visualizations: []
				 *	}
				 * </code></pre>
				 * <b>Note:</b>
				 * <ul>
				 *     <li> <code>PresentationVariantID</code> property is not provided</li>
				 *     <li> <code>Text</code> property is not provided because it is translated text</li>
				 *     <li> <code>TotalBy</code> is not supported yet</li>
				 *     <li> <code>IncludeGrandTotal</code> is not supported yet</li>
				 *     <li> <code>InitialExpansionLevel</code> is not supported yet</li>
				 *     <li> <code>Title</code> of <code>Visualizations.Content</code> property is not provided because it is translated text</li>
				 *     <li> <code>Description</code> of <code>Visualizations.Content</code> property is not provided because it is translated text</li>
				 *     <li> <code>VariantName</code> property is not part of specified DataSuiteFormat yet
				 * </ul>
				 */
				presentationVariant: {
					type: "object"
				},
				/**
				 * Object representing the selection variant.
				 * The structure looks like:
				 * <pre><code>
				 *	{
				 *		SelectOptions: []
				 *  }
				 * </code></pre>
				 */
				selectionVariant: {
					type: "object"
				},
				/**
				 * Variant name.
				 */
				variantName: {
					type: "string"
				}
			}
		}
	});
	return UIState;
});
