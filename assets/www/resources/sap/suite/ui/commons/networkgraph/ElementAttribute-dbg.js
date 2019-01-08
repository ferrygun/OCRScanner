sap.ui.define([
	"sap/ui/core/Element"
], function (Element) {
	/**
	 * Constructor for a new ElementAttribute.
	 *
	 * @class
	 * Holds details of an attribute used in the graph.
	 *
	 * @extends sap.ui.core.Element
	 *
	 * @constructor
	 * @public
	 * @since 1.50
	 * @alias sap.suite.ui.commons.networkgraph.ElementAttribute
	 */
	var ElementAttribute = Element.extend("sap.suite.ui.commons.networkgraph.ElementAttribute", {
		metadata: {
			library: "sap.suite.ui.commons",
			properties: {
				/**
				 * Label of the attribute. If set to null, the label is not displayed.
				 */
				label: {
					type: "string", group: "Misc", defaultValue: null
				},
				/**
				 * Value of the attribute. If set to null, the value is not displayed.
				 */
				value: {
					type: "string", group: "Misc", defaultValue: null
				},
				/**
				 * Defines whether the attribute is visible. This option is used for rectangular nodes.
				 * Visible attributes are displayed right inside the rectangular node. The node's details popup shows
				 * all attributes, including the invisible ones.
				 */
				visible: {
					type: "boolean", group: "Misc", defaultValue: true
				}
			}
		}
	});

	return ElementAttribute;
});
