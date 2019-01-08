jQuery.sap.declare("sap.zen.crosstab.TouchHandler");
jQuery.sap.require("sap.zen.crosstab.utils.Utils");

sap.zen.crosstab.TouchHandler = function (oEventHandler, oCrosstab) {

	var oDataArea = oCrosstab.getDataArea();
	var oRowHeaderArea = oCrosstab.getRowHeaderArea();
	var oColHeaderArea = oCrosstab.getColumnHeaderArea();
	var oDimensionHeaderArea = oCrosstab.getDimensionHeaderArea();
	var iLastMouseX = 0;
	var iLastMouseY = 0;
	var bTouchStartReceived = false;
	var bMoveAction = false;
	var oDomDataArea = $(document.getElementById(oDataArea.getId()));
	var oDomRowHeaderArea = $(document.getElementById(oRowHeaderArea.getId()));
	var oDomColHeaderArea = $(document.getElementById(oColHeaderArea.getId()));
	var oDomDimensionHeaderArea = $(document.getElementById(oDimensionHeaderArea.getId()));
	var sTargetAreaId = "";
	var oTimeout = null;
	var iDelay = "800";
	var iVScrollCnt = 0;
	var iHScrollCnt = 0;
	var iRowCntLength = 0;
	var iColCntLength = 0;
	var iNewVScrollPos = 0;
	var iNewHScrollPos = 0;
	var iOldVScrollPos = 0;
	var iOldHScrollPos = 0;
	var oPopup = null;
	var oPopupContent = null;
	var iIpadFactor = 2;
	var oResizeMenu = null;
	var oVScrollbar = null;
	var oHScrollbar = null;
	var bIsHeaderScrolling = false;
	var oColResizer;

	function getMobileResizeableCell (e) {
		var oResizeableCell = null;
		var i = 0;
		var oCell = sap.ui.getCore().getControl(e.target.id);
		var oDomCell = null;
		var sCellId = null;

		if (oCell && (oCell.isMobileResize && oCell.isMobileResize())) {
			oResizeableCell = oCell;
		} else {
			// see if we have a selectable cell as parent
			var aParentCells = $(e.target).parents("td");
			if (aParentCells) {
				for (i = 0; i < aParentCells.length; i++) {
					oDomCell = $(aParentCells[i]);
					sCellId = oDomCell.attr("id");
					if (sCellId && sCellId.length > 0) {
						oCell = sap.ui.getCore().getControl(sCellId);
						if (oCell && (oCell.isMobileResize && oCell.isMobileResize())) {
							oResizeableCell = oCell;
							break;
						}
					}
				}
			}
		}
		return oResizeableCell;
	}
	
	function menuResizeEntrySelected (oEvent) {
		if (oColResizer) {
			var oCell = oEvent.getParameter("item").oSelectedCell;
			if (oCell) {
				oColResizer.resizeCol(oCell, -1);
			}
		}
	}

	function ensureResizeMenu () {
		if (!oResizeMenu) {
			// Create the menu
			
			oResizeMenu = sap.ui.getCore().getControl("resizemenu");
			if (oResizeMenu) {
				oResizeMenu.getItems()[0].destroy();
				oResizeMenu.destroy();
			}
			if (sap.zen.crosstab.utils.Utils.isDispatcherAvailable() === true && sap.zen.Dispatcher.instance.isMainMode()) {
				$.sap.require("sap.ui.unified.Menu");
				oResizeMenu = new sap.ui.unified.Menu("resizemenu", {
					ariaDescription: "Crosstab Menu",
					tooltip: "Menu containing crosstab related actions"
				});
			} else {
				oResizeMenu = new sap.ui.commons.Menu("resizemenu", {
					ariaDescription: "Crosstab Menu",
					tooltip: "Menu containing crosstab related actions"
				});
			}
			
			
			
			oResizeMenu.addStyleClass("sapzencrosstab-MenuStyle");
			// Create the items and add them to the menu
			var oMenuItem = null;
			if (sap.zen.crosstab.utils.Utils.isDispatcherAvailable() === true && sap.zen.Dispatcher.instance.isMainMode()) {
				oMenuItem = new sap.ui.unified.MenuItem("item1", {
					text: oCrosstab.getPropertyBag().getText(
							sap.zen.crosstab.TextConstants.MOBILE_MENUITEM_COLWIDTH_ADJUST_TEXT_KEY)
				});
			} else {
				 oMenuItem = new sap.ui.commons.MenuItem("item1", {
					text: oCrosstab.getPropertyBag().getText(
							sap.zen.crosstab.TextConstants.MOBILE_MENUITEM_COLWIDTH_ADJUST_TEXT_KEY)
				});
			}
			oMenuItem.attachSelect(menuResizeEntrySelected);
			oResizeMenu.addItem(oMenuItem);
		}
	}

	function prepareRowColPopup () {
		iRowCntLength = (oDataArea.getRowCnt() + "").length;
		iColCntLength = (oDataArea.getColCnt() + "").length;
		// Prepare row/col popup
		oPopup = new sap.ui.core.Popup();
		
		var oTextComponent = null;
		if (sap.zen.crosstab.utils.Utils.isDispatcherAvailable() === true && sap.zen.Dispatcher.instance.isMainMode()) {
			oTextComponent = new sap.m.Text();
		} else {
			oTextComponent = new sap.ui.commons.TextView()
		}
		
		oPopup.setContent(oTextComponent);
		oPopup.setDurations(125, 500);
		oPopup.setAutoClose(true);

		oPopupContent = oPopup.getContent();

		oPopupContent.addStyleClass("sapzencrosstab-ScrollPopup");
		oPopupContent.setWrapping(false);

		var eDock = sap.ui.core.Popup.Dock;
		oPopup.setPosition(eDock.CenterCenter, eDock.CenterCenter, document.getElementById(oCrosstab.getId() + "_renderSizeDiv"),
				"0");
	}

	function rerenderRowColPopup () {
		var sRowText = oCrosstab.getPropertyBag().getText(sap.zen.crosstab.TextConstants.ROW_TEXT_KEY) + ": "
				+ sap.zen.crosstab.utils.Utils.padWithZeroes(iNewVScrollPos + 1, iRowCntLength) + "/"
				+ oRowHeaderArea.getRowCnt();
		var sColText = oCrosstab.getPropertyBag().getText(sap.zen.crosstab.TextConstants.COL_TEXT_KEY) + ": "
				+ sap.zen.crosstab.utils.Utils.padWithZeroes(iNewHScrollPos + 1, iColCntLength) + "/"
				+ oColHeaderArea.getColCnt();
		var sText = sRowText + " " + sColText;
		oPopup.getContent().setProperty("text", sText, true);
		oPopup.getContent().rerender();
	}

	function onTouchStart (e) {
		sap.zen.crosstab.utils.Utils.cancelEvent(e);

		iVScrollCnt = 0;
		iHScrollCnt = 0;
		iNewVScrollPos = 0;
		iNewHScrollPos = 0;

		if (oResizeMenu) {
			oResizeMenu.close();
		}

		sTargetAreaId = e.currentTarget.getAttribute("id");
		oCurrentlyHoveredCell = null;

		if (e.originalEvent.touches && e.originalEvent.touches.length) {
			e = e.originalEvent.touches[0];
		} else if (e.originalEvent.changedTouches && e.originalEvent.changedTouches.length) {
			e = e.originalEvent.changedTouches[0];
		}

		iLastMouseX = e.pageX;
		iLastMouseY = e.pageY;
		bTouchStartReceived = true;
		bMoveAction = false;

		if (oTimeout) {
			window.clearTimeout(oTimeout);
			oTimeout = null;
		}
		oTimeout = setTimeout(function () {
			bTouchStartReceived = false;
			bMoveAction = false;

			var oCell = getMobileResizeableCell(e);
			if (oCell) {
				ensureResizeMenu();
				var oDomCell = $(document.getElementById(oCell.getId()));
				if (oDomCell.length > 0) {
					var eDock = sap.ui.core.Popup.Dock;
					// provide context (i. e. the selected cell) for selection event
					oResizeMenu.getItems()[0].oSelectedCell = oCell;
					oResizeMenu.open(false /* First item already highlighted */,
							oDomCell /* Dom reference which gets the focus back when the menu is closed */,
							eDock.BeginBottom, /* "Edge" of the menu (see sap.ui.core.Popup) */
							eDock.BeginTop, /* "Edge" of the related opener position (see sap.ui.core.Popup) */
							oDomCell, /* Related opener position (see sap.ui.core.Popup) */
							0 + " " + 0, /* Offset */
							sap.ui.core.Collision.flip /* Collision detection */);

				}
			}
		}, iDelay);
	}
	
	function handleHeaderScrolling(iDx, iAbsDx) {
		var oHeaderScrollbar = oCrosstab.getHorizontalHeaderScrollbar();
		if (oHeaderScrollbar) {
			iOldHScrollPos = oHeaderScrollbar.getScrollPosition();
			iNewHScrollPos = Math.max(iOldHScrollPos - iDx, 0);
			if (iAbsDx > 0) {
				oCrosstab.scrollHeaderHorizontal(iNewHScrollPos);
			}
		}
	}
	
	function handleDataScrolling(iDx, iDy, iAbsDx, iAbsDy) {
		if (oCrosstab.getPropertyBag().isPixelScrolling()) {
			if (oVScrollbar) {
				iOldVScrollPos = oVScrollbar.getScrollPosition();
				iNewVScrollPos = Math.max(iOldVScrollPos - iDy, 0);
			}
			if (oHScrollbar) {
				iOldHScrollPos = oHScrollbar.getScrollPosition();
				iNewHScrollPos = Math.max(iOldHScrollPos - iDx, 0);
			}
			if (oVScrollbar && iAbsDy > 0) {
				oCrosstab.scrollVertical(iNewVScrollPos);
			}
			if (oHScrollbar && iAbsDx > 0) {
				oCrosstab.scrollHorizontal(iNewHScrollPos);
			}

		} else {
			if (oPopup.getOpenState() === sap.ui.core.OpenState.CLOSED) {
				oPopup.open(-1);
			}
			if (oVScrollbar) {
				if (oCrosstab.getRenderEngine().isVScrolledToEnd()) {
					if (sap.zen.crosstab.utils.Utils.sign(iDy) > 0) {
						iVScrollCnt -= sap.zen.crosstab.utils.Utils.sign(iDy);
					} else {
						iVScrollCnt = 0;
					}
				} else {
					iVScrollCnt -= sap.zen.crosstab.utils.Utils.sign(iDy);
				}
				iOldVScrollPos = oRowHeaderArea.getRenderStartRow();
				iNewVScrollPos = Math.max(Math.floor(iVScrollCnt / iIpadFactor) + iOldVScrollPos, 0);
				iNewVScrollPos = Math.min(oDataArea.getRowCnt() - 1, iNewVScrollPos);
			}

			if (oHScrollbar) {
				if (oCrosstab.getRenderEngine().isHScrolledToEnd()) {
					if (sap.zen.crosstab.utils.Utils.sign(iDx) > 0) {
						iHScrollCnt -= sap.zen.crosstab.utils.Utils.sign(iDx);
					} else {
						iHScrollCnt = 0;
					}
				} else {
					iHScrollCnt -= sap.zen.crosstab.utils.Utils.sign(iDx);
				}
				iOldHScrollPos = oColHeaderArea.getRenderStartCol();
				iNewHScrollPos = Math.max(Math.floor(iHScrollCnt / iIpadFactor) + iOldHScrollPos, 0);
				iNewHScrollPos = Math.min(oDataArea.getColCnt() - 1, iNewHScrollPos);
			}

			rerenderRowColPopup();
		}
	}

	function onTouchMove (e) {
		sap.zen.crosstab.utils.Utils.cancelEvent(e);
		if (bTouchStartReceived == false) {
			return true;
		}
		
		if (e.originalEvent.touches && e.originalEvent.touches.length) {
			e = e.originalEvent.touches[0];
		} else if (e.originalEvent.changedTouches && e.originalEvent.changedTouches.length) {
			e = e.originalEvent.changedTouches[0];
		}

		var actMouseX = e.pageX;
		var actMouseY = e.pageY;

		var iDx = actMouseX - iLastMouseX;
		var iDy = actMouseY - iLastMouseY;
		
		var iAbsDy = Math.abs(iDy);
		var iAbsDx = Math.abs(iDx);

		if (iAbsDy > iAbsDx && iAbsDx < 10) {
			iDx = 0;
			iAbsDx = 0;
		} else if (iAbsDx > iAbsDy && iAbsDy < 10) {
			iDy = 0;
			iAbsDy = 0;
		}
		
		if (iDx == 0 && iDy == 0) {
			bMoveAction = false;
			return true;
		}
		
		bMoveAction = true;

		if (oTimeout) {
			window.clearTimeout(oTimeout);
			oTimeout = null;
		}

		oVScrollbar = oCrosstab.getVScrollbar();
		oHScrollbar = oCrosstab.getHScrollbar();

		bIsHeaderScrolling = false;
		if (sTargetAreaId === oRowHeaderArea.getId()) {
			bIsHeaderScrolling = oCrosstab.isHeaderHScrolling() && (iDx !== 0); 
			if (!bIsHeaderScrolling) {
				iDx = 0;
				iAbsDx = 0;
			}
		} else if (sTargetAreaId === oColHeaderArea.getId()) {
			iDy = 0;
			iAbsDy = 0;
		} else if (sTargetAreaId === oDimensionHeaderArea.getId()) {
			bIsHeaderScrolling = oCrosstab.isHeaderHScrolling() && (iDx !== 0); 
			if (!bIsHeaderScrolling) {
				iDx = 0;
				iAbsDx = 0;
			}
			iDy = 0;
			iAbsDy = 0;
		}
		
		if (bIsHeaderScrolling === true) {
			handleHeaderScrolling(iDx, iAbsDx);
		} else {
			handleDataScrolling(iDx, iDy, iAbsDx, iAbsDy);
		}

		iLastMouseX = e.pageX;
		iLastMouseY = e.pageY;
	}

	function onTouchEnd (e) {
		sap.zen.crosstab.utils.Utils.cancelEvent(e);

		if (oTimeout) {
			window.clearTimeout(oTimeout);
			oTimeout = null;
		}

		if (bTouchStartReceived == false) {
			return true;
		}
		if (!bMoveAction) {
			oEventHandler.executeOnClickAction(e);
		}

		bTouchStartReceived = false;
		bMoveAction = false;

		if (!bIsHeaderScrolling) {
			if (!oCrosstab.getPropertyBag().isPixelScrolling()) {
				if ((oPopup.getOpenState() === sap.ui.core.OpenState.OPEN) || (oPopup.getOpenState() === sap.ui.core.OpenState.OPENING)) {
					oPopup.close();
				}
				var bReattachEvents = false;
				if (iNewVScrollPos !== iOldVScrollPos) {
					oCrosstab.scrollVertical(iNewVScrollPos);
					bReattachEvents = true;
				}
				if (iNewHScrollPos !== iOldHScrollPos) {
					oCrosstab.scrollHorizontal(iNewHScrollPos);
					bReattachEvents = true;
				}

				if (bReattachEvents === true) {
					oEventHandler.attachEvents();
				}
			}
			iVScrollCnt = 0;
			iHScrollCnt = 0;
		}
	}

	this.registerTouchEvents = function (oDomRenderSizeDiv) {
		prepareRowColPopup();

		// TOUCHSTART
		// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		var sEventToHandle = "touchstart";
		if (oCrosstab.getPropertyBag().isTestMobileMode() && !oCrosstab.getPropertyBag().isMobileMode()) {
			sEventToHandle = "mousedown";
		}
		oDomDataArea.unbind(sEventToHandle);
		oDomDataArea.bind(sEventToHandle, onTouchStart);

		oDomRowHeaderArea.unbind(sEventToHandle);
		oDomRowHeaderArea.bind(sEventToHandle, onTouchStart);

		oDomColHeaderArea.unbind(sEventToHandle);
		oDomColHeaderArea.bind(sEventToHandle, onTouchStart);

		oDomDimensionHeaderArea.unbind(sEventToHandle);
		oDomDimensionHeaderArea.bind(sEventToHandle, onTouchStart);

		// TOUCHMOVE
		// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		sEventToHandle = "touchmove";
		if (oCrosstab.getPropertyBag().isTestMobileMode() && !oCrosstab.getPropertyBag().isMobileMode()) {
			sEventToHandle = "mousemove";
		}
		oDomRenderSizeDiv.unbind(sEventToHandle);
		oDomRenderSizeDiv.bind(sEventToHandle, onTouchMove);

		// TOUCHEND
		// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		sEventToHandle = "touchend";
		if (oCrosstab.getPropertyBag().isTestMobileMode() && !oCrosstab.getPropertyBag().isMobileMode()) {
			sEventToHandle = "mouseup";
		}
		oDomRenderSizeDiv.unbind(sEventToHandle);
		oDomRenderSizeDiv.bind(sEventToHandle, onTouchEnd);
	};
	
	this.setColResizer = function(poColResizer) {
		oColResizer = poColResizer;
	};
}
