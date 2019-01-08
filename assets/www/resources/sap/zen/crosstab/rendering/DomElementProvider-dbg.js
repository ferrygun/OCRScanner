jQuery.sap.declare("sap.zen.crosstab.rendering.DomElementProvider");

sap.zen.crosstab.rendering.DomElementProvider = function () {
	var oDomElements = {};

	this.addElement = function (sId, oDomElement) {
		oDomElements[sId] = oDomElement;
	};

	this.getElement = function (sId) {
		return oDomElements[sId];
	};
};