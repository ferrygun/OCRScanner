/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */
sap.ui.define(["../../library","sap/ui/base/Object","sap/ui/mdc/experimental/Action","sap/ui/model/json/JSONModel","sap/ui/model/Sorter"],function(L,B,A,J,S){"use strict";var T=B.extend("sap.ui.mdc.internal.table.Table.controller",{constructor:function(t){B.apply(this,arguments);this.oTable=t;this.oInnerTable=t.getInnerTable();}});T.prototype.handleDataRequested=function(e){this.oInnerTable.setBusy(true);};T.prototype.handleCallAction=function(e){var a=e.getParameters();var o=e.getSource();a.mode=o.getMode();if(a.mode==='Inline'){a.contexts=[o.getBindingContext()];}else{a.contexts=this.oTable.getSelectedContexts();}a.setBusy=true;a.checkBusy=true;this.oTable.fireCallAction(a);};T.prototype.getToolbarActions=function(t){var a=[];for(var i=0;i<t.length;i++){if(t[i]instanceof A){a.push(t[i]);}}return a;};T.prototype.enableDisableActionsUtil=function(s,t){var f,a,o;if(s!=null){for(var i=0;i<t.length;i++){o=t[i];f=o.getMultiplicityFrom();a=o.getMultiplicityTo();if((!f||(s>=f)&&(!a||s<=a))){o.setEnabled(true);}else{o.setEnabled(false);}}}};T.prototype.bindTableCountUtil=function(t){if(t!=null){t.setModel(this.oInnerTable.getModel(),"headerContext");}var b=this.oTable.getListBinding();if(b){t.setBindingContext(b.getHeaderContext(),"headerContext");}};T.prototype.createAndOpenViewSettingsDialog=function(v,s,c,d){if(this.oViewSettingsPropertyModel==null&&this.oViewSettingsPropertyModel==undefined){var a=L.getText("table.VIEWSETTINGS_COLUMN_SELECTALL",[s,c]);v["selectAllText"]=a;v["sortDesecending"]=false;v["groupDescending"]=false;this.oViewSettingsPropertyModel=new J(v);}var V=new sap.ui.view("viewSettingsXMLView",{viewName:"sap.ui.mdc.internal.table.viewsettings.ViewSettings",type:"XML",async:true,preprocessors:{xml:{bindingContexts:{propertiesModel:this.oViewSettingsPropertyModel.createBindingContext("/"),dialogProperties:d.createBindingContext("/")},models:{propertiesModel:this.oViewSettingsPropertyModel,dialogProperties:d}}}});V.setModel(this.oViewSettingsPropertyModel);this.oTable.addDependent(V);V.loaded().then(function(){var b=(d.getData().InitialVisiblePanel==="columns")?"viewSettingsXMLView--columns":d.getData().InitialVisiblePanel;var C=V.getController();C.oTableController=this;V.byId("viewSettingsDialog").open(b);}.bind(this));};T.prototype.createAndOpenP13nSettingsDialog=function(p,d){if(this.oP13nSettingsPropertyModel==null&&this.oP13nSettingsPropertyModel==undefined){p["p13nSortItems"]=[];p["p13nGroupItems"]=[];this.oP13nSettingsPropertyModel=new J(p);}var P=new sap.ui.view("p13nSettingsXMLView",{viewName:"sap.ui.mdc.internal.table.p13nsettings.P13nSettings",type:"XML",async:true,preprocessors:{xml:{bindingContexts:{propertiesModel:this.oP13nSettingsPropertyModel.createBindingContext("/"),dialogProperties:d.createBindingContext("/")},models:{propertiesModel:this.oP13nSettingsPropertyModel,dialogProperties:d}}}});P.setModel(this.oP13nSettingsPropertyModel);this.oTable.addDependent(P);P.loaded().then(function(){var c=P.getController();c.oTableController=this;P.byId("p13nDialog").open();}.bind(this));};T.prototype.onStandardActionClick=function(e){var a=e.getSource().getText(),i=this.oInnerTable.getModel().getMetaModel(),E=i.getObject("/"+this.oTable.getEntitySet()+"/"),b=false,t=this.oInnerTable.getColumns(),c=t.length,C=[],s=0,d=[],g=[],f=[],h=this.oTable.getSettingsDialogType();for(var j=0;j<c;j++){var o=t[j];var k=o.getId().split("::");C.push(k[k.length-1]);}for(var p in E){if(typeof(E[p])=="object"&&E[p].$kind&&E[p].$kind==="Property"){var _=i.getObject("/"+this.oTable.getEntitySet()+"/"+p+"@com.sap.vocabularies.Common.v1.Label");s=(C.indexOf(p)>-1)?s+1:s;var I={"name":(_!=null&&_!=undefined)?_:p,"columnKey":p,"selected":false};d.push(JSON.parse(JSON.stringify(I)));g.push(JSON.parse(JSON.stringify(I)));var l=JSON.parse(JSON.stringify(I));l.selected=!!(C.indexOf(p)>-1);f.push(l);}}var P={"sortPanelItems":d,"groupPanelItems":g,"columnPanelItems":f.sort(function(x,y){if(x.selected===y.selected){return 0;}else if(x.selected){return-1;}else{return 1;}})};var D=new J({"InitialVisiblePanel":a,"showSortPanel":!!(b||a==="sort"),"showGroupPanel":!!((b||a==="group")&&(this.oInnerTable.getMetadata().getName()==="sap.m.Table")),"showColumnPanel":!!(b||a==="column")});if(h==="P13nDialog"){this.createAndOpenP13nSettingsDialog(P,D);}else{this.createAndOpenViewSettingsDialog(P,s,f.length,D);}};T.prototype.applyGroupAndSort=function(s){if(s.length>0){var b=this.getListBinding();b.sort(s);}};return T;});