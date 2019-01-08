sap.ui.define([
	"sap/m/HeaderContainer", "sap/suite/ui/generic/template/AnalyticalListPage/controller/VisualFilterDialogController","sap/m/Label",
	"sap/ui/comp/odata/ODataModelUtil",
	"sap/ui/comp/smartfilterbar/FilterProvider", "sap/suite/ui/generic/template/AnalyticalListPage/control/visualfilterbar/VisualFilterProvider",
	"sap/ui/comp/smartvariants/PersonalizableInfo", "sap/ui/comp/smartvariants/SmartVariantManagement",
	"sap/ui/model/Filter",
	"sap/m/OverflowToolbar", "sap/m/ToolbarSpacer", "sap/ui/comp/odata/MetadataAnalyser",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/FilterUtil",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/V4Terms","sap/m/VBox",
	"sap/m/Button",
	"sap/suite/ui/generic/template/AnalyticalListPage/controller/DropDownController"

], function(HeaderContainer, VisualFilterDialogController,
		Label,
		ODataModelUtil,
		FilterProvider, VisualFilterProvider,
		PersonalizableInfo, SmartVariantManagement,
		Filter,
		OverflowToolbar, ToolbarSpacer, MetadataAnalyser, FilterUtil, V4Terms, VBox, Button,
		DropDownController) {
	"use strict";
	// create simple type to handle two-way binding (model -> view and view -> model)
	var oDimensionFilterType = sap.ui.model.SimpleType.extend("sap.ui.model.DimensionFilterType", {
	    formatValue: function(oValue) {
			// handles model -> view changes
			return oValue;
	    },
	    parseValue: function(oValue) {
			// handles view -> model changes
			return oValue;
	    },
	    validateValue: function(oValue) {
			// can extra validation on the value after successful parsing
			// not doing anything for now
	    }
	});

	var SmartVisualFilterBar = HeaderContainer.extend("sap.suite.ui.generic.template.AnalyticalListPage.control.visualfilterbar.SmartVisualFilterBar", {
		metadata: {
			designTime: true,
			properties: {
				entitySet: { type: "string", group: "Misc", defaultValue: null },
				config: { type: "object", group: "Misc", defaultValue: null },
				persistencyKey: { type: "string", group: "Misc", defaultValue: null },
				displayCurrency: { type: "string", group: "Misc", defaultValue: null },
				smartFilterId: { type: "string", group: "Misc", defaultValue: null },
				textArrangement: {type: "string", group: "Misc", defaultValue: sap.ui.comp.smartfilterbar.DisplayBehaviour.descriptionAndId}
			},
			associations: {
				smartVariant: { type: "sap.ui.core.Control", multiple: false }
			},
			events: {
				filterChange: {}
			}
		},
		renderer: {}
	});

	SmartVisualFilterBar.prototype.init = function() {
		if (HeaderContainer.prototype.init) {
			HeaderContainer.prototype.init.apply(this, arguments);
		}
		//bIsCozyMode is true when launched in cozy form factor. This check is to increase the height of the charts to make it interactive in cozy mode
		var bIsCozyMode = jQuery(document.body).hasClass("sapUiSizeCozy");
		// Default settings
		//TODO: Get this through CSS rather than hard coding
		this._cellItemHeightNorth = "2.0rem";
		this._cellItemHeightSouth = bIsCozyMode ? "9.9rem" : "7.9rem";
		this._cellHeight = bIsCozyMode ? "12rem" : "10.9rem";
		this._cellWidth = "20rem";
		this.labelHeight = 2.0;
		this.compHeight = bIsCozyMode ? 9.9 : 7.9;
		this.cellHeightPadding = 1;
		this.cellHeight = (this.labelHeight + this.compHeight + this.cellHeightPadding) + "rem";  // Add cell padding due to the focus on the chart being clipped by the outer cell container, shouldn't have to do this
		this.cellWidth = 320;
		this._dialogFilters = {};
		this._compactFilters = {};
		this._oVariantConfig = {};
		this._smartFilterContext;
		this._oMetadataAnalyser;
		this.setModel(new sap.ui.model.json.JSONModel(), '_visualFilterConfigModel');
		if (bIsCozyMode) {
			if (sap.ui.Device.system.phone) { //Apply the style class specific to phone and change orientation of header container to "vertical"
				this.setOrientation("Vertical");
				this.addStyleClass("sapSmartTemplatesAnalyticalListPageVisualFilterBarCozyPhone");
			} else { //Apply the style class specific to tablet
				this.addStyleClass("sapSmartTemplatesAnalyticalListPageVisualFilterBarCozy");
			}		} else {
			this.addStyleClass("sapSmartTemplatesAnalyticalListPageVisualFilterBar");
		}
	};

	/**
	 * It could happen that the entity type information is set already in the view, but there is no model attached yet. This method is called once the
	 * model is set on the parent and can be used to initialise the metadata, from the model, and finally create the visual filter bar.
	 *
	 * @private
	 */
	SmartVisualFilterBar.prototype.propagateProperties = function() {
		HeaderContainer.prototype.propagateProperties.apply(this, arguments);
		this._initMetadata();
	};

	/**
	 * Initialises the OData metadata necessary to create the visual filter bar
	 *
	 * @private
	 */
	SmartVisualFilterBar.prototype._initMetadata = function() {
		if (!this.bIsInitialised) {
			ODataModelUtil.handleModelInit(this, this._onMetadataInit);
		}
	};

	/**
	 * Called once the necessary Model metadata is available
	 *
	 * @private
	 */
	SmartVisualFilterBar.prototype._onMetadataInit = function() {
		if (this.bIsInitialised) {
			return;
		}

		this._annoProvider = this._createVisualFilterProvider();
		if (!this._annoProvider) {
			return;
		}

		this._oMetadataAnalyser = this._annoProvider.getMetadataAnalyser();
		this.bIsInitialised = true;

		//Retrieving the Text Arrangement for the Entity Type
		var entityType = this._oMetadataAnalyser.getEntityTypeNameFromEntitySetName(this.getEntitySet());
		this.setTextArrangement(this._oMetadataAnalyser.getTextArrangementValue(entityType));

		this._updateFilterBar();
	};

	/**
	 * Creates an instance of the visual filter provider
	 *
	 * @private
	 */
	SmartVisualFilterBar.prototype._createVisualFilterProvider = function() {
		var model = this.getModel();
		var entitySet = this.getEntitySet();

		if (!model || !entitySet) {// Model and entity set must be available
			return null;
		}

		return new VisualFilterProvider(this);
	};

	/*
	* @private
	* obtains the string for '_BASIC' group from i18n property
	* @return {string}
	*/
	SmartVisualFilterBar.prototype._getBasicGroupTitle = function() {
		return this.getModel("i18n").getResourceBundle().getText("VIS_FILTER_GRP_BASIC_TITLE");
	};

	SmartVisualFilterBar.prototype._getFieldGroupForProperty = function(oEntityType,sCurrentPropName) {
		return this._annoProvider ? this._annoProvider._getFieldGroupForProperty(oEntityType,sCurrentPropName) : undefined;
	};

	SmartVisualFilterBar.prototype._getGroupList = function() {
		return this._annoProvider ? this._annoProvider.getGroupList() : [];
	};

	SmartVisualFilterBar.prototype._getGroupMap = function() {
		return this._annoProvider ? this._annoProvider.getGroupMap() : {};
	};

	SmartVisualFilterBar.prototype._getMeasureMap = function() {
		return this._annoProvider ? this._annoProvider.getMeasureMap() : {};
	};

	SmartVisualFilterBar.prototype._getDimensionMap = function() {
		return this._annoProvider ? this._annoProvider.getDimensionMap() : {};
	};

	/*
	* @public
	* sets the smart filter bar reference in the visual filter
	* so that it can be accessed if required
	* @param {object} oContext reference to smart filter bar
	* @return {void}
	*/
	SmartVisualFilterBar.prototype.setSmartFilterContext = function(oContext) {
		this._smartFilterContext = oContext;
	};

	SmartVisualFilterBar.prototype._updateFilterBar = function() {
		// Centrally handle the various settings: Application Configuration, OData Annotations, Variant settings...
		// Order of precedence, highest to lowest, highest precedence overwrites the lower precedence:
		//   1. Variant
		//   2. OData Annotations


		var annoSettings = this._getAnnotationSettings();
		if (annoSettings && annoSettings.filterList) {
			var config = this._convertSettingsToConfig(annoSettings);
		} else {
			// Default, no filters
			config = {
				filterCompList: []
			};
			this.getModel('_visualFilterConfigModel').setData(config);
			return;
		}

		// Variant store the variables of a property (Measure, sort order, chart type, shown in filterbar)
		var variantJSON = this._getVariantConfig();
		if (variantJSON && variantJSON.config) {
			// merge variant into config based on property
			config.filterCompList.forEach(function (element) {
				// if parent property exists in variant json override config
				if (variantJSON.config[element.component.properties.parentProperty]) {
					jQuery.extend(true, element, variantJSON.config[element.component.properties.parentProperty]);
				}
			});
			// store config only for later use after smart filter bar variant load when mergeCompactFilters is called
			this._oVariantConfig = config;
			//return;
		}
		this.unbindAggregation('content', true);

		this.getModel('_visualFilterConfigModel').setData(config);
		this.bindAggregation('content', {
			path: "_visualFilterConfigModel>/filterCompList",
			factory: function (sId, oContext) {
				var oComponentProperties = oContext.getProperty('component'),
				oProperties = oComponentProperties ? oComponentProperties.properties : undefined,
				sChartType = this._resolveChartType(oComponentProperties ? oComponentProperties.type : undefined);
				// create header items
				return this._createHeaderItems(oContext.sPath, sChartType, oProperties);
			}.bind(this),
			//Filter the items based on shownInFilterBar=true
			filters: new sap.ui.model.Filter("shownInFilterBar", sap.ui.model.FilterOperator.EQ, true)
		});
		return;

	};
	// spath - path to object in visual filter config model
	SmartVisualFilterBar.prototype._createHeaderItems = function (sPath, sType, oProperties) {
		// Component initialization, create chart
		var oFilterItem = this._createFilterItemOfType(sType, oProperties),
		aInParameters = oFilterItem.getInParameters(),
		aBindingParts = [],
		me = this;
		if (aInParameters && aInParameters.length > 0) {
			aInParameters.forEach(function (element) {
				aBindingParts.push({
					path: '_filter>/' + element.localDataProperty
				});
			});
		}
		oFilterItem.addCustomData(new sap.ui.core.CustomData({
			key: 'sPath',
			value: sPath
		}));
		if (me.getEntitySet() === oFilterItem.getEntitySet()) {
			var aMandatoryFields = me._smartFilterContext.determineMandatoryFilterItems();
			if (aMandatoryFields && aMandatoryFields.length > 0) {
				aMandatoryFields.forEach(function (element) {
					if (!element.data("isCustomField")) {
					    aBindingParts.push({
					        path: '_filter>/' + element.getName()
					    });
					}
				});
			}
		}
		// set models on the filter items
		oFilterItem.bindProperty('dimensionFilter', {
			path: '_filter>/' + oFilterItem.getParentProperty(),
			// type ensure two-way data binding in case value has to be formatted
			type: new oDimensionFilterType()
		});

		oFilterItem.bindProperty('measureField', {
			path: '_visualFilterConfigModel>' + sPath + '/component/properties/measureField'
		});

		oFilterItem.bindProperty('sortOrder', {
			path: '_visualFilterConfigModel>' + sPath + '/component/properties/sortOrder'
		});
		oFilterItem.bindProperty('unitField', {
			path: '_visualFilterConfigModel>' + sPath + '/component/properties/measureField',
			formatter: function() {
				var measureMap = me._getMeasureMap();
				var measureField = measureMap[this.getEntitySet()][this.getMeasureField()];
				return measureField ? measureField.fieldInfo.unit : "";
			}
		});
		if (aBindingParts && aBindingParts.length > 0) {
			oFilterItem.bindProperty('dimensionFilterExternal', {
				parts: aBindingParts,
				formatter: function () {
					var	aInParameters = this.getInParameters(),
					sParentProperty = this.getParentProperty();
					var oFilter, oCurrencyProperty;
					// If the Main EntitySet and the filterItem EntitySet is the same and the main EntitySet
					// is Parameterized, then we do not proceed. So we only procees in 3 cases.
					// 1. VH!=ME(Parameterized)
					// 2. VH=ME(Non-Parameterized)
					// 3. VH!=ME(Non-Paramterized)
					// Since we already have set a parameter, therefore
					// we do not need an explicit currency filter and the parameter takes care of the conversions.
					// Considering the above 3 cases, we proceed only if
					// 1. The ME is Non-Parameterized
					// 2. The ME is Parameterized but the parameter is only P_DisplayCurrency
					if (!(me.getEntitySet() === this.getEntitySet() && me._smartFilterContext.getAnalyticBindingPath() !== "") && (me._smartFilterContext.getAnalyticBindingPath() === "" || ((me._smartFilterContext.getAnalyticBindingPath().indexOf("P_DisplayCurrency")) != -1))) {
						var displayCurrency = me.getProperty("displayCurrency");
						// If displayCurrency is set only then we proceed.
						if (displayCurrency) {
							var measureField = this.getMeasureField();
							var oModel = me.getModel();
							var metaModel = oModel.getMetaModel();
							var oEntityType = metaModel.getODataEntityType(me._oMetadataAnalyser.getEntityTypeNameFromEntitySetName(this.getEntitySet()));
							var oProperty = metaModel.getODataProperty(oEntityType, measureField);

							if (oProperty) {
								var sCurrencyPath = oProperty[V4Terms.ISOCurrency];
								if (sCurrencyPath) {
									// Check the cuurency property associated with the measure.
									var sCurrencyField = sCurrencyPath.Path;

									for (var key = (aInParameters.length - 1); key > -1; key--) {
										var sValueListProperty = aInParameters[key].valueListProperty;
										var sLocalDataProperty = aInParameters[key].localDataProperty;
										if (sValueListProperty === sCurrencyField) {
											var aFilterData = me._smartFilterContext.getFilterData();
											if (!aFilterData[sLocalDataProperty]) {
												oCurrencyProperty = metaModel.getODataProperty(oEntityType, sCurrencyField);
												if (oCurrencyProperty && oCurrencyProperty["sap:filterable"] !== "false") {
													oFilter = new sap.ui.model.Filter({
														aFilters: [
															new sap.ui.model.Filter({ path: sCurrencyField, operator: "EQ", value1: displayCurrency, value2: undefined })
														],
														and: false
													});
												}
											}
											break;
										}
									}
								}
							}
						}
					}
					return me._getFiltersForFilterItem(aInParameters, sParentProperty, oFilter, sCurrencyField);
				}
			});
		}

		// Attach events
		if (oFilterItem.attachFilterChange) {
			oFilterItem.attachFilterChange(this._onFilterChange, this);
		}

		if (oFilterItem.attachTitleChange) {
			oFilterItem.attachTitleChange(this._onTitleChange, this);
		}

		// Create title toolbar for the cell
		var oToolbar = this._createTitleToolbar(oProperties, oFilterItem),
		oHeaderTitleBar = new VBox({
			height: this._cellItemHeightNorth,
			items: [oToolbar]
		});

		var oHeaderOverlay = new VBox({
			width: "100%",
			height: this._cellItemHeightSouth,
			items: [
				new sap.m.Text({
					width: this.cellWidth + "px",
					textAlign: sap.ui.core.TextAlign.Center,
					text: {
						path: '_visualFilterConfigModel>' + sPath + '/overlayMessage',
						formatter: function(sOverlayMessage) {
							return this.getModel("i18n").getResourceBundle().getText(sOverlayMessage);
						}
					}
				})
			],
			visible: {
				path: '_visualFilterConfigModel>' + sPath + '/showChartOverlay',
				formatter: function( bValue) {
					return bValue;
				}
			}
		});

		oHeaderOverlay.addStyleClass("sapUiOverlay");
		oHeaderOverlay.addStyleClass("sapSmartTemplatesAnalyticalListPageVFOverflow");
		oHeaderOverlay.addStyleClass("sapSmartTemplatesAnalyticalListPageVFOverflowCozy");
		var oHeaderChartBar = new VBox({
			height: this._cellItemHeightSouth,
			items: [oFilterItem],
			visible: {
				path: "_visualFilterConfigModel>" + sPath + "/showChartOverlay",
				formatter: function( bValue) {
					return !bValue;
				}
			}
		});

		var oCell = new VBox({
			fieldGroupIds: ["headerBar"],
			height: this._cellHeight,
			width: this.cellWidth + "px",
			items:[
				oHeaderTitleBar,
				oHeaderOverlay,
				oHeaderChartBar
			]
		});

		return oCell;
	};

	SmartVisualFilterBar.prototype._getAnnotationSettings = function() {
		return this._annoProvider ? this._annoProvider.getVisualFilterConfig() : null;
	};

	/*
	* @private
	* Convert setting from annotations to config for visual filter
	* @param {object} settings - parsed annotations data from visual filter provider
	* @param {boolean} bIsVariantConfig	- if called  by variant management to get variant config
	* @return {object} config used to render the charts or get variant management object based on bIsVariantConfig
	*/
	SmartVisualFilterBar.prototype._convertSettingsToConfig = function(settings, bIsVariantConfig) {
		var config = {
			filterCompList: []
		};

		// Include group information, prepare the group information by field
		var groupList = this._getGroupList();
		var groupByFieldName = {};
		for (var i = 0; i < groupList.length; i++) {
			var group = groupList[i];

			for (var j = 0; j < group.fieldList.length; j++) {
				var field = group.fieldList[j];
				groupByFieldName[field.name] = {
					name: group.name,
					label: group.label
				};
			}
		}

		// By default the basic group is all available in the filter dialog, so get all field names and in the shownInFilterDialog, set the value to true if in this list
		var groupMap = this._getGroupMap();
		var basicGroup = groupMap["_BASIC"];
		var basicFieldNameList = [];
		if (basicGroup && basicGroup.fieldList) {
			for (var i = 0; i < basicGroup.fieldList.length; i++) {
				basicFieldNameList.push(basicGroup.fieldList[i].name);
			}
		}

		var measureMap = this._getMeasureMap(),
			filterList = settings.filterList,
			oVariantConfig = {};
		for (var i = 0; i < filterList.length; i++) {
			var filterCfg = filterList[i];

			var dimField = filterCfg.dimension.field;

			var measureField = measureMap[filterCfg.collectionPath][filterCfg.measure.field];
			var bIsCurrency = false;

			if (measureField.fieldInfo[V4Terms.ISOCurrency]){
				bIsCurrency = true;
			}

			var oConfigObject = {
				shownInFilterBar: filterCfg.selected,
				component: {
					type: filterCfg.type,
					properties: {
						sortOrder : filterCfg.sortOrder,
						measureField: filterCfg.measure.field,
						parentProperty: filterCfg.parentProperty ? filterCfg.parentProperty : undefined
					}
				}
			};

			if (!bIsVariantConfig) {
				// if not variant management add other properties to config object
				var oConfigExtendedObject = {
					shownInFilterDialog: filterCfg.selected || basicFieldNameList.indexOf(dimField) != -1,
					group: groupByFieldName[filterCfg.parentProperty],
					component: {
						properties: {
							scaleFactor : filterCfg.scaleFactor,
							numberOfFractionalDigits: filterCfg.numberOfFractionalDigits,
							filterRestriction: filterCfg.filterRestriction,
							width: this.cellWidth + "px",
							height: this.compHeight + "rem",
							entitySet: filterCfg.collectionPath ? filterCfg.collectionPath : this.getEntitySet(),
							dimensionField: dimField,
							dimensionFieldDisplay: filterCfg.dimension.fieldDisplay,
							dimensionFilter: filterCfg.dimensionFilter,
							unitField: measureField ? measureField.fieldInfo.unit : "",
							isCurrency: bIsCurrency,
							isDropDown: filterCfg.isDropDown,
							isMandatory: filterCfg.isMandatory,
							outParameter: filterCfg.outParameter ? filterCfg.outParameter : undefined,
							inParameters: filterCfg.inParameters ? filterCfg.inParameters : undefined,
							textArrangement: this.getTextArrangement(),
							chartQualifier: filterCfg.chartQualifier ? filterCfg.chartQualifier : undefined,
							dimensionFieldIsDateTime: filterCfg.dimensionFieldIsDateTime
						}
					}
				};
				jQuery.extend(true, oConfigObject, oConfigExtendedObject);
				// convert the filter properties from the configuration (variant, annotation) into the control specific properties
				config.filterCompList.push(oConfigObject);
			} else {
				// create variant management object
				oVariantConfig[filterCfg.parentProperty] = oConfigObject;
			}
		}

		return bIsVariantConfig ? oVariantConfig : config;
	};

	SmartVisualFilterBar.prototype._setVariantModified = function() {
		if (this._oVariantManagement) {
			this._oVariantManagement.currentVariantSetModified(true);
		}
	};

	SmartVisualFilterBar.prototype._onFilterChange = function(ev) {
		this._setVariantModified();
		// Fire the external filter change event
		// event handler should always call setCompactFilterData with compact filter data
		// handled in filter bar controller
		this.fireFilterChange();
	};

	/**
	 * @private
	 * Get AND query filters for all in parameters for a visual filter instance instance
	 *
	 * @param {array} inParams - array of in parameters
	 * @param {string} parentProperty - parent property of the visual filter instance
	 * @returns {array} filter query of the visual filter item
	 */
	SmartVisualFilterBar.prototype._getFiltersForFilterItem = function(inParams, parentProperty,oFilter, currencyField) {

		var oPropertyFilters = {},
		mappedLocalDataProperty	= [],
		filters = new sap.ui.model.Filter({
			aFilters: [],
			and: true
		});

		if (inParams) {
			var replaceSPath = function (element) {
				// change property path from local data property to value list property
				// since query for filter item will be made to collection path
				element.sPath = valueListProperty;
			};
			// reverse loop since for compact filters also the last in param is considered first
			for (var key = (inParams.length - 1); key > -1; key--) {
				var localDataProperty = inParams[key].localDataProperty,
				valueListProperty = inParams[key].valueListProperty;

				// Build the set of filters
				if (localDataProperty !== parentProperty && mappedLocalDataProperty.indexOf(localDataProperty) === -1) {
					// get filters for property from smart filter bar
					oPropertyFilters = this._smartFilterContext.getFilters([localDataProperty]);
					if (oPropertyFilters && oPropertyFilters.length > 0) {
						// since filter is for specific property hence
						// there will always be one global filter with index 0
						if (oPropertyFilters[0].aFilters) {
							// if in param property is filter-restriction=multi-value
							oPropertyFilters[0].aFilters.forEach(replaceSPath.bind(this));
						} else {
							// if in param property is filter-restriction=single-value or filter-restriction=interval
							replaceSPath(oPropertyFilters[0]);
						}
						// map of properties that have already been considered for in params
						mappedLocalDataProperty.push(localDataProperty);
						// add to main filter with and condition
						filters.aFilters.push(oPropertyFilters[0]);
					}
				}
			}
			if (oFilter) {
				filters.aFilters.push(oFilter);
			}
		}
		return filters;
	};

	SmartVisualFilterBar.prototype._createTitleToolbar = function(props, filterItem) {
		var title = new Label({
			text: {
				path: "i18n>VIS_FILTER_TITLE_MD",
				formatter: function() {
					return filterItem.getTitle();
				}
			}
		});
		if (filterItem.getProperty("isMandatory")) {
			title.addStyleClass("sapMLabelRequired");
		}
		//Get the input control for corresponding property needed to fire valuehelp request
		var oInput = this._smartFilterContext.getControlByKey(props.parentProperty);
		//ensure that value help annotations are loaded
		this._smartFilterContext.ensureLoadedValueHelp(props.parentProperty);
		//Value help button is needed only if input control is defined
		if (oInput) {
			var dimLabel = FilterUtil.getPropertyNameDisplay(this.getModel(), filterItem.getEntitySet(), filterItem.getDimensionField()),
			rb = this.getModel("i18n").getResourceBundle(),
			bIsValuehelp = oInput.getShowValueHelp && oInput.getShowValueHelp(),
			sShowDropdown = (props.isDropDown) ? "sap-icon://slim-arrow-down" : "",
			sIcon = bIsValuehelp ? "sap-icon://value-help" : sShowDropdown, count,
			selectedBtn = new Button({
				text: {
					path: "_filter>/" + filterItem.getParentProperty(),
					formatter: function(oContext) {
						var sFilterRestriction = filterItem.getFilterRestriction();
						count = 0;
						if (oContext) {
							if (sFilterRestriction === 'single') {
								count = 1;
							} else {
								if (typeof oContext === "object") {	//For multi value
									if (oContext.value) {	//Add single value
										count++;
									}
									//Add items
									if (oContext.items && oContext.items.length) {	//items can be null
										count += oContext.items.length;
									}
									//Add ranges
									if (oContext.ranges && oContext.ranges.length) {	//ranges can be null
										count += oContext.ranges.length;
									}
								} else {	//For single value, it can be string or int
									count++;
								}
							}
						}
						return count ? "(" + count + ")" : "";
					}
				},
				icon: (bIsValuehelp || props.isDropDown) ? sIcon : "",
				visible: {
					path: "_filter>/" + filterItem.getParentProperty(),
					formatter: function(oContext) {
						if (bIsValuehelp || props.isDropDown) { //for valuehelp & Drop Down
							return true;
						} else { //non value-help case
							if (!oContext) { //No filter set for this property
								return false;
							}
							//Handle multiple values
							if (typeof oContext === "object") {
								return (oContext.value || (oContext.items && oContext.items.length) || (oContext.ranges && oContext.ranges.length)) ? true : false;
							}
							//Single value fields
							return true;
						}
					}
				},
				press: function(oEvent) {
					if (bIsValuehelp) {
						oInput.fireValueHelpRequest.call(oInput);
					} else if (props.isDropDown) {
						DropDownController.createDropdown(oEvent.getSource(), filterItem, this.getModel(), dimLabel, props);
					} else {
						VisualFilterDialogController.launchAllFiltersPopup(selectedBtn, filterItem, oEvent.getSource().getModel('i18n'));
					}
				},
				layoutData: new sap.m.OverflowToolbarLayoutData({
					priority: sap.m.OverflowToolbarPriority.NeverOverflow
				}),
				tooltip: {
					path: "_filter>/" + filterItem.getParentProperty(),
					formatter: function() {
						return FilterUtil.getTooltipForValueHelp(bIsValuehelp, dimLabel, rb, count);
					}
				}
			});
		}

		var toolbar = new OverflowToolbar({
			design: sap.m.ToolbarDesign.Transparent,
			width: this.cellWidth + "px",
			content: [
				title,
				new ToolbarSpacer(),
				selectedBtn
			]
		});

		toolbar.addStyleClass("sapSmartTemplatesAnalyticalListPageVisualFilterTitleToolbar");

		return toolbar;
	};

	SmartVisualFilterBar.prototype.getTitleByFilterItemConfig = function(filterConfig, unitValue, scaleValue) { // used when the filter item + data is not present, ideally called on the filter item iteslf
		var props = filterConfig.component.properties;
		var entitySet = props.entitySet;
		var model = this.getModel();

		if (!model) {
			return "";
		}
		var measureLabel = FilterUtil.getPropertyNameDisplay(model, entitySet, props.measureField);
		var dimLabel = FilterUtil.getPropertyNameDisplay(model, entitySet, props.dimensionField);

		// Get the Unit
		if (!unitValue) {
			unitValue = "";
		}

		// Get the Scale factor
		if (!scaleValue) {
			scaleValue = "";
		}

		var titleText = "";
		var rb = this.getModel("i18n").getResourceBundle();
		if (scaleValue && unitValue) {
			titleText = rb.getText("VIS_FILTER_TITLE_MD_UNIT_CURR", [measureLabel, dimLabel, scaleValue, unitValue]);
		} else if (unitValue) {
			titleText = rb.getText("VIS_FILTER_TITLE_MD_UNIT", [measureLabel, dimLabel, unitValue]);
		} else if (scaleValue) {
			titleText = rb.getText("VIS_FILTER_TITLE_MD_UNIT", [measureLabel, dimLabel, scaleValue]);
		} else {
			titleText = rb.getText("VIS_FILTER_TITLE_MD", [measureLabel, dimLabel]);
		}

		return titleText;
	};

	SmartVisualFilterBar.prototype._onTitleChange = function(ev) {
		var oCell = ev.getSource().getParent().getParent();
		//Select label from toolbar
		var oLabel = oCell.getItems()[0].getItems()[0].getContent()[0];
		if (ev.getSource().getProperty("isMandatory")) {
			oLabel.addStyleClass("sapMLabelRequired");
		}
		oLabel.setText(ev.getSource().getTitle());
		oLabel.setTooltip(ev.getSource().getTitle());
	};

	SmartVisualFilterBar.prototype._getSupportedFilterItemList = function() {
		// predefined set of controls, order preserved
		if (!this._supportedFilterItemList) {
			this._supportedFilterItemList = [{
					type: "Bar",
					//className: "sap.suite.ui.generic.template.AnalyticalListPage.control.visualfilterbar.FilterItemChartBar",
					className: "sap.suite.ui.generic.template.AnalyticalListPage.control.visualfilterbar.FilterItemMicroBar",
					iconLink: "sap-icon://horizontal-bar-chart",
					textKey: "VISUAL_FILTER_CHART_TYPE_BAR"
				}, {
					type: "Donut",
					//className: "sap.suite.ui.generic.template.AnalyticalListPage.control.visualfilterbar.FilterItemChartDonut",
					className: "sap.suite.ui.generic.template.AnalyticalListPage.control.visualfilterbar.FilterItemMicroDonut",
					iconLink: "sap-icon://donut-chart",
					textKey: "VISUAL_FILTER_CHART_TYPE_Donut"
				}, {
					type: "Line",
					//className: "sap.suite.ui.generic.template.AnalyticalListPage.control.visualfilterbar.FilterItemChartLine",
					className: "sap.suite.ui.generic.template.AnalyticalListPage.control.visualfilterbar.FilterItemMicroLine",
					iconLink: "sap-icon://line-charts",
					textKey: "VISUAL_FILTER_CHART_TYPE_Line"
				}
			];
		}

		return this._supportedFilterItemList;
	};

	SmartVisualFilterBar.prototype._getSupportedFilterItemMap = function() {
		if (!this._supportedFilterItemMap) {
			this._supportedFilterItemMap = {};

			var compList = this._getSupportedFilterItemList();
			for (var i = 0; i < compList.length; i++) {
				var comp = compList[i];
				this._supportedFilterItemMap[comp.type] = comp;
			}
		}

		return this._supportedFilterItemMap;
	};

	SmartVisualFilterBar.prototype._resolveChartType = function(type) {
		var compMap = this._getSupportedFilterItemMap();

		var compInfo = compMap[type];
		if (!compInfo) {
			var aType;
			for (aType in compMap) {
				compInfo = compMap[aType];
				break;
			}

			jQuery.sap.log.error("Could not resolve the filter component type: \"" + type + "\", falling back to " + aType);
			type = aType;
		}

		return type;
	};

	SmartVisualFilterBar.prototype._createFilterItemOfType = function(type, properties) {
		var compMap = this._getSupportedFilterItemMap();
		var compInfo = compMap[type];

		var className = compInfo.className;

		jQuery.sap.require(className);
		var compClass = jQuery.sap.getObject(className);

		var compInst = new compClass(properties); // Instantiate and apply properties
		compInst.setSmartFilterId(this.getSmartFilterId());	//Needed to fire parameterized query
		compInst.setModel(this.getModel('_filter'), '_filter');
		compInst.setModel(this.getModel('i18n'), 'i18n');
		compInst.setModel(this.getModel("_templPriv"), "_templPriv");
		compInst.setModel(this.getModel('_visualFilterConfigModel'), "_visualFilterConfigModel");
		compInst.setModel(this.getModel());
		//compInst._updateBinding();
		return compInst;
	};
	/**
	* Returns config for visual filter
	*
	* @param {boolean} bIsVariantConfig - if config should be for variant or not
	* @returns {object} config for the visual filter to determine behaviour of each filter item
	*/
	SmartVisualFilterBar.prototype.getConfig = function(bIsVariantConfig) {
		var config = this.getModel('_visualFilterConfigModel').getData(),
			oVariantConfig = {};

		if (!config) {
			return {filterCompList: []};
		}

		var itemIndex = 0;
		//var itemList = this.getContent();
		var itemList = sap.ui.getCore().byFieldGroupId("headerBar");
		for (var i = 0; i < config.filterCompList.length; i++) {
			var compConfig = config.filterCompList[i];
			if (bIsVariantConfig) {
				// generate config for variant management
				oVariantConfig[compConfig.component.properties.parentProperty] = {
					shownInFilterBar: compConfig.shownInFilterBar,
					component: {
						type: compConfig.component.type,
						properties: {
							measureField: compConfig.component.properties.measureField,
							sortOrder: compConfig.component.properties.sortOrder,
							parentProperty: compConfig.component.properties.parentProperty
						}
					}
				};
			} else {
				// generate config for visual filter bar
				if (!compConfig.shownInFilterBar) {// If not shown, then no changes to collect, so go to the next
					continue;
				}

				// there will be a corresponding UI entry, ask for the latest configuration from each
				var item = itemList[itemIndex];
				if (!item) {
					jQuery.sap.log.error("The configured selected filter bar items do not correspond to the actual filter bar items.  Could be an error during initialization, e.g. a chart class not found");
					return {filterCompList: []};
				}

				itemIndex++;
				if (item._chart) {
					var compInst = item;
					compConfig.component.properties = compInst.getP13NConfig();
				}
			}
		}

		return bIsVariantConfig ? oVariantConfig : config;
	};

	/////////////////////
	// Variant handling
	/////////////////////
	SmartVisualFilterBar.prototype.setSmartVariant = function(oSmartVariantId) {
		this.setAssociation("smartVariant", oSmartVariantId);

		if (oSmartVariantId) {
	        var oPersInfo = new PersonalizableInfo({
	            type: "sap.suite.ui.generic.template.AnalyticalListPage.control.visualfilterbar.SmartVisualFilterBar",
	            keyName: "persistencyKey"
	        });
			oPersInfo.setControl(this);
		}

		this._oVariantManagement = this._getVariantManagementControl(oSmartVariantId);
		if (this._oVariantManagement) {
			this._oVariantManagement.addPersonalizableControl(oPersInfo);
			this._oVariantManagement.initialise(this._variantInitialised, this);
			this._oVariantManagement.attachSave(this._onVariantSave, this);
		} else if (oSmartVariantId) {
			if (typeof oSmartVariantId === "string") {
				jQuery.sap.log.error("Variant with id=" + oSmartVariantId + " cannot be found");
			} else if (oSmartVariantId instanceof sap.ui.core.Control) {
				jQuery.sap.log.error("Variant with id=" + oSmartVariantId.getId() + " cannot be found");
			}
		} else {
			jQuery.sap.log.error("Missing SmartVariant");
		}
	};

	SmartVisualFilterBar.prototype._getVariantManagementControl = function(oSmartVariantId) {
		var oSmartVariantControl = null;
		if (oSmartVariantId) {
			oSmartVariantControl = typeof oSmartVariantId == "string" ? sap.ui.getCore().byId(oSmartVariantId) : oSmartVariantId;

			if (oSmartVariantControl && !(oSmartVariantControl instanceof SmartVariantManagement)) {
				jQuery.sap.log.error("Control with the id=" + oSmartVariantId.getId ? oSmartVariantId.getId() : oSmartVariantId + " not of expected type");
				return null;
			}
		}
		return oSmartVariantControl;
	};

	SmartVisualFilterBar.prototype._variantInitialised = function() {
		if (!this._oCurrentVariant) {
			this._oCurrentVariant = "STANDARD";
		}
	};

	SmartVisualFilterBar.prototype._onVariantSave = function() {
		if (this._oCurrentVariant == "STANDARD") {// changes were made, so get the current configuration
			this._oCurrentVariant = {
				config: this.getConfig(true)
			};
		}
	};


	SmartVisualFilterBar.prototype.applyVariant = function(oVariantJSON, sContext) {
		this._oCurrentVariant = oVariantJSON;
		if (this._oCurrentVariant == "STANDARD") {
			this._oCurrentVariant = null;
		}
		// check if this is old variant
		// old variant used to store filterCompList in config
		if (this._oCurrentVariant && this._oCurrentVariant.config && this._oCurrentVariant.config.filterCompList) {
			// if old variant, set config to null so that annotations can be considered for the chart
			this._oCurrentVariant.config = null;
		}

		if (this._oCurrentVariant && this._oCurrentVariant.config == null) { // then STANDARD, but STANDARD variant was requested before annotations were ready
			var annoSettings = this._getAnnotationSettings();
			if (annoSettings && annoSettings.filterList) {
				this._oCurrentVariant.config = this._convertSettingsToConfig(annoSettings, true);
			}
		}

		this._updateFilterBar();

		//Need to unmark the dirty flag because this is framework
		//applying the variant and firing filter to update table/chart
		if (this._oVariantManagement) {
			this._oVariantManagement.currentVariantSetModified(false);
		}
	};

	SmartVisualFilterBar.prototype._getVariantConfig = function() {
		return this._oCurrentVariant;
	};

	SmartVisualFilterBar.prototype.fetchVariant = function() {
		if (!this._oCurrentVariant || this._oCurrentVariant == "STANDARD") {
			var annoSettings = this._getAnnotationSettings();
			if (annoSettings && annoSettings.filterList) {
				this._oCurrentVariant = {
					config: this._convertSettingsToConfig(annoSettings, true)
				};
				return this._oCurrentVariant;
			} else {
				return {
					config: null
				};
			}
		}

		return {
			config: this.getConfig(true)
		};
	};
	/**
	 * Refresh the visual filter charts in SmartVisualFilterBar.
	 * Iterate over all the chart items in VisualFilters and call their _updateBinding methods.
	 */
	SmartVisualFilterBar.prototype.updateVisualFilterBindings = function(bAllowBindingUpdateOnPropertyChange){
		//var itemList = this.getContent();
		var itemList = sap.ui.getCore().byFieldGroupId("headerBar");
		for (var i = 0; i < itemList.length; i++) {
			if (itemList[i]._chart) {
				itemList[i]._updateBinding();
				itemList[i]._bAllowBindingUpdateOnPropertyChange = bAllowBindingUpdateOnPropertyChange === true;
			}
		}
	};

	/**
	* Function to update the visual filter bar
	*
	* @param {array} aProperties - array of properties for which visual filter item should be added to BasicArea
	* @return {boolean} true if filter successfully added to basic area else false
	*/
	SmartVisualFilterBar.prototype.addVisualFiltersToBasicArea = function(aProperties) {
		var config = jQuery.extend(true, {}, this.getModel('_visualFilterConfigModel').getData()),
		iPropertiesLength = (aProperties && aProperties.constructor === Array && aProperties.length) ? aProperties.length : 0,
		iCountFiltersAddedtoBasicArea = 0;

		if (!config) {
			jQuery.sap.log.error("Could not add filter to basic area. No config found!");
			return false;
		} else if (!iPropertiesLength) {
			jQuery.sap.log.error("Improper parameter passed. Pass an array of properties.");
			return false;
		} else {
			for (var i = 0; i < config.filterCompList.length; i++) {
				var compConfig = config.filterCompList[i];
				if (aProperties.indexOf(FilterUtil.readProperty(compConfig.component.properties.parentProperty)) !== -1 && !compConfig.shownInFilterBar) {
					compConfig.shownInFilterBar = true;
					compConfig.shownInFilterDialog = true;
					iCountFiltersAddedtoBasicArea++;
				}
			}

			if (iCountFiltersAddedtoBasicArea) {
				// set the data
				this.getModel('_visualFilterConfigModel').setData(config);
				return true;
			} else {
				jQuery.sap.log.info("Filters already present in visual filter basic area");
				return false;
			}
		}
	};
	return SmartVisualFilterBar;
}, /* bExport= */true);
