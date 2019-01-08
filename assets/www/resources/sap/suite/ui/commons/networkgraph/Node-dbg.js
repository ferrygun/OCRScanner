sap.ui.define([
	"jquery.sap.global",
	"sap/suite/ui/commons/library",
	"./ElementBase",
	"sap/ui/core/IconPool"
], function (jQuery, library, ElementBase, IconPool) {
	var Shape = library.networkgraph.NodeShape;

	var HEADER_SIZE = 32,
		TITLE_OFFSET = 5;

	var Size = {
		Circle: {
			WIDTH: 96,
			HEIGHT: 64
		},
		Box: {
			WIDTH: 128,
			HEIGHT: 32
		},
		Attributes: {
			LINE: 16,
			OFFSET: 8
		},
		ActionButtons: {
			RADIUS: 13,
			MARGIN: 6,
			OFFSET: 2
		},
		Title: {
			LINESIZE: 15,
			OFFSET: 8,
			ICON_SIZE: 16,
			INFO_BOX_SIZE: 20,
			ICON_X_OFFSET: 5,
			IMAGE_OFFSET_Y: 6
		},
		Description: {
			LINESIZE: 15
		},
		Image: {
			Box: 16,
			Circle: 32
		}
	};

	var ExpandState = {
		EXPANDED: "Expanded",
		COLLAPSED: "Collapsed",
		PARTIAL: "Partial"
	};

	var ActionIcons = {
		EXPAND: "sys-add",
		COLLAPSE: "sys-minus",
		PARTIAL: "overlay"
	};

	var sIconAdd = IconPool.getIconInfo(ActionIcons.EXPAND),
		sIconMinus = IconPool.getIconInfo(ActionIcons.COLLAPSE),
		sIconOverlay = IconPool.getIconInfo(ActionIcons.PARTIAL);

	sIconAdd = sIconAdd && sIconAdd.content;
	sIconMinus = sIconMinus && sIconMinus.content;
	sIconOverlay = sIconOverlay && sIconOverlay.content;

	var oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.suite.ui.commons");

	/**
	 * Constructor for a new Node.
	 *
	 * @class
	 * Holds information about one node.
	 *
	 * @extends sap.suite.ui.commons.networkgraph.ElementBase
	 *
	 * @constructor
	 * @public
	 * @since 1.50
	 * @alias sap.suite.ui.commons.networkgraph.Node
	 */
	var Node = ElementBase.extend("sap.suite.ui.commons.networkgraph.Node", {
		metadata: {
			library: "sap.suite.ui.commons",
			properties: {
				/**
				 * Defines if the subtree of this node is collapsed. By default, it is expanded.
				 */
				collapsed: {
					type: "boolean", group: "Misc", defaultValue: false
				},
				/**
				 * Shows if the node is selected. Once the node is selected, its appearance changes slightly
				 * to distinguish it from other nodes.
				 */
				selected: {
					type: "boolean", group: "Misc", defaultValue: false
				},
				/**
				 * Key of the group where this node is included.
				 */
				group: {
					type: "string", group: "Misc", defaultValue: null
				},
				/**
				 * Key of the node. This key is used throughout the DOM to reference this node,
				 * mainly in the connector line (Line) elements of the graph.
				 */
				key: {
					type: "string", group: "Misc", defaultValue: null
				},
				/**
				 * Shape of the node. The shape is round by default. To create a rectangular node, set this property to Box.
				 */
				shape: {
					type: "sap.suite.ui.commons.networkgraph.NodeShape", groups: "Behavior", defaultValue: Shape.Circle
				},
				/**
				 * An icon associated with the element.
				 */
				icon: {
					type: "string", group: "Appearance", defaultValue: null
				},
				/**
				 * Width of the node. If the width is not defined, the node expands, so it can fit the content.
				 */
				width: {
					type: "int", group: "Misc", defaultValue: undefined
				},
				/**
				 * Height of the node. This attribute is applied only for the circle type of node and determines the
				 * circle diameter.
				 */
				height: {
					type: "int", group: "Misc", defaultValue: undefined
				},
				/**
				 * Maximum width allowed. The auto grow algorithm stops increasing the width at this value.
				 */
				maxWidth: {
					type: "int", group: "Misc", defaultValue: undefined
				},
				/**
				 * The x coordinate of the node. This value must be set after the layout algorithm has finished
				 * arranging the graph. It may come from the input data but is not required for most
				 * layout algorithms.
				 */
				x: {
					type: "float", group: "Misc", defaultValue: 0
				},
				/**
				 * The y coordinate of the node. This value must be set after the layout algorithm has finished
				 * arranging the graph. It may come from the input data but is not required for most layout
				 * algorithms.
				 */
				y: {
					type: "float", group: "Misc", defaultValue: 0
				},
				/**
				 * Determines if the expand button is visible.
				 */
				showExpandButton: {
					type: "boolean", defaultValue: true
				},
				/**
				 * Determines if the links button is visible.
				 */
				showActionLinksButton: {
					type: "boolean", defaultValue: true
				},
				/**
				 * Determines if the details button is visible.
				 */
				showDetailButton: {
					type: "boolean", defaultValue: true
				},
				/**
				 * Determines the maximum number of lines allowed for the node's label. If set to 0, the label may
				 * have an unlimited number of lines.
				 */
				titleLineSize: {
					type: "int", defaultValue: 1
				},
				/**
				 * Determines the maximum number of lines allowed to be displayed in the node's description.
				 * If you want to hide the description, set this property to <code>-1</code> (default). To
				 * display an unlimited number of lines, set this property to <code>0</code>.
				 * This property does not affect the description that appears in the tooltip, which is always
				 * fully rendered.
				 */
				descriptionLineSize: {
					type: "int", defaultValue: -1
				},
				/**
				 * Determines the size of the node's icon. This property can be applied only to circular nodes.
				 */
				iconSize: {
					type: "int", group: "Appearance", defaultValue: undefined
				}
			},
			aggregations: {
				/**
				 * A list of links to be shown in the links area. A link may point to any UI5 control. It's up to the
				 * caller to set up all necessary callback functions.
				 */
				actionLinks: {
					type: "sap.ui.core.Control", multiple: true, singularName: "actionLink"
				},
				/**
				 * A list of custom action buttons. These buttons are displayed in the button area for each node.
				 * A node may have up to 4 buttons. The default 3 buttons (collapse/expand, details, and links)
				 * have priority over any other custom buttons that you add.
				 * If you want all 4 of your custom buttons to be displayed, set the visibility of the default buttons
				 * to false.
				 */
				actionButtons: {
					type: "sap.suite.ui.commons.networkgraph.ActionButton", multiple: true, singularName: "actionButton"
				},
				/**
				 * The image that is displayed in the node's header instead of the icon.
				 */
				image: {
					type: "sap.suite.ui.commons.networkgraph.NodeImage", multiple: false, singularName: "nodeImage"
				}
			},
			events: {
				/**
				 * This event is fired when the user clicks or taps the node.
				 */
				press: {},
				/**
				 * This event is fired when the user moves the mouse pointer over the node.
				 */
				hover: {},
				/**
				 * This event is fired when the user clicks the node's collapse/expand button.
				 */
				collapseExpand: {}
			}
		},
		renderer: function (oRM, oControl) {
			// NOTE: this render is considered to be called only for single item invalidation
			// whole graph has different render path
			oRM.write(oControl._render());
		},
		onAfterRendering: function () {
			this._afterRenderingBase();
		}
	});

	// sum of properties that if changed requires data reprocessing
	Node.prototype.aProcessRequiredProperties = ["key", "group"];

	/* =========================================================== */
	/* Events & pseudo events */
	/* =========================================================== */
	Node.prototype.init = function (mOptions) {
		this._oExpandState = ExpandState.EXPANDED;
		// contains object of the group this node belongs to (if any)
		this._oGroup = null;
		// calculated (or set) width of node
		this._iWidth = 0;
		// calculated (or set) height of node
		this._iHeight = 0;
		// width of area for labels in box attributes area (used for maxWidth calculation)
		this._iLabelAttrWidth = 0;
		// width of area for values in box attributes area (used for maxWidth calculation)
		this._iValueAttrWidth = 0;
		// title words split into lines based by node width
		this._aTitleLines = [[]];
		// description words split into lines based by node width
		this._aDescriptionLines = [[]];
		// indicates whether this node is visible (!== collapsed !!!). If true this node was collapsed by some other node
		this._bIsHidden = false;
		// Flag for remembering action buttons were rendered (as they are rendered only once, and then their visibility
		// is via CSS of selection class
		this._bActionButtonsRendered = false;
		// size of circle diameter
		this._iCircleSize = 0;
		// collection of action buttons (DOM only not sap class)
		this._aActionButtons = [];
		// collection of action buttons actions, so that they can be triggered from outside
		this._aActionButtonsClicks = [];

		this._clearChildren();
	};

	// not and event, placed here to have all private stuff in one place
	Node.prototype._clearChildren = function () {
		// node with connection this node => other node
		this.aChildren = [];
		// node with connection other node => this node
		this.aParents = [];
		// lines with connection this node => other node
		this.aLines = [];
		// line with connection other node => this node
		this.aParentLines = [];
	};

	Node.prototype._afterRendering = function () {
		if (this._oGroup && this._oGroup.getCollapsed()) {
			return;
		}

		this._correctTitle("sapSuiteUiCommonsNetworkNodeTitle");

		this._setupEvents();

		if (this._bIsHidden) {
			this.$().hide();
		}

		if (this._oExpandState === ExpandState.COLLAPSED) {
			this.$().addClass("sapSuiteUiCommonsNetworkNodeCollapsed");
		}

		if (this._oExpandState === ExpandState.PARTIAL) {
			this.$().addClass("sapSuiteUiCommonsNetworkNodePartialCollapsed");
		}

		this._bActionButtonsRendered = false;
	};

	/* =========================================================== */
	/* Rendering */
	/* =========================================================== */
	Node.prototype._render = function (mOptions) {
		var sNodeHtml = "",
			sId;

		if (this._isIgnored() || !this.getVisible()) {
			return "";
		}

		mOptions = mOptions || {};

		sId = mOptions.mapRender ? this.getId() + "_map" : this.getId();

		sNodeHtml += this._renderControl("g", {
			id: sId,
			nodeid: this.getKey(),
			"class": this._getNodeClass()
		}, false);

		sNodeHtml += this._renderControl("g", {
			id: sId + "-wrapper"
		}, false);

		sNodeHtml += this._isBox() ? this._renderBox() : this._renderCircle();

		if (this._displayAttributes()) {
			sNodeHtml += mOptions.sizeDetermination ? this._renderAttributesForSize() : this._renderAttributes({
				// single line title is not rendered using offset so don't append it
				y: this.getY() + this._getDescriptionHeight() + this._getTitleHeight() + Size.Title.OFFSET + (!this._hasMultiLineTitle() ? Size.Attributes.OFFSET : 0)
			});
		}

		sNodeHtml += "</g>";
		sNodeHtml += "</g>";

		return sNodeHtml;
	};

	Node.prototype._renderCircle = function () {
		var sHtml = "",
			fX = this.getX(),
			fY = this.getY(),
			STATUS_OFFSET = 4,
			iInfoOffsetX, iInfoOffsetY,
			iCircleSize = this._iCircleSize,
			bIsRtl = this.getParent()._bIsRtl,
			oImage = this.getImage(), oImageSize;

		sHtml += this._renderControl("circle", {
			id: this.getId() + "-innerBox",
			cx: fX + this._iWidth / 2,
			cy: fY + iCircleSize / 2,
			r: iCircleSize / 2,
			"class": "sapSuiteUiCommonsNetworkInnerCircle"
		});

		sHtml += this._renderControl("circle", {
			id: this.getId() + "-focusCircle",
			cx: fX + this._iWidth / 2,
			cy: fY + iCircleSize / 2,
			r: iCircleSize / 2 - STATUS_OFFSET,
			"class": "sapSuiteUiCommonsNetworkCircleFocus"
		});

		if (this._displayImage(oImage)) {
			oImageSize = this._getImageSize();
			sHtml += this._renderControl("image", {
				"xlink:href": oImage.getSrc(),
				x: fX + this._iWidth / 2 - oImageSize.width / 2,
				y: fY + iCircleSize / 2 - oImageSize.height / 2,
				width: oImageSize.width,
				height: oImageSize.height
			});
		} else if (this.getIcon()) {
			sHtml += this._renderIcon({
				attributes: {
					"class": "sapSuiteUiCommonsNetworkGraphIcon sapSuiteUiCommonsNetworkCircleNodeIcon",
					"style": this.getIconSize() ? ("font-size:" + this.getIconSize() + "px") : "",
					x: fX + this._iWidth / 2,
					y: fY + iCircleSize / 2
				},
				icon: this.getIcon(),
				height: this.getIconSize() ? this.getIconSize() - 2 : 22 /* default icon size offset */
			});
		}

		if (this.getTitle()) {
			if (!this._aTitleLines || this._aTitleLines.length === 1) {
				sHtml += this._renderClipPath({
					id: this.getId() + "-title-clip",
					x: fX,
					y: fY + iCircleSize + Size.Title.OFFSET - 10,
					height: Size.Title.LINESIZE * 2 // margin for font
				});
				sHtml += this._renderTitle({
					"class": "sapSuiteUiCommonsNetworkNodeTitle sapSuiteUiCommonsNetworkNodeText",
					x: fX + this._iWidth / 2,
					y: fY + iCircleSize + Size.Title.OFFSET,
					title: this.getTitle(),
					maxWidth: this._iWidth - 5
				});
			} else {
				sHtml += this._renderMultilineTitle({
					x: fX + this._iWidth / 2,
					y: fY + iCircleSize + Size.Title.OFFSET * 2
				});
			}
		}
		// description
		if (this._displayDescription()) {
			sHtml += this._renderDescription({
				x: bIsRtl ? fX + this._iWidth - Size.Title.OFFSET : fX + Size.Title.OFFSET,
				y: fY + this._getTitleHeight() + iCircleSize + Size.Title.OFFSET * 2 + Size.Title.OFFSET / 2
			});
		}

		// numbers are offset from circle top position
		iInfoOffsetX = iCircleSize / 8;
		iInfoOffsetY = iCircleSize / 5.3;
		sHtml += this._renderInfoIcon(bIsRtl ? this._getCirclePosition().x + iCircleSize - iInfoOffsetX : this._getCirclePosition().x + iInfoOffsetX, fY + iInfoOffsetY);

		return sHtml;
	};

	Node.prototype._renderBox = function () {
		var TITLE_SIZE_Y = HEADER_SIZE / 2,
			FOCUS_OFFSET = 4,
			fY = this.getY(),
			fX = this.getX(),
			sTitleLeft = Size.Title.ICON_X_OFFSET,
			bIsRtl = this.getParent()._bIsRtl,
			oImage = this.getImage(),
			iTitleWidth, oImageSize = this._getImageSize();

		var sHtml = this._renderControl("rect", {
			id: this.getId() + "-innerBox",
			x: fX,
			y: fY,
			"class": "sapSuiteUiCommonsNetworkInnerRect",
			rx: 5,
			ry: 5,
			width: this._iWidth,
			height: this._iHeight,
			"pointer-events": "fill"
		});

		sHtml += this._renderControl("rect", {
			x: fX + FOCUS_OFFSET,
			y: fY + FOCUS_OFFSET,
			"class": "sapSuiteUiCommonsNetworkBoxFocus",
			rx: 5,
			ry: 5,
			width: this._iWidth - FOCUS_OFFSET * 2,
			height: this._iHeight - FOCUS_OFFSET * 2
		});

		if (this._displayImage(oImage)) {
			oImageSize = this._getImageSize();
			sHtml += this._renderControl("image", {
				"xlink:href": oImage.getSrc(),
				x: bIsRtl ? fX + this._iWidth - Size.Title.ICON_X_OFFSET - oImageSize.width : fX + Size.Title.ICON_X_OFFSET,
				y: fY + Size.Title.IMAGE_OFFSET_Y,
				width: oImageSize.width,
				height: oImageSize.height
			});
			sTitleLeft += oImageSize.width + Size.Title.ICON_X_OFFSET;
		} else if (this.getIcon()) {
			sHtml += this._renderIcon({
				attributes: {
					"class": "sapSuiteUiCommonsNetworkGraphIcon sapSuiteUiCommonsNetworkNodeTitleIcon",
					x: bIsRtl ? fX + this._iWidth - Size.Title.ICON_X_OFFSET : fX + Size.Title.ICON_X_OFFSET,
					y: fY + TITLE_SIZE_Y
				},
				icon: this.getIcon(),
				height: Size.Title.LINESIZE
			});
			sTitleLeft += Size.Title.ICON_SIZE + Size.Title.ICON_X_OFFSET;
		}

		if (this.getTitle()) {
			iTitleWidth = this._iWidth - sTitleLeft - TITLE_OFFSET;
			// for images larger than the node itself - we ignore title
			if (iTitleWidth > 0) {
				if (!this._aTitleLines || this._aTitleLines.length === 1) {
					sHtml += this._renderClipPath({
						id: this.getId() + "-title-clip",
						x: fX,
						y: fY,
						height: HEADER_SIZE
					});
					sHtml += this._renderTitle({
						"class": "sapSuiteUiCommonsNetworkNodeTitle sapSuiteUiCommonsNetworkNodeText",
						x: bIsRtl ? fX + this._iWidth - sTitleLeft : fX + sTitleLeft,
						y: fY + TITLE_SIZE_Y,
						maxWidth: iTitleWidth,
						title: this.getTitle()
					});
				} else {
					sHtml += this._renderMultilineTitle({
						x: bIsRtl ? fX + this._iWidth - sTitleLeft : fX + sTitleLeft,
						y: fY + Size.Title.OFFSET * 2
					});
				}
			}
		}

		if (this._displayDescription()) {
			sHtml += this._renderDescription({
				x: bIsRtl ? fX + this._iWidth - Size.Title.OFFSET : fX + Size.Title.OFFSET - Size.Title.OFFSET / 3,
				y: fY + this._getTitleHeight() + (this._hasMultiLineTitle() ? (Size.Title.OFFSET * 2 + Size.Title.OFFSET / 2) : Size.Title.OFFSET * 3)
			});
		}

		sHtml += this._renderInfoIcon(this.getParent()._bIsRtl ? this.getX() : this.getX() + this._iWidth - Size.Title.INFO_BOX_SIZE, fY);

		return sHtml;
	};

	Node.prototype._renderInfoIcon = function (iX, iY) {
		var sHtml = "<g class=\"sapSuiteUiCommonsNetworkNodeInfoWrapper\">",
			bIsRtl = this.getParent()._bIsRtl;

		if (this._isBox()) {
			sHtml += this._renderRoundRect({
				"class": "sapSuiteUiCommonsNetworkNodeInfoBox",
				x: iX,
				y: iY,
				width: Size.Title.INFO_BOX_SIZE,
				height: Size.Title.INFO_BOX_SIZE,
				topRight: bIsRtl ? 0 : 5,
				topLeft: bIsRtl ? 5 : 0,
				bottomLeft: bIsRtl ? 0 : 8,
				bottomRight: bIsRtl ? 8 : 0
			});
		} else {
			sHtml += this._renderControl("circle", {
				"class": "sapSuiteUiCommonsNetworkNodeInfoBox",
				cx: iX,
				cy: iY,
				r: (Size.Title.INFO_BOX_SIZE - 1) / 2
			});
		}

		sHtml += this._renderIcon({
			attributes: {
				"class": "sapSuiteUiCommonsNetworkNodeInfoIcon sapSuiteUiCommonsNetworkGraphIcon",
				x: iX + Size.Title.INFO_BOX_SIZE / 2 - (!this._isBox() ? 10 : 0),
				y: iY + (this._isBox() ? (Size.Title.INFO_BOX_SIZE / 2) - 1 : -0.5)
			},
			icon: "sap-icon://notification",
			height: Size.Title.INFO_BOX_SIZE / 2 + 2.5
		});

		sHtml += "</g>";
		return sHtml;
	};

	Node.prototype._getNodeClass = function () {
		var sSelectedClass = this.getSelected() ? this.SELECT_CLASS : "";
		return "sapSuiteUiCommonsNetworkNode " + sSelectedClass +
			(this._isBox() ? " sapSuiteUiCommonsNetworkBox " : " sapSuiteUiCommonsNetworkNodeCircle ") + this._getStatusClass();
	};

	Node.prototype._renderAttributesForSize = function () {
		var sLabelWrapper = "",
			sValueWrapper = "";
		this.getVisibleAttributes().forEach(function (oItem) {
			sLabelWrapper += this._renderText({
				attributes: {
					"class": "sapSuiteUiCommonsNetworkGraphAttribute",
					x: this.getX(),
					y: this.getY()
				},
				text: oItem.getLabel()
			});

			sValueWrapper += this._renderText({
				attributes: {
					"class": "sapSuiteUiCommonsNetworkGraphAttribute",
					x: this.getX(),
					y: this.getY()
				},
				text: oItem.getValue()
			});
		}, this);

		sLabelWrapper = "<g id=\"" + this.getId() + "-attrLabel\">" + sLabelWrapper + "</g>";
		sValueWrapper = "<g id=\"" + this.getId() + "-attrValue\">" + sValueWrapper + "</g>";

		return sLabelWrapper + sValueWrapper;
	};

	Node.prototype._renderAttributes = function (mProperties) {
		mProperties = mProperties || {};

		var PATH_OFFSET = 2,
			BORDER = 4,
			DELIMITER = BORDER * 3;

		var bIsRtl = this.getParent()._bIsRtl,
			iLabelStart = bIsRtl ? this.getX() + this._iWidth - BORDER : this.getX() + BORDER,
			iLabelWidth = this._iLabelAttrWidth ? this._iLabelAttrWidth : this._iWidth / 2 - DELIMITER,
			iValueStart = bIsRtl ? iLabelStart - iLabelWidth - DELIMITER : iLabelStart + iLabelWidth + DELIMITER,
			iValueWidth = bIsRtl ? iValueStart - this.getX() - BORDER : (this.getX() + this._iWidth) - iValueStart - BORDER;

		var sValueWrapper = this._renderControl("g", {
				"clip-path": "url(#" + this.getId() + "-clip-attr-value)",
				id: this.getId() + "-attrValue"
			}, false),
			sLabelWrapper = this._renderControl("g", {
				"clip-path": "url(#" + this.getId() + "-clip-attr-label)",
				id: this.getId() + "-attrLabel"
			}, false),
			fStart = mProperties.y,
			sClip = this._renderClipPath({
				id: this.getId() + "-clip-attr-label",
				x: bIsRtl ? iLabelStart - iLabelWidth - BORDER + PATH_OFFSET : iLabelStart - PATH_OFFSET,
				y: fStart,
				width: PATH_OFFSET * 2 + (bIsRtl ? iLabelWidth + BORDER : iLabelWidth)
			});

		sClip += this._renderClipPath({
			id: this.getId() + "-clip-attr-value",
			x: bIsRtl ? this.getX() + BORDER + PATH_OFFSET : iValueStart - PATH_OFFSET,
			y: fStart,
			width: PATH_OFFSET * 2 + (bIsRtl ? iValueWidth + BORDER : iValueWidth)
		});

		this.getVisibleAttributes().forEach(function (oItem, i) {
			var iY = fStart + Size.Attributes.LINE * (i + 1);
			sLabelWrapper += this._renderText({
				attributes: {
					"class": "sapSuiteUiCommonsNetworkGraphAttribute",
					x: iLabelStart,
					y: iY
				},
				text: oItem.getLabel()
			});

			sValueWrapper += this._renderText({
				attributes: {
					"class": "sapSuiteUiCommonsNetworkGraphAttribute",
					x: iValueStart,
					y: iY
				},
				text: oItem.getValue()
			});

		}, this);

		sValueWrapper += "</g>";
		sLabelWrapper += "</g>";
		return sClip + sLabelWrapper + sValueWrapper;
	};

	Node.prototype._detailClick = function (oOpener) {
		oOpener = oOpener || this;
		this.getParent()._tooltip.openDetail({
			item: this,
			opener: oOpener
		});
	};

	Node.prototype._linksClick = function (oOpener) {
		oOpener = oOpener || this;
		this.getParent()._tooltip.openLink({
			item: this,
			opener: oOpener
		});
	};

	Node.prototype._expandClick = function () {
		var bExecuteDefault = this.fireEvent("collapseExpand", {}, true);
		if (bExecuteDefault) {
			this.setCollapsed(this._oExpandState !== ExpandState.COLLAPSED);
		}
	};

	/* =========================================================== */
	/* Private methods */
	/* =========================================================== */
	Node.prototype._applyMaxWidth = function () {
		var OFFSET = 30,
			TITLE_OFFSET = 10;

		var iNodeWidth, $labelAttr, $valueAttr, iValueAttrWidth = 0, iLabelAttrWidth = 0, iAttrWidth = 0, iLargerAttr,
			iMaxWidth = this.getMaxWidth();

		if (this._oGroup && this._oGroup.getCollapsed()) {
			return;
		}

		if (!this.getWidth() && this.getMaxWidth()) {
			$labelAttr = this.$("attrLabel");
			$valueAttr = this.$("attrValue");
			if ($labelAttr[0]) {
				iLabelAttrWidth = $labelAttr[0].getBBox().width;
			}

			if ($valueAttr[0]) {
				iValueAttrWidth = $valueAttr[0].getBBox().width;
			}
			iAttrWidth = iValueAttrWidth + iLabelAttrWidth + OFFSET;

			iNodeWidth = Math.max(this.$()[0].getBBox().width + TITLE_OFFSET, iAttrWidth);
			this._iWidth = Math.min(iNodeWidth, iMaxWidth);

			if ((iValueAttrWidth && iLabelAttrWidth)) {
				// this fix size of value and label column to better fit node's width
				// if there is any room we enlarge the bigger column to take place more then half of the node
				iLargerAttr = Math.max(iLabelAttrWidth, iValueAttrWidth);
				if (iLargerAttr * 2 + OFFSET / 2 < this._iWidth) {
					// do nothing both attributes can be on their side
					return;
				}

				if (iAttrWidth > this._iWidth) {
					if (iValueAttrWidth < iMaxWidth / 2) {
						this._iLabelAttrWidth = this._iWidth - iValueAttrWidth - OFFSET / 2;
					}
					if (iLabelAttrWidth < this._iWidth / 2) {
						this._iLabelAttrWidth = iLabelAttrWidth + OFFSET / 2;
					}
				} else {
					this._iLabelAttrWidth = this._iWidth - iValueAttrWidth - OFFSET;
				}
			}
		}
	};

	Node.prototype._setupWidthAndHeight = function () {
		var sTypeName = this._isBox() ? "Box" : "Circle",
			iTitleHeight = this._getTitleHeight(),
			iTitleOffset = this.getTitle() || this._hasDetailData() ? Size.Title.LINESIZE : 0,
			iDescriptionHeight = this._getDescriptionHeight(),
			iHeight, iWidth = Size[sTypeName].WIDTH;

		if (!this._isBox()) {
			iHeight = this.getHeight() ? this.getHeight() : Size.Circle.HEIGHT;
			this._iCircleSize = iHeight;
		} else {
			iHeight = iDescriptionHeight +
				(this._hasMultiLineTitle() ? iTitleHeight + Size.Title.OFFSET : Math.max(iTitleHeight + iTitleOffset, Size.Box.HEIGHT));
		}

		if (this._displayAttributes()) {
			iHeight += this.getVisibleAttributes().length * Size.Attributes.LINE + Size.Attributes.OFFSET;
		}

		// box has multiline height already computed in its base height
		if (!this._isBox()) {
			iHeight += iTitleHeight + iDescriptionHeight;
		}

		this._iHeight = iHeight;

		if (this.getWidth()) {
			this._iWidth = this.getWidth();
		} else if (this._iWidth) {
			if (this._iWidth < iWidth) {
				this._iWidth = iWidth;
			}
		} else {
			this._iWidth = iWidth;
		}

		// for circle width can't be smaller as we display circle of radius of height so we have to be sure width
		// is at least the same
		if (!this._isBox() && this._iWidth < this._iCircleSize) {
			this._iWidth = this._iCircleSize;
		}
	};

	Node.prototype._getTitleHeight = function () {
		var iHeight = 0,
			oImageSize = this._getImageSize();

		if (this._hasMultiLineTitle()) {
			iHeight = (((this.getTitleLineSize() > 0) ? Math.min(this._aTitleLines.length, this.getTitleLineSize()) : this._aTitleLines.length )) * Size.Title.LINESIZE;
		} else {
			iHeight = (this._isBox() || this.getTitle()) ? Size.Title.LINESIZE : 0;
		}

		return Math.max(oImageSize.height, iHeight);
	};

	Node.prototype._getDescriptionHeight = function () {
		var iMaxLines = this.getDescriptionLineSize();
		if (iMaxLines === -1 || !this._aDescriptionLines || !this.getDescription()) {
			return 0;
		}
		return (iMaxLines > 0 ? Math.min(iMaxLines, this._aDescriptionLines.length) : this._aDescriptionLines.length) * Size.Description.LINESIZE;
	};

	Node.prototype._setupEvents = function () {
		var $wrapper = this.$("wrapper");

		$wrapper.mousedown(function (oEvent) {
			this._mouseDown(oEvent.ctrlKey);
			oEvent.preventDefault();
		}.bind(this));

		$wrapper.mouseover(function (oEvent) {
			this._mouseOver();
		}.bind(this));

		$wrapper.mouseout(function (oEvent) {
			this._mouseOut();
		}.bind(this));
	};

	Node.prototype._mouseOut = function () {
		this.$().removeClass(this.HIGHLIGHT_CLASS);
	};

	Node.prototype._mouseOver = function () {
		var bExecuteDefault = this.fireEvent("hover", {}, true);

		if (!this.getSelected() && bExecuteDefault) {
			this.$().addClass(this.HIGHLIGHT_CLASS);
		}
	};

	Node.prototype._mouseDown = function (bIsCtrlKey) {
		var bExecuteDefault = this.fireEvent("press", {}, true);

		this.getParent()._selectNode({
			element: this,
			forceFocus: true,
			renderActionButtons: bExecuteDefault && !this.getSelected(),
			preventDeselect: bIsCtrlKey
		});

		if (!this.getSelected()) {
			// this prevent flickering when click on the same node over and over
			// _selectNode removes highglight class and it is reselected by mouseover (but after it is triggered)
			this.$().addClass(this.HIGHLIGHT_CLASS);
		}
	};

	Node.prototype._getExpandIcon = function (bReturnName) {
		switch (this._oExpandState) {
			case ExpandState.PARTIAL:
				return bReturnName ? ActionIcons.PARTIAL : sIconOverlay;
			case ExpandState.EXPANDED:
				return bReturnName ? ActionIcons.COLLAPSE : sIconMinus;
			case ExpandState.COLLAPSED:
				return bReturnName ? ActionIcons.EXPAND : sIconAdd;
			default:
				return bReturnName ? ActionIcons.EXPAND : sIconAdd;
		}
	};

	Node.prototype._createLineText = function (sText, iWidth, oText, iMaxLines) {
		var aLines = [[]],
			iLine = 0, sRest,
			sWord, aLine, aWords, sTrimmedWord, bTrimmed,
			oSpan = this._createElement("tspan");

		if (!sText || iWidth < 0) {
			return aLines;
		}

		aWords = sText.split(/\s+/).reverse();

		oText.appendChild(oSpan);

		while (aWords.length > 0) {
			sWord = aWords.pop();
			// skip empty words
			if (sWord) {
				aLine = aLines[iLine];
				aLine.push(sWord);
				oSpan.textContent = aLines[iLine].join(" ");
				if (oSpan.getComputedTextLength() > iWidth) {
					if (aLine.length > 1) {
						aWords.push(aLine.pop());
					}

					if (aLine.length === 1) {
						bTrimmed = this._createText(oText, {
							text: aLine[0],
							width: iWidth,
							dots: false
						});

						if (bTrimmed) {
							sTrimmedWord = oSpan.textContent;

							aLine.pop();
							aLine.push(sTrimmedWord);
							sRest = sWord.substring(sTrimmedWord.length);
							aWords.push(sRest);
						}
					}

					iLine++;

					// we don't need lines we wont render
					if (iMaxLines > 0 && iLine >= iMaxLines) {
						break;
					}
					aLines[iLine] = [];
				}
			}
		}


		// add dots for shortened title
		if (iMaxLines > 0 && aWords.length > 0) {
			aLines[aLines.length - 1].push("...");
		}

		if (aLines.length > 0) {
			// trim last line if its too long
			bTrimmed = this._createText(oText, {
				text: aLines[aLines.length - 1].join(" "),
				width: iWidth,
				dots: true
			});

			if (bTrimmed) {
				aLines[iMaxLines - 1] = [oSpan.textContent];
			}
		}

		return aLines;
	};

	Node.prototype._createDescription = function () {
		var oText,
			iWidth = this._iWidth - Size.Title.OFFSET,
			$node = this.$();

		if (this._displayDescription() && $node[0]) {
			oText = this._createElement("text");
			oText.setAttribute("class", "sapSuiteUiCommonsNetworkNodeDescription");
			// we have to set font size by style because classes may not be downloaded yet
			oText.setAttribute("style", "font-size:0.75rem");
			$node[0].appendChild(oText);

			this._aDescriptionLines = this._createLineText(this.getDescription(), iWidth, oText, this.getDescriptionLineSize());
		}
	};

	Node.prototype._createMultilineTitle = function () {
		var fnGetPossibleTitleSize = function () {
			if (this._isBox()) {
				if (this._displayImage()) {
					return this._iWidth - this._getImageSize().width - Size.Title.ICON_X_OFFSET * 2;
				}

				if (this.getIcon()) {
					return this._iWidth - Size.Title.ICON_SIZE - Size.Title.ICON_X_OFFSET * 2;
				}
			}

			return this._iWidth;
		}.bind(this);

		var oText,
			iWidth = fnGetPossibleTitleSize(),
			$node = this.$();

		if (this.getTitleLineSize() !== 1 && $node[0] && iWidth > 0) {
			oText = this._createElement("text");
			oText.setAttribute("class", "sapSuiteUiCommonsNetworkNodeTitle sapSuiteUiCommonsNetworkNodeMultipleLineTitle");
			oText.setAttribute("style", "font-size:0.75rem");

			$node[0].appendChild(oText);

			this._aTitleLines = this._createLineText(this.getTitle(), iWidth, oText, this.getTitleLineSize());
		}
	};

	Node.prototype.getFocusDomRef = function () {
		return this.getDomRef("wrapper");
	};

	Node.prototype._renderMultilineText = function (mAttributes) {
		var sHtml = "";

		if (!mAttributes.lines) {
			return "";
		}

		for (var i = 0; i < mAttributes.lines.length; i++) {
			sHtml += this._renderText({
				attributes: {
					"class": mAttributes.class,
					x: mAttributes.x,
					y: mAttributes.y + (i * mAttributes.lineSize)
				},
				close: false
			});

			sHtml += mAttributes.lines[i].join(" ");
			sHtml += "</text>";
		}

		return sHtml;
	};

	Node.prototype._renderDescription = function (mAttributes) {
		mAttributes.class = " sapSuiteUiCommonsNetworkNodeTitle sapSuiteUiCommonsNetworkNodeMultipleLineTitle";

		return this._renderMultilineText({
			lines: this._aDescriptionLines,
			maxLineSize: this.getDescriptionLineSize(),
			lineSize: Size.Description.LINESIZE,
			"class": " sapSuiteUiCommonsNetworkNodeDescription ",
			x: mAttributes.x,
			y: mAttributes.y
		});
	};

	Node.prototype._renderMultilineTitle = function (mAttributes) {
		return this._renderMultilineText({
			lines: this._aTitleLines,
			maxLineSize: this.getTitleLineSize(),
			lineSize: Size.Title.LINESIZE,
			"class": " sapSuiteUiCommonsNetworkNodeTitle sapSuiteUiCommonsNetworkNodeMultipleLineTitle",
			x: mAttributes.x,
			y: mAttributes.y,
			trim: this._aTitleLines.length > this.getTitleLineSize() && this.getTitleLineSize() !== 0
		});
	};

	Node.prototype._processHideShowParents = function (bCollapse, sRootId, oChildren) {
		var bIsInCollapsedGroup = this._oGroup && this._oGroup.getCollapsed();

		var fnCheckNode = function (oNode) {
			if (oNode._bIsHidden) {
				return;
			}

			// if there is any visible node for parent set parent's state to PARTIAL otherwise set it as COLLAPSED/EXPANDED
			var bHasDifferent = false,
				bHidden;
			// check whether parent node is either root
			if (oNode.getKey() !== sRootId) {
				// we check whether there are any children with different state then action state
				// if so we change this to partial, if there is not any visible children we set COLLAPSED
				// otherwise we set EXPANDED
				if (oNode.aChildren.length > 0) {
					bHidden = oNode.aChildren[0]._bIsHidden;
					oNode.aChildren.forEach(function (oChildNode) {
						if (bHidden !== oChildNode._bIsHidden) {
							bHasDifferent = true;
						}
					});

					oNode._oExpandState = bHasDifferent ? ExpandState.PARTIAL : bHidden ? ExpandState.COLLAPSED : ExpandState.EXPANDED; // eslint-disable-line
					if (oNode._oExpandState === ExpandState.COLLAPSED) {
						oNode.$().addClass("sapSuiteUiCommonsNetworkNodeCollapsed");
					} else {
						oNode.$().removeClass("sapSuiteUiCommonsNetworkNodeCollapsed");
					}
					if (oNode._oExpandState === ExpandState.PARTIAL) {
						oNode.$().addClass("sapSuiteUiCommonsNetworkNodePartialCollapsed");
					} else {
						oNode.$().removeClass("sapSuiteUiCommonsNetworkNodePartialCollapsed");
					}
				}
			}
		};

		// we need to check this node too for cases none of the children was changed still this node can hold wrong
		// state from the last iteration
		fnCheckNode(this);

		// change direct parent's state
		this.aParents.forEach(function (oNode) {
			if (!oChildren[oNode.getKey()]) {
				fnCheckNode(oNode);
			}
		});

		// for collapsed group we need to check every node's parent
		if (bIsInCollapsedGroup) {
			if (this._oGroup._bNeedParentProcessing) {
				this._oGroup.aNodes.forEach(function (oGroupNode) {
					oGroupNode.aParents.forEach(function (oParentNode) {
						if (!oChildren[oParentNode.getKey()]) {
							fnCheckNode(oParentNode);
						}
					});
				});
				this._oGroup._bNeedParentProcessing = false;
			}
		}
	};

	Node.prototype._getAllChildren = function (bCollapse, sRootId, oChildren) {
		var fnAppend = function (sKey) {
			if (!oChildren[sKey]) {
				oChildren[sKey] = this;
				return true;
			}

			return false;
		}.bind(this);

		// we can reach the root itself by recursion, if so, exit
		if (sRootId === this.getKey()) {
			return;
		}

		// if this node is already collapsed(expanded) - depends on action taken we don't want to revert node's state
		if (this._bIsHidden === bCollapse) {
			return;
		}

		if (!fnAppend(this.getKey())) {
			// we already visited this node in this recursion
			return;
		}

		// for collapsed group we need to process every node in the group
		if (this._oGroup && this._oGroup.getCollapsed()) {
			this._oGroup.aNodes.forEach(function (oNode) {
				oNode._getAllChildren(bCollapse, sRootId, oChildren);
			});
		}

		// if node is collapsed by user, we don't stop recursion as this node and its children hold their state
		if (this._oExpandState !== ExpandState.COLLAPSED) {
			this.aChildren.forEach(function (oNode) {
				oNode._getAllChildren(bCollapse, sRootId, oChildren);
			});
		}
	};

	Node.prototype._hideShow = function (bCollapse, sRootId) {
		var fnHasGroupVisibleNode = function (oGroup) {
			return oGroup.aNodes.some(function (oNode) {
				return !oNode._bIsHidden;
			});
		};

		var sFunctionName = bCollapse ? "hide" : "show",
			bHasVisibleNodes;

		this._bIsHidden = bCollapse;

		this.aLines.forEach(function (oLine) {
			oLine._hideShow(bCollapse);
		});

		this.aParentLines.forEach(function (oLine) {
			oLine._hideShow(bCollapse, sRootId);
		});

		if (this.$()) {
			this.$()[sFunctionName]();
		}

		// group management	for collapsed hide whole group
		// for expanded check whether group has any visible node -> if not hide it, otherwise hide only node
		if (this._oGroup) {
			if (this._oGroup.getCollapsed()) {
				this._oGroup._hideShow(bCollapse, sRootId);
			} else {
				bHasVisibleNodes = fnHasGroupVisibleNode(this._oGroup);
				if ((bHasVisibleNodes && !bCollapse) || (!bHasVisibleNodes && bCollapse)) {
					this._oGroup.$()[sFunctionName]();
					this._oGroup._bIsHidden = bCollapse;
				}
			}
		}
	};

	Node.prototype._setActionButtonFocus = function (oItem, bFocus) {
		this.$().removeClass(this.FOCUS_CLASS);
		this.$().find(".sapSuiteUiCommonsNetworkNodeActionButton").parent().removeClass(this.FOCUS_CLASS);
		var sFnAction = bFocus ? "addClass" : "removeClass";
		jQuery(oItem)[sFnAction](this.FOCUS_CLASS);
	};

	Node.prototype._getActionButtonTitle = function (oItem) {
		return oResourceBundle.getText("NETWORK_GRAPH_ACCESSIBILITY_ACTION_BUTTON") + " " + jQuery(oItem).find("title").html();
	};

	Node.prototype._getAccessibilityLabel = function () {
		var sLabel = oResourceBundle.getText("NETWORK_GRAPH_NODE") + " " + this.getTitle();
		if (this._isBox()) {
			this.getVisibleAttributes().forEach(function (oAttribute) {
				sLabel += " " + oAttribute.getLabel() + " " + oAttribute.getValue();
			});
		}
		return sLabel;
	};

	/* =========================================================== */
	/* Public methods */
	/* =========================================================== */
	/**
	 * Check whether node has visible action buttons
	 * @returns {boolean} Returns true if node has action buttons displayed.
	 * @public
	 */
	Node.prototype.hasVisibleActionButtons = function () {
		return this.$().hasClass(this.VISIBLE_ACTIONS_BUTTONS_CLASS);
	};

	/**
	 * Gets the node's action buttons that are enabled.
	 * @returns {Array} Returns an array of enabled action buttons.
	 * @public
	 */
	Node.prototype.getEnabledActionButtons = function () {
		return this.$().find(".sapSuiteUiCommonsNetworkNodeActionButton").parent().toArray();
	};

	/**
	 * Shows or hides the node's action buttons.
	 * @param {boolean} bShow indicates whether to hide or to show buttons
	 * @public
	 */
	Node.prototype.showActionButtons = function (bShow) {
		var iRealButtonCount,
			aActionButtonPositions,
			that = this, iButtonIndex = 0,
			MAX_BUTTONS = 4,
			oWrapper, oExpandElements, iStartX, iStartY,
			oMenuElements, oLinksElements; // eslint-disable-line

		var fnCreateButtonPositions = function () {
			var iStartX = this.getParent()._bIsRtl ? -Size.ActionButtons.RADIUS - Size.ActionButtons.MARGIN : Size.ActionButtons.RADIUS + Size.ActionButtons.MARGIN,
				iStartY = Size.ActionButtons.RADIUS,
				aPoints = [[iStartX, iStartY]];
			for (var i = 1; i < iRealButtonCount; i++) {
				aPoints.push([iStartX, iStartY + Size.ActionButtons.RADIUS * 2 * i + Size.ActionButtons.OFFSET * i]);
			}

			return aPoints;
		}.bind(this);

		var fnGetRealButtonCount = function () {
			var iCount = this.getActionButtons().length;
			if (this.getShowExpandButton()) {
				iCount++;
			}

			if (this.getShowDetailButton()) {
				iCount++;
			}

			if (this.getShowActionLinksButton()) {
				iCount++;
			}

			return iCount;
		}.bind(this);

		var fnCreateIcon = function (mArguments) {
			var IE_ICON_OFFSET = 13,
				FOCUS_SIZE = 2;

			var oCircleOptions = {
					cx: mArguments.x,
					cy: mArguments.y,
					id: mArguments.id + "-circle",
					"class": "sapSuiteUiCommonsNetworkNodeActionButton",
					r: Size.ActionButtons.RADIUS
				}, oIconOptions = {
					"class": "sapSuiteUiCommonsNetworkGraphIcon sapSuiteUiCommonsNetworkNodeActionIcon " + (mArguments.class ? mArguments.class : ""),
					x: mArguments.x,
					y: mArguments.y
				},
				oFocus, oTitle, oCircle, oIcon, oButtonWrapper, $button;

			if (!mArguments.enable) {
				oCircleOptions.class = "sapSuiteUiCommonsNetworkNodeActionButtonDisabledBackground";
				oWrapper.appendChild(this._createElement("circle", oCircleOptions));
				oCircleOptions.class = "sapSuiteUiCommonsNetworkNodeActionButtonDisabled";
				oIconOptions.class += " sapSuiteUiCommonsNetworkNodeActionButtonDisabled";
			}

			oButtonWrapper = this._createElement("g", {
				id: mArguments.id
			});
			oFocus = this._createElement("circle", {
				id: mArguments.id + "-circle",
				cx: mArguments.x,
				cy: mArguments.y,
				r: Size.ActionButtons.RADIUS - FOCUS_SIZE,
				"class": "sapSuiteUiCommonsNetworkActionButtonFocusCircle"
			});
			oCircle = this._createElement("circle", oCircleOptions);
			oIcon = this._createIcon(oIconOptions, mArguments.icon, IE_ICON_OFFSET);

			if (mArguments.title) {
				oTitle = this._createElement("title");
				oTitle.textContent = mArguments.title;
				oCircle.appendChild(oTitle);
			}

			oButtonWrapper.appendChild(oCircle);
			oButtonWrapper.appendChild(oIcon);
			oButtonWrapper.appendChild(oFocus);

			oWrapper.appendChild(oButtonWrapper);

			$button = jQuery(oCircle);

			if (mArguments.enable) {
				$button.mousedown(function () {
					// remove focus from node and add focus to clicked action button
					$button.addClass("sapSuiteUiCommonsNetworkNodeActionButtonClicked");
					this._setActionButtonFocus(oButtonWrapper, true);
					this._setFocus(false);
					if (this.getParent()) {
						this.getParent().setFocus({item: this, button: oButtonWrapper});
					}
				}.bind(this));

				$button.mouseup(function () {
					$button.removeClass("sapSuiteUiCommonsNetworkNodeActionButtonClicked");
				});

				jQuery(oCircle).click(mArguments.click);
				this._aActionButtonsClicks.push(mArguments.click);
			}

			this._aActionButtons.push(oButtonWrapper);
			iButtonIndex++;
			return {
				icon: oIcon,
				wrapper: oCircle
			};
		}.bind(this);

		var sFnAction = bShow ? "addClass" : "removeClass";
		this.$()[sFnAction](this.VISIBLE_ACTIONS_BUTTONS_CLASS);

		iRealButtonCount = fnGetRealButtonCount();
		aActionButtonPositions = fnCreateButtonPositions();

		if (iRealButtonCount === 0) {
			return;
		}

		if (bShow && !this._bActionButtonsRendered) {
			this._aActionButtons = [];
			this._aActionButtonsClicks = [];

			iStartX = this.getX();
			iStartY = this.getY();

			if (!this.getParent()._bIsRtl) {
				iStartX += (this._isBox() ? this._iWidth : this._iWidth / 2 + this._iCircleSize / 2);
			} else if (!this._isBox()) {
				iStartX += this._iWidth / 2 - this._iCircleSize / 2;
			}

			oWrapper = this._createElement("g", {
				"class": "sapSuiteUiCommonsNetworkNodeActionButtonWrapper",
				id: this._getDomId("actionButtons")
			});
			this.$()[0].appendChild(oWrapper);

			// expand
			if (this.getShowExpandButton()) {
				oExpandElements = fnCreateIcon({
					x: iStartX + aActionButtonPositions[iButtonIndex][0],
					y: iStartY + aActionButtonPositions[iButtonIndex][1],
					icon: this._getExpandIcon(true),
					"class": "sapSuiteUiCommonsNetworkNodeActionCollapseIcon",
					enable: this._hasVisibleChildren(),
					title: oResourceBundle.getText("NETWORK_GRAPH_EXPAND_COLLAPSE"),
					id: this._getDomId("actionCollapse"),
					click: this._expandClick.bind(this)
				});

				this._expandIcon = oExpandElements.icon;
			}

			// detail
			if (this.getShowDetailButton()) {
				oMenuElements = fnCreateIcon({
					x: iStartX + aActionButtonPositions[iButtonIndex][0],
					y: iStartY + aActionButtonPositions[iButtonIndex][1],
					icon: "sap-icon://menu",
					enable: this._hasDetailData() || this.getTitle(),
					id: this._getDomId("actionDetail"),
					title: oResourceBundle.getText("NETWORK_GRAPH_NODE_DETAILS"),
					click: function () {
						this._detailClick(oMenuElements.wrapper);
					}.bind(this)
				});
			}

			// links
			if (this.getShowActionLinksButton()) {
				oLinksElements = fnCreateIcon({
					x: iStartX + aActionButtonPositions[iButtonIndex][0],
					y: iStartY + aActionButtonPositions[iButtonIndex][1],
					icon: "sap-icon://chain-link",
					enable: this._hasActionLinks(),
					title: oResourceBundle.getText("NETWORK_GRAPH_NODE_LINKS"),
					id: this._getDomId("actionLinks"),
					click: function () {
						this._linksClick(oLinksElements.wrapper);
					}.bind(this)
				});
			}

			// render missing action buttons
			for (var i = 0; iButtonIndex < MAX_BUTTONS && i < this.getActionButtons().length; i++) {
				(function (oButton) {  // eslint-disable-line
					var oButtonElements = fnCreateIcon({
						x: iStartX + aActionButtonPositions[iButtonIndex][0],
						y: iStartY + aActionButtonPositions[iButtonIndex][1],
						icon: oButton.getIcon(),
						title: oButton.getTitle(),
						id: oButton.getId(),
						click: function (oEvent) { // eslint-disable-line no-loop-func
							oButton.firePress({
								buttonElement: oButtonElements.wrapper
							});
						},
						enable: true
					});
				})(this.getActionButtons()[i]);
			}

			this._bActionButtonsRendered = true;
		} else if (this._expandIcon) {
			this._expandIcon.textContent = that._getExpandIcon();
			// remove action button focus
			this.$().find("." + this.FOCUS_CLASS).removeClass(this.FOCUS_CLASS);
		}
	};

	/**
	 * @returns {Array} Returns all child nodes.
	 * @public
	 */
	Node.prototype.getChildNodes = function () {
		this._checkForProcessData();
		return this.aChildren;
	};

	/**
	 * @returns {Array} Returns all lines connected to the child nodes.
	 * @public
	 */
	Node.prototype.getChildLines = function () {
		this._checkForProcessData();
		return this.aLines;
	};

	/**
	 * @returns {Array} Returns all parent nodes.
	 * @public
	 */
	Node.prototype.getParentNodes = function () {
		this._checkForProcessData();
		return this.aParents;
	};

	/**
	 * @returns {Array} Returns all lines connected to the parent nodes.
	 * @public
	 */
	Node.prototype.getParentLines = function () {
		this._checkForProcessData();
		return this.aParentLines;
	};

	/**
	 * Indicates whether the node is hidden by collapsing any of its parent nodes.
	 * @returns {boolean|*} true if node is hidden.
	 * @public
	 */
	Node.prototype.isHidden = function () {
		return this._bIsHidden;
	};

	/**
	 * Returns center position of the node
	 * @returns {object} Object with X and Y coordinate of center of the node. For circle nodes this returns center of circle.
	 * @public
	 */
	Node.prototype.getCenterPosition = function () {
		var oCirclePos, oCircleHalfSize;
		if (this._isBox()) {
			return {
				x: this.getX() + this._iWidth / 2,
				y: this.getY() + this._iHeight / 2
			};
		}

		oCirclePos = this._getCirclePosition();
		oCircleHalfSize = this._getCircleSize() / 2;

		return {
			x: oCirclePos.x + oCircleHalfSize,
			y: oCirclePos.y + oCircleHalfSize
		};
	};

	/* =========================================================== */
	/* Getters & setters*/
	/* =========================================================== */
	Node.prototype.setX = function (fX) {
		this.setProperty("x", fX, true);
		return this;
	};

	Node.prototype.setY = function (fY) {
		this.setProperty("y", fY, true);
		return this;
	};

	Node.prototype.setSelected = function (bSelected) {
		var oParent = this.getParent(),
			sFnName = bSelected ? "addClass" : "removeClass",
			sKey = this.getKey();

		this.setProperty("selected", bSelected, true);
		this.$()[sFnName](this.SELECT_CLASS);

		if (oParent) {
			if (bSelected) {
				oParent._mSelectedNodes[sKey] = this;
			} else {
				delete oParent._mSelectedNodes[sKey];
			}
		}

		return this;
	};

	Node.prototype.setCollapsed = function (bCollapse) {
		var oChildren = {},
			aChildrenKeys,
			oParent,
			sFnName = bCollapse ? "addClass" : "removeClass",
			$icon = this.$().find(".sapSuiteUiCommonsNetworkNodeActionCollapseIcon");

		this.setProperty("collapsed", bCollapse, true);
		this._oExpandState = bCollapse ? ExpandState.COLLAPSED : ExpandState.EXPANDED;

		this.aChildren.forEach(function (oNode) {
			oNode._getAllChildren(bCollapse, this.getKey(), oChildren);
		}, this);

		aChildrenKeys = Object.keys(oChildren);

		aChildrenKeys.forEach(function (sKey) {
			oChildren[sKey]._hideShow(bCollapse, this.getKey());
		}, this);

		aChildrenKeys.forEach(function (sKey) {
			oChildren[sKey]._processHideShowParents(bCollapse, this.getKey(), oChildren);
		}, this);

		this.aLines.forEach(function (oLine) {
			oLine._hideShow(bCollapse);
		});

		if ($icon[0]) {
			$icon[0].textContent = this._getExpandIcon();
		}

		this.$().removeClass("sapSuiteUiCommonsNetworkNodePartialCollapsed");
		this.$()[sFnName]("sapSuiteUiCommonsNetworkNodeCollapsed");

		oParent = this.getParent();
		if (oParent) {
			oParent._setupKeyboardNavigation();
			if (bCollapse && !(oParent.getFocus() && oParent.getFocus().item === this)) {
				oParent.setFocus({item: this});
			}
		}

		return this;
	};

	Node.prototype.setGroup = function (sGroup) {
		var oParent = this.getParent();
		this.setProperty("group", sGroup, true);
		if (oParent) {
			oParent.invalidate();
		}

		return this;
	};

	Node.prototype.setShape = function (sShape) {
		var oParent = this.getParent();
		this.setProperty("shape", sShape, true);
		if (oParent) {
			oParent.invalidate();
		}

		return this;
	};

	Node.prototype.setWidth = function (iWidth) {
		var oParent = this.getParent();
		this.setProperty("width", iWidth, true);
		if (oParent) {
			oParent.invalidate();
		}

		return this;
	};

	Node.prototype.setMaxWidth = function (iMaxWidth) {
		var oParent = this.getParent();
		this.setProperty("maxWidth", iMaxWidth, true);
		if (oParent) {
			oParent.invalidate();
		}

		return this;
	};

	Node.prototype.setTitleLineSize = function (iTitleLineSize) {
		var oParent = this.getParent();
		this.setProperty("titleLineSize", iTitleLineSize, true);
		if (oParent) {
			oParent.invalidate();
		}

		return this;
	};

	/* =========================================================== */
	/* Helper methods */
	/* =========================================================== */
	Node.prototype._isIgnored = function () {
		return (this.getParent()._getLayoutAlgorithm().isLayered() && this._oGroup
			&& (this._oGroup.getCollapsed() || this._oGroup._isIgnored()))
			|| !this._useInLayout();
	};

	Node.prototype._getImageSize = function () {
		var fnReturn = function (iWidth, iHeight) {
			return {
				width: iWidth ? parseInt(iWidth, 10) : 0,
				height: iHeight ? parseInt(iHeight, 10) : 0
			};
		};

		var sType = this._isBox() ? "Box" : "Circle",
			oImage = this.getImage();

		if (!this._displayImage(oImage)) {
			return fnReturn();
		}

		return fnReturn(oImage.getWidth() ? oImage.getWidth() : Size.Image[sType],
			oImage.getHeight() ? oImage.getHeight() : Size.Image[sType]);
	};

	Node.prototype._displayImage = function (oImage) {
		oImage = oImage || this.getImage();
		return oImage && oImage.getSrc();
	};

	Node.prototype._isInCollapsedGroup = function () {
		return this._oGroup && this._oGroup.getCollapsed();
	};

	Node.prototype._displayAttributes = function () {
		return this.getVisibleAttributes().length !== 0 && this._isBox();
	};

	Node.prototype._displayDescription = function () {
		return this.getDescriptionLineSize() !== -1 && this.getDescription();
	};

	Node.prototype._hasTitle = function () {
		return this.getTitle() || this.getIcon();
	};

	Node.prototype._isBox = function () {
		return this.getShape() === Shape.Box && this.getParent()._getLayoutAlgorithm().isLayered();
	};

	Node.prototype._hasChildren = function () {
		return this.aChildren.length > 0;
	};

	Node.prototype._hasVisibleChildren = function () {
		// at least one node has to be visible and outside invisible group
		return this.aChildren.some(function (oNode) {
			return !(oNode._oGroup && !oNode._oGroup.getVisible()) && oNode.getVisible();
		});
	};

	Node.prototype._hasDetailData = function () {
		return this.getDescription() || this.getAttributes().length > 0;
	};

	Node.prototype._hasActionLinks = function () {
		return this.getActionLinks().some(function (oLink) {
			return oLink.getVisible();
		});
	};

	Node.prototype._useAutomaticSize = function () {
		return !this.getWidth() && this.getMaxWidth() > 0;
	};

	Node.prototype._getCircleSize = function () {
		return this._isBox() ? undefined : this._iCircleSize;
	};

	Node.prototype._hasMultiLineTitle = function () {
		return this._aTitleLines && this._aTitleLines.length > 1;
	};

	Node.prototype._getCirclePosition = function () {
		return this._isBox() ? undefined : {
			x: this.getX() + (this._iWidth - this._getCircleSize()) / 2,
			y: this.getY()
		};
	};

	Node.prototype.getFocusDomRef = function () {
		return this.getDomRef("wrapper");
	};

	return Node;
})
;
