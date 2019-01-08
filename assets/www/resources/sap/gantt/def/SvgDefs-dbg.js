/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/ui/base/ManagedObject",'sap/ui/core/Element'
], function (ManagedObject, Element) {
	"use strict";

	/**
	 * SVG definition tag class.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * The class handles the container tag "defs" for all reusable SVG graphic definitions. It provides 
	 * interfaces for SVG definition strings and referencing strings. The parent class is responsible for 
	 * rendering the definition strings.
	 * 
	 * <p>
	 * SVG uses the 'defs' tag to represent graphic objects that are defined for reuse at a later time.
	 * See {@link http://www.w3.org/TR/SVG/struct.html#DefsElement 'defs' in SVG}.
	 * Currently <code>sap.gantt</code> provides defs including the following definition tags:
	 * 'pattern', 'gradient', and 'filter'. Applications can also extend this base class to support more functionality.
	 * </p>
	 * 
	 * @extends sap.ui.base.ManagedObject
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.def.SvgDef
	 */
	var SvgDefs = Element.extend("sap.gantt.def.SvgDefs", /** @lends sap.gantt.def.SvgDefs.prototype */{
		metadata: {
			aggregations: {
				
				/**
				 * SVG definition instances.
				 */
				defs: {type: "sap.gantt.def.DefBase", multiple: true, visibility: "public",
					singularName: "def", bindable: "bindable"}
			}
		}
	});

	/**
	 * Definition string of the SVG 'defs' tag.
	 * 
	 * @returns {string} - Definition string to be rendered by caller.
	 * @public
	 */
	SvgDefs.prototype.getDefString = function () {
		var sRetVal = "<defs id='" + this.getId() + "'>",
			aDefs = this.getDefs();
		
		if (aDefs && aDefs.length > 0) {
			aDefs.forEach(function(oDef, iIndex){
				sRetVal += oDef.getDefString();
			});
		}
		
		return sRetVal + "</defs>";
	};

	/**
	 * Definition data of the SVG 'def' tag. -- experimental
	 * 
	 * @returns {object} - Definition string to be rendered by caller.
	 * @private
	 */
	SvgDefs.prototype.getDefNode = function () {
		var oRetVal = {
			"id": this.getId(),
			"defNodes": []
		};
		var aDefs = this.getDefs();
		
		for (var i = 0; i < aDefs.length; i++){
			oRetVal.defNodes.push(aDefs[i].getDefNode());
		}
		return oRetVal;
	};

	return SvgDefs;
}, true);
