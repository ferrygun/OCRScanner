sap.ui.define([
	"jquery.sap.global",
	"./ElementBase",
	"sap/ui/core/IconPool"
], function (jQuery, ElementBase, IconPool) {
	var HEADER_SIZE = 32;

	var Size = {
		COLLAPSED_HEIGHT: 32,
		COLLAPSED_WIDTH: 160
	};

	var sIconCollapse = IconPool.getIconInfo("collapse"),
		sIconExpand = IconPool.getIconInfo("expand"),
		sIconMenu = IconPool.getIconInfo("menu");

	sIconCollapse = sIconCollapse && sIconCollapse.content;
	sIconExpand = sIconExpand && sIconExpand.content;
	sIconMenu = sIconMenu && sIconMenu.content;

	var oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.suite.ui.commons");

	/**
	 * Constructor for a new Group. Grouping is not supported for custom layouting.
	 *
	 * @class
	 * Holds details about a group.
	 *
	 * @extends sap.suite.ui.commons.networkgraph.ElementBase
	 *
	 * @constructor
	 * @public
	 * @since 1.50
	 * @alias sap.suite.ui.commons.networkgraph.Group
	 */
	var Group = ElementBase.extend("sap.suite.ui.commons.networkgraph.Group", {
		metadata: {
			library: "sap.suite.ui.commons",
			properties: {
				/**
				 * The key of the group. This key is used to assign nodes to groups.
				 */
				key: {
					type: "string", group: "Misc", defaultValue: null
				},
				/**
				 * Defines whether the group is collapsed. By default, it is expanded.
				 */
				collapsed: {
					type: "boolean", group: "Misc", defaultValue: false
				}
			},
			events: {
				/**
				 * This event is fired when the user clicks or taps the collapse/expand button.
				 */
				collapseExpand: {},

				/**
				 * This event is fired when the user clicks or taps the group's details button.
				 */
				showDetail: {},

				/**
				 * This event is fired when the user clicks or taps the header of the group.
				 */
				press: {}
			}
		}
	});

	// sum of properties that if changed requires data reprocessing
	Group.prototype.aProcessRequiredProperties = ["key"];

	Group.BUTTONS = {
		MENU: "menu",
		COLLAPSE: "collapse"
	};

	/* =========================================================== */
	/* Events & pseudo events */
	/* =========================================================== */
	Group.prototype.init = function () {
		this._iWidth = Size.COLLAPSED_WIDTH;
		this._iHeight = Size.COLLAPSED_HEIGHT;

		// group action buttons
		this._oActionButtons = {};

		this._clearChildren();

		this._bIsHidden = false;
	};

	Group.prototype._afterRendering = function () {
		this._setupEvents();

		this._correctTitle("sapSuiteUiCommonsNetworkGroupTitle");

		if (!this._isVisible()) {
			this.$().hide();
		}
	};

	/* =========================================================== */
	/* Rendering */
	/* =========================================================== */
	Group.prototype._render = function (mOptions) {
		var FOCUS_OFFSET = 4;

		var sGroupHtml = "",
			fX = this.getX(), fY = this.getY(),
			mCheckedOptions = mOptions || {};

		if (this._isIgnored() || this._isEmpty() || !this.getVisible()) {
			return "";
		}

		if (this.getParent()._isLayered()) {
			var sId = mCheckedOptions.mapRender ? this.getId() + "_map" : this.getId();

			sGroupHtml += this._renderControl("g", {
				id: sId,
				xindex: mCheckedOptions.xIndex || 0,
				nodeid: this.getKey(),
				"class": this._getGroupClass()
			}, false);

			sGroupHtml += this._renderControl("rect", {
				x: fX,
				y: fY,
				rx: 5,
				ry: 5,
				"class": "sapSuiteUiCommonsNetworkGroupWrapper",
				width: this._iWidth,
				height: this._iHeight
			});

			if (this.getCollapsed()) {
				sGroupHtml += this._renderControl("rect", {
					id: this.getId() + "-header",
					x: fX,
					y: fY,
					width: this._iWidth,
					height: HEADER_SIZE,
					"class": "sapSuiteUiCommonsNetworkGroupHeader"
				});
			} else {
				sGroupHtml += this._renderRoundRect({
					id: this.getId() + "-header",
					x: fX,
					y: fY,
					width: this._iWidth,
					height: HEADER_SIZE,
					"class": "sapSuiteUiCommonsNetworkGroupHeader",
					topRight: 5,
					topLeft: 5
				});
			}

			// focus
			sGroupHtml += this._renderControl("rect", {
				x: fX + FOCUS_OFFSET,
				y: fY + FOCUS_OFFSET,
				width: this._iWidth - FOCUS_OFFSET * 2,
				height: HEADER_SIZE - FOCUS_OFFSET * 2,
				"class": "sapSuiteUiCommonsNetworkGroupFocus"
			});

			sGroupHtml += this._prepareRenderTitle();
			sGroupHtml += this._renderHeaderButtons();

			sGroupHtml += "</g>";
		}

		return sGroupHtml;
	};

	Group.prototype._prepareRenderTitle = function () {
		var BUTTONS_SIZE = 65,
			TITLE_SIZE_Y = HEADER_SIZE / 2,
			OFFSET_X = 5,
			fX = this.getX(), fY = this.getY(),
			iTextWidth = this._iWidth - OFFSET_X - BUTTONS_SIZE,
			bIsRtl = this.getParent()._bIsRtl;

		var sHtml = "";

		if (this.getTitle()) {
			sHtml += this._renderClipPath({
				id: this.getId() + "-title-clip",
				x: bIsRtl ? fX + BUTTONS_SIZE + OFFSET_X : fX + OFFSET_X,
				y: fY,
				width: iTextWidth
			});

			sHtml += this._renderTitle({
				"class": "sapSuiteUiCommonsNetworkGroupTitle",
				x: bIsRtl ? fX + this._iWidth - OFFSET_X : fX + OFFSET_X,
				y: fY + TITLE_SIZE_Y,
				maxWidth: iTextWidth,
				title: this.getTitle()
			});
		}

		return sHtml;
	};

	Group.prototype._renderHeaderButtons = function () {
		var FOCUS_BUTTON_OFFSET = 2;

		var sGroupHtml = "",
			ICON_SIZE = 32,
			LINE_SIZE = 0.5,
			iLeftPos = 0,
			bIsRtl = this.getParent()._bIsRtl;

		var fnCreateIcon = function (sTitle, sIcon, sId, iTopRight, iBottomRight) {
			var iX = bIsRtl ? this.getX() + iLeftPos : this.getX() + this._iWidth - ICON_SIZE - iLeftPos,
				iY = this.getY() + LINE_SIZE;

			sGroupHtml += "<g><title>" + sTitle + "</title>";
			sGroupHtml += this._renderRoundRect({
				id: this.getId() + "-" + sId,
				x: iX,
				y: iY,
				width: ICON_SIZE - LINE_SIZE,
				height: ICON_SIZE - LINE_SIZE * 2,
				"class": "sapSuiteUiCommonsNetworkGroupHeaderActionIconWrapper",
				topRight: iTopRight,
				bottomRight: iBottomRight
			});

			sGroupHtml += this._renderControl("rect", {
				x: iX + FOCUS_BUTTON_OFFSET,
				y: iY + FOCUS_BUTTON_OFFSET,
				width: ICON_SIZE - LINE_SIZE - FOCUS_BUTTON_OFFSET * 2,
				height: ICON_SIZE - LINE_SIZE * 2 - FOCUS_BUTTON_OFFSET * 2,
				"class": "sapSuiteUiCommonsNetworkActionButtonFocusCircle"
			});

			sGroupHtml += this._renderText({
				attributes: {
					x: bIsRtl ? this.getX() + ICON_SIZE / 2 + iLeftPos : this.getX() + this._iWidth - ICON_SIZE / 2 - iLeftPos,
					y: this.getY() + ICON_SIZE / 2,
					"class": "sapSuiteUiCommonsNetworkGroupHeaderActionIcon sapSuiteUiCommonsNetworkGraphIcon"
				},
				text: sIcon,
				height: ICON_SIZE / 2 - 2
			});

			sGroupHtml += "</g>";

			iLeftPos += ICON_SIZE;
		}.bind(this);

		fnCreateIcon(oResourceBundle.getText("NETWORK_GRAPH_EXPAND_COLLAPSE"), this.getCollapsed() ? sIconExpand : sIconCollapse, "collapse", 5, this.getCollapsed() ? 5 : 0);
		fnCreateIcon(oResourceBundle.getText("NETWORK_GRAPH_GROUP_DETAIL"), sIconMenu, "menu");

		return sGroupHtml;
	};

	Group.prototype._getGroupClass = function () {
		return "sapSuiteUiCommonsNetworkGroup " + this._getStatusClass() +
			(this.getCollapsed() ? "sapSuiteUiCommonsNetworkGroupCollapsed" : "sapSuiteUiCommonsNetworkGroupExpanded");
	};

	/* =========================================================== */
	/* Public methods */
	/* =========================================================== */

	/**
	 * @returns {Array} Returns all child nodes of the group.
	 * @public
	 */
	Group.prototype.getChildNodes = function () {
		this._checkForProcessData();
		return this.aChildren;
	};

	/**
	 * @returns {Array} Returns all lines connected to the group's child nodes.
	 * @public
	 */
	Group.prototype.getChildLines = function () {
		this._checkForProcessData();
		return this.aLines;
	};

	/**
	 * @returns {Array} Returns all parent nodes of the group.
	 * @public
	 */
	Group.prototype.getParentNodes = function () {
		this._checkForProcessData();
		return this.aParents;
	};

	/**
	 * @returns {Array} Returns all lines connected to the parent nodes of the group.
	 * @public
	 */
	Group.prototype.getParentLines = function () {
		this._checkForProcessData();
		return this.aParentLines;
	};

	/**
	 * @returns {Array} Returns all nodes belonging to this group.
	 * @public
	 */
	Group.prototype.getNodes = function () {
		this._checkForProcessData();
		return this.aNodes;
	};

	Group.prototype.isHidden = function () {
		return this._bIsHidden;
	};

	/* =========================================================== */
	/* Private methods */
	/* =========================================================== */
	Group.prototype._clearChildren = function () {
		this.aNodes = [];
		this.aLines = [];
		this.aChildren = [];
		this.aParentLines = [];
		this.aParents = [];
	};

	Group.prototype._hideShow = function (bCollapse) {
		this.$()[bCollapse ? "hide" : "show"]();
		this._bIsHidden = bCollapse;
	};

	Group.prototype._setButtonFocus = function ($button, bFocus) {
		var sFnName = bFocus ? "addClass" : "removeClass";
		$button[sFnName]("sapSuiteUiCommonsNetworkElementFocus");
	};

	Group.prototype._setMenuButtonFocus = function (bFocus) {
		this._setButtonFocus(jQuery(this._oActionButtons.menu), bFocus);
	};

	Group.prototype._setCollapseButtonFocus = function (bFocus) {
		this._setButtonFocus(jQuery(this._oActionButtons.collapse), bFocus);
	};

	Group.prototype._setupEvents = function () {
		var $menu = this.$("menu"),
			$header = this.$("header"),
			$collapse = this.$("collapse");

		this._oActionButtons.menu = $menu.parent()[0];
		this._oActionButtons.collapse = $collapse.parent()[0];

		$menu.click(function (oEvent) {
			this._setMenuButtonFocus(true);

			var bExecuteDefault = this.fireEvent("showDetail", {}, true);
			if (bExecuteDefault) {
				this._openDetail();
			}

			if (this.getParent()) {
				this.getParent().setFocus({
					item: this,
					button: Group.BUTTONS.MENU
				});
			}
		}.bind(this));

		$collapse.click(function (oEvent) {
			this._collapse();
			if (this.getParent()) {
				this.getParent().setFocus({
					item: this,
					button: Group.BUTTONS.COLLAPSE
				});
			}
		}.bind(this));

		$header.click(function (oEvent) {
			if (this.getParent()) {
				this.getParent().setFocus({
					item: this
				});
			}

			this.firePress();
		}.bind(this));
	};

	Group.prototype._collapse = function () {
		this.getParent()._selectElementAfterScroll = this;
		this.fireEvent("collapseExpand", {}, true);
		this.setCollapsed(!this.getCollapsed());
	};

	Group.prototype._openDetail = function () {
		var $menu = this.$("menu");
		this.getParent()._tooltip.openDetail({
			item: this,
			opener: $menu[0]
		});
	};

	Group.prototype._isEmpty = function () {
		return this.aNodes.length === 0;
	};

	Group.prototype._isIgnored = function() {
		if (!this._useInLayout()) {
			return true;
		}

		return !this.aNodes.some(function (oNode) {
			return oNode._useInLayout();
		});
	};

	Group.prototype._isVisible = function () {
		return this.aNodes.some(function (oNode) {
			return !oNode.isHidden();
		});
	};

	Group.prototype._resetSize = function () {
		if (this.getCollapsed()) {
			this._iHeight = Size.COLLAPSED_HEIGHT;
			this._iWidth = Size.COLLAPSED_WIDTH;
		}
	};

	Group.prototype._getAccessibilityLabel = function () {
		return oResourceBundle.getText("NETWORK_GRAPH_GROUP") + " " + this.getTitle();
	};

	/* =========================================================== */
	/* Setters & getters */
	/* =========================================================== */
	Group.prototype.setX = function (fX) {
		this.fX = fX;
		return this;
	};

	Group.prototype.getX = function () {
		return this.fX;
	};

	Group.prototype.setY = function (fY) {
		this.fY = fY;
		return this;
	};

	Group.prototype.getY = function () {
		return this.fY;
	};

	Group.prototype.setCollapsed = function (bCollapsed) {
		if (bCollapsed !== this.getCollapsed()) {
			var oParent = this.getParent(),
				aItems = [];
			this.setProperty("collapsed", bCollapsed, true);

			// when collapsing the group, deselect all child nodes to prevent inconsistency
			if (bCollapsed) {
				this.getNodes().forEach(function (oNode) {
					if (oNode.getSelected()) {
						oNode.setSelected(false);
						aItems.push(oNode);
					}
				});

				this.getChildLines().forEach(function (oLine) {
					if (oLine.getSelected() && oLine._isInCollapsedGroup()) {
						oLine.setSelected(false);
						aItems.push(oLine);
					}
				});

				if (oParent) {
					oParent.fireSelectionChange({items: aItems});
				}
			}

			if (oParent) {
				oParent.invalidate();
			}
		}

		return this;
	};

	return Group;
});
