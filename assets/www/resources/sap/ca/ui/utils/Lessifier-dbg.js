/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
/*global less */
jQuery.sap.declare("sap.ca.ui.utils.Lessifier");
jQuery.sap.require("sap.ui.core.theming.Parameters");

sap.ca.ui.utils.Lessifier = {};

/**
 * The default color to use when a parameter cannot be resolved.
 */
sap.ca.ui.utils.Lessifier.DEFAULT_COLOR = "#fff";

/**
 * Load a CSS File containing colors that have been coded with less variable and replace them dynamically
 * This is an experimental solution; a hack if you will that will be replaced by something much nicer in wave 3++.
 *
 * @experimental Keep in mind that less shouldn't be used in production, as per a UI5 recommendation.
 * @param {string} sModuleName the module in which to load this file
 * @param {string} sCssPath the path to the CSS file
 * @param {boolean} bTrueLess If true, the third party less library will be used.
 */
sap.ca.ui.utils.Lessifier.lessifyCSS = function(sModuleName, sCssPath, bTrueLess) {
	if (bTrueLess) {
		jQuery.sap.require("sap.ui.thirdparty.less");
	}
	// Incorrect number of parameters...
	if (sModuleName == null || sModuleName.length == 0 || sCssPath == null || sCssPath.length == 0) {
		jQuery.sap.log.error("When trying to lessify a css make sure both the module name and the css file path are specified.");
		return;
	}
	// Unknown module, which means something is wrong
	var sModulePath = jQuery.sap.getModulePath(sModuleName);
	if (sModulePath == null) {
		jQuery.sap.log.error("The module " + sModuleName + " has never been registered for a specific path.");
		return;
	}
	// CSS already in DOM no need for duplicate effort
	if (jQuery("#" + sModuleName + "-less-css").length != 0) {
		jQuery.sap.log.warning("The css for module " + sModuleName + " has already been processed.");
		return;
	}
	var sCssUrl = sModulePath + sCssPath;
	if (!jQuery.sap.startsWith(sCssPath, "/") && !jQuery.sap.endsWith(sModulePath, "/")) {
		sCssUrl = sModulePath + "/" + sCssPath;
	}
	var request = jQuery.ajax({ url:  sCssUrl, async: false });
	var stylesheetText = (request.status < 400) ? request.responseText : "";

	if (stylesheetText != null && stylesheetText.length != 0) {
		
		// All the following CSS at-rules must not be mistaken as parameters and shall not be replaced.
		var params = ["media", "font-face", "-webkit-keyframes", "see", "keyframes", "import", "charset", "document", "page", "supports"];
		var sLessStylesheet;

		// if less is needed:
		// find variables that are declared in this file and do nothing
		// but store a stripped version for later matching
		if (bTrueLess){
			// parameters might include - , _ , numbers , chars
			sLessStylesheet = stylesheetText.replace(/@([a-zA-Z0-9\-_]*):/g, function (match, compare) {
				// only add it if it is not in there already
				if (params.indexOf(compare) < 0){
					params.push(compare);
				}
				return match;
			});
		}

		// now to the simple replacement processing
		// but take care of declared variables
		// IMPROVE: Invalid less is not yet detected and might still lead to app crashes.
		sLessStylesheet = stylesheetText.replace(/@([a-zA-Z0-9\-_]*)/g, function (match, compare) {
			var parameterValue;
			// check if this is a declared one and simply return it
			if (params.indexOf(compare) != -1){
				return match;
			}
			// if this is a parameter that has not been declared lets get it from the API
			parameterValue = sap.ui.core.theming.Parameters.get(compare);
			if (parameterValue == null) {
				// if less processing is enabled a real color dummy string needs to be written back
				if (bTrueLess){
					jQuery.sap.log.error("The parameter @" + compare + " was replaced by a dummy value due to missing reference!");
					return sap.ca.ui.utils.Lessifier.DEFAULT_COLOR;
				// otherwise we can safely return the parameter.
				} else {
					jQuery.sap.log.warning("The parameter @" + compare + " was not found via API call!");
					return "@" + compare;
				}
			}
			return parameterValue;
		});
		if (bTrueLess) {
			new (less.Parser)().parse(sLessStylesheet, function (e, tree) {
				if (e != null) {
					jQuery.sap.log.error("The css for module " + sModuleName + " cannot be parsed by less.js : " + e.message);
				} else {
					sLessStylesheet = tree.toCSS({});
				}
			});
		}
		jQuery("head").append("<style id='" + sModuleName + "-less-css'>" + sLessStylesheet + "</style>");
		jQuery.sap.log.info("The css for module " + sModuleName + " has been processed correctly.");
	}
};
