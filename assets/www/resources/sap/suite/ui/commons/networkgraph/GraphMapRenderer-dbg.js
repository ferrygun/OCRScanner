sap.ui.define(['sap/ui/core/Renderer'],
	function () {
		"use strict";

		return {
			_appendHeightAndWidth: function (oNetworkGraphMap) {
				return "style=\"height:" + oNetworkGraphMap.getHeight() + ";width:" + oNetworkGraphMap.getWidth() + "\"";
			},
			render: function (oRM, oNetworkGraphMap) {
				oRM.write("<div class=\"sapSuiteUiCommonsNetworkGraphMap\"");
				oRM.write(this._appendHeightAndWidth(oNetworkGraphMap));
				oRM.writeControlData(oNetworkGraphMap);
				oRM.write(">");

				oRM.write("<div class=\"sapSuiteUiCommonsNetworkGraphMapTitle\">");

				oRM.write("<span class=\"sapSuiteUiCommonsNetworkGraphMapTitleText\">");
				oRM.writeEscaped(oNetworkGraphMap.getTitle());
				oRM.write("</span>");

				oRM.write("</div>");

				oRM.write("<div class=\"sapSuiteUiCommonsNetworkGraphMapContent\"");
				if (oNetworkGraphMap.getHeight()) {
					// if user specifies height, fill content to its height (it would overflow otherwise)
					oRM.write("style=\"height: 100%\"");
				}
				oRM.write(">");
				oRM.write("</div>");

				oRM.write("</div>");
			}
		};
	}, true);