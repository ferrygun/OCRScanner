/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

/* global escape */

/**
 * Initialization Code and shared classes of library sap.ui.vk
 */
sap.ui.define([
	"jquery.sap.global", "./TransformationMatrix", "./DvlException", "./Core"
], function(jQuery, TransformationMatrix, DvlException, Core) {
	"use strict";

	var log = jQuery.sap.log;

	/**
	 * SAPUI5 library with controls for displaying 3D models.
	 *
	 * @namespace
	 * @name sap.ui.vk
	 * @author SAP SE
	 * @version 1.52.8
	 * @public
	 */

	// Delegate further initialization of this library to the Core.
	sap.ui.getCore().initLibrary({
		name: "sap.ui.vk",
		dependencies: [
			"sap.ui.core"
		],
		types: [
			"sap.ui.vk.CameraFOVBindingType",
			"sap.ui.vk.CameraProjectionType",
			"sap.ui.vk.ContentResourceSourceCategory",
			"sap.ui.vk.dvl.GraphicsCoreApi",
			"sap.ui.vk.SelectionMode",
			"sap.ui.vk.TransformationMatrix",
			"sap.ui.vk.VisibilityMode",
			"sap.ui.vk.ZoomTo"
		],
		interfaces: [
			"sap.ui.vk.DecryptionHandler"
		],
		controls: [
			"sap.ui.vk.ContainerBase",
			"sap.ui.vk.ContainerContent",
			"sap.ui.vk.DockContainer",
			"sap.ui.vk.DockManager",
			"sap.ui.vk.DockPane",
			"sap.ui.vk.FlexibleControl",
			"sap.ui.vk.LegendItem",
			"sap.ui.vk.ListPanel",
			"sap.ui.vk.ListPanelStack",
			"sap.ui.vk.MapContainer",
			"sap.ui.vk.NativeViewport",
			"sap.ui.vk.Notifications",
			"sap.ui.vk.Overlay",
			"sap.ui.vk.RedlineDesign",
			"sap.ui.vk.RedlineSurface",
			"sap.ui.vk.SceneTree",
			"sap.ui.vk.StepNavigation",
			"sap.ui.vk.Toolbar",
			"sap.ui.vk.Viewer",
			"sap.ui.vk.Viewport",
			"sap.ui.vk.ViewportBase",
			"sap.ui.vk.dvl.Viewport",
			"sap.ui.vk.threejs.Viewport"
		],
		elements: [
			"sap.ui.vk.ContentConnector",
			"sap.ui.vk.OverlayArea",
			"sap.ui.vk.RedlineElement",
			"sap.ui.vk.RedlineElementEllipse",
			"sap.ui.vk.RedlineElementFreehand",
			"sap.ui.vk.RedlineElementRectangle",
			"sap.ui.vk.ViewStateManager",
			"sap.ui.vk.ViewStateManagerBase",
			"sap.ui.vk.dvl.ViewStateManager",
			"sap.ui.vk.threejs.ViewStateManager"
		],
		noLibraryCSS: false,
		version: "1.52.8"
	});

	// sap.ui.getCore().initLibrary() creates lazy stubs for controls and elements.
	// Create lazy stubs for non-Element-derived classes or extend Element-derived classed with static methods.
	var lazy = function(localClassName, staticMethods) {
		var methods = "new extend getMetadata";
		if (staticMethods) {
			methods += " " + staticMethods;
		}
		sap.ui.lazyRequire("sap.ui.vk." + localClassName, methods);
	};
	lazy("Camera");
	lazy("ContentConnector", "registerSourceType"); // extend the lazy stub with the static method
	lazy("ContentResource");
	lazy("ContentManager");
	lazy("DownloadManager");
	lazy("ImageContentManager");
	lazy("Loco");
	lazy("LayerProxy");
	lazy("NodeHierarchy");
	lazy("NodeProxy");
	lazy("Scene");
	lazy("View");
	lazy("ViewportHandler");
	lazy("dvl.GraphicsCore");
	lazy("dvl.BaseNodeProxy");
	lazy("dvl.ContentManager", "getRuntimeSettings setRuntimeSettings getWebGLContextAttributes setWebGLContextAttributes getDecryptionHandler setDecryptionHandler");
	lazy("dvl.LayerProxy");
	lazy("dvl.NodeHierarchy");
	lazy("dvl.NodeProxy");
	lazy("dvl.Scene");
	lazy("threejs.BaseNodeProxy");
	lazy("threejs.ContentManager", "registerLoader");
	lazy("threejs.LayerProxy");
	lazy("threejs.NodeHierarchy");
	lazy("threejs.NodeProxy");
	lazy("threejs.OrthographicCamera");
	lazy("threejs.PerspectiveCamera");
	lazy("threejs.Scene");

	/**
	 * The types of APIs supported by the {@link sap.ui.vk.dvl.GraphicsCore} class.
	 *
	 * @enum {string}
	 * @readonly
	 * @public
	 * @experimental since version 1.32.0. The enumeration might be deleted in the next version.
	 */
	sap.ui.vk.dvl.GraphicsCoreApi = {
		/**
		 * The legacy DVL API implemented in the com.sap.ve.dvl library (dvl.js).
		 * @public
		 */
		LegacyDvl: "LegacyDvl"
	};

	/**
	 * The categories of content resources.
	 * @enum {string}
	 * @readonly
	 * @public
	 * @experimental Since 1.32.0 This map is experimental and might be modified or removed in future versions.
	 * @deprecated Since version 1.50.0.
	 */
	sap.ui.vk.ContentResourceSourceCategory = {
		/**
		 * The 3D content resource.
		 * @public
		 */
		"3D": "3D",
		/**
		 * The 2D content resource.
		 * @public
		 */
		"2D": "2D"
	};

	/**
	 * Camera projection type.
	 * @enum {string}
	 * @readonly
	 * @public
	 */
	sap.ui.vk.CameraProjectionType = {
		/**
		 * {@link https://en.wikipedia.org/wiki/3D_projection#Perspective_projection Perspective projection}
		 * @public
		 */
		Perspective: "perspective",
		/**
		 * {@link https://en.wikipedia.org/wiki/3D_projection#Orthographic_projection Orthographic projection}
		 * @public
		 */
		Orthographic: "orthographic"
	};

	/**
	 * Camera field of view binding types.
	 * @enum {string}
	 * @readonly
	 * @public
	 */
	sap.ui.vk.CameraFOVBindingType = {
		/**
		 * The field of view is bound to the width or the height of the viewport, whichever is smaller.
		 * @public
		 */
		Minimum: "minimum",
		/**
		 * The field of view is bound to the width or the height of the viewport, whichever is bigger.
		 * @public
		 */
		Maximum: "maximum",
		/**
		 * The field of view is bound to the width of the viewport.
		 * @public
		 */
		Horizontal: "horizontal",
		/**
		 * The field of view is bound to the height of the viewport.
		 * @public
		 */
		Vertical: "vertical"
	};

	/**
	 * Visibility mode for {@link sap.ui.vk.Viewport#getViewInfo sap.ui.vk.Viewport.getViewInfo}.
	 * @enum {string}
	 * @readonly
	 * @public
	 */
	sap.ui.vk.VisibilityMode = {
		/**
		 * The view information contains a full definition of all nodes that are visible or hidden.
		 * @public
		 */
		Complete: "complete",
		/**
		 * The view information contains a list of nodes that have inverted visibility state compared to their original state.
		 * @public
		 */
		Differences: "differences"
	};

	/**
	 * ZoomTo options.
	 * @enum {string}
	 * @readonly
	 * @public
	 */
	sap.ui.vk.ZoomTo = {
		All: "all",
		Visible: "visible",
		Selected: "selected",
		Node: "node",
		NodeSetIsolation: "node_setisolation",
		Restore: "restore",
		RestoreRemoveIsolation: "restore_removeisolation",
		ViewLeft: "view_left",
		ViewRight: "view_right",
		ViewTop: "view_top",
		ViewBottom: "view_bottom",
		ViewBack: "view_back",
		ViewFront: "view_front"
	};

	/**
	 * SelectionMode options.
	 * @enum {string}
	 * @readonly
	 * @public
	 */
	sap.ui.vk.SelectionMode = {
		None: "none",
		Exclusive: "exclusive",
		Sticky: "sticky"
	};

	/**
	 * The map from file extensions to content resource categories.
	 * @readonly
	 * @private
	 * @experimental Since 1.32.0 This map is experimental and might be modified or removed in future versions.
	 * @deprecated Since version 1.50.0.
	 */
	sap.ui.vk.ContentResourceSourceTypeToCategoryMap = {
		"vds": sap.ui.vk.ContentResourceSourceCategory["3D"],
		"vdsl": sap.ui.vk.ContentResourceSourceCategory["3D"],
		"cgm": sap.ui.vk.ContentResourceSourceCategory["3D"],
		"png": sap.ui.vk.ContentResourceSourceCategory["2D"],
		"jpg": sap.ui.vk.ContentResourceSourceCategory["2D"],
		"gif": sap.ui.vk.ContentResourceSourceCategory["2D"],
		"bmp": sap.ui.vk.ContentResourceSourceCategory["2D"],
		"tiff": sap.ui.vk.ContentResourceSourceCategory["2D"],
		"tif": sap.ui.vk.ContentResourceSourceCategory["2D"],
		"svg": sap.ui.vk.ContentResourceSourceCategory["2D"]
	};

	/**
	 * Lookup for toolids (GUID) of sap.ui.vk.tool.Tool implementations that ship as standard in VIT
	 * @readonly
	 * @private
	 * @experimental Since 1.52.0.
	 * @deprecated Since version 1.50.0.
	 */
	sap.ui.vk.Tools = {
		RotateOrbit: "1a1fced1-9b42-d7f3-5fdf-8d338b3591a6",
		RotateTurntable: "f271c082-676c-adc6-167f-0d5ce602aa45",
		HitTest: "63150593-75f6-c330-2a7a-c1f85d36b2b9"
	};

	////////////////////////////////////////////////////////////////////////////
	// BEGIN: Utility methods used internally by the library to handle results from DVL.

	var dvlComponent = "sap.ve.dvl";

	sap.ui.vk.dvl.checkResult = function(result) {
		if (result < 0) {
			var message = sap.ve.dvl.DVLRESULT.getDescription ? sap.ve.dvl.DVLRESULT.getDescription(result) : "";
			log.error(message, JSON.stringify({ errorCode: result }), dvlComponent);
			throw new DvlException(result, message);
		}
		return result;
	};

	sap.ui.vk.dvl.getPointer = function(pointer) {
		if (typeof pointer === "number") {
			var result = pointer;
			var message = sap.ve.dvl.DVLRESULT.getDescription ? sap.ve.dvl.DVLRESULT.getDescription(result) : "";
			log.error(message, JSON.stringify({ errorCode: result }), dvlComponent);
			throw new DvlException(result, message);
		}
		return pointer;
	};

	sap.ui.vk.dvl.getJSONObject = function(object) {
		if (typeof object === "number") {
			var result = object;
			var message = sap.ve.dvl.DVLRESULT.getDescription ? sap.ve.dvl.DVLRESULT.getDescription(result) : "";
			log.error(message, JSON.stringify({ errorCode: result }), dvlComponent);
			throw new DvlException(result, message);
		}
		return object;
	};

	// END: Utility methods used internally by the library to handle results from DVL.
	////////////////////////////////////////////////////////////////////////////

	sap.ui.vk.getResourceBundle = function() {
		var resourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.ui.vk.i18n");
		sap.ui.vk.getResourceBundle = function() {
			return resourceBundle;
		};
		return resourceBundle;
	};

	sap.ui.vk.utf8ArrayBufferToString = function(arrayBuffer) {
		return decodeURIComponent(escape(String.fromCharCode.apply(null, new Uint8Array(arrayBuffer))));
	};

	sap.ui.vk.Redline = {
		ElementType: {
			Rectangle: "rectangle",
			Ellipse: "ellipse",
			Freehand: "freehand"
		},
		svgNamespace: "http://www.w3.org/2000/svg"
	};

	/**
	 * Converts a {@link https://www.w3.org/TR/css3-color/#colorunits CSS Color} string to a JSON structure <code>{ red, green, blue, alpha }</code>.
	 *
	 * @function
	 * @param {string} color A {@link https://www.w3.org/TR/css3-color/#colorunits CSS Color} string.
	 * @returns {object} An object with the following structure:
	 * <pre>
	 * {
	 *   red:   <i>int</i>,
	 *   green: <i>int</i>,
	 *   blue:  <i>int</i>,
	 *   alpha: <i>float</i>
	 * }
	 * </pre>
	 * where <i>red</i>, <i>green</i>, <i>blue</i> are integers in the range of [0, 255], and <i>alpha</i> is float in the range of [0.0, 1.0].
	 * @static
	 * @public
	 */
	sap.ui.vk.cssColorToColor = (function() {
		var initialized = false;
		var div = document.createElement("div");
		div.id = "sap.ui.vk.colorConverter";
		div.style.setProperty("display", "none", "important");
		return function(color) {
			if (!initialized) {
				if (document.body) {
					document.body.appendChild(div);
					initialized = true;
				} else {
					return {
						red:   0,
						green: 0,
						blue:  0,
						alpha: 1
					};
				}
			}
			// In order to get consistent results when the color value is incorrect first reset the color to rgba(0, 0, 0, 0).
			div.style.setProperty("color", "rgba(0, 0, 0, 0)", "important");
			div.style.setProperty("color", color, "important");
			var effectiveColor = window.getComputedStyle(div).color;
			if (effectiveColor === "transparent") {
				// Some browsers (e.g. Firefox) return 'transparent' if alpha component equals 0.
				return {
					red:   0,
					green: 0,
					blue:  0,
					alpha: 0
				};
			} else {
				var components = effectiveColor.split("(")[1].split(")")[0].split(",");
				return {
					red:   parseInt(components[0], 10),
					green: parseInt(components[1], 10),
					blue:  parseInt(components[2], 10),
					alpha: components.length === 4 ? parseFloat(components[3]) : 1
				};
			}
		};
	})();

	/**
	 * Converts a JSON structure <code>{ red, green, blue, alpha }</code> to a {@link https://www.w3.org/TR/css3-color/#colorunits CSS Color} string.
	 *
	 * @function
	 * @param {object} color       A map of parameters. See below.
	 * @param {int}    color.red   The red component of the color in the range [0, 255].
	 * @param {int}    color.green The green component of the color in the rangle [0, 255].
	 * @param {int}    color.blue  The blue component of the color in the range [0, 255].
	 * @param {float}  color.alpha The alpha component of the color in the range [0.0, 1.0];
	 * @returns {string} A {@link https://www.w3.org/TR/css3-color/#colorunits CSS Color} string in the format "rgba(red, green, blue, alpha)".
	 * @static
	 * @public
	 */
	sap.ui.vk.colorToCSSColor = function(color) {
		return "rgba(" + color.red + "," + color.green + "," + color.blue + "," + color.alpha + ")";
	};

	/**
	 * Converts a 32-bit integer in the ABGR notation to a JSON structure <code>{ red, green, blue, alpha }</code>.
	 *
	 * @function
	 * @param {int} abgr A 32-bit integer in the ABGR notation.
	 * @returns {object} An object with the following structure:
	 * <pre>
	 * {
	 *   red:   <i>int</i>,
	 *   green: <i>int</i>,
	 *   blue:  <i>int</i>,
	 *   alpha: <i>float</i>
	 * }
	 * </pre>
	 * where <i>red</i>, <i>green</i>, <i>blue</i> are integer in the range [0, 255], and <i>alpha</i> is float in the range from [0.0, 1.0].
	 * @static
	 * @public
	 */
	sap.ui.vk.abgrToColor = function(abgr) {
		return {
			red:    abgr        & 0xff,
			green:  abgr >>> 8  & 0xff,
			blue:   abgr >>> 16 & 0xff,
			alpha: (abgr >>> 24 & 0xff) / 255
		};
	};

	/**
	 * Converts a structure <code>{ red, green, blue, alpha }</code> to a 32-bit integer in the ABGR notation.
	 * @function
	 * @param {object} color       A map of parameters. See below.
	 * @param {int}    color.red   The red component of the color in the range [0, 255].
	 * @param {int}    color.green The green component of the color in the range [0, 255].
	 * @param {int}    color.blue  The blue component of the color in the range [0, 255].
	 * @param {float}  color.alpha The alpha component of the color in the range [0.0, 1.0];
	 * @returns {int} A 32-bit integer in the ABGR notation.
	 * @static
	 * @public
	 */
	sap.ui.vk.colorToABGR = function(color) {
		// NB: use >>> to convert to 32 bit unsigned.
		return (color.alpha * 255 << 24 | color.blue << 16 | color.green << 8 | color.red) >>> 0;
	};

	return sap.ui.vk;
});
