/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/ui/base/EventProvider",
	"sap/ui/comp/smartfield/AnnotationHelper"
], function(EventProvider, AnnotationHelper) {
	"use strict";

	/**
	 * Constructor for a new sap.ui.comp.smartmultiedit.LabelProvider.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class The label provider is a helper class to support label handling combined with the
	 * sap.ui.comp.smartmultiedit.Field within the sap.ui.comp.smartmultiedit.Container controls.
	 * The helper provides methods to create sap.m.Label instances, connect Label instances to their
	 * corresponding Field instances and enable binding, if needed.
	 * @extends sap.ui.base.EventProvider
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @private
	 * @experimental since 1.52.0
	 * @since 1.52.0
	 * @alias sap.ui.comp.smartmultiedit.LabelProvider
	 */
	var LabelProvider = EventProvider.extend("sap.ui.comp.smartmultiedit.LabelProvider", {
		constructor: function(mParams) {
			EventProvider.call(this);
			if (mParams) {
				this.oFieldInstance = mParams.fieldInstance;
				this.oLabelInstance = mParams.labelInstance;

				if (mParams.metaDataProperty) {
					this._oAnnotationHelper = new AnnotationHelper();
					this.setLabelText(mParams.metaDataProperty);
					this.setLabelRequired(mParams.metaDataProperty);
				}
			}
		}
	});

	/**
	 * Sets the text property of the label instance by using the label annotation.
	 * The annotations <code>sap:label</code> and <code>com.sap.vocabularies.Common.v1.Label</code>
	 * for the label text are supported. If the annotation text is an i18n binding path,
	 * the text property of the label is bound to the given path.
	 *
	 * @param {object} metaDataProperty The metadata property object
	 * @protected
	 */
	LabelProvider.prototype.setLabelText = function(metaDataProperty) {
		var sText;
		if (!this.oLabelInstance.isPropertyInitial("text")) {
			return;
		}

		sText = this._oAnnotationHelper.getLabel(metaDataProperty);
		if (sText && this._isResourceBundlePath(sText)) {
			this.oLabelInstance.bindProperty("text", {
				// The braces should be removed from the binding path
				path: sText.substring(1, sText.length - 1)
			});
		} else {
			this.oLabelInstance.setProperty("text", sText, true);
		}
	};

	/**
	 * Sets the required property of the label depending on the metadata property nullable
	 *
	 * @param {object} metaDataProperty The meta data property object
	 * @protected
	 */
	LabelProvider.prototype.setLabelRequired = function(metaDataProperty) {
		var bNullable = this._oAnnotationHelper.isNullable(metaDataProperty),
			bLabelRequiredInit = this.oLabelInstance.isPropertyInitial("required"),
			bFieldRequiredInit = this.oFieldInstance.isPropertyInitial("required"),
			bFieldNullableInit = this.oFieldInstance.isPropertyInitial("nullable");

		if (bFieldRequiredInit && bLabelRequiredInit) {
			this.oLabelInstance.setProperty("required", !bNullable, true);
		}

		if (bFieldRequiredInit) {
			this.oFieldInstance.setProperty("required", !bNullable, true);
		} else if (bLabelRequiredInit) {
			this.oLabelInstance.setProperty("required", this.oFieldInstance.getRequired(), true);
		}

		if (bFieldNullableInit) {
			this.oFieldInstance.setProperty("nullable", bNullable, true);
		}
	};

	/**
	 * Checks whether the given string is a valid i18n binding path.
	 *
	 * @param {string} path The i18n binding path.
	 * @returns {boolean} True if the path is a valid i18n binding path
	 * @private
	 */
	LabelProvider.prototype._isResourceBundlePath = function(path) {
		// checks if the path string matches the i18n binding path, like {i18n>key} or {@i18n>key}
		var bMatch = path.match(/{@i18n>.+}/gi) || path.match(/{i18n>.+}/gi);
		return (this.oLabelInstance.getModel("@i18n") || this.oLabelInstance.getModel("i18n")) && bMatch;
	};

	return LabelProvider;

});
