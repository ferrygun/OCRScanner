/*!
 * SAP UI development toolkit for HTML5 (SAPUI5) (c) Copyright 2009-2012 SAP AG. All rights reserved
 */

/* global THREE */

// Provides the base visual object.
sap.ui.define([
	"jquery.sap.global", "sap/ui/base/Object"
], function(jQuery, BaseObject) {
	"use strict";

	var thisModule = "sap.ui.vbm.adapter3d.Utilities";
	var log = jQuery.sap.log;

	var Utilities = BaseObject.extend("sap.ui.vbm.adapter3d.Utilities", /** @lends sap.ui.vbm.adapter3d.Utilities.prototype */ {
	});

	Utilities.toBoolean = function(value) {
		var firstChar = value.charAt(0);
		return firstChar === "t" || firstChar !== "" && firstChar !== "f" && firstChar !== " " && firstChar !== "0";
	};

	Utilities.toFloat = function(value) {
		return parseFloat(value);
	};

	Utilities.toVector3 = function(value) {
		var a = value.split(";");
		if (a.length !== 3) {
			return [ 0, 0, 0 ];
		}
		return a.map(parseFloat);
	};

	Utilities.toColor = (function() {
		var dec = "\\s*(\\d+)\\s*";
		var hex = "\\s*(?:0[xX])([\\da-fA-F]+)\\s*";

		// NB: we use back reference \2 to reference to , (comma) or ; (semicolon) to prevent their mixes.
		// Color components will be in 1, 3, 4, 5 capturing groups.
		var threeDec = dec + "(,|;)" + dec + "\\2" + dec;
		var fourDec  = dec + "(,|;)" + dec + "\\2" + dec + "\\2" + dec;
		var threeHex = hex + "(,|;)" + hex + "\\2" + hex;
		var fourHex  = hex + "(,|;)" + hex + "\\2" + hex + "\\2" + hex;

		var reRGB   = new RegExp("^\\s*RGB\\("  + threeDec + "\\)\\s*$");
		var reRGBx  = new RegExp("^\\s*RGB\\("  + threeHex + "\\)\\s*$");
		var reRGBA  = new RegExp("^\\s*RGBA\\(" + fourDec  + "\\)\\s*$");
		var reRGBAx = new RegExp("^\\s*RGBA\\(" + fourHex  + "\\)\\s*$");
		var reARGB  = new RegExp("^\\s*ARGB\\(" + fourDec  + "\\)\\s*$");
		var reARGBx = new RegExp("^\\s*ARGB\\(" + fourHex  + "\\)\\s*$");
		var reHLS   = new RegExp("^\\s*HLS\\("  + threeDec + "\\)\\s*$"); // eslint-disable-line no-unused-vars
		var reHLSx  = new RegExp("^\\s*HLS\\("  + threeHex + "\\)\\s*$"); // eslint-disable-line no-unused-vars
		var reHLSA  = new RegExp("^\\s*HLSA\\(" + fourDec  + "\\)\\s*$"); // eslint-disable-line no-unused-vars
		var reHLSAx = new RegExp("^\\s*HLSA\\(" + fourHex  + "\\)\\s*$"); // eslint-disable-line no-unused-vars
		var reDec   = new RegExp("^" + dec + "$");                        // eslint-disable-line no-unused-vars
		var reHex   = new RegExp("^" + hex + "$");                        // eslint-disable-line no-unused-vars

		return function(value, throwOnError) {
			var m;
			var rgb;
			var opacity = 1;

			if ((m = value.match(reRGB))) {
				rgb = new THREE.Color(parseInt(m[1], 10) / 255, parseInt(m[3], 10) / 255, parseInt(m[4], 10) / 255);
			} else if ((m = value.match(reRGBx))) {
				rgb = new THREE.Color(parseInt(m[1], 16) / 255, parseInt(m[3], 16) / 255, parseInt(m[4], 16) / 255);
			} else if ((m = value.match(reRGBA))) {
				rgb = new THREE.Color(parseInt(m[1], 10) / 255, parseInt(m[3], 10) / 255, parseInt(m[4], 10) / 255);
				opacity = m[5] / 255;
			} else if ((m = value.match(reRGBAx))) {
				rgb = new THREE.Color(parseInt(m[1], 16) / 255, parseInt(m[3], 16) / 255, parseInt(m[4], 16) / 255);
				opacity = m[5] / 255;
			} else if ((m = value.match(reARGB))) {
				rgb = new THREE.Color(parseInt(m[3], 10) / 255, parseInt(m[4], 10) / 255, parseInt(m[5], 10) / 255);
				opacity = m[1] / 255;
			} else if ((m = value.match(reARGBx))) {
				rgb = new THREE.Color(parseInt(m[3], 16) / 255, parseInt(m[4], 16) / 255, parseInt(m[5], 16) / 255);
				opacity = m[1] / 255;
			} else {
				// TODO: HLS, HLSA, decimal and hexadecimal representations are not handled yet.
				if (throwOnError) {
					throw new Error("Cannot convert color.");
				}
				rgb = new THREE.Color(0.5, 0.5, 0.5);
			}

			return {
				rgb: rgb,
				opacity: opacity
			}
		};
	})();

	Utilities.toDeltaColor = (function() {
		var floatingPoint = "\\s*([-+]?\\d*\\.?\\d+(?:[eE][-+]?\\d+)?)\\s*";
		var reDeltaHLS  = new RegExp("^\\s*RHLS\\("  + floatingPoint + ";" + floatingPoint + ";" + floatingPoint + "\\)\\s*$");
		var reDeltaHLSA = new RegExp("^\\s*RHLSA\\(" + floatingPoint + ";" + floatingPoint + ";" + floatingPoint + ";" + floatingPoint + "\\)\\s*$");

		var defaultRGB = new THREE.Color(0.5, 0.5, 0.5);
		var defaultOpacity = 1;

		var warningWritten = false;
		var warningMessage = "RHLS and RHLSA are not supported yet.";

		return function(value) {
			var m; // eslint-disable-line no-unused-vars
			if ((m = value.match(reDeltaHLS))) {
				// TODO: delta HLS and HLSA are not handled yet.
				if (!warningWritten) {
					log.warning(warningMessage, value, thisModule);
					warningWritten = true;
				}
			} else if ((m = value.match(reDeltaHLSA))) {
				// TODO: delta HLS and HLSA are not handled yet.
				if (!warningWritten) {
					log.warning(warningMessage, value, thisModule);
					warningWritten = true;
				}
			} else {
				try {
					return {
						color: Utilities.toColor(value, true)
					};
				} catch (e) {
					log.warning(e.message, value, thisModule);
					return {
						color: {
							rgb: defaultRGB.clone(),
							opacity: defaultOpacity
						}
					};
				}
			}
			return {
				color: {
					rgb: defaultRGB.clone(),
					opacity: defaultOpacity
				}
			};
		};
	})();

	Utilities.applyColor = function(instance, value) {
		var color = Utilities.toColor(value);
		instance.object3D.traverse(function(node) {
			if (node.isMesh && node.material) {
				node.material.color = color.rgb;
				node.material.opacity = color.opacity;
				node.material.transparent = color.opacity < 1;
			}
		});
		return this;
	};

	return Utilities;
});
