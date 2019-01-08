jQuery.sap.declare("sap.zen.crosstab.datahandler.JsonDataHandler");
jQuery.sap.require("sap.zen.crosstab.TextConstants");
jQuery.sap.require("sap.zen.crosstab.utils.Utils");
jQuery.sap.require("sap.zen.crosstab.rendering.RenderingConstants");
jQuery.sap.require("sap.zen.crosstab.CrosstabCellApi");

sap.zen.crosstab.datahandler.JsonDataHandler = function (oCrosstab) {

	var oDimensionHeaderArea = oCrosstab.getDimensionHeaderArea();
	var oColHeaderArea = oCrosstab.getColumnHeaderArea();
	var oRowHeaderArea = oCrosstab.getRowHeaderArea();
	var oDataArea = oCrosstab.getDataArea();

	var iFixedColHeaders = 0;
	var iFixedRowHeaders = 0;
	var iTotalDataColumns = 0;
	var iTotalDataRows = 0;

	var bFillDimensionHeaderArea = false;
	var bFillRowHeaderArea = false;
	var bFillColHeaderArea = false;

	var oJsonTableControl = null;
	var oCrosstabAreasToBeFilled = null;
	var iColOffset = 0;
	var iRowOffset = 0;

	var oColHeaderHierarchyLevels = {};
	var oRowHeaderHierarchyLevels = {};
	
	function createDefaultCrosstabTextCache () {
		if (!sap.zen.CrosstabTextCache) {
			sap.zen.CrosstabTextCache = {};
			sap.zen.CrosstabTextCache.filled = false;
			sap.zen.CrosstabTextCache.oTexts = {};
			sap.zen.CrosstabTextCache.oSortingTextLookupTable = {};
			sap.zen.CrosstabTextCache.defaultProvided = false;
		}
		var oPropertyBag = oCrosstab.getPropertyBag();
		// The texts are only sent once when the Crosstab is initialized. Therefore, this fallback
		// is only necessary if the texts have never before been set
		oPropertyBag.addText(sap.zen.crosstab.TextConstants.ROW_TEXT_KEY, "Row");
		oPropertyBag.addText(sap.zen.crosstab.TextConstants.COL_TEXT_KEY, "Column");
		oPropertyBag.addText(sap.zen.crosstab.TextConstants.COLWIDTH_ADJUST_TEXT_KEY,
				"Double Click to adjust Column Width");
		oPropertyBag.addText(sap.zen.crosstab.TextConstants.MOBILE_MENUITEM_COLWIDTH_ADJUST_TEXT_KEY,
				"Adjust Column Width");
		oPropertyBag.addText(sap.zen.crosstab.TextConstants.MEASURE_STRUCTURE_TEXT_KEY, "Measure Structure");

		provideDefaultSortingTexts(oPropertyBag);
		sap.zen.CrosstabTextCache.defaultProvided = true;
	}

	function readTranslatedTexts (oTexts) {
		if (sap.zen.CrosstabTextCache.filled === false) {
			var oPropertyBag = oCrosstab.getPropertyBag();
			if (oTexts) {
				oPropertyBag.addText(sap.zen.crosstab.TextConstants.ROW_TEXT_KEY, oTexts.rowtext || "Row");
				oPropertyBag.addText(sap.zen.crosstab.TextConstants.COL_TEXT_KEY, oTexts.coltext || "Column");
				oPropertyBag.addText(sap.zen.crosstab.TextConstants.COLWIDTH_ADJUST_TEXT_KEY, oTexts.colwidthtext
						|| "Double Click to adjust Column Width");
				oPropertyBag.addText(sap.zen.crosstab.TextConstants.MOBILE_MENUITEM_COLWIDTH_ADJUST_TEXT_KEY,
						oTexts.mobilemenuitemcolwidthtext || "Adjust Column Width");
				
				oPropertyBag.addText(sap.zen.crosstab.TextConstants.MEASURE_STRUCTURE_TEXT_KEY, oTexts.measurestructtext || "Measure Structure");

				extractSortingTexts(oTexts, oPropertyBag);
			}
			sap.zen.CrosstabTextCache.filled = true;
		}
	}

	function provideDefaultSortingTexts (oPropertyBag) {
		var oSortingLookup = {};
		oSortingLookup.alttext = "Unsorted. Select to sort ascending";
		oSortingLookup.tooltipidx = 0;
		oPropertyBag.addSortingTextLookup("0", oSortingLookup);

		oSortingLookup = {};
		oSortingLookup.alttext = "Sorted ascending. Select to sort descending";
		oSortingLookup.tooltipidx = 1;
		oPropertyBag.addSortingTextLookup("1", oSortingLookup);

		oSortingLookup = {};
		oSortingLookup.alttext = "Sorted descending. Select to sort ascending";
		oSortingLookup.tooltipidx = 2;
		oPropertyBag.addSortingTextLookup("2", oSortingLookup);
	}

	function extractSortingTexts (oTexts, oPropertyBag) {
		var oSortingTextList = oTexts.sorting;
		if (!oSortingTextList) {
			provideDefaultSortingTexts(oPropertyBag);
		} else {
			var i = 0;
			var iListLength = parseInt(oSortingTextList.length, 10);
			for (i = 0; i < iListLength; i++) {
				var oSortingLookup = {};
				oSortingLookup.alttext = oSortingTextList[i].alttext;
				oSortingLookup.tooltipidx = oSortingTextList[i].tooltipidx;
				oPropertyBag.addSortingTextLookup(i + "", oSortingLookup);
			}
		}
	}
	
	this.determineBasicAreaData = function (oCrosstabData, bIsFirstPage) {
		if (!sap.zen.CrosstabTextCache || (sap.zen.CrosstabTextCache && !sap.zen.CrosstabTextCache.defaultProvided)) {
			createDefaultCrosstabTextCache();
		}

		oJsonTableControl = oCrosstabData;
		
		if (oJsonTableControl.rootcause && oJsonTableControl.rootcause === "bookmark") {
			oCrosstab.getPropertyBag().setBookmarkProcessing(true);
		} 

		if (!oJsonTableControl.rows) {
			handleMsgInTable(oJsonTableControl);
			removeSelections();
			oCrosstab.setHasData(false);
		} else {
			oCrosstab.setHasData(true);
			if (bIsFirstPage || oJsonTableControl.changed) {			
				readTranslatedTexts(oJsonTableControl.texts);

				oColHeaderHierarchyLevels = {};
				oRowHeaderHierarchyLevels = {};

				iFixedColHeaders = oJsonTableControl.fixedcolheaders;
				iFixedRowHeaders = oJsonTableControl.fixedrowheaders;

				if (!oJsonTableControl.pixelscrolling) {
					oCrosstab.setHCutOff(false);
					oCrosstab.setVCutOff(false);

					iTotalDataColumns = oJsonTableControl.totaldatacols;
					iTotalDataRows = oJsonTableControl.totaldatarows;
				} else {
					oCrosstab.setHCutOff(oJsonTableControl.totaldatacols > oJsonTableControl.sentdatacols);
					oCrosstab.setVCutOff(oJsonTableControl.totaldatarows > oJsonTableControl.sentdatarows);

					iTotalDataColumns = oJsonTableControl.sentdatacols;
					iTotalDataRows = oJsonTableControl.sentdatarows;
				}

				if (!iFixedColHeaders || !iFixedRowHeaders) {
					oDimensionHeaderArea.setRowCnt(0);
					oDimensionHeaderArea.setColCnt(0);
					if (!iFixedRowHeaders) {
						oRowHeaderArea.setRowCnt(0);
						oRowHeaderArea.setColCnt(0);
						if (iFixedColHeaders) {
							oColHeaderArea.setRowCnt(iFixedColHeaders);
							oColHeaderArea.setColCnt(iTotalDataColumns);
						}
					} else if (!iFixedColHeaders) {
						oColHeaderArea.setRowCnt(0);
						oColHeaderArea.setColCnt(0);
						if (iFixedRowHeaders) {
							oRowHeaderArea.setRowCnt(iTotalDataRows);
							oRowHeaderArea.setColCnt(iFixedRowHeaders);
						}
					}
				} else {
					oDimensionHeaderArea.setRowCnt(iFixedColHeaders);
					oDimensionHeaderArea.setColCnt(iFixedRowHeaders);

					oRowHeaderArea.setRowCnt(iTotalDataRows);
					oRowHeaderArea.setColCnt(iFixedRowHeaders);

					oColHeaderArea.setRowCnt(iFixedColHeaders);
					oColHeaderArea.setColCnt(iTotalDataColumns);
				}

				oDataArea.setRowCnt(iTotalDataRows);
				oDataArea.setColCnt(iTotalDataColumns);

				oCrosstab.setTotalRows(iFixedColHeaders + iTotalDataRows);
				oCrosstab.setTotalCols(iFixedRowHeaders + iTotalDataColumns);

				oCrosstab.setOnSelectCommand(oJsonTableControl.onselectcommand);
				oCrosstab.getPropertyBag().setDisplayExceptions(oJsonTableControl.displayexceptions);
				oCrosstab.getPropertyBag().setEnableColResize(oJsonTableControl.enablecolresize);

				oCrosstab.setScrollNotifyCommand(oJsonTableControl.scrollnotifier);
				
				oCrosstab.setUpdateColWidthCommand(oJsonTableControl.updatecolwidthcmd);

				// for this to work, the basic area data must have been determined already, plus the selection info
				// must have been determined. Don't move this line further up
				setUserColWidthsToAreas(oCrosstabData);

				var oCellApi = new sap.zen.crosstab.CrosstabCellApi(oCrosstab, iFixedRowHeaders, iFixedColHeaders,
						iTotalDataColumns, iTotalDataRows);
				oCrosstab.setCellApi(oCellApi);
			}
			extractCrossRequestInfo();
			// planning
			if (!(oCrosstab.getPropertyBag().isMobileMode() || oCrosstab.getPropertyBag().isTestMobileMode())) {
				if (oJsonTableControl.transferdatacommand) {
					oCrosstab.setTransferDataCommand(oJsonTableControl.transferdatacommand);
				} else {
					oCrosstab.setTransferDataCommand(null);
				}
				if (oJsonTableControl.callvaluehelpcommand) {
					oCrosstab.setCallValueHelpCommand(oJsonTableControl.callvaluehelpcommand);
				}
				if (oJsonTableControl.newlinescnt) {
					oCrosstab.setNewLinesCnt(oJsonTableControl.newlinescnt);
				}
				if (oJsonTableControl.newlinespos) {
					oCrosstab.setNewLinesPos(oJsonTableControl.newlinespos);
				}
			}

			if (oJsonTableControl.contextmenucmd) {
				oCrosstab.getPropertyBag().setContextMenuCommand(oJsonTableControl.contextmenucmd);
				oCrosstab.createContextMenu();
			}
			
			// header width stuff
			if (oJsonTableControl.headerscrolling && oJsonTableControl.headerscrolling == true) {
				oCrosstab.setHeaderScrollingConfigured(true);
				
				if (oJsonTableControl.userheaderresize) {
					oCrosstab.setUserHeaderResizeAllowed(oJsonTableControl.userheaderresize);
				}
				if (oJsonTableControl.userheaderwidthcommand) {
					oCrosstab.setUserHeaderWidthCommand(oJsonTableControl.userheaderwidthcommand);
				}
				if (oJsonTableControl.headerwidth) {
					oCrosstab.getPropertyBag().setMaxHeaderWidth(oJsonTableControl.headerwidth);
				} else {
					oCrosstab.getPropertyBag().setMaxHeaderWidth(0);
				}

				if (oJsonTableControl.headerwidthcurrent) {
					oCrosstab.getPropertyBag().setUserHeaderWidth(oJsonTableControl.headerwidthcurrent);
				} else {
					oCrosstab.getPropertyBag().setUserHeaderWidth(0);
				}
			} else {
				oCrosstab.setHeaderScrollingConfigured(false);
				oCrosstab.setUserHeaderResizeAllowed(false);
				oCrosstab.setUserHeaderWidthCommand(null);
				oCrosstab.getPropertyBag().setMaxHeaderWidth(0);
				oCrosstab.getPropertyBag().setUserHeaderWidth(0);
			}
			
			// selection handling
			if(oJsonTableControl.selectionmode) {			
				oCrosstab.setSelectionProperties(oJsonTableControl.selectionmode, oJsonTableControl.selectionspace, oJsonTableControl.disablehovering, oJsonTableControl.singleonselectevent);
			}
			
			var oSelectionHandler = oCrosstab.getSelectionHandler();
			if (oSelectionHandler) {
				oSelectionHandler.setSelection(oJsonTableControl.selection);
			}
			
			if (oJsonTableControl.headerinfo) {
				oCrosstab.initHeaderInfo(oJsonTableControl.headerinfo);
			}
			
			if (oJsonTableControl.repeattxt && oJsonTableControl.repeattxt === true) {
				oCrosstab.getPropertyBag().setRepeatTexts(true);
			} else {
				oCrosstab.getPropertyBag().setRepeatTexts(false);
			}
			
			// DragDrop handling
			if (oJsonTableControl.dragdropcommands) {
				oCrosstab.getPropertyBag().setDragDropEnabled(true);
				oCrosstab.setDragDropCommands(oJsonTableControl.dragdropcommands);
			} else {
				oCrosstab.getPropertyBag().setDragDropEnabled(false);
			}
			
			// Zebra
			if (oJsonTableControl.zebra) {
				oCrosstab.getPropertyBag().setZebraMode(oJsonTableControl.zebra);
			} else {
				oCrosstab.getPropertyBag().setZebraMode(sap.zen.crosstab.rendering.RenderingConstants.ZEBRA_FULL);
			}
		}
			
	};

	function setUserColWidthsToAreas (oCrosstabData) {
		var widthList = oCrosstabData.usercolwidths;
		if (widthList) {
			for (var i = 0; i < widthList.length; i++) {
				var entry = widthList[i];
				var colIndex = entry.colid;
				if (isNaN(entry.colwidth)) {
					continue;
				}
				var iColWidth = Math.max(0, parseInt(entry.colwidth, 10));
				var bIgnore = false;
				if (entry.ignore !== undefined) {
					bIgnore = entry.ignore;
				}
				if (colIndex === '*') {
					if (iFixedColHeaders && iFixedRowHeaders) {
						oColHeaderArea.setColUserWidth(colIndex, iColWidth, bIgnore);
						oDataArea.setColUserWidth(colIndex, iColWidth, bIgnore);
						oDimensionHeaderArea.setColUserWidth(colIndex, iColWidth, bIgnore);
						oRowHeaderArea.setColUserWidth(colIndex, iColWidth, bIgnore);
					} else {
						if (!iFixedRowHeaders) {
							oColHeaderArea.setColUserWidth(colIndex, iColWidth, bIgnore);
						} else if (!iFixedColHeaders) {
							oRowHeaderArea.setColUserWidth(colIndex, iColWidth, bIgnore);
						}
						oDataArea.setColUserWidth(colIndex, iColWidth, bIgnore);
					}
				} else {
					if (iFixedColHeaders && iFixedRowHeaders) {
						// all areas present
						if (colIndex >= iFixedRowHeaders) {
							// column header and data area
							oColHeaderArea.setColUserWidth(colIndex - iFixedRowHeaders, iColWidth, bIgnore);
							oDataArea.setColUserWidth(colIndex - iFixedRowHeaders, iColWidth, bIgnore);
						} else {
							// dimension header and row header area
							oDimensionHeaderArea.setColUserWidth(colIndex, iColWidth, bIgnore);
							oRowHeaderArea.setColUserWidth(colIndex, iColWidth, bIgnore);
						}
					} else {
						// we don't have a dimension header area. So either row header or col header is missing
						if (!iFixedRowHeaders) {
							// row header missing. Index goes directly to col header area and data area
							oColHeaderArea.setColUserWidth(colIndex, iColWidth, bIgnore);
							oDataArea.setColUserWidth(colIndex, iColWidth, bIgnore);
						} else if (!iFixedColHeaders) {
							// only row header and data area, so find out what to use
							if (colIndex >= iFixedRowHeaders) {
								oDataArea.setColUserWidth(colIndex - iFixedRowHeaders, iColWidth, bIgnore);
							} else {
								oRowHeaderArea.setColUserWidth(colIndex, iColWidth, bIgnore);
							}
						}
					}
				}
			}
		}
	}

	function extractCrossRequestInfo () {
		var oCrossRequestManager = oCrosstab.getRenderEngine().getCrossRequestManager();
		
		if (oCrossRequestManager) {
			// set scroll parameters that come from the server if any
			if (oJsonTableControl.clienthpos !== undefined && oJsonTableControl.clientvpos !== undefined
					&& oJsonTableControl.clienthscrolledtoend !== undefined
					&& oJsonTableControl.clientvscrolledtoend !== undefined) {
				// plausibility check
				if (oJsonTableControl.clienthscrolledtoend === true) {
					oJsonTableControl.clienthpos = oJsonTableControl.totaldatacols - 1;
				}
				if (oJsonTableControl.clientvscrolledtoend === true) {
					oJsonTableControl.clientvpos = oJsonTableControl.totaldatarows - 1;
				}
				
				if (!oCrossRequestManager.hasSavedVScrollInfo() && !oCrossRequestManager.hasSavedHScrollInfo()) {
					oCrossRequestManager.setScrollData(parseInt(oJsonTableControl.clienthpos, 10),
							oJsonTableControl.clienthscrolledtoend, parseInt(oJsonTableControl.clientvpos, 10),
							oJsonTableControl.clientvscrolledtoend);
				}
			}

			if (oJsonTableControl.rootcause) {
				oCrossRequestManager.setRootCause(oJsonTableControl.rootcause);
				if (oJsonTableControl.rootcause === "hierarchy") {
					oCrossRequestManager.setHierarchyAction(oJsonTableControl.rootcause_hierarchy); // expanded/collapsed
					oCrossRequestManager.setIsHierarchyDirectionDown(oJsonTableControl.rootcause_hierarchy_directiondown);
				}
				oCrossRequestManager.handleRootCause();
			} else {
				if (oJsonTableControl.changed === true) {
					// clear scroll values
					oCrossRequestManager.setScrollData(0, false, 0, false);
				} 
			}
		
			// Horizontal scrollpos in header if any
			var bSetHeaderScrollPositions = false;
			if (oJsonTableControl.rootcause && oCrosstab.getPropertyBag().isBookmarkProcessing()) {
				bSetHeaderScrollPositions = true;
			} else {
				if (!oJsonTableControl.dataproviderchanged) {
					if (oJsonTableControl.resultsetchanged) {
						if (oJsonTableControl.rootcause) {
							bSetHeaderScrollPositions = oJsonTableControl.rootcause === "sorting" || oJsonTableControl.rootcause === "hierarchy" || oJsonTableControl.rootcause === "plan" || oJsonTableControl.rootcause === "dragdrop";
						}
					} else {
						bSetHeaderScrollPositions = true;
					}
				} 
			}
			if (oJsonTableControl.clientheaderhpos && bSetHeaderScrollPositions) {
				oCrossRequestManager.setHeaderScrollData({"iHPos": parseInt(oJsonTableControl.clientheaderhpos, 10)});
			} else {
				oCrossRequestManager.setHeaderScrollData({"iHPos": 0});
			}
		}
	}

	this.jsonToDataModel = function (oPageInfo) {
		if (oJsonTableControl.rows) {
			oCrosstabAreasToBeFilled = oPageInfo.oCrosstabAreasToBeFilled;
			iColOffset = oPageInfo.iColOffset;
			iRowOffset = oPageInfo.iRowOffset;

			checkHeaderAreasToBeFilled();

			var aRows = oJsonTableControl.rows;
			for (var i = 0, iMaxRows = aRows.length; i < iMaxRows; i++) {
				var iRowIndex = aRows[i].row.rowidx;
				var aCells = aRows[i].row.cells;
				for (var j = 0, iMaxCols = aCells.length; j < iMaxCols; j++) {
					var oJsonCellControl = aCells[j].control;
					var iColIndex = oJsonCellControl.colidx;
					addCell(oJsonCellControl, iRowIndex, iColIndex);
				}
			}
		}
		oCrosstab.setColHeaderHierarchyLevels(oColHeaderHierarchyLevels);
		oCrosstab.setRowHeaderHierarchyLevels(oRowHeaderHierarchyLevels);
	};

	function checkHeaderAreasToBeFilled () {
		bFillDimensionHeaderArea = oCrosstabAreasToBeFilled[oDimensionHeaderArea.getAreaType()];
		bFillRowHeaderArea = oCrosstabAreasToBeFilled[oRowHeaderArea.getAreaType()];
		bFillColHeaderArea = oCrosstabAreasToBeFilled[oColHeaderArea.getAreaType()];
	}

	function handleMsgInTable (oJsonTableControl) {
		oDimensionHeaderArea.setRowCnt(2);
		oDimensionHeaderArea.setColCnt(1);

		var oCell = createHeaderCell(oDimensionHeaderArea, 0, 0);
		oCell.setText(oJsonTableControl.messagetitle);
		oDimensionHeaderArea.insertCell(oCell, 0, 0);

		oCell = createHeaderCell(oDimensionHeaderArea, 1, 0);
		oCell.setText(oJsonTableControl.messagetext);
		oDimensionHeaderArea.insertCell(oCell, 1, 0);
	}
	
	function removeSelections() {
		var oSelectionHandler = oCrosstab.getSelectionHandler();
		if(oSelectionHandler){			
			oSelectionHandler.setSelection(null);
		}
	}

	var addCell = function (oJsonCellControl, iRowIndex, iColIndex) {
		var iModelRow = iRowIndex - 1;
		var iModelCol = iColIndex - 1;

		if (iColIndex > iFixedRowHeaders && iRowIndex > iFixedColHeaders) {
			addDataCell(oJsonCellControl, iModelRow + iRowOffset, iModelCol + iColOffset);
		} else if (bFillDimensionHeaderArea && iColIndex <= iFixedRowHeaders && iRowIndex <= iFixedColHeaders) {
			addDimensionAreaCell(oJsonCellControl, iModelRow, iModelCol);
		} else if (bFillColHeaderArea && iRowIndex <= iFixedColHeaders && iColIndex > iFixedRowHeaders) {
			addColumnHeaderCell(oJsonCellControl, iModelRow, iModelCol + iColOffset);
		} else if (bFillRowHeaderArea && iColIndex <= iFixedRowHeaders && iRowIndex > iFixedColHeaders) {
			addRowHeaderCell(oJsonCellControl, iModelRow + iRowOffset, iModelCol);
		}
	};

	function createDataCell (iRow, iCol) {
		var oDataCell = new sap.zen.crosstab.DataCell();
		oDataCell.setArea(oDataArea);
		oDataCell.setRow(iRow);
		oDataCell.setCol(iCol);
		oDataCell.addStyle(oCrosstab.getPropertyBag().isCozyMode() ? sap.zen.crosstab.rendering.RenderingConstants.STYLE_DATA_CELL_COZY : sap.zen.crosstab.rendering.RenderingConstants.STYLE_DATA_CELL);
		return oDataCell;
	}

	var addDataCell = function (oJsonCellControl, iModelRow, iModelCol) {
		// coordinates in data area
		var iRowIndex = iModelRow - iFixedColHeaders;
		var iColIndex = iModelCol - iFixedRowHeaders;

		var oDataCell = createDataCell(iRowIndex, iColIndex);
		oDataCell.setTableRow(iModelRow);
		oDataCell.setTableCol(iModelCol);
		parseCommonCellData(oJsonCellControl, oDataCell);

		if (oCrosstab.getPropertyBag().getZebraMode() !== sap.zen.crosstab.rendering.RenderingConstants.ZEBRA_OFF) {
			if (iRowIndex % 2 === 1) {
				oDataCell.addStyle(sap.zen.crosstab.rendering.RenderingConstants.STYLE_ALTERNATING);
			}
		}

		oDataArea.insertCell(oDataCell, iRowIndex, iColIndex);
	};

	var addDimensionAreaCell = function (oJsonCellControl, iModelRow, iModelCol) {
		addHeaderCell(oJsonCellControl, oDimensionHeaderArea, iModelRow, iModelCol, iModelRow, iModelCol);
	};

	var addRowHeaderCell = function (oJsonCellControl, iModelRow, iModelCol) {
		var iActualModelRow = iModelRow;
		if (oJsonCellControl.axisidx !== undefined) {
			iActualModelRow = oJsonCellControl.axisidx + iFixedColHeaders;
		}
		addHeaderCell(oJsonCellControl, oRowHeaderArea, iModelRow - iFixedColHeaders, iModelCol, iActualModelRow,
				iModelCol);
	};

	var addColumnHeaderCell = function (oJsonCellControl, iModelRow, iModelCol) {
		var iActualModelCol = iModelCol;
		if (oJsonCellControl.axisidx !== undefined) {
			iActualModelCol = oJsonCellControl.axisidx + iFixedRowHeaders;
		}
		addHeaderCell(oJsonCellControl, oColHeaderArea, iModelRow, iModelCol - iFixedRowHeaders, iModelRow,
				iActualModelCol);
	};

	function createHeaderCell (oArea, iRow, iCol) {
		var oHeaderCell = new sap.zen.crosstab.HeaderCell();
		oHeaderCell.setArea(oArea);
		oHeaderCell.setRow(iRow);
		oHeaderCell.setCol(iCol);
		oHeaderCell.addStyle(oCrosstab.getPropertyBag().isCozyMode() ? sap.zen.crosstab.rendering.RenderingConstants.STYLE_HEADER_CELL_COZY : sap.zen.crosstab.rendering.RenderingConstants.STYLE_HEADER_CELL);
		return oHeaderCell;
	}

	var addHeaderCell = function (oJsonCellControl, oHeaderArea, iAreaRowIndex, iAreaColIndex, iModelRow, iModelCol) {
		var oHeaderCell = createHeaderCell(oHeaderArea, iAreaRowIndex, iAreaColIndex);
		oHeaderCell.setTableRow(iModelRow);
		oHeaderCell.setTableCol(iModelCol);

		parseCommonCellData(oJsonCellControl, oHeaderCell);
		parseHeaderCellData(oJsonCellControl, oHeaderCell, oHeaderArea);
		
		if (oCrosstab.getPropertyBag().isRtl() && oHeaderCell.getRow() === oCrosstab.getDimensionHeaderArea().getRowCnt() - 1 && oHeaderCell.getCol() === oCrosstab.getDimensionHeaderArea().getColCnt() - 1) {
			oHeaderCell.setText(sap.zen.crosstab.utils.Utils.swapPivotKeyText(oHeaderCell.getText()));
		}

		oHeaderArea.insertCell(oHeaderCell, iAreaRowIndex, iAreaColIndex);
	};

	var parseCommonCellData = function (oJsonCellControl, oCommonCell) {
		var oFormatter = getFormatter(oJsonCellControl);
		if (oFormatter) {
			oCommonCell.setFormatter(oFormatter);
		}
		
		var sText = oJsonCellControl._v;
		if (sText) {
			var oPreparedTextObject = sap.zen.crosstab.utils.Utils.prepareStringForRendering(sText);
			oCommonCell.setText(oPreparedTextObject.text);
			oCommonCell.setNumberOfLineBreaks(oPreparedTextObject.iNumberOfLineBreaks);
		}

		var exceptionVisualizations = oJsonCellControl.exceptionvisualizations;
		if (exceptionVisualizations) {
			for ( var index in exceptionVisualizations) {
				if (exceptionVisualizations.hasOwnProperty(index)) {
					var viz = exceptionVisualizations[index];
					if (viz) {
						sap.zen.crosstab.CellStyleHandler.setExceptionStylesOnCell(oCommonCell, viz.formattype,
								viz.alertlevel);
					}
				}
			}
		}

		if (oJsonCellControl.isemphasized) {
			oCommonCell.addStyle(sap.zen.crosstab.rendering.RenderingConstants.STYLE_EMPHASIZED);
		}

		// planning
		if (!(oCrosstab.getPropertyBag().isMobileMode() || oCrosstab.getPropertyBag().isTestMobileMode())) {
			if (oJsonCellControl.isdataentryenabled) {
				oCommonCell.addStyle(sap.zen.crosstab.rendering.RenderingConstants.STYLE_DATA_ENTRY_ENABLED);
				oCommonCell.setEntryEnabled(true);
				if (oJsonCellControl.unit) {
					oCommonCell.setUnit(oJsonCellControl.unit);
				}
			}

			if (oJsonCellControl.hasinvalidvalue) {
				oCommonCell.addStyle(sap.zen.crosstab.rendering.RenderingConstants.STYLE_INVALID_VALUE);
			}

			if (oJsonCellControl.hasnewvalue) {
				oCommonCell.addStyle(sap.zen.crosstab.rendering.RenderingConstants.STYLE_NEW_VALUE);
			}

			if (oJsonCellControl.islocked) {
				oCommonCell.addStyle(sap.zen.crosstab.rendering.RenderingConstants.STYLE_LOCKED);
			}
		}

		if (oJsonCellControl.isresult) {
			if (oCommonCell.setResult) {
				oCommonCell.setResult(oJsonCellControl.isresult);
			}
			oCommonCell.addStyle(sap.zen.crosstab.rendering.RenderingConstants.STYLE_TOTAL);
		}

		if (oJsonCellControl.passivetype) {
			oCommonCell.setPassiveCellType(oJsonCellControl.passivetype);
		}
		
        if(oJsonCellControl.additionalstyles) {
	        for (var i = 0; i < oJsonCellControl.additionalstyles.length; i++) {
		         oCommonCell.addStyle(oJsonCellControl.additionalstyles[i].style.stylename);
	        }
        }
	};

	var parseHeaderCellData = function (oJsonCellControl, oHeaderCell, oHeaderArea) {
		if (oJsonCellControl.rowspan) {
			oHeaderCell.setRowSpan(oJsonCellControl.rowspan);
		} else {
			oHeaderCell.setRowSpan(1);
		}

		if (oJsonCellControl.colspan) {
			oHeaderCell.setColSpan(oJsonCellControl.colspan);
		} else {
			oHeaderCell.setColSpan(1);
		}

		if (oJsonCellControl.key) {
			oHeaderCell.setMergeKey(oJsonCellControl.key);
		} 
		
		if (oJsonCellControl.sort) {
			oHeaderCell.setSort(oJsonCellControl.sort);
		}
		if (oJsonCellControl.sorttxtidx) {
			oHeaderCell.setSortTextIndex(parseInt(oJsonCellControl.sorttxtidx, 10));
		}

		if (oJsonCellControl.sortaction) {
			oHeaderCell.setSortAction(oJsonCellControl.sortaction);
		}
		if (oJsonCellControl.alignment) {
			oHeaderCell.setAlignment(oJsonCellControl.alignment);
		}
		if (oJsonCellControl.memberid) {
			oHeaderCell.setMemberId(oJsonCellControl.memberid);
		}
		if (oJsonCellControl.parentmemberid) {
			oHeaderCell.setParentMemberId(oJsonCellControl.parentmemberid);
		}
		// level 0 is valid!
		if (typeof (oJsonCellControl.level) != "undefined") {
			oHeaderCell.setLevel(oJsonCellControl.level);
			saveHierarchyLevelInfo(oHeaderArea, oHeaderCell, oJsonCellControl.level);
		} else {
			oHeaderCell.setLevel(-1);
		}
		if (oJsonCellControl.drillstate) {
			if (oJsonCellControl.drillstate !== "A") {
				// Attribute is not a drillstate for rendering. It occurs when a [KEY][TEXT] or similar display is
				// chosen.
				// The attribute data must not be rendered with indentations
				oHeaderCell.setDrillState(oJsonCellControl.drillstate);
			}
		}
		if (oJsonCellControl.hierarchyaction) {
			oHeaderCell.setHierarchyAction(oJsonCellControl.hierarchyaction);
		}
		if (oJsonCellControl.hierarchytooltip) {
			oHeaderCell.setHierarchyTooltip(oJsonCellControl.hierarchytooltip);
		}
		if (oJsonCellControl.nodeAlignment) {
			oHeaderCell.setNodeAlignment(oJsonCellControl.nodeAlignment);
		}
		
		if (oCrosstab.getPropertyBag().getZebraMode() === sap.zen.crosstab.rendering.RenderingConstants.ZEBRA_FULL) {
			if (oHeaderArea.isRowHeaderArea() && oHeaderCell.getRow() % 2 === 1 && oHeaderCell.getRowSpan() === 1) {
				var oHeaderInfo = oCrosstab.getHeaderInfo();
				if (oHeaderInfo) {
					if ((oHeaderCell.getCol() + oHeaderCell.getColSpan() - 1) >= oHeaderInfo.getStartColForInnermostDimension()) {
						oHeaderCell.addStyle(sap.zen.crosstab.rendering.RenderingConstants.STYLE_ALTERNATING);
					}
				}
			}
		}
	};

	var saveHierarchyLevelInfo = function (oArea, oCell, iLevel) {
		if (oArea.getAreaType() === sap.zen.crosstab.rendering.RenderingConstants.TYPE_COLUMN_HEADER_AREA) {
			var iRow = oCell.getRow();
			if (oColHeaderHierarchyLevels[iRow] != undefined) {
				if (oColHeaderHierarchyLevels[iRow] < iLevel) {
					oColHeaderHierarchyLevels[iRow] = iLevel;
				}
			} else {
				oColHeaderHierarchyLevels[iRow] = iLevel;
			}
		} else if (oArea.getAreaType() === sap.zen.crosstab.rendering.RenderingConstants.TYPE_ROW_HEADER_AREA) {
			var iCol = oCell.getCol();
			if (oRowHeaderHierarchyLevels[iCol] != undefined) {
				if (oRowHeaderHierarchyLevels[iCol] < iLevel) {
					oRowHeaderHierarchyLevels[iCol] = iLevel;
				}
			} else {
				oRowHeaderHierarchyLevels[iCol] = iLevel;
			}
		}
	};
	
	function getFormatter(oJsonCellControl) {
		var oFormatter;
		
		if (oJsonCellControl.valueType) {
			var sPattern = validateFormatString(oJsonCellControl.formatString);
			
			var oFormatOptions;
			if (oJsonCellControl.valueType === "Integer" || oJsonCellControl.valueType === "Double") {
				oFormatOptions = { 
						groupingEnabled: true, // show thousand separators
						maxFractionDigits: oJsonCellControl.decimals, // amount of decimals
						pattern: sPattern, // CLDR pattern (example "* #,### Tests" -> "* 10.000 Tests")
						showMeasure: true // show measure in pattern
					};
				oFormatter = sap.ui.core.format.NumberFormat.getCurrencyInstance(oFormatOptions);
			} else if (oJsonCellControl.valueType === "Amount" || oJsonCellControl.valueType === "Price" || oJsonCellControl.valueType === "Quantity") {
				oFormatOptions = { 
						groupingEnabled: true, // show thousand separators
						maxFractionDigits: oJsonCellControl.decimals, // amount of decimals
						pattern: sPattern, // CLDR pattern (example "* #,### Tests" -> "* 10.000 Tests")
						showMeasure: true // show measure in pattern
					};
				oFormatter = sap.ui.core.format.NumberFormat.getCurrencyInstance(oFormatOptions);
			}
		}
		
		return oFormatter;
	}
	
	function validateFormatString(sFormatString) {
		var sPattern;
		
		if (sFormatString) {
			sPattern = sFormatString;
			
	    	// fix thousand separator
	    	regString = "#(?![#|" + "," + "]).(?=#)";
	    	regex = new RegExp(regString, "g");
	    	sFormatString = sFormatString.replace(regex, "#" + ",");
	    	
	        // fix decimal separator
	    	regString = "0(?![0|" + "." + "]).(?=0)";
	    	regex = new RegExp(regString, "g");
	    	sPattern = sPattern.replace(regex, "0" + ".");
		}
		
		return sPattern;
	}
};
