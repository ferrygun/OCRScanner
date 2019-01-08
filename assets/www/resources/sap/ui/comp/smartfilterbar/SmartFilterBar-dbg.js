/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides control sap.ui.comp.smartfilterbar.SmartFilterBar.
sap.ui.define([
	'jquery.sap.global', 'sap/m/MessageBox', 'sap/ui/comp/filterbar/FilterBar', 'sap/ui/comp/filterbar/FilterGroupItem', 'sap/ui/comp/filterbar/FilterItem', 'sap/ui/comp/library', './AdditionalConfigurationHelper', './ControlConfiguration', './FilterProvider', './GroupConfiguration', 'sap/ui/comp/smartvariants/PersonalizableInfo', 'sap/ui/comp/smartvariants/SmartVariantManagement', 'sap/ui/comp/odata/ODataModelUtil'
], function(jQuery, MessageBox, FilterBar, FilterGroupItem, FilterItem, library, AdditionalConfigurationHelper, ControlConfiguration, FilterProvider, GroupConfiguration, PersonalizableInfo, SmartVariantManagement, ODataModelUtil) {
	"use strict";

	/**
	 * Constructor for a new smartfilterbar/SmartFilterBar.
	 * @param {string} [sID] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The SmartFilterBar control uses the OData metadata of an entity in order to create a FilterBar.<br>
	 *        Whether a field is visible on the FilterBar, supports type-ahead and value help, for example, is automatically determined. When you use
	 *        control configurations and group configurations it is possible to configure the FilterBar and adapt it according to your needs.<br>
	 *        <b><i>Note:</i></b><br>
	 *        Most of the attributes/properties are not dynamic and cannot be changed once the control has been initialized.
	 * @extends sap.ui.comp.filterbar.FilterBar
	 * @author SAP
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartfilterbar.SmartFilterBar
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var SmartFilterBar = FilterBar.extend("sap.ui.comp.smartfilterbar.SmartFilterBar", /** @lends sap.ui.comp.smartfilterbar.SmartFilterBar.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			designTime: true,
			properties: {

				/**
				 * The OData entity type whose metadata is used to create the SmartFilterBar. <b>Note:</b> Changing this value after the
				 * SmartFilterBar is initialized (<code>initialise</code> event was fired) has no effect.
				 * @deprecated Since 1.40. Use <code>entitySet</code> property instead of this one, to enable V4 annotation support
				 */
				entityType: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},
				/**
				 * The OData entity set whose metadata is used to create the SmartFilterBar. <b>Note:</b> Changing this value after the
				 * SmartFilterBar is initialized (<code>initialise</code> event was fired) has no effect.
				 */
				entitySet: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Optional. The OData service URL. If it is not specified, the service URL from the OData model (this.getModel()) will be used.
				 * <b>Note:</b> Changing this value after the SmartFilterBar is initialized (initialise event was fired) has no effect.
				 * @deprecated Since 1.29. Set an ODataModel as the main model on your control/view instead
				 */
				resourceUri: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Name of the field that is the focus of the basic search.
				 */
				basicSearchFieldName: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Enables the basic search field. The entered value can be accessed with
				 * {@link sap.ui.comp.smartfilterbar.SmartFilterBar#getParameters}. <b>Note:</b> When the SmartFilterBar control is used with a
				 * {@link sap.ui.comp.smarttable.SmartTable} control the parameters are handled automatically. Therefore, this must only be enabled
				 * for OData service entities that support basic search.
				 */
				enableBasicSearch: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * If set the search will be automatically triggered, when a filter value was set via the <B>change</B> event.<br>
				 * <b>Note:</b> The liveMode only operates on non-mobile scenarios.<br>
				 * Additionally, if liveMode is set, the following applies:
				 * <ul>
				 * <li>The error messagebox is not displayed, and the <code>showMessages</code> property is ignored.</li>
				 * <li>The search is triggered after a variant has been selected.</li>
				 * <li>Execute on Select for <code>VariantManagement</code> is not shown and not taken into account</li>
				 * </ul>
				 * @since 1.40
				 */
				liveMode: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * If set to <code>false</code> eventual errors during the search, will not be displayed in a messagebox.
				 * @since 1.40
				 */
				showMessages: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Indicates if the analytical parameters (SelectionVariant) must be taken into consideration.
				 * @experimental since 1.42.0 This property is NOT stable yet. Use at your own risk.
				 * @since 1.42.0
				 */
				considerAnalyticalParameters: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * If set to <code>true</code> all date fields with filter restriction <code>interval</code> will be treated as
				 * <code>DateTimeRange</code> filters. <b>Note:</b> If this property is set to <code>true</code> and any date filters with filter
				 * restriction <code>interval</code> were stored as part of a variant, the values of these filters cannot be applied. If this
				 * property is set to <code>false</code>, any previously stored filters which were treated as type <code>DateTimeRange</code>
				 * based on the former setting, cannot be converted back to the standard date interval.
				 * @since 1.46.0
				 */
				useDateRangeType: {
					type: "boolean",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * If set to <code>true</code> all search requests will be ignored. This functionality is only intended to be used internally to
				 * enable an optimal solution when the filter bar is controlled by the smart templates. NOTE: As long as this property is set to
				 * <code>true</code>, all search requests will be neglected.
				 * @experimental since 1.44.0 This property is NOT stable yet. Use at your own risk.
				 * @since 1.44.0
				 */
				suppressSelection: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Indicates if the annotation <code>com.sap.vocabularies.UI.v1.SelectionVariant</code> is taken into account.
				 * @since 1.48.0
				 */
				considerSelectionVariants: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Determines one specific variant that is based on the <code>com.sap.vocabularies.UI.v1.SelectionVariant</code> annotation, which
				 * is then used as the default variant.<br>
				 * This property is only relevant in case <code>considerSelectionVariants</code> is set to <code>true</code> and will only be
				 * applied if there is no user-defined default variant specified.
				 * @since 1.48.0
				 */
				defaultSelectionVariantName: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * If set to <code>true</code>, only the navigation properties mentioned in property
				 * {@link sap.ui.comp.smartfilterbar.SmartFilterBarl#getNavigationProperties} are checked for further filters.
				 * @since 1.48
				 */
				useProvidedNavigationProperties: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * This property is only evaluated if the property
				 * {@link sap.ui.comp.smartfilterbar.SmartFilterBar#getUseProvidedNavigationProperties} is set to <code>true</code>. It contains a
				 * comma-separated list of navigation property names which are checked for filters.<br>
				 * @since 1.48
				 */
				navigationProperties: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				}
			},

			associations: {
				/**
				 * Identifies the SmartVariant control which should be used for the personalization.
				 * @since 1.38
				 */
				smartVariant: {
					type: "sap.ui.comp.smartvariants.SmartVariantManagement",
					multiple: false
				}
			},

			aggregations: {

				/**
				 * Using control configurations you can add additional configuration to filter fields, for example set custom labels, change the order
				 * of fields, or change the filter field control type. <b>Note:</b> Changing the values here after the SmartFilter is initialized (<code>initialise</code>
				 * event was fired) has no effect.
				 */
				controlConfiguration: {
					type: "sap.ui.comp.smartfilterbar.ControlConfiguration",
					multiple: true,
					singularName: "controlConfiguration"
				},

				/**
				 * Provides the possibility to add additional configuration to groups. Groups are used to show fields in the advanced area of the
				 * SmartFilterBar. With additional configuration, you can for example set custom labels or change the order of groups. <b>Note:</b>
				 * Changing the values here after the SmartFilter is initialized (<code>initialise</code> event was fired) has no effect.
				 */
				groupConfiguration: {
					type: "sap.ui.comp.smartfilterbar.GroupConfiguration",
					multiple: true,
					singularName: "groupConfiguration"
				}
			},

			events: {

				/**
				 * This event is fired after the pending state of the <code>FilterBar</code> control changes.
				 * @since 1.36
				 */
				pendingChange: {
					/**
					 * The current pending value.
					 */
					pendingValue: {
						type: "boolean"
					}
				}
			}
		},

		renderer: function(oRm, oControl) {
			FilterBar.getMetadata().getRenderer().render(oRm, oControl);
		}

	});

	SmartFilterBar.LIVE_MODE_INTERVAL = 300;
	SmartFilterBar.SELECTION_VARIANT_KEY_PREFIX = "#";

	/**
	 * Retrieves the currently visible filters and the values for storing them as variants. The result will be passed on as a JSON object to the
	 * callee smart variant control.
	 * @name sap.ui.comp.smartfilterbar.SmartFilterBar#fetchVariant
	 * @function
	 * @type object
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */

	/**
	 * Applies the current variant as opposed to <code>fetchVariant</code>. The variant is retrieved via the flex layer.
	 * @name sap.ui.comp.smartfilterbar.SmartFilterBar#applyVariant
	 * @function
	 * @param {object} oVariant The variant that must be applied. oVariant must contain a valid JSON object.
	 * @type void
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */

	SmartFilterBar.prototype.init = function() {
		this._aFilterBarViewMetadata = null;
		this.isRunningInValueHelpDialog = false;
		FilterBar.prototype.init.apply(this); // Call base class

		sap.ui.getCore().getMessageManager().registerObject(this, true);
	};

	/**
	 * Initialises the OData metadata necessary to create the filter bar
	 * @private
	 */
	SmartFilterBar.prototype._initializeMetadata = function() {
		if (!this.bIsInitialised) {
			ODataModelUtil.handleModelInit(this, this._onMetadataInitialised);
		}
	};

	/**
	 * Called once the necessary Model metadata is available
	 * @private
	 */
	SmartFilterBar.prototype._onMetadataInitialised = function() {
		this._bMetaModelLoadAttached = false;
		if (!this.bIsInitialised) {
			this._createFilterProvider();
			if (this._oFilterProvider) {
				this._aFilterBarViewMetadata = this._oFilterProvider.getFilterBarViewMetadata();
				if (this._aFilterBarViewMetadata) {
					this._attachAdditionalConfigurationChanged();
					// Indicates the control is initialised and can be used in the initialise event/otherwise!
					this.bIsInitialised = true;
					this.setModel(this._oFilterProvider.oModel, this._oFilterProvider.sFilterModelName);

					// required for the new UI-Design
					this.registerGetFiltersWithValues(this.getFiltersWithValues.bind(this));

					// Variant Handling - Registrations
					this.registerFetchData(this.getFilterDataAsString.bind(this, true));
					this.registerApplyData(function(sJson) {
						this.setFilterDataAsString(sJson, true);
					}.bind(this));

					this._initializeVariantManagement();
				}
			}
		}
	};

	/**
	 * Get the filterable fields.
	 * @returns {Array} array of filter view metadata containing filter fields
	 * @internal
	 */
	SmartFilterBar.prototype.getFilterBarViewMetadata = function() {
		return this._aFilterBarViewMetadata;
	};

	/**
	 * Get the analytical parameters
	 * @returns {Array} array of analytical parameter metadata
	 * @internal
	 */
	SmartFilterBar.prototype.getAnalyticalParameters = function() {
		return this._oFilterProvider ? this._oFilterProvider.getAnalyticParameters() : [];
	};

	/**
	 * Get selection variant annotation
	 * @returns {array} of selection variants. Key is the qualifier.
	 * @internal
	 */
	SmartFilterBar.prototype.getSelectionVariants = function() {
		var mSelectionVariants = null;
		if (this._oFilterProvider) {
			mSelectionVariants = this._oFilterProvider.getSelectionVariants();
			if (Object.keys(mSelectionVariants).length < 1) {
				mSelectionVariants = null;
			}
		}

		return mSelectionVariants;

	};

	/**
	 * Creates an instance of the filter provider
	 * @private
	 */
	SmartFilterBar.prototype._createFilterProvider = function() {
		var sResourceUri, oModel, sEntityTypeName, sEntitySet;
		oModel = this.getModel();
		sResourceUri = this.getResourceUri();
		sEntityTypeName = this.getEntityType();
		sEntitySet = this.getEntitySet();

		if ((oModel || sResourceUri) && (sEntityTypeName || sEntitySet)) {
			this._oFilterProvider = new sap.ui.comp.smartfilterbar.FilterProvider({
				basicSearchFieldName: this.getBasicSearchFieldName(),
				enableBasicSearch: this.getEnableBasicSearch(),
				entityType: sEntityTypeName,
				entitySet: sEntitySet,
				serviceUrl: sResourceUri,
				isRunningInValueHelpDialog: this.isRunningInValueHelpDialog,
				model: oModel,
				additionalConfiguration: this.getAdditionalConfiguration(),
				defaultDropDownDisplayBehaviour: this.data("defaultDropDownDisplayBehaviour"),
				defaultTokenDisplayBehaviour: this.data("defaultTokenDisplayBehaviour"),
				dateFormatSettings: this.data("dateFormatSettings"),
				useContainsAsDefaultFilter: this.data("useContainsAsDefaultFilter"),
				smartFilter: this,
				considerAnalyticalParameters: this.getConsiderAnalyticalParameters(),
				useDateRangeType: this.getUseDateRangeType(),
				considerSelectionVariants: this.getConsiderSelectionVariants(),
				considerNavigations: this.getUseProvidedNavigationProperties() ? this._createArrayFromString(this.getNavigationProperties()) : null
			});

			this._oFilterProvider.attachPendingChange(function(oEvent) {
				this.firePendingChange({
					pendingValue: oEvent.getParameter("pending")
				});
			}.bind(this));
		}
	};

	SmartFilterBar.prototype._createArrayFromString = function(sList) {
		if (!sList) {
			return [];
		}
		var aElements = [];
		var aRowElements = sList.split(",");
		aRowElements.forEach(function(sField) {
			if (sField !== "") {
				aElements.push(sField.trim());
			}
		});
		return aElements;
	};

	/**
	 * Attaches to events from the control configuration. For example the visibility of a filter field can be changed dynamically
	 * @private
	 */
	SmartFilterBar.prototype._attachAdditionalConfigurationChanged = function() {
		var aControlConfiguration, aGroupConfiguration, i, length;

		// Group Configuration
		aGroupConfiguration = this.getGroupConfiguration();
		length = aGroupConfiguration.length;
		for (i = 0; i < length; i++) {
			aGroupConfiguration[i].attachChange(this._handleGroupConfigurationChanged.bind(this));
		}

		// Control Configuration
		aControlConfiguration = this.getControlConfiguration();
		length = aControlConfiguration.length;
		for (i = 0; i < length; i++) {
			aControlConfiguration[i].attachChange(this._handleControlConfigurationChanged.bind(this));
		}
	};

	/**
	 * Event Handler for changed events from control configuration
	 * @private
	 * @param {Object} oEvent - then event object
	 */
	SmartFilterBar.prototype._handleControlConfigurationChanged = function(oEvent) {
		var sPropertyName, oControlConfiguration, oFilterItem, sKey, sValue;

		sPropertyName = oEvent.getParameter("propertyName");
		oControlConfiguration = oEvent.oSource;

		if (!oControlConfiguration) {
			return;
		}

		sKey = oControlConfiguration.getKey();
		oFilterItem = this._getFilterItemByName(sKey);
		if (!oFilterItem) {
			this._handleControlConfigurationChangedForDelayedFilterItems(sKey, oControlConfiguration, sPropertyName);
			return;
		}

		if (sPropertyName === "visible") {
			sValue = oControlConfiguration.getVisible();
			oFilterItem.setVisible(sValue);
		} else if (sPropertyName === "label") {
			sValue = oControlConfiguration.getLabel();
			oFilterItem.setLabel(sValue);
		} else if (sPropertyName === "visibleInAdvancedArea") {
			sValue = oControlConfiguration.getVisibleInAdvancedArea();
			if (oFilterItem.setVisibleInAdvancedArea) {
				oFilterItem.setVisibleInAdvancedArea(sValue);
			}
		}
	};

	SmartFilterBar.prototype._handleControlConfigurationChangedForDelayedFilterItems = function(sKey, oControlConfiguration, sPropertyName) {
		var sValue, oField = null;
		if (this._aFilterBarViewMetadata) {
			this._aFilterBarViewMetadata.some(function(oGroup) {
				oGroup.fields.some(function(oItem) {
					if (oItem.fieldName === sKey) {
						oField = oItem;
					}

					return oField ? true : false;
				});

				return oField ? true : false;
			});
		}

		if (oField) {
			if (sPropertyName === "visible") {
				sValue = oControlConfiguration.getVisible();
				oField.isVisible = sValue;
			} else if (sPropertyName === "label") {
				sValue = oControlConfiguration.getLabel();
				oField.label = sValue;
			} else if (sPropertyName === "visibleInAdvancedArea") {
				sValue = oControlConfiguration.getVisibleInAdvancedArea();
				oField.visibleInAdvancedArea = sValue;
			}
		}
	};

	/**
	 * Event Handler for changed events from control configuration
	 * @private
	 * @param {Object} oEvent - then event object
	 */
	SmartFilterBar.prototype._handleGroupConfigurationChanged = function(oEvent) {
		var sPropertyName, oGroupConfiguration;

		sPropertyName = oEvent.getParameter("propertyName");
		oGroupConfiguration = oEvent.oSource;
		if (sPropertyName === "label") {
			this._handleGroupConfigurationLabelChanged(oGroupConfiguration);
		}
	};

	/**
	 * Handle the event of a changed label of a group configuration. Find the corresponding FilterGroupItem and sets its label accordingly.
	 * @private
	 * @param {object} oGroupConfiguration - GroupConfiguration where the label as changed
	 */
	SmartFilterBar.prototype._handleGroupConfigurationLabelChanged = function(oGroupConfiguration) {
		var oFilterGroupItem, sKey, sLabel;

		if (!oGroupConfiguration) {
			return;
		}

		sLabel = oGroupConfiguration.getLabel();
		sKey = oGroupConfiguration.getKey();
		oFilterGroupItem = this._getFilterGroupItemByGroupName(sKey);
		if (oFilterGroupItem) {
			oFilterGroupItem.setGroupTitle(sLabel);
		} else {
			this._handleGroupConfigurationLabelChangedForDelayedFilterItems(sKey, sLabel);
		}
	};

	SmartFilterBar.prototype._handleGroupConfigurationLabelChangedForDelayedFilterItems = function(sKey, sLabel) {
		var oGroup = null;
		if (this._aFilterBarViewMetadata) {
			this._aFilterBarViewMetadata.some(function(oItem) {

				if (oItem.groupName === sKey) {
					oGroup = oItem;
				}

				return oGroup ? true : false;
			});
		}

		if (oGroup) {
			oGroup.groupLabel = sLabel;
		}
	};

	/**
	 * Returns a filter item or filter group item having the specified name. Returns undefined if there are no filter items or filter group items
	 * having the specified name.
	 * @private
	 * @param {string} sName of the filter
	 * @returns {object} the found filter item
	 */
	SmartFilterBar.prototype._getFilterItemByName = function(sName) {
		return this.determineFilterItemByName(sName);
	};

	/**
	 * Returns a filter group item having the specified group name. Returns undefined if there is no filter group items having the specified name.
	 * @private
	 * @param {string} sName filter group name
	 * @returns {object} the found group item
	 */
	SmartFilterBar.prototype._getFilterGroupItemByGroupName = function(sName) {
		return this.determineFilterItemByName(sName);
	};

	/**
	 * Returns an Object containing all information from the additional configuration (controlConfiguration, groupConfiguration).
	 * @returns {object} the additional configuration
	 * @internal
	 */
	SmartFilterBar.prototype.getAdditionalConfiguration = function() {
		return new AdditionalConfigurationHelper(this.getControlConfiguration(), this.getGroupConfiguration());
	};

	SmartFilterBar.prototype.setEntityType = function(sEntityTypeName) {
		this.setProperty("entityType", sEntityTypeName);
		this._initializeMetadata();
		return this;
	};

	/**
	 * Uses the provided resource URI to fetch the OData metadata instead of using the default ODataModel (getModel()). You should only set this if
	 * you intend to get the metadata for the filter bar from elsewhere!
	 * @param {string} sResourceUri - The URI of the oData service from which the metadata would be read
	 * @returns {sap.ui.comp.smartfilterbar.SmartFilterBar} <code>this</code> to allow method chaining
	 * @deprecated Since 1.29. Set an ODataModel as the main model on your control/view instead
	 * @public
	 */
	SmartFilterBar.prototype.setResourceUri = function(sResourceUri) {
		this.setProperty("resourceUri", sResourceUri);
		this._initializeMetadata();
		return this;
	};

	/**
	 * It could happen that the entity type information is set already in the view, but there is no model attached yet. This method is called once the
	 * model is set on the parent and can be used to initialise the metadata, from the model, and finally create the filter controls.
	 * @private
	 */
	SmartFilterBar.prototype.propagateProperties = function() {
		FilterBar.prototype.propagateProperties.apply(this, arguments);
		this._initializeMetadata();
	};

	/**
	 * Provides filter information for lazy instantiation (Overridden from FilterBar)
	 * @private
	 * @returns {array} of filter information
	 */
	SmartFilterBar.prototype._getFilterInformation = function() {
		var oFilterGroup, i, j, iLen = 0, iFieldLen = 0, aFilterFields, aFields = [], oField;
		if (this._aFilterBarViewMetadata) {
			iLen = this._aFilterBarViewMetadata.length;
			for (i = 0; i < iLen; i++) {
				oFilterGroup = this._aFilterBarViewMetadata[i];
				aFilterFields = oFilterGroup.fields;
				iFieldLen = aFilterFields.length;
				for (j = 0; j < iFieldLen; j++) {
					oField = aFilterFields[j];
					if (oField.name === FilterProvider.BASIC_SEARCH_FIELD_ID) {
						this.setBasicSearch(oField.control);
						this._attachToBasicSearch(oField.control);
						continue;
					} else if (oFilterGroup.groupName === FilterProvider.BASIC_FILTER_AREA_ID) {
						// this._createFieldInBasicArea(oField);
						this._createFieldInAdvancedArea({
							groupName: FilterBar.INTERNAL_GROUP,
							groupLabel: ""
						}, oField);

					} else {
						this._createFieldInAdvancedArea(oFilterGroup, oField);
					}
					aFields.push(oField);
				}
			}

			var aParameters = this.getAnalyticalParameters();
			iLen = aParameters.length;
			for (i = 0; i < iLen; i++) {
				oField = aParameters[i];
				this._createAnalyticParameter(oField);
				aFields.push(oField);
			}
		}
		return aFields;
	};

	/**
	 * Check if any controls are in error state or if search has to be prevented and return a flag, if search can continue
	 * @private
	 * @returns {Boolean} true when there are no errors or when search is not pending
	 */
	SmartFilterBar.prototype._validateState = function() {
		var aFilterItems = null, iLen, oControl, bInError = false;
		aFilterItems = this.getAllFilterItems(true);
		if (aFilterItems) {
			iLen = aFilterItems.length;
			while (iLen--) {
				oControl = this.determineControlByFilterItem(aFilterItems[iLen], true);
				if (oControl) {
					if (oControl.__bValidatingToken) {
						// If a token validation is pending hold back the search until validation is through
						this.bIsSearchPending = true;
						// Set dummy error flag to prevent search
						bInError = true;
						break;
					} else if (oControl.getValueState && oControl.getValueState() === sap.ui.core.ValueState.Error && !oControl.data("__mandatoryEmpty")) {
						bInError = true;
						break;
					}
				}
			}
		}
		if (this._oFilterProvider) {
			return !bInError && !this._oFilterProvider._validateConditionTypeFields();
		} else {
			return !bInError;
		}
	};

	SmartFilterBar.prototype._isDateRangeTypeFilter = function(sFilterName) {
		if (this._oFilterProvider && this._oFilterProvider._mConditionTypeFields[sFilterName]) {
			return true;
		}

		return false;
	};

	SmartFilterBar.prototype._specialControls = function(oControl, sFilterName) {
		if (oControl.setValue) {

			if (this._isDateRangeTypeFilter(sFilterName)) {
				return true;
			} else {
				jQuery.sap.require("sap.m.DatePicker");
				if (oControl instanceof sap.m.DatePicker) {
					return true;
				}
			}
		}

		return false;
	};

	/**
	 * For every control in error state, trigger <code>checkUpdate(true)</code>
	 * @private
	 */
	SmartFilterBar.prototype._clearErroneusControlValues = function() {
		var aFilterItems = null, iLen, oControl, oValueBinding;
		aFilterItems = this.getAllFilterItems(true);
		if (aFilterItems) {
			iLen = aFilterItems.length;
			while (iLen--) {
				oControl = this.determineControlByFilterItem(aFilterItems[iLen], true);
				if (oControl) {
					if (oControl.getValueState && oControl.getValueState() === sap.ui.core.ValueState.Error) {

						oValueBinding = oControl.getBinding("value");
						if (oValueBinding && !this._specialControls(oControl, aFilterItems[iLen].getName())) {
							oValueBinding.checkUpdate(true);
						} else if (oControl.setValue) {
							oControl.setValue("");
							oControl.setValueState(sap.ui.core.ValueState.None);
						}

					}
				}
			}
		}

	};

	/**
	 * Handling of change and search for Basic Search field (used in value helps)
	 * @private
	 * @param {Object} oBasicSearchControl the basic search control
	 */
	SmartFilterBar.prototype._attachToBasicSearch = function(oBasicSearchControl) {

		if (oBasicSearchControl) {
			oBasicSearchControl.attachSearch(function() {
				if (!this.isDialogOpen()) {
					this.search();
				}
			}.bind(this));

			// Basic search doesn't have a change event, so we attach to live change instead!
			oBasicSearchControl.attachLiveChange(this._onChange.bind(this));
		}
	};

	/**
	 * Called when change need to be triggered on the Smart Filter
	 * @private
	 * @param {Object} oEvent - then event object
	 */
	SmartFilterBar.prototype._onChange = function(oEvent) {
		var oControl = oEvent.getSource();
		// Clear mandatory empty error state and flag, when control value changes
		if (oControl.data("__mandatoryEmpty")) {
			oControl.data("__mandatoryEmpty", null);
			oControl.setValueState(sap.ui.core.ValueState.None);
		}
		// Clear validation error when no value is in the input
		if (oControl.data("__validationError") && !oControl.getValue()) {
			oControl.data("__validationError", null);
			oControl.setValueState(sap.ui.core.ValueState.None);
		}
		// Don't fire change event while the filter data is being created/updated!
		if (this._oFilterProvider._bUpdatingFilterData || this._oFilterProvider._bCreatingInitialModel) {
			return;
		}
		// If the token is being validated do not trigger the change event!
		if (!oControl || (oControl && !oControl.__bValidatingToken)) {
			this.fireFilterChange(oEvent);
			this._oFilterProvider._updateConditionTypeFields(oEvent.getParameter("filterChangeReason"));
		} else {
			this._filterSetInErrorState(oControl);
		}

		if (this.isLiveMode()) {
			this.search();
		}
	};

	/**
	 * Listen to the change event to set the search button state and raise an event
	 * @param {object} oControl - the control on which change would be triggered
	 * @private
	 */
	SmartFilterBar.prototype._handleChange = function(oControl) {
		if (oControl) {
			if (oControl.attachChange) {
				oControl.attachChange(this._onChange.bind(this));
			}
		}
	};

	/**
	 * Handles the enter event on the control to trigger Search
	 * @param {object} oControl - the control on which enter has to be handled
	 * @private
	 */
	SmartFilterBar.prototype._handleEnter = function(oControl) {

		/*
		 * do not trigger search in live mode, since it will be triggered via the change event
		 */
		if (this.isLiveMode()) {
			return;
		}

		/*
		 * @Hack: Search should not be triggered while a suggest is in progress (i.e. user presses enter key on the SuggestionList popup). Since the
		 * SuggestionPopup is always closed before the keyup event is raised and we cannot use the keydown event alone, we now listen to both key up
		 * and keydown events and set flags on the control to overcome the issue. Perhaps if sapUI5 provides a new event/does not propagate the keyUp
		 * event/sets a flag we can remove this hack TODO: Clarify this with sapUI5 colleagues.
		 */
		oControl.attachBrowserEvent("keydown", function(e) {
			if (e.which === 13) {
				oControl.__bSuggestInProgress = (oControl._oSuggestionPopup && oControl._oSuggestionPopup.isOpen());
			}
		});
		oControl.attachBrowserEvent("keyup", function(e) {
			if (e.which === 13 && !oControl.__bSuggestInProgress) {
				this.search();
			}
		}.bind(this));
	};

	/**
	 * Creates the control used in the filter item lazily
	 * @private
	 * @param {object} oField filter metadata
	 */
	SmartFilterBar.prototype._createFilterFieldControl = function(oField) {
		if (oField.conditionType) {
			oField.control = oField.conditionType.initializeFilterItem();
		} else if (!oField.control && oField.fCreateControl) {
			oField.fCreateControl(oField);
			delete oField.fCreateControl;
		}
		// The control might already be present e.g. for custom field - so also register for enter & change events!
		this._handleEnter(oField.control);
		this._handleChange(oField.control);
	};

	/**
	 * Creates a new paramater and adds it to the filter bar Basic Area, based on the metadata provided by the FilterProvider
	 * @private
	 * @param {object} oParameter filter metadata
	 * @returns {object} oField filter metadata
	 */
	SmartFilterBar.prototype._createAnalyticParameter = function(oParameter) {
		oParameter.factory = function() {

			this._createFilterFieldControl(oParameter);
			if (!oParameter.control) {
				return;
			}
			var oParamItem = new FilterGroupItem({
				labelTooltip: oParameter.quickInfo,
				// label: oParameter.label,
				name: oParameter.fieldName,
				mandatory: oParameter.isMandatory,
				visible: oParameter.isVisible,
				control: oParameter.control,
				hiddenFilter: false
			});

			this._setLabel(oParamItem, oParameter.label);

			this._addParameter(oParamItem);
		}.bind(this);

		// FilterBar needs this information
		oParameter.groupName = FilterBar.INTERNAL_GROUP;

		return oParameter;
	};

	/**
	 * Creates a new field and adds it to the filter bar into the AdvancedSearchArea, based on the metadata provided by the FilterProvider
	 * @private
	 * @param {object} oFilterGroup metadata
	 * @param {object} oField filter metadata
	 * @returns {object} oField filter metadata
	 */
	SmartFilterBar.prototype._createFieldInAdvancedArea = function(oFilterGroup, oField) {
		oField.factory = function() {

			this._createFilterFieldControl(oField);
			var oFilterGroupItem = new FilterGroupItem({
				labelTooltip: oField.quickInfo,
				// label: oField.label,
				name: oField.fieldName,
				groupName: oFilterGroup.groupName,
				groupTitle: oFilterGroup.groupLabel,
				mandatory: oField.isMandatory,
				visible: oField.isVisible,
				visibleInAdvancedArea: oField.visibleInAdvancedArea || (oFilterGroup.groupName === FilterBar.INTERNAL_GROUP),
				control: oField.control,
				hiddenFilter: oField.hiddenFilter
			});

			if (oField.isCustomFilterField) {
				oFilterGroupItem.data("isCustomField", true);
			}

			this._setLabel(oFilterGroupItem, oField.label);

			this.addFilterGroupItem(oFilterGroupItem);
		}.bind(this);

		// FilterBar needs this information
		oField.groupName = oFilterGroup.groupName;
		oField.groupTitle = oFilterGroup.groupLabel;

		return oField;
	};

	/**
	 * Creates a new field and adds it to the filter bar into the AdvancedSearchArea, based on the metadata provided by the FilterProvider
	 * @private
	 * @param {object} oFilterItem receiving the label text.
	 * @param {string} sLabel the new label text.
	 */
	SmartFilterBar.prototype._setLabel = function(oFilterItem, sLabel) {
		if (sLabel.match(/{@i18n>.+}/gi)) {
			oFilterItem.bindProperty("label", sLabel.substring(1, sLabel.length - 1));
		} else {
			oFilterItem.setLabel(sLabel);
		}
	};

	/**
	 * Ensure the associated ValueHelpProvider is loaded
	 * @param {string} sFieldName is the name of the property from the entity type which is associated with a Value Help.
	 * @public
	 */
	SmartFilterBar.prototype.ensureLoadedValueHelp = function(sFieldName) {

		if (this._oFilterProvider) {
			this._oFilterProvider.getAssociatedValueHelpProviders().some(function(oValueHelpProvider) {
				if (oValueHelpProvider.sFieldName === sFieldName) {
					if (!oValueHelpProvider.bInitialised) {
						oValueHelpProvider.loadAnnotation();
					}
					return true;
				}
			});
		}
	};

	SmartFilterBar.prototype.ensureLoadedValueList = function(sFieldName) {

		if (this._oFilterProvider) {
			this._oFilterProvider.getAssociatedValueListProviders().some(function(oValueListProvider) {
				if (oValueListProvider.sFieldName === sFieldName) {
					if (!oValueListProvider.bInitialised) {
						oValueListProvider.loadAnnotation();
					}
					return true;
				}
			});
		}
	};

	SmartFilterBar.prototype.ensureLoadedValueHelpList = function(sFieldName) {
		this.ensureLoadedValueHelp(sFieldName);
		this.ensureLoadedValueList(sFieldName);
	};

	/**
	 * Returns an array of filters (sap.ui.model.Filter instances), for visible fields, that can be used to restrict the query result from OData.<br>
	 * The result of this method can directly be used during aggregation binding or OData read.
	 * @param {string[]} [aFieldNames] optional array of field names that filters should be returned, if not given all visible filters are returned
	 * @returns {sap.ui.model.Filter[]} array of sap.ui.model.Filter or multi-filters
	 * @public
	 */
	SmartFilterBar.prototype.getFilters = function(aFieldNames) {
		if (!aFieldNames || !aFieldNames.length) {
			aFieldNames = this._getVisibleFieldNames(true);
		}

		return this._oFilterProvider ? this._oFilterProvider.getFilters(aFieldNames) : [];
	};

	/**
	 * Returns a parameter object that can be used to restrict the result of an OData service request if a basic search is performed. <caption>Example
	 * of a returned object:</caption>
	 * 
	 * <pre>
	 * {
	 * 	&quot;custom&quot;: {
	 * 		&quot;search-focus&quot;: &quot;MySearchFocusFieldName&quot;,
	 * 		&quot;search&quot;: &quot;MySearchString&quot;
	 * 	}
	 * }
	 * </pre>
	 * 
	 * These parameters can be handed over as custom parameters, for example, to the {@link sap.ui.model.odata.v2.ODataListBinding}.
	 * @returns {object} A parameter object containing OData query parameters
	 * @public
	 */
	SmartFilterBar.prototype.getParameters = function() {
		return this._oFilterProvider ? this._oFilterProvider.getParameters() : {};
	};

	/**
	 * Returns the binding paths for the analytic paramaters
	 * @experimental since 1.42.0 The API is NOT stable yet. Use at your own risk.
	 * @public
	 * @returns {string} Binding path of the analytical paramaters
	 */
	SmartFilterBar.prototype.getAnalyticBindingPath = function() {
		var sBindingPath = "";
		if (this._oFilterProvider && this.getConsiderAnalyticalParameters()) {
			sBindingPath = this._oFilterProvider.getAnalyticBindingPath();
		}

		return sBindingPath;
	};

	/**
	 * Returns the control (if any) with the specified key (Property name in OData entity). Use just the property name as the key when getting a
	 * control from the basic area. Example: "CompanyCode" & Use "EntityName/GroupName.FieldName" format to get controls from groups.
	 * Example:"Account.CompanyCode"
	 * @param {string} sKey The key as present in the OData property name/control configuration
	 * @returns {object|sap.ui.core.Control} The control in the filter bar, if any
	 * @public
	 */
	SmartFilterBar.prototype.getControlByKey = function(sKey) {
		return this.determineControlByName(sKey);
	};

	/**
	 * Returns an array of visible field names
	 * @private
	 * @param {bool} bIgnoreParameters indicationg if the analytic paramaters should be omitted
	 * @returns {Array} aFieldNames - array of field names
	 */
	SmartFilterBar.prototype._getVisibleFieldNames = function(bIgnoreParameters) {
		var aFieldNames = [], aVisibleFilterItems = this.getAllFilterItems(true), iLen = aVisibleFilterItems.length, oItem;
		iLen = aVisibleFilterItems.length;
		// loop through all the visible filter items and get their names
		while (iLen--) {
			oItem = aVisibleFilterItems[iLen];
			if (oItem) {
				if (bIgnoreParameters && oItem._isParameter()) {
					continue;
				}

				aFieldNames.push(oItem.getName());
			}
		}
		return aFieldNames;
	};

	/**
	 * Returns the data currently set in the filter data model.
	 * @param {boolean} bAllFilterData Also include empty/invisible fields filter data
	 * @returns {object} The JSON data in the filter bar
	 * @public
	 */
	SmartFilterBar.prototype.getFilterData = function(bAllFilterData) {
		var oData = null;
		if (this._oFilterProvider) {
			if (bAllFilterData) {
				oData = this._oFilterProvider.getFilterData();
			} else {
				oData = this._oFilterProvider.getFilledFilterData(this._getVisibleFieldNames());
			}
		}
		return oData;
	};

	/**
	 * checks the value of the custom data
	 * @private
	 * @param {Object} oCustomData custom data
	 * @returns {boolean} has value/or not
	 */
	SmartFilterBar.prototype._checkHasValueData = function(oCustomData) {
		if (oCustomData) {
			if (typeof oCustomData === "boolean") {
				return oCustomData;
			} else if (typeof oCustomData === "string") {
				if (oCustomData.toLowerCase() === "true") {
					return true;
				}
			}
		}

		return false;
	};

	/**
	 * checks if the current filter has a value
	 * @param {Object} oData data as returned by the oData-service
	 * @param {sap.ui.comp.filterbar.FilterItem} oFilterItem representing the filter
	 * @param {sap.ui.core.Control} oControl the control as described by the oFilterItem
	 * @returns {boolean} true if the filter item has a value
	 * @private
	 */
	SmartFilterBar.prototype._checkForValues = function(oData, oFilterItem, oControl) {
		var sValue = null;
		if (oData && oFilterItem && oControl) {
			if (!oFilterItem.data("isCustomField")) {
				// Check if Data exists in the filter model for internal fields
				sValue = oData[oFilterItem.getName()];
			} else {

				var oCustomData = oControl.data("hasValue");
				if ((oCustomData !== undefined) && (oCustomData != null)) {
					return this._checkHasValueData(oCustomData);
				} else {
					/* eslint-disable no-lonely-if */
					if (oControl.getValue) {
						// Check if getValue is present and filled
						sValue = oControl.getValue();
					} else if (oControl.getSelectedKey) { // new mechanism with 1.25. Has to be provided by the custom field
						// Check if getSelectedKey is set
						sValue = oControl.getSelectedKey();
					}
					/* eslint-enable no-lonely-if */
				}
			}
		}

		return sValue ? true : false;
	};

	/**
	 * Returns all filter items
	 * <ul>
	 * <li>Containing a value</li>
	 * <li>With the <code>visible</code> property set to <code>true</code></li>
	 * <li>That are either flagged as <code>partOfCurrentVariant</code> or <code>visibleInFilterBar</code></li>
	 * <li>That are not custom filters</li>
	 * </ul>
	 * Even hidden filters will be considered as long as the mentioned criteria is fullfilled.
	 * @returns {sap.ui.comp.filterbar.FilterGroupItem[]} Filter items containing a value
	 * @public
	 */
	SmartFilterBar.prototype.getFiltersWithValues = function() {
		var aFilterItemsWithValue = [];

		// logic from check _validateMandatoryFields
		var aFilterItems = this.getAllFilterItems(true), oFilterItem, oData = this.getFilterData(), iLen = 0, oControl;
		if (aFilterItems && oData) {
			iLen = aFilterItems.length;
			// Loop through the mandatory field names
			while (iLen--) {
				oFilterItem = aFilterItems[iLen];
				// Get the control from filter item name
				oControl = this.determineControlByFilterItem(oFilterItem, true);
				if (this._checkForValues(oData, oFilterItem, oControl)) {
					aFilterItemsWithValue.push(oFilterItem);
				}
			}
		}

		return aFilterItemsWithValue.reverse();
	};

	/**
	 * Returns the data currently set in the filter data model as string.
	 * @param {boolean} bAllFilterData Also include empty/invisible fields filter data
	 * @returns {string} The JSON data string
	 * @public
	 */
	SmartFilterBar.prototype.getFilterDataAsString = function(bAllFilterData) {
		var oData = null;
		if (this._oFilterProvider) {
			if (bAllFilterData) {
				oData = this._oFilterProvider.getFilterDataAsString();
			} else {
				oData = this._oFilterProvider.getFilledFilterDataAsString(this._getVisibleFieldNames());
			}
		}
		return oData;
	};

	/**
	 * Sets the data in the filter data model. The follow-on filterChange event is only triggered when none _CUSTOM data is set.
	 * @param {object} oJson The JSON data in the filter bar
	 * @param {boolean} bReplace Replace existing filter data
	 * @public
	 */
	SmartFilterBar.prototype.setFilterData = function(oJson, bReplace) {
		if (this._oFilterProvider) {
			this._oFilterProvider.setFilterData(oJson, bReplace);
		}

		if (oJson && (Object.keys(oJson).length === 1) && oJson._CUSTOM) {
			// in case only _CUSTOM information is available do not trigger filterChange-event
			return;
		}

		// The internal controls do not fire change event in this scenario
		// So, we fire it manually once here
		this.fireFilterChange({
			afterFilterDataUpdate: true
		});
	};

	/**
	 * Sets the data in the filter data model as string.
	 * @param {string} sJson The JSON data in the filter bar
	 * @param {boolean} bReplace Replace existing filter data
	 * @public
	 */
	SmartFilterBar.prototype.setFilterDataAsString = function(sJson, bReplace) {
		if (sJson) {
			this.setFilterData(JSON.parse(sJson), bReplace);
		}
	};

	/**
	 * Overwrites method from base class. Called when user clicks the clear button of the FilterBar. Clears all filter fields and fires clear event.
	 * @private
	 */
	SmartFilterBar.prototype.fireClear = function() {
		this._clearFilterFields();
		this.fireEvent("clear", arguments);
	};

	/**
	 * Clears the values of all filter fields. Applies default values if applicable.
	 * @private
	 */
	SmartFilterBar.prototype._clearFilterFields = function() {
		if (this._oFilterProvider) {
			this._oFilterProvider.clear();

			this._clearErroneusControlValues();
		}
		// The internal controls do not fire change event in this scenario
		// So, we fire it manually once here
		this.fireFilterChange({
			afterFilterDataUpdate: true
		});
	};

	/**
	 * Overwrites method from base class. Called when user clicks the reset button of the FilterBar. Clears all filter fields and fires reset event.
	 * @private
	 */
	SmartFilterBar.prototype.fireReset = function() {
		this._resetFilterFields();
		this.fireEvent("reset", arguments);
	};

	/**
	 * Clears the values of all filter fields. Applies default values if applicable.
	 * @private
	 */
	SmartFilterBar.prototype._resetFilterFields = function() {
		if (this._oFilterProvider) {
			this._oFilterProvider.reset();

			this._clearErroneusControlValues();
		}
		// The internal controls do not fire change event in this scenario
		// So, we fire it manually once here
		this.fireFilterChange({
			afterFilterDataUpdate: true
		});
	};

	/**
	 * Triggers a search with the specified timeout or simple in a 0 delayed call - so that, current execution stack is done before the search is
	 * executed
	 * @param {int} iDelay Delay time in milliseconds
	 * @private
	 */
	SmartFilterBar.prototype.triggerSearch = function(iDelay) {

		if (this.getSuppressSelection()) {
			return;
		}

		this._clearDelayedSearch();
		this._iDelayedSearchId = jQuery.sap.delayedCall(iDelay || 0, this, "_search");
	};

	/**
	 * Overwrites method from base class. Called when user clicks the search button of the FilterBar. The search is executed asynchronously per
	 * default, but can be forced to synchronously execution by providing the <code>bSync</code> set to <code>true</code>. Synchronous mode is
	 * only supported for non live mode scenarios. In the synchroneous mode a mandatory check prior to the search execution is made.
	 * @public
	 * @param {boolean} bSync Indicates if the search should be triggered synchronously
	 * @returns {boolean|undefined} Indicates if there are validation errors
	 */
	SmartFilterBar.prototype.search = function(bSync) {

		if (this.getSuppressSelection()) {
			return undefined;
		}

		var bLiveMode = this.isLiveMode();

		if (bSync && !bLiveMode) {
			return this._search();
		} else {
			this.triggerSearch(bLiveMode ? SmartFilterBar.LIVE_MODE_INTERVAL : 0);
		}
		return true;
	};

	/**
	 * Executes the search.
	 * @private
	 * @returns {boolean | undefined} <code>true</code> indicates that there are no validation problems.
	 */
	SmartFilterBar.prototype._search = function() {
		var parameter = [], oObj = {}, bContinue = true, bInValidationError = false, sErrorMessage;

		// First check for validation errors or if search should be prevented
		var oIsSearchAllowed = this.verifySearchAllowed();
		if (oIsSearchAllowed.hasOwnProperty("pending")) {
			// if search is pending.. do nothing
			return undefined;
		} else if (oIsSearchAllowed.hasOwnProperty("error")) {
			// validation errors exist
			bContinue = false;
			bInValidationError = true;
		} else if (oIsSearchAllowed.hasOwnProperty("mandatory")) {
			// empty mandatory filters
			bContinue = false;
		}

		if (this.isPending() && !this._bIsPendingChangeAttached) {
			var fnHandler = function(oEvent) {
				if (oEvent.getParameter("pendingValue") === false) {
					this.detachPendingChange(fnHandler);
					this._bIsPendingChangeAttached = false;
					this._search();
				}
			}.bind(this);
			this._bIsPendingChangeAttached = true;
			this.attachPendingChange(fnHandler);
			return undefined;
		}

		// clear eventual delayed search
		this._clearDelayedSearch();

		if (bContinue) {
			oObj.selectionSet = this._retrieveCurrentSelectionSet(false, true);
			parameter.push(oObj);
			this.fireSearch(parameter);
		} else {
			if (!this._oResourceBundle) {
				this._oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp");
			}

			if (!bInValidationError) {
				if (!this._sMandatoryErrorMessage) {
					this._sMandatoryErrorMessage = this._oResourceBundle.getText("EMPTY_MANDATORY_MESSAGE");
				}
				sErrorMessage = this._sMandatoryErrorMessage;
			} else {
				if (!this._sValidationErrorMessage) {
					this._sValidationErrorMessage = this._oResourceBundle.getText("VALIDATION_ERROR_MESSAGE");
				}
				sErrorMessage = this._sValidationErrorMessage;
			}

			if (this.getShowMessages() && !this.getLiveMode()) {
				try {

					this._activateMainContent();
					MessageBox.error(sErrorMessage, {
						styleClass: (this.$() && this.$().closest(".sapUiSizeCompact").length) ? "sapUiSizeCompact" : "",
						onClose: this._setFocusOnFirstErroneousField.bind(this)
					});
				} catch (x) {
					return undefined;
				}
			} else {
				this._setFocusOnFirstErroneousField();
				jQuery.sap.log.warning("search was not triggered. " + sErrorMessage);
			}

			// Opens the more area if error message is shown and if empty mandatory fields are present in the advanced filter area!
			if (this._bExpandAdvancedFilterArea && this.rerenderFilters) {
				this.rerenderFilters(true);
			}
		}
		return bContinue;
	};

	/**
	 * Verify if all mandatory filters or parameters have values.
	 * @public
	 * @returns {boolean} true indicates that all mandatory filters and parameters have values.
	 */
	SmartFilterBar.prototype.validateMandatoryFields = function() {
		return this._validateMandatoryFields();
	};

	/**
	 * Verifies if search is possible.
	 * @public
	 * @returns {object} an empty object indicates that all is fine and the search can be triggered. an object with the property mandatory indicates
	 *          that some mandatory filters or parameters are empty an object with the property pending indicates that a token validation is going on.
	 *          an object with the property error indicates that some filters or parameters are in error state.
	 */
	SmartFilterBar.prototype.verifySearchAllowed = function() {

		delete this.bIsSearchPending;
		// First check for validation errors or if search should be prevented
		if (this._validateState()) {
			if (this.validateMandatoryFields()) {
				return {};
			}

			return {
				mandatory: true
			};
		}
		if (this.bIsSearchPending) {
			return {
				pending: true
			};
		}

		return {
			error: true
		};

	};

	/**
	 * Sets focus on the first field having an error message
	 * @private
	 */
	SmartFilterBar.prototype._setFocusOnFirstErroneousField = function() {
		var aFilterItems = null, iLen, oControl, i;
		aFilterItems = this.getAllFilterItems(true);
		if (aFilterItems) {
			iLen = aFilterItems.length;
			for (i = 0; i < iLen; i++) {
				oControl = this.determineControlByFilterItem(aFilterItems[i], true);
				if (oControl && oControl.getValueState && oControl.getValueState() === sap.ui.core.ValueState.Error) {
					jQuery.sap.delayedCall(0, oControl, "focus");
					break;
				}
			}
		}
	};

	SmartFilterBar.prototype.setLiveMode = function(bFlag) {
		if (!this._isPhone()) {
			if (bFlag) {
				this.hideGoButton();
			} else {
				this.restoreGoButton();
			}
		}

		if (this._oSmartVariantManagement) {
			if (bFlag) {

				if (this._bShowShareState === undefined) {
					this._bShowShareState = this._oSmartVariantManagement.getShowExecuteOnSelection();
				}

				this._oSmartVariantManagement.setShowExecuteOnSelection(false);
			} else if (this._bShowShareState !== undefined) {
				this._oSmartVariantManagement.setShowExecuteOnSelection(this._bShowShareState);
			}
		}

		this.setProperty("liveMode", bFlag);
		return this;
	};

	SmartFilterBar.prototype.isLiveMode = function() {
		if (this._isPhone()) {
			return false;
		}

		return this.getLiveMode();
	};

	SmartFilterBar.prototype._clearDelayedSearch = function() {
		if (this._iDelayedSearchId) {
			jQuery.sap.clearDelayedCall(this._iDelayedSearchId);
			this._iDelayedSearchId = null;
		}
	};

	/**
	 * Checks the pending state of the FilterBar control
	 * @public
	 * @returns {boolean} true if at least one FilterItem element of the FilterBar control is pending
	 */
	SmartFilterBar.prototype.isPending = function() {
		if (!this._oFilterProvider) {
			return false;
		}
		return this._oFilterProvider.isPending();
	};

	/**
	 * Checks if the values of all mandatory filter fields are filled and returns true if they are; else returns false. If no fields and data exist
	 * true is returned! ErrorMessage/ErrorState is set on the fields accordingly.
	 * @private
	 * @returns {boolean} true when no errors exist
	 */
	SmartFilterBar.prototype._validateMandatoryFields = function() {
		var bFilled = true, aFilterItems = this.determineMandatoryFilterItems(), oFilterItem, oData = this.getFilterData(), iLen = 0, oControl;
		this._bExpandAdvancedFilterArea = false;
		if (aFilterItems && oData) {
			iLen = aFilterItems.length;
			// Loop through the mandatory field names
			while (iLen--) {
				oFilterItem = aFilterItems[iLen];

				// sField = oFilterItem.getName();
				// Get the control from filter item name
				oControl = this.determineControlByFilterItem(oFilterItem, true);
				if (oControl && oControl.setValueState) {

					if (this._checkForValues(oData, oFilterItem, oControl)) {
						// Clear error state only if it was set due to mandatory check
						if (oControl.data("__mandatoryEmpty")) {
							oControl.data("__mandatoryEmpty", null);
							oControl.setValueState(sap.ui.core.ValueState.None);
						}
					} else {
						bFilled = false;
						// If field has a value property and it is empty --> show error
						oControl.setValueState(sap.ui.core.ValueState.Error);
						// set flag if error state was set due to mandatory check
						oControl.data("__mandatoryEmpty", true);
						// GroupName method exists only on FilterGroupItem --> part of advanced filter area
						if (oFilterItem.getGroupName) {
							this._bExpandAdvancedFilterArea = true; // !!!! TODO: expand the filter area
						}
					}
				}
			}
		}
		return bFilled;
	};

	SmartFilterBar.prototype._setSmartVariant = function(sSmartVariant) {
		if (sSmartVariant) {
			var oSmartVariantControl = sap.ui.getCore().byId(sSmartVariant);
			if (oSmartVariantControl) {
				if (oSmartVariantControl instanceof SmartVariantManagement) {

					if (this._oVariantManagement && !this._oVariantManagement.isPageVariant()) {
						this._replaceVariantManagement(oSmartVariantControl);
						this._oSmartVariantManagement = oSmartVariantControl;
					}

				} else {
					jQuery.sap.log.error("Control with the id=" + sSmartVariant + " not of expected type");
				}
			} else {
				jQuery.sap.log.error("Control with the id=" + sSmartVariant + " not found");
			}
		}
	};

	SmartFilterBar.prototype.setSmartVariant = function(sSmartVariant) {

		if (this.getAdvancedMode()) {
			jQuery.sap.log.error("not supported for the advanced mode");
			return this;
		}

		this.setAssociation("smartVariant", sSmartVariant);
		this._setSmartVariant(sSmartVariant);

		return this;
	};

	SmartFilterBar.prototype.getSmartVariant = function() {

		if (this.getAdvancedMode()) {
			jQuery.sap.log.error("not supported for the advanced mode");
			return null;
		}

		var sSmartVariantId = this.getAssociation("smartVariant");
		if (sSmartVariantId) {
			return sap.ui.getCore().byId(sSmartVariantId);

		}

		return this._oSmartVariantManagement;
	};

	/**
	 * creates the smart variant-management control
	 * @private
	 * @returns {SmartVariantManagement} the newly created variant control
	 */
	SmartFilterBar.prototype._createVariantManagement = function() {

		this._oSmartVariantManagement = null;

		if (this.getAdvancedMode()) {
			return FilterBar.prototype._createVariantManagement.apply(this);
		}

		var sSmartVariant = this.getSmartVariant();
		this._setSmartVariant(sSmartVariant);

		if (!this._oSmartVariantManagement) {

			this._oSmartVariantManagement = new SmartVariantManagement(this.getId() + "-variant", {
				showExecuteOnSelection: true,
				showShare: true
			});
		}

		return this._oSmartVariantManagement;
	};

	/**
	 * initializes the variant management, when the prerequisites are full filled. In this case the initialise-event will be triggered lated, after
	 * the variant management initialization. Triggers the initialise-event immediately, in case the pre-requisits are not full filled
	 * @private
	 */
	SmartFilterBar.prototype._initializeVariantManagement = function() {
		// initialise SmartVariant stuff only if it is necessary! (Ex: has a persistencyKey)
		if (!this.isRunningInValueHelpDialog && this._oSmartVariantManagement && this.getPersistencyKey()) {
			var oPersInfo = new PersonalizableInfo({
				type: "filterBar",
				keyName: "persistencyKey",
				dataSource: this.getEntitySet() || this.getEntityType()
			});
			oPersInfo.setControl(this);

			this._oSmartVariantManagement.addPersonalizableControl(oPersInfo);

			var bValue = this._checkHasValueData(this.data("executeStandardVariantOnSelect"));
			if (bValue) {
				this._oSmartVariantManagement._executeOnSelectForStandardVariantByXML(bValue);
			}

			FilterBar.prototype._initializeVariantManagement.apply(this, arguments);

		} else {

			this.fireInitialise();
			this.fireInitialized();
		}
	};

	SmartFilterBar.prototype.setConsiderSelectionvariants = function(bValue) {
		this.setProperty("considerSelectionVariants", bValue);
	};

	/**
	 * Is called whenever the filter bar is fully initialized. Especially the variant managment control is initialized. Each odata metadata
	 * <code>com.sap.vocabularies.UI.v1.SelectionVariant</code> annotation will be added as a variant item to the <code>VariantManagement</code>
	 * control. The key is the qualifier and is prefixed with a dedicated constant.
	 * @private
	 */
	SmartFilterBar.prototype.fireInitialized = function() {

		if (!this.isRunningInValueHelpDialog && this.getPersistencyKey() && this.getConsiderSelectionVariants() && this._oSmartVariantManagement && this._oSmartVariantManagement.getEnabled()) {
			try {

				if (!this._oSmartVariantManagement.isPageVariant()) {
					this._prepareSelectionVariants();
				}
			} finally {
				//
			}
		}

		FilterBar.prototype.fireInitialized.apply(this, arguments);
	};

	SmartFilterBar.prototype._prepareSelectionVariants = function() {
		var aSelectionVariants, oVariantItem, sDefaultKey, sKeyPrefix = SmartFilterBar.SELECTION_VARIANT_KEY_PREFIX, bNewStandard = false, aVariantKeys = [];

		aSelectionVariants = this.getSelectionVariants();
		if (aSelectionVariants) {

			this._oSmartVariantManagement.registerSelectionVariantHandler({
				callback: this.getSelectionVariant,
				handler: this
			}, sKeyPrefix);

			sap.ui.require("sap.ui.comp.variants.VariantItem");
			aSelectionVariants.forEach(function(oSelectionVariant) {
				var sVariantKey = sKeyPrefix + oSelectionVariant.qualifier;
				if (oSelectionVariant.qualifier) {
					oVariantItem = new sap.ui.comp.variants.VariantItem({
						key: sVariantKey,
						text: oSelectionVariant.annotation.Text.String,
						global: true,
						executeOnSelection: false,
						lifecycleTransportId: "",
						lifecyclePackage: "",
						namespace: "",
						readOnly: true,
						labelReadOnly: true,
						author: ""
					});

					this._oSmartVariantManagement.insertVariantItem(oVariantItem, 0);

					aVariantKeys.push(sVariantKey);
				} else {
					bNewStandard = this._defaultSelectionVariantHandling(oSelectionVariant);
				}

			}.bind(this));

			if (!this._oSmartVariantManagement._getDefaultVariantKey()) {
				if (this.getDefaultSelectionVariantName()) {
					sDefaultKey = sKeyPrefix + this.getDefaultSelectionVariantName();
					this._oSmartVariantManagement.setInitialSelectionKey(sDefaultKey);
					this._oSmartVariantManagement.fireSelect({
						key: sDefaultKey
					});
				} else if (bNewStandard) {
					this._oSmartVariantManagement.fireSelect({
						key: this._oSmartVariantManagement.STANDARDVARIANTKEY
					});
				}
			}

			this._oSmartVariantManagement.applyDefaultFavorites(aVariantKeys, true);
		}
	};

	SmartFilterBar.prototype._defaultSelectionVariantHandling = function(oSelectionVariant) {
		var oVariantContent = null;

		if (!this._oSmartVariantManagement) {
			return false;
		}

		if (this._oSmartVariantManagement._sAppStandardVariantKey) {
			return false;
		}

		if (oSelectionVariant && oSelectionVariant.annotation) {
			oVariantContent = this.convertSelectionVariantToInternalVariant(oSelectionVariant.annotation);

			if (oVariantContent) {

				if (!this._oSmartVariantManagement.isPageVariant()) {
					oVariantContent.version = "V1";

					var oFilterData = JSON.parse(oVariantContent.filterBarVariant);

					if (this._oSmartVariantManagement._oStandardVariant) {

						var oStandardFilterData = JSON.parse(this._oSmartVariantManagement._oStandardVariant.filterBarVariant);

						if (oStandardFilterData._CUSTOM) {

							oFilterData._CUSTOM = oStandardFilterData._CUSTOM;
							// oFilterData._CUSTOM = [];
							// jQuery.extend(true, oFilterData._CUSTOM, oCustomdata);

							oVariantContent.filterBarVariant = JSON.stringify(oFilterData);
						}

						// oVariantContent.filterbar = this._adaptFilterVisibilityProperties(oFilterData);

					}

					this._oSmartVariantManagement._oStandardVariant = oVariantContent;

					return true;
				}
			}
		}

		return false;
	};

	SmartFilterBar.prototype._adaptFilterVisibilityProperties = function(oFilterData) {
		var bFound, sEntry = null, aFilters = [];

		if (this._oSmartVariantManagement && this._oSmartVariantManagement._oStandardVariant && this._oSmartVariantManagement._oStandardVariant.filterbar) {
			jQuery.extend(true, aFilters, this._oSmartVariantManagement._oStandardVariant.filterbar);
		}

		for (sEntry in oFilterData) {
			bFound = false;
			/* eslint-disable no-loop-func */
			aFilters.some(function(oFilter) {
				if (oFilter.name === sEntry) {
					bFound = true;
					oFilter.partOfCurrentVariant = true;
				}
				return bFound;
			});
			/* eslint-enable no-loop-func */
			if (!bFound) {
				aFilters.push({
					group: this._determineGroupNameByName(sEntry),
					name: sEntry,
					partOfCurrentVariant: true,
					visibleInFilterBar: false,
					visible: true
				});
			}
		}

		return aFilters;

	};

	/**
	 * Returns a selection variant, which is based on odata metadata <code>com.sap.vocabularies.UI.v1.SelectionVariant</code> annotation.
	 * @private
	 * @param {string} sKeyWithPrefix for the variant key.
	 * @param {string} sContext for late usage.
	 * @returns {object} the variant object.
	 */
	SmartFilterBar.prototype.getSelectionVariant = function(sKeyWithPrefix, sContext) {
		var oVariantContent = null, oSelectionVariant = null, sKey = sKeyWithPrefix.substring(SmartFilterBar.SELECTION_VARIANT_KEY_PREFIX.length);

		this.getSelectionVariants().some(function(oItem) {
			if (oItem.qualifier === sKey) {
				oSelectionVariant = oItem;
				return true;
			}

			return false;
		});

		if (oSelectionVariant) {
			if (oSelectionVariant.variantContent) {
				oVariantContent = oSelectionVariant.variantContent;
			} else {
				oVariantContent = this.convertSelectionVariantToInternalVariant(oSelectionVariant.annotation);
				oSelectionVariant.variantContent = oVariantContent;
			}
		}

		return oVariantContent;
	};

	/**
	 * Converts a specific <code>com.sap.vocabularies.UI.v1.SelectionVariant</code> annotation, to the internal variant format.
	 * @private
	 * @param {object} oSelectionVariant the content of a odata metadata selection variant.
	 * @returns {json} the internal variant content.
	 */
	SmartFilterBar.prototype.convertSelectionVariantToInternalVariant = function(oSelectionVariant) {

		sap.ui.require("sap.ui.model.odata.AnnotationHelper");
		sap.ui.require("sap.ui.model.Context");
		sap.ui.require("sap.ui.comp.filterbar.VariantConverterFrom");

		// Simple cloning the object
		var sSelectionVariant = JSON.stringify(oSelectionVariant), oContent = JSON.parse(sSelectionVariant), oVariantContent = {}, oPayload = {};
		var oDummyContext = new sap.ui.model.Context(null, "/"), oSelectOptions = oContent.SelectOptions, oParameters = oContent.Parameters, oConverter;

		if (oSelectOptions) {
			oSelectOptions.forEach(function(selectOption) {
				selectOption.PropertyName = selectOption.PropertyName.PropertyPath;
				selectOption.Ranges.forEach(function(range) {
					range.Sign = range.Sign.EnumMember.split("/")[1];
					range.Option = range.Option.EnumMember.split("/")[1];
					// AnnotationHelper can do the conversion
					range.Low = range.Low && sap.ui.model.odata.AnnotationHelper.format(oDummyContext, range.Low) || null;
					range.High = range.High && sap.ui.model.odata.AnnotationHelper.format(oDummyContext, range.High) || null;
				});
			});
		}

		if (oParameters) {
			oParameters.forEach(function(parameter) {
				parameter.PropertyName = parameter.PropertyName.PropertyPath.split("/")[1] || parameter.PropertyName.PropertyPath;
				parameter.PropertyValue = sap.ui.model.odata.AnnotationHelper.format(oDummyContext, parameter.PropertyValue) || null;
			});
		}

		oConverter = new sap.ui.comp.filterbar.VariantConverterFrom();
		oVariantContent = oConverter.convert(JSON.stringify(oContent), this);
		oPayload = JSON.parse(oVariantContent.payload);

		if (this._oSmartVariantManagement.isPageVariant()) {

			oVariantContent[this.getPersistencyKey()] = {
				"version": "V2", // V2 merges aka delta logic, V1 overwrites
				"filterbar": this._adaptFilterVisibilityProperties(oPayload),
				"filterBarVariant": JSON.stringify(oPayload)
			};
		} else {
			oVariantContent = {
				"version": "V2", // V2 merges aka delta logic, V1 overwrites
				"filterbar": this._adaptFilterVisibilityProperties(oPayload),
				"filterBarVariant": JSON.stringify(oPayload)
			};
		}

		return oVariantContent;
	};

	/**
	 * Returns an instance of the control for the basic search.
	 * @returns {object} Basic search control
	 * @public
	 */
	SmartFilterBar.prototype.getBasicSearchControl = function() {
		return sap.ui.getCore().byId(this.getBasicSearch());
	};

	/**
	 * Searches for the filter field having the specified OData key and adds this filter field to the advanced area. If there is no corresponding
	 * field in the OData metadata, this method has no effect.
	 * @param {string} sKey The key like specified in the OData metadata
	 * @public
	 */
	SmartFilterBar.prototype.addFieldToAdvancedArea = function(sKey) {
		var oFilterItem;
		oFilterItem = this._getFilterItemByName(sKey);
		if (oFilterItem && oFilterItem.setVisibleInAdvancedArea) {
			oFilterItem.setVisibleInAdvancedArea(true);
		}
	};

	SmartFilterBar.prototype.getConditionTypeByKey = function(sKey) {
		if (this._oFilterProvider._mConditionTypeFields[sKey]) {
			return this._oFilterProvider._mConditionTypeFields[sKey].conditionType;
		}
	};

	/**
	 * Checks whether the control is initialised
	 * @returns {boolean} returns whether control is already initialised
	 * @protected
	 */
	SmartFilterBar.prototype.isInitialised = function() {
		return !!this.bIsInitialised;
	};

	SmartFilterBar.prototype.destroy = function() {
		this._clearDelayedSearch();

		if (this._oSmartVariantManagement && this.getConsiderSelectionVariants()) {
			this._oSmartVariantManagement.unregisterSelectionVariantHandler(this);
		}

		FilterBar.prototype.destroy.apply(this, arguments);

		sap.ui.getCore().getMessageManager().unregisterObject(this);

		if (this._oFilterProvider && this._oFilterProvider.destroy) {
			this._oFilterProvider.destroy();
		}
		this._oFilterProvider = null;
		this._aFilterBarViewMetadata = null;
		this._bExpandAdvancedFilterArea = null;
		this._oResourceBundle = null;
		this._sMandatoryErrorMessage = null;
		this._sValidationErrorMessage = null;

		this._oSmartVariantManagement = null;
	};

	return SmartFilterBar;

}, /* bExport= */true);
