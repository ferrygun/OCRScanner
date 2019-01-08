sap.ui.define([
	"jquery.sap.global",
	"sap/suite/ui/commons/library",
	"./SvgBase",
	"sap/ui/base/ManagedObject"
], function (jQuery, library, SvgBase, ManagedObject) {

	var Status = library.networkgraph.ElementStatus;

	/**
	 * Constructor for a new ElementBase.
	 *
	 * @class
	 * ElementBase class
	 *
	 * @extends sap.ui.core.Control
	 *
	 * @constructor
	 * @public
	 * @since 1.50
	 * @abstract
	 * @alias sap.suite.ui.commons.networkgraph.ElementBase
	 */
	var ElementBase = SvgBase.extend("sap.suite.ui.commons.networkgraph.ElementBase", {
		metadata: {
			properties: {
				/**
				 * A title associated with the element.
				 */
				title: {
					type: "string", group: "Misc", defaultValue: null
				},
				/**
				 * Description.
				 */
				description: {
					type: "string", group: "Misc", defaultValue: null
				},
				/**
				 * Status associated with this element. The color of the element is semantic and is based on its status.
				 */
				status: {
					type: "sap.suite.ui.commons.networkgraph.ElementStatus",
					group: "Appearance",
					defaultValue: Status.Standard
				}
			},
			aggregations: {
				/**
				 * Attributes associated with the element.
				 */
				attributes: {
					type: "sap.suite.ui.commons.networkgraph.ElementAttribute",
					multiple: true,
					singularName: "attribute"
				}
			}
		},
		renderer: {}
	});

	ElementBase.prototype._afterRenderingBase = function () {
		var $parent, oSvgElement;
		// due to the fact how render manager works (it parse html via doc. fragment) which doesn't
		// work with SVG elements we have to rerender it properly again in after rendering
		// to get this event triggered we still set some stuff to render manager in render function

		// for some browsers innerHTML is not working(so we have to convert parsed HTML to it's SVG representatives
		// and replace it manually
		if (this._cannotAppendInnerHtml()) {
			$parent = this.$().parent();
			oSvgElement = this._convertToSvg(jQuery.parseHTML(this._render()));

			$parent[0].replaceChild(oSvgElement, this.$()[0]);
		} else {
			this.$()[0].outerHTML = this._render();
		}

		this._afterRendering();
	};

	ElementBase.prototype._setFocus = function (bFocus) {
		var fnName = bFocus ? "addClass" : "removeClass";
		this.$()[fnName](this.FOCUS_CLASS);
	};

	ElementBase.prototype._useInLayout = function() {
		return true;
	};

	ElementBase.prototype._hasFocus = function () {
		return this.$().hasClass(this.FOCUS_CLASS);
	};

	ElementBase.prototype._checkForProcessData = function () {
		var oParent = this.getParent();
		if (oParent && oParent._bRequiresDataProcessing) {
			oParent._processData();
		}
	};

	/**
	 * Return all visible attributes
	 * @returns {array} return array with attributes with visible flag ON
	 */
	ElementBase.prototype.getVisibleAttributes = function () {
		return this.getAttributes().filter(function (oAttr) {
			return oAttr.getVisible();
		});
	};

	/**
	 * @param {string} sPropertyName Name of the property to set.
	 * @param {object} oValue Value to set the property to.
	 * @param {boolean} bSuppressInvalidate Whether to suppress resulting invalidation
	 */
	ElementBase.prototype.setProperty = function (sPropertyName, oValue, bSuppressInvalidate) {
		var aProcessRequiredProperties = Object.getPrototypeOf(this).aProcessRequiredProperties;

		ManagedObject.prototype.setProperty.call(this, sPropertyName, oValue, bSuppressInvalidate);
		if (aProcessRequiredProperties && (aProcessRequiredProperties.indexOf(sPropertyName) !== -1) && this.getParent()) {
			this.getParent()._bRequiresDataProcessing = true;
		}
	};

	ElementBase.prototype.toString = function () {
		return this.getMetadata()._sClassName + " - " + this.getTitle();
	};

	/* =========================================================== */
	/* Rendering (HTML output)*/
	/* =========================================================== */
	ElementBase.prototype._correctTitle = function (sClass) {
		if (this.getTitle()) {
			var $text = this.$().find("." + sClass);

			if ($text[0]) {
				var iTitleLength = $text[0].getBBox().width,
					iMaxWidth = parseInt($text.attr("maxwidth"), 10);

				if (iTitleLength > iMaxWidth) {
					this._createText($text[0], {
						text: this.getTitle(),
						hCenter: true
					});
				}
			}
		}
	};

	ElementBase.prototype._renderTitle = function (mArguments) {
		// IE doesn't support dominant-baseline so we have to move it a bit for this browser
		var PSEUDO_HEIGHT = 10;

		var sHtml = this._renderControl("g", {
			"clip-path": "url(#" + this.getId() + "-title-clip)"
		}, false);

		sHtml += this._renderText({
			attributes: {
				"class": mArguments.class,
				x: mArguments.x,
				y: mArguments.y,
				maxWidth: mArguments.maxWidth
			},
			text: mArguments.title,
			height: PSEUDO_HEIGHT
		});
		sHtml += "</g>";

		return sHtml;
	};

	ElementBase.prototype._renderClipPath = function (mArguments) {
		var sHtml = this._renderControl("clipPath", {
			id: mArguments.id
		}, false);

		sHtml += this._renderControl("rect", {
			x: mArguments.x,
			y: mArguments.y,
			width: mArguments.width || this._iWidth,
			height: mArguments.height || this._iHeight
		});
		sHtml += "</clipPath>";

		return sHtml;
	};

	/* =========================================================== */
	/* Getters & setters*/
	/* =========================================================== */
	ElementBase.prototype.setVisible = function (bVisible) {
		var oGraph = this.getParent();

		this.setProperty("visible", bVisible, false);
		if (oGraph) {
			oGraph.setFocus(null);
			oGraph._setupKeyboardNavigation();
		}
		return this;
	};

	return ElementBase;
});
