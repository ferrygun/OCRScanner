/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

sap.ui.define([ "jquery.sap.global", "sap/ui/base/Object", "sap/ui/core/Control", "./HtmlElementRenderer" ],
	function(jQuery, BaseObject, Control, HtmlElementRenderer) {
	"use strict";

	/**
	 * Creates a HtmlElement which resembles one HTML tag.
	 *
	 * @class HtmlElement A model class for holding information about one HTML tag.
	 *
	 * @extends sap.ui.base.Object
	 *
	 * @param {string} sName Tag name (eg. div, ul etc.).
	 *
	 * @constructor
	 * @alias sap.suite.ui.commons.util.HtmlElement
	 * @protected
	 */
	var HtmlElement = BaseObject.extend("sap.suite.ui.commons.util.HtmlElement", {
		constructor: function(sName) {
			BaseObject.apply(this, arguments);

			jQuery.sap.assert(typeof sName === "string", "Element name must be a string.");
			this._sName = sName;
			this._mAttributes = {};
			this._aChildren = [];
		}
	});

	/**
	 * Returns a renderer for this tag.
	 * @returns {sap.suite.ui.commons.util.HtmlElementRenderer} The newly created renderer instance
	 * @protected
	 */
	HtmlElement.prototype.getRenderer = function() {
		return new HtmlElementRenderer(this);
	};

	/**
	 * Sets id attribute.
	 * @param {string} sId Id to set.
	 * @param {boolean} [bAddSapUi="false"] If true, data-sap-ui will be set to the Id as well.
	 * @protected
	 */
	HtmlElement.prototype.setId = function(sId, bAddSapUi) {
		jQuery.sap.assert(typeof sId === "string", "Id must by a string.");
		this.setAttribute("id", sId);
		if (bAddSapUi) {
			this.setAttribute("data-sap-ui", sId);
		}
	};

	/**
	 * Sets an attribute.
	 * @param {string} sKey Attribute name.
	 * @param {string|number|boolean} oValue Value of an attribute.
	 * @param {boolean} [bEscape="false"] Tells if the value should be escaped using encodeHTML.
	 * @protected
	 */
	HtmlElement.prototype.setAttribute = function(sKey, oValue, bEscape) {
		jQuery.sap.assert(typeof sKey === "string", "Key must by a string.");
		jQuery.sap.assert(typeof oValue === "string" || typeof oValue === "number" || typeof oValue === "boolean", "Value must be a string, number or boolean");
		var sVal = String(oValue);
		if (bEscape) {
			sVal = jQuery.sap.encodeHTML(sVal);
		}
		if (sKey in this._mAttributes) {
			jQuery.sap.log.warning("Replacing an already existing attribute.", "Attribute key = " + sKey + ", old value = " + this._mAttributes[sKey] + ", new value = " + sVal, this);
		}
		this._mAttributes[sKey] = sVal;
	};

	/**
	 * Adds a class.
	 * @param {string} sClass - CSS class to add.
	 * @protected
	 */
	HtmlElement.prototype.addClass = function(sClass) {
		jQuery.sap.assert(typeof sClass === "string", "Class must be a string.");
		if (!this._mAttributes.class) {
			this._mAttributes.class = [];
		} else {
			jQuery.sap.assert(jQuery.isArray(this._mAttributes.class), "Cannot add class to customly added classes.");
		}
		this._mAttributes.class.push(sClass);
	};

	/**
	 * Adds a HTML style (eg. "color:red").
	 * @param {string} sName Name of the style (eg. margin, color).
	 * @param {string|number} oValue Value of the style.
	 * @protected
	 */
	HtmlElement.prototype.addStyle = function(sName, oValue) {
		jQuery.sap.assert(typeof sName === "string", "Name must be a string.");
		jQuery.sap.assert(typeof oValue === "string" || typeof oValue === "number", "Value must be a string or a number.");
		if (!this._mAttributes.style) {
			this._mAttributes.style = [];
		} else {
			jQuery.sap.assert(jQuery.isArray(this._mAttributes.style), "Cannot add style to customly added styles.");
		}
		this._mAttributes.style.push(sName + ":" + oValue);
	};

	/**
	 * Adds all html relevant data from UI5 control. It sets ID, adds all custom data and adds custom style classes.
	 * This function should be called on the element which resembles the rendered control. It's usually the top element.
	 * @param {sap.ui.core.Control} oControl Control to load data from. Usually the control which resembles this element.
	 * @protected
	 */
	HtmlElement.prototype.addControlData = function(oControl) {
		jQuery.sap.assert(oControl instanceof Control, "Control must be a sapui5 control.");
		this.setId(oControl.getId(), true);
		var that = this; //eslint-disable-line
		oControl.getCustomData().forEach(function(oData) {
			var oCheckResult = oData._checkWriteToDom(oControl);
			if (oCheckResult) {
				that.setAttribute(oCheckResult.key, oCheckResult.value, true);
			}
		});
		if (oControl.aCustomStyleClasses && oControl.aCustomStyleClasses.length > 0) {
			oControl.aCustomStyleClasses.forEach(function(cls) {
				that.addClass(jQuery.sap.encodeHTML(cls));
			});
		}
	};

	/**
	 * Adds a child to the element. A child can be either text, another HtmlElement or a Control. Children will e rendered
	 * as a content of this element.
	 * @param {string|sap.suite.ui.commons.util.HtmlElement|sap.ui.core.Control} oChild Child to add.
	 * @protected
	 */
	HtmlElement.prototype.addChild = function(oChild) {
		jQuery.sap.assert(typeof oChild === "string" || oChild instanceof HtmlElement || oChild instanceof Control, "Child must be a string, HtmlElement or a Control.");
		this._aChildren.push(oChild);
	};

	/**
	 * Adds a string child and escapes it using encodeHTML.
	 * @param {string} sText Text to add.
	 * @param {boolean} bConvertLineBreakToBr If true, \n will be converted to <br>.
	 * @protected
	 */
	HtmlElement.prototype.addChildEscaped = function(sText, bConvertLineBreakToBr) {
		jQuery.sap.assert(typeof sText === "string", "sText must be a string");
		sText = jQuery.sap.encodeHTML(sText);
		if (bConvertLineBreakToBr) {
			sText = sText.replace(/&#xa;/g, "<br>");
		}
		this._aChildren.push(sText);
	};

	return HtmlElement;
});
