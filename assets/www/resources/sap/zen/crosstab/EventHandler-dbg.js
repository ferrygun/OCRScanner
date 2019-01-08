jQuery.sap.declare("sap.zen.crosstab.EventHandler");
jQuery.sap.require("sap.zen.crosstab.TouchHandler");
jQuery.sap.require("sap.zen.crosstab.SelectionHandler");
jQuery.sap.require("sap.zen.crosstab.rendering.CrossRequestManager");
jQuery.sap.require("sap.zen.crosstab.rendering.RenderingConstants");
jQuery.sap.require("sap.zen.crosstab.utils.Utils");
jQuery.sap.require("sap.zen.crosstab.keyboard.CrosstabKeyboardNavHandler");
jQuery.sap.require("sap.zen.crosstab.HeaderResizer");
jQuery.sap.require("sap.zen.crosstab.ColResizer");

sap.zen.crosstab.EventHandler = function (oCrosstab) {
	"use strict";
	
	var that = this;
	var oRenderEngine = oCrosstab.getRenderEngine();
	var oCrossRequestManager = oRenderEngine.getCrossRequestManager();
	var oDataArea = oCrosstab.getDataArea();
	var oRowHeaderArea = oCrosstab.getRowHeaderArea();
	var oColHeaderArea = oCrosstab.getColumnHeaderArea();
	var oDimensionHeaderArea = oCrosstab.getDimensionHeaderArea();
	var oHighlightingInfo = null;
	var oKeyboardHandler = new sap.zen.crosstab.keyboard.CrosstabKeyboardNavHandler(oCrosstab, this);
	var sMouseDownTargetId = null;
	var bPreventClickAction = false;
	var oTouchHandler = null;
	var sCurrentInputFieldText = "";
	var oInputField = null;
	var oHeaderResizer = null;
	var oColResizer = null;

	this.handleHierarchyClick = function (e, sTargetId, sClickAction) {
		var oCell = getCellById(sTargetId);
		var sHierarchyAction = oCell.getHierarchyAction();
		var sDrillState = oCell.getDrillState();
		if (sDrillState !== "L") {
			oCrossRequestManager.saveTableDimensions();
			oCrossRequestManager.saveHScrollInfo(sClickAction);
			oCrossRequestManager.saveVScrollInfo(sClickAction);
			executeAction(sHierarchyAction);
		}
		sap.zen.crosstab.utils.Utils.cancelEvent(e);
	};

	this.handleSortClick = function (e, sTargetId, sClickAction) {
		var oCell = getCellById(sTargetId);
		var sSortAction = oCell.getSortAction();
		if (sSortAction || oCrosstab.getTestProxy().getTestAction()) {
			oCrossRequestManager.saveVScrollInfo(sClickAction);
			oCrossRequestManager.saveHScrollInfo(sClickAction);
			oCrossRequestManager.saveColWidths();
			if (!oCrosstab.getTestProxy().getTestAction()) {
				executeAction(sSortAction);
			}
		}
		sap.zen.crosstab.utils.Utils.cancelEvent(e);
	};

	this.findTargetId = function (oDomTarget) {
		var sTargetId = null;
		var oJqClosestDiv;
		var sCellId;
		
		sCellId = $(oDomTarget).attr("xtabspacer-cellid");
		if (sCellId && sCellId.length > 0) {
			sTargetId = sCellId;
		} else {
			oJqClosestDiv = $(oDomTarget).closest("div");
			if (oJqClosestDiv.length > 0) {
				var sId = oJqClosestDiv.attr("id");
				if (sId) {
					var idx = sId.indexOf("_contentDiv");
					if (idx > -1) {
						sTargetId = sId.slice(0, idx);
					}
				}
			}
		}
		return sTargetId;
	};

	this.executeOnClickAction = function (e) {
		if (bPreventClickAction) {
			return;
		}
		sMouseDownTargetId = null;
		bPreventClickAction = false;
		var sTargetId = e.target.id;

		if (!sTargetId) {
			sTargetId = that.findTargetId(e.target);
		}

		if (!sTargetId) {
			return;
		}
		var sClickAction = getActionById(sTargetId);

		if (sClickAction === "sort") {
			that.handleSortClick(e, sTargetId, sClickAction);
		} else if (sClickAction === "hier") {
			that.handleHierarchyClick(e, sTargetId, sClickAction);
		} else if (sClickAction === "__ce") {
			that.handleClickOnCell(e, sTargetId);
		} else if (sClickAction === "vhlp") {
			that.handleValueHelpClick(sTargetId);
		}
		sap.zen.crosstab.utils.Utils.cancelEvent(e);
	};
	
	this.handleClickOnCell = function(e, sTargetId){
		if (oCrosstab.hasLoadingPages()) {
			sap.zen.crosstab.utils.Utils.cancelEvent(e);
			return;
		}
		
		if (sTargetId) {
			var sCellId = oCrosstab.getUtils().getCellIdFromContenDivId(sTargetId);
			if (sCellId) {
				var oModelCell = sap.ui.getCore().getControl(sCellId);
				if (oModelCell) {
					if(oModelCell.isEntryEnabled()){
						that.handleInputEnabledCell(sTargetId, -1, -1);						
					} else {
						if(oCrosstab.getSelectionMode() !== undefined && oCrosstab.getSelectionMode() !== ""){
							var sFlag = "";
							if(e.ctrlKey){
								sFlag = "CTRL";
							} else if(e.shiftKey){
								sFlag = "SHIFT";
							}
							oCrosstab.getSelectionHandler().handleCellClick(oModelCell, sFlag);	
						}
					}
				}
			}
		}
	};	
	
	this.postPlanningValue = function () {
		if (oCrosstab.isPlanningMode() === true && oInputField && oInputField.length > 0) {
			var oJqInputField = $(document.activeElement);
			if (oJqInputField.is("input") && oInputField.attr("id") === oJqInputField.attr("id")) {
				var sInputFieldValueText = oInputField.val() || "";
				if (sInputFieldValueText !== sCurrentInputFieldText) {
					oInputField.blur();
				}
			}
		}
	};

	this.provideInputEnabledCell = function (oModelCell, sTargetId, oContentDiv, iSelectionStartPos, iSelectionEndPos) {
		oInputField = oContentDiv.find("input");

		if (oInputField.length === 0) {
			var sRenderText = oContentDiv.text();
			var html = oContentDiv.html();
			var bCellIsDataCell = oModelCell.getArea().isDataArea();

			var sSetContentDivWidth = null;

			var executeTransferData = function (sValue) {
				// Cut away the unit if the input was provided with a unit, otherwise the input is invalid
				var sUnit = oModelCell.getUnit();
				if (sUnit && sUnit !== "") {
					var iUnitIndex = sValue.toUpperCase().indexOf(sUnit.toUpperCase());
					if (iUnitIndex !== -1) {
						if (iUnitIndex === 0) {
							// leading unit
							sValue = sValue.substring(iUnitIndex + sUnit.length);
						} else {
							// trailing unit
							sValue = sValue.substring(0, iUnitIndex);
						}

					}
				}

				var iOffset = oCrosstab.calculateOffset(oModelCell);

				// Trim the input, leading and trailing whitespaces lead to errors
				sValue = $.trim(sValue);

				var sTransferDataCommand = oCrosstab.getTransferDataCommand();
				sTransferDataCommand = sTransferDataCommand.replace("__ROW__", oModelCell.getRow() + "");
				sTransferDataCommand = sTransferDataCommand.replace("__COL__", (oModelCell.getCol() - iOffset) + "");
				sTransferDataCommand = sTransferDataCommand.replace("__VALUE__", sValue);
				sTransferDataCommand = sTransferDataCommand.replace("__CTYPE__", oModelCell.getPassiveCellType());

				oCrossRequestManager.saveVScrollInfo("plan");
				oCrossRequestManager.saveHScrollInfo("plan");
				oCrossRequestManager.saveColWidths();

				executeAction(sTransferDataCommand, true);
			};

			var onLoseFocus = function (e) {
				if (oInputField.val() !== sRenderText) {
					executeTransferData(oInputField.val());

					// This prevents that the previous entry shows up again in the cell while waiting for the delta with
					// the new value
					var sEncodedRenderText = $('<div/>').text(sRenderText).html();
					html = html.replace(sEncodedRenderText, oInputField.val());
				}
				onFocusLost(e);
			};
			
			var checkTargetIsInCrosstab = function(e) {
				var bIsInCrosstab = true;
				var sTargetId = null;
				var oJqTableDiv = null;
				var oJqTarget = null;
				// do keep focus if a value help is opening although the newly focused element is not part of the crosstab
				if (e && e.relatedTarget && e.relatedTarget.id && oCrosstab.getValueHelpStatus() !== sap.zen.crosstab.VHLP_STATUS_OPENING) {
					// does not work in FireFox yet (see https://bugzilla.mozilla.org/show_bug.cgi?id=962251)
					sTargetId = e.relatedTarget.id;
					oJqTarget = $(document.getElementById(sTargetId));
					oJqTableDiv = oCrosstab.getTableDiv();
					bIsInCrosstab = oJqTarget.closest(oJqTableDiv).length > 0;
				}
				return bIsInCrosstab;
			};

			var onFocusLost = function (e) {
				var oJqDiv = $(document.getElementById(sTargetId + "_contentDiv"));
				oJqDiv.html(html);

				if (sSetContentDivWidth && bCellIsDataCell) {
					oJqDiv.width(sSetContentDivWidth);
				}
						
				if (checkTargetIsInCrosstab(e) === true) {
					oJqDiv.focus();
				} else {
					oKeyboardHandler.reset();
					sCurrentInputFieldText = "";
					oInputField.off("keydown focusout");
					oInputField = null;
				}
			};

			var onInputFieldKeyDown = function (e) {
				if (e.which === 27) {
					onFocusLost();
					sap.zen.crosstab.utils.Utils.cancelEvent(e);
				}
				if (e.which === 13) {
					if (oInputField.val() !== sRenderText) {
						sap.zen.crosstab.utils.Utils.cancelEvent(e);
						executeTransferData(oInputField.val());
					} else {
						onFocusLost();
						if (oCrosstab.isIE8Mode()) {
							oKeyboardHandler.keyboardNavKeyHandler(e);
						}
					}
				}
				if (e.which === 38 || e.which === 40) {
					// enable vert keyboard navigation
					return true;
				}
				if (e.which === 37 || e.which === 39) {
					if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
						// left/right keys must work in the input field to move back and forward in the text string.
						// however, left/right keys must not lead to leaving the cell/input field.
						// Hence, just prevent bubbling of the event to the navigation key handler, but still execute
						// the
						// default
						sap.zen.crosstab.utils.Utils.stopEventPropagation(e);
					}
					return true;
				}
				// F4
				if (e.which === 115 && !bCellIsDataCell) {
					that.invokeValueHelp(oModelCell, "vhlp_" + oModelCell.getId());
				}
			};

			var iContentDivWidth = 0;
			// content Div handling for data cells
			if (bCellIsDataCell) {
				iContentDivWidth = oContentDiv.innerWidth();
				sSetContentDivWidth = sap.zen.crosstab.utils.Utils.getWidthFromStyle(oContentDiv);
			}
			oContentDiv.html("<input id=\"" + sTargetId + "_input" + "\" type=\"text\" value=\"" + sRenderText
					+ "\" />");

			if (bCellIsDataCell) {
				oContentDiv.width(iContentDivWidth + "px");
			}
			oInputField = $(document.getElementById(sTargetId + "_input"));
			if (sap.zen.crosstab.utils.Utils.isMainMode()) {
				oInputField.addClass("sapzencrosstab-EntryEnabledInput-MainMode");
			} else {
				oInputField.addClass("sapzencrosstab-EntryEnabledInput");				
			}
			oInputField.on("keydown",onInputFieldKeyDown);
			oInputField.focus();
			oCrosstab.getUtils().selectTextInInputField(oInputField, iSelectionStartPos, iSelectionEndPos);
			oInputField.on("focusout", onLoseFocus);
		} else {
			oCrosstab.getUtils().selectTextInInputField(oInputField, iSelectionStartPos, iSelectionEndPos);
		}
		sCurrentInputFieldText = oInputField.val() || "";
		// oJqCurrentInputField = oInputField;
	};
	
	this.handleValueHelpClick = function (sTargetId) {
		var oCell = getCellById(sTargetId);
		that.invokeValueHelp(oCell, sTargetId);
	};
	
	this.invokeValueHelp = function(oCell, sTargetId) {
		if (oCell) {
			oKeyboardHandler.focusNewCell(oCell, -1, -1);
			var sCallValueHelpCommand = oCrosstab.getCallValueHelpCommand();

			var iOffset = oCrosstab.calculateOffset(oCell);

			oCrossRequestManager.saveVScrollInfo("plan");
			oCrossRequestManager.saveHScrollInfo("plan");
			oCrossRequestManager.saveColWidths();

			sCallValueHelpCommand = sCallValueHelpCommand.replace("__ROW__", oCell.getRow());
			sCallValueHelpCommand = sCallValueHelpCommand.replace("__COL__", oCell.getCol() - iOffset);
			sCallValueHelpCommand = sCallValueHelpCommand.replace("__DOM_REF_ID__", sTargetId);
			executeAction(sCallValueHelpCommand, true);
		}
	};

	this.handleInputEnabledCell = function (sTargetId, iSelectionStartPos, iSelectionEndPos) {
		if (sTargetId) {
			sTargetId = oCrosstab.getUtils().getCellIdFromContenDivId(sTargetId);
			if (sTargetId) {
				var oModelCell = sap.ui.getCore().getControl(sTargetId);
				if (oModelCell) {
					if (oModelCell.getArea().isDataArea() || oModelCell.getArea().isRowHeaderArea()) {
						oKeyboardHandler.focusNewCell(oModelCell, iSelectionStartPos, iSelectionEndPos);
					}
				}
			}
		}
	};

	this.sendSelectCommand = function (oCell) {
		var iRow = -1;
		var iCol = -1;
		var sAxis = "";

		if (oCell) {
			var oArea = oCell.getArea();
			// BICS values!
			if (oArea.isRowHeaderArea()) {
				sAxis = "ROWS";
			} else if (oArea.isColHeaderArea()) {
				sAxis = "COLUMNS";
			} else {
				sAxis = "DATA";
			}
			iRow = oCell.getRow();
			iCol = oCell.getCol();
		}

		var onSelectJsCommand = oCrosstab.getOnSelectCommand();
		onSelectJsCommand = onSelectJsCommand.replace("__ROW__", iRow + "");
		onSelectJsCommand = onSelectJsCommand.replace("__COL__", iCol + "");
		onSelectJsCommand = onSelectJsCommand.replace("__AXIS__", sAxis);
		executeAction(onSelectJsCommand, true);
	};
	
	this.getContextElement = function(iClientX, iClientY) {
		var aDisabledElements = [];
		var i = 0;
		var oJqElement = $(document.elementFromPoint(iClientX, iClientY));
		
		var oJqClosest = oJqElement.closest(".zenControl");
		var sId = oJqClosest.attr("id");
		sId = oJqElement.attr("id");
		while (sId && sId.indexOf("droparea") > -1) {
			aDisabledElements.push(oJqElement);
			oJqElement.css("display", "none");
			oJqElement = $(document.elementFromPoint(iClientX, iClientY));
			sId = oJqElement.attr("id");
		}
		for (i = 0; i < aDisabledElements.length; i++) {
			aDisabledElements[i].css("display", "block");
		}
		
		return oJqElement;
	};
	
	this.onContextMenuClick = function(e) {
		var oJqClickedElement = that.getContextElement(e.clientX, e.clientY);
		var oContextMenu = oCrosstab.createContextMenu();
		var oContext = oContextMenu.getContext(oJqClickedElement);
		
		if(oContext){
			var sContextMenuCommand = oCrosstab.getPropertyBag().getContextMenuCommand();
		
			sContextMenuCommand = sContextMenuCommand.replace("__AXIS__", oContext.sAxis);
			sContextMenuCommand = sContextMenuCommand.replace("__ROW__", oContext.iRow);
			sContextMenuCommand = sContextMenuCommand.replace("__COL__", oContext.iCol);
			sContextMenuCommand = sContextMenuCommand.replace("__ID__", "CONTEXT_MENU");
			sContextMenuCommand = sContextMenuCommand.replace("__DOM_REF_ID__", oJqClickedElement.attr("id"));
				
			if (sContextMenuCommand.indexOf("__REMOVE_SELECTION__") >= 0) {
				sContextMenuCommand = sContextMenuCommand.replace("__REMOVE_SELECTION__", oContext.bRemoveSelection);
			}
			var oDynamicMenuService = sap.bi.framework.getService(null,  "zen.rt.components.dynamicmenu");
			oDynamicMenuService.showDynamicMenu("ExpandedMenuBuilder",  oJqClickedElement.context,  "",  {"command":sContextMenuCommand}, "", ["crosstabActions"],  "",  false);
		}
		sap.zen.crosstab.utils.Utils.cancelEvent(e);
		oCrosstab.enableClick();
	};

	this.attachEvents = function () {
		var bAttachMouseMove = false;
		var oJqRenderSizeDiv = oCrosstab.getRenderSizeDiv();
		var oJqTableDiv = oCrosstab.getTableDiv();
		//var oJqTitleDiv = oCrosstab.getTitleDiv();
		
		oJqRenderSizeDiv.unbind("mousedown");
		oJqRenderSizeDiv.bind("mousedown", this.onMouseDown);

		if (oCrosstab.getPropertyBag().isMobileMode() || oCrosstab.getPropertyBag().isTestMobileMode()) {
			oJqRenderSizeDiv.unbind('click');
			oJqRenderSizeDiv.bind('click', function (e) {
				sap.zen.crosstab.utils.Utils.cancelEvent(e);
			});

			oJqRenderSizeDiv.unbind('mousedown');
			oJqRenderSizeDiv.bind('mousedown', function (e) {
				sap.zen.crosstab.utils.Utils.cancelEvent(e);
			});

			oTouchHandler = new sap.zen.crosstab.TouchHandler(this, oCrosstab);
			oTouchHandler.registerTouchEvents(oJqRenderSizeDiv);
			
			oKeyboardHandler.setEnabled(false);

			
			// we need at least a ColResizer instance in mobile mode so we can
			// expand the columns there -> keep old functionality for now
			if (oCrosstab.getPropertyBag().isEnableColResize() === true) {
				var oTouchColResizer = new sap.zen.crosstab.ColResizer(oCrosstab);
				oTouchHandler.setColResizer(oTouchColResizer);
			}
			
			/*if (oCrosstab.getPropertyBag().getTitleDisplayMode() && sap.zen.designmode && sap.zen.designmode.isRuntimeAuthoringMode()){
				oJqTitleDiv.unbind('click');
				oJqTitleDiv.bind('click', this.executeOnClickAction);
				oJqTitleDiv.unbind('keyup');
				oJqTitleDiv.bind('keyup', this.handleOnEnterAction);	
				oJqTitleDiv.unbind('focusout');
				oJqTitleDiv.bind('focusout', this.handleTitleFocusOut);
			}*/
			
			oTouchHandler.registerTouchEvents(oJqTitleDiv);
		} else {
			/*if (oCrosstab.getPropertyBag().isLumiraContextMenu()) {
				oJqRenderSizeDiv.unbind('contextmenu');
				oJqRenderSizeDiv.bind('contextmenu', this.onContextMenuClick);
			}*/
			
			oJqRenderSizeDiv.unbind("mouseup", this.onMouseUp);
			oJqRenderSizeDiv.bind("mouseup", this.onMouseUp);
			oJqTableDiv.unbind("mouseup", this.onMouseUp);
			oJqTableDiv.bind("mouseup", this.onMouseUp);

			oJqRenderSizeDiv.unbind('click');
			oJqRenderSizeDiv.bind('click', this.executeOnClickAction);
			
			if (oCrosstab.isSelectable() === true && oCrosstab.isHoveringEnabled() === true) {
				oJqRenderSizeDiv.unbind('mouseover');
				oJqRenderSizeDiv.bind('mouseover', this.executeOnMouseEnter);

				oJqRenderSizeDiv.unbind('mouseout');
				oJqRenderSizeDiv.bind('mouseout', this.executeOnMouseOut);
			}
			
			// CHANGE THE FOLLOWING CALL TO DISABLE KEYBOARD HANDLER: single point of entry
			oKeyboardHandler.setEnabled(oCrosstab.isPlanningMode());
			oKeyboardHandler.attachEvents(oJqRenderSizeDiv);
			
			// header horizontal resize
			if (oCrosstab.getUserHeaderWidthCommand() && oCrosstab.getUserHeaderWidthCommand().length > 0) {
				oHeaderResizer = new sap.zen.crosstab.HeaderResizer(oCrosstab);
				oHeaderResizer.initialize();
				bAttachMouseMove = true;
			}
			
			// Column resize
			if (oCrosstab.getPropertyBag().isEnableColResize() === true) {
				oColResizer = new sap.zen.crosstab.ColResizer(oCrosstab);
				oColResizer.initialize();
				bAttachMouseMove = true;
			}
			
			if (bAttachMouseMove === true) {
				oJqRenderSizeDiv.unbind("mousemove", this.onMouseMove);
				oJqRenderSizeDiv.bind("mousemove", this.onMouseMove);
			}
			
			// Title inline editing
			/*if (oCrosstab.getPropertyBag().getTitleDisplayMode() && sap.zen.designmode && sap.zen.designmode.isRuntimeAuthoringMode()){
				oJqTitleDiv.unbind('click');
				oJqTitleDiv.bind('click', this.executeOnClickAction);
				oJqTitleDiv.unbind('keyup');
				oJqTitleDiv.bind('keyup', this.handleOnEnterAction);	
				oJqTitleDiv.unbind('focusout');
				oJqTitleDiv.bind('focusout', this.handleTitleFocusOut);
			}*/		
		}
	};

	this.onMouseMove = function(e) {
		if (oColResizer && oColResizer.isResizeAction()) {
			oColResizer.onMouseMove(e);
		} else if (oHeaderResizer && oHeaderResizer.isResizeAction()) {
			oHeaderResizer.onMouseMove(e);
		}
	};
	
	this.onMouseDown = function (e) {
		var sTargetId = e.target.id;
		var sClickAction = getActionById(sTargetId);
		sMouseDownTargetId = sTargetId;
	};

	function checkMouseUpInSameCell (sCellId, e) {
		var bInSameCell = false;
		var oDomCell = document.getElementById(sCellId);
		if (oDomCell) {
			var oRect = oDomCell.getBoundingClientRect();
			var bHMatches = (oRect.left < e.clientX) && (e.clientX < oRect.right);
			var bVMatches = (oRect.bottom > e.clientY) && (e.clientY > oRect.top);
			bInSameCell = bHMatches && bVMatches;
		}
		return bInSameCell;
	}

	this.onMouseUp = function (e) {
		if (oColResizer && oColResizer.isResizeAction()) {
			oColResizer.onMouseUp(e);
		} else if (oHeaderResizer && oHeaderResizer.isResizeAction()) {
			oHeaderResizer.onMouseUp(e);
		} else {
			bPreventClickAction = false;
			if (sMouseDownTargetId) {
				var sCellId = oCrosstab.getUtils().getCellIdFromContenDivId(sMouseDownTargetId);
				// prevent action during multiple selection of cells. Make sure we stay in the same cell
				if (checkMouseUpInSameCell(sCellId, e)) {
					var oCell = sap.ui.getCore().getControl(sCellId);
					if (oCell) {
						if (oCrosstab.isPlanningMode()) {
							var oDomContainerDiv = document.getElementById(sMouseDownTargetId);
							var oPositions = null;
							if (oDomContainerDiv) {
								oPositions = oCrosstab.getUtils().getSelectionParams(oDomContainerDiv);
							}
							if (oPositions.iSelectionStartPos >= 0 || oPositions.iSelectionEndPos >= 0) {
								bPreventClickAction = true;
								that.handleInputEnabledCell(e.target.id, oPositions.iSelectionStartPos,
										oPositions.iSelectionEndPos);
							}
						}
					}
				} else {
					if (!oCrosstab.isDragAction()) {
						sap.zen.crosstab.utils.Utils.cancelEvent(e);
						sap.zen.crosstab.utils.Utils.stopEventPropagation(e);
					}
					bPreventClickAction = true;
				}
			}
		}
	};

	this.restoreFocusOnCell = function () {
		oKeyboardHandler.restoreFocusOnCell();
	};

	function getActionById (sId) {
		var sAction = sId.slice(0, 4);
		return sAction;
	}

	function getCellById (sId) {
		var sCellId = sId.slice(5);
		return sap.ui.getCore().getControl(sCellId);
	}

	function executeAction (sAction, bDontShowLoading) {
		if (sAction) {
			if (!bDontShowLoading) {
				// oCrosstab.showLoadingIndicator();
			}
			oCrosstab.getUtils().executeCommandAction(sAction);
		}
	}
	
	this.handleHoverEntry = function(sTargetId) {	
		if (sTargetId) {
			var sCellId = oCrosstab.getUtils().getCellIdFromContenDivId(sTargetId);
			if (sCellId && sCellId !== undefined) {
				var oModelCell = sap.ui.getCore().getControl(sCellId);
				if (oModelCell && oModelCell !== undefined) {
					oCrosstab.getSelectionHandler().handleCellHoverEntry(oModelCell);	
				}
			}
		}
	};
	
	this.executeOnMouseEnter = function(e) {	
		var sPotentialAction = null;
		var sTargetId = e.target.id;
		
		if (oCrosstab.hasLoadingPages()) {
			sap.zen.crosstab.utils.Utils.cancelEvent(e);
			return;
		}

		if (!sTargetId) {
			sTargetId = that.findTargetId(e.target);
		}

		if (!sTargetId) {
			return;
		}
		sPotentialAction = getActionById(sTargetId);

		if (sPotentialAction === "__ce") {
			that.handleHoverEntry(sTargetId);
		}
		sap.zen.crosstab.utils.Utils.cancelEvent(e);
	};


	this.executeOnMouseOut = function(e) {
		oCrosstab.getSelectionHandler().handleCellHoverOut(e);
		sap.zen.crosstab.utils.Utils.cancelEvent(e);
	};

	this.enableClick = function() {
		bPreventClickAction = false;
		sMouseDownTargetId = null;
	};
	
	this.getColResizer = function() {
		return oColResizer;
	};
};