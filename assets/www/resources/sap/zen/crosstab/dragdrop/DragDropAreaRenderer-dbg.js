jQuery.sap.declare("sap.zen.crosstab.dragdrop.DragDropAreaRenderer");

sap.zen.crosstab.dragdrop.DragDropAreaRenderer = function (oCrosstab) {
	"use strict"
	
	var oHeaderInfo;
	var iMaxDimHeaderRow;
	var iMaxDimHeaderCol;
	var oPivotCell;
	var iDropAreaBeginMin;
	var iDropAreaMinTop;
	var iDropAreaMaxHeight;
	var iDropAreaMaxWidth;
	var bIsRtl;
	var oDragDropUtils;
	var oDimHeaderDropAreaAboveInfo = {"sIdSuffix" : "droparea_above", "sCssClassName" : "sapzencrosstab-rowAboveCellDropArea"};
	var oDimHeaderDropAreaBelowInfo = {"sIdSuffix" : "droparea_below", "sCssClassName" : "sapzencrosstab-rowBelowCellDropArea"};
	var oDimHeaderDropAreaBeforeInfo = {"sIdSuffix" : "droparea_before", "sCssClassName" : "sapzencrosstab-columnBeforeCellDropArea"};
	var oDimHeaderDropAreaAfterInfo = {"sIdSuffix" : "droparea_after", "sCssClassName" : "sapzencrosstab-columnAfterCellDropArea"};
	var oDimHeaderDropAreaAfterWithSortInfo = {"sIdSuffix" : "droparea_after", "sCssClassName" : "sapzencrosstab-columnAfterCellDropAreaWithSort"};
	
	this.addStylesToHtmlString = function(sHtml, oCssStyles) {
		if (oCssStyles) {
			for (var sStyle in oCssStyles) {
				if (oCssStyles.hasOwnProperty(sStyle)) {
					sHtml = sHtml + sStyle + ":" + oCssStyles[sStyle] + ";";
				}
			}
		}
		return sHtml;
	};
	
	this.applyCssStyles = function(oJqElement, oCssStyles) {	
		if (oCssStyles && oJqElement) {
			for (var sStyle in oCssStyles) {
				if (oCssStyles.hasOwnProperty(sStyle)) {
					oJqElement.css(sStyle, oCssStyles[sStyle]);
				}
			}
		}
	};
	
	this.createDiv = function(oCell, sIdSuffix, sCssClassName, oCssStyles, oAfterBurnerStyles, fAfterBurnerFunction, bPrepend) {
		return this.createFlexDiv(oCell, oCrosstab.getRenderSizeDiv(), sIdSuffix, sCssClassName, oCssStyles, oAfterBurnerStyles, fAfterBurnerFunction, bPrepend);
	};
	
	this.createFlexDiv = function(oCell, oJqParent, sIdSuffix, sCssClassName, oCssStyles, oAfterBurnerStyles, fAfterBurnerFunction, bPrepend) {
		var sId = oCell.getId() + "_" + sIdSuffix;
		var oJqArea;
		var sHtml;
		
		oJqArea = $(document.getElementById(sId));
		if (oJqArea.length === 0) {
			sHtml = "<div id=\"" + sId + "\" class=\"" + sCssClassName + "\" style=\"";
			if (oCssStyles) {
				sHtml = this.addStylesToHtmlString(sHtml, oCssStyles);
			}
			sHtml = sHtml + "\"></div>";
			
			if (!bPrepend) {
				oJqParent.append(sHtml);
			} else {
				oJqParent.prepend(sHtml);
			}
			oJqArea = $(document.getElementById(sId));
			oJqArea.data("xtabcellid", oCell.getId());
		}
		
		if (oAfterBurnerStyles) {
			this.applyCssStyles(oJqArea, oAfterBurnerStyles);
		}
		
		if (fAfterBurnerFunction) {
			fAfterBurnerFunction(oJqArea);
		}
		
		return oJqArea;
	};
	
	this.createBeforeDropArea = function(oCell, oInfo) {
		var oRect;
		var iBegin;
		var iTop;
		var iHeight;
		var oStyles;
		
		oRect = oDragDropUtils.getBoundingClientRect(document.getElementById(oCell.getId()));			
		iBegin = (oRect.begin - iDropAreaBeginMin); 

		iTop = 0;
		iHeight = iDropAreaMaxHeight;
		
		if (oInfo.iTop) {
			iTop = oInfo.iTop - iDropAreaMinTop;
			iHeight = iDropAreaMaxHeight - iTop;
		} 
		
		if (oInfo.iBottom) {
			iHeight = oInfo.iBottom - iDropAreaMinTop - iTop;
		}
		
		oStyles = {"top" : iTop + "px", "height" : iHeight + "px"};
		
		if (bIsRtl) {
			oStyles.right = iBegin + "px";
		} else {
			oStyles.left = iBegin + "px";
		}
		
		return this.createDiv(oCell, oInfo.sIdSuffix, oInfo.sCssClassName, null, oStyles);
	};
	
	this.createAfterDropArea = function(oCell, oInfo) {
		var oRect;
		var iBegin;
		var sCssClassName;
		var oStyles = null;
		var fAfterBurner = null;
		var iTop;
		var iHeight;
		var sBegin;
		
		oRect = oDragDropUtils.getBoundingClientRect(document.getElementById(oCell.getId()));
		iBegin = (oRect.end - iDropAreaBeginMin); 
		
		iTop = 0;
		iHeight = iDropAreaMaxHeight;
		
		if (oInfo.iTop) {
			iTop = oInfo.iTop - iDropAreaMinTop;
			iHeight = iDropAreaMaxHeight - iTop;
		} 
		
		if (oInfo.iBottom) {
			iHeight = oInfo.iBottom - iDropAreaMinTop - iTop;
		}
		
		oStyles = {"top" : iTop + "px", "height" : iHeight + "px"};
		
		if (bIsRtl) {
			oStyles.right = iBegin + "px";
			sBegin = "right";
		} else {
			oStyles.left = iBegin + "px";
			sBegin = "left";
		}
		
		fAfterBurner = function(oJqArea) {
			oJqArea.css(sBegin, (iBegin - (oJqArea.outerWidth() / 2.0)) + "px");
		};

		return this.createDiv(oCell, oInfo.sIdSuffix, oInfo.sCssClassName, null, oStyles, fAfterBurner);
	};
	
	this.createAboveDropArea = function(oCell, oInfo) {
		var oRect;
		var iTop;
		var iWidth;
		var iBegin;
		var oStyles;
		
		oRect = oDragDropUtils.getBoundingClientRect(document.getElementById(oCell.getId()));
		iTop = oRect.top - iDropAreaMinTop;
		
		iBegin = 0;
		iWidth = iDropAreaMaxWidth;
		
		// mind the following: oInfo stuff is bounding client rect info
		// iLeft and iWidth to be calculated is stuff for CSS, relative to the render size DIV!
		// That also applies to the code found in the creation functions for the other drop areas
		if (oInfo.iBegin) {
			iBegin = (oInfo.iBegin - iDropAreaBeginMin); 
			iWidth = iDropAreaMaxWidth - iBegin;
		} 
		
		if (oInfo.iEnd) {
			iWidth = oInfo.iEnd - iDropAreaBeginMin - iBegin;
		}
		
		oStyles = {"top" : iTop + "px", "width" : iWidth + "px"};
		
		if (bIsRtl) {
			oStyles.right = iBegin + "px";
		} else {
			oStyles.left = iBegin + "px";
		}
		
		return this.createDiv(oCell, oInfo.sIdSuffix, oInfo.sCssClassName, null, oStyles);
	};
	
	this.createBelowDropArea = function(oCell, oInfo) {
		var oRect;
		var iTop;
		var oStyles = null;
		var fAfterBurner = null;
		var iWidth;
		var iBegin;
		
		oRect = oDragDropUtils.getBoundingClientRect(document.getElementById(oCell.getId()));
		iTop = oRect.bottom - iDropAreaMinTop;
		
		iBegin = 0;
		iWidth = iDropAreaMaxWidth;
		
		if (oInfo.iBegin) {
			iBegin = (oInfo.iBegin - iDropAreaBeginMin); 
			iWidth = iDropAreaMaxWidth - iBegin;
		} 
		
		if (oInfo.iEnd) {
			iWidth = oInfo.iEnd - iDropAreaBeginMin - iBegin;
		}
		
		oStyles = {"top" : iTop + "px", "width" : iWidth + "px"};
		
		if (bIsRtl) {
			oStyles.right = iBegin + "px";
		} else {
			oStyles.left = iBegin + "px";
		}
		
		fAfterBurner = function(oJqArea) {
			oJqArea.css("top", (iTop - (oJqArea.outerHeight() / 2.0)) + "px");
		};
		
		return this.createDiv(oCell, oInfo.sIdSuffix, oInfo.sCssClassName, null, oStyles, fAfterBurner);
	};
		
	this.createDropAreasForPivotDimHeaderCell = function(oCell) {
		var sScalingAxisName;
		
		if (iMaxDimHeaderCol === 0) {
			this.createBeforeDropArea(oCell, oDimHeaderDropAreaBeforeInfo);
		} else if (iMaxDimHeaderRow === 0) {
			this.createAboveDropArea(oCell, oDimHeaderDropAreaAboveInfo);
		} 
		this.createBelowDropArea(oCell, oDimHeaderDropAreaBelowInfo);
		this.createAfterDropArea(oCell, oCell.getSort() ? oDimHeaderDropAreaAfterWithSortInfo : oDimHeaderDropAreaAfterInfo);
	};
	
	this.checkNeedsDropAreaByLookAheadCell = function(oLookAheadCell, sAxisName, sDimensionName) {
		var bIncludeDropArea = true;
		var oLookAheadDimInfo = null;
			
		if (oLookAheadCell) {
			if (oLookAheadCell.isSplitPivotCell() === true) {
				oLookAheadDimInfo = oHeaderInfo.getDimensionInfoByRowCol(oLookAheadCell, sAxisName);
			} else {
				oLookAheadDimInfo = oHeaderInfo.getDimensionInfoByRowCol(oLookAheadCell);
			}
			if (oLookAheadDimInfo) {
				bIncludeDropArea = oLookAheadDimInfo.sDimensionName !== sDimensionName;
			}

		}
		return bIncludeDropArea;
	};
	
	this.createDropAreasForDimHeaderCell = function(oCell) {
		var sCssClassName = null;
		var sDimensionName = "";
		var bIncludeDropArea = false;
		var iLookAheadIndex;
		var oLookAheadCell = null;
		var iCol = oCell.getTableCol();
		var iRow = oCell.getTableRow();
		
		if (oCrosstab.getHeaderInfo().isBottomRightDimHeaderCell(oCell) === true) {
			if (iMaxDimHeaderCol === 0) {
				this.createBeforeDropArea(oCell, oDimHeaderDropAreaBeforeInfo);
			} else if (iMaxDimHeaderRow === 0) {
				this.createAboveDropArea(oCell, oDimHeaderDropAreaAboveInfo);
			}
			if (!oCell.getScalingAxis() || oCell.getScalingAxis() === "ROWS") {
				this.createBelowDropArea(oCell, oDimHeaderDropAreaBelowInfo);
			}
			if (!oCell.getScalingAxis() || oCell.getScalingAxis() === "COLS") {
				this.createAfterDropArea(oCell, oCell.getSort() ? oDimHeaderDropAreaAfterWithSortInfo : oDimHeaderDropAreaAfterInfo);
			}
		} else if ((iRow < iMaxDimHeaderRow && oCrosstab.getHeaderInfo().isRightColDimHeaderCell(oCell) === true) || (oCrosstab.getHeaderInfo().isBottomRowDimHeaderCell(oCell) === true && iCol < iMaxDimHeaderCol)) {
			// examine all cells except last cell in row/col
			sDimensionName = oHeaderInfo.getDimensionInfoByRowCol(oCell).sDimensionName;
			if (oCrosstab.getHeaderInfo().isBottomRowDimHeaderCell(oCell) === true) {
				if (iCol === 0) {
					this.createBeforeDropArea(oCell, oDimHeaderDropAreaBeforeInfo);
				}
				bIncludeDropArea = true;
				iLookAheadIndex = iCol + oCell.getColSpan();
				if (iLookAheadIndex <= iMaxDimHeaderCol) {
					oLookAheadCell = oCrosstab.getTableCellWithColSpan(iRow, iLookAheadIndex);
					bIncludeDropArea = (oLookAheadCell.getScalingAxis() && oLookAheadCell.getScalingAxis() === "ROWS") || this.checkNeedsDropAreaByLookAheadCell(oLookAheadCell, "ROWS", sDimensionName);
				}
				if (bIncludeDropArea) {
					this.createAfterDropArea(oCell, oCell.getSort() ? oDimHeaderDropAreaAfterWithSortInfo : oDimHeaderDropAreaAfterInfo);
				}
			}
			if (oCrosstab.getHeaderInfo().isRightColDimHeaderCell(oCell) === true) {
				if (iRow === 0) {
					this.createAboveDropArea(oCell, oDimHeaderDropAreaAboveInfo);
				}
				bIncludeDropArea = true;
				iLookAheadIndex = iRow + oCell.getRowSpan();
				if (iLookAheadIndex <= iMaxDimHeaderRow) {
					oLookAheadCell = oCrosstab.getTableCellWithRowSpan(iLookAheadIndex, iCol);
					bIncludeDropArea = (oLookAheadCell.getScalingAxis() && oLookAheadCell.getScalingAxis() === "COLS") || this.checkNeedsDropAreaByLookAheadCell(oLookAheadCell, "COLS", sDimensionName);
				}
				if (bIncludeDropArea === true) {
					this.createBelowDropArea(oCell, oDimHeaderDropAreaBelowInfo);
				}
			}
		}
	};
			
	this.init = function(poPivotCell, poDragDropUtils) {	
		oPivotCell = poPivotCell;
		oDragDropUtils = poDragDropUtils;
		oHeaderInfo = oCrosstab.getHeaderInfo();
		iMaxDimHeaderRow = oCrosstab.getTableMaxDimHeaderRow();
		iMaxDimHeaderCol = oCrosstab.getTableMaxDimHeaderCol();
		
		iDropAreaMaxHeight = oCrosstab.getRenderSizeDiv().outerHeight();
		iDropAreaMaxWidth = oCrosstab.getRenderSizeDiv().outerWidth();
		
		bIsRtl = oCrosstab.getPropertyBag().isRtl();

		var oRect = oDragDropUtils.getBoundingClientRect(oCrosstab.getRenderSizeDiv()[0]);
		iDropAreaBeginMin = oRect.begin;
		iDropAreaMinTop = oRect.top;		
	};
	
	this.renderDimHeaderDropAreas = function() {
		var iRow = 0;
		var iCol = 0;
		var oCell = null;
		var iMaxRow = oPivotCell.getTableRow();
		var iMaxCol = oPivotCell.getTableCol();
		
		// last row
		while (iCol < iMaxCol) {
			oCell = oCrosstab.getTableCellWithColSpan(iMaxRow, iCol);
			if (oCell) {
				this.createDropAreasForDimHeaderCell(oCell);
				iCol = iCol + oCell.getColSpan();
			}
		}
		// last col, including pivot cell
		while (iRow <= iMaxRow) {
			oCell = oCrosstab.getTableCellWithRowSpan(iRow, iMaxCol);
			if (oCell) {
				this.createDropAreasForDimHeaderCell(oCell);
				iRow = iRow + oCell.getRowSpan();
			}
		}
	};
		
	this.renderSplitPivotCellDragAreas = function(oCell, oJqCell) {
		if (oCrosstab.getPropertyBag().isRtl()) {
			this.createFlexDiv(oCell, oJqCell, "dragarea_rows", "sapzencrosstab-pivotCellRowsDimDragArea", 
				    {"position" : "absolute", 
			    	 "bottom" : "0px", 
		    		 "right" : "0px", 
		    		 "border-left" : "0px solid transparent;"},
		    		{
		    		 "border-bottom-width" : oJqCell.outerHeight() + "px",
		    		 "border-left-width" : oJqCell.outerWidth() + "px"
		    		},
		    		null,
		    		true);

			this.createFlexDiv(oCell, oJqCell, "dragarea_cols", "sapzencrosstab-pivotCellColsDimDragArea", 
			    	{"position" : "absolute", 
			         "top" : "0px", 
			         "left" : "0px", 
			         "border-right" : "0px solid transparent;"},
		    	    {							     
		     	     "border-top-width" : oJqCell.outerHeight() + "px",
			         "border-right-width" : oJqCell.outerWidth() + "px"
			        },
		    	    null,
			        true);
		} else {
			this.createFlexDiv(oCell, oJqCell, "dragarea_rows", "sapzencrosstab-pivotCellRowsDimDragArea", 
				    {"position" : "absolute", 
			    	 "bottom" : "0px", 
		    		 "left" : "0px", 
		    		 "border-right" : "0px solid transparent;"},
		    		{
		    		 "border-bottom-width" : oJqCell.outerHeight() + "px",
		    		 "border-right-width" : oJqCell.outerWidth() + "px"
		    		},
		    		null,
		    		true);
			
			this.createFlexDiv(oCell, oJqCell, "dragarea_cols", "sapzencrosstab-pivotCellColsDimDragArea", 
			    	{"position" : "absolute", 
			         "top" : "0px", 
			         "right" : "0px", 
			         "border-left" : "0px solid transparent;"},
		    	    {							     
		     	     "border-top-width" : oJqCell.outerHeight() + "px",
			         "border-left-width" : oJqCell.outerWidth() + "px"
			        },
		    	    null,
			        true);
		}
	};
		
	this.repositionDropAreasForHeaderScrolling = function() {
		var aDropAreas;
		var oJqDropArea;
		var iBegin;
		var oJqCell;
		var oCellRect;

		if (oCrosstab.isHeaderHScrolling()) {
			aDropAreas = oCrosstab.getRenderSizeDiv().find("div .sapzencrosstab-columnAfterCellDropArea, .sapzencrosstab-columnAfterCellDropAreaWithSort");	
			if (aDropAreas) {
				$.each(aDropAreas, function(iIndex, oDomDropArea) {
					oJqDropArea = $(oDomDropArea);
					oJqCell = oCrosstab.getRenderSizeDiv().find("#" + $.sap.encodeCSS(oJqDropArea.data("xtabcellid")));			
					if (oJqCell.length > 0) { 		
						oCellRect = oDragDropUtils.getBoundingClientRect(oJqCell[0]);
						iBegin = oCellRect.end - iDropAreaBeginMin - oJqDropArea.outerWidth() / 2.0;
						oJqDropArea.css(bIsRtl ? "right" : "left", iBegin + "px");					
					}
				});
			}
		}
	};
	
	this.createExternalDimDropAreasForMemberCell = function(oCell) {
		var oJqAboveArea = this.createAboveDropArea(oCell, oDimHeaderDropAreaAboveInfo);
		var oJqBeforeArea = this.createBeforeDropArea(oCell, oDimHeaderDropAreaBeforeInfo);
		return {"oJqAboveArea" : oJqAboveArea, "oJqBeforeArea" : oJqBeforeArea};
	};
};