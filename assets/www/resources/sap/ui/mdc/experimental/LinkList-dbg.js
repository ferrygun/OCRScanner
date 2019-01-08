/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	'sap/ui/mdc/experimental/FieldHelpBase', 'sap/ui/model/base/ManagedObjectModel', 'sap/m/VBox'
], function(FieldHelpBase, ManagedObjectModel, VBox) {
	"use strict";

	/**
	 * Constructor for a new LinkList.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class A field help used in the <code>FieldFelp</code> aggregation in <code>Field</code> controls that shows a list of Links
	 * @extends sap.ui.core.Element
	 * @version 1.52.4
	 * @constructor
	 * @private
	 * @since 1.52.0
	 * @alias sap.ui.mdc.experimental.LinkList
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var LinkList = FieldHelpBase.extend("sap.ui.mdc.experimental.LinkList", /** @lends sap.ui.mdc.experimental.LinkList.prototype */
	{
		metadata: {
			library: "sap.ui.mdc",
			properties: {
				},
			aggregations: {
				/**
				 * links of the Field
				 */
				links: {
					type: "sap.m.Link",
					multiple: true,
					singularName : "link"
				}
			},
			defaultAggregation: "links",
			events: {

			}
		}
	});

	LinkList.prototype.showLink = function() {

		var aLinks = this.getLinks();
		var bLinks = false;

		for (var i = 0; i < aLinks.length; i++) {
			var oLink = aLinks[i];
			if (oLink.getEnabled()) {
				bLinks = true;
				break;
			}
		}

		return bLinks;

	};

	LinkList.prototype._createPopover = function() {

		var oPopover = FieldHelpBase.prototype._createPopover.apply(this, arguments);

		this._oVBox = new VBox(this.getId() + "-VBox", {
			width: "100%",
			items: this.getAggregation("links")
		});

		this._setContent(this._oVBox);

		return oPopover;

	};

	LinkList.prototype.getLinks = function() {

		if (this._oVBox) {
			return this._oVBox.getItems();
		} else {
			return this.getAggregation("links", []);
		}

	};

	LinkList.prototype.indexOfLink = function(oLink) {

		if (this._oVBox) {
			return this._oVBox.indexOfItem(oLink);
		} else {
			return this.indexOfAggregation("links", oLink);
		}

	};

	LinkList.prototype.addLink = function(oLink) {

		if (this._oVBox) {
			this._oVBox.addItem(oLink);
		} else {
			this.addAggregation("links", oLink);
		}

		oLink.attachEvent("_change", _handleLinkChange, this);

		this.fireDataUpdate();

		return this;

	};

	LinkList.prototype.insertLink = function(oLink, iIndex) {

		if (this._oVBox) {
			this._oVBox.insertItem(oLink, iIndex);
		} else {
			this.insertAggregation("links", oLink, iIndex);
		}

		oLink.attachEvent("_change", _handleLinkChange, this);

		this.fireDataUpdate();

		return this;

	};

	LinkList.prototype.removeLink = function(vLink) {

		var oRemoved;

		if (this._oVBox) {
			oRemoved = this._oVBox.removeItem(vLink);
		} else {
			oRemoved = this.removeAggregation("links", vLink);
		}

		if (oRemoved) {
			oRemoved.detachEvent("_change", _handleLinkChange, this);
		}

		this.fireDataUpdate();

		return oRemoved;

	};

	LinkList.prototype.removeAllLinks = function() {

		var aRemoved;

		if (this._oVBox) {
			aRemoved = this._oVBox.removeAllItema();
		} else {
			aRemoved = this.removeAllAggregation("links");
		}

		for (var i = 0; i < aRemoved.length; i++) {
			var oLink = aRemoved[i];
			oLink.detachEvent("_change", _handleLinkChange, this);
		}

		this.fireDataUpdate();

		return aRemoved;

	};

	LinkList.prototype.destroyLinks = function() {

		var aLinks = this.getLinks();
		for (var i = 0; i < aLinks.length; i++) {
			var oLink = aLinks[i];
			oLink.detachEvent("_change", _handleLinkChange, this);
		}

		if (this._oVBox) {
			this._oVBox.destroyItema();
		} else {
			this.destroyAggregation("links");
		}

		this.fireDataUpdate();

		return this;

	};

	function _handleLinkChange(oEvent) {

		var sName = oEvent.getParameter("name");

		if (sName == "enabled" || sName == "visible") {
			this.fireDataUpdate();
		}

	}

	return LinkList;

}, /* bExport= */true);
