/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */
sap.ui.define([],
  function(){
    /**
     * Contructor for ResponsiveLegend - must not be used: To get a ResponsiveLegend instance, please use VizFrame.getResponsiveLegend.
     * 
     * @deprecated Since 1.27.
     * @name sap.viz.ui5.controls.ResponsiveLegend
     */
    var ResponsiveLegend = function(){
      //Do not use the constructor
      throw new Error();
    };
    
    ResponsiveLegend.createInstance = function(oControl){
        var oResponsiveLegendControl = jQuery.sap.newObject(this.prototype);
        oResponsiveLegendControl._oLegendControl = oControl;
        return oResponsiveLegendControl;
    };
    
    ResponsiveLegend.prototype._oLegendControl = undefined;
    
    ResponsiveLegend.prototype.show = function(){    
    };
    
    ResponsiveLegend.prototype.hide = function(){
    };
    
    ResponsiveLegend.prototype.setOpenBy = function(openBy){
    };
    
    return ResponsiveLegend;
}, true);
