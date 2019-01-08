/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/drawer/Drawer", "sap/gantt/misc/Utility",
	// 3rd party lib
	"sap/ui/thirdparty/d3"
], function (Drawer, Utility) {
	"use strict";

	var ShapeCrossRow = Drawer.extend("sap.gantt.drawer.ShapeCrossRow");
	
	ShapeCrossRow.prototype.drawSvg = function (aSvgNode, oShape, oAxisTime, oAxisOrdinal) {
		// temp save param
		this._oAxisTime = oAxisTime;
		this._oAxisOrdinal = oAxisOrdinal;
		// create top g
		var aShapeTopG = aSvgNode.select("." + oShape.getId() + "-top");
		if (aShapeTopG.empty()) {
			aShapeTopG = aSvgNode.append("g")
				.classed(oShape.getId() + "-top", true);
		}
		var relationshipDataObjectArray = [];
		for (var i in oShape.dataSet) {
			relationshipDataObjectArray.push(oShape.dataSet[i].shapeData[0]);
		}
		var aShape = aShapeTopG.selectAll("." + oShape.getId())
			.data(relationshipDataObjectArray);
		this._drawPath(aShape, oShape);
		this._drawInsertTitle(aShape, oShape);
	};
	
	ShapeCrossRow.prototype._drawPath = function (aShape, oShape) {
		var fFindObjectInfo = this._findObjectInfo;
		var that = this;

		aShape.enter().append("path")
			.classed(oShape.getId(), true);

		aShape
			.classed("hasTitle", function (d) {
				return oShape.getTitle(d, fFindObjectInfo(this, oShape, that)) ? true : false;
			})
			.classed("enableSelected", function (d) {
				return oShape.getEnableSelection(d, fFindObjectInfo(this, oShape, that)) ? true : false;
			})
			.attr("d", function (d) {
				return oShape.getD(d, fFindObjectInfo(this, oShape, that));
			}).attr("fill", function (d) {
				if (oShape.getIsClosed(d, fFindObjectInfo(this, oShape, that))) {
					return oShape.getFill(d, fFindObjectInfo(this, oShape, that));
				}
			}).attr("stroke", function (d) {
				return oShape.getStroke(d, fFindObjectInfo(this, oShape, that));
			}).attr("stroke-width", function (d) {
				return oShape.getStrokeWidth(d, fFindObjectInfo(this, oShape, that));
			}).attr("stroke-dasharray", function (d) {
				return oShape.getStrokeDasharray(d, fFindObjectInfo(this, oShape, that));
			}).attr("fill-opacity", function (d) {
				if (oShape.getIsClosed(d, fFindObjectInfo(this, oShape, that))) {
					return oShape.getFillOpacity(d, fFindObjectInfo(this, oShape, that));
				}
			}).attr("stroke-opacity", function (d) {
				if (oShape.getIsClosed(d, fFindObjectInfo(this, oShape, that))) {
					return oShape.getStrokeOpacity(d, fFindObjectInfo(this, oShape, that));
				}
			});

		this.addDataAttributes(aShape);
		aShape.exit().remove();
	};
	
	ShapeCrossRow.prototype._drawInsertTitle = function (aShape, oShape) {
		var fFindObjectInfo = this._findObjectInfo;
		var that = this;

		aShape.select("title").remove();
		aShape.insert("title", ":first-child")
			.each(function (d) {
				var oSelf = d3.select(this);
				oSelf.selectAll("tspan").remove();
				if (sap.ui.Device.browser.msie) {
					var aLines = oShape.getTitle(d, fFindObjectInfo(this, oShape)).split("\n");
					for(var i = 0; i < aLines.length; i++) {
						oSelf.append("tspan")
							.classed("sapGanttTooltipLine", true)
							.text(aLines[i]);
					}
				} else {
					oSelf.text(oShape.getTitle(d, fFindObjectInfo(this, oShape)));
				}
			});
	};

	ShapeCrossRow.prototype._findObjectInfo = function (oNode, oShape, oThis, isSelectedShape) {
		// Since relationship raw data has been processed by _drawShapes method, oRawData (i.e. oNode.__data__.rawData) has already have "fromShapeInstance", "toShapeInstance" attributes.
		// To get the coordinates of the from shape (starting point) and to shape (ending point), it 
		// iterates objectDataSet to find the one whose id equals oRawData.fromObjectPath and gets the raw data of the ref object whose id equals oRawData.fromDataId.
		// The returned object which contains object and shape's raw data of from and to are later used by getD method and are passed into oRawData.fromShapeInstance.getRLSAnchors and
		// oRawData.toShapeInstance.getRLSAnchors methods for getting the coordinates.

		var relationship = oNode.__data__;
		var oRawData = relationship;
		if (isSelectedShape) {
			oRawData = relationship.data.rawData;
		}

		var rlsRetVal = {
			from: {
				objectInfo: oRawData.fromObject.objectInfoRef ? oRawData.fromObject.objectInfoRef : oRawData.fromObject,
				shapeRawData: oRawData.fromShapeRawData
			},
			to: {
				objectInfo: oRawData.toObject.objectInfoRef ? oRawData.toObject.objectInfoRef : oRawData.toObject,
				shapeRawData: oRawData.toShapeRawData
			}
		};
		return rlsRetVal;
	};

	ShapeCrossRow.prototype.destroySvg = function (aSvgNode, oShape) {
	};

	ShapeCrossRow.prototype.generateRelationshipDataSet = function (aSvgNode, oShapeMap, aNonVisibleShapeData, aShapeDataNames, oRelationship, oAxisTime, oAxisOrdinal) {
			/*
			 * This piece of code searches aRelationship and finds all relationships whose starting point and ending point are both expanded. 
			 * Set below attributes for these relationship:
			 * 		"fromShapeInstance"	the instance of shape class		type: object
			 * 		"toShapeInstance"		the instance of shape class		type: object
			 * And push these relationships into the "dataSet" attribute of Relationship class instance for drawing them later on.
			 * Additionally, this method also saves a reference of aDataSet into the "_objectDataSet" attribute of Relationship class.
			 * 
			 * Description of some objects which are used in this algorithm:
			 * - oShapeInstances
			 * 			the collection of shape instances, each element has 'dataSet' attribute which contains the data of that shape to draw
			 * - aRelationship
			 * 			the raw data of relationship which is set and stored in Chart object
			 * - this.dataSet 
			 * 			the array of the data of all the expanded rows (this means that its length is no smaller than 23 because there are always 23 rows in the visible area including empty rows), 
			 * it is changing according to users' interactions on the UI, e.g. expand/collapse a row,
			 * and it is constructed from traversing the initial tree structured data, for example,
			 * tree structure: 
			 * 			root
			 * 				header			id: 0
			 * 					phase		id: 10
			 * 						task	id: 20
			 * 						task	id: 21
			 * 					phase		id: 11
			 * 						task	id: 22
			 * 					phase		id: 12
			 * 				header			id: 1
			 * 
			 * dataSet structure:
			 * 		[header, phase, task, task, phase, task, phase, header]
			 * 
			 * map structure (is constructed in this function):
			 * 		{
			 * 			0: header,
			 * 			1: header,
			 * 			10: phase,
			 * 			11: phase,
			 * 			12: phase,
			 * 			20: task,
			 * 			21: task,
			 * 			22: task
			 * 		}
			 */
			//this._relationships = oRowBinding.getModel().getObject(oRowBinding.getPath() + "/relationships");
			var aRelationship = oRelationship;
			var relationshipDataSet = [];
			if (aRelationship !== undefined && aRelationship.length > 0) {
				var relationshipClass;
				var sShapeId;
				for (sShapeId in oShapeMap) {
					if (oShapeMap[sShapeId].getCategory(null, oAxisTime, oAxisOrdinal)
						=== sap.gantt.shape.ShapeCategory.Relationship) {
						relationshipClass = oShapeMap[sShapeId];
						break;
					}
				}

				if (relationshipClass) {

					var objectIdPathMap = {};

					//Initial objectIdPathMap
					//The purpose of generating the map of expanded row data is for checking whether both the relationship's starting point and ending point are expanded.
					//If the starting point isn't expanded, map[relationship.rawData.fromObjectPath] will be undefined.
					//If the ending point isn't expanded, map[relationship.rawData.toObjectPath] will be undefined.
					//A relationship whose starting point or ending point is not expanded won't be displayed.
					for (sShapeId in oShapeMap) {
						if (oShapeMap[sShapeId].dataSet && oShapeMap[sShapeId].dataSet != "" 
							&& oShapeMap[sShapeId].mShapeConfig.getShapeDataName() != sap.gantt.shape.ShapeCategory.Relationship){
							Utility.generateObjectPathToObjectMap(oShapeMap[sShapeId].dataSet, objectIdPathMap, null);
						}
					}
					Utility.generateObjectPathToObjectMap(aNonVisibleShapeData, objectIdPathMap, null);
						
					var relationship;
					var relationshipRawData;
					
					for (var i = 0; i < aRelationship.length; i++) {
						relationship = aRelationship[i];
						relationshipRawData = relationship;
						var fromObjectPath = relationshipClass.getFromObjectPath(relationshipRawData, null);
						var fromObject = objectIdPathMap[fromObjectPath + "-" + relationshipClass.getFromExpandRowIndex(relationshipRawData, null)];
						
						//If fromObject doesn't exist in the map or it doesn't have 'y' attribute, it means the row isn't expanded,
						//then we are NOT displaying the relationship.
						if (!fromObject) {
							continue;
						}
						
						//Get the raw data of the ref object whose id equals oRawData.fromDataId.
						//objecthierarchy._enhanceObject method sets rawData attribute to ref object, so
						//that the raw data of ref object is available.
						
						var toObjectPath = relationshipClass.getToObjectPath(relationshipRawData, null);
						var toObject = objectIdPathMap[toObjectPath + "-" + relationshipClass.getToExpandRowIndex(relationshipRawData, null)];
						
						//If toObject doesn't exist in the map or it doesn't have 'y' attribute, it means the row isn't expanded,
						//then we are NOT displaying the relationship.
						if (!toObject) {
							continue;
						}
						
					    var fromShapeId = relationshipClass.getFromShapeId(relationshipRawData, null);
						var fromDataId = relationshipClass.getFromDataId(relationshipRawData, null);

						//fromObject.shapeData is the array contains one or multiple elements of shape data (when multiple, in that row there are multiple ones of that shape)
						//fromObject.shapeData MUST NOT be undefined
						var sFromShapeDataName = oShapeMap[fromShapeId].mShapeConfig.getShapeDataName();
						var fromShapeRawData = this._findShapeDataFromRowObjectByShapeDataName(fromObject, fromDataId, sFromShapeDataName);
						if (!fromShapeRawData) {
							continue;
						}

						var toShapeId = relationshipClass.getToShapeId(relationshipRawData, null);
						var toDataId = relationshipClass.getToDataId(relationshipRawData, null);

						var sToShapeDataName = oShapeMap[toShapeId].mShapeConfig.getShapeDataName();
						var toShapeRawData = this._findShapeDataFromRowObjectByShapeDataName(toObject, toDataId, sToShapeDataName);
						if (!toShapeRawData) {
							continue;
						}

						relationshipRawData.fromObject = fromObject;
						relationshipRawData.toObject = toObject;
						relationshipRawData.fromShapeRawData = fromShapeRawData;
						relationshipRawData.toShapeRawData = toShapeRawData;

						var object = {
							"shapeData": [relationship]
						};
						relationshipDataSet.push(object);

					}

				}
			}
			return relationshipDataSet;
		};

		/*
		 * Find the shape data object from the row object by shape data id
		 * 
		 * @param {object} oRowObject
		 * @param {string} sShapeDataId
		 * @return {object} The shape data object whose id equals to the given sShapeDataId
		 * 
		 * Case 1: There is shapeData array in oRowObject, then loop shapeData and return the matched object whose id equals to the given sShapeDataId
		 * oRowObject = {
		 * 		objectInfoRef: {
		 * 			bindingObj: {},
		 * 			contextObj: {},
		 * 			data: {
		 * 				activity: [],
		 * 				order: [],
		 * 				endTime: "2014.09.23",
		 * 				end_loc_id: "BERLIN",
		 * 				id: "0000",
		 * 				selected: false,
		 * 				startTime: "2014.09.20",
		 * 				start_loc_id: "WDF",
		 * 				status: 2,
		 * 				type: "TOL",
		 * 				uuid: "01_0"
		 * 			},
		 * 			rowHeight: 28,
		 * 			uid: "PATH:0000|SCHEME:ac_main",
		 * 			y: 0
		 * 		},
		 * 		shapeData: [{},{},...] <-------------- matched object
		 * }
		 * 
		 * Case 2: oRowObject is already the objectInfoRef of Case 1, then loop <sShapeId> (e.g. 'activity' or 'order' and so on) and return the matched object whose id equals to the given sShapeDataId
		 * oRowObject = {
		 * 		bindingObj: {},
		 * 		contextObj: {},
		 * 		data: {
		 * 			activity: [], <-------------------matched object
		 * 			order: [],
		 * 			endTime: "2014.09.23",
		 * 			end_loc_id: "BERLIN",
		 * 			id: "0000",
		 * 			selected: false,
		 * 			startTime: "2014.09.20",
		 * 			start_loc_id: "WDF",
		 * 			status: 2,
		 * 			type: "TOL",
		 * 			uuid: "01_0"
		 * 		},
		 * 		rowHeight: 28,
		 * 		uid: "PATH:0000|SCHEME:ac_main",
		 * 		y: 0
		 * }
		 */
		ShapeCrossRow.prototype._findShapeDataFromRowObjectByShapeDataName = function (oRowObject, sShapeDataId, sShapeName) {
			/* the key in shapeConfig sometimes is different from shapeDataName, e.g.: {key: "criticalTask", shapeDataName: "task", shapeClassName: }
			 * in above example, the fromShapeId in relationship is "criticalTask", but the uid generation use "task"
			 * use related shapeDataName to get the shape data
			 */
			var oShapeData, aShapeData;

			if (oRowObject.shapeData) {
				aShapeData = oRowObject.shapeData;
			} else if (oRowObject.data && oRowObject.data[sShapeName]){
				aShapeData = oRowObject.data[sShapeName];
			} else if (oRowObject.data) {
				return oRowObject.data;
			} else {
				aShapeData = oRowObject;
			}

			for (var i = 0; i < aShapeData.length; i++) {
				if (aShapeData[i].__id__ !== undefined && aShapeData[i].__id__ == sShapeDataId) {
					oShapeData = aShapeData[i];
					break;
				}
			}
			if (oShapeData == undefined && aShapeData.length > 0) {
				oShapeData = aShapeData[0];
			}
			
			return oShapeData;
		};

		/**
		 * Add DataSet attribute on the Shape DOM element for quick reference.
		 * 
		 * If consumer doesn't specify the id <b>reserved keyword</b> in their data, use
		 * jQuery.sap.uid() instead
		 * 
		 * @param {object} oShape D3 DOM element
		 * @private
		 */
		ShapeCrossRow.prototype.addDataAttributes = function(oShape) {
			oShape.attr("data-sap-gantt-shape-id", function(d){
				return d.__id__;
			});
		};

	return ShapeCrossRow;
}, true);
