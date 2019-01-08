/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/ui/core/Control", "sap/m/NavContainer", "sap/m/Page", "sap/m/List", "sap/m/StandardListItem"
], function (Control, NavContainer, Page, List, StandardListItem) {
	"use strict";

	/**
	 * Creates and initializes a new legend container.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * The LegendContainer control uses the NavContainer control to handle hierarchical navigation between legend sections. The LegendContainer control
	 * contains an initial navigation page. Both the initial navigation page legend sections are Page controls.
	 * 
	 * @extends sap.ui.core.Control
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.legend.LegendContainer
	 */
	var LegendContainer = Control.extend("sap.gantt.legend.LegendContainer", /** @lends sap.gantt.legend.Legend.prototype */ {
		metadata: {
			properties: {
				/**
				 * Width of the legend navigation. When the width specified is smaller than a section content, a horizontal scroll bar appears.width of the legend navigation. When the width specified is smaller than a section content, a horizontal scroll bar appears.
				 */
				width: {type : "sap.ui.core.CSSSize", group: "Misc", defaultValue: "200px"},

				/**
				 * Height of the legend navigation. When the height specified is smaller than a section content, a vertical scroll bar appears.
				 */
				height: {type : "sap.ui.core.CSSSize", group: "Misc", defaultValue: "200px"}
			},
			aggregations : {
				/**
				 * <p>This aggregation specifies the title of a legend section. When you add the legend section to a legend navigation container, 
				 * you must specify a title for the legend section so that the section can be identified in the initial navigation list. Otherwise, 
				 * your legend section is not reachable via GUI.
				 */
				legendSections : {type: "sap.m.Page", multiple: true, visibility: "public", singularName: "legendSection"}
			}
		}
	});

	/**
	 * Creates a control instance of NavContainer for the legend and the initial navigation page
	 * 
	 * @private
	 */
	LegendContainer.prototype.init = function(){
		this._oRb = sap.ui.getCore().getLibraryResourceBundle("sap.gantt");
		this._sTitle = this._oRb.getText("LEGEND_TITLE");
		this._oNavContainer = new NavContainer({
			width: this.getWidth(),
			height: this.getHeight()
		});
		this._oInitNavPage = new Page({title: this._oRb.getText("LEGEND_TITLE"),
										content: [new List()]
									});
		//this._oNavContainer.addPage(this._oInitNavPage);
		this._aLegendSections = [];
	};

	LegendContainer.prototype.setWidth = function(sWidth){
		this.setProperty("width", sWidth, true);
		this._oNavContainer.setWidth(sWidth);
		return this;
	};

	LegendContainer.prototype.setHeight = function(sHeight){
		this.setProperty("height", sHeight, true);
		this._oNavContainer.setHeight(sHeight);
		return this;
	};

	LegendContainer.prototype.addLegendSection = function(oLegendSection){
		if (oLegendSection) {
			if (this._aLegendSections.length == 1) {
				this._oNavContainer.insertPage(this._oInitNavPage, 0);
				this._aLegendSections[0].setShowNavButton(true);
			}

			if (this._aLegendSections.length !== 0) {
				oLegendSection.setShowNavButton(true);
			}

			oLegendSection.attachNavButtonPress(this._onNavBack, this);
			oLegendSection.setBackgroundDesign(sap.m.PageBackgroundDesign.Solid);
			oLegendSection.setEnableScrolling(true);
			var sLegendTitle = oLegendSection.getTitle();
			if (sLegendTitle !== undefined) {
				var oListItem = new StandardListItem({
					title: sLegendTitle,
					type: sap.m.ListType.Navigation
				});
				oListItem.attachPress(this._onNavToLegendSection, this);
				this._oInitNavPage.getContent()[0].addItem(oListItem);
			}
			this._aLegendSections.push(oLegendSection);
			this._oNavContainer.addPage(oLegendSection);
		}
		return this;
	};

	LegendContainer.prototype.insertLegendSection = function(oLegendSection, iIndex){
		if (oLegendSection) {
			var iMaxLength = this._aLegendSections.length;

			if (iMaxLength == 1) {
				this._oNavContainer.insertPage(this._oInitNavPage, 0);
				this._aLegendSections[0].setShowNavButton(true);
			}

			if (iMaxLength !== 0) {
				oLegendSection.setShowNavButton(true);
			}

			if (iIndex >= iMaxLength) {
				iIndex = iMaxLength;
			}

			oLegendSection.attachNavButtonPress(this._onNavBack, this);
			oLegendSection.setBackgroundDesign(sap.m.PageBackgroundDesign.Solid);
			oLegendSection.setEnableScrolling(true);
			var sLegendTitle = oLegendSection.getTitle();
			if (sLegendTitle !== undefined) {
				var oListItem = new StandardListItem({
					title: sLegendTitle,
					type: sap.m.ListType.Navigation
				});
				oListItem.attachPress(this._onNavToLegendSection, this);
				this._oInitNavPage.getContent()[0].insertItem(oListItem, iIndex);
			}
			this._oNavContainer.insertPage(oLegendSection, iIndex + 1);
			this._aLegendSections.splice(iIndex, 0, oLegendSection);
		}
		return this;
	};

	LegendContainer.prototype.indexOfLegendSection = function(oLegendSection){
		var iIndex = jQuery.inArray(oLegendSection, this._aLegendSections);
		return iIndex;
	};

	LegendContainer.prototype.removeLegendSection = function(vPage){
		var oRetValue;
		if ((typeof vPage) === "number") {
			this._oNavContainer.removePage(vPage + 1);
			this._oInitNavPage.getContent()[0].removeItem(vPage);
			oRetValue = this._aLegendSections.splice(vPage + 1, 1);
		} else if (vPage) {
			this._oInitNavPage.getContent()[0].removeItem(jQuery.inArray(vPage, this._oNavContainer.getPages()) - 1);
			this._oNavContainer.removePage(vPage);
			oRetValue = this._aLegendSections.splice(jQuery.inArray(vPage, this._aLegendSections), 1);
		}

		if (this._aLegendSections.length == 1) {
			if (this._oNavContainer.getCurrentPage() == this._oInitNavPage) {
				this._oNavContainer.to(this._aLegendSections[0]);
			}
			this._aLegendSections[0].setShowNavButton(false);
		}
		return oRetValue;
	};

	LegendContainer.prototype.removeAllLegendSection = function(){
		var aRemovedLegendSections = this._aLegendSections.splice(0, this._aLegendSections.length);
		this._oInitNavPage.getContent()[0].removeAllItems();
		this._oNavContainer.removeAllPages();

		return aRemovedLegendSections;
	};

	LegendContainer.prototype.getLegendSections = function(){
		var aPages = this._oNavContainer.getPages();
		var that = this;
		return aPages.filter(function(oValue){
			if (oValue.getTitle() !== that._sTitle) {
				return true;
			}
		});
	};

	/**
	 * Returns the control instance of List Control for the initial navigation page
	 * 
	 * @return {sap.m.Page} Control instance of the initial navigation page
	 * @public
	 */
	LegendContainer.prototype.getNavigationPage = function(){
		return this._oInitNavPage;
	};

	/**
	 * Returns the navigation items in the initial navigation list
	 * 
	 * @return {sap.m.StandardListItem} Control instance of the initial page
	 * @public
	 */
	LegendContainer.prototype.getNavigationItems = function(){
		return this._oInitNavPage.getContent()[0].getItems();
	};

	/**
	 * Returns the currently displayed legend section. If no legend section is added, this function returns the initial navigation page.
	 *
	 * @return {sap.m.Page} Control instance of the legend section
	 * @public
	 */
	LegendContainer.prototype.getCurrentLegendSection = function(){
		return this._oNavContainer.getCurrentPage();
	};

	/**
	 * Navigates to the detailed legend section page.
	 *
	 * @param {object} oEvent Object that has been passed by clicking an item in the initial navigation page
	 * @private
	 */
	LegendContainer.prototype._onNavToLegendSection = function(oEvent){
		var sLegendSectionName = oEvent.getSource().getTitle();

		for (var i = 0; i < this._aLegendSections.length; i++) {
			if (sLegendSectionName == this._aLegendSections[i].getTitle()){
				this._oNavContainer.to(this._aLegendSections[i]);
			}
		}
	};

	/**
	 * Navigates back to the initial navigation page.
	 *
	 * @param {object} oEvent Object that has been passed by clicking return button
	 * @private
	 */
	LegendContainer.prototype._onNavBack = function(oEvent) {
		this._oNavContainer.to(this._oInitNavPage);
	};

	return LegendContainer;
});
