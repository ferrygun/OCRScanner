(function(jQuery){

	var MESSAGE = "The file datajs.js has been moved from sap.ui.model.odata to sap.ui.thirdparty! Please update the dependencies accordingly.";

	if (jQuery && jQuery.sap && jQuery.sap.require){
		jQuery.sap.require("sap.ui.thirdparty.datajs");
		jQuery.sap.log.warning(MESSAGE);
	} else {
		throw new Error(MESSAGE);
	}

})(window.jQuery);