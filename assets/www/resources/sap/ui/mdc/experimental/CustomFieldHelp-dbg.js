/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	'sap/ui/mdc/experimental/FieldHelpBase'
], function(FieldHelpBase) {
	"use strict";

	/**
	 * Constructor for a new CustomFieldHelp.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class A field help used in the <code>FieldFelp</code> aggregation in <code>Field</code> controls that allows to add custom content.
	 * @extends sap.ui.core.Element
	 * @version 1.52.4
	 * @constructor
	 * @private
	 * @since 1.50.0
	 * @alias sap.ui.mdc.experimental.CustomFieldHelp
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var CustomFieldHelp = FieldHelpBase.extend("sap.ui.mdc.experimental.CustomFieldHelp", /** @lends sap.ui.mdc.experimental.CustomFieldHelp.prototype */
	{
		metadata: {
			library: "sap.ui.mdc",
			properties: {
				},
			aggregations: {
				/**
				 * content of the Field help
				 */
				content: {
					type: "sap.ui.core.Control",
					multiple: false
				}
			},
			defaultAggregation: "content",
			events: {
				/**
				 * This event is fired before the field help opens
				 */
				beforeOpen: {
					parameters: {

						/**
						 * The <code>value</code> of the field.
						 */
						value: { type: "any" }
					}
				}
			}
		}
	});

	CustomFieldHelp.prototype._createPopover = function() {

		var oPopover = FieldHelpBase.prototype._createPopover.apply(this, arguments);

		// use FieldHelps content in Popover -> overwrite hook
		oPopover._getAllContent = function(){
			var oFieldHelp = this.getParent();
			if (oFieldHelp) {
				var aContent = [];
				aContent.push(oFieldHelp.getContent());
				return aContent;
			} else {
				return this.getContent();
			}
		};

		return oPopover;

	};

	/**
	 * Close the fieldHelp and fires the <code>select</code> event of the field help
	 *
	 * @param {string} sValue selected value
	 * @param {string} sAdditionalValue selected additional value
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	CustomFieldHelp.prototype.fireSelectEvent = function(sValue, sAdditionalValue) {

		this.close();
		this.fireSelect({value: sValue, additionalValue: sAdditionalValue});

	};

	CustomFieldHelp.prototype.open = function() {

		var oField = this.getParent();
		var sValue;

		if (oField) {
			sValue = oField.getValue();
		}

		this.fireBeforeOpen({value: sValue});
		FieldHelpBase.prototype.open.apply(this, arguments);

	};

	return CustomFieldHelp;

}, /* bExport= */true);
