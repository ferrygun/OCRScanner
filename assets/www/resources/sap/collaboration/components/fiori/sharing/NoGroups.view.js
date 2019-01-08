/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2017 SAP SE. All rights reserved
 */
sap.ui.jsview("sap.collaboration.components.fiori.sharing.NoGroups",{getControllerName:function(){return"sap.collaboration.components.fiori.sharing.NoGroups";},createContent:function(c){var p=this.getViewData().controlId;this.oNoGroupsVBox=new sap.m.VBox(p+"_NoGroupsVbox");this.oNoGroupsVBox.addItem(this.createNoDataLayout());return this.oNoGroupsVBox;},createNoDataLayout:function(c){var p=this.getViewData().controlId;var l=this.getViewData().langBundle;var j=this.getViewData().jamUrl;this.oNoDataLayout=new sap.ui.layout.VerticalLayout(p+"_NoDataLayout",{width:"100%",content:[new sap.ui.core.HTML(p+"_NoDataDiv",{content:"<div>"+l.getText("NO_GROUPS_ERROR")+"</div>"}),new sap.m.VBox(p+"_LinkVbox",{alignItems:sap.m.FlexAlignItems.End,items:[new sap.m.Link(p+"_JamLink",{text:l.getText("JAM_URL_TEXT"),target:"_blank",href:j})]}).addStyleClass("linkVBox")]});return this.oNoDataLayout;}});
