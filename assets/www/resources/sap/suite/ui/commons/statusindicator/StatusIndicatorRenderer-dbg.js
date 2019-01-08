/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

sap.ui.define(["jquery.sap.global",
		"sap/suite/ui/commons/util/HtmlElement",
		"sap/ui/core/Renderer"
	],

	function(jQuery, HtmlElement, Renderer) {
		"use strict";

		var resourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.suite.ui.commons");

		/**
		 * StatusIndicator renderer.
		 * @namespace
		 * @extends sap.ui.core.Renderer
		 */
		var StatusIndicatorRenderer = Renderer.extend("sap.suite.ui.commons.StatusIndicatorRenderer");

		/**
		 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
		 *
		 * @param {sap.ui.core.RenderManager} oRm
		 *            The RenderManager that can be used for writing to the render output buffer.
		 * @param {sap.suite.ui.commons.StatusIndicator} oControl
		 *            An object representation of the control that should be rendered.
		 */
		StatusIndicatorRenderer.render = function(oRm, oControl) {
			var oModel = this._getHtmlModel(oControl);
			oModel.getRenderer().render(oRm);
		};

		/**
		 * Returns HtmlElement instance of the root div of the StatusIndicator.
		 *
		 * @param {sap.suite.ui.commons.StatusIndicator} oStatusIndicator
		 *            the StatusIndicator to be rendered
		 * @returns {sap.suite.ui.commons.util.HtmlElement} root div HtmlElement instance
		 * @private
		 */
		StatusIndicatorRenderer._getHtmlModel = function(oStatusIndicator) {
			var oRoot = new HtmlElement("div");
			oRoot.addStyle("width", oStatusIndicator.getWidth());
			oRoot.addStyle("height", oStatusIndicator.getHeight());
			oRoot.addControlData(oStatusIndicator);
			oRoot.setAttribute("role", "progressbar");
			oRoot.setAttribute("aria-roledescription", resourceBundle.getText("STATUS_INDICATOR_ARIA_ROLE_DESCRIPTION"));
			oRoot.setAttribute("aria-readonly", true);

			var sAriaLabel = oStatusIndicator.getAriaLabel();
			oRoot.setAttribute("aria-label", sAriaLabel ? sAriaLabel : resourceBundle.getText("STATUS_INDICATOR_ARIA_LABEL"));

			var aAriaLabelledBy = oStatusIndicator.getAriaLabelledBy();

			if (aAriaLabelledBy && aAriaLabelledBy.length > 0) {
				oRoot.setAttribute("aria-labelledby", aAriaLabelledBy.join(" "));
			}

			var aAriaDescribedBy = oStatusIndicator.getAriaDescribedBy();

			if (aAriaDescribedBy && aAriaDescribedBy.length > 0) {
				oRoot.setAttribute("aria-describedby", aAriaDescribedBy.join(" "));
			}

			oRoot.setAttribute("tabindex", "0");
			oRoot.setAttribute("aria-valuemin", 0);
			oRoot.setAttribute("aria-valuemax", 100);
			oRoot.addChild(this._getSvgElement(oStatusIndicator));

			return oRoot;
		};


		/**
		 * Returns HtmlElement object of the svg element
		 *
		 * @param {sap.suite.ui.commons.StatusIndicator} oStatusIndicator
		 *            the StatusIndicator to be rendered
		 * @returns {sap.suite.ui.commons.util.HtmlElement} svg HtmlElement instance
		 * @private
		 */
		StatusIndicatorRenderer._getSvgElement = function(oStatusIndicator) {
			var oSvg = new HtmlElement("svg");
			oSvg.setId(oStatusIndicator._getFullId(oStatusIndicator._internalIds.svgNodeId));
			oSvg.setAttribute("version", "1.1");
			oSvg.setAttribute("xlmns", "http://www.w3.org/2000/svg");
			oSvg.setAttribute("width", oStatusIndicator.getWidth());
			oSvg.setAttribute("height", oStatusIndicator.getHeight());
			oSvg.setAttribute("focusable", false);
			oSvg.addClass("sapSuiteUiCommonsStatusIndicator");
			if (oStatusIndicator.getViewBox()) {
				oSvg.setAttribute("viewBox", oStatusIndicator.getViewBox(), true);
			}

			oStatusIndicator._getGroupElements().forEach(function (oGroupHtmlElement) {
				oSvg.addChild(oGroupHtmlElement);
			});

			return oSvg;
		};


		return StatusIndicatorRenderer;

	}, true);
