/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2017 SAP SE. All rights reserved
 */
sap.ui.jsview("sap.collaboration.components.fiori.feed.commons.Detail",{getControllerName:function(){return"sap.collaboration.components.fiori.feed.commons.Detail";},createContent:function(c){var l=this.getViewData().langBundle;this.sPrefixId=this.getViewData().controlId;this.oDetailPage=new sap.m.Page(this.sPrefixId+"feedDetailsPage",{title:l.getText("FRV_DOMAIN_DATA_FEED_TYPES_FOLLOWS"),enableScrolling:false,content:[new sap.m.ScrollContainer(this.sPrefixId+"widgetContainer",{width:"100%",height:"100%",horizontal:false,vertical:false})]});return this.oDetailPage;}});
