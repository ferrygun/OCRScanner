jQuery.sap.declare("sap.zen.crosstab.HeaderCellRenderer");
jQuery.sap.require("sap.zen.crosstab.rendering.RenderingConstants");
jQuery.sap.require("sap.zen.crosstab.IHeaderCell");
jQuery.sap.require("sap.zen.crosstab.TextConstants");
jQuery.sap.require("sap.zen.crosstab.utils.Utils");

/**
 * @class HeaderCell renderer.
 * @static
 */
sap.zen.crosstab.HeaderCellRenderer = {};

/**
 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
 * 
 * @param {sap.ui.core.RenderManager}
 *            oRenderManager the RenderManager that can be used for writing to the Render-Output-Buffer
 * @param {sap.ui.core.Control}
 *            oControl an object representation of the control that should be rendered
 */
sap.zen.crosstab.HeaderCellRenderer.render = function (oRenderManager, oControl) {
	"use strict";
	// convenience variable
	var rm = oRenderManager;

	var oArea = oControl.getArea();
	var fRenderCallback = oArea.getRenderCellCallback();
	var oCrosstab = oArea.getCrosstab();

	var iRowspan = oControl.getEffectiveRowSpan();
	var iColspan = oControl.getEffectiveColSpan();

	var oAdditionalStyles = null;
	if (fRenderCallback) {
		var oCallbackResult = fRenderCallback(new sap.zen.crosstab.IHeaderCell(oControl));
		oAdditionalStyles = oCallbackResult.additionalStyles;
	}

	// Text to be rendered
	var sRenderText = oControl.getFormattedText();

	var sSort = oControl.getSort();
	var sDrillState = oControl.getDrillState();

	// Styles
	var sCssClasses = oControl.getCssClassNames(oCrosstab.isIE8Mode(), oCrosstab.getPropertyBag().isRtl(), oCrosstab.getUtils().isMsIE());
	if (sSort) {
		// Empty css class to enable hover effects
		sCssClasses += " sapzencrosstab-HeaderCellSortable";
	}
	if (sDrillState) {
		sCssClasses += " sapzencrosstab-HeaderCellHierarchy";
	}

	// write the HTML into the render manager
	rm.write("<td");
	rm.writeControlData(oControl);
	rm.writeAttribute("class", sCssClasses);
	rm.writeAttribute("tabindex", sap.zen.crosstab.rendering.RenderingConstants.TABINDEX);
	if (iColspan > 1) {
		rm.writeAttribute("colspan", iColspan);
	}
	if (iRowspan > 1) {
		rm.writeAttribute("rowspan", iRowspan);
	}
	rm.write(">"); // td element

	// cell layout div
	rm.write("<div");
	rm.writeAttribute("id", oControl.getId() + "_cellLayoutDiv");
	rm.writeAttribute("tabindex", sap.zen.crosstab.rendering.RenderingConstants.TABINDEX);
	rm.writeAttribute("class", "sapzencrosstab-cellLayoutDiv");
	if (oControl.isEntryEnabled()) {
		// prepare for postprocessing logic workaround in adjustColWidths of RenderEngine
		rm.addStyle("width", "0px");
		rm.writeStyles();
	}
	rm.write(">"); // div element

	if (oControl.isEntryEnabled()) {
		rm.write("<table style='width: 100%; border-spacing: 0px;'><tbody>");
		rm.write("<tr>");
		rm.write("<td style='width: 100%; padding: 0px 5px 0px 0px;'>");
	}

	// cell content div
	rm.write("<div");
	rm.writeAttribute("id", oControl.getId() + "_contentDiv");
	rm.writeAttribute("tabindex", sap.zen.crosstab.rendering.RenderingConstants.TABINDEX);
	// tooltip
	if (sRenderText) {
		rm.writeAttribute("title", sRenderText);
	}
	var sClasses = "sapzencrosstab-HeaderCellContentDiv";
	if (oControl.isLoading()) {
		sClasses += " sapzencrosstab-LoadingCellContentDiv";
	}
	rm.writeAttribute("class", sClasses);
	if (oAdditionalStyles) {
		for ( var sStyleKey in oAdditionalStyles) {
			rm.addStyle(sStyleKey, oAdditionalStyles[sStyleKey]);
		}
	}
	rm.writeStyles();
	if (oControl.isEntryEnabled()) {
		rm.addStyle("width", "100%");
		rm.writeStyles();
	}
	rm.write(">"); // div element

	renderCellContent();
	renderColResizer();

	rm.write("</div>"); // cell content div
	rm.write("</div>"); // cell layout div

	if (oControl.isEntryEnabled()) {
		rm.write("</td>");

		rm.write("<td style='padding: 0px'>");

		rm.write("<div");
		rm.writeAttribute("id", "vhlp_" + oControl.getId());

		var sClassString = "sapzencrosstab-HeaderCellDivValueHelp";
		if (sap.zen.crosstab.utils.Utils.isMainMode()) {
			sClassString += "-MainMode";
		}
		sClassString += " sapzencrosstab-HeaderCellValueHelp";
		rm.writeAttribute("class", sClassString);

		rm.write(">");
		rm.write("</div>");

		rm.write("</td>");

		rm.write("</tr>");

		rm.write("</tbody></table>");
	}

	rm.write("</td>");

	function renderCellContent() {
		if (sSort || sDrillState) {
			createCellContentTable(sSort, sDrillState);
		} else {
			rm.write(sRenderText);
		}
	}

	function createCellContent() {
		rm.write("<div");
		rm.writeAttribute("id", oControl.getId() + "_textContentDiv");
		rm.writeAttribute("tabindex", sap.zen.crosstab.rendering.RenderingConstants.TABINDEX);		
		// ellipsis handling when content is too large
		rm.addStyle("overflow", "hidden");
		rm.addStyle("text-overflow", "ellipsis");
		rm.writeStyles();
		rm.write(">");
		rm.write(sRenderText);
		rm.write("</div>");
	}

	function createCellContentTable() {
		rm.write("<table><tbody>");

		insertColHeaderHierarchySpacerLinesBefore();

		rm.write("<tr>");
		insertHierarchyActionImage();
		insertTextContent();
		insertSortingImage();
		insertRowHeaderHierarchSpacerDivAfter();
		rm.write("</tr>");

		insertColHeaderHierarchySpacerLinesAfter();

		rm.write("</tbody></table>");
	}

	function insertHierarchyActionImage() {
		if (sDrillState) {
			var iLevel = oControl.getLevel();
			var isRowHeaderArea = oControl.getArea().isRowHeaderArea();
			var sClass = "sapzencrosstab-HeaderCellDivHierarchy ";
			if (oControl.getHierarchyAction()) {
				if (sDrillState === "O") {
					sClass += "sapzencrosstab-CollapseNode";
					if (oControl.getNodeAlignment() === "bottom") {
						sClass += " sapzencrosstab-BottomNode";
					}
				} else if (sDrillState === "C") {
					sClass += "sapzencrosstab-ExpandNode";
				}
				if (sDrillState === "O" || sDrillState === "C") {
					sClass += " sapzencrosstab-PointerCursor";
				}
			}

			// insert space before text
			if (iLevel > 0) {
				if (isRowHeaderArea) {
					var iWidth = iLevel * oCrosstab.getHierarchyIndentWidth();

					rm.write("<td>");

					rm.write("<div");
					rm.writeAttribute("tabindex", sap.zen.crosstab.rendering.RenderingConstants.TABINDEX);
					rm.addStyle("width", iWidth + "px");
					rm.writeAttribute("class", "sapzencrosstab-HierarchySpacerDivBefore");
					rm.writeAttribute("xtabspacer-cellid", oControl.getId());
					rm.writeStyles();
					rm.write("></div>");

					rm.write("</td>");
				}
			}

			if ((sDrillState === "L" && iLevel > 0) || sDrillState !== "L") {
				rm.write("<td>");

				rm.write("<div");
				if (oControl.getHierarchyAction()) {
					rm.writeAttribute("id", "hier_" + oControl.getId());
				}
				rm.writeAttribute("class", sClass);
				// Tooltip
				var sHierarchyTooltip = oControl.getHierarchyTooltip();
				if (sHierarchyTooltip) {
					rm.writeAttribute("title", sHierarchyTooltip);
				}
				rm.write("></div>");

				rm.write("</td>");
			}
		}
	}

	function insertTextContent() {
		rm.write("<td>");
		createCellContent();
		rm.write("</td>");
	}

	function createSortingImage() {
		if (sSort) {
			var iTextIndex = 0;
			var sClass = "sapzencrosstab-HeaderCellDivSortable ";
			rm.write("<div");
			if (sSort === "NONE") {
				sClass += "sapzencrosstab-HeaderCellSortNone";
				iTextIndex = 0;
			} else if (sSort === "ASC") {
				sClass += "sapzencrosstab-HeaderCellSortAsc";
				iTextIndex = 1;
			} else if (sSort === "DESC") {
				sClass += "sapzencrosstab-HeaderCellSortDesc";
				iTextIndex = 2;
			}
			rm.writeAttribute("class", sClass);
			rm.writeAttribute("id", "sort_" + oControl.getId());
			// Tooltip
			var sSortTooltip = oCrosstab.getPropertyBag().getSortingToolTip(iTextIndex);
			if (sSortTooltip) {
				rm.writeAttribute("title", sSortTooltip);
			}
			rm.write("></div>");
		}
	}

	function insertSortingImage() {
		if (sSort) {
			rm.write("<td>");
			createSortingImage();
			rm.write("</td>");
		}
	}

	function insertRowHeaderHierarchSpacerDivAfter () {
		if (sDrillState && oControl.getArea().isRowHeaderArea()) {
			var iLevel = oControl.getLevel();
			var iMaxLevel = oCrosstab.getRowHeaderHierarchyLevels()[oControl.getCol()];
			var iDiff = iMaxLevel - iLevel;
			if (iDiff > 0) {
				var iWidth = iDiff * oCrosstab.getHierarchyIndentWidth();

				rm.write("<td>");

				rm.write("<div");
				rm.writeAttribute("tabindex", sap.zen.crosstab.rendering.RenderingConstants.TABINDEX);
				rm.addStyle("width", iWidth + "px");
				rm.writeAttribute("class", "sapzencrosstab-HierarchySpacerDivAfter");
				rm.writeAttribute("xtabspacer-cellid", oControl.getId());
				rm.writeStyles();
				rm.write("></div>");

				rm.write("</td>");
			}
		}
	}

	function insertColHeaderHierarchySpacerLinesBefore() {
		if (sDrillState) {
			var iLevel = oControl.getLevel();
			if (iLevel > 0 && oControl.getArea().isColHeaderArea()) {
				var iHeight = iLevel * oCrosstab.getHierarchyIndentHeight();

				rm.write("<tr><td>");

				rm.write("<div");
				rm.writeAttribute("tabindex", sap.zen.crosstab.rendering.RenderingConstants.TABINDEX);
				rm.writeAttribute("class", "sapzencrosstab-HierarchySpacerLinesBefore");
				rm.writeAttribute("xtabspacer-cellid", oControl.getId());
				rm.addStyle("height", iHeight + "px");
				rm.writeStyles();
				rm.write("></div>");

				rm.write("</td></tr>");
			}
		}
	}

	function insertColHeaderHierarchySpacerLinesAfter () {
		if (sDrillState && oControl.getArea().isColHeaderArea()) {
			var iLevel = oControl.getLevel();
			var iMaxLevel = oCrosstab.getColHeaderHierarchyLevels()[oControl.getRow()];
			var iDiff = iMaxLevel - iLevel;
			if (iDiff > 0) {
				var iHeight = iDiff * oCrosstab.getHierarchyIndentHeight();

				rm.write("<tr><td>");

				rm.write("<div");
				rm.writeAttribute("tabindex", sap.zen.crosstab.rendering.RenderingConstants.TABINDEX);
				rm.writeAttribute("class", "sapzencrosstab-HierarchySpacerLinesAfter");
				rm.writeAttribute("xtabspacer-cellid", oControl.getId());
				rm.addStyle("height", iHeight + "px");
				rm.writeStyles();
				rm.write("></div>");

				rm.write("</td></tr>");
			}
		}
	}

	function renderColResizer() {
		if (oCrosstab.getPropertyBag().isEnableColResize() === true) {
			if (oArea.isColHeaderArea() || oArea.isDimHeaderArea()) {
				if (oCrosstab.getPropertyBag().isTestMobileMode() || oCrosstab.getPropertyBag().isMobileMode()) {
					oControl.setMobileResize(true);
				} else {
					// resize handle div
					rm.write("<div");
					rm.writeAttribute("id", "resi_" + oControl.getId());
					if(sSort){
						//Some themes need a different spacing for the resize handle if a sort icon is present in the same cell
						rm.writeAttribute("class", "sapzencrosstab-columnResizeHandleWithSort");
					} else {
						rm.writeAttribute("class", "sapzencrosstab-columnResizeHandle");
					}
					rm.writeAttribute("title", oCrosstab.getPropertyBag().getText(
							sap.zen.crosstab.TextConstants.COLWIDTH_ADJUST_TEXT_KEY));
					rm.write(">"); // div element
					rm.write("</div>");
					oControl.setMobileResize(false);
				}
			}
		}
	}
};
