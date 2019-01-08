/*
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([ 'jquery.sap.global', './library', 'sap/ui/Device' ],
	function(jQuery, library, Device) {
	"use strict";

	/**
	 * @class ProcessFlowNode renderer.
	 * @static
	 */
	var ProcessFlowNodeRenderer = {};

	/**
	 * ProcessFlowNodeRenderer constants
	 *
	 * @static
	 */
	ProcessFlowNodeRenderer._constants = {
		top:    "top",
		right:  "right",
		bottom: "bottom",
		left:   "left",
		corner: "corner"
	};

	/**
	 * ProcessFlowNodeRenderer node levels
	 *
	 * @static
	 */
	ProcessFlowNodeRenderer._nodeLevels = {
		iLevel0: 0,
		iLevel1: 1,
		iLevel2: 2,
		iLevel3: 3
	};

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl An object representation of the control that should be rendered
	 */
	ProcessFlowNodeRenderer.render = function (oRm, oControl) { // EXC_SAP_006_1, EXC_JSHINT_046
		var oFoldedCornerControl = null;
		var oCustomContent = oControl._getCurrentZoomLevelContent();

		if (oControl._getFoldedCorner()) {
			oFoldedCornerControl = oControl._getFoldedCornerControl();
		}
		var oHeaderControl = oControl._getHeaderControl();
		var oIconControl = oControl._getIconControl();
		var oStateControl = oControl._getStateTextControl();
		var oText1Control = oControl._createText1Control();
		var oText2Control = oControl._createText2Control();

		/*
		 In order to be able to display folded corner we have add another four div containers -
		 - node1-node4
		 node0 - base container contains all subparts
		 node1 - corner container contains folded corner
		 node2 - top container
		 node3 - node components
		 */
		// node0
		oRm.write("<div");
		oRm.writeControlData(oControl);
		if (oCustomContent) {
			oRm.addClass("sapSuiteUiCommonsProcessFlowNodeCustom");
		}
		ProcessFlowNodeRenderer._assignNodeClasses(oRm, oControl, 0);
		oRm.write(">");

		switch (oControl._getDisplayState()) {
			case library.ProcessFlowDisplayState.Highlighted:
			case library.ProcessFlowDisplayState.HighlightedFocused:
			case library.ProcessFlowDisplayState.SelectedHighlighted:
			case library.ProcessFlowDisplayState.SelectedHighlightedFocused:
				//border-top shadowing
				oRm.write("<div");
				ProcessFlowNodeRenderer._assignShadowClasses(oRm, oControl, "top");
				oRm.write("></div>");

				//border-right shadowing
				oRm.write("<div");
				ProcessFlowNodeRenderer._assignShadowClasses(oRm, oControl, "right");
				oRm.write("></div>");

				//border-bottom shadowing
				oRm.write("<div");
				ProcessFlowNodeRenderer._assignShadowClasses(oRm, oControl, "bottom");
				oRm.write("></div>");

				//border-left shadowing
				oRm.write("<div");
				ProcessFlowNodeRenderer._assignShadowClasses(oRm, oControl, "left");
				oRm.write("></div>");

				if (oControl._getFoldedCorner()) {
					//folded corner shadowing
					oRm.write("<div");
					ProcessFlowNodeRenderer._assignShadowClasses(oRm, oControl, "corner");
					oRm.write("></div>");
				}
				break;
			default:
		}
		// node1
		oRm.write("<div");
		ProcessFlowNodeRenderer._assignNodeClasses(oRm, oControl, 1);
		oRm.write(">");
		if (oControl._getFoldedCorner()) {
			oRm.renderControl(oFoldedCornerControl);
		}
		oRm.write("</div>");
		// node2
		oRm.write("<div");
		ProcessFlowNodeRenderer._assignNodeClasses(oRm, oControl, 2);
		oRm.write(">");
		oRm.write("</div>");
		// node3
		oRm.write("<div");
		ProcessFlowNodeRenderer._assignNodeClasses(oRm, oControl, 3);
		oRm.write(">");

		if (oCustomContent) {
			oRm.write("<div");
			oRm.addClass("sapSuiteUiCommonsProcessFlowNode3ContentPadding");
			oRm.writeClasses();
			oRm.write(">");
			oRm.renderControl(oCustomContent);
			oRm.write("</div>");
		} else {
			// node3 contents (actual node contents - title, state, texts)
			// title
			oRm.write("<div");
			ProcessFlowNodeRenderer._assignNodeTitleClasses(oRm, oControl);
			oRm.write(">");
			oRm.renderControl(oHeaderControl);
			oRm.write("</div>");
			// state area
			oRm.write("<div");
			ProcessFlowNodeRenderer._assignNodeStateClasses(oRm, oControl);
			oRm.write(">");
			// state icon
			oRm.write("<div");
			ProcessFlowNodeRenderer._assignNodeIconClasses(oRm, oControl);
			oRm.write(">");
			oRm.renderControl(oIconControl);
			oRm.write("</div>");
			// state text
			oRm.write("<div");
			ProcessFlowNodeRenderer._assignNodeStateTextClasses(oRm, oControl);
			oRm.write(">");
			oRm.renderControl(oStateControl);
			oRm.write("</div>");
			oRm.write("</div>");
			// end of state
			// text1
			oRm.write("<div");
			ProcessFlowNodeRenderer._assignNodeText1Classes(oRm, oControl);
			oRm.write(">");
			oRm.renderControl(oText1Control);
			oRm.write("</div>");
			// text2
			oRm.write("<div");
			ProcessFlowNodeRenderer._assignNodeText2Classes(oRm, oControl);
			oRm.write(">"); // div element for text2
			oRm.renderControl(oText2Control);
			oRm.write("</div>");
			oRm.write("</div>"); // end of node3
		}

		oRm.write("</div>"); // end of node0
	};

	/* =========================================================== */
	/* Helper methods                                              */
	/* =========================================================== */

	/*
	 * Navigation focus is used for the keyboard support
	 *
	 * business focus comes from outside and just make different visual representation (blue rectangle around). The focus
	 * is in the styles represents with the word selected (timing and historical reasons)
	 */

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl An object representation of the control that should be rendered
	 * @param {int} nodeLevel The nodeLevel of the node (0 - parent node, 1 - upper left (folded corner icon), 2 - top part of the node, 3 - bottom part of the node
	 */
	ProcessFlowNodeRenderer._assignNodeClasses = function (oRm, oControl, nodeLevel) { // EXC_SAP_006_1, EXC_JSHINT_047
		switch (nodeLevel) {
			case ProcessFlowNodeRenderer._nodeLevels.iLevel0:
				//oRm.writeAttribute("id", oControl.getId() + "-base-container");
				break;
			case ProcessFlowNodeRenderer._nodeLevels.iLevel1:
				oRm.writeAttribute("id", oControl.getId() + "-corner-container");
				break;
			case ProcessFlowNodeRenderer._nodeLevels.iLevel2:
				oRm.writeAttribute("id", oControl.getId() + "-top-container");
				break;
			case ProcessFlowNodeRenderer._nodeLevels.iLevel3:
				oRm.writeAttribute("id", oControl.getId() + "-content-container");
				break;
			default:
		}
		if (nodeLevel > ProcessFlowNodeRenderer._nodeLevels.iLevel0) {
			// Planned
			switch (oControl.getState()) {
				case library.ProcessFlowNodeState.Planned:
					if ((nodeLevel === ProcessFlowNodeRenderer._nodeLevels.iLevel1) && (oControl._getFoldedCorner())) {
						oRm.addClass("sapSuiteUiCommonsProcessFlowFoldedCornerPlanned");
					} else {
						oRm.addClass("sapSuiteUiCommonsProcessFlowNodeStatePlanned");
						oRm.addClass("sapSuiteUiCommonsProcessFlowNodeStatePlannedDashedBorder");
					}
					break;
				case library.ProcessFlowNodeState.PlannedNegative:
					if ((nodeLevel === ProcessFlowNodeRenderer._nodeLevels.iLevel1) && (oControl._getFoldedCorner())) {
						oRm.addClass("sapSuiteUiCommonsProcessFlowFoldedCornerPlanned");
					} else {
						oRm.addClass("sapSuiteUiCommonsProcessFlowNodeStatePlanned");
						oRm.addClass("sapSuiteUiCommonsProcessFlowNodeStatePlannedDashedBorder");
					}
					break;
				default:
			}
			if (oControl._getNavigationFocus()) {
				oRm.addClass("sapSuiteUiCommonsProcessFlowFoldedCornerDisplayStateNavigation");
			}
			// Display state: Focused
			switch (oControl._getDisplayState()) {
				case library.ProcessFlowDisplayState.RegularFocused:
				case library.ProcessFlowDisplayState.HighlightedFocused:
				case library.ProcessFlowDisplayState.DimmedFocused:
				case library.ProcessFlowDisplayState.SelectedHighlightedFocused:
				case library.ProcessFlowDisplayState.SelectedFocused:
					if ((nodeLevel === ProcessFlowNodeRenderer._nodeLevels.iLevel1) && (oControl._getFoldedCorner())) {
						oRm.addClass("sapSuiteUiCommonsProcessFlowFoldedCornerDisplayStateFocused");
					} else {
						oRm.addClass("sapSuiteUiCommonsProcessFlowNodeDisplayStateFocused");
					}
					break;
				default:
			}
			// Display state: Regular, Highlighted, Dimmed
			switch (oControl._getDisplayState()) {
				case library.ProcessFlowDisplayState.Regular:
				case library.ProcessFlowDisplayState.RegularFocused:
				case library.ProcessFlowDisplayState.Selected:
					if ((nodeLevel === ProcessFlowNodeRenderer._nodeLevels.iLevel1) && (oControl._getFoldedCorner())) {
						oRm.addClass("sapSuiteUiCommonsProcessFlowFoldedCornerDisplayStateRegular");
					} else {
						oRm.addClass("sapSuiteUiCommonsProcessFlowNodeDisplayStateRegular");
					}
					break;
				case library.ProcessFlowDisplayState.Highlighted:
				case library.ProcessFlowDisplayState.HighlightedFocused:
				case library.ProcessFlowDisplayState.SelectedHighlighted:
				case library.ProcessFlowDisplayState.SelectedHighlightedFocused:
					if (nodeLevel === ProcessFlowNodeRenderer._nodeLevels.iLevel1 && oControl._getFoldedCorner()) {
						oRm.addClass("sapSuiteUiCommonsProcessFlowFoldedCornerDisplayStateHighlighted");
					} else {
						oRm.addClass("sapSuiteUiCommonsProcessFlowNodeDisplayStateHighlighted");
					}
					break;
				case library.ProcessFlowDisplayState.Dimmed:
				case library.ProcessFlowDisplayState.DimmedFocused:
					if (nodeLevel === ProcessFlowNodeRenderer._nodeLevels.iLevel1 && oControl._getFoldedCorner()) {
						oRm.addClass("sapSuiteUiCommonsProcessFlowFoldedCornerDisplayStateDimmed");
					} else {
						oRm.addClass("sapSuiteUiCommonsProcessFlowNodeDisplayStateDimmed");
					}
					break;
				default:
			}
		}
		if (nodeLevel === ProcessFlowNodeRenderer._nodeLevels.iLevel0) {
			if (oControl._getNavigationFocus()) {
				oRm.addClass("sapSuiteUiCommonsProcessFlowFoldedCornerDisplayStateNavigation");
			}
			if (oControl._getDisplayState() === library.ProcessFlowDisplayState.Highlighted) {
				oRm.addClass("sapSuiteUiCommonsProcessFlowNodeDisplayStateHighlighted");
			}
			if (oControl.getType() === library.ProcessFlowNodeType.Aggregated) {
				ProcessFlowNodeRenderer._assignAggregatedNodeClasses(oRm, oControl);
			}
		}
		switch (oControl._getZoomLevel()) {
			case library.ProcessFlowZoomLevel.One:
				oRm.addClass(jQuery.sap.encodeHTML("sapSuiteUiCommonsProcessFlowNode" + nodeLevel + "ZoomLevel1"));
				break;
			case library.ProcessFlowZoomLevel.Two:
				oRm.addClass(jQuery.sap.encodeHTML("sapSuiteUiCommonsProcessFlowNode" + nodeLevel + "ZoomLevel2"));
				break;
			case library.ProcessFlowZoomLevel.Three:
				oRm.addClass(jQuery.sap.encodeHTML("sapSuiteUiCommonsProcessFlowNode" + nodeLevel + "ZoomLevel3"));
				break;
			case library.ProcessFlowZoomLevel.Four:
				oRm.addClass(jQuery.sap.encodeHTML("sapSuiteUiCommonsProcessFlowNode" + nodeLevel + "ZoomLevel4"));
				break;
			default:
		}
		if (nodeLevel === ProcessFlowNodeRenderer._nodeLevels.iLevel1) {
			if (oControl._getFoldedCorner()) {
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode1FoldedBorderStyle");
			} else {
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode1BorderStyle");
				oRm.addClass("sapSuiteUiCommonsProcessFlowNodeBorderStandard");
			}
		} else if (nodeLevel > ProcessFlowNodeRenderer._nodeLevels.iLevel1) {
			oRm.addClass(jQuery.sap.encodeHTML("sapSuiteUiCommonsProcessFlowNode" + nodeLevel + "BorderStyle"));
			oRm.addClass("sapSuiteUiCommonsProcessFlowNodeBorderStandard");
		}

		if (((nodeLevel === ProcessFlowNodeRenderer._nodeLevels.iLevel1) && (oControl._getFoldedCorner()))) {
			oRm.addClass("sapSuiteUiCommonsProcessFlowFoldedCornerNode1");
		} else {
			oRm.addClass(jQuery.sap.encodeHTML("sapSuiteUiCommonsProcessFlowNode" + nodeLevel));
		}
		if (((nodeLevel === ProcessFlowNodeRenderer._nodeLevels.iLevel0) && (oControl._getFoldedCorner()))) {
			oRm.addClass("sapSuiteUiCommonsProcessFlowFoldedCornerIndication");
		}

		oRm.writeClasses();
	};

	/**
	 * Renders the HTML shadow borders for the given aggregated node, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl An object representation of the control that should be rendered
	 */
	ProcessFlowNodeRenderer._assignAggregatedNodeClasses = function (oRm, oControl) {
		switch (oControl._getDisplayState()) {
			// Highlighted and regular states uses the same color
			case library.ProcessFlowDisplayState.Highlighted:
			case library.ProcessFlowDisplayState.Regular:
			case library.ProcessFlowDisplayState.Selected:
				if (oControl._getZoomLevel() === library.ProcessFlowZoomLevel.Four) {
					oRm.addClass("sapSuiteUiCommonsProcessFlowNodeAggregatedZoomLevel4");
				} else {
					oRm.addClass("sapSuiteUiCommonsProcessFlowNodeAggregated");
				}
				break;
			// Dimmed state uses a lighter color
			case library.ProcessFlowDisplayState.Dimmed:
				if (oControl._getZoomLevel() === library.ProcessFlowZoomLevel.Four) {
					oRm.addClass("sapSuiteUiCommonsProcessFlowNodeAggregatedDimmedZoomLevel4");
				} else {
					oRm.addClass("sapSuiteUiCommonsProcessFlowNodeAggregatedDimmed");
				}
				break;
			// The other possible states are focused states
			default:
				if (oControl._getZoomLevel() === library.ProcessFlowZoomLevel.Four) {
					oRm.addClass("sapSuiteUiCommonsProcessFlowNodeAggregatedFocusedZoomLevel4");
				} else {
					oRm.addClass("sapSuiteUiCommonsProcessFlowNodeAggregatedFocused");
				}
				break;
		}
	};

	/**
	 * Renders the HTML shadow borders for the given highlighted node, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl An object representation of the control that should be rendered
	 * @param {string} border Border type: "top", "bottom", "left", "right"
	 */
	ProcessFlowNodeRenderer._assignShadowClasses = function (oRm, oControl, border) {
		oRm.addClass("sapSuiteUiCommonsShadowedDivCommon");
		switch (border) {
			case ProcessFlowNodeRenderer._constants.top:
				if (oControl._getFoldedCorner()) {
					oRm.addClass("sapSuiteUiCommonsShadowedDivFoldedCornerBorderTop");
				} else {
					oRm.addClass("sapSuiteUiCommonsShadowedDivBorderTop");
				}
				break;
			case ProcessFlowNodeRenderer._constants.right:
				oRm.addClass("sapSuiteUiCommonsShadowedDivBorderRight");
				break;
			case ProcessFlowNodeRenderer._constants.bottom:
				oRm.addClass("sapSuiteUiCommonsShadowedDivBorderBottom");
				break;
			case ProcessFlowNodeRenderer._constants.left:
				if (oControl._getFoldedCorner()) {
					oRm.addClass("sapSuiteUiCommonsShadowedDivFoldedCornerBorderLeft");
				} else {
					oRm.addClass("sapSuiteUiCommonsShadowedDivBorderLeft");
				}
				break;
			case ProcessFlowNodeRenderer._constants.corner:
				if (Device.browser.safari) {
					oRm.addClass("sapSuiteUiCommonsShadowedDivFoldedCornerSafari");
				} else {
					oRm.addClass("sapSuiteUiCommonsShadowedDivFoldedCorner");
				}
				break;
			default:
		}

		oRm.writeClasses();
	};

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl An object representation of the control that should be rendered
	 */
	ProcessFlowNodeRenderer._assignNodeTitleClasses = function (oRm, oControl) {
		oRm.writeAttribute("id", oControl.getId() + "-title");

		switch (oControl._getZoomLevel()) {
			case library.ProcessFlowZoomLevel.One:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3TitleZoomLevel1");
				break;
			case library.ProcessFlowZoomLevel.Two:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3TitleZoomLevel2");
				break;
			case library.ProcessFlowZoomLevel.Three:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3TitleZoomLevel3");
				break;
			case library.ProcessFlowZoomLevel.Four:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3TitleZoomLevel4");
				break;
			default:
		}
		oRm.addClass("sapSuiteUiCommonsProcessFlowNode3Title");
		oRm.writeClasses();
	};

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl An object representation of the control that should be rendered
	 */
	ProcessFlowNodeRenderer._assignNodeStateClasses = function (oRm, oControl) {
		oRm.writeAttribute("id", oControl.getId() + "-state");

		switch (oControl._getZoomLevel()) {
			case library.ProcessFlowZoomLevel.One:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3StateZoomLevel1");
				break;
			case library.ProcessFlowZoomLevel.Two:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3StateZoomLevel2");
				break;
			case library.ProcessFlowZoomLevel.Three:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3StateZoomLevel3");
				break;
			case library.ProcessFlowZoomLevel.Four:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3StateZoomLevel4");
				break;
			default:
		}
		oRm.addClass("sapSuiteUiCommonsProcessFlowNode3State");
		oRm.writeClasses();
	};

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl An object representation of the control that should be rendered
	 */
	ProcessFlowNodeRenderer._assignNodeIconClasses = function (oRm, oControl) {
		oRm.writeAttribute("id", oControl.getId() + "-icon-container");

		switch (oControl.getState()) {
			case library.ProcessFlowNodeState.Positive:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNodeStatePositive");
				break;
			case library.ProcessFlowNodeState.Negative:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNodeStateNegative");
				break;
			case library.ProcessFlowNodeState.Planned:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNodeStatePlanned");
				break;
			case library.ProcessFlowNodeState.Neutral:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNodeStateNeutral");
				break;
			case library.ProcessFlowNodeState.PlannedNegative:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNodeStateNegative");
				break;
			case library.ProcessFlowNodeState.Critical:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNodeStateCritical");
				break;
			default:
		}
		switch (oControl._getZoomLevel()) {
			case library.ProcessFlowZoomLevel.One:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3StateIconZoomLevel1");
				break;
			case library.ProcessFlowZoomLevel.Two:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3StateIconZoomLevel2");
				break;
			case library.ProcessFlowZoomLevel.Three:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3StateIconZoomLevel3");
				break;
			case library.ProcessFlowZoomLevel.Four:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3StateIconZoomLevel4");
				break;
			default:
		}
		oRm.addClass("sapSuiteUiCommonsProcessFlowNode3StateIcon");
		oRm.writeClasses();
	};

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl An object representation of the control that should be rendered
	 */
	ProcessFlowNodeRenderer._assignNodeStateTextClasses = function (oRm, oControl) {
		oRm.writeAttribute("id", oControl.getId() + "-state-text");

		switch (oControl.getState()) {
			case library.ProcessFlowNodeState.Positive:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNodeStatePositive");
				break;
			case library.ProcessFlowNodeState.Negative:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNodeStateNegative");
				break;
			case library.ProcessFlowNodeState.Planned:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNodeStatePlanned");
				break;
			case library.ProcessFlowNodeState.Neutral:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNodeStateNeutral");
				break;
			case library.ProcessFlowNodeState.PlannedNegative:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNodeStateNegative");
				break;
			case library.ProcessFlowNodeState.Critical:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNodeStateCritical");
				break;
			default:
		}
		switch (oControl._getZoomLevel()) {
			case library.ProcessFlowZoomLevel.One:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3StateTextZoomLevel1");
				break;
			case library.ProcessFlowZoomLevel.Two:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3StateTextZoomLevel2");
				break;
			case library.ProcessFlowZoomLevel.Three:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3StateTextZoomLevel3");
				break;
			case library.ProcessFlowZoomLevel.Four:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3StateTextZoomLevel4");
				break;
			default:
		}
		oRm.addClass("sapSuiteUiCommonsProcessFlowNode3StateText");
		oRm.writeClasses();
	};

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl An object representation of the control that should be rendered
	 */
	ProcessFlowNodeRenderer._assignNodeText1Classes = function (oRm, oControl) {
		oRm.writeAttribute("id", oControl.getId() + "-text1");

		switch (oControl._getZoomLevel()) {
			case library.ProcessFlowZoomLevel.One:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3TextWithGapZoomLevel1");
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3TextZoomLevel1");
				break;
			case library.ProcessFlowZoomLevel.Two:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3TextWithGapZoomLevel2");
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3TextZoomLevel2");
				break;
			case library.ProcessFlowZoomLevel.Three:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3TextZoomLevel3");
				break;
			case library.ProcessFlowZoomLevel.Four:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3TextZoomLevel4");
				break;
			default:
		}
		oRm.addClass("sapSuiteUiCommonsProcessFlowNode3Text");
		oRm.writeClasses();
	};

	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl An object representation of the control that should be rendered
	 */
	ProcessFlowNodeRenderer._assignNodeText2Classes = function (oRm, oControl) {
		oRm.writeAttribute("id", oControl.getId() + "-text2");

		switch (oControl._getZoomLevel()) {
			case library.ProcessFlowZoomLevel.One:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3TextZoomLevel1");
				break;
			case library.ProcessFlowZoomLevel.Two:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3TextZoomLevel2");
				break;
			case library.ProcessFlowZoomLevel.Three:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3TextZoomLevel3");
				break;
			case library.ProcessFlowZoomLevel.Four:
				oRm.addClass("sapSuiteUiCommonsProcessFlowNode3TextZoomLevel4");
				break;
			default:
		}
		oRm.addClass("sapSuiteUiCommonsProcessFlowNode3Text");
		oRm.writeClasses();
	};


	return ProcessFlowNodeRenderer;

}, /* bExport= */ true);
