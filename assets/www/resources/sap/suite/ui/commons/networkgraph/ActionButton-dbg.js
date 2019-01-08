sap.ui.define([
	"sap/ui/core/Element"
], function (Element) {

	/**
	 * Constructor for a new ActionButton.
	 *
	 * @class
	 * Holds information about one custom action button.
	 *
	 * @extends sap.ui.core.Element
	 *
	 * @constructor
	 * @since 1.50
	 * @public
	 * @alias sap.suite.ui.commons.networkgraph.ActionButton
	 */
	var ActionButton = Element.extend("sap.suite.ui.commons.networkgraph.ActionButton", {
		metadata: {
			library: "sap.suite.ui.commons",
			properties: {
				/**
				 * The icon to be used for the custom action button.
				 */
				icon: {
					type: "string", group: "Appearance", defaultValue: null
				},
				/**
				 * Tooltip title for custom action button.
				 */
				title: {
					type: "string", group: "Appearance", defaultValue: null
				}
			},
			events: {
				/**
				 * This event is fired when the action button is clicked or tapped.
				 */
				press: {
					parameters: {
						buttonElement: {type: "object"}
					}
				}
			}
		}
	});

	return ActionButton;
});
