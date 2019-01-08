/*!
 * SAP UI development toolkit for HTML5 (SAPUI5) (c) Copyright 2009-2012 SAP AG. All rights reserved
 */

// Provides the base visual object.
sap.ui.define([
	"jquery.sap.global", "sap/ui/base/Object"
], function(jQuery, BaseObject) {
	"use strict";

	////////////////////////////////////////////////////////////////////////////
	// BEGIN: Visual Objects

	/**
	 * Types of visual object's properties.
	 *
	 * All values are represented as strings. This is due to automatic translation of XML to JSON and lack of XML Schema for VBI XML.
	 *
	 * <caption>color</caption>
	 * A string in one of the following formats (delimiters can be either , (comma) or ; (semicolon)),
	 * The components are integers, decimal or hexadecimal starting with 0x or 0X:
	 *   RGB(r,g,b)
	 *   RGB(r;g;b)
	 *   RGBA(r,g,b,a)
	 *   RGBA(r;g;b;a)
	 *   ARGB(a,r,g,b)
	 *   ARGB(a;r;g;b)
	 *   HLS(h,l,s)
	 *   HLS(h;l;s)
	 *   HLSA(h,l,s,a)
	 *   HLSA(h;l;s;a)
	 * A hexadecimal representation of an integer number, a string starting with 0x or 0X:
	 *   0xaabbggrr
	 *   0Xaabbggrr
	 * A decimal representation of an integer number:
	 *   d+
	 * Everything else results in the black color with alpha 0.
	 *
	 * <caption>colorDelta</code>
	 * A string in one of the following formats (delimiter is only ; (semicolon), this is different from type 'color'),
	 * the components are float numbers:
	 *   RHLS(h;l;s)
	 *   RHLSA(h;l;s;a)
	 *
	 * <caption>boolean</caption>
	 * The <code>true</code> value is:
	 *   any string starting with characters:
	 *     't'
	 * The <code>false</code> value is:
	 *   an empty string '',
	 *   a string starting with characters:
	 *     'f'
	 *     ' '
	 *     '0'
	 * Any other string represents value <code>true</code>.
	 *
	 * <caption>vector3</caption>
	 * A string representation of three float numbers delimited with ; (semicolon).
	 */

	/**
	 * All visual objects have the following properties.
	 * The values of properties are string representations of types defined in the comments.
	 * NB: the properties with the 'undefined' value are declared to be enumerable in for...in loops.
	 */
	var visualObjectPrototype = {
		// These properties are logically read-only.
		id:            undefined,            // type: string
		voGroup:       undefined,            // type: object
		object3D:      undefined,            // type: THREE.Object3D, this property can change if changes in other properties
		                                     // result in re-creation of 3D object, e.g. when texture6 property changes a new Box geometry
		                                     // is created because a different set of UV coordinates is used.

		// Changes to these properties result in the ElementChanged event.
		"VB:c":        "false",              // type: boolean, full name: changeable
		"VB:s":        "false",              // type: boolean, full name: selected

		// Chnages to theses properties result in the AttributeChanged event.
		color:         "RGB(128,128,128)",   // type: color
		fxdir:         "false",              // type: boolean
		fxsize:        "false",              // type: boolean
		hotDeltaColor: "RHLSA(0;1.1;1;1)",   // type: color or colorDelta
		hotScale:      "1.2;1.2;1.2",        // type: vector3
		normalize:     "false",              // type: boolean
		opacity:       "1",                  // type: float
		pos:           "0;0;0",              // type: vector3
		rot:           "0;0;0",              // type: vector3
		scale:         "1;1;1",              // type: vector3
		selectColor:   "RHLSA(0.7;0.5;0;1)", // type: color or colorDelta
		texture6:      "false",              // type: boolean
		zsort:         "false"               // type: boolean

		/* Properties whose meaning is unknown in 3D.
		icon:          undefined,            // type: string - usage is unclear
		image:         undefined,            // type: string - usage is unclear
		vmax:          undefined,            // type: vector3 - could not find usage in VB ActiveX
		vmin:          undefined,            // type: vector3 - could not find usage in VB ActiveX
		dragSource:    undefined,
		dropTarget:    undefined
		*/
	};

	/**
	 * A prototype for Box visual objects.
	 * NB: the properties with the 'undefined' value are declared to be enumerable in for...in loops.
	 */
	var boxPrototype = Object.create(visualObjectPrototype);
	boxPrototype.isBox = true;
	boxPrototype.type = "{00100000-2012-0004-B001-BFED458C3076}";
	boxPrototype.colorBorder = undefined; // type: color, if missing then no border is rendered.
	boxPrototype.texture     = undefined; // type: string, a name of a resource which is a base64 encoded image.
	boxPrototype.tooltip     = undefined; // type: string

	/**
	 * A prototype for Collada Model visual objects.
	 * NB: the properties with the 'undefined' value are declared to be enumerable in for...in loops.
	 */
	var colladaModelPrototype = Object.create(visualObjectPrototype);
	colladaModelPrototype.isColladaModel = true;
	colladaModelPrototype.type = "{00100000-2012-0070-1000-35762CF28B6B}";
	colladaModelPrototype.model   = undefined; // type: string, a name of a resource which is an XML.
	colladaModelPrototype.text    = undefined; // type: string, used as tooltip when there is no tooltip property.
	colladaModelPrototype.texture = undefined; // type: string, a name of a resource which is a base64 encoded image.
	colladaModelPrototype.tooltip = undefined; // type: string

	/**
	 * A map from type ID to visual object prototype.
	 */
	var visualObjectPrototypes = new Map();
	visualObjectPrototypes.set(boxPrototype.type, boxPrototype);
	visualObjectPrototypes.set(colladaModelPrototype.type, colladaModelPrototype);

	// END: Visual Objects
	////////////////////////////////////////////////////////////////////////////

	////////////////////////////////////////////////////////////////////////////
	// BEGIN: Visual Object Group

	var visualObjectGroupPrototype = {
		id:          undefined, // type: string
		type:        undefined, // type: string (GUID)
		voInstances: undefined, // type: array
		datasource:  undefined, // type: string
		maxSel:      "-1",      // type: integer
		minSel:      "0"        // type: integer
	};

	// END: Visual Object Group
	////////////////////////////////////////////////////////////////////////////

	/**
	 * Constructor for a new visual object factory.
	 *
	 * @class
	 * Provides a base class for visual object factory.
	 *
	 * @private
	 * @author SAP SE
	 * @version 1.52.4
	 * @alias sap.ui.vbm.adapter3d.VisualObjectFactory
	 * @experimental Since 1.52.0 This class is experimental and might be modified or removed in future versions.
	 */
	var VisualObjectFactory = BaseObject.extend("sap.ui.vbm.adapter3d.VisualObjectFactory", /** @lends sap.ui.vbm.adapter3d.VisualObjectFactory.prototype */ {
		metadata: {
			publicMethods: [
				"createVisualObject",
				"createVisualObjectGroup"
			]
		}
	});

	/**
	 * Creates a visual object by its type (GUID).
	 *
	 * @example <caption>Create a box with default properties.</caption>
	 * <pre>
	 * var box = factory.createVisualObject(voGroup);
	 * box.id = "MY_UNIQUE_ID";
	 * box.color = "RGB(255, 0, 0)";
	 * </pre>
	 *
	 * @example <caption>Create a box passing parameters.</caption>
	 * <pre>
	 * var box = factory.createVisualObject(voGroup, {
	 *     id: "MY_UNIQUE_ID",
	 *     color: "RGB(255, 0, 0)"
	 * });
	 * </pre>
	 *
	 * @param {object} voGroup      A VO group for which a VO instance is to be created.
	 * @param {object} [properties] Optional instance properties. These properies can be passed to initialise the instance.
	 * @returns {object|undefined} An instance of the visual object or <code>undefined</code>.
	 * @public
	 */
	VisualObjectFactory.prototype.createVisualObject = function(voGroup, properties) {
		var prototype = visualObjectPrototypes.get(voGroup.type);
		var instance = prototype && jQuery.extend(true, Object.create(prototype), properties);
		if (instance) {
			instance.voGroup = voGroup;
			voGroup.voInstances.push(instance);
		}
		return instance;
	};

	/**
	 * Creates a visual object group.
	 *
	 * @example <caption>Create a group with default properties.</caption>
	 * <pre>
	 * var boxes = factory.createVisualObjectGroup();
	 * boxes.id = "Boxes";,
	 * boxes.type = "{00100000-2012-0004-B001-BFED458C3076}";
	 * </pre>
	 *
	 * @example <caption>Create a group passing properties.</caption>
	 * <pre>
	 * var boxes = factory.createVisualObjectGroup({
	 *     id: "Boxes",
	 *     type: "{00100000-2012-0004-B001-BFED458C3076}",
	 *     maxSel: "1"
	 * });
	 * </pre>
	 *
	 * @param {object} [properties] Optional group properties. These properies can be passed to initialise the group.
	 * @returns {object} A new visual object group.
	 * @public
	 */
	VisualObjectFactory.prototype.createVisualObjectGroup = function(properties) {
		var group = jQuery.extend(true, Object.create(visualObjectGroupPrototype), properties);
		group.voInstances = [];
		group.selected = [];
		return group;
	};

	return VisualObjectFactory;
});
