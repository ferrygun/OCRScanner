jQuery.sap.declare("sap.zen.crosstab.IHeaderCell");

// Header Cell interface for callback
sap.zen.crosstab.IHeaderCell = function(oHeaderCell) {
	"use strict";
	this.getText = function() {
		return oHeaderCell.getText();
	};

	this.getId = function() {
		return oHeaderCell.getId();
	};

	this.getRow = function() {
		return oHeaderCell.getRow();
	};

	this.getCol = function() {
		return oHeaderCell.getCol();
	};
};