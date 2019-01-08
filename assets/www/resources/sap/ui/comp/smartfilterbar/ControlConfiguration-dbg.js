/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides control sap.ui.comp.smartfilterbar.ControlConfiguration.
sap.ui.define([
	'jquery.sap.global', 'sap/ui/comp/library', 'sap/ui/core/Element'
], function(jQuery, library, Element) {
	"use strict";

	/**
	 * Constructor for a new smartfilterbar/ControlConfiguration.
	 * 
	 * @param {string} [sID] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class ControlConfiguration can be used to add additional configuration for filter fields in the SmartFilterBar control, in order to overwrite
	 *        the default settings from the OData metadata. For instance, it is possible to change the label, index or control type of a filter field.
	 * @extends sap.ui.core.Element
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartfilterbar.ControlConfiguration
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var ControlConfiguration = Element.extend("sap.ui.comp.smartfilterbar.ControlConfiguration", /** @lends sap.ui.comp.smartfilterbar.ControlConfiguration.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			properties: {

				/**
				 * The key property corresponds to the field name from the OData service $metadata document.
				 */
				key: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * The groupId can be used to move a field from one group to another. The groupId corresponds to the EntityName from the OData
				 * metadata. It is also possible to move a field from the advanced area to the basic area by specifying the groupId _BASIC.
				 */
				groupId: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Using this property it is possible to overwrite the label of a filter field in the SmartFilterBar.
				 */
				label: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Using this flag it is possible to hide fields from the OData metadata.
				 */
				visible: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Specifies whether a value help dialog is available or not.
				 */
				hasValueHelpDialog: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * The SmartFilterBar calculates which kind of control will be used for a filter fields based on multiple OData Attributes and
				 * annotations. Using this property it is possible to overwrite the OData metadata.
				 */
				controlType: {
					type: "sap.ui.comp.smartfilterbar.ControlType",
					group: "Misc",
					defaultValue: 'auto'
				},

				/**
				 * The filter type specifies whether the filter fields is e.g. type single value, multi-value,or interval. The filter type is being
				 * calculated by the martFilterBar based on the OData metadata. Using this property the filter type can be configured manually.
				 */
				filterType: {
					type: "sap.ui.comp.smartfilterbar.FilterType",
					group: "Misc",
					defaultValue: 'auto'
				},

				/**
				 * The zero based index can be used to specify the initial order of fields (without any variants).
				 */
				index: {
					type: "int",
					group: "Misc",
					defaultValue: -1
				},

				/**
				 * Property can be used to enable the TypeAhead service. TypeAhead does not work with all controls, e.g it does not work for
				 * DrodDownListbox
				 */
				hasTypeAhead: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Property can be used to overwrite the mandatory state of a filter field. Property can only be set during initialization. Changes at
				 * runtime will be ignored.
				 */
				mandatory: {
					type: "sap.ui.comp.smartfilterbar.MandatoryType",
					group: "Misc",
					defaultValue: 'auto'
				},

				/**
				 * The width of the filter field in a CSS compatible format. The width can be set only once during initialization. Changes at runtime
				 * will not be reflected. The width will not be applied to custom controls.
				 */
				width: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * If set to true this field will be added to the advanced area (aka. Dynamic Selection) by default.
				 */
				visibleInAdvancedArea: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * In case there are value help annotations for this filter field, it is possible to specify whether the table in the value help
				 * dialog for this field will be filled initially. The default value is true, which means the table will not be filled as the data
				 * fetch is prevented.
				 */
				preventInitialDataFetchInValueHelpDialog: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * The displayBehaviour specifies how the content should be displayed on certain controls. Ex: DescriptionOnly for Combobox (DropDown
				 * text) , Description and ID for MultiInput (token text)
				 */
				displayBehaviour: {
					type: "sap.ui.comp.smartfilterbar.DisplayBehaviour",
					group: "Misc",
					defaultValue: 'auto'
				},

				/**
				 * The condition Type class name to use for this filter item. Implementation should derive from sap.ui.comp.config.condition.Type
				 */
				conditionType: {
					type: "any",
					group: "Misc",
					defaultValue: null
				}
			},
			aggregations: {

				/**
				 * Default value for a filter field.
				 */
				defaultFilterValues: {
					type: "sap.ui.comp.smartfilterbar.SelectOption",
					multiple: true,
					singularName: "defaultFilterValue"
				},

				/**
				 * If a custom control is specified, the SmartFilterBar will not create a control but use the custom control. Additional services like
				 * TypeAhead have to implemented manually.
				 */
				customControl: {
					type: "sap.ui.core.Control",
					multiple: false
				}
			},
			events: {

				/**
				 * Fired when the value of a property, for example isVisible, has changed.
				 */
				change: {
					parameters: {

						/**
						 * Name of the changed property
						 */
						propertyName: {
							type: "string"
						}
					}
				}
			}
		}
	});

	ControlConfiguration.prototype.setVisible = function(bIsVisible) {
		this.setProperty("visible", bIsVisible);
		this.fireChange({
			propertyName: "visible"
		});
	};

	ControlConfiguration.prototype.setLabel = function(sLabel) {
		this.setProperty("label", sLabel);
		this.fireChange({
			propertyName: "label"
		});
	};

	ControlConfiguration.prototype.setVisibleInAdvancedArea = function(bVisible) {
		this.setProperty("visibleInAdvancedArea", bVisible);
		this.fireChange({
			propertyName: "visibleInAdvancedArea"
		});
	};

	// Assign types from library for backward compatibility!
	ControlConfiguration.FILTERTYPE = sap.ui.comp.smartfilterbar.FilterType;
	ControlConfiguration.CONTROLTYPE = sap.ui.comp.smartfilterbar.ControlType;
	ControlConfiguration.MANDATORY = sap.ui.comp.smartfilterbar.MandatoryType;
	ControlConfiguration.DISPLAYBEHAVIOUR = sap.ui.comp.smartfilterbar.DisplayBehaviour;

	return ControlConfiguration;

}, /* bExport= */true);
