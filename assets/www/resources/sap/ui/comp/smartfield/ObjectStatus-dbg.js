/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
	"jquery.sap.global", "sap/ui/comp/library", "sap/ui/core/Element"
], function(jQuery, library, Element) {
	"use strict";

	/**
	 * Constructor for a new <code>SmartField/ObjectStatus</code>.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class Defines a possible object status control to be rendered. The smart field may ignore the proposal.
	 * @extends sap.ui.core.Element
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartfield.ObjectStatus
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var ObjectStatus = Element.extend("sap.ui.comp.smartfield.ObjectStatus", /** @lends sap.ui.comp.smartfield.ControlProposal.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			properties: {

				/**
				 * Optional attribute, which can be set, if the control type has the value ObjectStatus.
				 */
				criticality: {
					type: "any",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Optional attribute, which can be set to control how the criticality is visualized.
				 */
				criticalityRepresentationType: {
					type: "sap.ui.comp.smartfield.CriticalityRepresentationType",
					group: "Misc",
					defaultValue: sap.ui.comp.smartfield.CriticalityRepresentationType.WithIcon
				}
			}
		}
	});

	return ObjectStatus;

}, /* bExport= */true);
