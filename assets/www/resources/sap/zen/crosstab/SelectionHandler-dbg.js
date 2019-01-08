jQuery.sap.declare("sap.zen.crosstab.SelectionHandler");
jQuery.sap.require("sap.zen.crosstab.TouchHandler");
jQuery.sap.require("sap.zen.crosstab.rendering.CrossRequestManager");
jQuery.sap.require("sap.zen.crosstab.rendering.RenderingConstants");
jQuery.sap.require("sap.zen.crosstab.utils.Utils");
jQuery.sap.require("sap.zen.crosstab.keyboard.CrosstabKeyboardNavHandler");

sap.zen.crosstab.SelectionHandler = function (oCrosstab) {
	"use strict";

	var that = this;
	var oRenderEngine = oCrosstab.getRenderEngine();
	var oCrossRequestManager = oRenderEngine.getCrossRequestManager();
	var oDataArea = oCrosstab.getDataArea();
	var oRowHeaderArea = oCrosstab.getRowHeaderArea();
	var oColHeaderArea = oCrosstab.getColumnHeaderArea();
	var oDimensionHeaderArea = oCrosstab.getDimensionHeaderArea();

	var oClickedCells = {};
	var oSelection = null;

	var oCurrentlyHoveredCell = null;
	
	var bHoveringBlocked = false;
	
	this.blockSelectionHovering = function(bBlock) {
		bHoveringBlocked = bBlock;
		if (bHoveringBlocked && oCurrentlyHoveredCell) {
			this.removeSelection(oCurrentlyHoveredCell, true);
			oCurrentlyHoveredCell = null;
		}
	};

	this.removeAllSelections = function () {
		this.removeAllPreviousSelectionEffects();
		this.setSelection(null);
	};

	this.checkHeaderCellMerge = function (oHeaderCell1, oHeaderCell2) {
		var oArea1;
		var oArea2;
		
		if (oCrosstab.getPropertyBag().isRepeatTexts() === true) {
			return false;
		}

		if (!oHeaderCell1.isHeaderCell() || !oHeaderCell2.isHeaderCell()) {
			return false;
		}

		if (oHeaderCell1.getId() === oHeaderCell2.getId()) {
			return true;
		}
		
		if (oHeaderCell1.getMergeKey() === "" || oHeaderCell2.getMergeKey() === ""){
			return false;
		}

		if (oHeaderCell1.getMergeKey() !== oHeaderCell2.getMergeKey()) {
			return false;
		}

		if (oHeaderCell1.getDrillState() !== oHeaderCell2.getDrillState()) {
			return false;
		}

		oArea1 = oHeaderCell1.getArea();
		oArea2 = oHeaderCell2.getArea();

		if (oArea1.getAreaType() !== oArea2.getAreaType()) {
			return false;
		}

		if (oArea1.isRowHeaderArea()) {
			if (oHeaderCell1.getCol() !== oHeaderCell2.getCol()) {
				return false;
			}
		} else if (oArea1.isColHeaderArea()) {
			if (oHeaderCell1.getRow() !== oHeaderCell2.getRow()) {
				return false;
			}
		}

		return true;
	};

	this.provideSelectionForAllClickedCells = function () {
		$.each(oClickedCells, function (sCellId, oClickedCell) {
			that.selectCells(oClickedCell);
		});
	};

	this.mapClickedCellsToModel = function () {
		var oClickedCellFromModel = null;
		var oMappedClickedCells = {};
		var aCells = [];
		var i = 0;
		var oCell = null;

		$.each(oClickedCells, function (sCellId, oClickedCell) {
			oClickedCellFromModel = oClickedCell.getArea().getCell(oClickedCell.getRow(), oClickedCell.getCol());
			if (!oClickedCellFromModel) {
				if (oClickedCell.isHeaderCell()) {
					if (oClickedCell.getArea().isRowHeaderArea()) {
						oClickedCellFromModel = oClickedCell.getArea().getCellWithRowSpan(oClickedCell.getRow(),
								oClickedCell.getCol());
					} else if (oClickedCell.getArea().isColHeaderArea()) {
						oClickedCellFromModel = oClickedCell.getArea().getCellWithColSpan(oClickedCell.getRow(),
								oClickedCell.getCol());
					}
					if (oClickedCellFromModel) {
						if (that.checkHeaderCellMerge(oClickedCellFromModel, oClickedCell) === true) {
							oMappedClickedCells[oClickedCellFromModel.getId()] = oClickedCellFromModel;
						} else {
							// we have a header cell, but it does not merge with what we have found. row / col position
							// might have shifted due to hierarchy expand / collapse action, so go and search if that
							// cell is somewhere so we can map it
							if (oClickedCell.getArea().isRowHeaderArea()) {
								aCells = oClickedCell.getArea().getDataModel().getAllLoadedCellsByCol(
										oClickedCell.getArea(), oClickedCell.getCol());
							} else if (oClickedCell.getArea().isColHeaderArea()) {
								aCells = oClickedCell.getArea().getDataModel().getAllLoadedCellsByRow(
										oClickedCell.getArea, oClickedCell.getRow());
							}
							for (i = 0; i < aCells.length; i++) {
								oCell = aCells[i];
								if (oCell) {
									if (oCell.getMergeKey() === oClickedCell.getMergeKey()
											&& oCell.getText() === oClickedCell.getText()) {
										oMappedClickedCells[oCell.getId()] = oCell;
										break;
									}
								}
							}
						}
					}
				}
			} else {
				oMappedClickedCells[oClickedCellFromModel.getId()] = oClickedCellFromModel;
			}
		});
		oClickedCells = oMappedClickedCells;
	};

	this.addClickedCellsForSpannedHeaderCells = function () {
		var oArea = null;
		var oAddedHeaderCells = {};

		$.each(oClickedCells, function (sCellId, oClickedCell) {
			var oCells = null;
			if (oClickedCell.isHeaderCell()) {
				oArea = oClickedCell.getArea();
				if (oArea.isRowHeaderArea()) {
					oCells = oArea.getRenderedCellsByCol(oClickedCell.getCol());
					$.each(oCells, function (sId, oCell) {
						if (that.checkHeaderCellMerge(oCell, oClickedCell) === true) {
							oAddedHeaderCells[sId] = oCell;
						}
					});
				} else if (oArea.isColHeaderArea()) {
					oCells = oArea.getRenderedCellsByRow(oClickedCell.getRow());
					$.each(oCells, function (sId, oCell) {
						if (that.checkHeaderCellMerge(oCell, oClickedCell) === true) {
							oAddedHeaderCells[sId] = oCell;
						}
					});

				}
			}
		});
		$.extend(oClickedCells, oAddedHeaderCells);
	};
	
	this.extractClickedCellsFromSelection = function() {
		var sAxis = "";
		var oModelCell;
		var iRowOffset = 0;
		var aCoordArray = null;
		var oSelectionCell;
		var oArea;
		var iRow;
		var iCol;
		var oModelCell;

		if (oSelection) {
			sAxis = oSelection.axis;
			if (oSelection.bFromBackend === true) {
				var oHeaderInfo = oCrosstab.getHeaderInfo();
				if (oCrosstab.getNewLinesPos() === "TOP") {
					iRowOffset = oCrosstab.getNewLinesCnt();
				}
				for (var i = 0; i < oSelection.length; i++) {
					oSelectionCell = oSelection[i];
					if (sAxis === "ROWS") {
						oArea = oCrosstab.getRowHeaderArea();
						iRow = oSelectionCell.row + iRowOffset;
						iCol = oHeaderInfo.getColForAbsoluteCol(oSelectionCell.col);
					} else if (sAxis === "COLUMNS") {
						oArea = oCrosstab.getColumnHeaderArea();
						iRow = oHeaderInfo.getRowForAbsoluteRow(oSelectionCell.row) + iRowOffset;
						iCol = oSelectionCell.col;
					} else if (sAxis === "DATA") {
						oArea = oCrosstab.getDataArea();
						iRow = oSelectionCell.row + iRowOffset;
						iCol = oSelectionCell.col;
					}
					oModelCell = oArea.getCell(iRow, iCol);
					if (oModelCell) {
						oClickedCells[oModelCell.getId()] = oModelCell;
					}
				}
			} else {
				aCoordArray = oSelection[sAxis];
				if (aCoordArray) {
					for (var i = 0; i < aCoordArray.length; i++) {
						oSelectionCell = aCoordArray[i];
						if (sAxis === "ROW") {
							oArea = oCrosstab.getRowHeaderArea();
						} else if (sAxis === "COL") {
							oArea = oCrosstab.getColumnHeaderArea();
						} else if (sAxis === "DATA") {
							oArea = oCrosstab.getDataArea();
						}
						oModelCell = oArea.getCell(oSelectionCell.row, oSelectionCell.col);
						if (oModelCell) {
							oClickedCells[oModelCell.getId()] = oModelCell;
						}						
					}
				}
			}
		}
	};

	this.ensureCellsSelected = function () {
		oClickedCells = {};

		// selected data cells will be removed when planning gets activated
		if (oCrosstab.isPlanningMode() === true && oCrosstab.getSelectionMode() === "DATA") {
			oSelection = null;
		}

		if (oSelection) {
			this.extractClickedCellsFromSelection();
		}
		if (oClickedCells && Object.keys(oClickedCells).length > 0) {
			this.mapClickedCellsToModel();
			this.addClickedCellsForSpannedHeaderCells();
			this.provideSelectionForAllClickedCells();
		}
	};

	this.checkSingleCellClicked = function (oModelCell) {
		var bReturnValue = true;

		if (oClickedCells && (Object.keys(oClickedCells).length === 0)) {
			return false;
		}

		if (oClickedCells && (Object.keys(oClickedCells).length === 1) && oClickedCells[oModelCell.getId()]) {
			return true;
		}

		if (oModelCell.isHeaderCell() === true) {
			$.each(oClickedCells, function (sClickedCellId, oClickedCell) {
				if (!that.checkHeaderCellMerge(oModelCell, oClickedCell)) {
					bReturnValue = false;
					return false;
				}
			});
		} else {
			bReturnValue = false;
		}

		return bReturnValue;
	};

	this.checkCellIsAlreadyClicked = function (oModelCell) {
		var oCell = null;
		var bReturnValue = false;

		if (!oModelCell.isHeaderCell()) {
			oCell = oClickedCells[oModelCell.getId()];
			if (oCell) {
				return true;
			}
		} else {
			if ((Object.keys(oClickedCells).length === 1) && oClickedCells[oModelCell.getId()]) {
				return true;
			}
			$.each(oClickedCells, function (sClickedCellId, oClickedCell) {
				if (oCrosstab.getPropertyBag().isRepeatTexts() === true) {
					if (sClickedCellId === oModelCell.getId()) {
						bReturnValue = true;
						return false;
					}
				} else {
					if (that.checkHeaderCellMerge(oModelCell, oClickedCell) === true) {
						bReturnValue = true;
						return false;
					}
				}
			});
		}
		return bReturnValue;
	};

	this.translateClick = function (oModelCell) {
		var oNewCell = null;
		var oArea = oModelCell.getArea();
		var iCol = 0;
		var iNewCol = 0;
		var iRow = 0;
		var iNewRow = 0;
		var sDimName = "";
		var oHeaderInfo = oCrosstab.getHeaderInfo();

		oNewCell = oModelCell;

		if (oArea.isRowHeaderArea()) {
			if (oCrosstab.getPropertyBag().isRepeatTexts() === true) {
				if (oModelCell.getCol() > 0) {
					oNewCell = oArea.getCell(oModelCell.getRow(), 0);
				} else {
					oNewCell = oModelCell;
				}
			} else {
				iCol = oModelCell.getCol();
				sDimName = oHeaderInfo.getDimensionNameByCol(iCol);
				if (sDimName && sDimName.length > 0) {
					iNewCol = oHeaderInfo.getFirstColForDimension(sDimName);
					if (iNewCol >= 0 && iNewCol !== iCol) {
						oNewCell = oArea.getCell(oModelCell.getRow(), iNewCol);
					}
				}
			}
		} else if (oArea.isColHeaderArea()) {
			if (oCrosstab.getPropertyBag().isRepeatTexts() === true) {
				if (oModelCell.getRow() > 0) {
					oNewCell = oArea.getCell(0, oModelCell.getCol());
				} else {
					oNewCell = oModelCell;
				}
			} else {
				iRow = oModelCell.getRow();
				sDimName = oHeaderInfo.getDimensionNameByRow(iRow);
				if (sDimName && sDimName.length > 0) {
					iNewRow = oHeaderInfo.getFirstRowForDimension(sDimName);
					if (iNewRow >= 0 && iNewRow !== iRow) {
						oNewCell = oArea.getCell(iNewRow, oModelCell.getCol());
					}
				}
			}
		}

		return oNewCell;
	};

	this.checkSelectionAllowed = function (oModelCell) {
		var oArea = oModelCell.getArea();
		var iRow = 0;

		if (oArea.isDimHeaderArea()) {
			return false;
		}

		if (oCrosstab.isPlanningMode() === true) {
			// don't allow selection on new lines in planning
			if (oCrosstab.getNewLinesCnt() > 0) {
				iRow = oModelCell.getRow();
				if (oCrosstab.getNewLinesPos() === "TOP") {
					if (iRow < oCrosstab.getNewLinesCnt()) {
						return false;
					}
				} else {
					if (iRow > oModelCell.getArea().getRowCnt() - oCrosstab.getNewLinesCnt() - 1) {
						return false;
					}
				}
			}

			// no data cell selection during planning supported
			if (oCrosstab.getSelectionMode() === "DATA") {
				return false;
			}
		}

		if (oCrosstab.getSelectionMode() === "DATA") {
			if (oArea.isRowHeaderArea() || oArea.isColHeaderArea()) {
				return false;
			}
		} else {
			if (oArea.isDataArea()) {
				return false;
			}
		}

		if (oCrosstab.getSelectionSpace() === "ROW") {
			if (oArea.isColHeaderArea()) {
				return false;
			}
		} else if (oCrosstab.getSelectionSpace() === "COL") {
			if (oArea.isRowHeaderArea()) {
				return false;
			}
		}

		if (oCrosstab.getSelectionMode() === "SINGLE") {
			var iRow = 0;
			var iCol = 0;
			var sDimensionName = "";
			var iColDimensionCount = 0;
			var iRowDimensionCount = 0;
			var iAbsCol = 0;
			var iAbsRow = 0;
			var oHeaderInfo = oCrosstab.getHeaderInfo();

			if (oArea.isRowHeaderArea()) {
				return oHeaderInfo.isColOfInnermostDimension(oModelCell.getCol());
			} else if (oArea.isColHeaderArea()) {
				return oHeaderInfo.isRowOfInnermostDimension(oModelCell.getRow());
			}
		}
		return true;
	};
	
	this.registerCtrlKeyUpListener = function() {
		if (oCrosstab.getPropertyBag().isFireOnSelectedOnlyOnce() === true) {
			if (!document.oSapCrosstabOnSelectHandlerReg) {
				document.oSapCrosstabOnSelectHandlerReg = {};
			}
			document.oSapCrosstabOnSelectHandlerReg[oCrosstab.getId()] = {"me": this, "fOnSelect": this.sendOnSelectCommand};
			if (!document.fSapCrosstabOnKeyUpHandler) {

				document.fSapCrosstabOnKeyUpHandler = function (e) {
					if (e.which === 17) {
						$(document).off("keyup");
						document.fSapCrosstabOnKeyUpHandler = null;

						$.each(document.oSapCrosstabOnSelectHandlerReg, function (sId, oHandlerInfo) {
							oHandlerInfo.fOnSelect.apply(oHandlerInfo.me);
						});

						document.oSapCrosstabOnSelectHandlerReg = null;
						sap.zen.crosstab.utils.Utils.cancelEvent(e);
						sap.zen.crosstab.utils.Utils.stopEventPropagation(e);
					}
				}

				$(document).on("keyup", document.fSapCrosstabOnKeyUpHandler);
			}
		}
	};
	
	this.postSelectionToServer = function(oCellsForSelectionState) {
		var bAmIRegisteredForSingleOnSelectEvent = document.oSapCrosstabOnSelectHandlerReg && document.oSapCrosstabOnSelectHandlerReg[oCrosstab.getId()];
		if (!oCrosstab.getPropertyBag().isFireOnSelectedOnlyOnce() || (oCrosstab.getPropertyBag().isFireOnSelectedOnlyOnce() === true && !bAmIRegisteredForSingleOnSelectEvent)) {
			that.sendOnSelectCommand(oCellsForSelectionState);
		}
	};

	this.handleCellClick = function (oModelCell, sFlag) {
		if (!this.checkSelectionAllowed(oModelCell)) {
			this.removeAllSelections();
			this.sendJson("{}");
			return;
		}

		if (oCurrentlyHoveredCell) {
			that.removeSelection(oCurrentlyHoveredCell, true);
			oCurrentlyHoveredCell = null;
		}

		// translate
		oModelCell = this.translateClick(oModelCell);

		if (!sFlag || sFlag === "SHIFT") {
			if (this.checkSingleCellClicked(oModelCell) === true) {
				// if the clicked cell is already selected & is the only selected cell it needs to be deselected
				this.removeSelection(oModelCell);
				return;
			} else {
				// for now, handle SHIFT as a new selection because of issues with text selection even with prevent
				// default
				this.startNewSelection(oModelCell);
			}
		} else if (sFlag === "CTRL") {
			this.registerCtrlKeyUpListener();
			if (this.checkCellIsAlreadyClicked(oModelCell) === true) {
				// already selected cell needs to be deselected
				this.removeSelection(oModelCell);
				return;
			} else {
				var isPossible = this.checkMultiselectPossible(oModelCell);
				if (isPossible) {
					// add to selection
					oClickedCells[oModelCell.getId()] = oModelCell;
				} else {
					// start new selection
					this.startNewSelection(oModelCell);
				}
			}
		}
		this.selectCells(oModelCell);
		this.updateSelectionState();
	};
	
	this.getCellsForSelectionState = function() {
		var oConsolidatedClickedCells = {};
		var oCells = {};
		var oCell;
		var sAxis = "";
		var oTranslatedCoord = null;
		
		oConsolidatedClickedCells = this.consolidateClickedCells();
		
		$.each(oConsolidatedClickedCells, function (sId, oClickedCell) {
			oTranslatedCoord = oCrosstab.getUtils().translateCellCoordinatesForBackend(oClickedCell);
			sAxis = oTranslatedCoord.axisName;
			oCell = {};
			if (!oCells[sAxis]) {
				oCells[sAxis] = [];
			}
			oCell["row"] = oTranslatedCoord.row;
			oCell["col"] = oTranslatedCoord.col;
			oCells[sAxis].push(oCell);
		});
		
		return {"axis" : sAxis, "oCells" : oCells};
	};

	this.sendOnSelectCommand = function (oCellsForSelectionState) {
		var oCells;
		if (oCrosstab.getOnSelectCommand()) {
			if (oCellsForSelectionState) {
				oCells = oCellsForSelectionState.oCells;
			} else {
				oCells = this.getCellsForSelectionState().oCells;
			}
			var sResultJSON = JSON.stringify(oCells);
			that.sendJson(sResultJSON);
		}
	};

	this.sendJson = function (sJson) {
		var sCommand = oCrosstab.getOnSelectCommand();
		if (sCommand) {
			var find = '"';
			var re = new RegExp(find, 'g');
			var sResultJSON = sJson.replace(re, "\\\"");

			sCommand = sCommand.replace("__CELLS__", sResultJSON);

			oCrosstab.getUtils().executeCommandAction(sCommand);
		}
	};

	this.consolidateClickedCells = function () {
		var oRowCells = {};
		var oColCells = {};
		var oOtherCells = {};
		var sAxis = "";
		var sKey = "";
		
		if (oCrosstab.getPropertyBag().isRepeatTexts() === true) {
			return oClickedCells;
		}

		$.each(oClickedCells, function (sId, oCell) {
			sAxis = oCell.getArea().getAxisName();
			if (sAxis === sap.zen.crosstab.rendering.RenderingConstants.ROW_AXIS) {
				sKey = oCell.getText() + " " + oCell.getMergeKey() + " " + oCell.getCol();
				if (!oRowCells[sKey]) {
					oRowCells[sKey] = oCell;
				}
			} else if (sAxis === sap.zen.crosstab.rendering.RenderingConstants.COL_AXIS) {
				sKey = oCell.getText() + " " + oCell.getMergeKey() + " " + oCell.getRow();
				if (!oColCells[sKey]) {
					oColCells[sKey] = oCell;
				}
			} else {
				oOtherCells[sId] = oCell;
			}
		});

		return $.extend(oRowCells, oColCells, oOtherCells);
	};

	this.selectCells = function (oModelCell, bHoverMode) {
		var oSelectedCells = this.getSelectedCells(oModelCell);

		$.each(oSelectedCells, function (sCellId, oCell) {
			var oArea = oCell.getArea();
			if (oArea.isRowHeaderArea()) {
				that.selectRowHeaderCell(oCell, bHoverMode);
			} else if (oArea.isColHeaderArea()) {
				that.selectColHeaderCell(oCell, bHoverMode);
			} else if (oArea.isDataArea()) {
				that.selectDataCell(oCell, bHoverMode);
			}
		});
	};

	this.getSelectedCells = function (oModelCell, bRemoveSelection) {
		var oArea = oModelCell.getArea();
		var oResult = {}

		if (oArea.isRowHeaderArea() || oArea.isColHeaderArea()) {
			var oSelectedHeaderCells = oArea.getSelectedCellsBySelectionCoordinates(oModelCell.getRow(), oModelCell
					.getCol());
			var oSelectedDataCells = oCrosstab.getDataArea().getSelectedCellsByHeaderSelection(oModelCell,
					bRemoveSelection);
			oResult = $.extend({}, oSelectedHeaderCells, oSelectedDataCells);
		} else if (oArea.isDataArea()) {
			var oSelectedDataCells = {};
			oSelectedDataCells[oModelCell.getId()] = oModelCell;
			var oSelectedRowHeaderCells = oCrosstab.getRowHeaderArea().getSelectedCellsByDataSelection(oModelCell);
			var oSelectedColHeaderCells = oCrosstab.getColumnHeaderArea().getSelectedCellsByDataSelection(oModelCell);
			oResult = $.extend({}, oSelectedDataCells, oSelectedRowHeaderCells, oSelectedColHeaderCells);
		}

		return oResult;
	};

	this.checkMultiselectPossible = function (oModelCell) {
		var oArea = oModelCell.getArea();
		var bResult = true;
		var sParentCellId = "";
		var oParentCell = null;
		var iCnt = 0;
		var oFixedParentCell = null;

		if (oCrosstab.getSelectionMode() === "DATA" || oCrosstab.getSelectionMode() === "SINGLE") {
			return false;
		}
		
		if (oCrosstab.getPropertyBag().isRepeatTexts() === true) {
			return true;
		}

		if (oArea.isRowHeaderArea()) {
			oFixedParentCell = oArea.getDataModel().getCellWithSpan(oModelCell.getRow(), Math.max(oModelCell.getCol() - 1, 0))
		} else if (oArea.isColHeaderArea()) {
			oFixedParentCell = oArea.getDataModel().getCellWithSpan(Math.max(oModelCell.getRow() - 1, 0), oModelCell.getCol())
		}

		sParentCellId = oFixedParentCell.getId();
		
		$.each(oClickedCells,
				function (sCellId, oCell) {
					if (oCell.getArea().getAreaType() !== oArea.getAreaType()) {
						bResult = false;
						return false; // jump out of loop by returning false
					}
					if (oArea.isRowHeaderArea()) {
						if (oModelCell.getCol() !== oCell.getCol()) {
							bResult = false;
							return false;
						}
						if (oModelCell.getCol() !== 0) {
							oParentCell = oArea.getDataModel().getCellWithSpan(oCell.getRow(), Math.max(oCell.getCol() - 1, 0));
							if (sParentCellId !== oParentCell.getId()) {
								bResult = false;
								return false;
							}
						}
					} else if (oArea.isColHeaderArea()) {
						if (oModelCell.getRow() !== oCell.getRow()) {
							bResult = false;
							return false;
						}
						if (oModelCell.getRow() !== 0) {
							oParentCell = oArea.getDataModel().getCellWithSpan(Math.max(oCell.getRow() - 1, 0), oCell.getCol());
							if (sParentCellId !== oParentCell.getId()) {
								bResult = false;
								return false;
							}
						}
					} else if (oArea.isDataArea()) {
						bResult = false;
						return false;
					}
				});

		return bResult;
	};

	this.startNewSelection = function (oModelCell) {
		this.removeAllPreviousSelectionEffects();
		oSelection = null;
		oClickedCells = {};
		oClickedCells[oModelCell.getId()] = oModelCell;
	};
	
	this.updateSelectionState = function() {
		var oCellsForSelectionState = this.getCellsForSelectionState();
		that.postSelectionToServer(oCellsForSelectionState);
		oSelection = oCellsForSelectionState.oCells;
		oSelection.axis = oCellsForSelectionState.axis;
	};

	this.removeSelection = function (oModelCell, bHoverMode) {
		var oCellsToBeRemoved = {};
		oCellsToBeRemoved[oModelCell.getId()] = oModelCell;

		if (oModelCell.isHeaderCell() === true) {
			$.each(oClickedCells, function (sClickedCellId, oClickedCell) {
				if (oClickedCell.isHeaderCell() === true) {
					if (that.checkHeaderCellMerge(oClickedCell, oModelCell) === true) {
						oCellsToBeRemoved[sClickedCellId] = oClickedCell;
					}
				}
			});
		}

		$.each(oCellsToBeRemoved, function (sRemoveCellId, oRemoveCell) {
			if (!bHoverMode) {
				delete oClickedCells[sRemoveCellId];
			}
			that.removePreviousSelectionEffectsForCell(oRemoveCell, bHoverMode);
		});

		if (!bHoverMode) {
			this.updateSelectionState();
		}
	};

	this.removeAllPreviousSelectionEffects = function () {
		$.each(oClickedCells, function (key, value) {
			that.removePreviousSelectionEffectsForCell(value, false);
		});
	};

	this.removePreviousSelectionEffectsForCell = function (oModelCell, bHoverMode) {
		var oSelectedCells = this.getSelectedCells(oModelCell, true);
		$.each(oSelectedCells, function (sCellId, oCell) {
			var oArea = oCell.getArea();
			if (oArea.isRowHeaderArea()) {
				that.deselectRowHeaderCell(oCell, bHoverMode);
			} else if (oArea.isColHeaderArea()) {
				that.deselectColHeaderCell(oCell, bHoverMode);
			} else if (oArea.isDataArea()) {
				that.deselectDataCell(oCell, bHoverMode);
			}
		});
	};

	this.selectRowHeaderCell = function (oModelCell, bHoverMode) {
		var sClassName = null;
		if (bHoverMode === true) {
			sClassName = "sapzencrosstab-HeaderCellHoverRow";
		} else {
			// Set style for future renderings of the cell, e.g. after scrolling
			oModelCell.addStyle('SelectRow');
			sClassName = "sapzencrosstab-HeaderCellSelectRow";
		}

		// Set style for the currently rendered cell
		var oDomCell = ($(document.getElementById(oModelCell.getId())));
		oDomCell.addClass(sClassName);
	};

	this.deselectRowHeaderCell = function (oModelCell, bHoverMode) {
		var sClassName = null;
		if (bHoverMode === true) {
			sClassName = "sapzencrosstab-HeaderCellHoverRow";
		} else {
			oModelCell.removeStyle('SelectRow');
			sClassName = "sapzencrosstab-HeaderCellSelectRow";
		}

		var oDomCell = ($(document.getElementById(oModelCell.getId())));
		oDomCell.removeClass(sClassName);
	};

	this.selectColHeaderCell = function (oModelCell, bHoverMode) {
		var sClassName = null;
		if (bHoverMode === true) {
			sClassName = "sapzencrosstab-HeaderCellHoverCol";
		} else {
			// Set style for future renderings of the cell, e.g. after scrolling
			oModelCell.addStyle('SelectCol');
			sClassName = "sapzencrosstab-HeaderCellSelectCol";
		}

		// Set style for the currently rendered cell
		var oDomCell = ($(document.getElementById(oModelCell.getId())));
		oDomCell.addClass(sClassName);
	};

	this.deselectColHeaderCell = function (oModelCell, bHoverMode) {
		var sClassName = null;
		if (bHoverMode === true) {
			sClassName = "sapzencrosstab-HeaderCellHoverCol";
		} else {
			oModelCell.removeStyle('SelectCol');
			sClassName = "sapzencrosstab-HeaderCellSelectCol";
		}

		var oDomCell = ($(document.getElementById(oModelCell.getId())));
		oDomCell.removeClass(sClassName);
	};

	this.selectDataCell = function (oModelCell, bHoverMode) {
		var sClassName = null;
		if (bHoverMode === true) {
			sClassName = "sapzencrosstab-HoverDataCell";
		} else {
			// Set style for future renderings of the cell, e.g. after scrolling
			oModelCell.addStyle('SelectData');
			sClassName = "sapzencrosstab-DataCellSelectData";
		}

		// Set style for the currently rendered cell
		var oDomCell = ($(document.getElementById(oModelCell.getId())));
		oDomCell.addClass(sClassName);
	};

	this.deselectDataCell = function (oModelCell, bHoverMode) {
		var sClassName = null;
		if (bHoverMode === true) {
			sClassName = "sapzencrosstab-HoverDataCell";
		} else {
			oModelCell.removeStyle('SelectData');
			sClassName = "sapzencrosstab-DataCellSelectData";
		}

		var oDomCell = ($(document.getElementById(oModelCell.getId())));
		oDomCell.removeClass(sClassName);
	};

	this.setSelection = function (poSelection) {
		oClickedCells = {};
		oSelection = poSelection;
		if (oSelection) {
			oSelection.bFromBackend = true;
		}
	};
	
	this.hasSelection = function() {
		return sap.zen.crosstab.utils.Utils.getSizeOf(oClickedCells) > 0;
	};

	this.handleCellHoverEntry = function (oModelCell) {
		if (bHoveringBlocked) {
			return;
		}
		// Only hover over cells that can basically be selected as well
		if (!this.checkSelectionAllowed(oModelCell)) {
			if (oCurrentlyHoveredCell) {
				that.removeSelection(oCurrentlyHoveredCell, true);
				oCurrentlyHoveredCell = null;
			}
			return;
		}
		// translate
		oModelCell = this.translateClick(oModelCell);

		if (oCurrentlyHoveredCell && (oModelCell !== oCurrentlyHoveredCell)) {
			that.removeSelection(oCurrentlyHoveredCell, true);
			oCurrentlyHoveredCell = null;
		}

		if (!oCurrentlyHoveredCell) {
			if (!oModelCell || oModelCell === undefined || oModelCell.hasStyle("SelectCol") || oModelCell.hasStyle("SelectData")
					|| oModelCell.hasStyle("SelectRow")) {
				return;
			}
			oCurrentlyHoveredCell = oModelCell;
			that.selectCells(oModelCell, true);
		}
	};

	this.handleCellHoverOut = function (e) {
		if (oCurrentlyHoveredCell) {
			var oDomMoveTarget = e.toElement || e.relatedTarget;
			var oDomMoveSrc = e.target;
			var oFoundCell = null;
			var oCell = sap.ui.getCore().getControl(e.target.id);
			var oDomCell = null;
			var bRemoveHoverEffect = false;

			if (oCell) {
				if (oCell === oCurrentlyHoveredCell) {
					oFoundCell = $(oDomMoveSrc).find($(oDomMoveTarget));
					if (!(oFoundCell && oFoundCell.length > 0)) {
						bRemoveHoverEffect = true;
					}
				}
			} else {
				// we don't have a selectable (i. e. hoverable) cell directly.
				// See if it is something that is
				// a) starts contained in the currently hovered cell
				// b) and is moving out of the currently hovered cell
				oDomCell = $(document.getElementById(oCurrentlyHoveredCell.getId()));
				oFoundCell = oDomCell.find($(oDomMoveSrc));
				if (oFoundCell && oFoundCell.length > 0) {
					// check target
					oFoundCell = oDomCell.find($(oDomMoveTarget));
					if (!(oFoundCell && oFoundCell.length > 0)) {
						bRemoveHoverEffect = true;
					}
				}
			}
			if (bRemoveHoverEffect === true) {
				that.removeSelection(oCurrentlyHoveredCell, true);
				oCurrentlyHoveredCell = null;
			}
		}
	};

};