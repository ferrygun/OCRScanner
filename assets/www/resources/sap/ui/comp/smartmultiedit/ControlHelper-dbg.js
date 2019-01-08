/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
	"jquery.sap.global",
	"sap/ui/base/EventProvider",
	"sap/ui/comp/smartfield/ODataControlFactory",
	"sap/ui/core/Item",
	"sap/ui/model/BindingMode"
], function(jQuery, EventProvider, ODataControlFactory, Item, BindingMode) {
	"use strict";

	/**
	 * Constructor for a new sap.ui.comp.smartmultiedit.ControlHelper.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class The ControlHelper provides helper methods for creating control instances.
	 * Needed adaptations are provided to enable the re-use within the sap.ui.comp.smartmultiedit.Field control, e.g. sap.m.DateTimePicker hacks.
	 * @extends sap.ui.base.EventProvider
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @private
	 * @experimental since 1.52.0
	 * @since 1.52.0
	 * @alias sap.ui.comp.smartmultiedit.ControlHelper
	 */
	var ControlHelper = EventProvider.extend("sap.ui.comp.smartmultiedit.ControlHelper", {
		constructor: function(mParams) {
			EventProvider.call(this);

			if (mParams) {
				this.oFieldInstance = mParams.fieldInstance;
			}

			this._bDatePickerFinalized = false;
		}
	});

	ControlHelper.prototype.destroy = function() {
		EventProvider.prototype.destroy.apply(this);

		if (this._oFieldItem) {
			this._oFieldItem.destroy();
			this._oFieldItem = null;
		}

		if (this.oControl) {
			this.oControl.destroy();
			this.oControl = null;
		}
	};

	/**
	 * Creates the ODataControlFactory instance using the given settings.
	 *
	 * @param {object} settings The settings object.
	 * @returns {sap.ui.comp.smartfield.ODataControlFactory} The new control factory instance
	 * @protected
	 */
	ControlHelper.prototype.createFactory = function(settings) {
		var oControlFactory = new ODataControlFactory(this.oFieldInstance.getModel(), this.oFieldInstance, {
			entitySet: settings.entitySet,
			path: settings.propertyName
		});
		var that = this;
		var fnLoadAnnotation = function(provider) {
			var fnOriginalOnValueHelpDialogRequired;

			provider.loadAnnotation();

			//currently, only this type of value help is in scope (we cannot display suggestions using an sap.m.Select!)
			if (provider.getMetadata().getName() === "sap.ui.comp.providers.ValueHelpProvider") {
				fnOriginalOnValueHelpDialogRequired = provider._onValueHelpDialogRequired;
				provider._onValueHelpDialogRequired = function() {
					fnOriginalOnValueHelpDialogRequired.apply(this, arguments);

					this.oValueHelpDialog.attachOk(that._setItemOnFieldInstance, that);
					this.oValueHelpDialog.attachCancel(that.oFieldInstance.resetSelection, that.oFieldInstance);
				}.bind(provider);
			}
		};
		var fnOriginalCreateValueHelp = oControlFactory.createValueHelp;

		oControlFactory.createValueHelp = function() {
			fnOriginalCreateValueHelp.apply(this, arguments);
			this._aProviders.forEach(fnLoadAnnotation);
		};

		oControlFactory._oFieldControl.getBindableAttributes = jQuery.sap.getter(null);

		// bind() is needed, because with this, the metadata object is configured for the use in
		// the ODataControlFactory. In addition, here the fireInitialise event is triggered on the MultiEdit select,
		// so that it knows, that now all necessary data is available
		oControlFactory.bind();

		return oControlFactory;
	};

	/**
	 * Adds necessary functionality to the control instance to enable the use of ODataControlFactory
	 * by mocking them.
	 * These functions need to exist at all times as they are used throughout the control's lifecycle.
	 *
	 * @protected
	 */
	ControlHelper.prototype.enrichBeforeFactory = function() {
		// Needed in case the sap:display-format="Date" annotation is not set
		this.oFieldInstance.getConfiguration = jQuery.sap.getter(null);

		// Needed for aria label handling - with the return value null, nothing will happen for aria
		// label handling. If you want to include the aria label handling, you need to adjust the return value.
		this.oFieldInstance.getControlContext = jQuery.sap.getter(null);

		// Any other value than display will lead to a manual validation with side effects on the MultiEditField
		this.oFieldInstance._getMode = jQuery.sap.getter("display");

		// We are in an edit scenario and therefore editable is always true
		this.oFieldInstance.getEditable = jQuery.sap.getter(true);

		// This function is used by the ODataControlFactory in case a quick info annotation exists
		this.oFieldInstance.setTooltipLabel = jQuery.noop;

		this.oFieldInstance.getExpandNavigationProperties = jQuery.sap.getter(null);
		this.oFieldInstance.getEnabled = jQuery.sap.getter(true);
		this.oFieldInstance.getContextEditable = jQuery.sap.getter(true);
		this.oFieldInstance.setTextLabel = jQuery.noop;
		this.oFieldInstance.getMaxLength = jQuery.sap.getter(0);
		this.oFieldInstance.getShowSuggestion = jQuery.sap.getter(true);
		this.oFieldInstance.getTextLabel  = jQuery.sap.getter("");
		this.oFieldInstance.getExpandNavigationProperties = jQuery.sap.getter(null);
		this.oFieldInstance.getMandatory = jQuery.sap.getter(false);
		this.oFieldInstance.checkError = jQuery.noop;
		this.oFieldInstance.getControlProposal = jQuery.sap.getter(false);
		this.oFieldInstance.getProposedControl = jQuery.sap.getter(false);
		this.oFieldInstance.isContextTable = jQuery.sap.getter(false);
		this.oFieldInstance.getTextArrangementInEditMode = jQuery.sap.getter(false);
		this.oFieldInstance.getMode = jQuery.sap.getter("edit");
		this.oFieldInstance.onBeforeValidateValue = jQuery.noop;
		this.oFieldInstance.onTextInputFieldAsyncChange = jQuery.noop;

		this.oFieldInstance.getBindingInfo = jQuery.sap.getter({
			parts: [
				{
					model: "json",
					path: ""
				}
			]
		});
	};

	/**
	 * Adds necessary functionality to the control instance to enable the use of ODataControlFactory
	 * by mocking the data function.
	 *
	 * @protected
	 */
	ControlHelper.prototype.enrichAfterFactory = function() {
		this.oFieldInstance.data = function (dataArg) {
			/* If we do not provide the string "checkError", which is the function name of a function, that will
			be called in case a validation is done inside the ODataControlFactory, an invalid object will be
			passed during validation and this leads to an error. The effect will be that the created control
			will not work completely. */
			if (dataArg === "errorCheck") {
				return "checkError";
			} else {
				return {
					style: "short",
					/* configdata is part of a check which checks, if the smart field is a unit of measure.
					If it is not a unit, then a CSS class will be set on the smart field. Because we do not want to
					have this class on the MultiEditField, we need to make sure, that the check will return true.
					 This can only happen if configdata.onInput exists.*/
					configdata: {
						onInput: jQuery.noop
					}
				};
			}
		};
	};

	/**
	 * Adds the 'fireInitialise' function to the given instance. This function is used by the control factory
	 * to create the internal control. It will be used to create a workaround for e.g. opening a DatePicker control,
	 * handling CheckBox control, and creating a ValueHelpDialog control.
	 *
	 * @param {sap.ui.comp.smartfield.ODataControlFactory} controlFactory The control factory to be used to create the internal control.
	 * @returns {Promise} A promise that is resolved once the fireInitialise method of the smartmultiedit.Field is executed
	 * @protected
	 */
	ControlHelper.prototype.addControlInitialization = function(controlFactory) {
		return new Promise(function(resolve) {
			// initialise is fired by the ODataControlFactory as soon as the metadata object is configured completely
			this.oFieldInstance.fireInitialise = function() {
				this.oControl = controlFactory.createControl().control;
				this.oFieldInstance.addDependent(this.oControl);
				this._prepareControl();

				resolve();
			}.bind(this);
		}.bind(this));
	};

	/**
	 * Delegates the control preparation based on its name (type).
	 *
	 * @private
	 */
	ControlHelper.prototype._prepareControl = function() {
		var sControlName = this.getControlName();

		switch (sControlName) {
			case "sap.m.CheckBox":
				this._prepareCheckBox(this.oControl);
				break;
			case "sap.m.Input":
				this._prepareInput(this.oControl);
				break;
			case "sap.m.DateTimePicker":
			case "sap.m.DatePicker":
				this._prepareDatePicker(this.oControl);
				break;
			default:
				jQuery.sap.log.error("The property's OData type is not supported by the sap.ui.comp.smartmultiedit.Field.");
				break;
		}
	};

	/**
	 * Prepares the CheckBox instance.
	 *
	 * @private
	 */
	ControlHelper.prototype._prepareCheckBox = function() {
		this._setOneWayBindingMode("selected");
	};

	/**
	 * Prepares the Input instance.
	 *
	 * @private
	 */
	ControlHelper.prototype._prepareInput = function() {
		this._setOneWayBindingMode("value");
	};

	/**
	 * Prepares the DatePicker or DateTimePicker instance that is necessary for using the popup of the
	 * DatePicker or DateTimerPicker separately.
	 *
	 * @private
	 */
	ControlHelper.prototype._prepareDatePicker = function() {
		this._setOneWayBindingMode("value");

		this.oControl.getDomRef = function() {
			return this._getInternalDomRef();
		}.bind(this.oFieldInstance);

		if (this.getControlName() === "sap.m.DateTimePicker") {
			this.oControl.getUIArea = function() {
				return this._getInternalUIArea();
			}.bind(this.oFieldInstance);
		}
	};

	/**
	 * Returns the name of the internal control.
	 *
	 * @returns {string} The name of the control
	 * @protected
	 */
	ControlHelper.prototype.getControlName = function() {
		return this.oControl && this.oControl.getMetadata().getName();
	};

	/**
	 * Sets the binding mode for the given 'bindingProperty' on the control instance to OneWay.
	 *
	 * @param {string} bindingProperty The name of the binding property
	 * @private
	 */
	ControlHelper.prototype._setOneWayBindingMode = function(bindingProperty) {
		var oBinding = this.oControl.getBinding(bindingProperty);

		if (oBinding) {
			oBinding.setBindingMode(BindingMode.OneWay);
		}
	};

	/**
	 * Delegates the display of the value help to one of the internal control's functions.
	 * @protected
	 */
	ControlHelper.prototype.triggerValueSelection = function() {
		var sControlName = this.getControlName();

		switch (sControlName) {
			case "sap.m.Input":
				this._triggerValueSelectionOnInput();
				break;
			case "sap.m.DateTimePicker":
			case "sap.m.DatePicker":
				this._triggerValueSelectionOnDatePicker();
				break;
			default:
				jQuery.sap.log.error("The control instance does not support a value selection.");
				break;
		}
	};

	/**
	 * Triggers a value selection on sap.m.Input.
	 * @private
	 */
	ControlHelper.prototype._triggerValueSelectionOnInput = function() {
		this.oControl.fireValueHelpRequest();
	};

	/**
	 * Triggers a value selection on sap.m.DatePicker|sap.m.DateTimePicker.
	 * @private
	 */
	ControlHelper.prototype._triggerValueSelectionOnDatePicker = function() {
		// creates and opens the calendar popup '_oPopup'
		this.oControl.onsapshow({ preventDefault: jQuery.noop });

		// Make sure to set the browser focus on the calendar popup (today's date) at the end of the call stack.
		// Otherwise the focus remains on the underlying select control.
		jQuery.sap.delayedCall(0, this, function() {
			if (this.oControl && this.oControl._oPopup) {
				var oContent = this.oControl._oPopup.getContent();

				// We have to check if the content is returned as an array, as this is always the case for
				// ResponsivePopover, which is used by the DateTimePicker.
				if (jQuery.isArray(oContent)) {
					oContent[0].focus();
				} else {
					oContent.focus();
				}
			}
		});

		if (!this._bDatePickerFinalized) {
			this._finalizeDatePicker();
		}
	};

	/**
	 * Attaches logic to the close event handler of the DatePicker or DateTimePicker control.
	 * @private
	 */
	ControlHelper.prototype._finalizeDatePicker = function() {
		var sControlName = this.getControlName();

		if (sControlName === "sap.m.DateTimePicker") {
			this.oControl._oPopup.attachAfterClose(this._onPopupClosed, this);
			this.oControl._oPopup.attachBeforeOpen(this._onPopupOpened, this);
		} else if (sControlName === "sap.m.DatePicker") {
			this.oControl._oPopup.attachClosed(this._onPopupClosed, this);
			this.oControl._oPopup.attachOpened(this._onPopupOpened, this);
		}

		this._bDatePickerFinalized = true;
	};

	/**
	 * Handles cancelling (not selecting any value) for sap.m.DatePicker and sap.m.DateTimePicker.
	 * In addition, the browser focus is placed on the control instance.
	 *
	 * @private
	 */
	ControlHelper.prototype._onPopupClosed = function() {
		var oNewDate = this.oControl.getDateValue();

		if (oNewDate) {
			this._setItemOnFieldInstance();
		} else {
			this.oFieldInstance.resetSelection();
		}

		this.oControl.focus();
	};

	/**
	 * Event handler for when the popup is opened.
	 * Resets the internal DatePicker or DateTimePicker's dateValue property to determine a change later on.
	 * @private
	 */
	ControlHelper.prototype._onPopupOpened = function() {
		this.oControl.setDateValue(null);
	};

	/**
	 * Adds a new item to the field instance when there is no item for displaying its value yet. Otherwise, it updates
	 * the existing item. The respective item will then be selected.
	 * @private
	 */
	ControlHelper.prototype._setItemOnFieldInstance = function() {
		var sValue = this.oControl.getValue();

		if (!sValue) {
			return;
		}

		if (!this._oFieldItem) {
			this._oFieldItem = new Item({
				text: sValue
			});
			this.oFieldInstance.addItem(this._oFieldItem);
		} else {
			this._oFieldItem.setText(sValue);
		}

		this._oFieldItem.data("value", this.getControlValue());
		this.oFieldInstance.setSelectedItem(this._oFieldItem);
	};

	/**
	 * Retrieves the correct value from the current control instance, based on its UI5 control type.
	 *
	 * @returns {object|string|null} The value retrieved via the control-specific getter function
	 * @private
	 */
	ControlHelper.prototype.getControlValue = function() {
		var sControlName = this.getControlName();

		if (sControlName === "sap.m.Input") {
			return this.oControl.getValue();
		}
		if (sControlName === "sap.m.DatePicker" || sControlName === "sap.m.DateTimePicker") {
			return this.oControl.getDateValue();
		}

		return null;
	};

	return ControlHelper;
});
