/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides control sap.ui.comp.smartfield.SmartField.
sap.ui.define([
	"jquery.sap.global",
	"sap/ui/comp/library",
	"./JSONControlFactory",
	"./ODataControlFactory",
	"./BindingUtil",
	"./SideEffectUtil",
	"./ODataHelper",
	"sap/ui/core/Control",
	"sap/ui/model/ParseException",
	"sap/ui/model/ValidateException",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/ValueState",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(jQuery, library, JSONControlFactory, ODataControlFactory, BindingUtil, SideEffectUtil, ODataHelper, Control, ParseException, ValidateException, JSONModel, ValueState, Filter, FilterOperator) {
	"use strict";

	/**
	 * Constructor for a new <code>sap.ui.comp.smartfield.SmartField</code>.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class The <code>SmartField</code> control is a wrapper for other controls. It interprets OData metadata to determine the control that has to
	 *        be instantiated. The OData entity is derived from the control's binding context. The OData entity's property that is changed or
	 *        displayed with the control is derived from the control's value property.
	 * @extends sap.ui.core.Control
	 * @implements sap.ui.core.IFormContent
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartfield.SmartField
	 * @ui5-metamodel This control will also be described in the UI5 (legacy) design time meta model
	 */
	var SmartField = Control.extend("sap.ui.comp.smartfield.SmartField", /** @lends sap.ui.comp.smartfield.SmartField.prototype */
	{
		metadata: {
			interfaces : ["sap.ui.core.IFormContent"],
			library: "sap.ui.comp",
			designTime: true,
			properties: {
				/**
				 * The value property keeps the current value of the control. If a binding expression is configured, this is used to determine the
				 * property of an OData entity.
				 */
				value: {
					type: "any",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Indicates whether the user can interact with the control or not. <b>Note:</b> Disabled controls cannot be focused and they are out
				 * of the tab order.
				 */
				enabled: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * The name of an entity set for which the control manages values. This is an optional property.
				 */
				entitySet: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				},

				/**
				 * Sets the control into an editable mode or a display mode.
				 */
				editable: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Notifies the control whether controls using the <code>SmartField</code> control are editable.
				 *
				 * @since 1.32.0
				 */
				contextEditable: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Defines the width of the control.
				 */
				width: {
					type: "sap.ui.core.CSSSize",
					group: "Misc",
					defaultValue: ""
				},

				/**
				 * Horizontal alignment of the text.
				 */
				textAlign: {
					type: "sap.ui.core.TextAlign",
					group: "Misc",
					defaultValue: sap.ui.core.TextAlign.Initial
				},

				/**
				 * Text shown when no value available.
				 */
				placeholder: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				},

				/**
				 * To be used in the HTML code (for example, for HTML forms that send data to the server via 'submit').
				 */
				name: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				},

				/**
				 * Visualizes the validation state of the control, e.g. <code>Error</code>, <code>Warning</code>, <code>Success</code>.
				 */
				valueState: {
					type: "sap.ui.core.ValueState",
					group: "Appearance",
					defaultValue: ValueState.None
				},

				/**
				 * The text which is shown in the value state message popup.
				 */
				valueStateText: {
					type: "string",
					group: "Appearance",
					defaultValue: ""
				},

				/**
				 * Defines whether the value state message is shown or not.
				 */
				showValueStateMessage: {
					type: "boolean",
					group: "Appearance",
					defaultValue: true
				},

				/**
				 * Data types to be used, if the <code>SmartField</code> control is interacting with a JSON model. If the value property of the
				 * control is bound to a property of an OData entity set, this property is not taken into consideration.
				 *
				 * @deprecated Since 1.31.0
				 */
				jsontype: {
					type: "sap.ui.comp.smartfield.JSONType",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * If set to <code>true</code>, a user input is required.
				 */
				mandatory: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Maximum number of characters. Value <code>0</code> means the feature is switched off.
				 */
				maxLength: {
					type: "int",
					group: "Misc",
					defaultValue: 0
				},

				/**
				 * If set to <code>true</code>, the suggestion feature for a hosted control is enabled, if the hosted control supports it.
				 */
				showSuggestion: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * If set to <code>true</code>, a value help indicator will be displayed inside the hosted control, if the hosted control supports
				 * this.
				 */
				showValueHelp: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * If set to <code>false</code> the label is not displayed.
				 */
				showLabel: {
					type: "boolean",
					group: "Appearance",
					defaultValue: true
				},

				/**
				 * This property contains the text of an associated <code>SmartLabel</code>.
				 */
				textLabel: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				},

				/**
				 * This property contains the tool tip of the associated <code>SmartLabel</code> control.
				 */
				tooltipLabel: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				},

				/**
				 * Visible state of the unit, if the <code>SmartField</code> control addresses unit of measure use cases, for example, an amount and
				 * its associated currency.
				 */
				uomVisible: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Editable state of the unit, if the <code>SmartField</code> control addresses unit of measure use cases, for example, an amount
				 * and its associated currency.
				 */
				uomEditable: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Enabled state of the unit, if the <code>SmartField</code> control addresses unit of measure use cases, for example, an amount and
				 * its associated currency.
				 */
				uomEnabled: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Contains a URL which is used to render a link. The link is rendered, if the OData property, to which the value property of the
				 * control is bound, is of type <code>Edm.String</code> and the <code>SmartField</code> is in display mode.
				 */
				url: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				},

				/**
				 * This property is for internal use only.
				 *
				 * @since 1.32.0
				 */
				uomEditState: {
					type: "int",
					group: "Misc",
					defaultValue: -1
				},

				/**
				 * Defines the context in which the layout of the <code>SmartField</code> control has to be interpreted.
				 *
				 * @since 1.32.0
				 */
				controlContext: {
					type: "sap.ui.comp.smartfield.ControlContextType",
					group: "Misc",
					defaultValue: sap.ui.comp.smartfield.ControlContextType.None
				},

				/**
				 * Proposes a control to be rendered. The <code>SmartField</code> control can ignore the proposal.
				 *
				 * @deprecated Since 1.32.0
				 * @since 1.32.0
				 */
				proposedControl: {
					type: "sap.ui.comp.smartfield.ControlProposalType",
					group: "Misc",
					defaultValue: sap.ui.comp.smartfield.ControlProposalType.None
				},

				/**
				 * Indicates whether the control break lines (in display mode) to prevent overflow.
				 *
				 * @since 1.36.6
				 */
				wrapping: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Determines if the mandatory check happens on the client side <code>true</code> or on the server side <code>false</code>.
				 *
				 * @since 1.38.3
				 */
				clientSideMandatoryCheck: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Determines whether the <code>SmartField</code> control fetches its value list to display the description for a given key (<code>value</code>
				 * property) in read-only mode. If the value list is not fetched by the read-only <code>SmartField</code> control, the application
				 * has to make sure that the description is requested and made available, for example, by using $expand. In this case the
				 * <code>SmartField</code> control will display the description if the path to the description has been set using the
				 * <code>com.sap.vocabularies.Common.v1.Text</code> annotation.
				 *
				 * @since 1.42.0
				 */
				fetchValueListReadOnly: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Indicates if entities related to navigation properties inside the metadata are requested.
				 * If set to <code>true</code>, then these related entities are loaded with an <code>$expand</code> request.
				 *
				 * Annotations that can have navigation properties are the following:
				 * <ul>
				 * 	<li> <code>com.sap.vocabularies.Common.v1.Text</code> for text arrangements
				 * 	<li> <code>Org.OData.Measures.V1.Unit</code> and <code>Org.OData.Measures.V1.ISOCurrency</code> for units
				 * 	<li> <code>com.sap.vocabularies.Common.v1.FieldControl</code> for field control
				 * </ul>
				 *
				 * <b>Note:</b> Independent of the <code>fetchValueListReadOnly</code> value, setting this flag to <code>true</code>
				 * requests data from the backend.
				 *
				 * <b>Note:</b> The backend request to expand the navigation properties is sent only if the entity to which <code>SmartField</code> is bound is persisted.
				 * For transient entities, there is no backend request since no such data is available.
				 *
				 * @experimental Since 1.48.
				 * @since 1.48
				 */
				expandNavigationProperties: {
					type: "boolean",
					group: "Behavior",
					defaultValue: false
				},

				/**
				 * Indicates whether the <code>TextArrangement</code> annotation of the <code>com.sap.vocabularies.UI.v1</code>
				 * vocabulary is evaluated for properties typed as <code>Edm.String</code> in edit mode.
				 *
				 * @experimental Since 1.52.
				 * @since 1.52
				 */
				textArrangementInEditMode: {
					type: "boolean",
					group: "Behavior",
					defaultValue: false
				}
			},
			aggregations: {
				/**
				 * The content aggregation is used to hold the control that is hosted by the <code>SmartField</code> control.
				 */
				_content: {
					type: "sap.ui.core.Control",
					multiple: false,
					visibility: "hidden"
				},

				/**
				 * Optional configuration for <code>SmartField</code>.
				 */
				configuration: {
					type: "sap.ui.comp.smartfield.Configuration",
					multiple: false
				},

				/**
				 * Proposes a control to be rendered. The <code>SmartField</code> control can ignore the proposal.
				 *
				 * @since 1.32.0
				 * @deprecated Since 1.34.0
				 */
				controlProposal: {
					type: "sap.ui.comp.smartfield.ControlProposal",
					multiple: false
				},

				/**
				 * Collects the texts to be used for the ARIA labels.<br>
				 * The InvisibleText controls will be added to the DOM by the <code>SmartField</code> control.
				 *
				 * @since 1.34.2
				 */
				_ariaLabelInvisibleText: {
					type: "sap.ui.core.InvisibleText",
					multiple: true,
					visibility: "hidden"
				},

				/**
				 * The Semantic Object Controller allows the user to specify and overwrite functionality for semantic object navigation.
				 */
				semanticObjectController: {
					type: "sap.ui.comp.navpopover.SemanticObjectController",
					multiple: false
				}
			},
			associations: {
				/**
				 * Association to controls / IDs which label this control (see WAI-ARIA attribute <code>aria-labelledby</code>).
				 *
				 * @since 1.34.2
				 */
				ariaLabelledBy: {
					type: "sap.ui.core.Control",
					multiple: true,
					singularName: "ariaLabelledBy"
				}
			},
			events: {
				/**
				 * The OData entity set is either derived from the control's binding context or from control's entity set property, if a value for it
				 * is specified. In both cases this event is fired.
				 */
				entitySetFound: {
					parameters: {
						/**
						 * The path to the found entity set
						 */
						entitySet: {
							type: "string"
						}
					}
				},

				/**
				 * The event is fired after the text in the field has been changed and the focus leaves the field, or after the Enter key has been
				 * pressed.
				 *
				 */
				change: {
					parameters: {
						/**
						 * The current value inside the text field
						 */
						value: {
							type: "string"
						},
						/**
						 * The new value inside the text field
						 */
						newValue: {
							type: "string"
						}
					}
				},

				/**
				 * The event is fired after the smart field has calculated its metadata.
				 *
				 */
				initialise: {},

				/**
				 * The event is fired after the visibility of the control has changed.
				 */
				visibleChanged: {
					parameters: {
						/**
						 * If <code>true</code>, the control is visible
						 */
						visible: {
							type: "boolean"
						}
					}
				},

				/**
				 * The event is fired after the value of editable property of the control has changed.
				 *
				 * @since 1.30.0
				 */
				editableChanged: {
					parameters: {
						/**
						 * If <code>true</code>, the control is in edit mode
						 */
						editable: {
							type: "boolean"
						}
					}
				},

				/**
				 * The event is fired after the context editable property of the control has changed.
				 *
				 * @since 1.32.0
				 */
				contextEditableChanged: {
					parameters: {
						/**
						 * The value of the context editable property of the control
						 */
						editable: {
							type: "boolean"
						}
					}
				},

				/**
				 * The event is fired after the inner controls have been created. The created controls can be obtained via oControl.getInnerControls().
				 */
				innerControlsCreated: {},

				/**
				 * The event is fired when after selection of values with value help or auto-suggest, the model is updated with the selected data.
				 *
				 * @since 1.31.0
				 *
				 */
				valueListChanged: {
					parameters: {
						/**
						 * An array of selected values
						 */
						changes: {
							type: "sap.ui.core.Control[]"
						}
					}
				},

				/**
				 * Fires when the user triggers the link control or taps/clicks on an active title of the object identifier control.
				 *
				 *
				 * @since 1.36.0
				 */
				press: {}
			}
		},
		/**
		 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
		 *
		 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
		 * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered.
		 * @private
		 * @since 1.34.0
		 */
		renderer: function(oRm, oControl) {
			oRm.write("<div ");
			oRm.writeControlData(oControl);
			oRm.addClass("sapUiCompSmartField");
			oRm.writeClasses();
			oRm.write(">");
			oRm.renderControl(oControl.getAggregation("_content"));
			if (oControl.getAggregation("_ariaLabelInvisibleText")) {
				oControl.getAggregation("_ariaLabelInvisibleText").forEach(function(oInvisibleText) {
					oRm.renderControl(oInvisibleText);
				});
			}
			oRm.write("</div>");
		}
	});

	/**
	 * Returns the Edm data type of either the OData property to which the value property of the control is bound or the data type of the attribute in
	 * the JSON model used. If no model is available null is returned.
	 *
	 * @name sap.ui.comp.smartfield.SmartField#getDataType
	 * @function
	 * @type string
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */

	/**
	 * If the control's value property is bound to an OData property that semantically represents a unit of measure, the value of the current unit of
	 * measure is returned. Otherwise <code>null</code> is returned.
	 *
	 * @name sap.ui.comp.smartfield.SmartField#getUnitOfMeasure
	 * @function
	 * @type string
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */

	/**
	 * If the control's value property is bound to an OData property that semantically represents a unit of measure, the value of the current unit of
	 * measure can be changed.
	 *
	 * @name sap.ui.comp.smartfield.SmartField#setUnitOfMeasure
	 * @function
	 * @param {string} sSUnit The new unit of measure to be set.
	 * @type void
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */

	SmartField.prototype.init = function() {
		this._bInDestroy = false;
		this._oSideEffects = new SideEffectUtil(this);
		this._oFactory = null;

		this._oControl = {
			display: null,
			"display_uom": null,
			edit: null,
			current: null
		};

		this._oValue = {
			display: null,
			edit: null,
			uom: null,
			uomset: null
		};

		this._oError = {
			bComplex: false,
			bFirst: false,
			bSecond: false
		};

		this._sBindingContextPath = "";
		this._oValueBind = null;
		this._oUtil = new BindingUtil();
		this._bSuppressToggleControl = false;
		this.attachEvent("innerControlsCreated",SmartField.prototype._setOnInnerControl,this);//inner controls not ready wait for creation
	};

	SmartField.prototype.setVisible = function(bVisible, bSuppressInvalidate) {
		var bOldVisible = this.getVisible();
		Control.prototype.setVisible.apply(this, arguments);
		bVisible = this.getVisible();

		if (bVisible !== bOldVisible) {
			this.fireVisibleChanged({
				visible: bVisible
			});
		}

		return this;
	};

	SmartField.prototype.setEditable = function(bEditable) {
		var bOldEditable = this.getEditable();
		this.setProperty("editable", bEditable, true);
		bEditable = this.getEditable();
		this._bPendingEditableState = false;
		this._toggleControl();

		if (bEditable !== bOldEditable) {
			this.fireEditableChanged({
				editable: bEditable
			});
		}

		return this;
	};

	SmartField.prototype.setContextEditable = function(bContextEditable) {
		var bOldContextEditable = this.getContextEditable();
		this.setProperty("contextEditable", bContextEditable, true);
		bContextEditable = this.getContextEditable();
		this._bPendingEditableState = false;
		this._toggleControl();

		if (bContextEditable !== bOldContextEditable) {
			this.fireContextEditableChanged({
				editable: bContextEditable
			});
		}

		return this;
	};

	SmartField.prototype.setMandatory = function(bMandatory) {
		this.setProperty("mandatory", bMandatory, false);
		this._setOnInnerControl();
		return this;
	};

	SmartField.prototype.setWidth = function(sWidth) {
		this.setProperty("width", sWidth, true);
		this._setOnInnerControl();
		return this;
	};

	SmartField.prototype.setWrapping = function(bWrapping) {
		this.setProperty("wrapping", bWrapping, true);
		this._setOnInnerControl();
		return this;
	};

	SmartField.prototype.setTextAlign = function(sTextAlign) {
		this.setProperty("textAlign", sTextAlign, true);
		this._setOnInnerControl();
		return this;
	};

	SmartField.prototype.setPlaceholder = function(sPlaceholder) {
		this.setProperty("placeholder", sPlaceholder, true);
		this._setOnInnerControl();
		return this;
	};

	SmartField.prototype.setName = function(sName) {
		this.setProperty("name", sName, true);
		this._setOnInnerControl();
		return this;
	};

	SmartField.prototype.setMaxLength = function(iMaxLength) {
		this.setProperty("maxLength", iMaxLength, true);
		this._setOnInnerControl();
		return this;
	};

	SmartField.prototype.setShowValueHelp = function(bShowValueHelp) {
		this.setProperty("showValueHelp", bShowValueHelp, true);
		bShowValueHelp = this.getShowValueHelp();

		if (bShowValueHelp && this._oFactory && this.getEditable()) {
			this._oFactory._createValueHelp();
		}

		var oChild = this.getAggregation("_content");

		if (oChild && (typeof oChild.setShowValueHelp === "function")) {
			oChild.setShowValueHelp(bShowValueHelp);
		}

		return this;
	};

	SmartField.prototype.setShowSuggestion = function(bShowSuggestion) {
		this.setProperty("showSuggestion", bShowSuggestion, true);
		bShowSuggestion = this.getShowSuggestion();

		if (bShowSuggestion && this._oFactory && this.getEditable()) {
			this._oFactory._createValueHelp();
		}

		var oChild = this.getAggregation("_content");

		if (oChild && (typeof oChild.setShowSuggestion === "function")) {
			oChild.setShowSuggestion(bShowSuggestion);
		}

		return this;
	};

	SmartField.prototype.setTextArrangementInEditMode = function(bTextArrangementInEditMode) {
		var bOldTextArrangementInEditMode = this.getTextArrangementInEditMode();
		this.setProperty("textArrangementInEditMode", bTextArrangementInEditMode, false);
		bTextArrangementInEditMode = this.getTextArrangementInEditMode();

		if (bTextArrangementInEditMode !== bOldTextArrangementInEditMode) {
			this._destroyChildControls();
			this._toggleControl();
		}

		return this;
	};

	/**
	 * Sets the SmartField's width to the inner control
	 *
	 * @return {sap.ui.comp.smartfield.SmartField} <code>this</code> to allow method chaining
	 * @private
	 */
	SmartField.prototype._setOnInnerControl = function() {
		var oChild = this.getAggregation("_content"),
			sWidth;

		if (oChild) {

			if (typeof oChild.setWidth === "function") {
				sWidth = this.getWidth();

				// set the width if and only if a value other than the default is available (default is "")
				// the problem is that some controls (e.g. sap.m.Select and sap.m.ComboBox) have a width set during creation
				// we do not want to invalidate this.
				// if there are problems, always check these controls.
				if (sWidth) {
					oChild.setWidth(sWidth);
				}
			}

			if (typeof oChild.setWrapping === "function") {
				oChild.setWrapping(this._getWrappingForInnerControl(oChild));
			}

			if (typeof oChild.setName === "function") {
				oChild.setName(this.getName());
			}

			if (typeof oChild.setPlaceholder === "function") {
				oChild.setPlaceholder(this.getPlaceholder());
			}

			if (typeof oChild.setTextAlign === "function") {
				oChild.setTextAlign(this.getTextAlign());
			}

			if ((typeof oChild.setMaxLength === "function") && this._oFactory && this._oFactory._getMaxLength && !this.getTextArrangementInEditMode()) {
				oChild.setMaxLength(this._oFactory._getMaxLength());
			}

			if (typeof oChild.setRequired === "function") {
				oChild.setRequired(this.getMandatory());
			}
		}

		return this;
	};

	/**
	 * Gets the wrapping value for the inner control aggregation.
	 *
	 * @param {sap.ui.core.Control} [oChild] Control to propagate the wrapping behavior
	 * @returns {boolean|string} The value depending on the <code>wrapping</code> property's type
	 * @private
	 * @since 1.46
	 */
	SmartField.prototype._getWrappingForInnerControl = function(oChild) {
		var bWrapping = this.getWrapping(),
			oProperty;

		oChild = oChild || this.getAggregation("_content");

		if (oChild) {
			oProperty = oChild.getMetadata().getProperty("wrapping");
		}

		if (oProperty) {

			switch (oProperty.type) {
				case "boolean":
					return bWrapping;

				case "sap.ui.core.Wrapping":
					var mWrappingMode = sap.ui.core.Wrapping;

					if (bWrapping) {
						return mWrappingMode.Soft;
					}

					return mWrappingMode.None;

				// no default
			}
		}

		return bWrapping;
	};

	/**
	 * Setter for property <code>url</code>. Default value is <code>null</code>.
	 *
	 * @param {string} sValue The new value for property <code>url</code>
	 * @return {sap.ui.comp.smartfield.SmartField} <code>this</code> to allow method chaining
	 * @since 1.29
	 * @public
	 */
	SmartField.prototype.setUrl = function(sValue) {
		this.setProperty("url", sValue, true);
		return this;
	};

	SmartField.prototype.setEntitySet = function(sValue) {
		this.setProperty("entitySet", sValue, true);
		this.fireEntitySetFound({
			entitySet: sValue
		});
		return this;
	};

	/*
	 * If set to <code>false</code>, creation of inner controls is suspended until editable or contextEditable is set. As the default for editable
	 * is <code>true</code> the edit control would be created even in display scenarios. The method is used by the SmartTable control for
	 * performance reasons.
	 */
	SmartField.prototype._setPendingEditState = function(bDisplayState) {
		this.data("pendingEditableState", !bDisplayState);
	};

	SmartField.prototype.applySettings = function(mSettings) {

		if (mSettings && mSettings.customData) {
			for (var i = 0; i < mSettings.customData.length; i++) {
				var oCustomData = mSettings.customData[i];

				if (oCustomData && oCustomData.mProperties && oCustomData.mProperties.key === "pendingEditableState") {
					this._bPendingEditableState = oCustomData.mProperties.value;
				}
			}
		}

		return Control.prototype.applySettings.apply(this, arguments);
	};

	SmartField.prototype.setEnabled = function(bValue) {
		this.setProperty("enabled", bValue, true);
		this._toggleControl();
		return this;
	};

	SmartField.prototype.setContent = function(vContent) {
		return this.setAggregation("_content", vContent);
	};

	/*
	 * Gets the control factory object.
	 *
	 * @returns {sap.ui.comp.smartfield.ControlFactoryBase} The control factory object
	 * @protected
	 * @since 1.48
	 */
	SmartField.prototype.getControlFactory = function() {
		return this._oFactory;
	};

	SmartField.prototype.getValue = function() {

		// as two-way-binding cannot be assumed to be a prerequisite,
		// check for a call-back and return the current value.
		var fnProp = this.getInnerValueFunction();

		if (fnProp) {
			return fnProp();
		}

		// as fall-back return the property value.
		return this.getProperty("value");
	};

	SmartField.prototype.getInnerValueFunction = function() {

		if (this._oValue && (typeof this._oValue[this.getMode()] === "function")) {
			return this._oValue[this.getMode()];
		}

		return null;
	};

	SmartField.prototype.getValueState = function() {
		var aChildren = this.getInnerControls(),
			iIndex = this._getMaxSeverity(aChildren);

		if (iIndex > -1) {
			return aChildren[iIndex].getValueState();
		}

		return ValueState.None;
	};

	/**
	 * Setter for property <code>valueState</code>. Default value is <code>None</code>.
	 *
	 * @param {sap.ui.core.ValueState} sValueState The new value for property <code>valueState</code>
	 * @return {sap.ui.comp.smartfield.SmartField} <code>this</code> to allow method chaining
	 * @since 1.30.0
	 * @public
	 */
	SmartField.prototype.setValueState = function(sValueState) {
		var aChildren = this.getInnerControls(),
			oChild,
			sMethod = "setSimpleClientError";

		if (aChildren && aChildren.length) {
			oChild = aChildren[0];

			if (aChildren.length > 1) {
				sMethod = "setComplexClientErrorFirstOperand";
			}
		}

		// forward the value state to the child control.
		// in unit of measure use cases and generally, if more than one control is hosted,
		// set a possible error on the first child.
		if (oChild && oChild.setValueState) {
			oChild.setValueState(sValueState);
			this[sMethod](sValueState === ValueState.Error);
		}

		return this;
	};

	SmartField.prototype.getValueStateText = function() {
		var aChildren = this.getInnerControls(),
			iIndex = this._getMaxSeverity(aChildren);

		if (iIndex > -1) {
			return aChildren[iIndex].getValueStateText();
		}

		return this.getProperty("valueStateText");
	};

	/**
	 * Setter for property <code>valueStateText</code>. Default value is empty/<code>undefined</code>.
	 *
	 * @param {string} sText The new value for property <code>valueStateText</code>
	 * @return {sap.ui.comp.smartfield.SmartField} <code>this</code> to allow method chaining
	 * @since 1.29
	 * @public
	 */
	SmartField.prototype.setValueStateText = function(sText) {
		var aChildren = this.getInnerControls(),
			oChild;

		if (aChildren && aChildren.length) {
			oChild = aChildren[0];
		}

		// forward the value state to the child control.
		// in unit of measure use cases and generally, if more than one control is hosted,
		// set a possible error on the first child.
		if (oChild && oChild.setValueStateText) {
			oChild.setValueStateText(sText);
		}

		return this;
	};

	/**
	 * Calculates the index of the child control with the most severe message.
	 *
	 * @param {array} aChildren The currently available child controls
	 * @returns {int} The index of the child control with the most severe message, can be <code>-1</code>
	 * @private
	 */
	SmartField.prototype._getMaxSeverity = function(aChildren) {
		var oState,
			oChild,
			i,
			len,
			iState = 0,
			iIndex = -1,
			mState = {
				"Error": 3,
				"Warning": 2,
				"Success": 1,
				"None": 0
			};

		len = aChildren.length;

		for (i = 0; i < len; i++) {
			oChild = aChildren[i];

			if (oChild.getValueState) {
				oState = oChild.getValueState();

				if (oState && mState[oState] > iState) {
					iState = mState[oState];
					iIndex = i;
				}
			}
		}

		return iIndex;
	};

	/**
	 * Returns the DOM element that gets the focus.
	 *
	 * @returns {sap.ui.core.Element} The DOM element that should get the focus, can be <code>null</code>
	 * @public
	 */
	SmartField.prototype.getFocusDomRef = function() {
		var aChildren = this.getInnerControls(),
			oChild,
			len = aChildren.length;

		if (len > 0) {
			oChild = aChildren[0];
		}

		if (oChild && oChild.getFocusDomRef) {
			return oChild.getFocusDomRef();
		}

		return Control.prototype.getFocusDomRef.apply(this, arguments);
	};

	/**
	 * Gets the ID of the control to which the label should point.
	 *
	 * @returns {string} The ID of the inner control if it exists, otherwise the ID of the <code>SmartField</code> control
	 * @public
	 */
	SmartField.prototype.getIdForLabel = function() {
		var aChildren = this.getInnerControls(),
			oChild,
			iLen = aChildren.length;

		if (iLen > 0) {
			oChild = aChildren[0];
		}

		if (oChild && (typeof oChild.getIdForLabel === "function")) {
			return oChild.getIdForLabel();
		}

		return this.getId();
	};

	SmartField.prototype.updateBindingContext = function(bSkipLocal, sModelName, bUpdateAll) {

		if (this._bInDestroy) {
			return;
		}

		this._init(sModelName);

		if (this._oFactory) {

			if (this.getBindingContext()) {
				this._sBindingContextPath = this.getBindingContext().getPath();
			}

			if (this._oFactory.bind) {
				this._oFactory.bind();

				// also check for field group annotation.
				this._checkFieldGroups();
			} else {
				this._toggleControl();
			}
		}

		Control.prototype.updateBindingContext.apply(this, arguments);
	};

	/**
	 * Returns the current SmartField's edit mode
	 *
	 * @returns {string} Returns "edit" or "display" or "display_uom"
	 * @protected
	 */
	SmartField.prototype.getMode = function() {
		var bEditable = this.getEditable(),
			bEnabled = this.getEnabled(),
			bContextEditable = this.getContextEditable();

		// check for configuration.
		if (this.getControlContext() === "responsiveTable" && this.data("suppressUnit") !== "true") {

			// somehow the control is disabled
			if (!bEditable || !bContextEditable || !bEnabled || (this.getUomEditState() === 0)) {
				return "display_uom";
			}
		}

		// context editable in smart form is on parent's parent in UOM for unit.
		if (bContextEditable && this.data("configdata") && this.data("configdata").configdata.isUOM && this.data("configdata").configdata.isInnerControl && this.data("configdata").configdata.getContextEditable) {
			bContextEditable = this.data("configdata").configdata.getContextEditable();
		}

		return bEditable && bEnabled && bContextEditable ? "edit" : "display";
	};

	/**
	 * Sets the current control, depending on <code>displayMode</code> and the binding of the <code>value</code> property of the current control.
	 * If necessary a control is created.
	 *
	 * @private
	 */
	SmartField.prototype._toggleControl = function() {
		var sMode,
			oValue,
			oConfig,
			bCreate = true;

		if (this._bPendingEditableState || this._bSuppressToggleControl) {
			return;
		}

		if (!this._oFactory || this._oFactory.bPending) {
			return;
		}

		sMode = this.getMode();

		if (sMode === "edit" || sMode === "display_uom") { // always create control if in edit mode

			// _createControl sets the current mode.
			this._createControl(sMode);
		} else {
			oValue = this.getProperty("value");

			// optimization for table use cases only.
			// if it is not a table, no configuration data set.
			oConfig = this.data("configdata");

			if (oConfig && oConfig.configdata && !oConfig.configdata.isUOM) {
				if (oValue === null || oValue === "") {
					bCreate = false;
				}
			}

			if (bCreate) { // in display mode, only create control if value is not empty

				// _createControl sets the current mode.
				this._createControl(sMode);
			} else {
				this.setAggregation("_content", null); // if value is empty, our content has to be null

				// better set the current mode, otherwise toggling gets out-of-sync.
				this._oControl.current = "display";
			}
		}

		this._setOnInnerControl();
	};

	SmartField.prototype.setValue = function(sValue) {
		var sOldValue = this.getProperty("value");
		this.setProperty("value", sValue, true);
		var oFactory = this._oFactory;

		if (oFactory && !oFactory.bPending) {
			this._toggleControl();
		}

		sValue = this.getProperty("value");

		// This flag indicates whether the .setValue() mutator method is called by the framework
		// due to a property binding change e.g.: by calling .updateProperty("value")
		var bModelUpdate = this.isBound("value") && this.getBindingInfo("value").skipModelUpdate;

		// In edit mode, if the textArrangementInEditMode property is set to true, a composite binding is used for
		// the hosted inner control (usually a sap.m.Input).
		// So, calling .setValue() on the SmartField, would not update all model properties of the hosted inner
		// control. Therefore a model update for the value property is done by calling the oControl.updateModelProperty()
		// method to force parsing, validation and formatting of the smart data type where all model properties are updated.
		if (this.getTextArrangementInEditMode() && (sValue !== sOldValue) && !bModelUpdate) {
			var oControl = this._oControl;
			oControl = oControl[oControl.current];
			var oBinding = oControl && oControl.getBinding("value");

			if (oBinding) {

				// force parsing, validation and formatting of the TextArrangementString data type
				oControl.updateModelProperty("value", sValue, oBinding.getValue());
			}
		}

		return this;
	};

	/**
	 * Creates the actual control depending on the current edit mode and sets it to the SmartField's content
	 *
	 * @param {string} sMode The current edit mode, either "edit" or "display"
	 * @private
	 */
	SmartField.prototype._createControl = function(sMode) {

		if (this._oFactory) {

			if ((sMode !== this._oControl.current) || !this._oControl[sMode]) {

				if (!this._oControl[sMode]) {
					var oControl = this._oFactory.createControl();

					if (oControl) {
						this._oControl[sMode] = oControl.control;
						this._placeCallBacks(oControl, sMode);
					}
				}

				// set the content.
				this._oControl.current = sMode;
				this.setAggregation("_content", this._oControl[sMode]);
				this.fireInnerControlsCreated(this.getInnerControls());
			} else if (!this.getAggregation("_content")) {
				this.setAggregation("_content", this._oControl[sMode]);
			}
		}
	};

	/**
	 * Sets the available call-backs after successful control creation.
	 *
	 * @param {sap.ui.core.Control} oControl The given control
	 * @param {string} sMode The current mode, either "edit" or "display"
	 * @private
	 */
	SmartField.prototype._placeCallBacks = function(oControl, sMode) {

		// set the value call-back.
		if (oControl.params && oControl.params.getValue) {
			this._oValue[sMode] = oControl.params.getValue;
		}

		// set the unit-of-measure-get call-back.
		if (oControl.params && oControl.params.uom) {
			this._oValue.uom = oControl.params.uom;
		}

		// set the unit-of-measure-set call-back.
		if (oControl.params && oControl.params.uomset) {
			this._oValue.uomset = oControl.params.uomset;
		}
	};

	/**
	 * Initializes the control, if it has not already been initialized.
	 *
	 * @param {string} sModelName The name of the model currently used
	 * @private
	 */
	SmartField.prototype._init = function(sModelName) {
		var oModel,
			oBindingInfo,
			oConfig;

		// destroy factory if entity type changed
		if (this._oFactory && this._sBindingContextPath && this.getBindingContext() && (this._sBindingContextPath !== this.getBindingContext().getPath())) {
			this._destroyFactory();
		}

		if (!this._oFactory) {
			oConfig = this.data("configdata");

			if (!oConfig) {
				oModel = this.getModel(sModelName);
			}

			oBindingInfo = this._getBindingInfo(sModelName, "value");

			if (oBindingInfo) {

				if (oConfig || oModel) {
					this._oFactory = this._createFactory(sModelName, oModel, oBindingInfo, oConfig);
				}
			} else if (oModel && !(oModel instanceof JSONModel)) {

				if (this.getBindingInfo("url") || this.getUrl()) {

					if (oConfig || oModel) {
						this._oFactory = this._createFactory(sModelName, oModel, oBindingInfo, oConfig);
					}
				}
			}
		}
	};

	/**
	 * Destroys the control factory and the existing inner controls.
	 *
	 * @private
	 */
	SmartField.prototype._destroyFactory = function() {
		this._bSuppressToggleControl = true;
		this._bSideEffects = false;

		if (this._oFactory) {
			this._oFactory.destroy();
		}

		this._oFactory = null;
		this._bSuppressToggleControl = false;
		this._destroyChildControls();
	};

	SmartField.prototype._destroyChildControls = function() {

		if (this._oControl) {

			if (this._oControl.display) {
				this._oControl.display.destroy();
			}

			if (this._oControl["display_uom"]) {
				this._oControl["display_uom"].destroy();
			}

			if (this._oControl.edit) {
				this._oControl.edit.destroy();
			}

			this._oControl.display = null;
			this._oControl["display_uom"] = null;
			this._oControl.edit = null;
			this._oControl.current = null;
		}

		this._oValue = {
			display: null,
			edit: null,
			uom: null,
			uomset: null
		};

		this.destroyAggregation("_content");
	};

	/**
	 * Creates the control factory and returns it. If the variable <code>oModel</code> is <code>null</code> or <code>undefined</code>,
	 * <code>null</code> is returned.
	 *
	 * @param {string} sModelName The name of the model currently used
	 * @param {sap.ui.model.Model} oModel The model currently used
	 * @param {object} oBindingInfo The binding information from the control for the <code>value</code> property
	 * @param {object} oConfig Optional control configuration
	 * @returns {sap.ui.comp.smartfield.ControlFactoryBase} the new control factory instance
	 * @private
	 */
	SmartField.prototype._createFactory = function(sModelName, oModel, oBindingInfo, oConfig) {
		var sEntitySet,
			oParam;

		// check whether JSONControlFactoryl can be created.
		if (oModel && oModel instanceof JSONModel) {
			return new JSONControlFactory(oModel, this, {
				model: sModelName,
				path: oBindingInfo.path
			});
		}

		// check whether ODataControlFactory can be created.
		if (!oConfig) {
			sEntitySet = this._getEntitySet(sModelName);
		}

		if (sEntitySet || oConfig) {
			if (oConfig) {
				oParam = oConfig.configdata;
			} else {
				oParam = {
					entitySet: sEntitySet,
					model: sModelName,
					path: (oBindingInfo && oBindingInfo.path) ? oBindingInfo.path : ""
				};
			}

			return new ODataControlFactory(oModel, this, oParam);
		}

		return null;
	};

	/**
	 * Calculates the <code>entitySet</code> that is interpreted by this control. The calculation uses either the <code>bindingContext</code> of
	 * this control or alternatively the property <code>entitySet</code>.
	 *
	 * @param {string} sModelName The name of the model currently used
	 * @returns {string} The <code>entitySet</code> that is interpreted by this control
	 * @private
	 */
	SmartField.prototype._getEntitySet = function(sModelName) {
		var sEntitySet = this.getEntitySet();

		if (sEntitySet && !sModelName) {
			return sEntitySet;
		}

		// take the entity set from the binding context.
		var oBindingContext = this.getBindingContext(sModelName);

		if (oBindingContext) {

			// check for a defective binding.
			if (!oBindingContext.sPath || (oBindingContext.sPath === "/undefined")) {
				return "";
			}

			sEntitySet = this._oUtil.correctPath(oBindingContext.sPath);
			this.fireEntitySetFound({
				entitySet: sEntitySet
			});

			return sEntitySet;
		}

		return "";
	};

	/**
	 * Returns the binding information for the given property or aggregation. The binding information contains information about path, binding object,
	 * format options, sorter, filter etc. for the property or aggregation.
	 *
	 * @param {string} sModel The optional name of a specific model to update
	 * @param {string} sName The name of the property or aggregation
	 * @returns {object} Binding information of the value binding of this control, if the model is the appropriate one, <code>null</code> otherwise
	 * @private
	 */
	SmartField.prototype._getBindingInfo = function(sModel, sName) {

		if (!this._oValueBind) {
			this._oValueBind = this.getBindingInfo(sName);

			try {
				this._oValueBind = this._oValueBind.parts[0];
			} catch (ex) {
				// ignore
			}
		}

		if (this._oValueBind) {

			if (!this._oValueBind.model && !sModel) {
				return this._oValueBind;
			}

			if (this._oValueBind.model === sModel) {
				return this._oValueBind;
			}
		}

		return null;
	};

	/**
	 * Returns the EDM data type of the OData property to which the value property of the control is bound to. If no model or no OData property is
	 * available <code>null</code> is returned.
	 *
	 * @returns {string} The data type to which the value property is bound.
	 * @public
	 */
	SmartField.prototype.getDataType = function() {
		var oProp;

		if (this._oFactory) {

			// only ODataControlFactory has the method getDataType.
			if (this._oFactory.getDataProperty) {
				oProp = this._oFactory.getDataProperty();

				if (oProp) {
					return oProp.property.type;
				}
			}

			return this.getJsonType();
		}

		return null;
	};

	/**
	 * Returns the OData property to which the <code>value</code> property of the control is bound.
	 *
	 * @returns {object} The OData property.
	 * @public
	 */
	SmartField.prototype.getDataProperty = function() {

		if (this._oFactory) {

			// only ODataControlFactory has the method getDataProperty.
			if (this._oFactory.getDataProperty) {
				return this._oFactory.getDataProperty();
			}

			return null;
		}

		return null;
	};

	/**
	 * If the OData property to which the control's value property is bound semantically represents a unit of measure, the value of the current unit
	 * of measure is returned. Otherwise <code>null</code> is returned.
	 *
	 * @returns {any} The current unit of measure is returned, which can be <code>null</code
	 * @public
	 */
	SmartField.prototype.getUnitOfMeasure = function() {

		if (this._oValue.uom) {
			return this._oValue.uom();
		}

		return null;
	};

	/**
	 * If the OData property the control's value property is bound to semantically represents a unit of measure, the value of the current unit of
	 * measure can be changed.
	 *
	 * @param {string} sUnit The new unit of measure to be set.
	 * @public
	 */
	SmartField.prototype.setUnitOfMeasure = function(sUnit) {
		if (sUnit && this._oValue.uomset) {
			this._oValue.uomset(sUnit);
		}
	};

	/**
	 * Marks the <code>SmartField</code> control as having a client error.
	 *
	 * @param {boolean} bError If set to <code>true</code> the field is marked as having an error
	 * @private
	 */
	SmartField.prototype.setSimpleClientError = function(bError) {
		this._oError.bFirst = bError;
	};

	/**
	 * Marks the <code>SmartField</code> control and the first inner control as having a client error.
	 *
	 * @param {boolean} bError If set to <code>true</code> the field is marked as having an error
	 * @private
	 */
	SmartField.prototype.setComplexClientErrorFirstOperand = function(bError) {
		this._oError.bComplex = true;
		this._oError.bFirst = bError;
	};

	/**
	 * Marks the <code>SmartField</code> control and the second inner control as having a client error.
	 *
	 * @param {boolean} bError If set to <code>true</code> the field is marked as having an error
	 * @private
	 */
	SmartField.prototype.setComplexClientErrorSecondOperand = function(bError) {
		this._oError.bComplex = true;
		this._oError.bSecond = bError;
	};

	/**
	 * Marks the hosting <code>SmartField</code> control as having a client error.
	 *
	 * @param {boolean} bError If set to <code>true</code> the field is marked as having an error
	 * @private
	 */
	SmartField.prototype.setComplexClientErrorSecondOperandNested = function(bError) {
		var oParent = this.getParent().getParent();
		oParent.setComplexClientErrorSecondOperand(bError);
	};

	/**
	 * Returns whether a client error has been detected.
	 *
	 * @returns {boolean} <code>true</code>, if a client error has been detected, <code>false</code> otherwise
	 * @private
	 */
	SmartField.prototype._hasClientError = function() {

		if (this._oError.bComplex) {
			return this._oError.bFirst || this._oError.bSecond;
		}

		return this._oError.bFirst;
	};

	/**
	 * Returns whether a client error has been detected. Additionally the error message is shown, if this is not the case already.
	 *
	 * @returns {boolean} <code>true</code>, if a client error has been detected, <code>false</code> otherwise
	 * @public
	 */
	SmartField.prototype.checkClientError = function() {
		var aChildren,
			len;

		// in display mode: no error.
		if (this.getMode() === "display") {
			return false;
		}

		// a client error has already been detected.
		if (this._hasClientError()) {
			return true;
		}

		// check again.
		aChildren = this.getInnerControls();
		len = aChildren.length;

		for (var i = 0; i < len; i++) {
			this._checkClientError(aChildren[i]);
		}

		// return a possibly detected error.
		return this._hasClientError();
	};

	/**
	 * Checks for a client error on the given control. Additionally the error message is shown, if this is not the case already.
	 *
	 * @param {sap.ui.core.Control} oControl The control to be checked
	 * @private
	 */
	SmartField.prototype._checkClientError = function(oControl) {
		var sValue = null,
			oType = null,
			oParsedValue = null,
			oBind,
			sMethod,
			sParam,
			mParameters = {
				"sap.m.Input": "value",
				"sap.m.DatePicker": "value",
				"sap.m.ComboBox": "selectedKey",
				"sap.m.TextArea": "value"
			};

		if (oControl) {
			sParam = mParameters[oControl.getMetadata()._sClassName];
		}

		if (sParam) {
			oBind = oControl.getBinding(sParam);
		}

		if (oBind) {

			try {
				sMethod = "get" + sParam.substring(0, 1).toUpperCase() + sParam.substring(1);
				sValue = oControl[sMethod]();
				oType = oBind.getType();

				if (oBind.sInternalType) {
					oParsedValue = oType.parseValue(sValue, oBind.sInternalType);
					oType.validateValue(oParsedValue);
				}
			} catch (ex) {

				if (ex instanceof ParseException) {
					oControl.fireParseError({
						exception: ex
					});
				}

				if (ex instanceof ValidateException) {
					oControl.fireValidationError({
						exception: ex
					});
				}
			}
		}
	};

	/*
	 * Returns whether the current control context points to a table.
	 *
	 * @returns {boolean} <code>true</code> if the current <code>SmartField</code> control is used inside a table, <code>false</code> otherwise
	 * @protected
	 */
	SmartField.prototype.isContextTable = function() {
		return (this.getControlContext() === "responsiveTable" || this.getControlContext() === "table");
	};

	/**
	 * Resolves the controls hosted currently by this <code>SmartField</code> control.
	 *
	 * @returns {array} The controls hosted currently by this <code>SmartField</code>
	 * @public
	 */
	SmartField.prototype.getInnerControls = function() {
		var oContent,
			fContent,
			mComplex = {
			"sap.m.HBox": function(oControl) {
				var oChild,
					aItems,
					len = 0;

				aItems = oControl.getItems();

				if (aItems) {
					len = aItems.length;
				}

				if (len === 0) {
					return [];
				}

				if (len === 1) {
					return [
						aItems[0]
					];
				}

				oChild = aItems[1].getAggregation("_content");

				if (oChild) {
					return [
						aItems[0], oChild
					];
				}

				return [
					aItems[0]
				];
			},
			"sap.ui.comp.navpopover.SmartLink": function(oControl) {
				var oItem = oControl.getAggregation("innerControl");

				if (oItem) {
					return [
						oItem
					];
				}

				return [
					oControl
				];
			}
		};

		oContent = this.getAggregation("_content");

		if (oContent) {
			fContent = mComplex[oContent.getMetadata()._sClassName];
		}

		if (fContent) {
			return fContent(oContent);
		}

		if (oContent) {
			return [
				oContent
			];
		}

		return [];
	};

	/**
	 * Resolves the controls hosted currently by this <code>SmartField</code>.
	 *
	 * @returns {array} The controls hosted currently by this <code>SmartField</code>
	 * @public
	 */
	SmartField.prototype._getEmbeddedSmartField = function() {
		var aContent = this.getAggregation("_content");

		if (aContent) {

			if (aContent instanceof sap.m.HBox) {
				var aHBoxContent = aContent.getItems();

				if (aHBoxContent) {

					for (var j = 0; j < aHBoxContent.length; j++) {

						if (aHBoxContent[j] instanceof SmartField) {
							return aHBoxContent[j];
						}
					}
				}
			}
		}

		return null;
	};

	/**
	 * The function is called when the rendering of the control is completed.
	 *
	 * @private
	 */
	SmartField.prototype.onAfterRendering = function() {

		if (Control.prototype.onAfterRendering) {
			Control.prototype.onAfterRendering.apply(this);
		}

		// also check for field group annotation.
		this._checkFieldGroups();
	};

	SmartField.prototype.onBeforeRendering = function() {
		var aFields = this.getInnerControls();
		var that = this;

		if (this.getAriaLabelledBy().length > 0) {
			aFields.forEach(function(oField) {

				if (oField.addAriaLabelledBy && oField.getAriaLabelledBy) {

					if (oField.getAriaLabelledBy().length === 0) {
						oField.addAriaLabelledBy(that.getAriaLabelledBy()[0]);
					}
				}
			});
		}
	};

	SmartField.prototype.onBeforeValidateValue = function(sValue) {
		var oModel = this.getModel(),
			oControl = this._oControl.edit,
			oBinding = oControl.getBinding("value"),
			oValueListAnnotation = this.getControlFactory().getDataProperty().valueListAnnotation;

		oModel.read("/" + oValueListAnnotation.valueListEntitySetName, {
			filters: getValueListFilters(sValue, {
				keyFieldPath: oValueListAnnotation.keyField,
				descriptionFieldPath: oValueListAnnotation.descriptionField
			}),
			success: this.onRequestValueListDataSuccess.bind(this, {
				value: sValue,
				oldValue: oBinding.getValue()
			}),
			error: this.onRequestValueListDataError.bind(this)
		});

		oControl.setBusyIndicatorDelay(300);
		oControl.setBusy(true);
	};

	SmartField.prototype.onRequestValueListDataSuccess = function(mSettings, oData, oResponse) {
		var oControl = this._oControl.edit,
			oBinding = oControl.getBinding("value"),
			oType = oBinding.getType();

		oType.bNewDataLoaded = true;
		oType.oSettings.data = oData.results;

		// trigger parsing, validation and formatting
		oControl.updateModelProperty("value", mSettings.value, mSettings.oldValue);

		// restore the busy and busy indicator delay states to the initial value
		oControl.setBusyIndicatorDelay(0);
		oControl.setBusy(false);
	};

	SmartField.prototype.onRequestValueListDataError = function(oError) {
		var oControl = this._oControl.edit,
			oType = oControl.getBinding("value").getType();

		oType.bNewDataLoaded = true;
		oType.oSettings.data = [];

		// restore the busy and busy indicator delay states to the initial value
		oControl.setBusyIndicatorDelay(0);
		oControl.setBusy(false);
	};

	SmartField.prototype.onAfterValidateValue = function(sValue) {
		this.fireChange({
			value: sValue
		});
	};

	SmartField.prototype.getFirstChildControl = function() {
		var aControls = this.getInnerControls();

		if (aControls.length) {
			return aControls[0] || null;
		}

		return null;
	};

	function getValueListFilters(vValue, oSettings) {
		return [
			new Filter({
				and: false,
				filters: [
					new Filter({
						path: oSettings.keyFieldPath,
						operator: FilterOperator.EQ,
						value1: vValue
					}),
					new Filter({
						path: oSettings.descriptionFieldPath,
						operator: FilterOperator.Contains,
						value1: vValue
					})
				]
			})
		];
	}

	/**
	 * Checks whether field groups can be set.
	 *
	 * @private
	 */
	SmartField.prototype._checkFieldGroups = function() {
		var oView,
			oMetaData,
			sMode = this.getMode();

		if (this.getBindingContext() && this._oFactory && this._oFactory.getMetaData && (sMode === "edit") && !this._bSideEffects) {

			// check whether the meta data for the smart field has already been calculated.
			oMetaData = this._oFactory.getMetaData();

			if (oMetaData && !oMetaData.property || (oMetaData.property && !oMetaData.property.property)) {
				return;
			}

			// view should be available.
			oView = this._getView();

			// now set the field group ids.
			if (oView && oMetaData) {
				this._setFieldGroup(oMetaData, oView);
			}
		}
	};

	/**
	 * Sets the field group ID according to the side effects annotation.
	 *
	 * @param {object} oMetaData the meta data used to create the control
	 * @param {object} oMetaData.entitySet the OData entity set definition
	 * @param {object} oMetaData.entityType the OData entity type definition
	 * @param {object} oMetaData.property the OData property definition
	 * @param {string} oMetaData.path the binding path
	 * @param {sap.ui.core.mvc.View} oView the current view
	 * @private
	 */
	SmartField.prototype._setFieldGroup = function(oMetaData, oView) {
		var aControls,
			aIDs = this._oSideEffects.getFieldGroupIDs(oMetaData, oView);

		if (aIDs) {
			aControls = this.getInnerControls();

			if (aControls.length) {
				this._bSideEffects = true;
				aControls[0].setFieldGroupIds(aIDs);
			}
		}
	};

	/**
	 * Returns the current view instance.
	 *
	 * @returns {sap.ui.core.mvc.View} the current view instance or <code>null</code>
	 * @private
	 */
	SmartField.prototype._getView = function() {
		var oObj = this.getParent();

		while (oObj) {
			if (oObj instanceof sap.ui.core.mvc.View) {
				return oObj;
			}

			oObj = oObj.getParent();
		}

		return null;
	};

	/**
	 * Event handler for data state changes.
	 *
	 * @param {string} sName The name of the property
	 * @param {object} oDataState the new data state.
	 * @private
	 */
	SmartField.prototype.refreshDataState = function(sName, oDataState) {
		var oBindingContext,
			oObject;

		if (sName === "value") {

			if (oDataState.isLaundering()) {

				if (this.getEditable()) {
					oBindingContext = this.getBindingContext();

					if (oBindingContext && oBindingContext.getObject) {
						oObject = oBindingContext.getObject();

						if (oObject && oObject.__metadata && oObject.__metadata.created) {
							this._checkCreated = true;
							return;
						}
					}
				}
			}

			// server has accepted the new instance and it is persistent now.
			if (this._checkCreated && !oDataState.isLaundering() && !oDataState.isDirty()) {
				this._oFactory.rebindOnCreated();
				delete this._checkCreated;
			}
		}
	};

	/**
	 * Cleans up the resources associated with this element and all its children.
	 *
	 * @private
	 */
	SmartField.prototype.exit = function() {

		this._bInDestroy = true;
		var oInactiveInnerControl = null;

		if (this._oSideEffects) {
			this._oSideEffects.destroy();
		}

		if (this._oUtil) {
			this._oUtil.destroy();
		}

		if (this._oFactory) {
			this._oFactory.destroy();
		}

		var oControl = this._oControl;

		// destroy only inactive control
		// active control will be destroyed via content aggregation
		if (oControl) {

			if (oControl.current === "edit") {
				oInactiveInnerControl = oControl["display"] || oControl["display_uom"];
			} else {
				oInactiveInnerControl = oControl["edit"];
			}

			// content can be null for performance reasons => destroy control here
			if (oControl[oControl.current] && !oControl[oControl.current].getParent()) {
				oControl[oControl.current].destroy();
			}
		}

		if (oInactiveInnerControl && (typeof oInactiveInnerControl.destroy === "function")) {
			oInactiveInnerControl.destroy();
		}

		this._oUtil = null;
		this._oError = null;
		this._oValue = null;
		this._oFactory = null;
		this._oControl = null;
		this._oValueBind = null;
		this._oSideEffects = null;
		this._sBindingContextPath = "";

		this.detachEvent("innerControlsCreated",SmartField.prototype._setOnInnerControl,this);//inner controls not ready wait for creation
	};

	/**
	 * Calculates the paths to the annotations used by the <code>SmartField</code> control.
	 *
	 * @param {sap.ui.model.odata.ODataMetaModel} oMetaModel The given OData meta model
	 * @param {object} oEntitySet The given entity set
	 * @param {string} sValueBinding The path identifying the OData property to which the value property of the <code>SmartField</code> is bound
	 * @param {boolean} bNavigationPathsOnly If set to <code>true</code>, no properties are returned
	 * @returns {array} The resulting paths are returned
	 * @public
	 */
	SmartField.getSupportedAnnotationPaths = function(oMetaModel, oEntitySet, sValueBinding, bNavigationPathsOnly) {
		var oConfig,
			oUOM,
			aResult = [],
			oMetaData;

		if (oMetaModel && oEntitySet && sValueBinding) {

			// prepare the meta data.
			oMetaData = {
				entitySet: oEntitySet,
				entityType: oMetaModel.getODataEntityType(oEntitySet.entityType),
				path: sValueBinding
			};

			// get the config.
			oConfig = {
				helper: new ODataHelper(null, null, oMetaModel)
			};

			if (bNavigationPathsOnly) {
				oConfig.navigationPathOnly = bNavigationPathsOnly;
			}

			// complete the meta data.
			oConfig.helper.getProperty(oMetaData);

			// get the annotations from the entity set.
			SmartField._getFromEntitySet(aResult, oMetaData, oConfig);

			// get the annotations from the property.
			SmartField._getFromProperty(aResult, oMetaData, oConfig);

			// get the annotations from a unit of measure.
			oUOM = oConfig.helper.getUnitOfMeasure2(oMetaData);

			if (oUOM) {
				SmartField._getFromProperty(aResult, oUOM, oConfig);
			}

			// destroy the helper class.
			oConfig.helper.destroy();
		}

		return aResult;
	};

	/**
	 * Calculates the paths to the annotations on entity set.
	 *
	 * @param {array} aResult The resulting paths
	 * @param {object} oMetaData The given meta data
	 * @param {object} oMetaData.entitySet The OData entity set definition
	 * @param {object} oMetaData.entityType The OData entity type definition
	 * @param {object} oMetaData.property The OData property definition
	 * @param {object} oConfig The given configuration
	 * @param {sap.ui.comp.smartfield.ODataHelper} oConfig.helper The given helper
	 * @param {boolean} oConfig.navigationPathOnly If set to <code>true</code>, no properties will be returned
	 * @private
	 */
	SmartField._getFromEntitySet = function(aResult, oMetaData, oConfig) {
		var sPath;

		if (oMetaData.entitySet) {
			sPath = oConfig.helper.oAnnotation.getUpdateEntitySetPath(oMetaData.entitySet);
			SmartField._push(sPath, aResult, oMetaData, oConfig);
		}
	};

	/**
	 * Pushes a path, if it is not null.
	 *
	 * @param {string} sPath The given path
	 * @param {array} aResult The resulting paths
	 * @param {object} oMetaData The given meta data
	 * @param {object} oMetaData.entitySet The OData entity set definition
	 * @param {object} oMetaData.entityType The OData entity type definition
	 * @param {object} oMetaData.property The OData property definition
	 * @param {object} oConfig The given configuration
	 * @param {sap.ui.comp.smartfield.ODataHelper} oConfig.helper The given helper
	 * @param {boolean} oConfig.navigationPathOnly If set to <code>true</code>, no properties will be returned
	 * @private
	 */
	SmartField._push = function(sPath, aResult, oMetaData, oConfig) {
		var aPath,
			sPart,
			len,
			sOut,
			oResult = {};

		if (sPath) {
			if (oConfig.navigationPathOnly) {
				aPath = sPath.split("/");
				len = aPath.length;
				oResult.entityType = oMetaData.entityType;

				while (len--) {
					sPart = aPath.shift();

					if (sPart === "") {
						continue;
					}

					oResult = oConfig.helper.getNavigationProperty(oResult.entityType, sPart);

					if (!oResult.entitySet) {
						break;
					}

					if (sOut) {
						sOut = sOut + "/" + sPart;
					} else {
						sOut = sPart;
					}
				}
			} else {
				sOut = sPath;
			}
		}

		if (sOut) {

			if (oMetaData.navigationPath) {
				aResult.push(oMetaData.navigationPath + "/" + sOut);
			} else {
				aResult.push(sOut);
			}
		}
	};

	/**
	 * Calculates the paths to the annotations on property.
	 *
	 * @param {array} aResult The resulting path.
	 * @param {object} oMetaData The given meta data
	 * @param {object} oMetaData.entitySet The OData entity set definition
	 * @param {object} oMetaData.entityType The OData entity type definition
	 * @param {object} oMetaData.property The OData property definition
	 * @param {object} oConfig The given configuration
	 * @param {sap.ui.comp.smartfield.ODataHelper} oConfig.helper The given helper
	 * @param {boolean} oConfig.navigationPathOnly If set to <code>true</code>, no properties will be returned
	 * @private
	 */
	SmartField._getFromProperty = function(aResult, oMetaData, oConfig) {
		var sPath;

		if (oMetaData.property.property) {
			sPath = oConfig.helper.oAnnotation.getText(oMetaData.property.property);
			SmartField._push(sPath, aResult, oMetaData, oConfig);

			sPath = oConfig.helper.oAnnotation.getUnit(oMetaData.property.property);
			SmartField._push(sPath, aResult, oMetaData, oConfig);

			sPath = oConfig.helper.oAnnotation.getFieldControlPath(oMetaData.property.property);
			SmartField._push(sPath, aResult, oMetaData, oConfig);
		}
	};

	SmartField.prototype.addAssociation = function(sAssociationName, sId, bSuppressInvalidate) {

		if (sAssociationName === "ariaLabelledBy") {
			this.getInnerControls().forEach(function(oControl) {

				if (oControl.addAriaLabelledBy) {
					oControl.addAriaLabelledBy(sId);
				}
			});
		}

		return Control.prototype.addAssociation.apply(this, arguments);
	};

	SmartField.prototype.removeAssociation = function(sAssociationName, vObject, bSuppressInvalidate) {
		var sId = Control.prototype.removeAssociation.apply(this, arguments);

		if (sAssociationName === "ariaLabelledBy" && sId) {
			this.getInnerControls().forEach(function(oControl) {
				if (oControl.removeAriaLabelledBy) {
					oControl.removeAriaLabelledBy(sId);
				}
			});
		}

		return sId;
	};

	SmartField.prototype.getAccessibilityInfo = function() {
		var oControl = this.getAggregation("_content");
		return oControl && oControl.getAccessibilityInfo ? oControl.getAccessibilityInfo() : null;
	};

	/*
	 * If SmartFiels is inside of a Form use Forms aria logic for label
	 */
	SmartField.prototype.enhanceAccessibilityState = function(oElement, mAriaProps) {
		var oParent = this.getParent();

		if (oParent && oParent.enhanceAccessibilityState) {
			// use SmartField as control, but aria proprties of rendered inner control.
			oParent.enhanceAccessibilityState(this, mAriaProps);
		}
	};

	/**
	 * Returns the value of the <code>mandatory</code> property if the <code>SmartField</code> is editable.
	 *
	 * This function is needed as the "mandatory" feature is named "required" in a lot of other controls
	 * (like <code>Label</code> or <code>Form</code>).
	 * @returns {boolean} the true if the <code>SmartField</code> should be marked as required
	 * @since 1.48.0
	 * @protected
	 */
	SmartField.prototype.getRequired = function() {

		if (this.getContextEditable() && this.getEditable()) {
			return this.getMandatory();
		} else {
			return false;
		}
	};

	return SmartField;
}, /* bExport= */true);
