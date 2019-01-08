sap.ui.define([
	"jquery.sap.global",
	"./SvgBase",
	"sap/ui/core/ResizeHandler"
], function (jQuery, SvgBase, ResizeHandler) {
	var NAVIGATORLINESIZE = 4;

	var oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.suite.ui.commons");

	/**
	 * Constructor for a new GraphMap.
	 *
	 * @class
	 * A component which displays an overview of the entire graph and allows users to quickly navigate in the linked graph.
	 *
	 * @extends sap.ui.core.Control
	 *
	 * @constructor
	 * @public
	 * @since 1.50
	 * @alias sap.suite.ui.commons.networkgraph.GraphMap
	 */
	var GraphMap = SvgBase.extend("sap.suite.ui.commons.networkgraph.GraphMap", {
		metadata: {
			library: "sap.suite.ui.commons",
			properties: {
				/**
				 * The height of the graph map.
				 */
				height: {
					type: "sap.ui.core.CSSSize", group: "Appearance", defaultValue: ""
				},
				/**
				 * The width of the graph map.
				 */
				width: {
					type: "sap.ui.core.CSSSize", group: "Appearance", defaultValue: ""
				},
				/**
				 * This property affects the threshold at which the renderer switches from link rendering to direct
				 * graph rendering. Rendering using xlink is much faster, but with larger graphs it may slow down the
				 * browser performance. Modify this property with care.
				 * Please also keep in mind that a graph map that is rendered directly does not adapt to changes until
				 * it's fully rerendered.
				 */
				directRenderNodeLimit: {
					type: "int", group: "Behavior", defaultValue: 250
				},
				/**
				 * Graph overview title
				 */
				title: {
					type: "string", group: "Misc", defaultValue: ""
				}
			},
			associations: {
				/**
				 * An association to a graph displayed by this component.
				 */
				graph: {type: "sap.suite.ui.commons.networkgraph.Graph", multiple: false, singularName: "graph"}
			},
			events: {
				/**
				 * This event is fired when the map is fully rendered.
				 */
				mapReady: {}
			}
		}
	});

	/* =========================================================== */
	/* Events & pseudo events */
	/* =========================================================== */
	GraphMap.prototype.init = function () {
		this._oResizeListener = null;
		this.setBusyIndicatorDelay(0);
	};

	GraphMap.prototype.onAfterRendering = function () {
		this.setBusy(true);
	};

	/* =========================================================== */
	/* Rendering */
	/* =========================================================== */
	GraphMap.prototype._renderMap = function () {
		var sViewBox, iGraphWidth, iGraphHeight, sSvg, $svg, iRatio, iStrokeWidthRating,
			oGraph = this.getGraph(),
			iZoomRatio = oGraph._fZoomRatio,
			iNodeCount = oGraph.getNodes().length,
			sHtml = "",
			fnRenderItems = function (aItems) {
				aItems.forEach(function (oItem) {
					sHtml += oItem._render({
						mapRender: true
					});
				});
				return sHtml;
			};

		if (!oGraph._iWidth || !oGraph._iHeight) {
			return;
		}

		if (iNodeCount === 0) {
			return;
		}

		sViewBox = oGraph.$("networkGraphSvg").attr("viewBox");
		if (!sViewBox) {
			sViewBox = "0 0 " + oGraph._iWidth + " " + oGraph._iHeight;
		}

		// items rendering + svg wrapper
		sSvg = "<svg class=\"sapSuiteUiCommonsNetworkGraphSvg\" width=\"100%\" height=\"100%\" viewBox=\"" + sViewBox + "\" " +
			"id=\"" + this._getDomId("svg") + "\"";

		if (oGraph._bIsRtl) {
			sSvg += " direction =\"rtl\"";
		}

		sSvg += " >";

		if (iNodeCount < this.getDirectRenderNodeLimit()) {
			sHtml = this._renderControl("use", {
				"xlink:href": "#" + oGraph._getDomId("svgbody")
			});
		} else {
			fnRenderItems(oGraph.getGroups());
			fnRenderItems(oGraph.getLines());
			fnRenderItems(oGraph.getNodes());
		}

		// map boundary
		sHtml += this._renderControl("rect", {
			x: 0,
			y: 0,
			width: oGraph._iWidth,
			height: oGraph._iHeight,
			"class": "sapSuiteUiCommonsNetworkGraphMapBoundary",
			"pointer-events": "fill"
		});

		// current viewport
		sHtml += this._renderControl("rect", {
			x: NAVIGATORLINESIZE / 2,
			y: NAVIGATORLINESIZE / 2,
			width: Math.min((oGraph.$scroller.width() - NAVIGATORLINESIZE / 2) / iZoomRatio, (oGraph.$svg.width() - NAVIGATORLINESIZE / 2) / iZoomRatio),
			height: Math.min((oGraph.$scroller.height() - NAVIGATORLINESIZE / 2) / iZoomRatio, (oGraph.$svg.height() - NAVIGATORLINESIZE / 2) / iZoomRatio),
			"class": "sapSuiteUiCommonsNetworkGraphMapNavigator",
			id: this._getDomId("mapNavigator")
		});

		sSvg += sHtml + "</svg>";
		this.$().find(".sapSuiteUiCommonsNetworkGraphMapContent").html(sSvg);

		// set navigator and viewport rect stroke width to fit viewbox ratio
		$svg = this.$("svg");
		iGraphWidth = oGraph._iWidth;
		iGraphHeight = oGraph._iHeight;

		iRatio = Math.max(iGraphWidth / $svg.width(), iGraphHeight / $svg.height());
		iStrokeWidthRating = Math.ceil(iRatio / 5);

		$svg.css("stroke-width", iStrokeWidthRating);
		this.$("mapNavigator").css("stroke-width", Math.max(3, 2 * iStrokeWidthRating));

		this._setupEvents();
		this._correctPosition();
		this.setBusy(false);
		this.fireMapReady();
	};

	/* =========================================================== */
	/* Private methods  */
	/* =========================================================== */
	GraphMap.prototype._correctMapNavigator = function () {
		var $mapNavigator = this.$("mapNavigator"),
			fWidth = parseFloat($mapNavigator.attr("width")),
			fHeight = parseFloat($mapNavigator.attr("height")),
			fX = parseFloat($mapNavigator.attr("x")),
			fY = parseFloat($mapNavigator.attr("y")),
			oGraph = this.getGraph(),
			iGraphWidth = oGraph._iWidth,
			iGraphHeight = oGraph._iHeight;

		// compare with max viewbox
		if (fWidth + fX > iGraphWidth) {
			$mapNavigator.attr("width", iGraphWidth - fX);
		}
		if (fHeight + fY > iGraphHeight) {
			$mapNavigator.attr("height", iGraphHeight - fY);
		}
	};

	GraphMap.prototype._resize = function () {
		var oGraph = this.getGraph(),
			$scroller = oGraph.$scroller,
			$mapNavigator = this.$("mapNavigator");

		$mapNavigator.attr("x", Math.max(NAVIGATORLINESIZE / 2, $scroller[0].scrollLeft / oGraph._fZoomRatio));
		$mapNavigator.attr("y", Math.max(NAVIGATORLINESIZE / 2, $scroller[0].scrollTop / oGraph._fZoomRatio));

		$mapNavigator.attr("width", $scroller.width() / oGraph._fZoomRatio);
		$mapNavigator.attr("height", $scroller.height() / oGraph._fZoomRatio);

		this._correctMapNavigator();
	};

	GraphMap.prototype._correctPosition = function () {
		var oGraph = this.getGraph(),
			$scroller = oGraph && oGraph.$scroller,
			$mapNavigator = this.$("mapNavigator");

		if (oGraph && $scroller[0]) {
			$mapNavigator.attr("x", Math.max(NAVIGATORLINESIZE / 2, $scroller[0].scrollLeft / oGraph._fZoomRatio));
			$mapNavigator.attr("y", Math.max(NAVIGATORLINESIZE / 2, $scroller[0].scrollTop / oGraph._fZoomRatio));

			this._correctMapNavigator();
		}
	};

	GraphMap.prototype._setupEvents = function () {
		var bDragging = false,
			oGraph = this.getGraph(),
			$svg = this.$("svg"),
			$scroller = oGraph.$scroller;

		var fnScrollScreen = function (oScrollData) {
			var $screen = oGraph.$svg,
				iRatio = Math.max($screen.width() / $svg.width(), $screen.height() / $svg.height()),
				$border = $svg.find(".sapSuiteUiCommonsNetworkGraphMapBoundary"),
				oScroller = $scroller[0],
				fRealStartX = $border.offset().left,
				fRealStartY = $border.offset().top;

			oScroller.scrollLeft = (oScrollData.pageX - fRealStartX) * iRatio - ($scroller.width() / 2);
			oScroller.scrollTop = (oScrollData.pageY - fRealStartY) * iRatio - ($scroller.height() / 2);
		};

		var fnEndDragging = function () {
			$svg.removeClass("sapSuiteUiCommonsNetworkGraphPanning");
			bDragging = false;
		};

		$scroller.scroll(function () {
			this._correctPosition();
		}.bind(this));

		$svg.off();
		$svg.mousedown(function (oEvent) {
			bDragging = true;
			fnScrollScreen(oEvent);
			oEvent.preventDefault();
		});

		$svg.mousemove(function (oEvent) {
			if (bDragging) {
				if (!$svg.hasClass("sapSuiteUiCommonsNetworkGraphPanning")) {
					$svg.addClass("sapSuiteUiCommonsNetworkGraphPanning");
				}

				fnScrollScreen(oEvent);
			}
		});

		$svg.mouseleave(function (oEvent) {
			fnEndDragging();
		});

		$svg.mouseup(function (oEvent) {
			fnEndDragging();
		});
	};

	GraphMap.prototype._onBeforeDataProcess = function () {
		if (this.getDomRef("svg")) {
			this.$("svg").html("");
			this.setBusy(true);
		}
	};

	GraphMap.prototype._onGraphReady = function () {
		setTimeout(this._renderMap.bind(this), 0);

		if (this._oResizeListener) {
			ResizeHandler.deregister(this._oResizeListener);
		}
		this._oResizeListener = ResizeHandler.register(this.getGraph().$("wrapper")[0], jQuery.proxy(this._resize, this));
	};

	GraphMap.prototype._removeListeners = function () {
		var oGraph = this.getGraph();
		if (oGraph) {
			oGraph.detachBeforeLayouting(this._onBeforeDataProcess, this);
			oGraph.detachGraphReady(this._onGraphReady, this);
			oGraph.detachZoomChanged(this._resize, this);
		}
	};

	GraphMap.prototype.destroy = function () {
		this._removeListeners();
		SvgBase.prototype.destroy.apply(this, arguments);
	};

	GraphMap.prototype.exit = function () {
		if (this._oResizeListener) {
			ResizeHandler.deregister(this._oResizeListener);
			this._oResizeListener = null;
		}
	};

	/* =========================================================== */
	/* Getters & Setters */
	/* =========================================================== */
	GraphMap.prototype.getTitle = function () {
		var sTitle = this.getProperty("title");
		return sTitle ? sTitle : oResourceBundle.getText("NETWORK_GRAPH_MAP_TITLE");
	};

	GraphMap.prototype.getGraph = function () {
		var sId = this.getAssociation("graph");
		return sId ? sap.ui.getCore().byId(sId) : null || null;
	};

	GraphMap.prototype.setGraph = function (oGraph) {
		this._removeListeners();
		this.setAssociation("graph", oGraph);

		var oGraphInstance = this.getGraph();

		if (oGraphInstance) {
			oGraphInstance.attachBeforeLayouting(this._onBeforeDataProcess, this);
			oGraphInstance.attachGraphReady(this._onGraphReady, this);
			oGraphInstance.attachZoomChanged(this._resize, this);
			if (oGraphInstance._isLayedOut()) {
				this._onGraphReady();
			}
		}

		return this;
	};

	return GraphMap;
});
