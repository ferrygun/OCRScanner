sap.ui.define(function() {
	"use strict";

    var indicatorTileHelper = function(tile) {
        this.tile = tile;
    };
    indicatorTileHelper.prototype.setErrorState = function() {
        this.getTile().setState(sap.suite.ui.commons.LoadState.Failed);
    };
    indicatorTileHelper.prototype.setLoadingState = function() {
        this.getTile().setState(sap.suite.ui.commons.LoadState.Loading);
    };
    indicatorTileHelper.prototype.setLoadedState = function() {
        this.getTile().setState(sap.suite.ui.commons.LoadState.Loaded);
    };
    indicatorTileHelper.prototype.setTrendDown = function() {
        this.getTile().setIndicator(sap.suite.ui.commons.DeviationIndicator.Down);
    };
    indicatorTileHelper.prototype.setTrendUp = function() {
        this.getTile().setIndicator(sap.suite.ui.commons.DeviationIndicator.Up);
    };
    indicatorTileHelper.prototype.setTrendNeutral = function() {
        this.getTile().setIndicator(sap.suite.ui.commons.DeviationIndicator.None);
    };
    indicatorTileHelper.prototype.setThresholdGood = function(){};
    indicatorTileHelper.prototype.setThresholdBad = function(){};
    indicatorTileHelper.prototype.setThresholdCritical = function(){};
    indicatorTileHelper.prototype.setThresholdNeutral = function(){};


    indicatorTileHelper.prototype.calculateThreshold = function(actualValue, variantValue, improvementDirection) {

    };

    indicatorTileHelper.prototype.setTile = function(tile) {
        this.tile = tile;
    };
    indicatorTileHelper.prototype.getTile = function() {
        return this.tile;
    };


	return indicatorTileHelper;

}, /* bExport= */ true);
