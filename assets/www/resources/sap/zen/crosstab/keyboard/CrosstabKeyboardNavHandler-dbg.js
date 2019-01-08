jQuery.sap.declare("sap.zen.crosstab.keyboard.CrosstabKeyboardNavHandler");
jQuery.sap.require("sap.zen.crosstab.rendering.RenderingConstants");

sap.zen.crosstab.keyboard.CrosstabKeyboardNavHandler = function (oCrosstab, oEventHandler) {
	"use strict";

	var iFocusRow = -1;
	var iFocusCol = -1;
	var iOldFocusRow = -1;
	var iOldFocusCol = -1;
	var iNavDx = 0;
	var iNavDy = 0;
	var that = this;
	var bEnabled = false;
	var oDataArea = oCrosstab.getDataArea();
	
	this.reset = function() {
		this.disableCell(iFocusRow, iFocusCol);
		this.disableCell(iOldFocusRow, iOldFocusCol);
		iFocusRow = -1;
		iFocusCol = -1;
		iOldFocusRow = -1;
		iOldFocusCol = -1;
		iNavDx = 0;
		iNavDy = 0;
	};

	this.setEnabled = function (pbEnabled) {
		bEnabled = pbEnabled;
	};

	this.attachEvents = function (oJqDiv) {
		if (!bEnabled) {
			return;
		}
		oJqDiv.off("keydown", this.keyboardNavKeyHandler);
		oJqDiv.on("keydown", this.keyboardNavKeyHandler);
		// this must be used to make a div accept keydown events and focus-enabled
		oJqDiv.attr("tabindex", sap.zen.crosstab.rendering.RenderingConstants.TABINDEX);
	};

	this.getFocusScrollDiv = function (oCell) {
		var oDomScrollDiv = null;
		if (oCell.getArea().isDataArea() || oCell.getArea().isColHeaderArea()) {
			oDomScrollDiv = document.getElementById(oCrosstab.getId() + '_lowerRight_scrollDiv');
		} else if (oCell.getArea().isRowHeaderArea()) {
			oDomScrollDiv = document.getElementById(oCrosstab.getId() + '_lowerLeft_scrollDiv');
		}
		return oDomScrollDiv;
	};

	this.movePixelCellIntoFocus = function (oCell, oDomCell, oScrollDivRect, bUserSelected, bLookAheadMode, bNewLine) {
		var bHasScrolled = false;

		var oCellDivRect = oCrosstab.getUtils().getRtlAwareBoundingClientRect(oDomCell);
		var iScrollDivRectWidth = oScrollDivRect.width;
		var iContentDivRectWidth = oCellDivRect.width;
		var iScrollDivRectHeight = oScrollDivRect.height;
		var iContentDivRectHeight = oCellDivRect.height;

		// horizontal
		if (iContentDivRectWidth < iScrollDivRectWidth) {
			if (oCellDivRect.end > oScrollDivRect.end) {
				var iOldScrollPos = oCrosstab.getHScrollbar().getScrollPosition();
				oCrosstab.scrollHorizontal(iOldScrollPos + oCellDivRect.end - oScrollDivRect.end);
				bHasScrolled = true;
			} else if (oCellDivRect.begin < oScrollDivRect.begin) {
				var iOldScrollPos = oCrosstab.getHScrollbar().getScrollPosition();
				oCrosstab.scrollHorizontal(iOldScrollPos - (oScrollDivRect.begin - oCellDivRect.begin));
				bHasScrolled = true;
			}
		}
		// vertical
		if (bUserSelected || bLookAheadMode || bNewLine) {
			if (iContentDivRectHeight < iScrollDivRectHeight) {
				if (oCellDivRect.bottom > oScrollDivRect.bottom) {
					var iOldScrollPos = oCrosstab.getVScrollbar().getScrollPosition();
					oCrosstab.scrollVertical(iOldScrollPos + oCellDivRect.bottom - oScrollDivRect.bottom);
					bHasScrolled = true;

				} else if (oCellDivRect.top < oScrollDivRect.top) {
					var iOldScrollPos = oCrosstab.getVScrollbar().getScrollPosition();
					oCrosstab.scrollVertical(iOldScrollPos - (oScrollDivRect.top - oCellDivRect.top));
					bHasScrolled = true;
				}
			} else {
				// cell is higher than scrolldiv -> scroll to beginning of cell
				var iOldScrollPos = oCrosstab.getVScrollbar().getScrollPosition();
				oCrosstab.scrollVertical(iOldScrollPos - (oScrollDivRect.top - oCellDivRect.top));
				bHasScrolled = true;
			}
		}

		return bHasScrolled;
	};
	
	this.moveRowHeaderAreaCellHorizontally = function(oCell, oDomCell) {
		var oScrollDivRect = oCrosstab.getUtils().getRtlAwareBoundingClientRect(document.getElementById(oCrosstab.getId() + "_lowerLeft_scrollDiv"));
		var oCellDivRect = oCrosstab.getUtils().getRtlAwareBoundingClientRect(oDomCell);

		var iScrollDivRectWidth = oScrollDivRect.width;
		var iContentDivRectWidth = oCellDivRect.width;
		
		var oHeaderHScrollbar = oCrosstab.getHorizontalHeaderScrollbar();
		
		if (iContentDivRectWidth < iScrollDivRectWidth) {
			if (oCellDivRect.end > oScrollDivRect.end) {
				var iOldScrollPos = oHeaderHScrollbar.getScrollPosition();
				oCrosstab.scrollHeaderHorizontal(iOldScrollPos + oCellDivRect.end - oScrollDivRect.end);
			} else if (oCellDivRect.begin < oScrollDivRect.begin) {
				var iOldScrollPos = oHeaderHScrollbar.getScrollPosition();
				oCrosstab.scrollHeaderHorizontal(iOldScrollPos - (oScrollDivRect.begin - oCellDivRect.begin));
			}
		}
	};

	this.moveRowColCellIntoFocus = function (oCell, oDomCell, oScrollDivRect, bUserSelected, bLookAheadMode, bNewLine) {
		var bHasScrolled = false;

		var oCellDivRect = oCrosstab.getUtils().getRtlAwareBoundingClientRect(oDomCell);
		var iScrollDivRectWidth = oScrollDivRect.width;
		var iContentDivRectWidth = oCellDivRect.width;

		var iRenderStartCol = oCrosstab.getDataArea().getRenderStartCol();
		var iRenderStartRow = oCrosstab.getDataArea().getRenderStartRow();

		var iMaxRow = oCrosstab.getDataArea().getRowCnt() - 1;

		// horizontal check: only for data cells. Header cells do not scroll horizontally
		if (oCell.getArea().isDataArea() || oCell.getArea().isColHeaderArea()) {
			var oHScrollbar = oCrosstab.getHScrollbar();
			if (oHScrollbar) {
				if (iContentDivRectWidth < iScrollDivRectWidth) {
					// check if the cell's content div fits in into the visible area
					// horizontal
					if (oCellDivRect.end > oScrollDivRect.end) {
						oCrosstab.scrollHorizontal(iRenderStartCol + 1);
						bHasScrolled = true;
					} else if (oCellDivRect.begin < oScrollDivRect.begin) {
						oCrosstab.scrollHorizontal(iRenderStartCol - 1);
						bHasScrolled = true;
					}
				}
			}
		}
		
		// horizontal header scrolling if relevant
		if (oCrosstab.isHeaderHScrolling() === true && oCell.getArea().isRowHeaderArea()) {
			this.moveRowHeaderAreaCellHorizontally(oCell, oDomCell);
		}

		// vertical correction: only for data and row header cells
		if (iRenderStartRow === oCell.getTableRow() - oCrosstab.getTableFixedColHeaderRowCnt()) {
			// cell is already at the top. Don't try to shift it in from below.
			// this is especially important for cells with such large rowspans that the
			// whole cell does never fit into the crosstab viewport.
			// This check will be made further down too after the cell was scrolled into focus and
			// before the "fine tuning" begins
			return bHasScrolled;
		}

		if (oCell.getArea().isDataArea() || (oCell.getArea().isRowHeaderArea() && bUserSelected) || bLookAheadMode || bNewLine) {
			var oVScrollbar = oCrosstab.getVScrollbar();
			if (oVScrollbar) {
				var iRenderedRows = oCrosstab.getDataArea().getRenderRowCnt();
				var iCurrentVScrollPos = oVScrollbar.getScrollPosition();
				var iRow = oCell.getTableRow() - oCrosstab.getTableFixedColHeaderRowCnt();
				// cell sticks out at the top
				if (iRow < iRenderStartRow) {
					oCrosstab.scrollVertical(iRow);
					bHasScrolled = true;
				} else if (iRow + oCell.getRowSpan() > (iRenderStartRow + iRenderedRows)) {
					// cell sticks out at the bottom
					var iCellRowsVisible = iRenderStartRow + iRenderedRows - oCell.getRow();
					var iScrollDelta = oCell.getRowSpan() - iCellRowsVisible;
					var iNewScrollPos = Math.max(0, Math.min(iCurrentVScrollPos + iScrollDelta + 1, iMaxRow));
									
					if (iScrollDelta !== 0) {
						oCrosstab.scrollVertical(iNewScrollPos);
						bHasScrolled = true;
					}
					iRenderStartRow = oCrosstab.getDataArea().getRenderStartRow();
					// trying to shift in a cell from the bottom that doesn't fit at the top -> go to top
					if (iRenderStartRow > iRow) {
						oCrosstab.scrollVertical(iRow);
						bHasScrolled = true;
					}
				}

				iRenderStartRow = oCrosstab.getDataArea().getRenderStartRow();
				if (iRenderStartRow === oCell.getTableRow() - oCrosstab.getTableFixedColHeaderRowCnt()) {
					// cell was already scrolled to the top. Don't try to shift it in from below.
					// this is especially important for cells with such large rowspans that the
					// whole cell does never fit into the crosstab viewport
					return bHasScrolled;
				}

				if (bHasScrolled) {
					oDomCell = document.getElementById(oCell.getId());
					oCellDivRect = oCrosstab.getUtils().getRtlAwareBoundingClientRect(oDomCell);
					iCurrentVScrollPos = oVScrollbar.getScrollPosition();
				}
				// final correction due to vertical "half cells"
				if (oCellDivRect.bottom > oScrollDivRect.bottom) {
					while (oCellDivRect.bottom > oScrollDivRect.bottom && iCurrentVScrollPos < iMaxRow) {
						oCrosstab.scrollVertical(Math.min(iCurrentVScrollPos + 1, iMaxRow));
						iCurrentVScrollPos = oVScrollbar.getScrollPosition();
						oDomCell = document.getElementById(oCell.getId());
						oCellDivRect = oCrosstab.getUtils().getRtlAwareBoundingClientRect(oDomCell);
						bHasScrolled = true;
					}
				} else if (oCellDivRect.top < oScrollDivRect.top) {
					oCrosstab.scrollVertical(Math.max(0, iCurrentVScrollPos - 1));
					bHasScrolled = true;
				}
			}
		}

		return bHasScrolled;
	};

	this.getCellIntoDom = function (oCell, oOldCell, bNewLine) {
		var iNewPos = 0;
		if (iNavDy === 0) {
			var oHScrollbar = oCrosstab.getHScrollbar();
			if (oHScrollbar && !bNewLine) {
				if (iNavDx > 0) {
					iNewPos = oHScrollbar.getScrollPosition() + oOldCell.getColSpan();
				} else if (iNavDx < 0) {
					iNewPos = oCell.getTableCol() - oCrosstab.getTableFixedRowHeaderColCnt();
				}
				oCrosstab.scrollHorizontal(iNewPos);
			}
		} else if (iNavDx == 0) {
			var oVScrollbar = oCrosstab.getVScrollbar();
			if (oVScrollbar) {
				if (iNavDy > 0) {
					iNewPos = oVScrollbar.getScrollPosition() + oOldCell.getRowSpan();
				} else {
					if (iNavDy < 0) {
						iNewPos = oCell.getTableRow() - oCrosstab.getTableFixedColHeaderRowCnt();	
					}
				}
				oCrosstab.scrollVertical(iNewPos);
			}
		}
	};

	this.getRowLookAheadCell = function (oCell) {
		var oLookAheadCell = null;
		var oTempCell = null;
		var iMaxCol = 0;
		var iMinCol = 0;
		if (oCell.getRowSpan() > 1) {
			if (iNavDx > 0) {
				iMinCol = oCell.getTableCol();
				iMaxCol = oCrosstab.getRenderStartCol() + oCrosstab.getRenderColCnt()
						+ oCrosstab.getTableFixedRowHeaderColCnt();
				for (var i = iMinCol; i <= iMaxCol; i++) {
					oTempCell = oCrosstab.getTableCellWithSpans(iFocusRow, i);
					if (oTempCell.getRowSpan() === 1) {
						oLookAheadCell = oTempCell;
						break;
					} else {
						if (oLookAheadCell) {
							if (oTempCell.getRowSpan() < oLookAheadCell.getRowSpan()) {
								oLookAheadCell = oTempCell;
							}
						} else {
							oLookAheadCell = oTempCell;
						}
					}
				}
			}
		} else {
			oLookAheadCell = oCell;
		}
		return oLookAheadCell;
	};

	this.scrollCellIntoFocus = function (oCell, bUserSelected, bNewLine, oOldCell) {
		var oLookAheadCell = oCell;
		var bLookAheadMode = false;
		if (!bUserSelected && oCell.getArea().isRowHeaderArea() && bNewLine === true && oCrosstab.getVScrollbar() && !oCrosstab.isHeaderHScrolling()) {
			// find the cell that is needed for positioning when scrolling. Only during horizontal forward navigation!
			if (iNavDx > 0 && iNavDy === 0) {
				oLookAheadCell = this.getRowLookAheadCell(oCell);
			}
		}

		if (oLookAheadCell !== oCell) {
			oCell = oLookAheadCell;
			bLookAheadMode = true;
		}

		var oDomScrollDiv = this.getFocusScrollDiv(oCell);
		if (!oDomScrollDiv) {
			return false;
		}

		var bHasScrolled = false;
		var isPixelScrolling = oCrosstab.getPropertyBag().isPixelScrolling();

		var oDomCell = document.getElementById(oCell.getId());
		if (!oDomCell && !isPixelScrolling) {
			this.getCellIntoDom(oCell, oOldCell, bNewLine);
		}

		if (!oDomCell) {
			return false;
		}
		// the bounding client rects
		var oScrollDivRect = oCrosstab.getUtils().getRtlAwareBoundingClientRect(oDomScrollDiv);

		if (isPixelScrolling) {
			bHasScrolled = this.movePixelCellIntoFocus(oCell, oDomCell, oScrollDivRect, bUserSelected, bLookAheadMode, bNewLine);
		} else {
			bHasScrolled = this.moveRowColCellIntoFocus(oCell, oDomCell, oScrollDivRect, bUserSelected, bLookAheadMode, bNewLine);
		}

		return bHasScrolled;
	};

	this.keyboardNavKeyHandler = function (e) {
		// check handling the right crosstab
		if (iFocusRow > -1 && iFocusCol > -1) {
			iNavDx = 0;
			iNavDy = 0;
			if (e.which === 9) {
				// TAB
				iNavDx = 1;
			} else if (e.which === 38) {
				iNavDy = -1;
				// ARROW UP
			} else if (e.which === 40) {
				// ARROW DN
				iNavDy = 1;
			} else if (e.which === 37) {
				// ARROW LEFT
				iNavDx = -1;
			} else if (e.which === 39) {
				// ARROW RIGHT
				iNavDx = 1;
			}
			if (iNavDx === 0 && iNavDy === 0) {
				// no changes
				return true;
			} else {
				if (!oCrosstab.hasLoadingPages()) {
					that.moveCellFocus();
				}
				sap.zen.crosstab.utils.Utils.cancelEvent(e);
				return false;
			}
		}
		return true;
	};

	this.restoreFocusOnCell = function () {
		if (!bEnabled) {
			return;
		}
		if (iFocusRow > -1 && iFocusCol > -1 && !oCrosstab.hasLoadingPages()) {
			var oRestoreCell = oCrosstab.getTableCellWithSpans(iFocusRow, iFocusCol);
			if (oRestoreCell && !oRestoreCell.isLoading()) {
				this.disableCell(iOldFocusRow, iOldFocusCol);
				this.navigateToCellAction(oRestoreCell, -1, -1);
			}
		}
	};

	function focusNoScroll (oJqElement, oDomScrollDiv) {
		var x = oDomScrollDiv.scrollLeft;
		var y = oDomScrollDiv.scrollTop;

		oJqElement.focus();

		if (oDomScrollDiv.scrollLeft !== x) {
			oDomScrollDiv.scrollLeft = x;
		}
		if (oDomScrollDiv.scrollTop !== y) {
			oDomScrollDiv.scrollTop = y;
		}
	}

	// Actions to be carried out when cell is reached via keyboard navigation
	this.navigateToCellAction = function (oCell, iSelectionStartPos, iSelectionEndPos) {
		var oJqCell = null;
		var oJqContentDiv = null;
		var oDomScrollDiv = null;
		var oJqTextContentDiv = null;

		oJqCell = $(document.getElementById(oCell.getId()));
		oJqCell.addClass("sapzencrosstab-CellFocus");
		oJqContentDiv = $(document.getElementById(oCell.getId() + "_contentDiv"));
		oJqTextContentDiv = oJqCell.find("#" + $.sap.encodeCSS(oCell.getId() + "_textContentDiv"));

		if (!oCell.isEntryEnabled()) {
			oDomScrollDiv = this.getFocusScrollDiv(oCell);
			if (oJqTextContentDiv.length > 0) {
				oJqContentDiv = oJqTextContentDiv;
			}
			if ($.browser.mozilla) {
				focusNoScroll(oJqContentDiv, oDomScrollDiv);
			}
			// Text selection
			var oDomContentDiv = oJqContentDiv[0];
			if (oDomContentDiv && iSelectionStartPos === -1 && iSelectionEndPos === -1) {
				sap.zen.crosstab.utils.Utils.selectTextInElement(oDomContentDiv);
			}

			focusNoScroll(oJqContentDiv, oDomScrollDiv);
		} else {
			oEventHandler.provideInputEnabledCell(oCell, oCell.getId(), oJqContentDiv, iSelectionStartPos, iSelectionEndPos);
		}
	};

	// Actions to be carried out when cell is moved away from via keyboard navigation
	this.navigateFromCellAction = function (oCell) {
		var oJqCell = $(document.getElementById(oCell.getId()));
		// marked cell may have been scrolled out of displayed area
		if (oJqCell.length > 0) {
			oJqCell.removeClass("sapzencrosstab-CellFocus");
		}
		var oInputField = oJqCell.find("input");
		oInputField.focusout();
	};

	// This is only called when user clicks a cell
	this.focusNewCell = function (oCell, iSelectionStartPos, iSelectionEndPos) {
		if (!bEnabled) {
			return false;
		}
		if (!oCell) {
			return false;
		}
		var bHasScrolled = false;
		if (iFocusRow > -1 && iFocusCol > -1) {
			this.disableCell(iFocusRow, iFocusCol);
		}

		iFocusRow = oCell.getTableRow();
		iFocusCol = oCell.getTableCol();
		iOldFocusRow = iFocusRow;
		iOldFocusCol = iFocusCol;

		var oVScrollbar = oCrosstab.getVScrollbar();
		var oHScrollbar = oCrosstab.getHScrollbar();

		if (oVScrollbar || oHScrollbar) {
			// row adjustment
			if (oVScrollbar) {
				bHasScrolled = this.scrollCellIntoFocus(oCell, true, false, null);
			}
		}
		this.navigateToCellAction(oCell, iSelectionStartPos, iSelectionEndPos);
		return bHasScrolled;
	};

	this.scrollToCell = function (oCell) {
		var iDataRow = oCell.getTableRow() - oCrosstab.getTableFixedColHeaderRowCnt();
		var iDataCol = oCell.getTableCol() - oCrosstab.getTableFixedRowHeaderColCnt();

		var bVScroll = iDataRow < oCrosstab.getRenderStartRow()
				|| iDataRow > (oCrosstab.getRenderStartRow() + oCrosstab.getRenderRowCnt());

		var bHScroll = false;
		if (oCell.getArea().isDataArea() || oCell.getArea().isColHeaderArea()) {
			bHScroll = iDataCol < oCrosstab.getRenderStartCol()
					|| iDataCol > (oCrosstab.getRenderStartCol() + oCrosstab.getRenderColCnt());
		}
		if (oCrosstab.getVScrollbar() && bVScroll) {
			oCrosstab.scrollVertical(oCell.getTableRow() - oCrosstab.getTableFixedColHeaderRowCnt());
		}
		if (oCrosstab.getHScrollbar() && oCell.getArea().isDataArea() && bHScroll) {
			oCrosstab.scrollHorizontal(oCell.getTableCol() - oCrosstab.getTableFixedRowHeaderColCnt());
		}
	};

	this.disableCell = function (iTableRow, iTableCol) {
		var oCell = null;
		if (iTableRow > -1 && iTableRow > -1) {
			oCell = oCrosstab.getTableCellWithSpans(iTableRow, iTableCol);
			if (oCell && !oCell.isLoading()) {
				// deactivate old cell in any case
				this.navigateFromCellAction(oCell);
			}
		}
	};

	this.moveCellFocus = function () {
		if (!bEnabled) {
			return;
		}
		// take given oCell when defined, otherwise operate using the deltas.
		// For delta handling, a cell must be focused
		// ASSUMPTION: we only move in steps with abs(step) = 1, i. e. +1 and -1!
		var oNewCell = null;
		var iScrollToCol = -1;
		var iScrollToRow = -1;

		var iMaxRow = oCrosstab.getTableRowCnt() - 1;
		var iMaxCol = oCrosstab.getTableColCnt() - 1;
		var iMinRow = oCrosstab.getTableFixedColHeaderRowCnt();

		iOldFocusRow = iFocusRow;
		iOldFocusCol = iFocusCol;

		var bNewLine = false;
		var bUserSelected = false;

		var oCurrentCell = oCrosstab.getTableCellWithSpans(iOldFocusRow, iOldFocusCol);
		if (oCurrentCell && !oCrosstab.hasLoadingPages()) {
			// this is needed if somebody focused a cell and then scrolls away from it so it no longer is in the DOM
			// When a key is pressed, this cell must be brought back into the DOM and
			// navigation again starts from there.
			// Hence, do this only if a key event was registered, not a click to a new cell
			if (iNavDx !== 0 || iNavDy !== 0) {
				this.scrollToCell(oCurrentCell);
			}
		}

		if (iNavDy < 0) {
			if (oCurrentCell.getTableRow() === iMinRow) {
				return;
			}
		} else if (iNavDy > 0) {
			if ((oCurrentCell.getTableRow() + oCurrentCell.getRowSpan() - 1) === iMaxRow) {
				return;
			}
		}

		this.disableCell(oCurrentCell.getTableRow(), oCurrentCell.getTableCol());

		if (iFocusRow > -1 && iFocusCol > -1) {
			if (iNavDx === 0 && iNavDy === 0) {
				return;
			}
			var iNewFocusRow = iFocusRow;
			var iNewFocusCol = iFocusCol;
			if (iNavDx !== 0) {
				// horizontal movement
				if (iNavDx > 0) {
					// moving forward
					iNewFocusCol = oCurrentCell.getTableCol() + oCurrentCell.getColSpan() + iNavDx - 1;
					if (iNewFocusCol > iMaxCol) {
						if (iNewFocusRow < iMaxRow) {
							iNewFocusRow++;
							iNewFocusCol = 0;
							iScrollToCol = 0;
							bNewLine = true;
						} else {
							iNewFocusCol = iMaxCol;
							iNewFocusRow = iMaxRow;
						}
					}
				} else {
					// moving backward
					iNewFocusCol = oCurrentCell.getTableCol();
					iNewFocusCol--;
					if (iNewFocusCol >= 0) {
						var oPreviousCellInRow = oCrosstab.getTableCellWithSpans(iNewFocusRow, iNewFocusCol);
						if (!oPreviousCellInRow) {
							return;
						}
						if (oPreviousCellInRow.isLoading()) {
							return;
						}
						// get the actual col if the cell had a colSpan
						iNewFocusCol = oPreviousCellInRow.getTableCol();
					} else {
						if (iNewFocusRow > iMinRow) {
							iNewFocusRow--;
							iNewFocusCol = iMaxCol;
							iScrollToCol = iMaxCol;
							if (iNewFocusRow < oDataArea.getRenderStartRow() + iMinRow) {
								// scrolling is 0-based with regard to data area
								iScrollToRow = iNewFocusRow - iMinRow;
							}
							bNewLine = true;
						} else {
							iNewFocusCol = 0;
							iNewFocusRow = iMinRow;
						}
					}
				}
				// when moving horizontally, first check if the cell can be found searching the same row.
				oNewCell = oCrosstab.getTableCellWithSpans(iNewFocusRow, iNewFocusCol);
				if (oNewCell.isLoading()) {
					return;
				}
				if (oCurrentCell) {
					if (oCurrentCell.getArea() !== oNewCell.getArea() && iScrollToCol === -1) {
						// transition from header to data area and vice versa when free selection has taken place and no
						// other scrollToCol was commanded
						iScrollToCol = 0;
					}
				}
			} else if (iNavDy !== 0) {
				if (iNavDy > 0) {
					// moving down
					iNewFocusRow = Math.min(oCurrentCell.getTableRow() + oCurrentCell.getRowSpan() + iNavDy - 1,
							iMaxRow);
				} else if (iNavDy < 0) {
					iNewFocusRow = Math.max(oCurrentCell.getTableRow() + iNavDy, iMinRow);
				}
				oNewCell = oCrosstab.getTableCellWithSpans(iNewFocusRow, iNewFocusCol);
				if (oNewCell.isLoading()) {
					return;
				}
				// vertical movement will handle the same as a click -> position to top of cell
				iNewFocusRow = oNewCell.getTableRow();
				// handle as user selection
				bUserSelected = true;
			}
			// set the actual values only if we come here.
			// may bail out before due to loading cells present
			iFocusRow = iNewFocusRow;
			iFocusCol = iNewFocusCol;
		}

		if (oNewCell) {
			// scrolling due to wrap events in horizontal scrolling
			if (iScrollToRow >= 0) {
				oCrosstab.scrollVertical(iScrollToRow);
			}
			if (iScrollToCol >= 0) {
				oCrosstab.scrollHorizontal(iScrollToCol);
			}

			this.scrollCellIntoFocus(oNewCell, bUserSelected, bNewLine, oCurrentCell);
			this.navigateToCellAction(oNewCell, -1, -1);
		}
	};
};