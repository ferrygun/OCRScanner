/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"jquery.sap.global",
	".././library",
	"sap/ui/core/Control"
], function(jQuery, library, Control) {
	"use strict";

	/**
	 * Constructor for a new <code>sap.ui.comp.smartmultiedit.Container</code>.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class This container renders a given layout, which contains <code>sap.ui.comp.smartmultiedit.Field</code> instances to manage.
	 * The container provides access to updated binding contexts.
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @public
	 * @experimental since 1.52.0
	 * @since 1.52.0
	 * @sap-restricted sap.ui.comp.smartmultiedit.Container
	 * @alias sap.ui.comp.smartmultiedit.Container
	 * @ui5-metamodel This control will also be described in the UI5 (legacy) design time meta model.
	 */
	var Container = Control.extend("sap.ui.comp.smartmultiedit.Container", /** @lends sap.ui.comp.smartmultiedit.Container.prototype **/ {
		metadata: {
			library: "sap.ui.comp",
			designTime: true,
			properties: {
				/**
				 * The entity set name to fetch metadata for.
				 * Please note that this is not a dynamic UI5 property!
				 */
				entitySet: {
					type: "string",
					group: "Misc",
					defaultValue: null,
					bindable: false
				},
				/**
				 * The binding contexts for which multi-editing is done.
				 */
				// sap.ui.model.Context is not a valid DataType for properties. Therefore, the core falls back to data type <code>any</code>.
				// We keep the sap.ui.model.Context as this is displayed correctly in the API documentation.
				contexts: {
					type: "sap.ui.model.Context[]",
					group: "Misc",
					defaultValue: [],
					bindable: false
				}
			},
			defaultAggregation: "layout",
			aggregations: {
				/**
				 * The Form layout control which contains {@link sap.ui.comp.smartmultiedit.Field} controls.
				 */
				layout: {
					type: "sap.ui.layout.form.Form",
					multiple: false,
					bindable: false
				}
			},
			events: {
				/**
				 * The event is triggered as soon as a change is triggered by the user for one of the {@link sap.ui.comp.smartmultiedit.Field} instances in the layout aggregation.
				 */
				change: {}
			},
			associations: {}
		}
	});

	Container.prototype.init = function() {
		this._bIsInitialized = false;
		this._bReadyToRender = false;
		this.attachEvent("modelContextChange", this._initializeMetadata, this);
	};

	Container.prototype.setEntitySet = function(entitySet) {
		if (entitySet !== this.getProperty("entitySet")) {
			this.setProperty("entitySet", entitySet, true);
			if (entitySet) {
				this._initializeMetadata();
			}
		}
		return this;
	};

	Container.prototype.setContexts = function(value) {
		if (jQuery.isArray(value)) {
			var FnClass = sap.ui.require("sap/ui/model/Context");
			for (var i = 0; i < value.length; i++) {
				if (!(value[i] instanceof FnClass)) {
					return this;
				}
			}
			this.setProperty("contexts", value, true);
		}
		return this;
	};

	/**
	 * Provides updated objects, including the values of all <code>sap.ui.comp.smartmultiedit.Field</code> instances in the layout aggregation control.
	 * The function returns a Promise that is resolved when copy and update are done for each <code>sap.ui.model.Context</code> in the <code>contexts</code> property.
	 * The fulfilled function is called with an array of objects that contain an object for each entry of <code>contexts</code> property.
	 * Each object in the array contains a <code>context</code> property, which is the corresponding <code>sap.ui.mode.Context</code>.
	 * The second <code>data</code> property contains the updated data object.
	 *
	 * @public
	 * @param {boolean} [merge] If true, the returned data structure includes all entity set properties per context.
	 * @returns {Promise} A Promise that is resolved when all <code>sap.ui.model.Context</code> are copied and updated.
	 */
	Container.prototype.getAllUpdatedContexts = function(merge) {
		var aContexts = this.getContexts(),
			aUpdatedContexts = [],
			that = this,
			iIndex = 0,
			iStep = 10;
		if (aContexts.length === 0) {
			return Promise.resolve(aUpdatedContexts);
		}
		return new Promise(function (resolve) {
			function getUpdatedContext(contexts, start, end) {
				for (iIndex = start; iIndex < Math.min(end, contexts.length); iIndex++) {
					aUpdatedContexts.push({
						context: contexts[iIndex],
						data: that._getUpdatedDataObject(contexts[iIndex].getObject(), merge)
					});
				}
				if (iIndex < contexts.length) {
					jQuery.sap.delayedCall(0, null, getUpdatedContext, [aContexts, iIndex, iIndex + iStep]);
				} else {
					resolve(aUpdatedContexts);
				}
			}
			getUpdatedContext(aContexts, iIndex, iIndex + iStep);
		});
	};

	/**
	 * Gets the object, which includes the property names and updated values.
	 * If merge is true, the returned data structure includes all entity set properties of the context including their current values.
	 * If false, only modified values from sap.ui.comp.smartmultiedit.Field and their entity set properties will be returned.
	 *
	 * @private
	 * @param {object} object Context data.
	 * @param {boolean} merge If true, all entity set properties with updated values are returned.
	 * @returns {object} A copy of a context data object with updated values.
	 */
	Container.prototype._getUpdatedDataObject = function(object, merge) {
		// We must use jQuery.extend, because object may contain primitive data types instead of JSON data
		var oData = merge ? jQuery.extend({}, object) : {},
			aFields = this._getFields(),
			sPropertyName,
			oRawValue;

		for (var i = 0; i < aFields.length; i++) {
			sPropertyName = aFields[i].getPropertyName();
			oRawValue = aFields[i].getRawValue();
			// only changed values will be saved or modified in the data object
			if (oRawValue.hasOwnProperty(sPropertyName) && oRawValue[sPropertyName] !== object[sPropertyName]) {
				oData[sPropertyName] = oRawValue[sPropertyName];
			}
		}
		return oData;
	};

	/**
	 * Initializes the OData metadata.
	 * @private
	 */
	Container.prototype._initializeMetadata = function() {
		var oModel = this.getModel();
		if (!this._bIsInitialized && this.getEntitySet() && oModel && (oModel.getMetadata().getName() === "sap.ui.model.odata.v2.ODataModel")) {
			oModel.getMetaModel().loaded().then(this._onMetadataInitialized.bind(this));
		}
	};

	/**
	 * Called when the model metadata are available.
	 * @private
	 */
	Container.prototype._onMetadataInitialized = function() {
		var aFields,
			sEntitySet,
			aPromises = [];
		if (this._bIsInitialized) { //nothing to do if already initialized
			return;
		}

		aFields = this._getFields();
		sEntitySet = this.getEntitySet();
		for (var i = 0; i < aFields.length; i++) {
			aPromises.push(aFields[i].initialize(sEntitySet));
		}
		Promise.all(aPromises).then(function() {
			this._bIsInitialized = true;
			this._bReadyToRender = true;
			this.invalidate();
		}.bind(this));
	};

	/**
	 * Looks up the inner layout aggregation for sap.ui.comp.smartmultiedit.Field instances,
	 * sets associations between the label and field within the form element, and returns all field instances as an array.
	 *
	 * @private
	 * @returns {sap.ui.comp.smartmultiedit.Field[]} All sap.ui.comp.smartmultiedit.Field instances.
	 */
	Container.prototype._getFields = function() {
		var oForm = this.getLayout(),
			aFormContainers,
			aFormElements,
			aFields,
			oLabel;
		if (oForm && !this._aFields) {
			this._aFields = [];
			aFormContainers = oForm.getFormContainers();
			for (var i = 0; i < aFormContainers.length; i++) {
				aFormElements = aFormContainers[i].getFormElements();
				for (var j = 0; j < aFormElements.length; j++) {
					aFields = aFormElements[j].getFields();
					oLabel = aFormElements[j].getLabel();
					for (var k = 0; k < aFields.length; k++) {
						this._registerField(aFields[k], oLabel);
					}
				}
			}
		}
		return this._aFields || [];
	};

	/**
	 * Registers the field in the internal array 'this._aFields' of the container and
	 * adds an event handler to the change event of the field.
	 * Optionally, the field is associated to the label.
	 *
	 * @param {sap.ui.comp.smartmultiedit.Field} field The sap.ui.comp.smartmultiedit.Field instance.
	 * @param {sap.ui.core.Control} [label] The label instance.
	 * @private
	 */
	Container.prototype._registerField = function(field, label) {
		var fnClass = sap.ui.require("sap/ui/comp/smartmultiedit/Field");

		if (!(field instanceof fnClass)) {
			return;
		}

		if (label) {
			field.setAssociation("ariaLabelledBy", label);
		}

		this._aFields.push(field);
		field.attachChange(this.fireChange, this);
	};

	return Container;
});
