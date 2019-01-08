/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/ui/core/Element"
], function (Element) {
	"use strict";
	
	/**
	 * Creates and initializes a new SVG graphic object for reuse.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * Base class for all SVG definitions.
	 * 
	 * <p>
	 * SVG uses the 'defs' tag to represent graphic objects that can be reused at a later time.
	 * See {@link http://www.w3.org/TR/SVG/struct.html#DefsElement 'defs' in SVG}.
	 * Currently <code>sap.gantt</code> provides defs including the following definition tags:
	 * 'pattern', 'gradient', and 'filter'. Applications can also extend this base class to support more functionality.
	 * </p>
	 * 
	 * @extends sap.ui.core.Element
	 * @abstract
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.def.DefBase
	 */
	var DefBase = Element.extend("sap.gantt.def.DefBase", /** @lends sap.gantt.def.DefBase.prototype */ {
		metadata : {
			"abstract": true,
			properties: {
				
				/**
				 * Definition string. Subclasses can implement their own getters of this property to override the one in this class.
				 */
				defString: {type: "string", defaultValue: null},
				
				/**
				 * Referencing string. The default implementation is the referencing ID wrapped by 'url(#)'.
				 */
				refString: {type: "string", defaultValue: null}
			}
		}
	});
	
	DefBase.prototype.getRefString = function () {
		var sDefaultRefString = this.getProperty("refString");
		return sDefaultRefString ? sDefaultRefString : "url(#" +  this.generateRefId() + ")";
	};
	
	/**
	 * Provides a referencing ID. The default implementation is to use control ID as the referencing ID.
	 * 
	 * @see sap.ui.table.Table.getSelectedIndex
	 * 
	 * @return {string} Referencing ID.
	 * @public
	 */
	DefBase.prototype.generateRefId = function () {
		return this.getId();
	};

	return DefBase;
}, true);
