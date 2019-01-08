/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

// Provides control sap.viz.ui5.controls.VizSlider.
sap.ui.define(['sap/ui/core/Control',
               './VizFrame', 
               './VizRangeSlider',
               './common/utils/Constants',
               'sap/ui/Device'
    ], function(
            BaseControl,
            VizFrame,
            VizRangeSlider,
            Constants,
            Device) {
    "use strict";

    var DEFAULTPROPERTY =  {
            plotArea:{
                dataLabel:{visible:false}
            },
            legend:{visible:false},
            categoryAxis:{visible:false},
            valueAxis:{title:{visible:false}},
            title:{visible:false},
            interaction:{noninteractiveMode:true},
            timeAxis:{visible:false}
        };
    /**
     * Constructor for a new ui5/controls/VizSider.
     *
     * @param {string} [sId] id for the new control, generated automatically if no id is given
     * @param {object} [mSettings] initial settings for the new control
     *
     * @class
     * VizSlider is a viz control with range slider that provide data range selection.
     * @extends sap.viz.core.Control
     *
     * @constructor
     * @public
     * @since 1.51.0
     * @alias sap.viz.ui5.controls.VizSlider
     */
    var VizSlider = BaseControl.extend("sap.viz.ui5.controls.VizSlider", { metadata : {

        library : "sap.viz",
        properties : {

            /**
             * Type of chart. User can pass 'chartType' or 'info/chartType'. For example both 'bar' and 'info/bar' will create a info bar chart.
             * Supported chart type: column, line, timeseries_column, timeseries_line
             */
            vizType : {type : "string", group : "Misc", defaultValue : "column"},
            /**
             * Configuration for initialization to VizControl. This property could only set via settings parameter in Constructor.
             */
            uiConfig : {type : "object", group : "Misc", defaultValue : null},

            /**
             * Width of the VizControl as a CSS size.
             */
            width : {type : "sap.ui.core.CSSSize", group : "Misc", defaultValue : '800px'},

            /**
             * Height of the VizControl as a CSS size.
             */
            height : {type : "sap.ui.core.CSSSize", group : "Misc", defaultValue : '200px'},

            /**
             * Set valueAxis visible or not
             */
            valueAxisVisible:{type : "boolean", group : "Misc", defaultValue: true},
                        /**
             * Set percentage label of range slider visible or not
             */
            showPercentageLabel : {type : "boolean", group : "Appearance", defaultValue: true},
            /**
             * Set start end label of range slider visible or not
             */
            showStartEndLabel : {type: "boolean", group : "Appearance", defaultValue : true}
        },
        aggregations: {
            /** Internal VizFrame instance which does the actual rendering work. */
            _vizFrame  : {type: "sap.viz.ui5.controls.VizFrame", multiple: false, visibility: "hidden"},
            _rangeSlider: {type: "sap.viz.ui5.controls.VizRangeSlider", multiple: false, visibility: "hidden"},
            /**
             * Dataset for VizSlider.
             */
            dataset : {type : "sap.viz.ui5.data.Dataset", multiple : false},
       
            /**
             * All feeds for VizSlider.
             */
            feeds : {type : "sap.viz.ui5.controls.common.feeds.FeedItem", multiple : true, singularName : "feed"}
        },
       
        events:{
            /**
             * Event fires when selected range changes.
             * Data structure For Time chart: 
             * {
             *  start: {Date: 1422181498387},
             *  end: {Date: 1422049107429}
             * }.
             * For column and line Chart:
             * {
             *   "data":[{"Country":"Canada"}, {"Country":"China"},{"Country":"France"},
             *           {"Country":"Germany"},{"Country":"India"}]
             * }.
             */
            rangeChanged:{}
        }
    }});
    

    
    VizSlider.prototype.applySettings = function() {
        BaseControl.prototype.applySettings.apply(this, arguments);
        var oVizFrame = new VizFrame({
            width: this.getWidth(),
            height: this.getHeight(),
            vizType: this.getVizType(),
            uiConfig: this.getUiConfig(),
            
        });
        
        oVizFrame.attachRenderComplete( updateRangeSlider.bind(this));

        var  oRangeSlider = new VizRangeSlider({
            visible:false,
            showAdvancedTooltip:false
        });   
        oRangeSlider.setParentFrame(oVizFrame);

        this.setAggregation("_vizFrame", oVizFrame);
        this.setAggregation("_rangeSlider", oRangeSlider);
        oRangeSlider.attachChange(processRangeData.bind(this));
       
    };
    var SUPPORTTYPES=[ 
                      "info/column",
                      "info/line",
                      "info/timeseries_line",
                      "info/timeseries_column"
                      ];

    VizSlider.prototype.setVizType = function(sVizType) {
        if(sVizType.indexOf("info/") !== 0){
            sVizType = "info/" + sVizType;
        }
        if(SUPPORTTYPES.indexOf(sVizType) === -1){
            sVizType = "info/null";
        }
        this.setProperty('vizType', sVizType);
    };
    
    VizSlider.prototype.getDataset = function(dataset){
       var vizFrame = this._getVizFrame();
       return (vizFrame && vizFrame.getDataset()) || this.getAggregation("dataset");
       
    };
    
    VizSlider.prototype.addFeed = function(feed){
        var vizFrame = this._getVizFrame();
        if(vizFrame){
            vizFrame.addFeed(feed);
        }else{
            this.addAggregation("feeds", feed);
        }
        return this;
    };
    
    VizSlider.prototype.removeFeed = function(feed){
        var vizFrame = this._getVizFrame();
        if(vizFrame){
            vizFrame.removeFeed(feed);
        }else{
            this.removeAggregation("feeds", feed);
        }
        return this;
    };
    
    VizSlider.prototype.removeAllFeeds = function(){
        var vizFrame = this._getVizFrame();
        if(vizFrame){
            vizFrame.removeAllFeeds();
        }else{
            this.removeAllAggregation("feeds");
        }
        return this;
    };
    
    VizSlider.prototype.getFeeds = function(){
        var vizFrame = this._getVizFrame();
        return (vizFrame && vizFrame.getFeeds()) || this.getAggregation("feeds");
    }
    
   
    VizSlider.prototype.exit = function() {

        var oVizFrame = this._getVizFrame();
        oVizFrame && oVizFrame.detachRenderComplete(updateRangeSlider.bind(this), this);
        var rangeSlider = this.getAggregation("_rangeSlider");
        rangeSlider && rangeSlider.detachChange(processRangeData.bind(this));

    };
    

    VizSlider.prototype._getVizFrame = function() {
        return this.getAggregation("_vizFrame");
    };


    VizSlider.prototype._getRangeSlider = function() {
        return this.getAggregation("_rangeSlider");
    };
    
    VizSlider.prototype.onAfterRendering = function(){
        var oVizFrame = this._getVizFrame();
        var property = {valueAxis:{visible:  this.getProperty("valueAxisVisible")}};
        property = jQuery.extend(true, {}, property, DEFAULTPROPERTY);
        oVizFrame.setVizProperties(property);
        oVizFrame.setUiConfig(this.getProperty("uiConfig"));
        oVizFrame.setVizType(this.getProperty("vizType"));  
        oVizFrame.setHeight(this.getProperty("height"));
        oVizFrame.setWidth(this.getProperty("width"));

        var dataset = this.getAggregation("dataset");
        if(dataset){
            this.removeAggregation("dataset")
            oVizFrame.setDataset(dataset);
        }

        var feeds = this.getAggregation("feeds");
        if(feeds){
            this.removeAllAggregation("feeds");
            oVizFrame.removeAllFeeds();
            for(var i = 0; i < feeds.length; ++i){
                oVizFrame.addFeed(feeds[i]);
            }
        }

        
        var rangeSlider = this._getRangeSlider();
        rangeSlider.setShowStartEndLabel(this.getProperty("showStartEndLabel"));
        rangeSlider.setShowPercentageLabel(this.getProperty("showPercentageLabel"));
        
    };
    
    function updateRangeSlider(){
        var sizeInfo = this._getVizFrame()._states().plot.sizeInfo;
        this._curRange = [];

        var rangeSlider = this._getRangeSlider();
        if(sizeInfo){
            rangeSlider.setWidth(sizeInfo.width + "px");
            rangeSlider.setHeight( sizeInfo.height + "px");
            rangeSlider.setLeft(sizeInfo.x + "px");
            rangeSlider.setTop(sizeInfo.y + "px");
            rangeSlider.setVisible(true);
            rangeSlider.invalidate();
        } else {
            rangeSlider.setVisible(false);
        }

    }
    
    function processRangeData(e, data){

        var range = e.getParameters().range;
        if(this._curRange[0] === range[0] && this._curRange[1] === range[1]){
            return;
        }else{
            var vizFrame = this._getVizFrame();
            var dataRange = vizFrame._getDataRange(range[0], range[1]);  
            this._curRange[0] = range[0];
            this._curRange[1] = range[1];
            delete(dataRange.displayValues);
            this.fireEvent("rangeChanged",  {data:dataRange});
        }

    }


    return VizSlider;
});
