/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	'jquery.sap.global', 'sap/ui/core/Element'
], function (jQuery, Element) {
	"use strict";
	
	/**
	 * Constructor for a new ColumnAttribute
	 *
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Defines the column attribute which is used in the hierarchy column
	 * @extends sap.ui.core.Element
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @constructor
	 * @public
	 * @alias sap.gantt.config.ColumnAttribute
	 */
	var ColumnAttribute = Element.extend("sap.gantt.config.ColumnAttribute", /** @lends sap.gantt.config.ColumnAttribute.prototype */ {
		metadata: {
			properties: {
				/**
				 * Key of {@link sap.gantt.config.ObjectType}
				 */
				objectTypeKey: {type: "string", defaultValue: null},
				/**
				 * Attribute name of the column
				 */
				attribute: {type: "string", defaultValue: null}
			}
		}
	});

	return ColumnAttribute;
}, true);