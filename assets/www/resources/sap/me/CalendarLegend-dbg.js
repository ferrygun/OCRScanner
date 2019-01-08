/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2016 SAP SE. All rights reserved
    
 */

// Provides control sap.me.CalendarLegend.
sap.ui.define(['jquery.sap.global', './library', 'sap/ui/core/Control', 'sap/ui/core/IconPool', 'sap/ui/core/theming/Parameters'],
	function(jQuery, library, Control, IconPool, Parameters) {
	"use strict";


	
	/**
	 * Constructor for a new CalendarLegend.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given 
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Legend for the calendar control
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 *
	 * @constructor
	 * @public
	 * @deprecated Since version 1.34.0.
	 * This control was experimental since 1.12. Please use the sap.ui.unified.CalendarLegend instead!
	 * @alias sap.me.CalendarLegend
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var CalendarLegend = Control.extend("sap.me.CalendarLegend", /** @lends sap.me.CalendarLegend.prototype */ { metadata : {
	
		library : "sap.me",
		properties : {
	
			/**
			 * legend for type 00
			 */
			legendForType00 : {type : "string", group : "Misc", defaultValue : null},
	
			/**
			 * legend for type 01
			 */
			legendForType01 : {type : "string", group : "Misc", defaultValue : null},
	
			/**
			 * legend for type 04
			 */
			legendForType04 : {type : "string", group : "Misc", defaultValue : null},
	
			/**
			 * legend for type 06
			 */
			legendForType06 : {type : "string", group : "Misc", defaultValue : null},
	
			/**
			 * legend for type 07
			 */
			legendForType07 : {type : "string", group : "Misc", defaultValue : null},
	
			/**
			 * legend for today
			 */
			legendForToday : {type : "string", group : "Misc", defaultValue : null},
	
			/**
			 * legend for selected
			 */
			legendForSelected : {type : "string", group : "Misc", defaultValue : null},
	
			/**
			 * legend for selected 00
			 */
			legendForSelected00 : {type : "string", group : "Misc", defaultValue : null},
	
			/**
			 * legend for normal
			 */
			legendForNormal : {type : "string", group : "Misc", defaultValue : null},
	
			/**
			 * Indicates if the legend can be collapsed and expanded
			 */
			expandable : {type : "boolean", group : "Misc", defaultValue : true},
	
			/**
			 * Indicates if the legend is expanded or not
			 */
			expanded : {type : "boolean", group : "Misc", defaultValue : true},
	
			/**
			 * Indicates the whole component width
			 */
			width : {type : "sap.ui.core.CSSSize", group : "Dimension", defaultValue : 'auto'},
	
			/**
			 * Indicates the legend items width
			 */
			legendWidth : {type : "sap.ui.core.CSSSize", group : "Dimension", defaultValue : '12.5rem'},
	
			/**
			 * Indicates if the legend is visible
			 */
			visible : {type : "boolean", group : "Appearance", defaultValue : true},
	
			/**
			 * design name for the legend
			 */
			design : {type : "sap.me.CalendarDesign", group : "Appearance", defaultValue : sap.me.CalendarDesign.Approval}
		},
		aggregations : {
	
			/**
			 * label aggregation
			 */
			labels : {type : "sap.m.Label", multiple : true, singularName : "label", visibility : "hidden"}, 
	
			/**
			 * colors aggregation
			 */
			colors : {type : "sap.ui.core.Control", multiple : true, singularName : "color", visibility : "hidden"}, 
	
			/**
			 * Expand / collapse icon
			 */
			icon : {type : "sap.ui.core.Icon", multiple : false, visibility : "hidden"}
		}
	}});
	
	CalendarLegend.prototype.init = function() {
		this._createIcon();
		IconPool.insertFontFaceStyle();
		this._legendIndex = [];
	};
	
	
	CalendarLegend.prototype.setLegendForType00 = function( iValue ){
		this._setLegendLabelByName("ForType00",iValue);
	};
	CalendarLegend.prototype.setLegendForType01 = function( iValue ){
		this._setLegendLabelByName("ForType01",iValue);
	};
	CalendarLegend.prototype.setLegendForType04 = function( iValue ){
		this._setLegendLabelByName("ForType04",iValue);
	};
	CalendarLegend.prototype.setLegendForType06 = function( iValue ){
		this._setLegendLabelByName("ForType06",iValue);
	};
	CalendarLegend.prototype.setLegendForType07 = function( iValue ){
		this._setLegendLabelByName("ForType07",iValue);
	};
	CalendarLegend.prototype.setLegendForToday= function( iValue ){
		this._setLegendLabelByName("ForToday",iValue);
	};
	CalendarLegend.prototype.setLegendForSelected = function( iValue ){
		this._setLegendLabelByName("ForSelected",iValue);
	};
	CalendarLegend.prototype.setLegendForSelected00 = function( iValue ){
		this._setLegendLabelByName("ForSelected00",iValue);
	};
	CalendarLegend.prototype.setLegendForNormal = function( iValue ){
		this._setLegendLabelByName("ForNormal",iValue);
	};
	CalendarLegend.prototype.setExpanded = function( iValue ){
		this.setProperty("expanded", iValue);
		this._changeIconSrc();
	};
	
	CalendarLegend.prototype._setLegendLabelByName = function(iName,iValue){
		var olabel = sap.ui.getCore().byId(this.getId()+"-"+iName);
		var oColor = sap.ui.getCore().byId(this.getId()+'-Color'+iName);
		if(!olabel){ // create label and add to aggregation
			olabel = new sap.m.Label(this.getId() + '-'+iName,{
				width:"auto"
			});
			olabel.addStyleClass("sapUIMeCalendarLegendLabels");
			this.addAggregation("labels",olabel,true);
			olabel.setText(iValue);
			// create box label
			oColor = new sap.m.Label(this.getId() + '-Color'+iName);
			oColor.addStyleClass("sapUIMeLegendColor");
			oColor.addStyleClass("sapUIMeLegendColor"+iName);
			this.addAggregation("colors",oColor,true);
			this._legendIndex.push(iName);

		} else {
			
			olabel.setText(iValue);
			if(!iValue){
				this.removeAggregation("colors",oColor,true);
				this.removeAggregation("labels",olabel,true);
	
			}
			else{
				var index = this._legendIndex.indexOf(iName);
				this.insertAggregation("colors",oColor,index,true);
				this.insertAggregation("labels",olabel,index,true);
			}
	
		}
		this.setProperty("legend"+iName,iValue);
	
	};
	CalendarLegend.prototype.setExpandable= function( iValue ){
		this.setProperty("expandable",iValue);
		if(!iValue && !this.getExpanded()){
			this.toggleExpandCollapse();
		}
	};
	CalendarLegend.prototype.setVisible= function( iValue ){
		this.setProperty("visible",iValue);
	};
	
	CalendarLegend.prototype.toggleExpandCollapse = function() {
		if(!this.getExpandable())
			return;
		var bExpand = !this.getExpanded();
		//this.setExpanded(bExpand);
		var $container = this.$("LegendMenu");	
		if (bExpand) {
			this.$("LegendMenu").css("display","none").css("height","auto");
			$container.slideDown('600', "swing",jQuery.proxy(this.onTransitionEnded, this));
		} else {
			$container.slideUp('600', jQuery.proxy(this.onTransitionEnded, this));
		}
		this.setProperty("expanded", bExpand,true);
		this._changeIconSrc();
	
	};
	CalendarLegend.prototype._createIcon = function() {
		var sIconName = this.getExpanded() ? "collapse" : "expand";
		var sColor = Parameters.get("sapUiLightIcon");
		var sActiveBgColor = Parameters.get("sapUiHighlight");
		var sActiveColor = Parameters.get("sapUiIconInverted");
		var oIcon = new sap.ui.core.Icon(this.getId() + sIconName,{
				src: IconPool.getIconURI(sIconName),
				color: sColor,
				activeBackgroundColor: sActiveBgColor,
				activeColor: sActiveColor,
				press: jQuery.proxy(this.toggleExpandCollapse,this)
		});
		oIcon.addStyleClass("sapUIMeLegendIcon");
		this.setAggregation("icon",oIcon,true);
	};
	CalendarLegend.prototype._getColorBoxStyle = function(oID) {
		var id = this.getId() + "-";
		var styleName = oID.substr(oID.indexOf(id) + id.length);
		styleName = "sapUIMeLegendColor"+styleName;
		return styleName;
	};
	
	CalendarLegend.prototype._changeIconSrc =function () {
		var sIconName = this.getExpanded() ? "collapse" : "expand";
		this.getAggregation("icon").setSrc(IconPool.getIconURI(sIconName));
	};

	return CalendarLegend;

}, /* bExport= */ true);
