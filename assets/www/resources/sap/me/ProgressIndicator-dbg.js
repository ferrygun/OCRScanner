/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2016 SAP SE. All rights reserved
    
 */

// Provides control sap.me.ProgressIndicator.
sap.ui.define(['jquery.sap.global', './library', 'sap/ui/core/Control'],
	function(jQuery, library, Control) {
	"use strict";


	
	/**
	 * Constructor for a new ProgressIndicator.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given 
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Shows the progress of a process in a graphical way. The indicator can be displayed with or without numerical values.
	 * The filling can be displayed in color only, or additionally with the percentage rate. The indicator status can be interactive.
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 *
	 * @constructor
	 * @public
	 * @deprecated Since version 1.14. 
	 * This control is replaced by sap.m.ProgressIndicator
	 * @alias sap.me.ProgressIndicator
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var ProgressIndicator = Control.extend("sap.me.ProgressIndicator", /** @lends sap.me.ProgressIndicator.prototype */ { metadata : {
	
		deprecated : true,
		library : "sap.me",
		properties : {
	
			/**
			 * Invisible controls are not rendered
			 */
			visible : {type : "boolean", group : "Behavior", defaultValue : true},
	
			/**
			 * Switches enabled state of the control. Disabled fields have different colors, and cannot be focused.
			 */
			enabled : {type : "boolean", group : "Behavior", defaultValue : true},
	
			/**
			 * The color of the bar. Enumeration sap.ui.core.BarColor provides CRITICAL (yellow), NEGATIVE (red), POSITIVE (green), NEUTRAL (blue) (default value).
			 */
			barColor : {type : "sap.ui.core.BarColor", group : "Appearance", defaultValue : sap.ui.core.BarColor.NEUTRAL},
	
			/**
			 * The text value to be displayed in the bar.
			 */
			displayValue : {type : "string", group : "Appearance", defaultValue : '0%'},
	
			/**
			 * The numerical value for the displayed length of the progress bar.
			 */
			percentValue : {type : "int", group : "Data", defaultValue : 0},
	
			/**
			 * Specifies whether the current value shall be rendered inside the bar.
			 */
			showValue : {type : "boolean", group : "Appearance", defaultValue : true},
	
			/**
			 * The width of the control.
			 */
			width : {type : "sap.ui.core.CSSSize", group : "Dimension", defaultValue : '100%'}
		}
	}});
	
	
	ProgressIndicator.prototype.setEndBar = function () {
	
		var widthBar = this.getPercentValue();
		var widthBorder;
		var sBarColor = this.getBarColor();
		var time;
	
		this.oBar  = this.getDomRef("bar");
		this.oEnd  = this.getDomRef("end");
		this.oBox  = this.getDomRef("box");
	
		jQuery(this.oEnd).removeClass('sapUIMeProgIndEndHidden');
	 	jQuery(this.oEnd).addClass('sapUIMeProgIndEnd');
	
		if (widthBar > 100) {
			widthBorder = (10000 / widthBar) + '%';
		}
		else {
			widthBorder = '100%';
		}
	
		if (widthBar > 100) {
			time = (widthBar - 100) * 20;
		}
		else {
			time = (100 - widthBar) * 20;
		}
	
		jQuery(this.oBox).animate({width: widthBorder}, 0, 'linear');
	 	jQuery(this.oEnd).animate({left: widthBorder}, time, 'linear');
		jQuery(this.oBar).animate({width: widthBar + '%'}, time, 'linear');
	
		if(!this.oThis){
			this.oThis = this.$();
		}
	
	};
	
	ProgressIndicator.prototype.setEndBarGoesBack = function (iPercentValue) {
	
		var widthBar = this.getPercentValue();
		var widthBorder;
		var sBarColor = this.getBarColor();
		var time;
	
		this.oBar  = this.getDomRef("bar");
		this.oEnd  = this.getDomRef("end");
		this.oBox  = this.getDomRef("box");
	
		if (iPercentValue > 100) {
			widthBorder = (10000 / iPercentValue) + '%';
		}
		else {
			widthBorder = '100%';
		}
	
	 	jQuery(this.oEnd).removeClass('sapUIMeProgIndEnd');
	 	jQuery(this.oEnd).addClass('sapUIMeProgIndEndHidden');
	
		if (widthBar > 100) {
			time = (widthBar - 100) * 20;
		}
		else {
			time = (100 - widthBar) * 20;
		}
	
		jQuery(this.oBox).animate({width: widthBorder}, 0, 'linear');
		jQuery(this.oEnd).animate({left: widthBorder}, time, 'linear');
	 	jQuery(this.oBar).animate({width: widthBar + '%'}, time, 'linear');
	
		if(!this.oThis){
			this.oThis = this.$();
		}
	
	};
	
	/**
	 * Property setter for the PercentValue
	 * A new rendering is not necessary, only the bar has to be moved.
	 *
	 * @param iPercentValue
	 * @return {sap.me.ProgressIndicator} <code>this</code> to allow method chaining
	 * @public
	 */
	ProgressIndicator.prototype.setPercentValue = function(iPercentValue) {
	
		var widthBar = this.getPercentValue();
		var widthBorder;
		var sBarColor = this.getBarColor();
	
		this.oBar  = this.getDomRef("bar");
		this.oEnd  = this.getDomRef("end");
		this.oBox  = this.getDomRef("box");
	
		var that = this;
		var time;
	
		if (iPercentValue < 0) {
			iPercentValue = 0;
		}
	
		if (iPercentValue > 100) {
			widthBorder = (10000 / iPercentValue) + '%';
		}
		else {
			widthBorder = '100%';
		}
	
		if(!this.oBar){
			// Not already rendered -> return and render
			time = iPercentValue * 20;
			this.setProperty('percentValue', iPercentValue, true); // No re-rendering!
			jQuery(this.oBar).animate({width: iPercentValue + '%'}, time, 'linear');
			return this;
		}
	
		if (iPercentValue > 100 && widthBar <= 100) {
			time = (100 - widthBar) * 20;
			this.setProperty( 'percentValue', iPercentValue, true ); // Do not render complete control again
			jQuery(this.oBar).animate({width: '100%'}, time, 'linear', function() {
			that.setEndBar();
			});
		}
		else if (iPercentValue <= 100 && widthBar > 100) {
			time = (widthBar - 100) * 20;
			this.setProperty( 'percentValue', iPercentValue, true ); // Do not render complete control again
			jQuery(this.oBar).animate({width: '100%'}, time, 'linear', function() {
			that.setEndBarGoesBack();
			});
		}
		else if (iPercentValue > 100 && widthBar > 100) {
			if (iPercentValue > widthBar) {
				time = (iPercentValue - widthBar) * 20;
			}
			else {
				time = (widthBar - iPercentValue) * 20;
			}
			widthBorder = (10000 / iPercentValue) + '%';
			this.setProperty( 'percentValue', iPercentValue, true ); // Do not render complete control again
	
			jQuery(this.oBox).animate({width: widthBorder}, 0, 'linear');
	 	 	jQuery(this.oEnd).animate({left: widthBorder}, time, 'linear');
			jQuery(this.oBar).animate({width: iPercentValue + '%'}, time, 'linear', function() {
			});
	
			if(!this.oThis){
				this.oThis = this.$();
			}
	 	}
		else {
			if (iPercentValue > widthBar) {
				time = (iPercentValue - widthBar) * 20;
			}
			else {
				time = (widthBar - iPercentValue) * 20;
			}
			this.setProperty( 'percentValue', iPercentValue, true ); // Do not render complete control again
			jQuery(this.oBar).animate({width: iPercentValue + '%'}, time, 'linear');
			if(!this.oThis){
				this.oThis = this.$();
			}
	 	}
	
		return this;
	};
	

	return ProgressIndicator;

}, /* bExport= */ true);
