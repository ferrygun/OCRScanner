/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Path", "sap/ui/core/Core"
], function (Path, Core) {
	"use strict";
	/**
	 * Creates and initializes a Relationship object
	 * 
	 * @param {string} [sId] ID for the new control, generated automatically if no is given
	 * @param {object} [mSetting] Initial settings for the new control
	 * 
	 * @class 
	 * Enables users to visualize the relationship between elements.
	 * 
	 * <p>Four types of relationships are supported and L-shaped lines are supported for the finish-to-start type.</p>
	 * 
	 * @extend sap.gantt.shape.Shape
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.shape.ext.rls.Relationship
	 */
	var Relationship = Path.extend("sap.gantt.shape.ext.rls.Relationship", /* @lends sap.gantt.shape.ext.rls.Relationship */ {
		metadata: {
			properties: {
				/**
				 * CSS class name of the relationship shape
				 */
				htmlClass: {type: "string", defaultValue: "relationshipLine"},
				/**
				 * Category name
				 */
				category: {type: "string", defaultValue: sap.gantt.shape.ShapeCategory.Relationship},
				/**
				 * Indicates whether the shape is a closed path
				 */
				isClosed: {type: "boolean", defaultValue: true},
				/**
				 * Indicates whether the width of the polygon represents the duration of time
				 */
				isDuration: {type: "boolean", defaultValue: false},
				/**
				 * Line color of the relationship shape
				 */
				stroke: {type: "string", defaultValue: "#000000"},
				/**
				 * Fill color of the relationship shape (the color of the arrow and the square at the ends)
				 */
				fill: {type: "string", defaultValue: "#000000"},

				/**
				 * Relationship type
				 */
				type: {type: "sap.gantt.shape.ext.rls.RelationshipType", defaultValue: sap.gantt.shape.ext.rls.RelationshipType.FinishToFinish},
				/**
				* Path of predecessor element
				*/
				fromObjectPath: {type: "string"},
				/**
				* Expand row index of predecessor element
				*/
				fromExpandRowIndex: {type: "int", defaultValue: 0},
				/**
				* Shape of predecessor element
				*/
				fromShapeId: {type: "string"},
				/**
				* Data of predecessor element
				*/
				fromDataId: {type: "string"},
				/**
				* Path of successor element
				*/
				toObjectPath: {type: "string"},
				/**
				* Expand row index of successor element
				*/
				toExpandRowIndex: {type: "int", defaultValue: 0},
				/**
				* Shape of successor element
				*/
				toShapeId: {type: "string"},
				/**
				* Data of successor element
				*/
				toDataId: {type: "string"},

				/**
				* Indicates whether the start point (square) of the relationship shape is visible
				*/
				showStart: {type: "boolean", defaultValue: false},
				/**
				* Indicates whether the end point (arrow) of the relationship shape is visible
				*/
				showEnd: {type: "boolean", defaultValue: true},
				/**
				* Indicates whether an 'L' shape is used for the finish-to-start type
				*/
				lShapeforTypeFS: {type: "boolean", defaultValue: true},
				/**
				* Minimum length for relationship lines 
				*/
				minXLen: {type: "float", defaultValue: 10},
				/**
				* Size of the arrow
				*/
				arrowSideLength: {type: "float", defaultValue: 5}

			},
			aggregations: {
				selectedShape: {type: "sap.gantt.shape.ext.rls.SelectedRelationship", multiple: false}
			}
		}
	});
	
	// RTL mode check
	Relationship.prototype.init = function () {
			this._isRTL = Core.getConfiguration().getRTL();
			var oRb = sap.ui.getCore().getLibraryResourceBundle("sap.gantt");
			this.setProperty("ariaLabel", oRb.getText("ARIA_RELATIONSHIP"));
	};

	/**
	 * Gets the relationship type 
	 * @returns {number} The type number (from 0 to 3)
     * @param {object} oData Raw data object
	 * @public
	 */
	Relationship.prototype.getType = function (oData) {
		return this._configFirst("type", oData);
	};
	/**
     * Gets the path of predecessor object
     * @returns {string} Path of predecessor element
     * @param {object} oData Raw data object
	 * @public
	 */
	Relationship.prototype.getFromObjectPath = function (oData) {
		return this._configFirst("fromObjectPath", oData);
	};
	/**
     * Gets the expand row index of predecessor object
     * @returns {int} Expand row index of predecessor element
     * @param {object} oData Raw data object
	 * @public
	 */
	Relationship.prototype.getFromExpandRowIndex = function (oData) {
		return oData.hasOwnProperty("fromExpandRowIndex") ? this._configFirst("fromExpandRowIndex", oData) : this.getProperty("fromExpandRowIndex");
	};
    /**
     * Gets the shape ID of the predecessor element
     * @returns {string} Shape ID of the predecessor element
     * @param {object} oData Raw data object
     * @public
     */
	Relationship.prototype.getFromShapeId = function (oData) {
		return this._configFirst("fromShapeId", oData);
	};
    /**
     * Gets the data of the predecessor element
     * @returns {string} Data of predecessor
     * @param {object} oData Raw data object
     * @public
     */
	Relationship.prototype.getFromDataId = function (oData) {
		return this._configFirst("fromDataId", oData);
	};
	/**
     * Gets the path of the successor element
     * @returns {string} Path of the successor element
     * @param {object} oData Raw data object
     * @public
     */
	Relationship.prototype.getToObjectPath = function (oData) {
		return this._configFirst("toObjectPath", oData);
	};
	/**
     * Gets the expand row index of successor object
     * @returns {int} Expand row index of successor element
     * @param {object} oData Raw data object
	 * @public
	 */
	Relationship.prototype.getToExpandRowIndex = function (oData) {
		return oData.hasOwnProperty("toExpandRowIndex") ? this._configFirst("toExpandRowIndex", oData) : this.getProperty("toExpandRowIndex");
	};
    /**
     * Gets the shape ID of the successor element
     * @returns {string} Shape ID of the successor element
     * @param {object} oData Raw data object
     * @public
     */
	Relationship.prototype.getToShapeId = function (oData) {
		return this._configFirst("toShapeId", oData);
	};
    /**
     * Gets the data of the successor element
     * @returns {string} Data of the successor element
     * @param {object} oData Raw data object
     * @public
     */
	Relationship.prototype.getToDataId = function (oData) {
		return this._configFirst("toDataId", oData);
	};
    /**
     * Gets the'L' shape switch
     * @returns {boolean} 'L' shape configuration (whether the system uses L-shaped lines to represent finish-start relationships)
     * @param {object} oData Raw data object
     * @public
     */
	Relationship.prototype.getLShapeforTypeFS = function (oData) {
		return this._configFirst("lShapeforTypeFS", oData);
	};
    /**
     * Gets the CSS class of the relationship shape
     * @returns {string} CSS class name of the relationship shape
     * @param {object} oData Raw data object
     * @public
     */
	Relationship.prototype.getHtmlClass = function (oData) {
		return this._configFirst("htmlClass", oData);
	};
    /**
     * Gets whether the start shape is visible 
     * @returns {boolean} Start shape configuration (whether the start shape is visible)
     * @param {object} oData Raw data object
     * @public
     */
	Relationship.prototype.getShowStart = function (oData) {
		return this._configFirst("showStart", oData);
	};
    /**
     * Gets whether the end shape is visible
     * @returns {boolean} End shape configuration (whether the end shape is visible
     * @param {object} oData Raw data object
     * @public
     */
	Relationship.prototype.getShowEnd = function (oData) {
		return this._configFirst("showEnd", oData);
	};

	/**
	 * @returns {string} a string of commands for the "d" attribute of <path> element or null if the generated d is invalid according to the given data.
	 * @param {object} oData Raw data object
	 * @param {object} oRowInfo Information about the shape object. The object is like
	 *                {
						from: {
							objectInfo: from_object,
							shapeRawData: from_shape_rawData
						},
						to: {
							objectInfo: to_object,
							shapeRawData: to_shape_rawData
						}
				};
	 */
	Relationship.prototype.getD = function (oData, oRowInfo) {
		var showEnd = this.getShowEnd(oData, oRowInfo);
		var showStart = this.getShowStart(oData, oRowInfo);
		
		var x1, y1, x2, y2;
		var type;
		try {
			type = window.parseInt(this.getType(oData, oRowInfo));
		} catch (e) {
			jQuery.sap.log.warning("invalid relationship type");
		}
		var lShapeforTypeFS = this.getLShapeforTypeFS(oData, oRowInfo);
		
		// To get the coordinates of the from shape (starting point) and to shape (ending point).
		var sFromShapeKey = this.getFromShapeId(oData, oRowInfo.from.objectInfo);
		var oFromShapeInstance = this.mChartInstance.getShapeInstance(sFromShapeKey);
		var oPoints1 = oFromShapeInstance.getRLSAnchors(oRowInfo.from.shapeRawData, oRowInfo.from.objectInfo);

		// For some shapes that wants to make the point of junction be on the top or the bottom of the shape (e.g. diamond), there are some special treatments based on lShapeforTypeFS.
		var sToShapeKey = this.getToShapeId(oData, oRowInfo.from.objectInfo);
		var oToShapeInstance = this.mChartInstance.getShapeInstance(sToShapeKey);
		var oPoints2 = oToShapeInstance.getRLSAnchors(oRowInfo.to.shapeRawData, oRowInfo.to.objectInfo);
		
		if (this._isRTL) {
			//For RTL mode, shift the startPoint and endPoint for axis X and Y
			if (type === sap.gantt.shape.ext.rls.RelationshipType.FinishToFinish){// Finish-Finish relationship
				x1 = oPoints1.startPoint.x;
				y1 = oPoints1.startPoint.y;
				x2 = oPoints2.startPoint.x;
				y2 = oPoints2.startPoint.y;
			}else if (type === sap.gantt.shape.ext.rls.RelationshipType.FinishToStart){ //Finish-Start
				x1 = oPoints1.startPoint.x;
				y1 = oPoints1.startPoint.y;
				x2 = oPoints2.endPoint.x;
				y2 = oPoints2.endPoint.y;
			}else if (type === sap.gantt.shape.ext.rls.RelationshipType.StartToFinish){ //Start-Finish
				x1 = oPoints1.endPoint.x;
				y1 = oPoints1.endPoint.y;
				x2 = oPoints2.startPoint.x;
				y2 = oPoints2.startPoint.y;
			}else if (type === sap.gantt.shape.ext.rls.RelationshipType.StartToStart){ //Start-Start
				x1 = oPoints1.endPoint.x;
				y1 = oPoints1.endPoint.y;
				x2 = oPoints2.endPoint.x;
				y2 = oPoints2.endPoint.y;
			}
		} else if (type === sap.gantt.shape.ext.rls.RelationshipType.FinishToFinish){// Finish-Finish relationship
				x1 = oPoints1.endPoint.x;
				y1 = oPoints1.endPoint.y;
				x2 = oPoints2.endPoint.x;
				y2 = oPoints2.endPoint.y;
		 }else if (type === sap.gantt.shape.ext.rls.RelationshipType.FinishToStart){ //Finish-Start
				x1 = oPoints1.endPoint.x;
				y1 = oPoints1.endPoint.y;
				x2 = oPoints2.startPoint.x;
				y2 = oPoints2.startPoint.y;
		 }else if (type === sap.gantt.shape.ext.rls.RelationshipType.StartToFinish){ //Start-Finish
				x1 = oPoints1.startPoint.x;
				y1 = oPoints1.startPoint.y;
				x2 = oPoints2.endPoint.x;
				y2 = oPoints2.endPoint.y;
		 }else if (type === sap.gantt.shape.ext.rls.RelationshipType.StartToStart){ //Start-Start
				x1 = oPoints1.startPoint.x;
				y1 = oPoints1.startPoint.y;
				x2 = oPoints2.startPoint.x;
				y2 = oPoints2.startPoint.y;
		  }
		

		var dStr = "";
		
		//Concatenate the Move and Line commands for the coordinates of the square
		if (showStart){
			var squarePoints = this._calculateSquareCoordinate(type, x1, y1);
			dStr = dStr.concat("M").concat(squarePoints[0].x).concat(",").concat(squarePoints[0].y).concat(" ");
			var squarePointsLength = squarePoints.length;
			for (var i = 1; i < squarePointsLength; i++){
				dStr = dStr.concat("L").concat(squarePoints[i].x).concat(",").concat(squarePoints[i].y).concat(" ");
			}
		}
		
		//Concatenate the Move and Line commands for the coordinates of the relationship line body
		var linePoints = this._calculateLineCoordinate(lShapeforTypeFS, type, x1, x2, y1, y2, oRowInfo.from.objectInfo, oPoints2.startPoint.height);
		dStr = dStr.concat("M").concat(linePoints[0].x).concat(",").concat(linePoints[0].y).concat(" ");
		var linePointsLength = linePoints.length;
		for (var j = 0; j < linePointsLength; j++){
			dStr = dStr.concat("L").concat(linePoints[j].x).concat(",").concat(linePoints[j].y).concat(" ");
			dStr = dStr.concat("M").concat(linePoints[j].x).concat(",").concat(linePoints[j].y).concat(" ");
		}
		
		//Concatenate the Move and Line commands for the coordinates of the arrow
		if (showEnd){
			var arrowPoints = this._calculateArrowCoordinate(lShapeforTypeFS, type, x1, x2, y1, y2, oPoints2.startPoint.height);
			var arrowPointsLength = arrowPoints.length;
			for (var k = 0; k < arrowPointsLength; k++){
				dStr = dStr.concat("L").concat(arrowPoints[k].x).concat(",").concat(arrowPoints[k].y).concat(" ");
			}
		}
		dStr = dStr.concat("Z");
		if(this.isValid(dStr)) {
			return dStr;
		} else {
			jQuery.sap.log.warning("Relationship shape generated invalid d: " + dStr + " from the given data: " + oData);
			return null;
		}
};

	/**
	 * Private method
	 * calculate the points of the square at the starting of the line.
	 * @param {number} type Relationship type
	 * @param {number} x1 Start point coordinate
	 * @param {number} y1 Start point coordinate
	 * @returns {object} array[x1,y1,xa,ya,xb,yb...x2,y2] Containing all the points of the square
	 */
	Relationship.prototype._calculateSquareCoordinate = function (type, x1, y1) {
		var square = [];

		if (type === sap.gantt.shape.ext.rls.RelationshipType.FinishToFinish || type === sap.gantt.shape.ext.rls.RelationshipType.FinishToStart) {
			if (this._isRTL) {
				//for RTL mode, square at the left of activity's left side
				square = [x1, y1 - 2, x1 - 3, y1 - 2, x1 - 3, y1 + 1.5, x1, y1 + 1.5, x1, y1 - 2];
			} else {
				// square at the right of activity's right side
				square = [x1 - 1, y1 - 2, x1 - 1 + 3, y1 - 2, x1 - 1 + 3, y1 + 1.5, x1 - 1, y1 + 1.5, x1 - 1, y1 - 2];
			}
		}else if (this._isRTL){
			//for RTL mode, square at the right of activity's right side
			square = [x1 - 1, y1 - 2, x1 - 1 + 3, y1 - 2, x1 - 1 + 3, y1 + 1.5, x1 - 1, y1 + 1.5, x1 - 1, y1 - 2];
		} else {
			//square at the left of activity's left side
			square = [x1, y1 - 2, x1 - 3, y1 - 2, x1 - 3, y1 + 1.5, x1, y1 + 1.5, x1, y1 - 2];
		}

		var object = [];
		var squareLength = square.length;
		for (var i = 0; i < squareLength;) {
			object[object.length] = {"x": square[i++], "y": square[i++]};
		}
		return object;
	};

	/**
	 * Private method
	 * calculate the points in the line.
	 * @param {boolean} lShapeforTypeFS Whether to draw 'L' shape for finish-to-start type of relationships
	 * @param {number} type the type of relationship
	 * @param {number} x1 Start point coordinate
	 * @param {number} x2 End point coordinate
	 * @param {number} y1 Start point coordinate
	 * @param {number} y2 End point coordinate 
	 * @param {object} fromObjectInfo The row object of starting point shape
	 * @param {number} shapeHeight Height of ending point shape
	 * @returns {object} array[x1,y1,xa,ya,xb,yb...x2,y2] Containing all the points on the line
	 */
	Relationship.prototype._calculateLineCoordinate = function (lShapeforTypeFS, type, x1, x2, y1, y2, fromObjectInfo, shapeHeight) {
		var data = [];

		var round, ceiling;

		if (y1 === y2) {// if two activities in a single row, simply returning line from start point to end point.
			data = data.concat([x1, y1, x2, y2]);
		}else {
			var k = this.getMinXLen(); //minimum length of the x-axis line.
			if (type === sap.gantt.shape.ext.rls.RelationshipType.FinishToFinish) {// Finish-Finish relationship
				if (this._isRTL){
					//for RTL mode, eliminate the length of line as same as Start-Start relationship
					data = data.concat([x1, y1, Math.min(x1, x2) - k, y1, Math.min(x1, x2) - k, y2, x2, y2]);
				} else {
					data = data.concat([x1, y1, Math.max(x1, x2) + k, y1, Math.max(x1, x2) + k, y2, x2, y2]);//eliminate the length of line
				}
				
			}else if (type === sap.gantt.shape.ext.rls.RelationshipType.FinishToStart) {//Finish-Start relationship
				if (lShapeforTypeFS) {//L shape for finish start line shape
					if (this._isRTL){
						//for RTL mode, eliminate the length of line 
						if (x1 > x2) {//L shape when there is space between two activities.
							if (y1 < y2) {//top down direction.
								y2 = y2 - shapeHeight / 2;
							}else {//bottom up direction.
								y2 = y2 + shapeHeight / 2;
							}
							data = data.concat([x1, y1, x2, y1, x2, y2]);
						}else if (y1 < y2){//S shape when there is no space.
							ceiling = fromObjectInfo.y + fromObjectInfo.rowHeight;
							data = data.concat([x1, y1, x1 - k, y1, x1 - k, ceiling, x2 + k, ceiling, x2 + k, y2, x2, y2]);
						}else if (y1 > y2) {
							round = fromObjectInfo.y;
							data = data.concat([x1, y1, x1 - k, y1, x1 - k, round, x2 + k, round, x2 + k, y2, x2, y2]);
						}
					} else if (x1 <= x2){//L shape when there is space between two activities.
						if (y1 < y2) {//top down direction.
							y2 = y2 - shapeHeight / 2 - 2;
						}else {
							y2 = y2 + shapeHeight / 2 + 2;
						}
						data = data.concat([x1, y1, x2, y1, x2, y2]);
					} else if (y1 < y2) {//S shape when there is no space.
						ceiling = fromObjectInfo.y + fromObjectInfo.rowHeight;
						data = data.concat([x1, y1, x1 + k, y1, x1 + k, ceiling, x2 - k, ceiling, x2 - k, y2, x2, y2]);
					} else if (y1 > y2) {
						round = fromObjectInfo.y;
						data = data.concat([x1, y1, x1 + k, y1, x1 + k, round, x2 - k, round, x2 - k, y2, x2, y2]);
					}
				}else if (this._isRTL) {//S shape for finish start line shape.
					//for RTL mode, eliminate the length of line 
					if (x1 - k > x2) {//reserve k space for each connection
						data = data.concat([x1, y1, x1 - k, y1, x1 - k, y2, x2, y2]);
					} else if (y1 < y2) {
						ceiling = fromObjectInfo.y + fromObjectInfo.rowHeight;
						data = data.concat([x1, y1, x1 - k, y1, x1 - k, ceiling, x2 + k, ceiling, x2 + k, y2, x2, y2]);
					} else if (y1 > y2) {
						round = fromObjectInfo.y - fromObjectInfo.rowHeight;
						data = data.concat([x1, y1, x1 - k, y1, x1 - k, round, x2 + k, round, x2 + k, y2, x2, y2]);
					}
				} else if (x1 + k <= x2) {//reserve k space for each connection
					if (this.getShowEnd()) {
						var arrowSideLength = this.getArrowSideLength();
						k = (x1 + k + arrowSideLength > x2) ? Math.abs(k - arrowSideLength) : k; 
					}
					data = data.concat([x1, y1, x1 + k, y1, x1 + k, y2, x2, y2]);
				} else if (y1 < y2) {
					ceiling = fromObjectInfo.y + fromObjectInfo.rowHeight;
					data = data.concat([x1, y1, x1 + k, y1, x1 + k, ceiling, x2 - k, ceiling, x2 - k, y2, x2, y2]);
				} else if (y1 > y2) {
					round = fromObjectInfo.y - fromObjectInfo.rowHeight;
					data = data.concat([x1, y1, x1 + k, y1, x1 + k, round, x2 - k, round, x2 - k, y2, x2, y2]);
				}
			}else if (type === sap.gantt.shape.ext.rls.RelationshipType.StartToFinish) { //Start-Finish relationship
				if (this._isRTL){
					//for RTL mode, eliminate the length of line 
					if (x1 < x2 - k) {
						data = data.concat([x1, y1, x1 + k, y1, x1 + k, y2, x2, y2]);
					}else if (y1 < y2){
						ceiling = fromObjectInfo.y + fromObjectInfo.rowHeight;
						data = data.concat([x1, y1, x1 + k, y1, x1 + k, ceiling, x2 - k, ceiling, x2 - k, y2, x2, y2]);
					}else if (y1 > y2) {
						round = fromObjectInfo.y;
						data = data.concat([x1, y1, x1 + k, y1, x1 + k, round, x2 - k, round, x2 - k, y2, x2, y2]);
					}
				} else if (x1 >= x2 + k) {
					data = data.concat([x1, y1, x1 - k, y1, x1 - k, y2, x2, y2]);
				}else if (y1 < y2){
					ceiling = fromObjectInfo.y + fromObjectInfo.rowHeight;
					data = data.concat([x1, y1, x1 - k, y1, x1 - k, ceiling, x2 + k, ceiling, x2 + k, y2, x2, y2]);
				}else if (y1 > y2) {
					round = fromObjectInfo.y;
					data = data.concat([x1, y1, x1 - k, y1, x1 - k, round, x2 + k, round, x2 + k, y2, x2, y2]);
				}
			
			}else if (type === sap.gantt.shape.ext.rls.RelationshipType.StartToStart) {  //Start-Start relationship
				if (this._isRTL){
					//for RTL mode, eliminate the length of line as same as Finish-Finish relationship
					data = data.concat([x1, y1, Math.max(x1, x2) + k, y1, Math.max(x1, x2) + k, y2, x2, y2]);
				} else {
					data = data.concat([x1, y1, Math.min(x1, x2) - k, y1, Math.min(x1, x2) - k, y2, x2, y2]);
				}
				
			}
		}

		var object = [];
		var dataLength = data.length;
		for (var i = 0; i < dataLength;) {
			object[object.length] = {"x": data[i++], "y": data[i++]};
		}
		return object;
	};

	/**
	 * Private method
	 * calculate the points of the arrow at the ending of the line.
	 * @param {boolean} lShapeforTypeFS Whether to draw 'L' shape for finish-to-start type of relationships
	 * @param {number} type the type of relationship
	 * @param {number} x1 Start point coordinate
	 * @param {number} x2 End point coordinate
	 * @param {number} y1 Start point coordinate
	 * @param {number} y2 End point coordinate
	 * @param {number} shapeHeight Height of the ending point shape
	 * @returns {object} array[x1,y1,xa,ya,xb,yb...x2,y2], containing all the points of the arrow
	 */
	Relationship.prototype._calculateArrowCoordinate = function (lShapeforTypeFS, type, x1, x2, y1, y2, shapeHeight) {
		var arrow = [];
		var arrowSideLength = this.getArrowSideLength();

		if (type === sap.gantt.shape.ext.rls.RelationshipType.FinishToFinish || type === sap.gantt.shape.ext.rls.RelationshipType.StartToFinish) {
			if (this._isRTL){
				//for RTL mode, right arrow
				arrow = [x2 - arrowSideLength * Math.pow(3, 1 / 2) / 2, y2 - arrowSideLength / 2, x2 - arrowSideLength * Math.pow(3, 1 / 2) / 2, y2 + arrowSideLength / 2];
			} else {
				// left arrow
				arrow = [x2 + arrowSideLength * Math.pow(3, 1 / 2) / 2, y2 - arrowSideLength / 2, x2 + arrowSideLength * Math.pow(3, 1 / 2) / 2, y2 + arrowSideLength / 2];
			}
		}else if (type === sap.gantt.shape.ext.rls.RelationshipType.StartToStart) {
			if (this._isRTL){
				//for RTL mode, left arrow
				arrow = [x2 + arrowSideLength * Math.pow(3, 1 / 2) / 2, y2 - arrowSideLength / 2, x2 + arrowSideLength * Math.pow(3, 1 / 2) / 2, y2 + arrowSideLength / 2];
			} else {
				//right arrow
				arrow = [x2 - arrowSideLength * Math.pow(3, 1 / 2) / 2, y2 - arrowSideLength / 2, x2 - arrowSideLength * Math.pow(3, 1 / 2) / 2, y2 + arrowSideLength / 2];
			}
			
		}else if (lShapeforTypeFS) {// finish-start relationship, need to check if L shape or S shape.
				//L shape for finish start line shape
				if (this._isRTL){
					//RTL mode, arrow for L shape
					if (x1 > x2) {
						if (y1 < y2) {//top down direction.
							y2 = y2 - shapeHeight / 2 - 1;
						}else if (y1 > y2) {//bottom up direction.
							y2 = y2 + shapeHeight / 2 + 1;
						}else {//y1 == y2
							//do nothing
						}
						if (y1 < y2) {//down
							arrow = [x2 + arrowSideLength / 2, y2 - arrowSideLength * Math.pow(3, 1 / 2) / 2, x2 - arrowSideLength / 2, y2 - arrowSideLength * Math.pow(3, 1 / 2) / 2];
						}else if (y1 == y2) {
							arrow = [x2 + arrowSideLength * Math.pow(3, 1 / 2) / 2, y2 - arrowSideLength / 2, x2 + arrowSideLength * Math.pow(3, 1 / 2) / 2, y2 + arrowSideLength / 2];
						}else {//up
							arrow = [x2 + arrowSideLength / 2, y2 + arrowSideLength * Math.pow(3, 1 / 2) / 2, x2 - arrowSideLength / 2, y2 + arrowSideLength * Math.pow(3, 1 / 2) / 2];
						}
					}else {//S shape, right arrow
						arrow = [x2 + arrowSideLength * Math.pow(3, 1 / 2) / 2, y2 - arrowSideLength / 2, x2 + arrowSideLength * Math.pow(3, 1 / 2) / 2, y2 + arrowSideLength / 2];
					}
				} else if (x1 <= x2) {
					if (y1 < y2) {//top down direction.
						y2 = y2 - shapeHeight / 2 - 1;
					} else if (y1 > y2) {//bottom up direction.
						y2 = y2 + shapeHeight / 2 + 1;
					} else {//y1 == y2
						//do nothing
					}
					if (y1 < y2) {//down
						arrow = [x2 - arrowSideLength / 2, y2 - arrowSideLength * Math.pow(3, 1 / 2) / 2, x2 + arrowSideLength / 2, y2 - arrowSideLength * Math.pow(3, 1 / 2) / 2];
					} else if (y1 == y2) {
						arrow = [x2 - arrowSideLength * Math.pow(3, 1 / 2) / 2, y2 - arrowSideLength / 2, x2 - arrowSideLength * Math.pow(3, 1 / 2) / 2, y2 + arrowSideLength / 2];
					} else {//up
						arrow = [x2 - arrowSideLength / 2, y2 + arrowSideLength * Math.pow(3, 1 / 2) / 2, x2 + arrowSideLength / 2, y2 + arrowSideLength * Math.pow(3, 1 / 2) / 2];
					}

				} else {//S shape, right arrow
					arrow = [x2 - arrowSideLength * Math.pow(3, 1 / 2) / 2, y2 - arrowSideLength / 2, x2 - arrowSideLength * Math.pow(3, 1 / 2) / 2, y2 + arrowSideLength / 2];
				}
			}else if (this._isRTL){
				//RTL mode, left arrow
				arrow = [x2 + arrowSideLength * Math.pow(3, 1 / 2) / 2, y2 - arrowSideLength / 2, x2 + arrowSideLength * Math.pow(3, 1 / 2) / 2, y2 + arrowSideLength / 2];
			} else {
				// S shape, right arrow
				arrow = [x2 - arrowSideLength * Math.pow(3, 1 / 2) / 2, y2 - arrowSideLength / 2, x2 - arrowSideLength * Math.pow(3, 1 / 2) / 2, y2 + arrowSideLength / 2];	
		    }

		var object = [];
		var arrowLength = arrow.length;
		for (var i = 0; i < arrowLength;) {
			object[object.length] = {"x": arrow[i++], "y": arrow[i++]};
		}
		return object;
	};

	return Relationship;
}, true);
