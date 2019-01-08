sap.ui.define([
	"jquery.sap.global"
], function (jQuery) {
	"use strict";

	var oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.suite.ui.commons");

	return {
		_appendHeightAndWidth: function (oNetworkGraph) {
			return "style=\"height:" + oNetworkGraph.getHeight() + ";width:" + oNetworkGraph.getWidth() + "\"";
		},
		render: function (oRM, oNetworkGraph) {
			oRM.write("<div class=\"sapSuiteUiCommonsNetworkGraph\" tabindex=\"0\"");
			oRM.writeControlData(oNetworkGraph);
			oRM.write(this._appendHeightAndWidth(oNetworkGraph));
			this._writeAriaTags(oRM, oNetworkGraph);
			oRM.write(">");

			// toolbar
			oRM.renderControl(oNetworkGraph._toolbar);

			oRM.write("<div id=\"" + oNetworkGraph.getId() + "-wrapper\" class=\"sapSuiteUiCommonsNetworkGraphContentWrapper\" tabindex=\"0\" aria-live=\"assertive\" role=\"application\">");

			/**
			 * Theoretically at this point we should use either aria-hidden or InvisibleText. This is a workaround for Jaws bug
			 * which causes the text to be read twice.
			 */
			oRM.write("<div id=\"" + oNetworkGraph.getId() + "-accessibility\" class=\"sapSuiteUiCommonsNetworkGraphContentWrapperAccessibility\">");
			oRM.write(jQuery.sap.encodeHTML(oResourceBundle.getText("NETWORK_GRAPH_ACCESSIBILITY_CONTENT")));
			oRM.write("</div>");

			oRM.write("<div id=\"" + oNetworkGraph.getId() + "-scroller\" class=\"sapSuiteUiCommonsNetworkGraphScroller sapSuiteUiCommonsNetworkGraphBackground\">");

			oRM.write("</div>");
			oRM.write("<div id=\"" + oNetworkGraph.getId() + "-legend\" style=\"display:none\" class=\"sapSuiteUiCommonsNetworkGraphLegend\" >");
			if (oNetworkGraph.getLegend()) {
				oRM.renderControl(oNetworkGraph.getLegend());
			}

			oRM.write("</div>");
			oRM.write("</div>");
			oRM.write("</div>");
		},
		_writeAriaTags: function (oRM, oNetworkGraph) {
			var aAriaLabelledBy = oNetworkGraph.getAriaLabelledBy(),
				aAriaDescribedBy = oNetworkGraph.getAriaDescribedBy();
			if (aAriaLabelledBy.length > 0) {
				oRM.writeAttributeEscaped("aria-labelledby", aAriaLabelledBy.join(" "));
			} else {
				oRM.writeAttributeEscaped("aria-label", oResourceBundle.getText("NETWORK_GRAPH_ACCESSIBILITY_LABEL"));
			}
			if (aAriaDescribedBy.length > 0) {
				oRM.writeAttributeEscaped("aria-describedby", aAriaDescribedBy.join(" "));
			}
		}
	};
}, true);