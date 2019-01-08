/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2016 SAP SE. All rights reserved
    
 */

// Provides control sap.me.OverlapCalendarEvent.
sap.ui.define(['jquery.sap.global', './library', 'sap/ui/core/Element'],
	function(jQuery, library, Element) {
	"use strict";


	
	/**
	 * Constructor for a new OverlapCalendarEvent.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given 
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Represent the data of an event for the overlap calendar
	 * @extends sap.ui.core.Element
	 *
	 * @constructor
	 * @public
	 * @deprecated Since version 1.34.0.
	 * This control was experimental since 1.12. Please use the sap.ui.unified.CalendarAppointment instead!
	 * @alias sap.me.OverlapCalendarEvent
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var OverlapCalendarEvent = Element.extend("sap.me.OverlapCalendarEvent", /** @lends sap.me.OverlapCalendarEvent.prototype */ { metadata : {
	
		library : "sap.me",
		properties : {
	
			/**
			 * The first day of the event
			 */
			startDay : {type : "string", group : "Data", defaultValue : null, bindable : "bindable"},
	
			/**
			 * Last day of the event
			 */
			endDay : {type : "string", group : "Data", defaultValue : null, bindable : "bindable"},
	
			/**
			 * Indicates if this elements is relevant to be consider in the overlap
			 */
			relevant : {type : "boolean", group : "Misc", defaultValue : null, bindable : "bindable"},
	
			/**
			 * Type of the event. Display in the second label (no overlap)
			 */
			type : {type : "string", group : "Data", defaultValue : null, bindable : "bindable"},
	
			/**
			 * The CSS class to use
			 */
			typeName : {type : "string", group : "Appearance", defaultValue : null, bindable : "bindable"},
	
			/**
			 * Is this half a day
			 */
			halfDay : {type : "boolean", group : "Data", defaultValue : false, bindable : "bindable"},
	
			/**
			 * Id of the row on which to place this event
			 */
			row : {type : "int", group : "Data", defaultValue : -1, bindable : "bindable"},
	
			/**
			 * Name of the row
			 */
			name : {type : "string", group : "Misc", defaultValue : null, bindable : "bindable"}
		}
	}});
	

	return OverlapCalendarEvent;

}, /* bExport= */ true);
