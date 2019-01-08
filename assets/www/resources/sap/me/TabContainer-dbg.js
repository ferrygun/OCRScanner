/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2016 SAP SE. All rights reserved
    
 */

// Provides control sap.me.TabContainer.
sap.ui.define(['jquery.sap.global', './library', 'sap/ui/core/Control', 'sap/ui/core/IconPool', 'sap/ui/core/theming/Parameters'],
	function(jQuery, library, Control, IconPool, Parameters) {
	"use strict";


	
	/**
	 * Constructor for a new TabContainer.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given 
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * The TabContainer allow to stack 1 to 4 contents in a
	 * view with corresponding icons
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 *
	 * @constructor
	 * @public
	 * @deprecated Since version 1.15.0. 
	 * The functionality of this control is merged with the sap.m.IconTabBar.
	 * Please use the sap.m.IconTabBar instead!
	 * This control will not be supported anymore.
	 * @alias sap.me.TabContainer
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var TabContainer = Control.extend("sap.me.TabContainer", /** @lends sap.me.TabContainer.prototype */ { metadata : {
	
		deprecated : true,
		library : "sap.me",
		properties : {
	
			/**
			 * Return the index of the selected tab
			 */
			selectedTab : {type : "int", group : "Data", defaultValue : null},
	
			/**
			 * The number to display in the badge for the info tab
			 */
			badgeInfo : {type : "int", group : "Data", defaultValue : null},
	
			/**
			 * The number to display in the badge for the notes tab
			 */
			badgeNotes : {type : "int", group : "Data", defaultValue : null},
	
			/**
			 * The number to display in the badge for the attachments tab
			 */
			badgeAttachments : {type : "int", group : "Data", defaultValue : null},
	
			/**
			 * The number to display in the badge for the people tab
			 */
			badgePeople : {type : "int", group : "Data", defaultValue : null},
	
			/**
			 * Indicates if the tab can be collapsed and expanded
			 */
			expandable : {type : "boolean", group : "Misc", defaultValue : true},
	
			/**
			 * Indicates if the actual tab is expanded or not
			 */
			expanded : {type : "boolean", group : "Misc", defaultValue : true},
	
			/**
			 * setter for visible property
			 */
			visible : {type : "boolean", group : "Misc", defaultValue : true}
		},
		aggregations : {
	
			/**
			 * The tab icons in order
			 */
			tabs : {type : "sap.ui.core.Icon", multiple : true, singularName : "tab", visibility : "hidden"}, 
	
			/**
			 * The info tab
			 */
			contentInfo : {type : "sap.ui.core.Control", multiple : false}, 
	
			/**
			 * The attachments tab
			 */
			contentAttachments : {type : "sap.ui.core.Control", multiple : false}, 
	
			/**
			 * The notes tab
			 */
			contentNotes : {type : "sap.ui.core.Control", multiple : false}, 
	
			/**
			 * The people tab
			 */
			contentPeople : {type : "sap.ui.core.Control", multiple : false}, 
	
			/**
			 */
			badges : {type : "sap.ui.core.Control", multiple : true, singularName : "badge", visibility : "hidden"}
		},
		events : {
	
			/**
			 * Indicates that the selected tab has changed
			 */
			select : {allowPreventDefault : true}, 
	
			/**
			 * Indicates that the tab will expand
			 */
			expand : {}, 
	
			/**
			 * Indicates that the tab will collapse
			 */
			collapse : {}
		}
	}});
	
	
	TabContainer.prototype.init = function() {
		this.addAggregation("tabs",this._createButton("Info"));
		this.addAggregation("tabs",this._createButton("Notes"));
		this.addAggregation("tabs",this._createButton("Attachments"));
		this.addAggregation("tabs",this._createButton("People"));
		IconPool.insertFontFaceStyle();
		this._bFirstRendering = true;
	};
	
	TabContainer.prototype.setBadgeInfo = function( iValue ){
		this._setBadgeLabelByName("badgeInfo",iValue);
	};
	
	TabContainer.prototype.setBadgeAttachments = function( iValue ){
		this._setBadgeLabelByName("badgeAttachments",iValue);
	};
	TabContainer.prototype.setBadgeNotes = function( iValue ){
		this._setBadgeLabelByName("badgeNotes",iValue);
	};
	TabContainer.prototype.setBadgePeople = function( iValue ){
		this._setBadgeLabelByName("badgePeople",iValue);
	};
	TabContainer.prototype.onBeforeRendering = function() {
		if (this.getSelectedTab() == undefined) {
			this.setProperty("selectedTab", 0, true); // no invalidation when rendering phase has started
		}
	};
	
	
	TabContainer.prototype._setBadgeLabelByName = function(iName,iValue){
		var label = sap.ui.getCore().byId(this.getId()+"-"+iName);
		label.setText(iValue);
		this.setProperty(iName,iValue);
		label.toggleStyleClass("sapUIMeTabContainerHiddenBadges" , (iValue == 0) );
	};
	TabContainer.prototype._placeElements = function(){
		// Place the arrow
		var $arrow = this.$("arrow");
		var oBtn = this.getAggregation("tabs")[this.getSelectedTab()];
		if (oBtn && (oBtn.$().outerWidth() > 8)) {
			var iLeft = parseFloat(oBtn.$()[0].offsetLeft) + parseFloat(oBtn.$().outerWidth() / 2) - parseFloat($arrow.width() / 2);
			$arrow.css("left", iLeft + "px");
		}
	};
	
	
	TabContainer.prototype.onAfterRendering = function() {
		this.setProperty("expanded", true, true);
		if( this._bFirstRendering){
			this._bFirstRendering = false;
			setTimeout(jQuery.proxy(this._placeElements,this),300); // Timeout to make sure the icon are placed
		} else {
			this._placeElements();
		}
	};
	
	TabContainer.prototype.onThemeChanged  = function() {
		this._placeElements();
	};
	
	
	TabContainer.prototype.onTransitionEnded = function() {
		var $container = this.$("container");
		if( this.getExpanded()){ // expanding
			this.$("arrow").show();
			$container.css("display" , "block");
			this.$().find(".sapUIMeTabContainerContent").removeClass("sapUIMeTabContainerContentClosed");
		}else{ // collapsing
			$container.css("display" , "none");
			this.$().find(".sapUIMeTabContainerContent").addClass("sapUIMeTabContainerContentClosed");
		}
	};
	
	TabContainer.prototype.toggleExpandCollapse = function() {
		var bExpand = !this.getExpanded();
		var $container = this.$("container");
	
		var $arrow = this.$("arrow");
		if (bExpand) {
			this.$().find(".sapUIMeTabContainerButtons").children().filter(":eq(" + this.getSelectedTab() + ")").addClass("sapUIMeTabContainerTabSelected");
			$container.slideDown('400', jQuery.proxy(this.onTransitionEnded, this));
			this.fireExpand();
		} else {
			$arrow.hide();
			this.$().find(".sapUIMeTabContainerTabSelected").removeClass("sapUIMeTabContainerTabSelected");
			$container.slideUp('400', jQuery.proxy(this.onTransitionEnded, this));
			this.fireCollapse();
		}
		this.setProperty("expanded", bExpand, true);
	};
	
	TabContainer.prototype.onButtonTap = function(oEvent) {
		var oBtn = oEvent.getSource();
		var iIndex = this.indexOfAggregation("tabs", oBtn);
		if (iIndex == this.getSelectedTab() && this.getExpandable()) {
	
			this.toggleExpandCollapse();
		} else {
	
			this.setProperty("expanded", true, true);
	
			var oBtnID = oBtn.getId();
			var oContent = this._getContentForBtn(oBtnID);
			if (oContent) {
	
				if (this.fireSelect()) {
					this.setSelectedTab(iIndex); // note: this currently rerenders. When this is changed not to rerender, then remember to also update the selected-tab CSS class!
				}
			}
	
		}
	
	};
	
	TabContainer.prototype._getContentForBtn = function(oBtnID) {
		var id = this.getId() + "-";
		var contentName = oBtnID.substr(oBtnID.indexOf(id) + id.length);
		return this.getAggregation(contentName);
	};
	TabContainer.prototype._getBagdeForBtn = function(oBtnID) {
		var id = this.getId() + "-content";
		var badgeName = oBtnID.substr(oBtnID.indexOf(id) + id.length);
		badgeName.charAt(0).toUpperCase();
		badgeName = "badge"+badgeName;
		return this.getProperty(badgeName);
	};
	
	
	TabContainer.prototype._getScrollContainer = function(oContent) {
		return new sap.m.ScrollContainer({
			content : oContent
		});
	};
	TabContainer.prototype._createButton = function(sId) {
		var sIconName = Parameters.get("sapMeTabIcon"+sId);
		var sURI = IconPool.getIconURI(sIconName);
		var sColor = Parameters.get("sapMeTabColor"+sId);
		var oBtn = new sap.ui.core.Icon(this.getId() + '-content' + sId,{
			   src: sURI,
			   backgroundColor: sColor,
			   activeColor :  Parameters.get("sapUiIconInverted")
		});
		oBtn.addStyleClass("sapUIMeTabContainerBtn");
		oBtn.addStyleClass("sapUIMeTabContainerBtn"+sId);
		oBtn.attachPress(this.onButtonTap, this);
		
		var oLabel = new sap.m.Label(this.getId() + '-badge' + sId,{
			textAlign:"Center"
	
		});
		oLabel.addStyleClass("sapUIMeTabContainerBadge");
		oLabel.addStyleClass("sapUIMeTabContainerBadge"+sId);
		this.addAggregation("badges",oLabel);
		return oBtn;
	};
	

	return TabContainer;

}, /* bExport= */ true);
