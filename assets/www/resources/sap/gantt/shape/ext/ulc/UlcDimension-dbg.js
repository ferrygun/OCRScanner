/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Group"
], function(Group){
	"use strict";
	
	/**
	 * Creates and initializes a fragment of the Utilization Line Chart.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings of the new control
	 * 
	 * @class 
	 * This shape is a container for {@link sap.gantt.shape.ext.ulc.UlcBorderPath}, {@link sap.gantt.shape.ext.ulc.UlcOverClipRectangle},
	 * {@link sap.gantt.shape.ext.ulc.UlcUnderClipRectangle}, {@link sap.gantt.shape.ext.ulc.UlcClipPath}, {@link sap.gantt.shape.ext.ulc.UlcClipingPath}.
	 * 
	 * <p>For each dimension, it has two colors, one is OverCapacity and the other is UnderCapacity. When the <code>UlcClipPath</code> of a dimension and 
	 * <code>UlcOverClipRectangle</code> overlap, which means the utilization rate is above 100%, the overlapped part will be colored by OverCapacity. 
	 * The overlapped part of <code>UlcClipPath</code>  and <code>UlcUnderClipRectangle</code> is colored by UnderCapacity. 
	 * </p>
	 * 
	 * <p><code>UlcClipingPath</code> is aggregated in <code>UlcClipPath</code>. <code>UlcClipingPath</code> and <code>UlcBorderPath</code> share the same 
	 * value of property 'd'. <code>UlcBorderPath</code> is used to visualize the dimension line.
	 * </p>
	 * @extends sap.gantt.shape.Group
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.shape.ext.ulc.UlcDimension
	 */
	var UlcDimension = Group.extend("sap.gantt.shape.ext.ulc.UlcDimension", /** @lends sap.gantt.shape.ext.ulc.UlcDimension.prototype */ {});

	return UlcDimension;
}, true);
