jQuery.sap.declare("sap.zen.crosstab.IDataCell");

// Data Cell interface for callback
sap.zen.crosstab.IDataCell = function(oDataCell) {
	"use strict";
	this.getText = function() {
		return oDataCell.getText();
	};

	this.getId = function() {
		return oDataCell.getId();
	};

	this.getRow = function() {
		return oDataCell.getRow();
	};

	this.getCol = function() {
		return oDataCell.getCol();
	};
};