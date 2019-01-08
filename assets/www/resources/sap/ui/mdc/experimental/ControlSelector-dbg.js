/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */
sap.ui.define(['jquery.sap.global', 'sap/ui/core/Control'
], function(jQuery, Control) {
	"use strict";

	/**
	 * Provides a declarative factory for a control list that selects one of the given controls based on a selected index.
	 * This index can be bound and can have a formatter/expression to decide which index of the content aggregation should be shown and cloned if used as a template.
	 *
	 * In case the ControlSelector is used a a template the cloned instances keep a reference to the original template.
	 * Changing the original ControlSelectors index will update all clones created from it.
	 *
	 * By setting the reuseControls property the ControlSelector will reuse old clones that are no longer used instead of creating new clones for
	 * the same index. This is an experimental feature and should not yet be used
	 *
	 * A ControlSelector can act as a proxy to another control selector if the association "use" is set.
	 * Then the ControlSelector uses the associated control selector to return instances and clones.
	 * It is not possible to have at the same time individual content control and associate another ControlSelector.
	 * It is not possible to nest a ControlSelector another control selector directly.
	 *
	 * @since 1.46.0
	 * @private
	 * */
	var ControlSelector = Control.extend("sap.ui.mdc.experimental.ControlSelector", /* @lends sap.ui.mdc.experimental.ControlSelector.prototype */ {
		constructor : function() {
			Control.apply(this, arguments);
		},
		metadata: {
			properties : {
				/**
				 * The index of the selected content instance used for the ControlSelector.
				 */
				selectedIndex : {
					type: "int",
					defaultValue: -1
				},
				/**
				 * The index used as the default index if index refers to a not existing index
				 */
				defaultIndex : {
					type: "int",
					defaultValue: 0
				},
				/**
				 * Sets whether the ControlSelector should render its own root dem element.
				 * If set to false the dom reference of the inner control is used to render and rerender the ControlSelector
				 */
				renderRoot : {
					type: "boolean",
					defaultValue: false
				},
				/**
				 * Sets whether the ControlSelector should reuse old clones of an index instead of creating new instances.
				 * This property is only taken into account if the ControlSelector is used as a template of a list binding.
				 * @experimental
				 */
				reuseControls : {
					type: "boolean",
					defaultValue: false
				}
			},
			aggregations : {
				/**
				 * List of content controls of the control selector.
				 */
				content : {
					type : "sap.ui.core.Control",
					multiple : true
				},
				/**
				 * Currently selected content control based on the index
				 * @private
				 */
				_current : {
					type : "sap.ui.core.Control",
					multiple : false,
					hidden: true
				}
			},
			associations: {
				/**
				 * Reference to another ControlSelector instance that is defined elsewhere.
				 * If
				 */
				use: {
					type: "sap.ui.mdc.ControlSelector",
					multiple: false
				}
			},
			defaultAggregation: "content"
		},
		renderer: function(oRm, oControl) {
			//simple renderer to render the content. this is always a clone therefore only one content is contained.
			var oContent = oControl.getCurrentContent(),
				bRenderRoot = oControl.getRenderRoot();
			if (!bRenderRoot && oContent && oContent.getVisible()) {
				var oDomRef = oControl.getDomRef();
				if (jQuery.sap.log.isLoggable(jQuery.sap.log.Level.DEBUG) && oDomRef) {
					oRm.write("<!-- sap.ui.mdc.experimental.ControlSelector with id='" + oControl.getId() + "' and renderRoot=false, used old id='" + oDomRef.id + "' for rerendering -->");
					if (oDomRef.previousSibling && oDomRef.previousSibling.nodeType === 8) {
						oDomRef.previousSibling.parentNode.removeChild(oDomRef.previousSibling);
					}
				}
				if (oDomRef) {
					oDomRef.parentNode.removeChild(oDomRef);
				}
				oRm.renderControl(oContent);
				oControl._sOldId = oContent.getId();
			} else {
				oRm.write("<div ");
				if (!bRenderRoot) {
					oRm.write(" style=\"display:none\"");
				}
				oRm.writeControlData(oControl);
				oRm.write(">");
				if (bRenderRoot) {
					oRm.renderControl(oContent);
				}
				oRm.write("</div>");
			}
		}
	});

	var byId = sap.ui.getCore().byId;
	var iCloneIndex = -1;

	ControlSelector.prototype.init = function() {
		//the main instance is used to create clones. keep a reference to the clones created from the main instance
		this._mClones = null;
		this._sOldId = null;
		this._oFree = {};
	};

	/**
	 * Sets the current control
	 * @param {sap.ui.core.Control} oCurrent the current control
	 * @private
	 */
	ControlSelector.prototype._setCurrent = function(oCurrent) {
		this.setAggregation("_current", oCurrent);
	};

	/**
	 * Returns the dom reference of the ControlSelector.
	 * If renderRoot is set to false the dom ref of the currently selected control inner control is
	 * used.
	 * @returns {DOMElement} the dom element
	 * @private
	 */
	ControlSelector.prototype.getDomRef = function() {
		var oDomRef = jQuery.sap.domById(this.getId());
		if (oDomRef || this.getRenderRoot()) {
			return oDomRef;
		} else if (this._sOldId) {
			return jQuery.sap.domById(this._sOldId);
		}
		return null;
	};

	/**
	 * Sets the template reference to a clone and applies the current control from the template if there is no current content
	 * @param oTemplate
	 * @param iIndex
	 * @private
	 */
	ControlSelector.prototype._setTemplate = function(oTemplate, iIndex) {
		this.oTemplate = oTemplate;
		if (!this.getAggregation("_current")) {
			var oCurrent = this.oTemplate._getCurrent(iIndex);
			if (oCurrent) {
				this._setCurrent(oCurrent.clone(this.getId() + "-content"));
				this.setProperty("selectedIndex", iIndex, true);
			} else {
				this.oTemplate._unregisterClone(this);
				this.destroyContent();
			}
		}
	};

	/**
	 * Validates the aggregation.
	 * If ControlSelectors are nested within ControlSelectors this method throws an error.
	 *
	 * @param sName
	 * @param oObject
	 * @returns
	 */
	ControlSelector.prototype.validateAggregation = function(sName, oObject) {
		var oResult = Control.prototype.validateAggregation.apply(this, arguments);
		if (sName === "content" && oObject instanceof ControlSelector) {
			throw new Error("sap.ui.mdc.experimental.ControlSelector cannot be used as content of another sap.ui.mdc.experimental.ControlSelector");
		}
		return oResult;
	};

	/**
	 * Returns the index of the pool instance
	 * @experimental
	 * @param iValue
	 * @returns {Number}
	 * @private
	 */
	ControlSelector.prototype._getPoolIndex = function(iValue) {
		if (!this.oTemplate) {
			return 0;
		}
		var aContent = this.oTemplate.getContent();
		if (!aContent || iValue < 0 || iValue >= aContent.length - 1) {
			iValue = 0;
		}
		return iValue;
	};

	/**
	 * Retunrs the current instance
	 * @param iValue
	 * @returns
	 * @private
	 */
	ControlSelector.prototype._getCurrentInstance = function(iIndex) {
		var iPoolIndex = this._getPoolIndex(iIndex),
			oCurrentInstance = null;
		if (this.oTemplate.getReuseControls() && this.oTemplate._oFree[iPoolIndex] && this.oTemplate._oFree[iPoolIndex].length) {
			oCurrentInstance = this.oTemplate._oFree[iPoolIndex].pop();
		} else {
			var oCurrent = this.oTemplate._getCurrent(iIndex);
			if (oCurrent) {
				oCurrentInstance = oCurrent.clone(this.getId() + "-" + iCloneIndex + "-content");
			}
			iCloneIndex++;
		}
		return oCurrentInstance;
	};

	/**
	 * Sets the index that should be used for the current instance, if the instance is not a clone update all clones with the new index
	 * @param iIndex
	 * @returns {ControlSelector}
	 * @pivate
	 */
	ControlSelector.prototype.setSelectedIndex = function(iIndex) {
		var iOldIndex = this.getSelectedIndex();
		this.setProperty("selectedIndex", iIndex, true);
		if (iOldIndex != iIndex) {
			if (this.oTemplate) {
				var oContent = this.getAggregation("_current");
				if (oContent) {
					if (this.oTemplate.getReuseControls()) {
						var iPoolIndex = this._getPoolIndex(iOldIndex);
						if (!this.oTemplate._oFree[iPoolIndex]) {
							this.oTemplate._oFree[iPoolIndex] = [];
						}
						this.oTemplate._oFree[iPoolIndex].push(oContent);
					} else {
						oContent.destroy("KeepDom");
					}
				}
				var oCurrent = this._getCurrentInstance(iIndex);
				if (oCurrent) {
					this._setCurrent(oCurrent);
				}
			} else {
				if (this._mClones) {
					for (var n in this._mClones) {
						byId(n).setSelectedIndex(iIndex);
					}
				} else {
					this.invalidate();
				}
			}
		}
		return this;
	};

	/**
	 * Registers a clone.
	 * @param oInstance
	 * @private
	 */
	ControlSelector.prototype._registerClone = function(oInstance) {
		if (!this._mClones) {
			this._mClones = {};
			this._attachModifyAggregation("content", this._updateClones, this);
		}
		this._mClones[oInstance.getId()] = null;
	};

	/**
	 * Unregisters a clone
	 * @param oInstance
	 * @private
	 */
	ControlSelector.prototype._unregisterClone = function(oInstance) {
		if (this._mClones) {
			if (typeof oInstance === "string") {
				delete this._mClones[oInstance];
			} else if (oInstance instanceof Control) {
				delete this._mClones[oInstance.getId()];
			}
			if (Object.keys(this._mClones).length === 0) {
				this._detachModifyAggregation("content", this._updateClones, this);
				this._mClones = null;
			}
		}
	};

	/**
	 * Updates the clones if the content aggregation has changed
	 * The index used by the clones is not automatically shifted. Therefore it is recommended to setIndex after removal.
	 * If a newly added content becomes a valid template for the clones, it is applied immediately.
	 * Example: A column of a table currently contains only a ControlSelector with a sap.m.Text as content but the index is set to 1.
	 * As there is only a text in the content the text is rendered initially. To switch the column to edit a new content is added sap.m.Input.
	 * Now the index 1 becomes valid and all clones are updated.
	 * If the removeContent(1) is called the column switches to text again as the index 1 becomes invalid again.
	 * @private
	 *
	 */
	ControlSelector.prototype._updateClones = function() {
		if (this._mClones) {
			for (var n in this._mClones) {
				var oClone = byId(n);
				if (oClone) {
					oClone.destroyContent();
					oClone._setTemplate(this, oClone.getSelectedIndex());
				} else {
					this._unregisterClone(n);
				}
			}
		}
	};

	/**
	 * Creates a clone of the current instance. The cloned instance will keep a reference to the this instance
	 * to be able to switch the template based on the index. The cloned instance will only keep the currently selected content
	 * as the "only" content. The content itself is not cloned as cloneChildren is false.
	 * The clone is also registed at this instance to enabled the possibility to centrally change the index for all cloned instances
	 * @param sId
	 * @returns
	 * @private
	 */
	ControlSelector.prototype.clone = function(sId) {
		var oClone;
		if (!this.oTemplate) {
			//do not clone the children
			oClone = Control.prototype.clone.apply(this, [arguments[0], arguments[1], {
				cloneChildren: false,
				cloneBindings: true
			}]);
			//apply myself as template owner
			oClone._setTemplate(this, this.getSelectedIndex());
			this._registerClone(oClone);
			//register the clone
			return oClone;
		} else {
			oClone = Control.prototype.clone.apply(this, arguments);
			oClone._setTemplate(this.oTemplate, this.getSelectedIndex());
			this.oTemplate._registerClone(oClone);
			return oClone;
		}
	};

	/**
	 * Returns the current control of the ControlSelector
	 * @returns
	 * @private
	 */
	ControlSelector.prototype.getCurrentContent = function() {
		if (this.oTemplate) {
			return this.getAggregation("_current");
		} else {
			return this._getCurrent(this.getSelectedIndex());
		}
	};

	/**
	 * Returns the content of the ControlSelector.
	 * If the it has an associated ControlSelector only the currently selected instance is returned.
	 * @returns
	 * @private
	 */
	ControlSelector.prototype.getContent = function() {
		if (this.oTemplate) {
			return this.getAggregation("_current");
		}
		return this.getAggregation("content");
	};

	/**
	 * Returns the currently selected content based on given index. The index is changed via the property index, which can be databound.
	 * If no content with the given index is available the defaultIndex or 0 is used. If there is no content at all the null is returned.
	 * @param iIndex
	 * @returns
	 * @private
	 */
	ControlSelector.prototype._getCurrent = function(iIndex) {
		var aContent = this.getAggregation("content");
		if (aContent && (iIndex < 0  || iIndex >= aContent.length)) {
			jQuery.sap.log.debug("Changing index of ControlSelector to defaultIndex: current is " + iIndex);
			var iDefaultIndex = this.getDefaultIndex();
			if (iDefaultIndex < 0  || iDefaultIndex >= aContent.length) {
				jQuery.sap.log.debug("Changing index of ControlSelector to 0: current is " + iIndex);
				iIndex = 0;
			} else {
				iIndex = iDefaultIndex;
			}
		}
		if (aContent && aContent[iIndex]) {
			return aContent[iIndex];
		}
		return null;
	};


	/**
	 * Sets the use association.
	 * @param sId
	 * @private
	 */
	ControlSelector.prototype.setUse = function(sId) {
		var aContent = this.getAggregation("content");
		if (aContent && aContent.length > 0) {
			jQuery.sap.log.warning("Content is ignored for " + this.getId() + " because association 'use' is set to reference another ControlSelector instance.");
			this.destroyAggregation("content");
		}
		var oUse = byId(sId);
		if (!oUse) {
			jQuery.sap.log.warning("ControlSelector with id " + sId + " is not available.");
			return;
		}
		if (!(oUse instanceof ControlSelector)) {
			jQuery.sap.log.warning("Control with id " + sId + " is not a ControlSelector.");
			return;
		}
		this.setAssociation("use", sId);
		this.oTemplate = oUse;
		this._setTemplate(this.oTemplate, this.getSelectedIndex());
		this.oTemplate._registerClone(this);
	};

	/**
	 * Destroys the ControlSelector and all clones that were created based on it.
	 * @private
	 */
	ControlSelector.prototype.destroy = function() {
		if (this._mClones) {
			for (var n in this._mClones) {
				var oClone = byId(n);
				if (oClone) {
					oClone.destroy();
				}
			}
		} else if (this.oTemplate) {
			this.oTemplate._unregisterClone(this);
		}
		Control.prototype.destroy.apply(this, arguments);
	};

	return ControlSelector;

}, /* bExport= */true);

