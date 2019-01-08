/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

// Provides class sap.gantt.ShapeSelectionModel
sap.ui.define(["jquery.sap.global", "sap/ui/base/ManagedObject", "sap/gantt/misc/Utility"],
	function(jQuery, ManagedObject, Utility) {
	"use strict";

	/**
	 * Constructs an instance of a sap.gantt.ShapeSelectionModel.
	 *
	 * @class
	 * @extends sap.ui.base.ManagedObject
	 *
	 * @author SAP SE
	 * @version {version}
	 *
	 * @param {string} sSelectionMode <code>sap.gantt.SelectionMode.MultiWithKeyboard</code> or
	 * <code>sap.gantt.SelectionMode.Multiple</code> or <code>sap.gantt.SelectionMode.Single</code>
	 * or <code>sap.gantt.SelectionMode.None</code>
	 *
	 * @constructor
	 * @private
	 * @alias sap.gantt.ShapeSelectionModel
	 */
	var ShapeSelectionModel = ManagedObject.extend("sap.gantt.misc.ShapeSelectionModel", /** @lends sap.gantt.misc.ShapeSelectionModel.prototype */ {

		constructor : function(sId, mSettings) {
			ManagedObject.apply(this, arguments);

			this.aSelectedRelationships = [];

			this.mSelectedShapes = {
				"uid": [],
				"shapes": []
			};
		},
		metadata: {
			properties: {
				"selectionMode": {
					type: "sap.gantt.SelectionMode",
					defaultValue: sap.gantt.SelectionMode.MultiWithKeyboard
				}
			},
			associations: {
				/**
				 * The target gantt chart.
				 */
				"ganttChart": {
					type: "sap.gantt.GanttChart",
					multiple: false
				}
			}
		}
	});

	var DatumType = {
		Row: "Row",
		Shape: "Shape"
	};

	ShapeSelectionModel.prototype.clearAllSelections = function() {
		var bChanged = this.clearShapeSelection();
		var bRlsChanged = this.clearRelationshipSelection();
		return bChanged && bRlsChanged;
	};

	/**
	 * Clear shape selection.
	 *
	 * @return {boolean} true if shape selection changed.
	 */
	ShapeSelectionModel.prototype.clearShapeSelection = function() {
		if (this.mSelectedShapes.uid.length === 0) {
			return false;
		}
		this.mSelectedShapes.uid = [];
//		this.mSelectedShapes.shapes = [];
		return true;
	};

	/**
	 * Clear relationship selection.
	 *
	 * @return {boolean} true if shape selection changed.
	 */
	ShapeSelectionModel.prototype.clearRelationshipSelection = function() {
		if (this.aSelectedRelationships.length === 0) {
			return false;
		}
		this.aSelectedRelationships = [];
		return true;
	};

	/**
	 * Get all selected shapes in Row.
	 *
	 * @return {array} return an array of selected shape datum
	 */
	ShapeSelectionModel.prototype.getSelectedShapeDatum = function() {
		var aDatum = [];
		var iLength = this.mSelectedShapes.uid.length;
		for(var i = 0; i < iLength; i++) {
			var sUid = this.mSelectedShapes.uid[i];
			var oDatum = this.getShapeDatumByShapeUid(sUid);
			if (oDatum) {
				aDatum.push(oDatum);
			}
		}
		return aDatum;
	};

	/**
	 * Get All selected relationships.
	 *
	 * @return {array} an list of selected relationship
	 */
	ShapeSelectionModel.prototype.getSelectedRelationships = function() {
		return this.aSelectedRelationships;
	};

	/**
	 * Check if the shape is selected
	 *
	 * @param {string} sShapeUid Shape UID
	 * @return {boolean} true if shape is selected, otherwise false returned
	 */
	ShapeSelectionModel.prototype.isShapeSelected = function(sShapeUid) {
		return jQuery.inArray(sShapeUid, this.mSelectedShapes.uid) === -1 ? false : true;
	};

	/**
	 * Check whether a relationship is selected or not.
	 *
	 * @param {string} sUid shape UID
	 * @return {boolean} true selected false: unselected
	 */
	ShapeSelectionModel.prototype.isRelationshipSelected = function(sUid) {
		return this.aSelectedRelationships.some(function(oShape){
			return oShape.uid === sUid;
		});
	};

	/**
	 * @private
	 */
	ShapeSelectionModel.prototype.isSelectedShapeVisible = function(sShapeUid, sContainer) {
		var sShapeId = Utility.getIdByUid(sShapeUid);
		// same shape might displayed in different gantt chart
		var aDatum = Utility.getShapeDatumById(sShapeId, sContainer);
		return aDatum.some(function(oItem){
			return oItem.uid === sShapeUid;
		});
	};

	/**
	 * Check if shapeSelectionChange and relationshipSelectionChange happen
	 *
	 * @param {object} oShapeData the shape you want to select
	 * @param {object} oRowInfo the original event, e.g. mouseup
	 * @param {boolean} bCtrlOrMeta if ctrl key is pressed in the original event, on Mac systems the Meta key should be checked instead of the Ctrl key.
	 * @param {boolean} bDragging if user is dragging the shape
	 * @return {object} {shapeSelectionChange, relationshipSelectionChange} return
	 * shapeSelectionChange=true when select shape selection changed,
	 * relationshipSelectionChange=true when relationship selection changed
	 */
	ShapeSelectionModel.prototype.changeShapeSelection = function (oShapeData, oRowInfo, bCtrlOrMeta, bDragging, bResizing) {
		/*
		 * Click on Shapes:	Clear any existing selection of all shape and select current shape.
		 * Click on Shapes + control key:	Keep existing selection of all shapes and change selection of current shape.	Keep all rows selection. Keep all relationship selection
		 * above 2 same for the relationships
		 * Old: Click on Shape + shift key = Click on Shape
		 */
		var bShapeSelectionChange,
			bRelationshipSelectionChange;

		// shouldn't do anything if selection mode is None
		if (this.getSelectionMode() === sap.gantt.SelectionMode.None) {
			return {
				shapeSelectionChange: false,
				relationshipSelectionChange: false
			};
		}

		//check is the current shape a relationship
		var isRelationship = (Utility.getShapeDataNameByUid(oShapeData.uid) === sap.gantt.shape.ShapeCategory.Relationship);

		var bMultiSelection = (bCtrlOrMeta && this.getSelectionMode() === sap.gantt.SelectionMode.MultiWithKeyboard) || this.getSelectionMode() === sap.gantt.SelectionMode.Multiple;
		/*
		 * when ctrl key is pressed or in Fiori multiple selection mode, clicking on an selected shape should be de-selection
		 */
		if (bMultiSelection) {
			// multiple selection scenario
			if (isRelationship) {
				if (this.isRelationshipSelected(oShapeData.uid)){
					bRelationshipSelectionChange = this.deselectRelationship(oShapeData.uid);
				} else {
					bRelationshipSelectionChange = this.selectRelationship(oShapeData);
				}
			} else {
				//if the shape is already in selectedShapes, deselect it, otherwise select it
				if (this.isShapeSelected(oShapeData.uid) && !bDragging && !bResizing){
					bShapeSelectionChange = this.deselectShape(oShapeData.uid);
				} else {
					bShapeSelectionChange = this.selectByShapeData(oShapeData);
				}
			}
		} else {
			// non-multiple selection
			if (isRelationship) {
				/*
				 * clicking a relationship without control key,
				 * if the relationship was unselected, clear existing shape/relationship selection and select current relationship
				 */
				if (!this.isRelationshipSelected(oShapeData.uid)) {
					bRelationshipSelectionChange = this.clearRelationshipSelection();
					bShapeSelectionChange = this.clearShapeSelection();
					bRelationshipSelectionChange = this.selectRelationship(oShapeData) ? true : bRelationshipSelectionChange;
				}
			} else {
				/* clicking a shape, without control key
				 * if the shape was unselected, clear existing shape/relationship selection and select current shape
				 */
				if (!this.isShapeSelected(oShapeData.uid) && !bDragging && !bResizing) {
					bRelationshipSelectionChange = this.clearRelationshipSelection();
					bShapeSelectionChange = this.clearShapeSelection();
					bShapeSelectionChange = this.selectByShapeData(oShapeData) ? true : bShapeSelectionChange;
				}
			}
		}
		return {
			shapeSelectionChange: bShapeSelectionChange,
			relationshipSelectionChange: bRelationshipSelectionChange
		};
	};

	/**
	 * Select a single shape
	 *
	 * @param {object} oShapeData the binded shape data you want to select
	 * @return {boolean} return true when select a shape successfully
	 */
	ShapeSelectionModel.prototype.selectByShapeData = function (oShapeData) {
		if (!oShapeData || this.isShapeSelected(oShapeData.uid)) {
			return false;
		}

		this.mSelectedShapes.uid.push(oShapeData.uid);
//		this.mSelectedShapes.shapes.push(oShapeData);

		return true;
	};

	ShapeSelectionModel.prototype.selectShapeByUid = function (aUid) {
		var bRetVal;
		if (aUid && aUid.length > 0) {
			for (var i = 0; i < aUid.length; i++) {
				bRetVal = bRetVal || this.selectByShapeData(this.getShapeDatumByShapeUid(aUid[i]));
			}
		}
		return bRetVal;
	};

	/**
	 * de-select a single shape by it's uid
	 *
	 * @param {object} sShapeUid the shape you want to deselect
	 * @return {boolean} return true when deselect a shape successfully
	 */
	ShapeSelectionModel.prototype.deselectShape = function (sShapeUid) {
		var iIndex = jQuery.inArray(sShapeUid, this.mSelectedShapes.uid);
		if (iIndex >= 0) {
			this.mSelectedShapes.uid.splice(iIndex, 1);
//			this.mSelectedShapes.shapes.splice(iIndex, 1);
		} else {
			return false;
		}

		return true;
	};

	/**
	 * Select multiple shapes by their binded shape data
	 *
	 * @param {array} [aShapeId] a list of shapes ID
	 * @param {boolean} bExclusive if need to clear other existing selection of shapes
	 * @return {boolean} return true when select shapes successfully
	 */
	ShapeSelectionModel.prototype.selectShapes = function(aShapeId, bExclusive) {

		if (!aShapeId || aShapeId.length === 0) {
			return this.clearShapeSelection();
		}
		var bUpdated;
		if (bExclusive) {
			bUpdated = this.clearShapeSelection();
		}

		var aShapes = this._getShapeDatumForSelection(aShapeId);

		for (var j = 0; j < aShapes.length; j++) {
			bUpdated = this.selectByShapeData(aShapes[j]) ? true : bUpdated;
		}
		return bUpdated;
	};

	/**
	 * Deselect shapes accordingly to shape IDs
	 *
	 * @param {array} [aIds] List ID of the shapes
	 * @return {boolean} true when shape selection changed
	 */
	ShapeSelectionModel.prototype.deselectShapes = function(aIds) {
		if (!aIds || aIds.length === 0) {
			return this.clearShapeSelection();
		}
		var bUpdated;

		var aShapeDatum = this.getSelectedShapeDatum();
		for (var i = 0; i < aShapeDatum.length; i++){
			var oShapeData = aShapeDatum[i];
			if (jQuery.inArray(oShapeData.__id__, aIds) >= 0) {
				bUpdated = this.deselectShape(oShapeData.uid) ? true : bUpdated;
			}
		}

		return bUpdated;
	};

	/**
	 * Select a single relationship shape
	 *
	 * @param {object} oRelationship relationship data
	 * @return {boolean} true if relationship selection changed
	 */
	ShapeSelectionModel.prototype.selectRelationship = function(oRelationship) {
		if (this.isRelationshipSelected(oRelationship.uid)) {
			return false;
		}
		this.aSelectedRelationships.push(oRelationship);
		return true;
	};

	/**
	 * De-select a relationship by it's uid
	 *
	 * @private
	 * @param {string} sRelationshipUid uid of the relationship to be selected
	 * @return {boolean} true if relationship selection changed
	 */
	ShapeSelectionModel.prototype.deselectRelationship = function(sRelationshipUid) {
		var that = this;
		var bUpdated = jQuery.each(this.aSelectedRelationships, function (iIndex, relationship) {
			if (relationship.uid === sRelationshipUid) {
				that.aSelectedRelationships.splice(iIndex, 1);
				return true;
			}
		});
		return bUpdated ? true : false;
	};

	/**
	 * select multiple relationships
	 * @param {array} [aRelationships] List relationships which enable Selection
	 * @param {boolean} bExclusive if clear existing relationship selection
	 * @return {boolean} return true when select relationships successfully
	 */
	ShapeSelectionModel.prototype.selectRelationships = function(aRelationships, bExclusive) {
		if (!aRelationships || aRelationships.length === 0) {
			return this.clearRelationshipSelection();
		}
		var bUpdated;
		if (bExclusive) {
			bUpdated = this.clearRelationshipSelection();
		}
		for (var i = 0; i < aRelationships.length; i++) {
			bUpdated = this.selectRelationship(aRelationships[i]) ? true : bUpdated;
		}
		return bUpdated;
	};

	/**
	 * de-select multiple relationships by their ids
	 * @param {array} [aIds] List ids of the relationships you want to deselect
	 * @return {boolean} return true when deselect relationships successfully
	 */
	ShapeSelectionModel.prototype.deselectRelationships = function(aIds) {
		if (!aIds || aIds.length === 0) {
			return this.clearRelationshipSelection();
		} else {
			var bUpdated;
			for (var j in this.aSelectedRelationships) {
				var oRelationship = this.aSelectedRelationships[j];
				if (jQuery.inArray(oRelationship.id, aIds) >= 0) {
					bUpdated = this.deselectRelationship(oRelationship.uid) ? true : bUpdated;
				}
			}
			return bUpdated;
		}
	};

	/**
	 * @private
	 */
	ShapeSelectionModel.prototype.selectUnderlyingTableRows = function(aIds, oTable, bExclusive) {

		// clear all row selection if exclusive is true
		var aTableSelectedIndices = oTable.getSelectedIndices();
		if (bExclusive && aTableSelectedIndices.length > 0) {
			oTable.clearSelection();
		}

		var aRowDatum = this._getRowDatumForSelection(aIds, oTable);

		for (var iIndex = 0; iIndex < aRowDatum.length; iIndex++) {
			var oRowInfo = aRowDatum[iIndex];

			var sSelectionMode = this.getSelectionMode();
			if (sSelectionMode === sap.gantt.SelectionMode.Multiple ||
				sSelectionMode === sap.gantt.SelectionMode.MultiWithKeyboard) {
				oTable.addSelectionInterval(oRowInfo.rowIndex, oRowInfo.rowIndex);
			}else {
				oTable.setSelectedIndex(oRowInfo.rowIndex);
			}

		}
	};

	/**
	 * @private
	 */
	ShapeSelectionModel.prototype.deselectUnderlyingTableRows = function(aIds, oTable) {

		if (!aIds || aIds.length === 0) {
			// Passing null/undefined/[]/"" clears all table row selection??
			// The behavior is rather strange, but to keep the backward compatibility!
			oTable.clearSelection();
			return;
		}

		var aRowDatum = this._getRowDatumForSelection(aIds, oTable);

		for (var iIndex = 0; iIndex < aRowDatum.length; iIndex++) {
			var oRowInfo = aRowDatum[iIndex];

			oTable.removeSelectionInterval(oRowInfo.rowIndex, oRowInfo.rowIndex);
		}
	};

	/**
	 * Get binded shape datum by shape UID.
	 * 
	 * @param {string} sShapeUid generated UID on binded shape data
	 * 
	 * @return {object} binded shape datum
	 * 
	 * @private
	 */
	ShapeSelectionModel.prototype.getShapeDatumByShapeUid = function (sShapeUid) {
		return this._getDatumByUid(sShapeUid, DatumType.Shape);
	};

	/**
	 * Get binded row datum by shape UID.
	 * 
	 * @param {string} sShapeUid generated UID on binded shape data
	 * 
	 * @return {object} binded row datum
	 * @private
	 */
	ShapeSelectionModel.prototype.getRowDatumByShapeUid = function(sShapeUid) {
		return this._getDatumByUid(sShapeUid, DatumType.Row);
	};

	ShapeSelectionModel.prototype._getDatumByUid = function (sShapeUid, sDatumType) {
		var oGantt = this._getGanttChart();

		// Try to find out the shape/row datum in d3 datum
		var oDatum;
		if (DatumType.Shape === sDatumType) {
			oDatum = Utility.getShapeDatumByShapeUid(sShapeUid, oGantt.getId());
		} else {
			oDatum = Utility.getRowDatumByShapeUid(sShapeUid, oGantt.getId());
		}

		if (oDatum){
			return oDatum;
		}

		// lookup row/shape data inside actual data model
		var rowData, shapeData;
		var sShapeDataName = Utility.getShapeDataNameByUid(sShapeUid);
		var bJSONTreeBinding = (oGantt._oTT.getBinding("rows").getMetadata().getName() === "sap.ui.model.json.JSONTreeBinding");
		var sRowChartScheme = Utility.getChartSchemeByShapeUid(sShapeUid);
		//consider all rows including invisible rows
		var aAllRowData = oGantt.getAllRowData();
		jQuery.each(aAllRowData, function (k, v) {
			var rowInfo = v;
			if (sRowChartScheme === "" || sRowChartScheme === rowInfo.chartScheme) {
				if (bJSONTreeBinding && rowInfo.data[sShapeDataName]) {
					for ( var i = 0; i < rowInfo.data[sShapeDataName].length; i++) {
						if (rowInfo.data[sShapeDataName][i].uid === sShapeUid) {
							rowData = rowInfo;
							shapeData = rowInfo.data[sShapeDataName][i];
							return false;
						}
					}
				}else if (rowInfo.data.uid === sShapeUid) {
					rowData = rowInfo;
					shapeData = rowInfo.data;
					return false;
				}
			}
		});

		if (sDatumType === DatumType.Shape) {
			return shapeData;
		}
		return rowData;
	};

	ShapeSelectionModel.prototype._getRowDatumForSelection = function(aIds, oTable) {
		var aRowIds = aIds ? aIds : [],
			aRowDatum = Utility.getRowDatumRefById(aRowIds, oTable.getParent().getId()),
			bMatched = aRowDatum.length === aRowIds.length;

		if (!bMatched) {
			// If not matched, possible reason is rowId is invalid or rows are in invisible area.
			// For invalid row id, do nothing, here only try to lookup datum in invisible area.
			var aInvisibleRowDatum = this._lookupInvisibleDatum(aRowIds, aRowDatum, DatumType.Row);
			aRowDatum = aRowDatum.concat(aInvisibleRowDatum);
		}
		return aRowDatum;
	};

	ShapeSelectionModel.prototype._getShapeDatumForSelection = function(aId) {
		var oGanttChart = this._getGanttChart();
		var aShapeId = aId ? aId : [];

		var aShapeDatum = Utility.getShapeDatumById(aShapeId, oGanttChart.getId()),
			bMatched = aShapeDatum.length === aShapeId.length;

		if (!bMatched) {
			var aInvisibleShapeDatum = this._lookupInvisibleDatum(aShapeId, aShapeDatum, DatumType.Shape);
			aShapeDatum = aShapeDatum.concat(aInvisibleShapeDatum);
		}
		return aShapeDatum;
	};

	/**
	 * Lookup datum from invisible area.
	 * 
	 * @param {array} aId a list of id to lookup
	 * @param {array} aFoundDatum visible datum
	 * @param {string} sLookupType Lookup type, row or shape
	 * @return {array} list of shape/row datum
	 * 
	 * @private
	 */
	ShapeSelectionModel.prototype._lookupInvisibleDatum = function(aId, aFoundDatum, sDatumType) {

		var aInvisibleId = this._getInvisibleIds(aId, aFoundDatum, sDatumType);

		var aDatum = [];
		if (aInvisibleId.length > 0) {
			// not found the row, invisible row?
			var oGanttChart = this._getGanttChart(),
			aShapeDataNames = oGanttChart.getShapeDataNames();
			var aAllRowData = oGanttChart.getAllRowData();

			var fnLookupShapeDatumInRow = function(oRowData, sShapeId) {
				var oResult = null;
				jQuery.each(aShapeDataNames, function(j, oShapeDataName) {
					var sShapeDataName;
					if (typeof oShapeDataName === "string") {
						sShapeDataName = oShapeDataName;
					} else {
						sShapeDataName = oShapeDataName.name;
					}
					var aShapeData = oRowData.data[sShapeDataName];
					if (aShapeData) {
						jQuery.each(aShapeData, function(k, oShapeDatum) {
							/* eslint-disable eqeqeq */
							if (oShapeDatum.__id__ == sShapeId) {
								 //it's possible that id is numeric but passing a string
							/* eslint-enable eqeqeq */
								oResult = oShapeDatum;
								return false;
							}
						});
						if (oResult) {
							return false;
						}
					}
				});
				return oResult;
			};

			var fnLookupDatumById = function(sId, sType) {
				var oResult = null;
				jQuery.each(aAllRowData, function (i, oRowData) {
					if (sType === DatumType.Shape) {
						oResult = fnLookupShapeDatumInRow(oRowData, sId);
						if (oResult) {
							return false;
						}
					} else {
						/* eslint-disable eqeqeq */
						if (oRowData.id == sId) {
						/* eslint-enable eqeqeq */
							oResult = oRowData;
							return false;
						}
					}
				});
				return oResult;
			};

			aDatum = aInvisibleId.map(function(sId){
				return fnLookupDatumById(sId, sDatumType);
			});
		}
		return aDatum;
	};

	ShapeSelectionModel.prototype._getInvisibleIds = function(aId, aFoundDatum, sDatumType) {
		var aFoundId = aFoundDatum.map(function(oDatum) { 
			//for shape, use the reference '__id__'
			if (sDatumType === DatumType.Shape) {
				return oDatum.__id__; 
			}
			return oDatum.id; 
		});

		return aId.filter(function(sId){
			return jQuery.inArray(sId, aFoundId) === -1;
		});
	};

	ShapeSelectionModel.prototype._getGanttChart = function() {
		return sap.ui.getCore().byId(this.getGanttChart());
	};

	return ShapeSelectionModel;
});
