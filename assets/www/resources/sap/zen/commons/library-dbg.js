/*!
 * (c) Copyright 2010-2018 SAP SE or an SAP affiliate company.
 */

/**
 * Initialization Code and shared classes of library sap.zen.commons.
 */
sap.ui.define(['jquery.sap.global', 'sap/ui/base/DataType', 
	'sap/ui/core/library', // library dependency
	'sap/ui/layout/library'], // library dependency
	function(jQuery, DataType) {

	"use strict";

	/**
	 * Common basic controls, mainly intended for desktop scenarios
	 *
	 * @namespace
	 * @name sap.zen.commons
	 * @author SAP SE
	 * @version 1.52.4
	 * @public
	 */
	
	// delegate further initialization of this library to the Core
	sap.ui.getCore().initLibrary({
		name : "sap.zen.commons",
		version: "1.52.4",
		dependencies : ["sap.ui.core","sap.ui.layout"],
		types: [
			"sap.zen.commons.layout.BackgroundDesign",
			"sap.zen.commons.layout.HAlign",
			"sap.zen.commons.layout.Padding",
			"sap.zen.commons.layout.Separation",
			"sap.zen.commons.layout.VAlign"
		],
		interfaces: [
		],
		controls: [
			"sap.zen.commons.layout.AbsoluteLayout",
			"sap.zen.commons.layout.MatrixLayout",
		],
		elements: [
			"sap.zen.commons.layout.MatrixLayoutCell",
			"sap.zen.commons.layout.MatrixLayoutRow",
			"sap.zen.commons.layout.PositionContainer"
		]
	});
	
	
	
	sap.zen.commons.layout = sap.zen.commons.layout || {};

	/**
	 * Background design (i.e. color), e.g. of a layout cell.
	 * 
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.zen.commons.layout.BackgroundDesign = {
	
		/**
		 * 
		 * A background design suitable for borders.
		 * 
		 * @public
		 */
		Border : "Border",
	
		/**
		 * 
		 * An opaque background design that looks dark filled.
		 * 
		 * @public
		 */
		Fill1 : "Fill1",
	
		/**
		 * 
		 * An opaque background design that looks medium filled.
		 * 
		 * @public
		 */
		Fill2 : "Fill2",
	
		/**
		 * 
		 * An opaque background design that looks light filled.
		 * 
		 * @public
		 */
		Fill3 : "Fill3",
	
		/**
		 * 
		 * A background design suitable for headers.
		 * 
		 * @public
		 */
		Header : "Header",
	
		/**
		 * 
		 * A plain but opaque background design.
		 * 
		 * @public
		 */
		Plain : "Plain",
	
		/**
		 * 
		 * A transparent background.
		 * 
		 * @public
		 */
		Transparent : "Transparent"
	
	};
	
	
	/**
	 * Horizontal alignment, e.g. of a layout cell's content within the cell's borders.
	 * Note that some values depend on the current locale's writing direction while
	 * others do not.
	 * 
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.zen.commons.layout.HAlign = {
	
		/**
		 * 
		 * Aligned towards the beginning of a line, in the current locale's writing direction.
		 * 
		 * @public
		 */
		Begin : "Begin",
	
		/**
		 * 
		 * Horizontally centered.
		 * 
		 * @public
		 */
		Center : "Center",
	
		/**
		 * 
		 * Aligned towards the end of a line, in the current locale's writing direction.
		 * 
		 * @public
		 */
		End : "End",
	
		/**
		 * 
		 * Left aligned, regardless of the current locale's writing direction.
		 * 
		 * @public
		 */
		Left : "Left",
	
		/**
		 * 
		 * Right aligned, regardless of the current locale's writing direction.
		 * 
		 * @public
		 */
		Right : "Right"
	
	};
	
	
	/**
	 * Padding, e.g. of a layout cell's content within the cell's borders.
	 * Note that all options except "None" include a padding of 2px at the top and
	 * bottom, and differ only in the presence of a 4px padding towards the beginning
	 * or end of a line, in the current locale's writing direction.
	 * 
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.zen.commons.layout.Padding = {
	
		/**
		 * 
		 * No padding at all.
		 * 
		 * @public
		 */
		None : "None",
	
		/**
		 * 
		 * Top and bottom padding of 2px.
		 * Padding of 4px towards the beginning of a line, in the current locale's
		 * writing direction, but none towards its end.
		 * 
		 * @public
		 */
		Begin : "Begin",
	
		/**
		 * 
		 * Top and bottom padding of 2px.
		 * Padding of 4px towards the end of a line, in the current locale's
		 * writing direction, but none towards its beginning.
		 * 
		 * @public
		 */
		End : "End",
	
		/**
		 * 
		 * Top and bottom padding of 2px.
		 * Padding of 4px towards both the beginning and end of a line.
		 * 
		 * @public
		 */
		Both : "Both",
	
		/**
		 * 
		 * Top and bottom padding of 2px.
		 * No padding towards neither the beginning nor end of a line.
		 * 
		 * @public
		 */
		Neither : "Neither"
	
	};
	
	
	/**
	 * Separation, e.g. of a layout cell from its neighbor, via a vertical gutter of
	 * defined width, with or without a vertical line in its middle.
	 * 
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.zen.commons.layout.Separation = {
	
		/**
		 * 
		 * No gutter at all (0px), and without a vertical line, of course.
		 * 
		 * @public
		 */
		None : "None",
	
		/**
		 * 
		 * A small (17px) vertical gutter without a vertical line.
		 * 
		 * @public
		 */
		Small : "Small",
	
		/**
		 * 
		 * A small (17px) vertical gutter with a vertical line in its middle.
		 * 
		 * @public
		 */
		SmallWithLine : "SmallWithLine",
	
		/**
		 * 
		 * A medium (31px) vertical gutter without a vertical line.
		 * 
		 * @public
		 */
		Medium : "Medium",
	
		/**
		 * 
		 * A medium (31px) vertical gutter with a vertical line in its middle.
		 * 
		 * @public
		 */
		MediumWithLine : "MediumWithLine",
	
		/**
		 * 
		 * A large (63px) vertical gutter without a vertical line.
		 * 
		 * @public
		 */
		Large : "Large",
	
		/**
		 * 
		 * A large (63px) vertical gutter with a vertical line in its middle.
		 * 
		 * @public
		 */
		LargeWithLine : "LargeWithLine"
	
	};
	
	
	/**
	 * Vertical alignment, e.g. of a layout cell's content within the cell's borders.
	 * 
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.zen.commons.layout.VAlign = {
	
		/**
		 * 
		 * Aligned at the bottom.
		 * 
		 * @public
		 */
		Bottom : "Bottom",
	
		/**
		 * 
		 * Vertically centered.
		 * 
		 * @public
		 */
		Middle : "Middle",
	
		/**
		 * 
		 * Aligned at the top.
		 * 
		 * @public
		 */
		Top : "Top"
	
	};
	
	return sap.zen.commons;

});
