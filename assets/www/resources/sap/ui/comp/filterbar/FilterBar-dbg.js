/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides control sap.ui.comp.filterbar.FilterBar.
sap.ui.define([
	'jquery.sap.global', 'sap/m/MultiInput', 'sap/m/Bar', 'sap/m/Button', 'sap/m/ButtonType', 'sap/m/CheckBox', 'sap/m/Label', 'sap/m/LabelDesign', 'sap/m/Link', 'sap/m/List', 'sap/m/ListSeparators', 'sap/m/Panel', 'sap/m/PlacementType', 'sap/m/SearchField', 'sap/m/Text', 'sap/m/Toolbar', 'sap/m/ToolbarSpacer', 'sap/ui/Device', 'sap/ui/comp/state/UIState', './VariantConverterFrom', './VariantConverterTo', 'sap/ui/comp/library', 'sap/ui/comp/smartvariants/PersonalizableInfo', 'sap/ui/comp/smartvariants/SmartVariantManagementUi2', 'sap/ui/comp/variants/VariantManagement', 'sap/ui/core/Icon', 'sap/ui/core/TextAlign', 'sap/ui/core/Title', 'sap/ui/core/ValueState', 'sap/ui/layout/Grid', 'sap/ui/layout/GridRenderer', 'sap/ui/layout/GridData', 'sap/ui/layout/HorizontalLayout', 'sap/ui/layout/ResponsiveFlowLayout', 'sap/ui/layout/ResponsiveFlowLayoutData', 'sap/ui/layout/VerticalLayout', 'sap/ui/layout/form/Form', 'sap/ui/layout/form/FormContainer', 'sap/ui/layout/form/FormElement', 'sap/ui/layout/form/ResponsiveGridLayout', 'sap/ui/layout/form/FormRenderer', 'sap/ui/comp/util/IdentifierUtil'
], function(jQuery, MultiInput, Bar, Button, ButtonType, CheckBox, Label, LabelDesign, Link, List, ListSeparators, Panel, PlacementType, SearchField, Text, Toolbar, ToolbarSpacer, Device, UIState, VariantConverterFrom, VariantConverterTo, library, PersonalizableInfo, SmartVariantManagementUi2, VariantManagement, Icon, TextAlign, Title, ValueState, Grid, GridRenderer, GridData, HorizontalLayout, ResponsiveFlowLayout, ResponsiveFlowLayoutData, VerticalLayout, Form, FormContainer, FormElement, ResponsiveGridLayout, FormRenderer, IdentifierUtil) {
	"use strict";

	/**
	 * Constructor for a new FilterBar.
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The control displays filters in a user-friendly manner to populate values for a query. The FilterBar consists of a row containing the
	 *        {@link sap.ui.comp.variants.VariantManagement VariantManagement} control, the related buttons, and an area underneath displaying the
	 *        filters. The filters are arranged in a logical row that is divided depending on the space available and the width of the filters. The
	 *        area containing the filters can be hidden or shown using the Hide FilterBar / Show FilterBar button. The Go button triggers the search
	 *        event, and the Filters button shows the filter dialog.<br>
	 *        In this dialog, the consumer has full control over the FilterBar. The filters in this dialog are displayed in one column and organized
	 *        in groups. The filter items of the <code>filterItems</code> aggregation are grouped in the Basic group . Each filter can be marked as
	 *        visible in the FilterBar by selecting Add to FilterBar. In addition, the items in the <code>filterGroupItems</code> aggregation can be
	 *        marked as part of the current variant. The FilterBar also supports a different UI layout when used inside a value help dialog. In this
	 *        case the FilterBar consists of two logical areas, one containing the general search button and one the Advanced Search area. The
	 *        Advanced Search is a collapsible area displaying the advanced filters in two columns.
	 * @extends sap.ui.layout.Grid
	 * @author SAP
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.filterbar.FilterBar
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) design-time meta model
	 */
	var FilterBar = Grid.extend("sap.ui.comp.filterbar.FilterBar", /** @lends sap.ui.comp.filterbar.FilterBar.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			designTime: true,
			properties: {

				/**
				 * Key used to access personalization data. Only if the persistencyKey is provided, will the <code>VariantManagement</code> control
				 * be used.
				 */
				persistencyKey: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				},

				/**
				 * The advanced mode is only relevant for the value help scenario. UI representation is different from the standard FilterBar.
				 */
				advancedMode: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Collapses/expands the advanced area.
				 * @deprecated Since version 1.30.0. Replaced by property <code>filterBarExpanded</code> This property is mapped to the
				 *             filterBarExpanded property.
				 */
				expandAdvancedArea: {
					type: "boolean",
					group: "Misc",
					defaultValue: false,
					deprecated: true
				},

				/**
				 * Enables/disables the Search button.
				 * @deprecated Since version 1.32.0.
				 */
				searchEnabled: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Shows/hides the filter row.
				 * @since 1.26.1
				 */
				filterBarExpanded: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * If this property is set, then the label for filters will be prefixed with the group title.
				 * @since 1.28.0
				 */
				considerGroupTitle: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Handles visibility of the Clear button on the Filters dialog.
				 * @since 1.26.1
				 */
				showClearButton: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Handles visibility of the Restore button on the Filters dialog.
				 * @since 1.26.1
				 */
				showRestoreButton: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Handles visibility of the Go button on the FilterBar.
				 * @since 1.28.0
				 */
				showGoOnFB: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Handles visibility of the Restore button on the FilterBar.
				 * @since 1.28.0
				 */
				showRestoreOnFB: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Handles visibility of the Clear button on the FilterBar.
				 * @since 1.28.0
				 */
				showClearOnFB: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Handles visibility of the Go button on the FilterBar.
				 * @since 1.26.1
				 * @deprecated Since version 1.28.0. Replaced by property <code>showGoOnFB</code>
				 */
				showGoButton: {
					type: "boolean",
					group: "Misc",
					defaultValue: null,
					deprecated: true
				},

				/**
				 * Stores the delta as compared to the standard variant.
				 * @since 1.34.0
				 */
				deltaVariantMode: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Sets the width of the filters container.
				 * @since 1.34.0
				 */
				filterContainerWidth: {
					type: "string",
					group: "Misc",
					defaultValue: "12rem"
				},

				/**
				 * Determines what design should be used. Default is the design with the toolbar. The design with the toolbar is always used on
				 * phones.
				 * @since 1.38.0
				 */
				useToolbar: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Specifies header text that is shown in the toolbar on the first position. This property is ignored, when <code>useToolbar</code>
				 * is set to <code>false</code>.
				 * @since 1.38.0
				 */
				header: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				},

				/**
				 * Handles visibility of the Filters button on the FilterBar.
				 * @since 1.38.0
				 */
				showFilterConfiguration: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Determines the behavior when <code>reset</code> is executed. <br>
				 * <b>Note:</b> This property is only relevant if no variant management is used, and the filter bar is not used in the advanced mode.
				 * A snapshot shows the current state of the filter bar, just before the Filters dialog is opened.
				 * <ul>
				 * <li><code>undefined</code> (default) defines the standard behavior: snapshot will be applied after <code>reset</code> was
				 * triggered</li>
				 * <li><code>false</code> defines that the snapshot will not be applied</li>
				 * <li><code>true</code>is not considered at all</li>
				 * </ul>
				 * @since 1.44
				 */
				useSnapshot: {
					type: "boolean",
					group: "Misc"
				}
			},
			aggregations: {

				/**
				 * Filters belonging to the basic group.
				 * @deprecated Since version 1.48.0. Use aggregation <code>filterGroupItems</code> instead.
				 */
				filterItems: {
					type: "sap.ui.comp.filterbar.FilterItem",
					multiple: true,
					singularName: "filterItem"
				},

				/**
				 * Contains all FilterBar filters. <br>
				 * <code>Note:</code>In case a filter has to be added to the basic group
				 * <ul>
				 * <li>the property <code>groupName</code> has to be set to the constant
				 * <code>sap.ui.comp.filterbar.FilterBar.INTERNAL_GROUP</code></li>
				 * <li>the property <code>groupLabel</code> will be handled internally and will be ignored, if set</li>
				 * <li>the property <code>partOfCurrentVariant</code> has to be set to <code>true</code></li>
				 * <li>if the property <code>visibleInFilterBar</code> is set to <code>true</code>, the property
				 * <code>partOfCurrentVariant</code> will be set internally also to <code>true</code></li>
				 * </ul>
				 */
				filterGroupItems: {
					type: "sap.ui.comp.filterbar.FilterGroupItem",
					multiple: true,
					singularName: "filterGroupItem"
				},

				/**
				 * Special handling for analytic parameters.
				 */
				_parameters: {
					type: "sap.ui.comp.filterbar.FilterGroupItem",
					multiple: true,
					singularName: "_parameter",
					visibility: "hidden"
				}
			},
			associations: {

				/**
				 * Populates the basic search area on the FilterBar and the Filters dialog.
				 * @since 1.30.0
				 */
				basicSearch: {
					type: "sap.m.SearchField",
					multiple: false
				}
			},
			events: {

				/**
				 * This event is fired when the Cancel button on the Filters dialog is pressed and the variant is marked as dirty.
				 */
				cancel: {},

				/**
				 * This event is fired when the Restore button is pressed.
				 */
				reset: {
					parameters: {
						/**
						 * Visible controls
						 */
						selectionSet: {
							type: "sap.ui.core.Control[]"
						}
					}
				},

				/**
				 * This event is fired when the Go button is pressed.
				 */
				search: {
					parameters: {
						/**
						 * Visible controls
						 */
						selectionSet: {
							type: "sap.ui.core.Control[]"
						}
					}
				},

				/**
				 * This event is fired before a variant is saved. The event can be used to adapt the data of the custom filters, which will be saved
				 * as variant later.
				 * @deprecated Since version 1.48.2. Replaced by the event <code>beforeVariantFetch</code>
				 */
				beforeVariantSave: {
					parameters: {
						/**
						 * Context of the event. Can also be <code>null</code> or <code>undefined</code>
						 */
						context: {
							type: "string"
						}
					}
				},

				/**
				 * This event is fired before a variant is fetched.
				 * @since 1.28.13
				 */
				beforeVariantFetch: {},

				/**
				 * This event is fired after a variant has been loaded and applied to the FilterBar. The event can be used to adapt custom filters
				 * with data from the variant.
				 */
				afterVariantLoad: {
					parameters: {
						/**
						 * Context of the event. Can also be <code>null</code> or <code>undefined</code>
						 */
						context: {
							type: "string"
						},
						/**
						 * executeOnSelect indicates if the variant will trigger search
						 * @since 1.44.0
						 */
						executeOnSelect: {
							type: "boolean"
						}
					}
				},

				/**
				 * This event is fired when a filter or multiple filters has changed.
				 */
				filterChange: {
					/**
					 * This property is provided, whenever a filter is added via the add/remove filters dialog.
					 */
					added: {
						type: "sap.ui.core.Control"
					},
					/**
					 * This property is provided, whenever a filter is removed via the add/remove filters dialog.
					 */
					deleted: {
						type: "sap.ui.core.Control"
					},

					/**
					 * The filter item is only provided along with added or deleted properties.
					 */
					filterItem: {
						type: "sap.ui.comp.filterbar.FilterGroupItem"
					}
				},

				/**
				 * This event is fired when the Clear button is pressed. The consumer has to clear all filters.
				 */
				clear: {
					parameters: {
						/**
						 * Visible controls
						 */
						selectionSet: {
							type: "sap.ui.core.Control[]"
						}
					}
				},

				/**
				 * This event is fired when the FilterBar is initialized to indicate that the meta data are available.
				 */
				initialise: {},

				/**
				 * This event is fired after the FilterBar was initialized and the standard variant was obtained. Eventual navigation related actions
				 * should be triggered by this event.
				 * @since 1.38.0
				 */
				initialized: {},

				/**
				 * This event is fired after a variant has been saved.
				 */
				afterVariantSave: {},

				/**
				 * This event is fired after the filters dialog is closed.
				 * @since 1.34.0
				 */
				filtersDialogClosed: {
					parameters: {
						/**
						 * Context of the event. Can also be <code>null</code> or <code>undefined</code>
						 */
						context: {
							type: "string"
						}
					}
				},

				/**
				 * This event is fired after the filters dialog is opened.
				 * @since 1.48.0
				 */
				filtersDialogBeforeOpen: {},

				/**
				 * This event is fired when the Cancel button on the filters dialog is pressed.
				 * @since 1.48.0
				 */
				filtersDialogCancel: {},

				/**
				 * This event is fired when the Go button on the filters dialog is pressed.
				 * @since 1.48.0
				 */
				filtersDialogSearch: {},

				/**
				 * This event is fired when search field of the filter dialog is changed.
				 * @since 1.48.0
				 */
				filtersDialogSearchForFilters: {
					parameters: {

						/**
						 * Contains the entered search filed value
						 */
						newValue: {
							type: "string"
						}
					}

				},

				/**
				 * This event is fired when the filters information has changed. It indicates specifically that the count of assigned filters may be
				 * changed. One of the intended reaction to this event would be to call <code>retrieveFiltersWithValuesAsText</code> method.
				 * @since 1.38.0
				 */
				assignedFiltersChanged: {}
			}
		},

		renderer: GridRenderer.render
	});

	FilterBar.INTERNAL_GROUP = "__$INTERNAL$";

	/**
	 * Initializes the FilterBar control.
	 * @private
	 */
	FilterBar.prototype.init = function() {

		this._oBasicAreaLayout = null;
		this._oVariantManagement = null;
		this._oCollectiveSearch = null;

		this._aBasicAreaSelection = null;
		this._mAdvancedAreaFilter = null;

		this._fRegisteredFetchData = null;
		this._fRegisteredApplyData = null;
		this._fRegisterGetFiltersWithValues = null;
		this._oHideShowButton = null;
		this._oSearchButton = null;
		this._oFiltersButton = null;
		this._oClearButtonOnFB = null;
		this._oRestoreButtonOnFB = null;

		this._oDialog = null;
		this._oFilterDialog = null;

		this._bIsInitialized = false;

		this._aFields = null;

		this._oBasicSearchField = null;

		this._oVariant = {};

		this._filterChangeSemaphore = true;
		this._triggerFilterChangeState = true;

		this._fRegisteredFilterChangeHandlers = null;
		this._fInitialiseVariants = null;

		this._bHostedVariantManagement = false;

		this._bDoItOnce = false;
		this._oLabelTextWidth = 0;

		this._oRb = sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp");

		this.setHSpacing(0);

		this.addStyleClass("sapUiCompFilterBar");
		if (this._isPhone()) {
			this.addStyleClass("sapUiCompFilterBarPhone");
		} else {
			this.addStyleClass("sapUiCompFilterBarNonPhone");
		}

		this.addStyleClass("sapUiCompFilterBarMarginBottom");
		this.addStyleClass("sapUiCompFilterBarPaddingPanel");
		this.addStyleClass("sapContrastPlus");

		this._oToolbar = this._createToolbar();
		this._oToolbar.setLayoutData(new GridData({
			span: "L12 M12 S12"
		}));
		this.addContent(this._oToolbar);

		// Basic
		this._oBasicAreaLayout = this._createBasicAreaLayout();
		this._oBasicAreaLayout.setLayoutData(new GridData({
			span: "L12 M12 S12"
		}));
		this.addContent(this._oBasicAreaLayout);

		// Advanced
		this._oAdvancedPanel = new Panel();
		this._oAdvancedPanel.setLayoutData(new GridData({
			span: "L12 M12 S12"
		}));

		this._oAdvancedPanel.setVisible(false);
		this._oAdvancedAreaForm = this._createAdvancedAreaForm();
		this._oAdvancedPanel.addContent(this._oAdvancedAreaForm);

		this.addContent(this._oAdvancedPanel);

		// register event handler for resizing
		// jQuery(window).on("resize." + this.getId(), this._fHandleResize.bind(this));
		this._hResizeListener = sap.ui.core.ResizeHandler.register(this._oBasicAreaLayout, this._fHandleResize.bind(this));

		this.oModel = new sap.ui.model.json.JSONModel({});
		this.setModel(this.oModel, "FilterBar");

		this._oHintText = new Text({
			text: this._oRb.getText("FILTER_BAR_NO_FILTERS_ON_FB"),
			textAlign: TextAlign.Center
		});
		this._oHintText.setVisible(false);
		this._oHintText.addStyleClass("sapUiCompFilterBarHint");
		this._oBasicAreaLayout.addContent(this._oHintText);

		if (this._isTablet() || this._isPhone()) {
			this.setFilterBarExpanded(false);
		}

	};

	FilterBar.prototype._hasAnyVisibleFiltersOnFB = function() {

		var aItems = this._retrieveVisibleAdvancedItems();

		for (var i = 0; i < aItems.length; i++) {
			if (aItems[i].filterItem.getVisibleInFilterBar()) {
				return true;
			}
		}

		return false;
	};

	FilterBar.prototype._showHintText = function() {

		var i = 0;

		if (!this._oHintText) {
			return;
		}

		if (!this.getAdvancedMode() && !this._isPhone()) {

			var bFlag = !this._hasAnyVisibleFiltersOnFB();

			if (bFlag && this._mAdvancedAreaFilter) {
				i = this._oBasicAreaLayout.indexOfContent(this._oHintText);
				if (i < 0) {
					this._oBasicAreaLayout.insertContent(this._oHintText, 0);
				}
			}

			this._oHintText.setVisible(bFlag);

			if (i < 0) {
				this._oBasicAreaLayout.rerender();
			}
		}
	};

	FilterBar.prototype._hasRelevantFilters = function() {
		var i, n = null, oItem;

		if (!this._mAdvancedAreaFilter || (Object.keys(this._mAdvancedAreaFilter) < 1)) {
			return false;
		}

		if (this.getAdvancedMode()) {
			for (n in this._mAdvancedAreaFilter) {
				var oGroupElement = this._mAdvancedAreaFilter[n];
				if (oGroupElement && oGroupElement.items) {
					for (i = 0; i < oGroupElement.items.length; i++) {
						oItem = oGroupElement.items[i];
						if (oItem) {
							if (this._determineVisibility(oItem.filterItem)) {
								return true;
							}
						}
					}
				}
			}

			return false;
		}

		return true;
	};

	FilterBar.prototype._adaptButtonsEnablement = function() {

		var bFlag = false || !!this._mAdvancedAreaFilter;

		if (this._oHideShowButton) {
			this._oHideShowButton.setEnabled(bFlag);
			if (this.getAdvancedMode() && !this._isPhone()) {
				this._oHideShowButton.setVisible(this._hasRelevantFilters());
			}
		}
		this._oClearButtonOnFB.setEnabled(bFlag);
		this._oRestoreButtonOnFB.setEnabled(bFlag);
		this._oFiltersButton.setEnabled(bFlag);

		if (bFlag && this.getFilterBarExpanded() && !this._isPhone() && !this.getAdvancedMode()) {
			this._oBasicAreaLayout.setVisible(true);
		}
	};

	/**
	 * Returns the associated VariantManagement control. The returned VariantManagement instance should not be cached or manipulated in any ways. It
	 * should offer the application a convenient way to verify the dirty state and to check for page variant scenario. The method may return
	 * <code>null</code> or a disabled VariantManagement control.
	 * @public
	 * @since 1.44.0
	 * @returns {sap.ui.comp.variants.VariantManagement} the associated VariantManagement control.
	 */
	FilterBar.prototype.getVariantManagement = function() {
		return this._oVariantManagement;
	};

	FilterBar.prototype.setShowClearOnFB = function(bFlag) {

		if (!this._isPhone()) {
			this.setProperty("showClearOnFB", bFlag);
			this._oClearButtonOnFB.setVisible(bFlag);
		}

		return this;
	};

	FilterBar.prototype.setShowRestoreOnFB = function(bFlag) {

		if (!this._isPhone()) {
			this.setProperty("showRestoreOnFB", bFlag);
			this._oRestoreButtonOnFB.setVisible(bFlag);
		}

		return this;
	};

	FilterBar.prototype.setShowGoOnFB = function(bFlag) {

		this.setProperty("showGoOnFB", bFlag);

		this._calcVisibilityGoButton();

		return this;
	};

	/**
	 * Handles the visibility of the Go button on FilterBar.
	 * @private
	 */
	FilterBar.prototype._calcVisibilityGoButton = function() {

		var bFlag = this.getShowGoOnFB();
		if (bFlag && !this._isPhone() && this.isLiveMode && this.isLiveMode()) {
			bFlag = false;
		}

		this._oSearchButton.setVisible(bFlag);
	};

	FilterBar.prototype.setShowGoButton = function(bFlag) {

		this.setShowGoOnFB(bFlag);

		return this;
	};

	FilterBar.prototype.getShowGoButton = function() {

		return this.getShowGoOnFB();
	};

	/**
	 * Hides the Go button on FilterBar. Allows to hide the Go-button for dedicated scenarios, like liveMode.
	 * @protected
	 * @since 1.40.4
	 */
	FilterBar.prototype.hideGoButton = function() {
		this._oSearchButton.setVisible(false);
	};

	/**
	 * Restores the visibility of the Go button on FilterBar. The visibilty of the Go button will be set, according to the showGoOnFB property.
	 * @protected
	 * @since 1.40.4
	 */
	FilterBar.prototype.restoreGoButton = function() {
		this._oSearchButton.setVisible(this.getShowGoOnFB());
	};

	FilterBar.prototype.setShowFilterConfiguration = function(bFlag) {
		this.setProperty("showFilterConfiguration", bFlag);

		if (this._oFiltersButton && !this._isPhone()) {
			this._oFiltersButton.setVisible(bFlag);
		}

		return this;
	};

	/**
	 * Determines if the current variant is the standard variant
	 * @public
	 * @since 1.44.0
	 * @returns {boolean| undefined} indicates if the current variant is the standard variant. In case the variant management does not exists,
	 *          <code>undefined</code> is returned.
	 */
	FilterBar.prototype.isCurrentVariantStandard = function() {

		var sKey;
		if (this._oVariantManagement) {
			sKey = this._oVariantManagement.getCurrentVariantId();
			if (sKey === "") {
				return true;
			}
			return (sKey === this._oVariantManagement.getStandardVariantKey());
		}

		return undefined;
	};

	/**
	 * Sets the current variant ID.
	 * @public
	 * @since 1.28.0
	 * @param {string} sVariantId ID of the variant
	 * @param {boolean} bDoNotApplyVariant If set to <code>true</code>, the <code>applyVariant</code> method is not executed yet. Relevant during
	 *        navigation, when called before the initialise event has been executed.
	 */
	FilterBar.prototype.setCurrentVariantId = function(sVariantId, bDoNotApplyVariant) {

		if (this._oVariantManagement) {
			this._oVariantManagement.setCurrentVariantId(sVariantId, bDoNotApplyVariant);
		}
	};

	/**
	 * Retrieves the current variant ID.
	 * @public
	 * @since 1.28.0
	 * @returns {string} ID of the current variant
	 */
	FilterBar.prototype.getCurrentVariantId = function() {

		var sKey = "";

		if (this._oVariantManagement) {
			sKey = this._oVariantManagement.getCurrentVariantId();
		}

		return sKey;
	};

	/**
	 * Retrieves the current variant as selection variant for UI navigation
	 * @public
	 * @since 1.28.0
	 * @deprecated As of version 1.48, replaced by {@link sap.ui.comp.filterbar.FilterBar.html#getUiState}
	 * @param {boolean} bConsiderAllFilters also include empty/invisible fields filter data
	 * @returns {string} JSON string representing the selection variant for UI navigation; <code>null</code> otherwise
	 */
	FilterBar.prototype.getDataSuiteFormat = function(bConsiderAllFilters) {

		return this._getDataSuiteFormat(bConsiderAllFilters, null);
	};

	FilterBar.prototype._getDataSuiteFormat = function(bConsiderAllFilters, sVersion) {

		var sSuiteVariant = null;
		var sKey, sContent, aFiltersInfo;

		if (this._oVariantManagement) {
			sKey = this.getCurrentVariantId();

			if (this.getFilterDataAsString) {
				aFiltersInfo = this._determineVariantFiltersInfo(bConsiderAllFilters, true);

				sContent = this.getFilterDataAsString(bConsiderAllFilters);
				if (sContent) {
					var oConverter = new VariantConverterTo();
					sSuiteVariant = oConverter.convert(sKey, aFiltersInfo, sContent, this, sVersion);
				}
			}
		}

		return sSuiteVariant;
	};

	/**
	 * Determine the internal basic search field name.
	 * @protected
	 * @returns {string} name of the basic search field.
	 */
	FilterBar.prototype.getBasicSearchName = function() {

		var sBasicSearchFieldName = null;

		if (this._oBasicSearchField && this.getEntitySet) {
			sBasicSearchFieldName = "$" + this.getEntitySet() + ".basicSearch";
		}

		return sBasicSearchFieldName;
	};

	/**
	 * Determine the value of the basic search.
	 * @protected
	 * @returns {string} current value of the basic search field.
	 */
	FilterBar.prototype.getBasicSearchValue = function() {
		return this._getBasicSearchValue();
	};

	/**
	 * Retrieves the current UI state of the <code>FilterBar</code> control.<br>
	 * The current UI state represents the data suite format.
	 * @public
	 * @since 1.48
	 * @param {map} mProperties controls the API behavior
	 * @param {boolean} mProperties.allFilters include empty/invisible fields filter data. Default is <code>false</code>
	 * @returns {sap.ui.comp.state.UIState} object representing the ui-state. Currently only the SelectionVariant part is considered.
	 */
	FilterBar.prototype.getUiState = function(mProperties) {
		var sSelectionVariant, bConsiderAllFilters = false;

		if (mProperties) {
			bConsiderAllFilters = (mProperties.allFilters === true);
		}

		sSelectionVariant = this._getDataSuiteFormat(bConsiderAllFilters, "13.0");

		return new UIState({
			selectionVariant: JSON.parse(sSelectionVariant)
		});
	};

	/**
	 * Sets the current UI state of the <code>FilterBar</code> control.<br>
	 * The current UI state represents the data suite format.
	 * @public
	 * @since 1.48
	 * @param {sap.ui.comp.state.UIState} oUiState object representing the ui-state. Currently only the SelectionVariant part is considered.
	 * @param {map} mProperties controls the API behavior
	 * @param {boolean} mProperties.replace Replaces existing filter data
	 * @param {boolean} mProperties.strictMode defines the filter/parameter determination, based on the name.<BR>
	 *        <ul>
	 *        <li><code>true</code> determine filter based on name; in case no match is found, try to map to parameter (parameter has to start with
	 *        P_ prefix.</li>
	 *        <li><code>false</code> try to determine parameter based on name, P_ -prefix may be omitted; in case no match is found, try to map to
	 *        a filter.</li>
	 *        </ul>
	 */
	FilterBar.prototype.setUiState = function(oUiState, mProperties) {
		var sSelectionVariant, oSelectionVariant = null, bReplace = false, bStrictMode = true;

		if (mProperties) {
			bReplace = (mProperties.replace === true);
			bStrictMode = (mProperties.strictMode === true);
		}

		if (oUiState) {
			oSelectionVariant = oUiState.getSelectionVariant();
			if (oSelectionVariant) {
				sSelectionVariant = JSON.stringify(oSelectionVariant);
			}
		}

		this._setDataSuiteFormat(sSelectionVariant, bReplace, bStrictMode);
	};

	/**
	 * Sets the selection variant for UI navigation to FilterBar.
	 * @public
	 * @since 1.28.0
	 * @deprecated As of version 1.48, replaced by {@link sap.ui.comp.filterbar.FilterBar.html#setUiState}
	 * @param {string} sSuiteData Represents the selection variants for UI navigation
	 * @param {boolean} bReplace Replaces existing filter data
	 */
	FilterBar.prototype.setDataSuiteFormat = function(sSuiteData, bReplace) {

		this._setDataSuiteFormat(sSuiteData, bReplace, true);

	};

	FilterBar.prototype._setDataSuiteFormat = function(sSuiteData, bReplace, bStrictMode) {

		var oConverter, oContent;

		if (sSuiteData) {

			oConverter = new VariantConverterFrom();
			oContent = oConverter.convert(sSuiteData, this, bStrictMode);
			if (oContent) {

				if (oContent.variantId && this._oVariantManagement) {

					if (this._bIsInitialized) {
						if (this._oVariantManagement.isPageVariant()) {
							this._oVariantManagement._selectVariant(oContent.variantId, "DATA_SUITE");
						} else {
							this._setFilterVisibility(oContent.variantId);
						}
					}

					this._oVariantManagement.setInitialSelectionKey(oContent.variantId);
				}

				if (oContent.payload && (bReplace || (Object.keys(JSON.parse(oContent.payload)).length > 0)) && this.setFilterDataAsString) {
					this.setFilterDataAsString(oContent.payload, bReplace);
				}

				if (oContent.basicSearch && this._oBasicSearchField && this._oBasicSearchField.setValue) {
					this._oBasicSearchField.setValue("" || oContent.basicSearch);

					this._updateToolbarText();
				}

			}
		}
	};

	FilterBar.prototype._setFilterVisibility = function(sVariantId) {

		if (this._oVariantManagement.getSelectionKey() !== sVariantId) {
			this._oVariantManagement.setInitialSelectionKey(sVariantId);

			var oStandardVariant = this._getStandardVariant();
			if (oStandardVariant) {
				var oVariant = this._oVariantManagement.getVariantContent(this, sVariantId);
				if (oVariant && oVariant.filterbar) {
					if (oVariant.version === "V2") {
						oVariant = this.mergeVariant(oStandardVariant, oVariant);
					}

					this._reapplyVisibility(oVariant.filterbar);
				}
			}
		}
	};

	FilterBar.prototype.applySettings = function(mSettings) {

		if (this._possibleToChangeVariantManagement()) {
			if (mSettings && mSettings.customData) {
				for (var i = 0; i < mSettings.customData.length; i++) {
					var oCustomData = mSettings.customData[i];
					if (oCustomData && oCustomData.mProperties && oCustomData.mProperties.key === "pageVariantPersistencyKey") {
						this._oVariantManagement.setPersistencyKey(oCustomData.mProperties.value);
						this._oVariantManagement.setVisible(true);
						this._bHostedVariantManagement = true;
					}
				}
			}
		}

		if (mSettings && mSettings.persistencyKey) {
			this._bHostedVariantManagement = true;
		}

		this._applyLayoutDataToToolbarButtons();

		Grid.prototype.applySettings.apply(this, arguments);
	};

	FilterBar.prototype._applyLayoutDataToToolbarButtons = function(sPersistenceKey) {
		jQuery.sap.require("sap.m.ToolbarLayoutData");

		if (this._isPhone() || this._isTablet() || this.getAdvancedMode() || !this.getUseToolbar()) {
			return;
		}

		this._oHideShowButton.setLayoutData(new sap.m.ToolbarLayoutData({
			shrinkable: true
		}));

		this._oClearButtonOnFB.setLayoutData(new sap.m.ToolbarLayoutData({
			shrinkable: true
		}));

		this._oRestoreButtonOnFB.setLayoutData(new sap.m.ToolbarLayoutData({
			shrinkable: true
		}));

		this._oFiltersButton.setLayoutData(new sap.m.ToolbarLayoutData({
			shrinkable: true
		}));

		this._oSearchButton.setLayoutData(new sap.m.ToolbarLayoutData({
			shrinkable: false
		}));

	};

	FilterBar.prototype.setPersistencyKey = function(sPersistenceKey) {

		this.setProperty("persistencyKey", sPersistenceKey);

		if (this._possibleToChangeVariantManagement()) {
			this._oVariantManagement.setVisible(true);
		}

		return this;

	};

	FilterBar.prototype._possibleToChangeVariantManagement = function() {
		if (this._oVariantManagement && !this._oVariantManagement.isPageVariant()) {
			return true;
		}

		return false;
	};

	/**
	 * Resets the current selection in the variant management control to standard.
	 * @public
	 */
	FilterBar.prototype.clearVariantSelection = function() {

		if (this._oVariantManagement) {
			this._oVariantManagement.clearVariantSelection();
		}
	};

	FilterBar.prototype.setSearchEnabled = function(bValue) {

		this.setProperty("searchEnabled", bValue);

		if (this._oSearchButton) {
			this._oSearchButton.setEnabled(bValue);
		}

		return this;
	};

	/**
	 * Sets the type of the Search to Emphasize.
	 * @private
	 * @param {boolean} bSetEmphasize Sets the type to Emphasize or Default
	 * @deprecated Since 1.30.0
	 */
	FilterBar.prototype.setSearchButtonEmphType = function(bSetEmphasize) {

	};

	/**
	 * Sets the simplified mode.
	 * @param {boolean} bFlag Sets the simplified mode
	 * @private
	 * @deprecated Since 1.30.0
	 */
	FilterBar.prototype.setSimplifiedMode = function(bFlag) {

		// the simplified mode is with beginning of 1.25 always implicitly used.
		// The former setter-method method stays in place, so that the former usages do not have to be adapted.
	};

	/**
	 * Retrieves the simplified mode.
	 * @returns {boolean} Indicates if the current advanced mode is set
	 * @private
	 * @deprecated Since 1.30.0
	 */
	FilterBar.prototype.getSimplifiedMode = function() {

		if (this.getAdvancedMode()) {
			return false;
		}

		return true;
	};

	/**
	 * Sets the advanced area to collapsed or expanded mode.
	 * @private
	 * @param {boolean} bFlag Sets the advanced area to expanded/collapsed
	 * @deprecated Since 1.30.0
	 */
	FilterBar.prototype.setExpandAdvancedArea = function(bFlag) {

		this.setFilterBarExpanded(bFlag);
	};

	/**
	 * Determines if the advanced area is displayed collapsed or expanded.
	 * @private
	 * @returns {boolean} The state of the advanced area
	 * @deprecated Since 1.30.0
	 */
	FilterBar.prototype.getExpandAdvancedArea = function() {

		return this.getFilterBarExpanded();
	};

	FilterBar.prototype.setAdvancedMode = function(bFlag) {

		this.setProperty("advancedMode", bFlag);

		this.toggleStyleClass("sapContrastPlus", !bFlag);

		if (bFlag) {
			if (this._possibleToChangeVariantManagement()) {
				this._oVariantManagement.setVisible(false);
			}

			if (this._oToolbar) {
				this._oToolbar.addStyleClass("sapUiCompFilterBarToolbarBasicSearchNoVariant");

				if (this._oBasicSearchField) {
					if (this._oToolbar.indexOfContent(this._oBasicSearchField) < 0) {
						this._oToolbar.insertContent(this._oBasicSearchField, 1);
					}
				}
			}

		} else {
			/* eslint-disable no-lonely-if */
			if (this.getPersistencyKey() && this._possibleToChangeVariantManagement()) {
				if (this._oVariantManagement) {
					this._oVariantManagement.setVisible(true);
				}
				if (this._oToolbar) {
					this._oToolbar.removeStyleClass("sapUiCompFilterBarToolbarBasicSearchNoVariant");
				}
			}
			/* eslint-enable no-lonely-if */
		}

		this._oFiltersButton.setVisible(!bFlag);

		if (this._oHideShowButton) {
			this._oHideShowButton.setVisible((bFlag && this._isPhone()) ? false : true);
		}

		this._oBasicAreaLayout.setVisible(!bFlag && this.getFilterBarExpanded());
		this._oAdvancedPanel.setVisible(bFlag && this.getFilterBarExpanded());

		this._adaptButtonsEnablement();

		return this;
	};

	FilterBar.prototype.setUseToolbar = function(bValue) {

		this.setProperty("useToolbar", bValue);

		if (!bValue) {
			this._adaptNewFilterBarDesign();
		} else {
			this._recreateToolbar();
		}

		return this;
	};

	FilterBar.prototype._recreateToolbar = function() {

		if (!this._oToolbar) {

			this._bButtonaAdded = false;

			if (this._oButtonsVLayout) {
				this._oBasicAreaLayout.removeContent(this._oButtonsVLayout);
				this._oButtonsVLayout.destroy();
				this._oButtonsVLayout = null;
			}

			this._oToolbar = this._createToolbar(true);
			this._oToolbar.setLayoutData(new GridData({
				span: "L12 M12 S12"
			}));
			this.insertContent(this._oToolbar, 0);

			if (this._oVariantManagement) {

				if (this._oVariantManagement instanceof SmartVariantManagementUi2 || ((this._oVariantManagement.getId() === (this.getId() + "-variant")))) {
					this._oToolbar.insertContent(this._oVariantManagement, 0);
				}
			}

			this._adaptButtonsEnablement();

			if (this._oBasicSearchFieldContainer) {
				this._oBasicAreaLayout.removeContent(this._oBasicSearchFieldContainer);

				this._cleanBasicSearchContainer();

				this.setBasicSearch(this._oBasicSearchField);
			}

			this._oHintText = new Text({
				text: this._oRb.getText("FILTER_BAR_NO_FILTERS_ON_FB"),
				textAlign: TextAlign.Center
			});
			this._oHintText.setVisible(false);
			this._oHintText.addStyleClass("sapUiCompFilterBarHint");
			this._oBasicAreaLayout.addContent(this._oHintText);

			this._updateToolbarText();
		}
	};

	FilterBar.prototype._cleanBasicSearchContainer = function() {
		if (this._oBasicSearchFieldContainer) {

			var aContent = this._oBasicSearchFieldContainer.removeAllContent();
			if (aContent) {
				for (var i = 0; i < aContent.length; i++) {
					if (aContent[i] !== this._oBasicSearchField) {
						aContent[i].destroy();
					}
				}
			}
			this._oBasicSearchFieldContainer.destroy();
			this._oBasicSearchFieldContainer = null;
		}
	};

	FilterBar.prototype.setHeader = function(sValue) {

		this.setProperty("header", sValue);

		if (this.getUseToolbar()) {
			this._addHeaderToToolbar(sValue);
		}

		return this;
	};

	FilterBar.prototype._addHeaderToToolbar = function(sValue) {

		if (this._oToolbar) {

			if (this._oVariantManagement && (this._oVariantManagement.getVisible() || this._bHostedVariantManagement) && (this._oToolbar.indexOfContent(this._oVariantManagement) > -1)) {
				if (!this._oSeparator) {
					jQuery.sap.require("sap.m.ToolbarSeparator");
					this._oSeparator = new sap.m.ToolbarSeparator();
					this._oToolbar.setHeight("3rem");
				}

				this._oToolbar.removeContent(this._oSeparator);
				this._oToolbar.insertContent(this._oSeparator, 0);
			}

			if (!this._oText) {
				this._oText = new Text();
				this._oText.addStyleClass("sapMH4Style");
				this._oText.addStyleClass("sapUiCompSmartChartHeader");
			}

			this._oText.setText(sValue);
			this._oToolbar.removeContent(this._oText);
			this._oToolbar.insertContent(this._oText, 0);
		}
	};

	FilterBar.prototype._isNewFilterBarDesign = function() {
		if (this.getAdvancedMode() /* || this._isPhone() */) {
			return false;
		}

		if (!this.getUseToolbar()) {
			return true;
		}

		return false;

	};

	FilterBar.prototype._adaptNewFilterBarDesign = function() {
		if (this._isNewFilterBarDesign()) {

			this.setFilterBarExpanded(true);
			this._oBasicAreaLayout.setVisible(true);

			if (this.getUseToolbar()) {
				var aContent = this._oToolbar.getContent();
				for (var i = aContent.length - 1; i > 0; i--) {
					this._oToolbar.removeContent(aContent[i]);
				}
			} else {
				/* eslint-disable no-lonely-if */
				if (this._oToolbar) {
					this.removeContent(this._oToolbar);
					this._oToolbar.removeAllContent();
					this._oToolbar.destroy();
					this._oToolbar = null;
				}
				/* eslint-enable no-lonely-if */
			}

			if (this._oHintText) {
				this._oBasicAreaLayout.removeContent(this._oHintText);
				this._oHintText.destroy();
				this._oHintText = null;
			}

			if (this._oHideShowButton) {
				this._oHideShowButton.destroy();
				this._oHideShowButton = null;
			}

			if (!this._bButtonaAdded) {
				this._bButtonaAdded = true;
				this._addButtonsToBasicArea();
			}

			if (this._oBasicSearchField) {
				this.setBasicSearch(this._oBasicSearchField);
			}

		}
	};

	FilterBar.prototype._addButtonsToBasicArea = function() {

		var oVLayout = new VerticalLayout();

		if (sap.ui.getCore().getConfiguration().getRTL()) {
			oVLayout.addStyleClass("sapUiCompFilterBarFloatLeft");
		} else {
			oVLayout.addStyleClass("sapUiCompFilterBarFloatRight");
		}

		var oHLayout = new HorizontalLayout();
		oHLayout.setLayoutData(new ResponsiveFlowLayoutData({
			margin: true
		}));
		oVLayout.addContent(new Text());
		oVLayout.addContent(oHLayout);

		oHLayout.addContent(this._oClearButtonOnFB);
		this._oClearButtonOnFB.addStyleClass("sapUiCompFilterBarPaddingRightBtn");

		oHLayout.addContent(this._oRestoreButtonOnFB);
		this._oRestoreButtonOnFB.addStyleClass("sapUiCompFilterBarPaddingRightBtn");

		oHLayout.addContent(this._oFiltersButton);
		this._oFiltersButton.addStyleClass("sapUiCompFilterBarPaddingRightBtn");

		oHLayout.addContent(this._oSearchButton);

		this._updateToolbarText();

		oVLayout.addStyleClass("sapUiCompFilterBarPaddingRight");

		if (this._isPhone()) {
			oVLayout.addStyleClass("sapUiCompFilterBarRemoveMinWidth");
			this._oBasicAreaLayout.insertContent(oVLayout, 0);
		} else {
			oVLayout.addStyleClass("sapUiCompFilterBarPaddingTop");
			this._oBasicAreaLayout.addContent(oVLayout);
		}

		this._oButtonsVLayout = oVLayout;

	};

	FilterBar.prototype._addBasicSearchToBasicArea = function(oBasicSearchField) {

		var nWidth = null;
		if (this._oBasicSearchFieldContainer) {
			if (this._oBasicSearchFieldContainer.$()) {
				nWidth = this._oBasicSearchFieldContainer.$().width();
			}
			if (!nWidth) {
				nWidth = this._oBasicSearchFieldContainer.getWidth();
			}

			this._cleanBasicSearchContainer();
		}

		if (oBasicSearchField) {

			var oLabel = new Label({
				text: "\u2008"
			});
			oLabel.addStyleClass("sapBasicSearchFilter");
			var oContainer = this._addControlToBasicAreaContainer(null, oBasicSearchField, oLabel);
			if (oContainer) {
				oContainer.setVisible(true);
				var nPos = 0;
				if (this._isPhone()) {
					nPos = 1;
				}
				this._oBasicAreaLayout.insertContent(oContainer, nPos);
				this._oBasicSearchFieldContainer = oContainer;

				if (nWidth) {
					if (typeof nWidth === 'string') {
						this._oBasicSearchFieldContainer.setWidth(nWidth);
					} else {
						this._oBasicSearchFieldContainer.setWidth(nWidth + "px");
					}
				}
			}
		}
	};

	FilterBar.prototype._setCollectiveSearch = function(oCollectiveSearch) {
		if (this.getAdvancedMode()) {
			if (this._oToolbar) {
				if (this._oVariantManagement) {
					this._oToolbar.removeContent(this._oVariantManagement);
					this._unregisterVariantManagement(this._oVariantManagement);
					this._oVariantManagement = null;
				}

				if (this._oCollectiveSearch) {
					this._oToolbar.removeContent(this._oCollectiveSearch);
				}
				this._oCollectiveSearch = oCollectiveSearch;
				this._oToolbar.insertContent(this._oCollectiveSearch, 0);

				this._oToolbar.removeStyleClass("sapUiCompFilterBarToolbarBasicSearchNoVariant");
			}
		}
	};

	FilterBar.prototype.setBasicSearch = function(oBasicSearchField) {
		var that = this;

		this.setAssociation("basicSearch", oBasicSearchField, true);

		if (typeof oBasicSearchField === "string") {
			oBasicSearchField = sap.ui.getCore().byId(oBasicSearchField);
		}

		if (this._oBasicSearchField && this._oToolbar) {
			this._oToolbar.removeContent(this._oBasicSearchField);
		}

		if (oBasicSearchField && this._isNewFilterBarDesign()) {
			this._addBasicSearchToBasicArea(oBasicSearchField);
		} else {

			/* eslint-disable no-lonely-if */
			if (oBasicSearchField && this._oToolbar && (!this._isPhone() || this.getAdvancedMode())) {

				var nIdx = this._indexOfSpacerOnToolbar();
				this._oToolbar.insertContent(oBasicSearchField, nIdx);
				if (this._isUi2Mode()) {
					oBasicSearchField.attachLiveChange(function(oEvent) {
						that.fireFilterChange(oEvent);
					});
				}
			}
			/* eslint-enable no-lonely-if */
		}

		this._oBasicSearchField = oBasicSearchField;

		return this;
	};

	FilterBar.prototype._getBasicSearchValue = function() {
		if (this._oBasicSearchField && this._oBasicSearchField.getValue) {
			return this._oBasicSearchField.getValue();
		}

		return null;
	};

	FilterBar.prototype._indexOfSpacerOnToolbar = function() {
		var aItems = this._oToolbar.getContent(), i;
		if (aItems) {
			for (i = 0; i < aItems.length; i++) {
				if (aItems[i] instanceof ToolbarSpacer) {
					return i;
				}
			}
		}

		return 0;
	};

	/*
	 * @public Add a FilterItem to the <code>filterItems</code> aggregation.
	 * @deprecated Since version 1.48.0. Use aggregation <code>filterGroupItems</code> instead.
	 */
	FilterBar.prototype.addFilterItem = function(oFilterItem) {

		var sName, oControl, oFilterGroupItem;

		if (!oFilterItem) {
			throw new Error("sap.ui.comp.filterbar.FilterBar.prototype.addFilterItem()" + " Expected argument 'oFilterItem' may not be null nor empty");
		}

		sName = oFilterItem.getName();
		if (!sName) {
			throw new Error("sap.ui.comp.filterbar.FilterBar.prototype.addFilterItem()" + " Expected argument 'oFilterItem.name' may not be null nor empty");
		}

		oControl = oFilterItem.getControl();
		if (!oControl) {
			throw new Error("sap.ui.comp.filterbar.FilterBar.prototype.addFilterItem()" + " Expected argument 'oFilterItem.control' may not be null nor empty");
		}

		this.addAggregation("filterItems", oFilterItem, true);

		// has to be initialized before the call to the container creation
		if (!this._aBasicAreaSelection) {
			this._aBasicAreaSelection = [];
		}

		var oObj = {
			control: oFilterItem.getControl(),
			filterItem: oFilterItem
		};
		this._aBasicAreaSelection.push(oObj);

		oFilterGroupItem = new sap.ui.comp.filterbar.FilterGroupItem({
			label: oFilterItem.getLabel(),
			labelTooltip: oFilterItem.getLabelTooltip(),
			name: oFilterItem.getName(),
			mandatory: oFilterItem.getMandatory(),
			visible: oFilterItem.getVisible(),
			visibleInFilterBar: oFilterItem.getVisibleInFilterBar(),
			partOfCurrentVariant: true,
			control: oFilterItem.getControl(),
			groupName: FilterBar.INTERNAL_GROUP,
			groupTitle: "",
			hiddenFilter: oFilterItem.getHiddenFilter()
		});

		if (oFilterItem.data('isCustomField')) {
			oFilterGroupItem.data('isCustomField', true);
		}

		oFilterItem.attachChange(this._filterItemChange.bind(this, null));

		this.addFilterGroupItem(oFilterGroupItem);

		return this;
	};

	FilterBar.prototype.addFilterGroupItem = function(oFilterGroupItem) {

		var sName, sGroupName, oObj, oContainer;

		if (!oFilterGroupItem) {
			throw new Error("sap.ui.comp.filterbar.FilterBar.prototype.addFilterGroupItem()" + " Expected argument 'oFilterGroupItem' may not be null nor empty");
		}

		this.addAggregation("filterGroupItems", oFilterGroupItem, true);

		sGroupName = oFilterGroupItem.getGroupName();
		if (!sGroupName) {
			throw new Error("sap.ui.comp.filterbar.FilterBar.prototype.addFilterGroupItems()" + " GroupName may not be null nor empty");
		}

		sName = oFilterGroupItem.getName();
		if (!sName) {
			throw new Error("sap.ui.comp.filterbar.FilterBar.prototype.addFilterGroupItems()" + " Name may not be null nor empty");
		}

		if (!this._mAdvancedAreaFilter) {
			this._mAdvancedAreaFilter = {};
		}
		if (!this._mAdvancedAreaFilter[sGroupName]) {
			this._mAdvancedAreaFilter[sGroupName] = {};
			this._mAdvancedAreaFilter[sGroupName].filterItem = null;
			this._mAdvancedAreaFilter[sGroupName].items = [];
		}

		if (!this._mAdvancedAreaFilter[sGroupName].items) {
			this._mAdvancedAreaFilter[sGroupName].items = [];
		}

		if (!this._mAdvancedAreaFilter[sGroupName].filterItem) {
			this._mAdvancedAreaFilter[sGroupName].filterItem = oFilterGroupItem;
		}

		oObj = {
			control: oFilterGroupItem.getControl(),
			filterItem: oFilterGroupItem
		};

		if (this.getAdvancedMode() || oFilterGroupItem.getVisibleInFilterBar()) {
			oFilterGroupItem.setVisibleInFilterBar(true);
		} else {
			oFilterGroupItem.setVisibleInFilterBar(false);
		}

		this._mAdvancedAreaFilter[sGroupName].items.push(oObj);

		if (!oFilterGroupItem.getHiddenFilter()) {

			oContainer = this._addControlToBasicAreaFormContainer(oFilterGroupItem);
			if (oContainer) {
				oObj.container = oContainer;

				oContainer.setVisible(oFilterGroupItem.getVisible() && oFilterGroupItem.getVisibleInFilterBar());
				if (oFilterGroupItem.getVisibleInFilterBar()) {
					oFilterGroupItem.setPartOfCurrentVariant(oFilterGroupItem.getVisibleInFilterBar());
				}

				oFilterGroupItem.attachChange(this._filterGroupItemChange.bind(this));
			}

			if (this.getAdvancedMode()) {
				this._rerenderAA();
			} else {
				this._showHintText();
			}

		}
		this._adaptButtonsEnablement();

		return this;
	};

	/**
	 * Adds a <code>FilterGroupItem</code> element to the aggregation <code>_parameters</code>.
	 * @protected
	 * @param {sap.ui.comp.filterbar.FilterGroupItem} oParameter adding a analytical parameter
	 * @returns {sap.ui.comp.filterbar.FilterBar} Reference to this in order to allow method chaining
	 */
	FilterBar.prototype._addParameter = function(oParameter) {
		var i, oObj, oContainer, bInserted = false, sGroupName = FilterBar.INTERNAL_GROUP;

		oParameter._setParameter(true);
		oParameter.setVisibleInFilterBar(true);
		oParameter.setPartOfCurrentVariant(true);

		this.addAggregation("_parameters", oParameter, true);

		oObj = {
			control: oParameter.getControl(),
			filterItem: oParameter
		};

		if (!this._mAdvancedAreaFilter) {
			this._mAdvancedAreaFilter = {};
		}
		if (!this._mAdvancedAreaFilter[sGroupName]) {
			this._mAdvancedAreaFilter[sGroupName] = {};
			this._mAdvancedAreaFilter[sGroupName].filterItem = null;
		}

		if (!this._mAdvancedAreaFilter[sGroupName].items) {
			this._mAdvancedAreaFilter[sGroupName].items = [];
		}

		for (i = 0; i < this._mAdvancedAreaFilter[sGroupName].items.length; i++) {
			var oItem = this._mAdvancedAreaFilter[sGroupName].items[i];
			if (oItem.filterItem._isParameter()) {
				continue;
			}
			this._mAdvancedAreaFilter[sGroupName].items.splice(i, 0, oObj);
			bInserted = true;
			break;
		}

		if (!bInserted) {
			this._mAdvancedAreaFilter[sGroupName].items.push(oObj);
		}

		oContainer = this._addControlToBasicAreaFormContainer(oParameter);
		if (oContainer) {
			oObj.container = oContainer;
			oContainer.setVisible(oParameter.getVisible());
		}

		if (bInserted) {
			this._oBasicAreaLayout.removeContent(oContainer);
			this._addContainerInOrder(oObj.filterItem, oObj.container);
		}

		if (!this.getAdvancedMode()) {
			this._showHintText();
		}

		this._adaptButtonsEnablement();

		return this;

	};

	/**
	 * Event-handler is called when the property of a filter item has changed.
	 * @private
	 * @param {object} oContainer the container of the filter item's control and label
	 * @param {object} oEvent the event
	 */
	FilterBar.prototype._filterItemChange = function(oContainer, oEvent) {

		var oItem;
		var bFlag;
		var sPropertyName;

		if (oEvent && oEvent.oSource && (oEvent.oSource instanceof sap.ui.comp.filterbar.FilterItem)) {

			sPropertyName = oEvent.getParameter("propertyName");

			if (sPropertyName === "visibleInFilterBar" || sPropertyName === "visible" || sPropertyName === "label" || sPropertyName === "labelTooltip" || sPropertyName === "mandatory") {
				oItem = this._determineItemByName(oEvent.oSource.getName(), FilterBar.INTERNAL_GROUP);

				if (oItem && oItem.filterItem) {
					if ((sPropertyName === "visible")) {
						bFlag = oEvent.oSource.getVisible();
						oItem.filterItem.setVisible(bFlag);
					} else if (sPropertyName === "visibleInFilterBar") {
						bFlag = oEvent.oSource.getVisibleInFilterBar();
						var bChangePossible = this._checkChangePossibleVisibleInFilterBar(oItem.filterItem, bFlag);
						if (bChangePossible) {
							oItem.filterItem.setVisibleInFilterBar(bFlag);
						} else {
							oEvent.oSource.setVisibleInFilterBar(true);
						}

					} else if (sPropertyName === "label") {
						oItem.filterItem.setLabel(oEvent.oSource.getLabel());
					} else if (sPropertyName === "labelTooltip") {
						oItem.filterItem.setLabelTooltip(oEvent.oSource.getLabelTooltip());
					} else if (sPropertyName === "mandatory") {
						bFlag = oEvent.oSource.getMandatory();
						oItem.filterItem.setMandatory(bFlag);
					}
				}
			}
		}
	};

	/**
	 * Event handler called when the property of a filter group item has changed.
	 * @private
	 * @param {object} oEvent the event
	 */
	FilterBar.prototype._filterGroupItemChange = function(oEvent) {

		var oItem;
		var sPropertyName;

		if (oEvent && oEvent.oSource) {
			sPropertyName = oEvent.getParameter("propertyName");

			if (sPropertyName === "visibleInFilterBar" || sPropertyName === "visible") {

				oItem = this._determineItemByName(oEvent.oSource.getName(), oEvent.oSource.getGroupName());
				if (oItem) {
					if (sPropertyName === "visibleInFilterBar") {
						var bFlag = oEvent.oSource.getVisibleInFilterBar();

						var bChangePossible = this._checkChangePossibleVisibleInFilterBar(oEvent.oSource, bFlag);
						if (!bChangePossible) {
							oEvent.oSource.setVisibleInFilterBar(true);
							bFlag = true;
						}

						if (bFlag) {
							oEvent.oSource.setPartOfCurrentVariant(true);
							// this._setVisibleInFilterBar(oItem);
						}

						if (!this.getAdvancedMode() && !this._oDialog) {
							this._rerenderItem(oItem);
							this._adaptLinkText(oEvent.oSource.getGroupName());
						}

					} else if (sPropertyName === "visible") {

						if (this.getAdvancedMode() && oItem.container) {
							oItem.container.setVisible(true);
						} else {
							this._updateToolbarText();
							this._rerenderGroup(oItem, oEvent.oSource.getGroupName());
						}
					}

					this._showHintText();
				}
			} else if (sPropertyName === "groupTitle") {
				if (this._mAdvancedAreaFilter && this._mAdvancedAreaFilter[oEvent.oSource.getGroupName()]) {
					if (this._mAdvancedAreaFilter[oEvent.oSource.getGroupName()].formcontainer) {
						this._mAdvancedAreaFilter[oEvent.oSource.getGroupName()].formcontainer.setTitle(oEvent.oSource.getGroupTitle());
					} else {
						this._adaptGroupTitle(oEvent.oSource.getGroupName());
					}
				}
			} else if (sPropertyName === "label") {
				if (!this._mAdvancedAreaFilter[oEvent.oSource.getGroupName()].formcontainer) { // do not adapt in case the advanced filters dialog is
					// active
					this._adaptGroupTitleForFilter(oEvent.oSource);
				}
			} else if (sPropertyName === "mandatory") {
				if (this._oFilterDialog) { // adapt only in case the advanced filters dialog is active
					this._adaptMandatoryForFilter(oEvent.oSource);
				}

			} else if ((sPropertyName === "partOfCurrentVariant") && this.ensureLoadedValueHelpList) {
				var oFilterItem = this.determineFilterItemByName(oEvent.oSource.getName());
				if (oFilterItem && oFilterItem.getPartOfCurrentVariant()) {
					this.ensureLoadedValueHelpList(oEvent.oSource.getName());
				}
			}

			if (this.getAdvancedMode()) {
				this._rerenderAA();
			}
		}
	};

	FilterBar.prototype._addContainer = function(oItem) {

		if (oItem) {

			if (this._oBasicAreaLayout && !this._oFilterDialog) {

				if (oItem.container && (this._oBasicAreaLayout.indexOfContent(oItem.container) === -1)) {
					this._addContainerInOrder(oItem.filterItem, oItem.container);
				}
			}
		}
	};

	FilterBar.prototype._addContainerInOrder = function(oFilterItem, oContainer) {
		var n, i, idx, aContainers = this._oBasicAreaLayout.getContent(), oPredecessorContainerIdx = -1;

		if (this._isNewFilterBarDesign()) {
			if (this._isPhone()) {
				oPredecessorContainerIdx++;
			}
			if (this._oBasicSearchField) {
				oPredecessorContainerIdx++;
			}
		}

		if (this._mAdvancedAreaFilter) {
			for (n in this._mAdvancedAreaFilter) {
				var oGroupElement = this._mAdvancedAreaFilter[n];
				if (oGroupElement && oGroupElement.items) {
					for (i = 0; i < oGroupElement.items.length; i++) {

						if (!oGroupElement.items[i].container) {
							continue;
						}

						if (oGroupElement.items[i].container === oContainer) {

							this._oBasicAreaLayout.insertContent(oContainer, oPredecessorContainerIdx + 1);
							return;
						}

						idx = aContainers.indexOf(oGroupElement.items[i].container);
						if (idx >= 0) {
							oPredecessorContainerIdx = idx;
						}
					}
				}
			}
		}
	};

	/**
	 * VisibleInFilterBar-property may not be changed to false, when the filter is mandatory and has no value
	 * @private
	 * @param {sap.ui.comp.filterbar.FilterItem} oFilterItem in question
	 * @param {boolean} bFlag - represents the value of visibleInFilterBar
	 * @returns {boolean} allowed or not allowed change
	 */
	FilterBar.prototype._checkChangePossibleVisibleInFilterBar = function(oFilterItem, bFlag) {

		if (oFilterItem && oFilterItem.getMandatory() && !bFlag) {
			var bHasValue = this._hasFilterValue(oFilterItem);
			if (!bHasValue) {
				oFilterItem.setVisibleInFilterBar(true);
				return false;
			}
		}

		return true;
	};

	/**
	 * In case the visibility was changed, check if the link text has to be adapted.
	 * @private
	 * @param {string} sGroupName the group name
	 */
	FilterBar.prototype._adaptLinkText = function(sGroupName) {

		if (this._mAdvancedAreaFilter && this._mAdvancedAreaFilter[sGroupName] && this._mAdvancedAreaFilter[sGroupName].link) {
			this._setLinkText(sGroupName, this._mAdvancedAreaFilter[sGroupName].link);
		}
	};

	/**
	 * Checks if a filter has a value.
	 * @private
	 * @param {sap.ui.comp.filterbar.FilterItem} oFilterItem the filter
	 * @returns {boolean} returns if the filter has a value or not
	 */
	FilterBar.prototype._hasFilterValue = function(oFilterItem) {

		var aFilters = this._getFiltersWithValues();
		return this._checkFilterForValue(aFilters, oFilterItem);
	};

	/**
	 * Handles dynamic change of the mandatory property.
	 * @private
	 * @param {sap.ui.comp.filterbar.FilterItem} oFilterItem the filter
	 */
	FilterBar.prototype._adaptMandatoryForFilter = function(oFilterItem) {

		var oItem;
		var sGroupName = oFilterItem.getGroupName();

		if (oFilterItem) {
			oItem = this._determineItemByName(oFilterItem.getName(), sGroupName);
			if (oItem && oItem.checkbox && oItem.checkbox.getVisible()) {

				var bEnabled = true;
				if (oFilterItem.getMandatory()) {
					var bHasValue = this._hasFilterValue(oFilterItem);
					if (!bHasValue) {
						bEnabled = false;
						oFilterItem.setVisibleInFilterBar(true);
					}
				}

				oItem.checkbox.setEnabled(bEnabled);
			}
		}
	};

	/**
	 * In case considerGroupTitle is set then all labels of filters of a specific group will post-fixed with the group title.
	 * @private
	 * @param {sap.ui.comp.filterbar.FilterGroupItem} oFilterItem the filter
	 */
	FilterBar.prototype._adaptGroupTitleForFilter = function(oFilterItem) {

		var sLabel;
		var oLabel;

		if (oFilterItem && !oFilterItem.getHiddenFilter()) {
			sLabel = oFilterItem.getLabel();
			oLabel = oFilterItem.getLabelControl(this.getId());
			if (this.getConsiderGroupTitle()) {
				if (oLabel && oFilterItem.getGroupTitle()) {
					oLabel.setText(sLabel + " (" + oFilterItem.getGroupTitle() + ')');
				}
			} else {
				oLabel.setText(sLabel);
			}
		}
	};

	/**
	 * In case considerGroupTitle is set then all labels of filters of a specific group will post-fixed with the group title.
	 * @private
	 * @param {string} sGroupName filter group name
	 */
	FilterBar.prototype._adaptGroupTitle = function(sGroupName) {

		var i;
		var oItem;

		if (this._mAdvancedAreaFilter && this._mAdvancedAreaFilter[sGroupName] && this._mAdvancedAreaFilter[sGroupName].items) {
			for (i = 0; i < this._mAdvancedAreaFilter[sGroupName].items.length; i++) {
				oItem = this._mAdvancedAreaFilter[sGroupName].items[i];
				if (oItem && oItem) {
					this._adaptGroupTitleForFilter(oItem.filterItem);
				}
			}
		}
	};

	/**
	 * In case considerGroupTitle is set then all labels of all filters of all groups will be post-fixed with the group title.
	 * @private
	 * @param {string} sGroupName the group name
	 */
	FilterBar.prototype._adaptGroupsTitle = function() {

		var n = null;

		if (this._mAdvancedAreaFilter) {
			for (n in this._mAdvancedAreaFilter) {
				if (n && n !== FilterBar.INTERNAL_GROUP) {
					this._adaptGroupTitle(n);
				}
			}
		}

	};

	/**
	 * Registration of a callback function. The provided callback function is executed to obtain the filters with values.
	 * @public
	 * @since 1.26.1
	 * @param {function} fCallBack Called when a variant must be applied
	 * @returns {sap.ui.comp.filterbar.FilterBar} Reference to this in order to allow method chaining.
	 */
	FilterBar.prototype.registerGetFiltersWithValues = function(fCallBack) {

		this._fRegisterGetFiltersWithValues = fCallBack;

		return this;
	};

	/**
	 * Registration of a callback function. The provided callback function is executed when saving a variant is triggered and must provide all
	 * relevant fields and values in JSON.
	 * @public
	 * @param {function} fCallBack Called when a variant must be fetched
	 * @returns {sap.ui.comp.filterbar.FilterBar} Reference to this in order to allow method chaining.
	 */
	FilterBar.prototype.registerFetchData = function(fCallBack) {

		this._fRegisteredFetchData = fCallBack;

		return this;
	};

	/**
	 * Registration of a callback function. The provided callback function is executed when a variant must be applied. The callback function will
	 * receive the corresponding data set containing all relevant data in JSON, as initially provided by the callback for fetchData.
	 * @public
	 * @param {function} fCallBack Called when a variant must be applied
	 * @returns {sap.ui.comp.filterbar.FilterBar} Reference to this in order to allow method chaining.
	 */
	FilterBar.prototype.registerApplyData = function(fCallBack) {

		this._fRegisteredApplyData = fCallBack;

		return this;
	};

	FilterBar.prototype._isTINAFScenario = function() {

		if (this._oVariantManagement) {

			if (!this._isUi2Mode()) {
				return true;
			}
// if (this._oVariantManagement instanceof SmartVariantManagement) {
// return true;
// }
		} else {

			/* eslint-disable no-lonely-if */
			// scenario: VH dialog: VM replaced with collective search control
			if (this._oCollectiveSearch && this.getAdvancedMode()) {
				return true;
			}
			/* eslint-enable no-lonely-if */
		}

		return false;
	};

	FilterBar.prototype.fireInitialise = function() {

		if (this._isTINAFScenario()) {
			this._createVisibleFilters();
			if (this.getAdvancedMode()) {
				this._ensureFilterLoaded(null);
			}
			this._fireInitialiseEvent();
		} else {
			this._initializeVariantManagement();
		}
	};

	/**
	 * This method will be called by the SmartVariantMangement and indicates, that the standard variant was obtained. It indicates, that the variant
	 * management is fully initialized.
	 * @protected
	 */
	FilterBar.prototype.variantsInitialized = function() {
		this.fireInitialized();
	};

	FilterBar.prototype.fireInitialized = function() {
		this.fireEvent("initialized");
	};

	/**
	 * Initializes the variant management, when the prerequisites are full filled. In this case the initialise-event will be triggered lated, after
	 * the variant management initialization. Triggers the initialise-event immediately, in case the pre-requisits are not full filled.
	 * @private
	 */
	FilterBar.prototype._initializeVariantManagement = function() {
		this._createVisibleFilters();
		// initialise SmartVariant stuff only if it is necessary! (Ex: has a persistencyKey)
		if (this._oVariantManagement && this.getPersistencyKey()) {

			if (this._isTINAFScenario()) {
				this._oVariantManagement.initialise(this._initialiseVariants, this);
			} else {
				// Ui2 handling
				this._fInitialiseVariants = this._initialiseVariants.bind(this);
				this._oVariantManagement.attachInitialise(this._fInitialiseVariants, this);
				this._oVariantManagement.initialise();
			}

		} else {
			this._fireInitialiseEvent();
		}
	};

	FilterBar.prototype._fireInitialiseEvent = function() {

		try {
			this.fireEvent("initialise");
		} catch (ex) {
			jQuery.sap.log.error("error during initialise event handling - " + ex.message);
		}

		this._bIsInitialized = true;

		this._updateToolbarText();
	};

	/**
	 * Is triggered, whenever the flex layer is initialized.
	 * @private
	 */
	FilterBar.prototype._initialiseVariants = function() {

		this._fireInitialiseEvent();
		if (this._oVariantManagement) { // mark any changes as irrelevant
			this._oVariantManagement.currentVariantSetModified(false);
		}
	};

	/**
	 * Informs the consumer of the FilterBar that a new variant was applied.
	 * @private
	 * @param {string} sContext may be undefined, has the values 'RESET'/'CANCEL/'DATA_SUITE'/'SET_VM_ID'/'INIT' and indicates the initial trigger
	 *        source
	 * @param {boolean} bExecuteOnSelect indicates if a follow-on search will be triggered automatically
	 */
	FilterBar.prototype.fireAfterVariantLoad = function(sContext, bExecuteOnSelect) {

		this._rerenderFilters();

		var oEvent = {
			context: sContext,
			executeOnSelect: bExecuteOnSelect
		};
		this.fireEvent("afterVariantLoad", oEvent);
	};

	/**
	 * Informs the consumer of the FilterBar, that a variant is about to be saved.
	 * @private
	 * @param {string} sContext may be undefined, have the value <code>STANDARD</code> and indicates the initial trigger source
	 */
	FilterBar.prototype.fireBeforeVariantSave = function(sContext) {

		var oEvent = {
			context: sContext
		};

		var bFlag = this._getConsiderFilterChanges();

		if (sContext) {
			this._setConsiderFilterChanges(false);
		}

		this.fireEvent("beforeVariantSave", oEvent);

		if (sContext) {
			this._setConsiderFilterChanges(bFlag);
		}
	};

// BCP: 1670241039
// /**
// * Returns all Filters belonging to the 'filterItems' aggregation. Since 1.48.0 this method will return all filters belonging to the BASIC group.
// * @public
// * @returns {sap.ui.comp.filterbar.FilterItem[]} An array of the removed elements (might be empty).
// * @deprecated Since version 1.48.0. Use aggregation <code>filterGroupItems</code> instead.
// */
// FilterBar.prototype.getFilterItems = function() {
//
// var i, aFilters = [];
//
// if (this._mAdvancedAreaFilter) {
//
// this._ensureFilterLoaded(null);
//
// if ((this._mAdvancedAreaFilter[FilterBar.INTERNAL_GROUP]) && (this._mAdvancedAreaFilter[FilterBar.INTERNAL_GROUP].items)) {
// for (i = 0; i < this._mAdvancedAreaFilter[FilterBar.INTERNAL_GROUP].items.length; i++) {
// if (this._mAdvancedAreaFilter[FilterBar.INTERNAL_GROUP].items[i].filterItem &&
// !this._mAdvancedAreaFilter[FilterBar.INTERNAL_GROUP].items[i].filterItem._isParameter()) {
// aFilters.push(this._mAdvancedAreaFilter[FilterBar.INTERNAL_GROUP].items[i].filterItem);
// }
// }
// }
// }
//
// return aFilters;
// };

	/**
	 * Removes all entries in the aggregation filterItems.
	 * @public
	 * @returns {sap.ui.comp.filterbar.FilterItem[]} An array of the removed elements (might be empty).
	 * @deprecated Since version 1.48.0. Use aggregation <code>filterGroupItems</code> instead.
	 */
	FilterBar.prototype.removeAllFilterItems = function() {

		var i;
		var aFilters = [];

		this._aBasicAreaSelection = null;

		var aContent = this._oBasicAreaLayout.getContent();
		if (aContent) {
			for (i = 0; i < aContent.length; i++) { // 'variant management' ... 'plus', ' more-less', buttons container
				this._oBasicAreaLayout.removeContent(aContent[i]);
// if (aContent[i]).exit) {
// aContent[i].exit();
// }
			}
		}

		if (this._mAdvancedAreaFilter) {
			if ((this._mAdvancedAreaFilter[FilterBar.INTERNAL_GROUP]) && (this._mAdvancedAreaFilter[FilterBar.INTERNAL_GROUP].items)) {
				for (i = 0; i < this._mAdvancedAreaFilter[FilterBar.INTERNAL_GROUP].items.length; i++) {
					if (this._mAdvancedAreaFilter[FilterBar.INTERNAL_GROUP].items[i].filterItem) {
						aFilters.push(this._mAdvancedAreaFilter[FilterBar.INTERNAL_GROUP].items[i].filterItem);
					}
				}

				delete this._mAdvancedAreaFilter[FilterBar.INTERNAL_GROUP];
			}

			if (Object.keys(this._mAdvancedAreaFilter).length === 0) {
				this._mAdvancedAreaFilter = null;
			}
		}

		// this.removeAggregation("filterItems");

		this._destroyItems(aFilters);

		this._adaptButtonsEnablement();

		return aFilters;
	};

	/**
	 * Removes all entries in the aggregation filterGroupItems.
	 * @public
	 * @returns {sap.ui.comp.filterbar.FilterItem[]} An array of the removed elements (might be empty).
	 */
	FilterBar.prototype.removeAllFilterGroupItems = function() {

		var n = null, i;
		var aFilters = [];

		for (n in this._mAdvancedAreaFilter) {
			if (n) {
				if (this._mAdvancedAreaFilter[n] && this._mAdvancedAreaFilter[n].items) {
					for (i = 0; i < this._mAdvancedAreaFilter[n].items.length; i++) {
						if (this._mAdvancedAreaFilter[n].items[i].filterItem) {
							aFilters.push(this._mAdvancedAreaFilter[n].items[i].filterItem);
						}
					}

					delete this._mAdvancedAreaFilter[n];
				}
			}

			if (Object.keys(this._mAdvancedAreaFilter).length === 0) {
				this._mAdvancedAreaFilter = null;
			}
		}

		this.__bDeleteMode = true;
		// this.removeAggregation("filterGroupItems");
		this._destroyItems(aFilters);

		this.__bDeleteMode = false;

		this._adaptButtonsEnablement();

		return aFilters;
	};

	/**
	 * Removes all entries in the aggregations filterGroupItems, basicSearch
	 * @public
	 */
	FilterBar.prototype.removeAllFilters = function() {
		this.removeAllFilterItems();
		this.removeAllFilterGroupItems();
		this.removeBasicSearch();
	};

	FilterBar.prototype.removeBasicSearch = function() {
		this.setBasicSearch(null);
	};

	/**
	 * Retrieves filters belonging to the current variant.
	 * @public
	 * @param {boolean} bConsiderOnlyVisibleFields Indicates that only visible filters are retrieved. <b>Note:</b> hidden filters are treated as
	 *        visible filters.
	 * @returns {array} filters Of the current variant
	 */
	FilterBar.prototype.getAllFilterItems = function(bConsiderOnlyVisibleFields) {

		var i, n = null;
		var aFilters = [];
		var oElement, oItem;

		if (!bConsiderOnlyVisibleFields) {
			this._ensureFilterLoaded(null);
		}

		if (this._mAdvancedAreaFilter) {
			for (n in this._mAdvancedAreaFilter) {
				if (n) {
					oElement = this._mAdvancedAreaFilter[n];
					if (oElement.items) {
						for (i = 0; i < oElement.items.length; i++) {
							oItem = oElement.items[i];
							if (oItem && oItem.filterItem && oItem.filterItem.getVisible()) {
								if (bConsiderOnlyVisibleFields) {
									if (oItem.filterItem.getVisibleInFilterBar() || oItem.filterItem.getPartOfCurrentVariant()) {
										aFilters.push(oItem.filterItem);
									}
								} else {
									aFilters.push(oItem.filterItem);
								}
							}
						}
					}
				}
			}
		}

		return aFilters;
	};

	/**
	 * Clears an eventual error state on all filter.
	 * @privatef
	 */
	FilterBar.prototype._clearErrorState = function() {

		this._resetFiltersInErrorValueState();
	};

	FilterBar.prototype.getAggregation = function(sName) {

		if (sName == "filterGroupItems" && !this.__bDeleteMode) {
			this._ensureFilterLoaded(null);
		}

		return Grid.prototype.getAggregation.apply(this, arguments);
	};

	/**
	 * Provides filter information for lazy instantiation. Is overwritten by the SmartFilterBar.
	 * @protected
	 * @returns {array} of filter information
	 */
	FilterBar.prototype._getFilterInformation = function() {
		return [];
	};

	FilterBar.prototype._createVisibleFilters = function() {

		this._getFilters();
	};

	FilterBar.prototype._getFilters = function() {

		this._aFields = this._getFilterInformation();
		var i, oField;

		if (this._aFields && this._aFields.length > 0) {
			if (!this._mAdvancedAreaFilter) {
				this._mAdvancedAreaFilter = {};

				if (!this.getAdvancedMode()) {
					this._mAdvancedAreaFilter[FilterBar.INTERNAL_GROUP] = {};
					this._mAdvancedAreaFilter[FilterBar.INTERNAL_GROUP].filterItem = null;
					this._mAdvancedAreaFilter[FilterBar.INTERNAL_GROUP].items = null;
				}
			}

			for (i = 0; i < this._aFields.length; i++) {
				oField = this._aFields[i];

				if (oField.groupName !== FilterBar.INTERNAL_GROUP) {
					if (!this._mAdvancedAreaFilter[oField.groupName]) {
						this._mAdvancedAreaFilter[oField.groupName] = {};
						this._mAdvancedAreaFilter[oField.groupName].groupTitle = oField.groupTitle;
						this._mAdvancedAreaFilter[oField.groupName].filterItem = null;
						this._mAdvancedAreaFilter[oField.groupName].items = [];
					}
				}

				if (oField.visibleInAdvancedArea || (oField.groupName === FilterBar.INTERNAL_GROUP)) {

					this._instanciateFilterItem(oField);
				}
			}
		}

		this._adaptButtonsEnablement();
	};

	/**
	 * Determines if an filter is visible on he filterbar. This API is only relevant for the Smart Templates scenario any may not be used in any ozher
	 * cases.
	 * @private
	 * @param {string} sName of a filter.
	 * @returns {boolean} determines if a specific filter is visible o the filterbar.
	 */
	FilterBar.prototype.isVisibleInFilterBarByName = function(sName) {
		var oFilterItem, oField = this._getFilterMetadata(sName);
		if (oField && oField.factory) {
			if ((oField.hasOwnProperty("visibleInAdvancedArea") && oField.visibleInAdvancedArea) || (oField.groupName === FilterBar.INTERNAL_GROUP)) {
				return true;
			}
		} else {
			oFilterItem = this.determineFilterItemByName(sName);
			if (oFilterItem) {
				return oFilterItem.getVisibleInFilterBar();
			}
		}

		return false;
	};

	FilterBar.prototype._getFilterMetadata = function(sName) {
		if (this._aFields) {
			for (var i = 0; i < this._aFields.length; i++) {
				if (this._aFields[i].fieldName === sName) {
					return this._aFields[i];
				}
			}
		}

		return null;
	};

	/**
	 * Determines an array of filter names, which are custom filters and non visible on the FilterBar. This API is only relevant for the Smart
	 * Templates scenario any may not be used in any ozher cases.
	 * @private
	 * @returns {array} of filter names.
	 */
	FilterBar.prototype.getNonVisibleCustomFilterNames = function() {

		if (this._aFields.length > 0) {
			return this._getLazyNonVisibleCustomFilterNames();
		} else {
			return this._getNonVisibleCustomFilterNames();
		}

	};

	FilterBar.prototype._getLazyNonVisibleCustomFilterNames = function() {
		var that = this, aArray = [];

		this._aFields.forEach(function(oField) {

			if (oField.factory) {
				if (oField.isCustomFilterField && !oField.visibleInAdvancedArea) {
					aArray.push(oField.fieldName);
				}
			} else if (that._isNonVisibleCustomFilterNamesByName(oField.fieldName, oField.groupName)) {
				aArray.push(oField.fieldName);
			}

		});

		return aArray;
	};

	FilterBar.prototype._isNonVisibleCustomFilterNamesByName = function(sName, sGroupName) {
		var i, oItem;
		if (this._mAdvancedAreaFilter && this._mAdvancedAreaFilter[sGroupName] && this._mAdvancedAreaFilter[sGroupName].items) {
			for (i = 0; i < this._mAdvancedAreaFilter[sGroupName].items.length; i++) {
				oItem = this._mAdvancedAreaFilter[sGroupName].items[i];
				if (oItem.filterName && (oItem.filterItem.getName() === sName)) {
					return this._isNonVisibleCustomFilterNamesByFilter(oItem.filterItem);
				}
			}
		}

		return false;
	};

	FilterBar.prototype._isNonVisibleCustomFilterNamesByFilter = function(oFilterItem) {
		if (oFilterItem.data("isCustomField") && !oFilterItem.getVisibleInFilterBar()) {
			return true;
		}

		return false;
	};

	FilterBar.prototype._getNonVisibleCustomFilterNames = function() {
		var that = this, aArray = [], aFilterItems = this.getAllFilterItems();

		if (aFilterItems) {
			aFilterItems.forEach(function(oFilterItem) {
				if (that._isNonVisibleCustomFilterNamesByFilter(oFilterItem)) {
					aArray.push(oFilterItem.getName());
				}
			});
		}

		return aArray;
	};

	FilterBar.prototype._ensureFilterLoaded = function(aFilterNames) {
		var i, j, oField;

		if (this._aFields && this._aFields.length > 0) {

			for (j = 0; j < this._aFields.length; j++) {
				oField = this._aFields[j];

				if (!oField.factory) {
					continue;
				}

				if (aFilterNames) {
					for (i = 0; i < aFilterNames.length; i++) {
						if ((oField.fieldName === aFilterNames[i].name) && (oField.groupName === aFilterNames[i].group)) {
							this._instanciateFilterItem(oField);
							break;
						}
					}
				} else {
					this._instanciateFilterItem(oField);
				}

			}

			if (!aFilterNames) {
				this._aFields = [];
			}
		}

	};

// FilterBar.prototype._ensureFilterLoaded = function(aFilterNames) {
//
// var that = this;
//
// if (this._aFields && this._aFields.length > 0) {
//
// if (aFilterNames) {
// aFilterNames.forEach(function(oFilter) {
// that._aFields.some(function(oField) {
// if ((oField.fieldName === oFilter.name) && (oField.groupName === oFilter.group)) {
// if (oField.factory) {
// that._instanciateFilterItem(oField);
// }
// return true;
// }
// return false;
// });
// });
// } else {
//
// this._aFields.forEach(function(oField) {
// if (oField.factory) {
// that._instanciateFilterItem(oField);
// }
// });
// }
//
// if (!aFilterNames) {
// this._aFields = [];
// }
// }
//
// };

	FilterBar.prototype._instanciateFilterItem = function(oField) {

		var factory = oField.factory;
		if (factory) {
			// first remove factory to avoid endless recursion, then call it
			delete oField.factory;
			factory.call(oField);
		}

	};

	/**
	 * Destroys the passed filters.
	 * @private
	 * @param {array} aFilterItems aggregation items
	 */
	FilterBar.prototype._destroyItems = function(aFilterItems) {

		if (aFilterItems && aFilterItems.length) {
			for (var i = 0; i < aFilterItems.length; i++) {
				aFilterItems[i].destroy();
			}
		}
	};

	/**
	 * Handles the visibility of the filters, during the variant appliance, according to the persisted information.
	 * @private
	 * @param {array} aPersData information about the filter fields
	 */
	FilterBar.prototype._reapplyVisibility = function(aPersData) {

		var i, n = null;
		var oItem;

		if (this._mAdvancedAreaFilter) {
			for (n in this._mAdvancedAreaFilter) {
				if (n) {
					var oGroup = this._mAdvancedAreaFilter[n];
					if (oGroup && oGroup.items) {
						for (i = 0; i < oGroup.items.length; i++) {
							oItem = oGroup.items[i];
							if (oItem && oItem.filterItem) {
								this._setPersVisibility(aPersData, oItem.filterItem);
							}
						}

						if (n !== FilterBar.INTERNAL_GROUP) {
							this._adaptLinkText(n);
						}
					}
				}
			}
		}
	};

	/**
	 * Determines if the current filter is marks as visible via the personalization
	 * @private
	 * @param {array} aPersData array of filters as obtain by the persistence layer
	 * @param {sap.ui.comp.filterBar.FilterItem} oFilterItem current filterItem
	 */
	FilterBar.prototype._setPersVisibility = function(aPersData, oFilterItem) {

		var sGroupName, sName;
		var oFilterInfo;

		if (oFilterItem && !oFilterItem.getHiddenFilter()) {
			sName = oFilterItem.getName();
			sGroupName = oFilterItem.getGroupName();

			oFilterInfo = this._checkForFilterInfo(aPersData, sName, sGroupName);
			if (this._isTINAFScenario()) {
				if (oFilterInfo) {
					oFilterItem.setVisibleInFilterBar(oFilterInfo.visibleInFilterBar);
					oFilterItem.setPartOfCurrentVariant(oFilterInfo.partOfCurrentVariant);

					if (oFilterInfo.hasOwnProperty("visible")) {
						oFilterItem.setVisible(oFilterInfo.visible);
					}
				} else {
					oFilterItem.setVisibleInFilterBar(false);
					if ((sGroupName === FilterBar.INTERNAL_GROUP) || oFilterItem._isParameter()) {
						oFilterItem.setPartOfCurrentVariant(true);
					} else {
						oFilterItem.setPartOfCurrentVariant(false);
					}
				}
			} else {
				/* eslint-disable no-lonely-if */
				if (oFilterInfo && (oFilterInfo.visibleInFilterBar !== undefined)) {
					oFilterItem.setVisibleInFilterBar((oFilterInfo.visibleInFilterBar));
					oFilterItem.setPartOfCurrentVariant((oFilterInfo.partOfCurrentVariant));
				} else { // old format
					if ((sGroupName !== FilterBar.INTERNAL_GROUP) && oFilterInfo && (oFilterInfo.group === sGroupName)) {

						oFilterItem.setVisibleInFilterBar((oFilterInfo !== null));
					}
				}
				/* eslint-enable no-lonely-if */
			}

			if (sGroupName === FilterBar.INTERNAL_GROUP) { // basic fields are always partOfCurentVariant
				oFilterItem.setPartOfCurrentVariant(true);
			}

			if (oFilterItem) {
				var oControl = this.determineControlByFilterItem(oFilterItem, true);
				if (oControl && oControl.getValueState && (oControl.getValueState() !== ValueState.None)) {
					if (oControl.setValue) {
						oControl.setValue("");
					}
					oControl.setValueState(ValueState.None);
				}
			}

		}
	};

	/**
	 * Determines the filter info from the persistence data for a specific filter.
	 * @private
	 * @param {array} aPersData array of filters as obtain by the persistence layer
	 * @param {string} sName Name of the filter
	 * @param {string} sGroupName Group name of the filter
	 * @returns {object} filter info object
	 */
	FilterBar.prototype._checkForFilterInfo = function(aPersData, sName, sGroupName) {

		var i;
		var oFilterInfo = null;

		if (aPersData && aPersData.length) {
			for (i = 0; i < aPersData.length; i++) {

				if (aPersData[i].name === sName) {

					// thisMode is used to determine if SmartFilterBar is used
					if ((aPersData[i].group === sGroupName) || this.isLiveMode) {
						oFilterInfo = aPersData[i];
						break;
					}

				}

			}
		}

		return oFilterInfo;
	};

	/**
	 * Creates the variant management control.
	 * @private
	 * @returns {sap.ui.comp.smartvariants.SmartVariantManagementUi2} the instance of variant management
	 */
	FilterBar.prototype._createVariantManagement = function() {

		var oVarMgm = new SmartVariantManagementUi2(this.getId() + "-variantUi2", {
		// showExecuteOnSelection: true,
		// showShare: true
		});

		var oPersInfo = new PersonalizableInfo({
			type: "filterBar",
			keyName: "persistencyKey"
		});
		oPersInfo.setControl(this);

		oVarMgm.addPersonalizableControl(oPersInfo);

		oVarMgm.addStyleClass("sapUiCompFilterBarMarginLeft");
		return oVarMgm;
	};

	FilterBar.prototype.fireAssignedFiltersChanged = function() {
		this.fireEvent("assignedFiltersChanged");
	};

	/**
	 * Retrieves the labels of all visible filters that belongs to the current variant and have an assigned value.
	 * @public
	 * @returns {array} Filter labels that represents relevant filters with values
	 */
	FilterBar.prototype.retrieveFiltersWithValuesAsText = function() {
		var sText, sCSVText, aFiltersWithValues = this.retrieveFiltersWithValues(), nCount, sBasicSearchValue = this.getBasicSearchValue();

		if (sBasicSearchValue && aFiltersWithValues) {
			aFiltersWithValues.splice(0, 0, sBasicSearchValue);
		}

		if (!aFiltersWithValues || (aFiltersWithValues.length === 0)) {
			sText = this._oRb.getText("FILTER_BAR_ASSIGNED_FILTERS_ZERO");
		} else {

			/* eslint-disable no-lonely-if */
			if (!this._isPhone()) {
				nCount = Math.min(5, aFiltersWithValues.length);
				sCSVText = "";
				for (var i = 0; i < nCount; i++) {
					sCSVText += aFiltersWithValues[i];
					if (i < (nCount - 1)) {
						sCSVText += ', ';
					}
				}

				sText = this._oRb.getText("FILTER_BAR_ASSIGNED_FILTERS", [
					aFiltersWithValues.length, sCSVText
				]);

				if (nCount < aFiltersWithValues.length) {
					sText += ", ...";
				}

			} else {
				sText = this._oRb.getText("FILTER_BAR_ASSIGNED_FILTERS_MOBILE", [
					aFiltersWithValues.length
				]);
			}

			/* eslint-disable no-lonely-if */
		}

		return sText;
	};

	/**
	 * Retrieves the labels of all visible filters that belongs to the current variant and have an assigned value.
	 * @public
	 * @returns {array} Filter labels that represents relevant filters with values
	 */
	FilterBar.prototype.retrieveFiltersWithValues = function() {

		var i, aResultingFilters = [];
		var aFilters = this._getFiltersWithValues();
		if (aFilters) {
			for (i = 0; i < aFilters.length; i++) {
				if (aFilters[i].getVisible() && aFilters[i].getPartOfCurrentVariant()) {
					aResultingFilters.push(aFilters[i].getLabel());
				}
			}
		}

		return aResultingFilters;
	};

	/**
	 * Retrieves all filters with values.
	 * @private
	 * @returns {array} of filters with values
	 */
	FilterBar.prototype._getFiltersWithValues = function() {

		if (this._fRegisterGetFiltersWithValues) {
			try {
				return this._fRegisterGetFiltersWithValues();
			} catch (ex) {
				jQuery.sap.log.error("callback for obtaining the filter count throws an exception");
			}
		}

		return null;
	};

	/**
	 * Retrieve the count for visible filters with values.
	 * @private
	 * @returns {number} count of visible filters with values
	 */
	FilterBar.prototype._getFiltersWithValuesCount = function() {

		var n = 0;

		var aFilters = this.retrieveFiltersWithValues();
		n = aFilters.length;

		if (this._oBasicSearchField && this._oBasicSearchField.getValue && this._oBasicSearchField.getValue()) {
			n++;
		}

		return n;
	};

	/**
	 * Determines if at least one filter is visible.
	 * @private
	 * @param {array} aFilterItemsWithValues contains all filters with values
	 * @param {sap.ui.comp.filterbar.FilterItem} oFilterItem filter to check
	 * @returns {boolean} indicated whether at least one filter is visible
	 */
	FilterBar.prototype._checkFilterForValue = function(aFilterItemsWithValues, oFilterItem) {

		var i;
		if (aFilterItemsWithValues) {
			for (i = 0; i < aFilterItemsWithValues.length; i++) {
				if (aFilterItemsWithValues[i] === oFilterItem) {
					return true;
				}
			}
		}

		return false;
	};

	FilterBar.prototype._handleVisibilityOfToolbar = function() {

		if (this.getAdvancedMode() && this._oToolbar) {

			var bFlag = false;

			var aContent = this._oToolbar.getContent();
			for (var i = 0; i < aContent.length; i++) {
				if (aContent[i] instanceof ToolbarSpacer) {
					continue;
				}

				if (aContent[i].getVisible && aContent[i].getVisible()) {
					bFlag = true;
					break;
				}
			}

			this._oToolbar.setVisible(bFlag);
		}
	};

	/**
	 * Toggles the filterbar mode Hide/Show.
	 * @private
	 */
	FilterBar.prototype._toggleHideShow = function() {

		this.setFilterBarExpanded(!this.getFilterBarExpanded());
	};

	/**
	 * Updates the 'Filters'-button text with the count of filters with values
	 * @private
	 */
	FilterBar.prototype._updateToolbarText = function() {

		var sFiltersKey = this._isNewFilterBarDesign() ? "FILTER_BAR_ADAPT_FILTERS" : "FILTER_BAR_ACTIVE_FILTERS";
		var sZeroFiltersKey = this._isNewFilterBarDesign() ? "FILTER_BAR_ADAPT_FILTERS_ZERO" : "FILTER_BAR_ACTIVE_FILTERS_ZERO";

		var nFilterCount = this._getFiltersWithValuesCount();
		var sText = nFilterCount ? (this._oRb.getText(sFiltersKey, [
			nFilterCount
		])) : (this._oRb.getText(sZeroFiltersKey));
		this._oFiltersButton.setText(sText);
		this._oFiltersButton.setTooltip(sText);

		this.fireAssignedFiltersChanged();

	};

	FilterBar.prototype.setFilterBarExpanded = function(bShowExpanded) {

		if (this.getAdvancedMode()) {

			this.setProperty("filterBarExpanded", bShowExpanded);

			if (this._oHideShowButton) {
				if (bShowExpanded) {
					this._oHideShowButton.setText(this._oRb.getText("FILTER_BAR_VH_HIDE"));
					this._oHideShowButton.setTooltip(this._oRb.getText("FILTER_BAR_VH_HIDE"));
				} else {
					this._oHideShowButton.setText(this._oRb.getText("FILTER_BAR_VH_SHOW"));
					this._oHideShowButton.setTooltip(this._oRb.getText("FILTER_BAR_VH_SHOW"));
				}
			}
			// this._oHideShowButton.setVisible(true);
			this._calcVisibilityGoButton();

			this._oAdvancedPanel.setVisible(bShowExpanded);

		} else {

			var bExpanded = this._isPhone() ? false : bShowExpanded;

			this.setProperty("filterBarExpanded", bExpanded);

			if (this._isNewFilterBarDesign()) {
				return;
			}

			if (this._isPhone()) {

				if (this._oHideShowButton) {
					this._oHideShowButton.setVisible(false);
				}
				this._calcVisibilityGoButton();

				this._oBasicAreaLayout.setVisible(false);

			} else {

				if (this._oHideShowButton) {
					if (bExpanded) {
						this._oHideShowButton.setText(this._oRb.getText("FILTER_BAR_HIDE"));
						this._oHideShowButton.setTooltip(this._oRb.getText("FILTER_BAR_HIDE"));

					} else {
						this._oHideShowButton.setText(this._oRb.getText("FILTER_BAR_SHOW"));
						this._oHideShowButton.setTooltip(this._oRb.getText("FILTER_BAR_SHOW"));
					}
					this._oHideShowButton.setVisible(true);
				}

				this._calcVisibilityGoButton();

				if (this._oHideShowButton) {
					if (this._oHideShowButton.getEnabled()) {
						this._oBasicAreaLayout.setVisible(bExpanded);
					} else {
						this._oBasicAreaLayout.setVisible(false);
					}
				}
			}

		}

		this._updateToolbarText();
	};

	/**
	 * Eventhandler for visibility change in the 'Filters'-dialog.
	 * @private
	 * @param {sap.m.Checkbox } oCheckBox on which the select-state was changed
	 * @param {sap.ui.comp.filterbar.FilterItem } oFilterItem manipulated by the checkbox
	 */
	FilterBar.prototype._selectionChangedInFilterDialog = function(oCheckBox, oFilterItem) {

		oFilterItem.setVisibleInFilterBar(oCheckBox.getSelected());

		if (this._getConsiderFilterChanges() && this._oVariantManagement && !this._oVariantManagement.getInErrorState()) {
			this._oVariantManagement.currentVariantSetModified(true);
		}

		this._bDirtyViaDialog = true;
	};

	/**
	 * Cross-checks if a mandatory filter has a value.
	 * @private
	 * @param {object } oEvent general event object
	 */
	FilterBar.prototype._mandatoryFilterChange = function(oEvent) {

		if (!oEvent) {
			return;
		}

		var params = oEvent.getParameters();
		if (!params || !params.oSource) {
			return;
		}

		var oItem = this._determineByControl(params.oSource);
		if (oItem && oItem.checkbox) {

			var oFilterItem = oItem.filterItem;

			if (!oFilterItem.getMandatory()) {
				return;
			}

			var bHasValue = this._hasFilterValue(oFilterItem);
			if (oFilterItem.getVisibleInFilterBar()) {
				if (bHasValue) {
					oItem.checkbox.setEnabled(true);
				} else {
					oItem.checkbox.setEnabled(false);
				}
			} else {
				/* eslint-disable no-lonely-if */
				if (!bHasValue) {
					oFilterItem.setVisibleInFilterBar(true);
					oItem.checkbox.setSelected(true);
					oItem.checkbox.setEnabled(false);
				}
				/* eslint-enable no-lonely-if */
			}
		}
	};

	/**
	 * Called from 'Filters'-dialog and creates the form containing all filters.
	 * @private
	 * @returns {sap.ui.layout.form.Form} the filter form
	 */
	FilterBar.prototype._createFiltersAndAdaptBasicArea = function() {

		var oForm;

		this._setConsiderFilterChanges(false);
		this._recreateBasicAreaContainer(true);

		oForm = this._createFilters();

		var aItems = this._retrieveVisibleAdvancedItems();
		if (this._oAddToFilterBarLabel && (!aItems || (aItems.length <= 0))) {
			this._oAddToFilterBarLabel.setVisible(false);
		}

		this._setConsiderFilterChanges(true);

		return oForm;
	};

	/**
	 * Determines how many filters of a specific group are yet not part of the current variant.
	 * @private
	 * @param {string} sGroupName name of the current group
	 * @returns {number} count of filters, for the current group, yet not part of the current variant
	 */
	FilterBar.prototype._determineNotAssignedFiltersCount = function(sGroupName) {

		var nCount = 0, i, oFilterItem;

		if (this._mAdvancedAreaFilter[sGroupName] && this._mAdvancedAreaFilter[sGroupName].items) {
			for (i = 0; i < this._mAdvancedAreaFilter[sGroupName].items.length; i++) {
				oFilterItem = this._mAdvancedAreaFilter[sGroupName].items[i].filterItem;
				if (!oFilterItem.getVisible() || oFilterItem.getHiddenFilter()) {
					continue;
				}
				if (!oFilterItem.getPartOfCurrentVariant() && !oFilterItem.getVisibleInFilterBar()) {
					nCount++;
				}
			}
		}

		return nCount;
	};

	/**
	 * Handles the visibility of the passed oItem; adapts the more-link text; handles the visibility for the form-container.
	 * @private
	 * @param {object} oItem representing a filter
	 * @param {string} sGroupName name of the current group
	 */
	FilterBar.prototype._rerenderGroup = function(oItem, sGroupName) {

		var i;
		var oFilterItem;

		this._rerenderItem(oItem);
		this._adaptLinkText(sGroupName);

		if (oItem.formelement) {

			if (this._mAdvancedAreaFilter[sGroupName] && this._mAdvancedAreaFilter[sGroupName].items && this._mAdvancedAreaFilter[sGroupName].formcontainer) {
				for (i = 0; i < this._mAdvancedAreaFilter[sGroupName].items.length; i++) {

					oFilterItem = this._mAdvancedAreaFilter[sGroupName].items[i].filterItem;
					if (oFilterItem && oFilterItem.getVisible()) {
						this._mAdvancedAreaFilter[sGroupName].formcontainer.setVisible(true);
						return;
					}
				}

				this._mAdvancedAreaFilter[sGroupName].formcontainer.setVisible(false);
			}
		}
	};

	/**
	 * Sets the group's 'More'- link text containing the info about not yet assigned filters to the current group.
	 * @private
	 * @param {string} sGroupName name of the group
	 * @param {sap.m.Link } oLink control
	 * @param {number } nNotAssignedFilterCount count of not yet assigned filters
	 */
	FilterBar.prototype._setLinkTextAndCount = function(sGroupName, oLink, nNotAssignedFilterCount) {

		var sText;

		if (nNotAssignedFilterCount) {
			sText = this._oRb.getText("FILTER_BAR_SHOW_MORE_FILTERS", [
				nNotAssignedFilterCount
			]);
		} else {
			sText = this._oRb.getText("FILTER_BAR_SHOW_CHANGE_FILTERS");
		}

		oLink.setText(sText);
	};

	/**
	 * Sets the group's 'More'- link text containing the info about not yet assigned filters to the current group.
	 * @private
	 * @param {string} sGroupName name of the group
	 * @param {sap.m.Link } oLink control
	 */
	FilterBar.prototype._setLinkText = function(sGroupName, oLink) {

		var nNotAssignedFilterCount = this._determineNotAssignedFiltersCount(sGroupName);

		this._setLinkTextAndCount(sGroupName, oLink, nNotAssignedFilterCount);
	};

	/**
	 * Creates a link control for the current group. The link will open the 'Add/Remove Filters'- dialog
	 * @private
	 * @param {string} sGroupName name of the group
	 * @param {Title} oGroupTitle title of the group to which the link should belong
	 * @returns {sap.m.Link} link control
	 */
	FilterBar.prototype._createLink = function(sGroupName, oGroupTitle) {

		var sGroupNameId, that = this;

		sGroupNameId = IdentifierUtil.replace(sGroupName);

		var oLink = new Link(this.getId() + "-link-" + sGroupNameId);
		this._setLinkText(sGroupName, oLink);

		oLink.attachPress(function() {
			that._createAddRemoveFiltersDialog(sGroupName, oLink);
		});

		if (oGroupTitle) {
			oLink.addAriaLabelledBy(oGroupTitle);
		}

		return oLink;
	};

	/**
	 * Checks if running on phone.
	 * @private
	 * @returns {boolean} true if phone, false other wise
	 */
	FilterBar.prototype._isPhone = function() {

		return (Device.system.phone) ? true : false;
	};

	/**
	 * Checks if running on tablet.
	 * @private
	 * @returns {boolean} true if phone, false other wise
	 */
	FilterBar.prototype._isTablet = function() {
		return (Device.system.tablet && !Device.system.desktop) ? true : false;
	};

	FilterBar.prototype._createForm = function(oAdvancedLayout) {
		var that = this;
		var FiltersForm = null;

		FiltersForm = Form.extend('sap.ui.comp.filterbar.Form', {
			metadata: {},
			renderer: function(oRm, oControl) {
				FormRenderer.render.apply(this, arguments);
			}
		});
		(function() {
			FiltersForm.prototype.contentOnAfterRendering = function() {

				Form.prototype.contentOnAfterRendering.apply(this, arguments);

				that._adaptStyleSheet();

				if (that._oFilterDialog && that._oFilterDialog.isOpen() && (that._isNewFilterBarDesign() || !that._isPhone())) {
					that._repositionAddToFilterBarLabel();
				}
			};
		}());

		return new FiltersForm({
			editable: true,
			layout: oAdvancedLayout
		});
	};

	FilterBar.prototype._adaptStyleSheet = function() {

		var i, sOverFlowValue;
		var oItem, oTitleElement, n = null;

		for (n in this._mAdvancedAreaFilter) {
			if (n && this._mAdvancedAreaFilter[n].items) {

				for (i = 0; i < this._mAdvancedAreaFilter[n].items.length; i++) {
					oItem = this._mAdvancedAreaFilter[n].items[i];

					if (oItem && oItem.control && oItem.control instanceof MultiInput) {

						oTitleElement = oItem.control.$();
						if (oTitleElement) {
							sOverFlowValue = oTitleElement.parent().css("overflow");
							if (sOverFlowValue !== "visible") {
								oTitleElement.parent().css({
									"overflow": "visible"
								});
							}
						}
					}
				}
			}
		}

	};

	FilterBar.prototype._addFieldToFiltersDialog = function(oItem, oFormContainer, aFilters) {
		var oLabel, oCheckBox, oFormElement, bHasValue;

		if (!oItem && !oItem.filterItem || oItem.filterItem.getHiddenFilter()) {
			return;
		}

		var bShowFilter = this._determineVisibility(oItem.filterItem);

		if (oItem.control.getWidth) {
			oItem.width = oItem.control.getWidth();

			if (oItem.control.setWidth) {
				oItem.control.setWidth("100%");
			}
		}

		oLabel = oItem.filterItem.getLabelControl(this.getId());

		if (this.getConsiderGroupTitle()) {
			oLabel.setText(oItem.filterItem.getLabel());
		}

		oCheckBox = new CheckBox({
			tooltip: this._oRb.getText("FILTER_BAR_SHOW_IN_FILTERBAR")
		});
		oCheckBox.setSelected(oItem.filterItem.getVisibleInFilterBar());
		if (oItem.filterItem.getMandatory()) {
			bHasValue = this._checkFilterForValue(aFilters, oItem.filterItem);
			if (!bHasValue && oItem.filterItem.getVisibleInFilterBar()) {
				oCheckBox.setEnabled(false);
			}

// if (oItem.filterItem._isParameter()) {
// oCheckBox.setEnabled(false);
// }
		}
		oCheckBox.attachSelect(this._selectionChangedInFilterDialog.bind(this, oCheckBox, oItem.filterItem));

		if (this._isNewFilterBarDesign() || !this._isPhone()) {

// oLabel.setLayoutData(new GridData({
// span: "L3 M3 S12"
// }));
			oItem.control.setLayoutData(new GridData({
				span: "L8 M8 S11"
			}));
			oCheckBox.setLayoutData(new GridData({
				span: "L1 M1 S1"
			}));

		} else {
// oLabel.setLayoutData(new GridData({
// span: "L3 M3 S12"
// }));
			oItem.control.setLayoutData(new GridData({
				span: "L8 M8 S12"
			}));

			oCheckBox.setVisible(false);
		}

		oFormElement = new FormElement({
			label: oLabel,
			fields: [
				oItem.control, oCheckBox
			]
		});
		oFormElement.setVisible(bShowFilter);

		oItem.formelement = oFormElement;
		oItem.checkbox = oCheckBox;

		oFormContainer.addFormElement(oFormElement);

	};

	FilterBar.prototype._createHeaderAddToFilterBar = function(oFormContainer) {

		var oAddToFilterBarLabel, oFormElement;

		if (this._isNewFilterBarDesign() || !this._isPhone()) { // label 'Add To Filterbar'

			oAddToFilterBarLabel = new Label({
			// text: this._oRb.getText("FILTER_BAR_SHOW_IN_FILTERBAR")
			});

			oAddToFilterBarLabel.setLayoutData(new GridData({
				span: "L10 M10"
			}));

			oAddToFilterBarLabel.addStyleClass("sapUiCompFilterBarAddFilterLabel");
			this._oAddToFilterBarLabel = oAddToFilterBarLabel;

			oFormElement = new FormElement({
				label: oAddToFilterBarLabel,
				fields: []
			});

			oFormContainer.addFormElement(oFormElement);

			oAddToFilterBarLabel.setLabelFor(null);
		}

	};

	FilterBar.prototype._addBasicSearchAddToFilterBar = function(oFormContainer) {

		var oFormElement;

		if (!this._isPhone()) {

			this._oBasicSearchFieldClone = this._oBasicSearchField.clone();

			if (this._oToolbar) {
				this._replaceOnToolbar(this._oBasicSearchField, this._oBasicSearchFieldClone);
			} else {
				this._addBasicSearchToBasicArea(this._oBasicSearchFieldClone); // a new container was creted
			}

		} else {
			/* eslint-disable no-lonely-if */
			if (this.getAdvancedMode()) {
				this._oBasicSearchFieldClone = this._oBasicSearchField.clone();
			}
			/* eslint-enable no-lonely-if */
		}

		if (this._isNewFilterBarDesign() || !this._isPhone()) {
			this._oBasicSearchField.setLayoutData(new GridData({
				span: "L8 M8 S11",
				indent: "L3 M3 S0"
			}));
		} else {
			this._oBasicSearchField.setLayoutData(new GridData({
				span: "L8 M8 S12"
			}));
		}

		// FRANZ
		if (this._isPhone() && this.getAdvancedMode()) {
			oFormElement = new FormElement({
				fields: [
					this._oBasicSearchFieldClone
				]
			});
		} else {
			oFormElement = new FormElement({
				fields: [
					this._oBasicSearchField
				]
			});
		}

		oFormContainer.addFormElement(oFormElement);

	};

	FilterBar.prototype._isGroupEmpty = function(aItems) {

		var bIsEmpty = true;

		aItems.some(function(oItem) {
			if (oItem.filterItem && oItem.filterItem.getVisible() && !oItem.filterItem.getHiddenFilter()) {
				bIsEmpty = false;
				return true;
			}

			return false;
		});

		return bIsEmpty;
	};

	/**
	 * Creates the form containing all visible filters belonging to the current variant
	 * @private
	 * @returns {sap.ui.layout.form.Form} form with all filters
	 */
	FilterBar.prototype._createFilters = function() {

		var that = this, n = null, i, sGroupName;
		var oFormContainer = null, oFormElement, aFormElements, oItem;
		var oLink, oGroupTitle, bFirstGroup = true, nInvisibleCount;

		this._oClonedVM = null;

		var oAdvancedLayout = new ResponsiveGridLayout();
		oAdvancedLayout.setColumnsL(1);
		oAdvancedLayout.setLabelSpanL(3);
		oAdvancedLayout.setColumnsM(1);
		oAdvancedLayout.setLabelSpanM(3);

		var oForm = this._createForm(oAdvancedLayout);

		oForm.addStyleClass("sapUiCompFilterBarDialogForm");

		if (this._possibleToChangeVariantManagement() && this._oToolbar) {
			var idx = this._oToolbar.indexOfContent(this._oVariantManagement);
			if (idx >= 0) {
				this._oClonedVM = this._oVariantManagement.clone();
				this._oClonedVM._setSelectionByKey(this._oVariantManagement.getSelectionKey());
				this._replaceOnToolbar(this._oVariantManagement, this._oClonedVM);

				oFormContainer = new FormContainer();

				this._oVariantManagement.setLayoutData(new GridData({
					span: "L10 M10 S12"
				}));
				oFormElement = new FormElement({
					fields: this._oVariantManagement
				});

				oFormContainer.addFormElement(oFormElement);

				oForm.addFormContainer(oFormContainer);
			}

			oForm.addStyleClass("sapUiCompFilterBarGroupTitle");
		}

		// basic search field
		if (this._oBasicSearchField && !this._isNewFilterBarDesign()) {
			if (!oFormContainer) {
				oFormContainer = new FormContainer();
				oForm.addFormContainer(oFormContainer);
			}

			this._addBasicSearchAddToFilterBar(oFormContainer);
		}

		this._ensureFilterLoaded(null);

		// filters
		var aFilters = this._getFiltersWithValues();
		this._fRegisteredFilterChangeHandlers = function(oEvent) {
			that._mandatoryFilterChange(oEvent);
		};
		this.attachFilterChange(this._fRegisteredFilterChangeHandlers);

		this._oVariant.content = this.fetchVariant();
		if (this._oVariantManagement) {
			this._oVariant.key = this._oVariantManagement.getSelectionKey();
			this._oVariant.modified = this._oVariantManagement.currentVariantGetModified();
		}
		this._oInitialVariant = {};
		jQuery.extend(true, this._oInitialVariant, this._oVariant);

		for (n in this._mAdvancedAreaFilter) {
			if (n && this._mAdvancedAreaFilter[n].items) {

				if (n === FilterBar.INTERNAL_GROUP) {
					sGroupName = this._oRb.getText("FILTER_BAR_BASIC_GROUP");
				} else {
					sGroupName = this._mAdvancedAreaFilter[n].filterItem.getGroupTitle();
				}

				oGroupTitle = new Title({
					text: sGroupName
				});

				oFormContainer = new FormContainer({
					title: oGroupTitle
				});

				if (bFirstGroup && !this._isGroupEmpty(this._mAdvancedAreaFilter[n].items)) {
					bFirstGroup = false;
					this._createHeaderAddToFilterBar(oFormContainer);
					if (this._oBasicSearchField && this._isNewFilterBarDesign()) {
						this._addBasicSearchAddToFilterBar(oFormContainer);
					}
				}

				nInvisibleCount = 0;

				this._mAdvancedAreaFilter[n].formcontainer = oFormContainer;

				for (i = 0; i < this._mAdvancedAreaFilter[n].items.length; i++) {
					oItem = this._mAdvancedAreaFilter[n].items[i];

					this._addFieldToFiltersDialog(oItem, oFormContainer, aFilters);
					if (!oItem.filterItem.getVisible()) {
						nInvisibleCount++;
					}
				}

				aFormElements = oFormContainer.getFormElements();
				if (aFormElements && aFormElements.length > 0) {

					// More link
					if ((n !== FilterBar.INTERNAL_GROUP) && !this.getAdvancedMode()) {
						oLink = this._createLink(n, oGroupTitle);
						if (oLink) {

							if (this._isPhone()) {
								oLink.setLayoutData(new GridData({
									span: "L8 M8 S12"
								}));
							} else {
								oLink.setLayoutData(new GridData({
									span: "L8 M8 S12",
									indent: "L3 M3 S0"
								}));
							}

							oFormElement = new FormElement({
								fields: [
									oLink
								]
							});

							this._mAdvancedAreaFilter[n].link = oLink;

							oFormContainer.addFormElement(oFormElement);
						}

						if (nInvisibleCount === aFormElements.length) {
							oFormContainer.setVisible(false);
						}
					}

					oForm.addFormContainer(oFormContainer);
				}
			}
		}

		return oForm;

	};

	FilterBar.prototype._replaceOnToolbar = function(oControl, oNewControl) {
		var nIdx;
		if (this._oToolbar) {
			nIdx = this._oToolbar.indexOfContent(oControl);
			if (nIdx > -1) {
				this._oToolbar.insertContent(oNewControl, nIdx);
				this._oToolbar.removeContent(oControl);
			}
		}

	};

	/**
	 * Creates the content of the basic area, either by replacing the controls with their clones, or removing the clones and moving the original
	 * controls back to it.
	 * @private
	 * @param {boolean} bUseClone indicates if clones or 'original' controls should be placed inside the basic area
	 */
	FilterBar.prototype._recreateBasicAreaContainer = function(bUseClone) {

		var n = null, i;
		var oControl, oLabel;
		var oFilterGroupItem, oContainer, nWidth;

		if (this._possibleToChangeVariantManagement() && this._oToolbar && this._oClonedVM && this._oVariantManagement) {
			this._replaceOnToolbar(this._oClonedVM, this._oVariantManagement);
			this._oClonedVM.destroy();
			this._oClonedVM = null;
		}

		if (!this._isPhone() && this._oToolbar && this._oBasicSearchFieldClone && this._oBasicSearchField) {
			this._replaceOnToolbar(this._oBasicSearchFieldClone, this._oBasicSearchField);
			this._oBasicSearchFieldClone.destroy();
			this._oBasicSearchFieldClone = null;
		}

		var aContent = this._oBasicAreaLayout.removeAllContent();
		if (!bUseClone) {
			// do not destroy the buttons (new design) and the hint text
			if (aContent) {
				var endIdx = aContent.length;
				var startIdx = 0;
				if (this._isNewFilterBarDesign()) {
					if (this._isPhone()) {
						startIdx++;
					} else {
						endIdx--;
					}
				}
				for (i = startIdx; i < endIdx; i++) {
					if (aContent[i] !== this._oHintText) {
						aContent[i].destroy();
					}
				}
			}
		}

		if (this._isNewFilterBarDesign()) {
			this._addBasicSearchToBasicArea(this._oBasicSearchField);
			this._addButtonsToBasicArea();
		}

		for (n in this._mAdvancedAreaFilter) {
			if (n && this._mAdvancedAreaFilter[n].items) {

				for (i = 0; i < this._mAdvancedAreaFilter[n].items.length; i++) {
					oFilterGroupItem = this._mAdvancedAreaFilter[n].items[i].filterItem;

					if (oFilterGroupItem.getHiddenFilter()) {
						continue; // never consider hideen filters
					}

					nWidth = null;

					if (bUseClone) {

						if (!oFilterGroupItem.getVisible() || !oFilterGroupItem.getVisibleInFilterBar()) {
							continue; // handle only visible filters
						}

						oContainer = this._mAdvancedAreaFilter[n].items[i].container;
						if (oContainer) {
							if (oContainer.$() && oContainer.$().width()) {
								nWidth = oContainer.$().width();
							}
							oContainer.removeAllContent();
							oContainer.destroy();
						}

						oControl = this._mAdvancedAreaFilter[n].items[i].control.clone();
						oLabel = oFilterGroupItem.getLabelControl(this.getId()).clone();
						// label clone does not reset internal reference to the control
						oLabel.setLabelFor(null);

						if (this.getConsiderGroupTitle()) {
							// in advanced filters dialog the label should not contain group title
							oFilterGroupItem.getLabelControl(this.getId()).setText(oFilterGroupItem.getLabel());
						}
					} else {
						oControl = this._mAdvancedAreaFilter[n].items[i].control;
						oLabel = oFilterGroupItem.getLabelControl(this.getId());

						if (this._mAdvancedAreaFilter[n].items[i].width) {
							oControl.setWidth(this._mAdvancedAreaFilter[n].items[i].width);
						}
					}

					oContainer = this._addControlToBasicAreaContainer(oFilterGroupItem, oControl, oLabel);
					if (oContainer) {
						oContainer.setVisible(oFilterGroupItem.getVisible() && oFilterGroupItem.getVisibleInFilterBar());
						this._mAdvancedAreaFilter[n].items[i].container = oContainer;

						if (bUseClone && nWidth) {
							oContainer.setWidth(nWidth + "px");
						}
					}
				}
			}
		}
	};

	/**
	 * Search was executed. Check afterwards if any filer is in error state. Close dialog only in case non of the filters is in error state.
	 * @private
	 */
	FilterBar.prototype._searchRequested = function() {

		var oSearchAllowed, bInErrorState = false;

		if (this.verifySearchAllowed) {
			oSearchAllowed = this.verifySearchAllowed();
			if (oSearchAllowed.hasOwnProperty("pending")) {
				// if search is pending.. do nothing
				return;
			} else if (oSearchAllowed.hasOwnProperty("error") || oSearchAllowed.hasOwnProperty("mandatory")) {
				bInErrorState = true;
			}
		}

		if (bInErrorState) {
			this._bOKFiltersDialogTriggered = false;
			this._activateMainContent();
		} else {
			this._bOKFiltersDialogTriggered = true;
			if (!this.isLiveMode || !this.isLiveMode()) {
				this.search();
			} else {
				this._oFilterDialog.close();
			}
		}
	};

	FilterBar.prototype._activateMainContent = function() {
		var aContent = this.getFilterDialogContent();
		if (aContent && (aContent.length > 1)) {
			this.addFilterDialogContent(aContent[0]);
		}
	};

	FilterBar.prototype.fireSearch = function(oEvent) {

		if (this._oFilterDialog && this._bOKFiltersDialogTriggered) {
			this._oFilterDialog.close();
		}

		this.fireEvent("search", oEvent);

	};

	/**
	 * Close the 'Filters'-dialog and restores the filterbar.
	 * @private
	 * @param {sap.ui.layout.form.Form} oForm representing the filters
	 */
	FilterBar.prototype._closeDialogAndRestoreFilterBar = function(oForm) {

		this._sSearchCriteriaInFiltersDialog = null;

		this._oVariant = {};

		oForm.removeAllFormContainers();

		this._recreateBasicAreaContainer();

		this._deleteProperties();
		this._adaptGroupsTitle();

		if (this._fRegisteredFilterChangeHandlers) {

			this.detachFilterChange(this._fRegisteredFilterChangeHandlers);
			this._fRegisteredFilterChangeHandlers = null;
		}

		if (this.isLiveMode && this.isLiveMode()) {
			this.search();
		}

		this._updateToolbarText();
	};

	FilterBar.prototype._variantSave = function(oEvent) {

		var sKey;
		this._oVariant = {};

		this.fireBeforeVariantSave();

		if (this._oVariantManagement && this._oFilterDialog) {
			sKey = this._oVariantManagement.getSelectionKey();
			this._oVariant.key = sKey;
			this._oVariant.modified = false;
			this._oVariant.content = this._oVariantManagement.getVariantContent(this, sKey);
		}
	};

	FilterBar.prototype._afterVariantSave = function(oEvent) {

		this.fireAfterVariantSave();
	};

	FilterBar.prototype._variantSavePressed = function(oEvent) {

		this._bVariantSavePressed = true;

		if (this._oVariantManagement) {

			var sKey = this._oVariantManagement.getSelectionKey();
			var oCurrentItem = this._oVariantManagement.getItemByKey(this._oVariantManagement.getSelectionKey());

			if (!this._oVariantManagement._isIndustrySolutionModeAndVendorLayer() && ((sKey === this._oVariantManagement.getStandardVariantKey()) || (oCurrentItem && oCurrentItem.getReadOnly && oCurrentItem.getReadOnly()))) {
				this._oVariantManagement._openSaveAsDialog();
			} else {
				this._oVariantManagement._variantSavePressed();
			}

			this._bDirtyViaDialog = false;

			if (this._oInitialVariant && this._oVariantManagement._getVariantContent) {
				this._oInitialVariant.content = this._oVariantManagement._getVariantContent(this, sKey);
			}
		}

	};

	FilterBar.prototype._findFirstVisibleGroup = function() {
		var n = null;

		for (n in this._mAdvancedAreaFilter) {
			if (n && this._mAdvancedAreaFilter[n].formcontainer && this._mAdvancedAreaFilter[n].formcontainer.getVisible()) {
				return this._mAdvancedAreaFilter[n].formcontainer.getTitle();
			}
		}

		return null;
	};

	FilterBar.prototype._checkForCollision = function(oTitleElement, oLabelElement) {

		var oResizeDomRef = this._oFilterDialog.getDomRef("scroll");
		this._oLabelTextWidth = Math.max(oLabelElement.width(), this._oLabelTextWidth);
		if (!this._oLabelTextWidth) {
			return false;
		}

		// relevant in visual filterts scenario with initial non-standard filters dialog content
		if (!(oTitleElement.position() && oTitleElement.width())) {
			return false;
		}

		if ((this._oLabelTextWidth > 0) && oResizeDomRef && (oTitleElement.position().left + oTitleElement.width()) >= (oResizeDomRef.clientWidth - this._oLabelTextWidth - 32)) {
// if (this._oAddToFilterBarLabel) {
// this._oAddToFilterBarLabel.setText("");
// }

			return true;
		}

		return false;

	};

	FilterBar.prototype._repositionAddToFilterBarLabel = function() {

		if (this._isNewFilterBarDesign() || !this._isPhone()) {

			var oTitle = this._findFirstVisibleGroup();

			if (oTitle && this._oAddToFilterBarLabel) {

				var oTitleElement = oTitle.$();
				if (oTitleElement) {

					var oLabelElement = this._oAddToFilterBarLabel.$();
					if (oLabelElement) {

						oTitleElement.css({
							display: "inline"
						});

						if (this._checkForCollision(oTitleElement, oLabelElement)) {
							return;
						}

						var oTitlePosition = oTitleElement.offset();
						var oLabelOffset = oLabelElement.offset();
						if (oLabelOffset && oTitlePosition) {
							oLabelOffset.top = Math.ceil(oTitlePosition.top);
							oLabelElement.offset(oLabelOffset);

							if (!sap.ui.getCore().getConfiguration().getRTL()) {
								oLabelElement.css({
									left: "auto"
								});
							}
						}
					}
				}
			}

			if (this._oAddToFilterBarLabel && !this._oAddToFilterBarLabel.getText()) {
				this._oAddToFilterBarLabel.setText(this._oRb.getText("FILTER_BAR_SHOW_IN_FILTERBAR"));
			}
		}
	};

	// indicates a filter change in the control, but not in the model
	FilterBar.prototype._filterSetInErrorState = function(oControl) {
		if (this._oFilterDialog && this._oFilterDialog.isOpen()) {
			if (this._getConsiderFilterChanges() && this._oVariantManagement && !this._oVariantManagement.getInErrorState()) {
				this._oVariantManagement.currentVariantSetModified(true);
			}
			this._bDirtyViaDialog = true;
		}
	};

	FilterBar.prototype._cancelFilterDialog = function(bVariantSaveTriggered) {

		// in case the save variant was canceled by the user, set the dirty flag to true,
		// since the save variant was only possible with a dirty variant
		// BCP: 1670342256
		if (bVariantSaveTriggered && this._oVariantManagement) {
			this._bDirtyViaDialog = this._oVariantManagement._bSaveCanceled;
		}

		// BCP: 1780159203
		if (!this.getPersistencyKey() && (this.getUseSnapshot() === false)) {
			this.fireCancel();
			return;
		}

		if (this._oInitialVariant && this._oInitialVariant.content && this._bDirtyViaDialog) {

			this._resetFiltersInErrorValueState();

			this.applyVariant(this._oInitialVariant.content, "CANCEL");

			if (this._oVariantManagement) {
				if (!this._oVariantManagement.isPageVariant()) {
					this._oVariantManagement._setSelectionByKey(this._oInitialVariant.key);
				}
				this._oVariantManagement.currentVariantSetModified(this._oInitialVariant.modified);
			}

			this.fireCancel();
		}
	};

	/**
	 * Resets filters in value state error to value state none. The error value is set in control and not propagated to the model. It is not possible
	 * to restore a filter which was already in error state, once the filters dialog is opened.
	 * @private
	 */
	FilterBar.prototype._resetFiltersInErrorValueState = function() {
		var aNameControls;

		aNameControls = this._retrieveCurrentSelectionSet(true, true);
		aNameControls.forEach(function(oObj) {
			if (oObj.control && oObj.control.setValueState && oObj.control.getValueState) {
				if (oObj.control.getValueState() === ValueState.Error) {
					// oBind = oObj.control.getBinding("value");
					// if (oBind) {
					if (oObj.control.setValue) {
						oObj.control.setValue("");
					}
					// oBind.checkUpdate(true);
					oObj.control.setValueState(ValueState.None);
					// }
				}
			}

		});

	};

	/**
	 * Creates and shows the filters dialog. This method may only be called when FilterBar is displayed and basically accessible. It may also only be
	 * called when the filters dialog is currently not opened.
	 * @public
	 */
	FilterBar.prototype.showFilterDialog = function() {
		if (!this._oFilterDialog) {
			this._showFilterDialog();
		}
	};

	/**
	 * Enables to add application specific content to the filters dialog. If the content was not yet added it will be added. The content will be set
	 * to visible, all other filters dialog content will be set to invisible.
	 * @public
	 * @param {sap.ui.core.Control} oContent to be added; if empty, nothing is inserted.
	 * @returns {sap.ui.core.Control} oContent added or <code>null</code> when filters dialog is not active.
	 */
	FilterBar.prototype.addFilterDialogContent = function(oContent) {
		if (this._oFilterDialog && oContent) {
			var nIdx = this._oFilterDialog.indexOfContent(oContent);
			if (nIdx < 0) {
				this._oFilterDialog.addContent(oContent);
			}

			return this._setFilterDialogActiveContent(oContent);
		}

		return null;
	};

	/**
	 * Returns the filter dialog content. <code>Node:</code>The original content is a {@link sap.ui.layout.form.Form Form}. The form may be
	 * enhanced with a toolbar to enable the inner switch to an added custom content. Besides such operations, the original content should not be
	 * manipulated in any way.
	 * @public
	 * @returns {array} of filters dialog content.
	 */
	FilterBar.prototype.getFilterDialogContent = function() {
		if (this._oFilterDialog) {
			return this._oFilterDialog.getContent();
		}

		return null;
	};

	FilterBar.prototype._setFilterDialogActiveContent = function(oNewActiveContent) {
		var bActiveContentFound = false;
		if (this._oFilterDialog) {

			this.getFilterDialogContent().forEach(function(oContent) {
				if (oNewActiveContent === oContent) {
					oContent.setVisible(true);
					bActiveContentFound = true;
				} else {
					oContent.setVisible(false);
				}
			});

			if (bActiveContentFound) {
				return oNewActiveContent;
			}
		}

		return null;
	};

	FilterBar.prototype._getFilterDialogActiveContent = function() {
		var oActiveContent = null;
		if (this._oFilterDialog) {

			this.getFilterDialogContent().some(function(oContent) {
				if (oContent.getVisible()) {
					oActiveContent = oContent;
					return true;
				}

				return false;
			});
		}

		return oActiveContent;
	};

	/**
	 * Sets the width of the content area of the dialog. The passed dimension will be interpreted as 'px'.
	 * @public
	 * @param {Number} nWidth the content width of the filters dialog.
	 */
	FilterBar.prototype.setContentWidth = function(nWidth) {
		if (this._oFilterDialog) {
			this._oFilterDialog.setContentWidth(nWidth + "px");
		}
	};

	/**
	 * Sets the height of the content area of the dialog. The passed dimension will be interpreted as 'px'.
	 * @public
	 * @param {Number} nHeight the content height of the filters dialog.
	 */
	FilterBar.prototype.setContentHeight = function(nHeight) {
		if (this._oFilterDialog) {
			this._oFilterDialog.setContentHeight(nHeight + "px");
		}
	};

	/**
	 * Creates and shows the 'Filters'-dialog.
	 * @private
	 */
	FilterBar.prototype._showFilterDialog = function() {

		jQuery.sap.require("sap.m.Dialog");

		var that = this;

		this._oFilterDialog = new sap.m.Dialog(this.getId() + "-adapt-filters-dialog", {
			stretch: Device.system.phone,
			resizable: true,
			draggable: true
		});
		this._oFilterDialog.setParent(this);

		this._oFilterDialog.addStyleClass("sapUiPopupWithPadding");

		if (this.$().closest(".sapUiSizeCompact").length > 0) {
			this._oFilterDialog.addStyleClass("sapUiSizeCompact");
		}

		this._oFilterDialog.addStyleClass("sapUiCompFilterBarDialog");
		if (!this._isPhone()) {
			this._oFilterDialog.addStyleClass("sapUiCompFilterBarDialogNonPhone");
		}

		// oDialog.afterClose
		var sTitleKey = "FILTER_BAR_ADV_FILTERS_DIALOG";
		if (this._isNewFilterBarDesign()) {
			sTitleKey = "FILTER_BAR_ADAPT_FILTERS_DIALOG";
		}
		this._oFilterDialog.setTitle(this._oRb.getText(sTitleKey));

		this._oFilterDialog.addStyleClass("sapMH4FontSize");
		this._oFilterDialog.addStyleClass("sapMH4Style");

		this._oFilterDialog.setVerticalScrolling(true);

		var oSubHeader = new Bar();
		this._oFiltersSearchField = new SearchField({
			placeholder: this._oRb.getText("FILTER_BAR_SEARCH")
		});

		oSubHeader.addContentRight(this._oFiltersSearchField);
		this._oFilterDialog.setSubHeader(oSubHeader);

		var oForm = this._createFiltersAndAdaptBasicArea();
		if (!oForm) {
			jQuery.sap.log.error("Content for Advanced Filters Dialog could not be created");
			return;
		}
		this._oFilterDialog.addContent(oForm);

		this._oFiltersSearchField.attachLiveChange(function(oEvent) {
			if (this._oFilterDialog) {

				this.fireFiltersDialogSearchForFilters(oEvent.getParameters());

				this._triggerSearchInFilterDialog(oEvent);
			}
		}.bind(this));

		this._bOKFiltersDialogTriggered = false;
		this._bVariantSaveFiltersDialogTriggered = false;
		this._oFilterDialog.bDoNotAddToBasicArea = true;

		this._oFilterDialog.attachBeforeOpen(function() {
			this.fireFiltersDialogBeforeOpen();
		}.bind(this));

		this._oFilterDialog.attachAfterOpen(function() {

			if (!this._isPhone() && (oForm === this._getFilterDialogActiveContent())) {
				var oResizeDomRef = that._oFilterDialog.getDomRef("scroll");
				if (oResizeDomRef) {
					this.setContentWidth(oResizeDomRef.clientWidth);
					this.setContentHeight(oResizeDomRef.clientHeight);
				}
			}

		}.bind(this));

		this._oFilterDialog.attachBeforeClose(function() {

			if (!that._bOKFiltersDialogTriggered) {
				that._cancelFilterDialog(that._bVariantSaveFiltersDialogTriggered);
			}

			delete that._oFilterDialog.bDoNotAddToBasicArea;
			that._closeDialogAndRestoreFilterBar(oForm);
		});

		this._oFilterDialog.attachAfterClose(function() {
			that._oBasicAreaLayout.rerender(); // seems to be required from 1.32...

			that._oInitialVariant = null;
			that._oFilterDialog.destroy();
			that._oFilterDialog = null;

			that._showHintText();

			var parameter = {};
			parameter.context = that._bOKFiltersDialogTriggered ? "SEARCH" : "CANCEL";

			that.fireFiltersDialogClosed(parameter);

			if (that._isNewFilterBarDesign()) {
				that._fHandleResize();
			}
		});

		this._oFilterDialog.setInitialFocus(this._oFiltersSearchField);

		this._addFilterDialogButtons(oForm);

		this._bDirtyViaDialog = false;
		this._oFilterDialog.open();
	};

	/**
	 * Determines if the filters dialog is opene.
	 * @protected
	 * @returns {boolean} State of filters dialog
	 */
	FilterBar.prototype.isDialogOpen = function() {
		return this._oFilterDialog ? true : false;
	};

	FilterBar.prototype._addFilterDialogButtons = function(oForm) {

		jQuery.sap.require("sap.m.OverflowToolbarPriority");
		jQuery.sap.require("sap.m.OverflowToolbarLayoutData");

		var that = this;
		var oModel;
		var oVariantSaveButton = null, oClearButton, oRestoreButton, oSearchButton, oCancelButton;

		// search button
		oSearchButton = new Button(this.getId() + "-btnGoFilterDialog", {
			text: this._oRb.getText("FILTER_BAR_GO"),
			press: function() {
				oSearchButton.focus();
				that._dialogSearch(oForm);
			},
			layoutData: new sap.m.OverflowToolbarLayoutData({
				priority: sap.m.OverflowToolbarPriority.NeverOverflow
			}),
			type: ButtonType.Emphasized
		});
		this._oFilterDialog.addButton(oSearchButton);

		if (!this.getAdvancedMode()) {

			// variant save button
			if (this._oVariantManagement && this._oVariantManagement.getVisible()) {

				this._oVariantManagement._delayedControlCreation();
				if (this._oVariantManagement.oVariantSave) {

					oVariantSaveButton = new Button(this.getId() + "-btnSaveFilterDialog", {
						text: this._oRb.getText("VARIANT_MANAGEMENT_SAVE"),
						enabled: this._oVariantManagement.oVariantSave.getEnabled(),
						press: function() {
							that._dialogVariantSave(oForm);
						},
						layoutData: new sap.m.OverflowToolbarLayoutData({
							priority: sap.m.OverflowToolbarPriority.Low
						})
					});

					oModel = this._oVariantManagement.getModel("save_enablement");

					oVariantSaveButton.setModel(oModel);
					oVariantSaveButton.bindProperty("enabled", "/enabled");

					this._oFilterDialog.addButton(oVariantSaveButton);

				}
			}

			// clear button
			oClearButton = new Button(this.getId() + "-btnClearFilterDialog", {
				text: this._oRb.getText("FILTER_BAR_CLEAR"),
				visible: this.getShowClearButton(),
				press: function() {
					that._dialogClear(oForm);
				},
				layoutData: new sap.m.OverflowToolbarLayoutData({
					priority: sap.m.OverflowToolbarPriority.Low
				})
			});

			this._oFilterDialog.addButton(oClearButton);

			// restore button
			oRestoreButton = new Button(this.getId() + "-btnRestoreFilterDialog", {
				text: this._oRb.getText("FILTER_BAR_RESTORE"),
				visible: this.getShowRestoreButton(),
				press: function() {
					that._dialogRestore(oForm);
				},
				layoutData: new sap.m.OverflowToolbarLayoutData({
					priority: sap.m.OverflowToolbarPriority.Low
				})
			});

			if (oModel) {
				oRestoreButton.setEnabled(this._oVariantManagement.oVariantSave.getEnabled());
				oRestoreButton.setModel(oModel);
				oRestoreButton.bindProperty("enabled", "/enabled");
			}

			this._oFilterDialog.addButton(oRestoreButton);

			// Cancel button
			oCancelButton = new Button(this.getId() + "-btnCancelFilterDialog", {
				text: this._oRb.getText("FILTER_BAR_CANCEL"),
				press: function() {
					that._dialogCancel(oForm);
				},
				layoutData: new sap.m.OverflowToolbarLayoutData({
					priority: sap.m.OverflowToolbarPriority.High
				})
			});
			this._oFilterDialog.addButton(oCancelButton);
		}
	};

	FilterBar.prototype._dialogSearch = function(oForm) {

		this.fireFiltersDialogSearch();

		this._searchRequested();

	};

	FilterBar.prototype._dialogCancel = function(oForm) {
		if (this._oFilterDialog) {
			this._bOKFiltersDialogTriggered = false;

			this.fireFiltersDialogCancel();

			this._oFilterDialog.close();
		}
	};

	FilterBar.prototype._dialogVariantSave = function(oForm) {
		this._bVariantSaveFiltersDialogTriggered = true;

		this._variantSavePressed();
	};

	FilterBar.prototype._dialogRestore = function(oForm) {

		// var bIsNotForm = (this._getFilterDialogActiveContent() !== oForm);
		// this.reset(bIsNotForm);
		this.reset();

// if (!bIsNotForm) {
		if (this._oVariantManagement && !this._oVariantManagement.getInErrorState()) {
			this._oVariantManagement.currentVariantSetModified(false);
		}
// }
	};

	FilterBar.prototype._dialogClear = function(oForm) {
		// var bIsNotForm = (this._getFilterDialogActiveContent() !== oForm);
		this.clear();
	};

	FilterBar.prototype._createButtons = function(oToolbar) {

		var that = this;

		this._oHideShowButton = new Button(this.getId() + "-btnShowHide", {
			text: this._oRb.getText("FILTER_BAR_HIDE"),
			tooltip: this._oRb.getText("FILTER_BAR_HIDE"),
			type: ButtonType.Transparent,
			enabled: false
		});
		this._oHideShowButton.attachPress(function() {
			that._toggleHideShow();
		});
		oToolbar.addContent(this._oHideShowButton);

		// clear button
		this._oClearButtonOnFB = new Button(this.getId() + "-btnClear", {
			visible: this.getShowClearOnFB(),
			text: this._oRb.getText("FILTER_BAR_CLEAR"),
			tooltip: this._oRb.getText("FILTER_BAR_CLEAR"),
			type: ButtonType.Transparent,
			enabled: false
		});
		this._oClearButtonOnFB.attachPress(function() {
			that.clear();
		});
		oToolbar.addContent(this._oClearButtonOnFB);

		this._oRestoreButtonOnFB = new Button(this.getId() + "-btnRestore", {
			visible: this.getShowRestoreOnFB(),
			text: this._oRb.getText("FILTER_BAR_RESTORE"),
			tooltip: this._oRb.getText("FILTER_BAR_RESTORE"),
			type: ButtonType.Transparent,
			enabled: false
		});
		this._oRestoreButtonOnFB.attachPress(function() {
			that.reset();
			if (that._oVariantManagement) {
				that._oVariantManagement.currentVariantSetModified(false);
			}
		});
		oToolbar.addContent(this._oRestoreButtonOnFB);

		this._oFiltersButton = new Button(this.getId() + "-btnFilters", {
			visible: this.getShowFilterConfiguration() || this._isPhone(),
			text: this._oRb.getText("FILTER_BAR_ACTIVE_FILTERS_ZERO"),
			tooltip: this._oRb.getText("FILTER_BAR_ACTIVE_FILTERS_ZERO"),
			type: ButtonType.Transparent,
			enabled: false
		});

		this._oFiltersButton.attachPress(function() {
			that._oFiltersButton.focus();
			that._showFilterDialog();
		});
		oToolbar.addContent(this._oFiltersButton);

		this._oSearchButton = new Button(this.getId() + "-btnGo", {
			visible: this.getShowGoOnFB(),
			text: this._oRb.getText("FILTER_BAR_GO"),
			tooltip: this._oRb.getText("FILTER_BAR_GO"),
			type: ButtonType.Emphasized
		});
		this._oSearchButton.attachPress(function() {
			that._oSearchButton.focus();
			that.search();
		});
		oToolbar.addContent(this._oSearchButton);
	};

	/**
	 * Creates the variant management.
	 * @private
	 * @returns {sap.ui.comp.variants.VariantManagement} the VM control
	 */
	FilterBar.prototype._createVariantLayout = function() {

		this._oVariantManagement = this._createVariantManagement();

		if (this._possibleToChangeVariantManagement()) {
			this._oVariantManagement.setVisible(false);
		}

		this._registerVariantManagement();

		return this._oVariantManagement;
	};

	FilterBar.prototype._createToolbar = function(bIgnoreVM) {

		var oToolbar = new Toolbar(this.getId() + "-toolbar");

		if (!bIgnoreVM) {
			var oVariantLayout = this._createVariantLayout();
			oToolbar.addContent(oVariantLayout);
		}

		oToolbar.addContent(new ToolbarSpacer());

		this._createButtons(oToolbar);

		oToolbar.addStyleClass("sapUiCompFilterBarToolbar");
		oToolbar.addStyleClass("sapUiCompFilterBarToolbarMarker");
		return oToolbar;
	};

	FilterBar.prototype._replaceVariantManagement = function(oVariantManagement) {
		if (this._oVariantManagement) {
			this._unregisterVariantManagement();

			if (this._oToolbar && this._oToolbar.getContent(this._oVariantManagement)) {
				this._oToolbar.removeContent(this._oVariantManagement);
			}

			this._oVariantManagement.destroy();
		}

		this._oVariantManagement = oVariantManagement;
		this._registerVariantManagement();

		this._adaptNewFilterBarDesign();
	};

	/**
	 * Creates the layout for the basic area.
	 * @private
	 * @returns {sap.ui.layout.HorizontalLayout} the layout for the selected fields
	 */
	FilterBar.prototype._createBasicAreaLayout = function() {

		// form for selection parameters
		var oBasicAreaLayout = new HorizontalLayout({
			visible: false
		});
		oBasicAreaLayout.setAllowWrapping(true);

		oBasicAreaLayout.addStyleClass("sapUiCompFilterBarWidth100");
		oBasicAreaLayout.addStyleClass("sapUiCompFilterBarBasicArea");
		return oBasicAreaLayout;
	};

	/**
	 * Creates the form for the advanced area, where all the filters will be placed. Only relevant for the value help scenario.
	 * @private
	 * @returns {sap.ui.layout.form.Form} the form for the filter fields
	 */
	FilterBar.prototype._createAdvancedAreaForm = function() {

		var oAdvancedLayout = new ResponsiveGridLayout();

		oAdvancedLayout.addStyleClass("sapUiCompFilterBarPaddingForm");

		oAdvancedLayout.setColumnsL(3);
		oAdvancedLayout.setColumnsM(2);
		var oForm = new Form({
			editable: true
		});
		oForm.setLayout(oAdvancedLayout);

		return oForm;
	};

	/**
	 * Adds a selection field to a FormContainer and this FormContainer to the basic area form.
	 * @private
	 * @param {sap.ui.comp.filterbar.FilterBar} oFilterItem filter
	 * @returns {sap.ui.layout.VerticalLayout} the container
	 */
	FilterBar.prototype._addControlToBasicAreaFormContainer = function(oFilterItem) {

		var oControl = oFilterItem.getControl();
		if (!oControl) {
			jQuery.sap.log.error("no Control obtained");
			return null;
		}

		var oLabel = oFilterItem.getLabelControl(this.getId());
		if (!oLabel) {
			jQuery.sap.log.error("no Label obtained");
			return null;
		}

		this._adaptGroupTitleForFilter(oFilterItem);

		return this._addControlToBasicAreaContainer(oFilterItem, oControl, oLabel);

	};

	/**
	 * Adds a selection field to a FormContainer and the FormContainer to the basic area form
	 * @private
	 * @param {sap.ui.comp.filterbar.FilterBar} oFilterItem the filter item
	 * @param {sap.ui.core.Control} oControl the filter control
	 * @param {sap.m.Label} oLabel the label of the filter
	 * @returns {sap.ui.layout.VerticalLayout} the container
	 */
	FilterBar.prototype._addControlToBasicAreaContainer = function(oFilterItem, oControl, oLabel) {

		var oVLayout = new VerticalLayout();
		oVLayout.setLayoutData(new ResponsiveFlowLayoutData({
			margin: true
		}));

		if (oControl.setWidth) {
			oControl.setWidth("100%");
		}

		oVLayout.setWidth(this.getFilterContainerWidth());

		if (oLabel) {
			if (!oLabel.hasStyleClass("sapUiCompFilterLabel")) {
				oLabel.addStyleClass("sapUiCompFilterLabel");
			}
			oVLayout.addContent(oLabel);

			if (oLabel.setLabelFor) {
				if (oFilterItem && oControl) {
					oLabel.setLabelFor(oControl);
				} else if (oControl) {
					jQuery.sap.require("sap.ui.core.InvisibleText");
					var oInvisibleText = new sap.ui.core.InvisibleText({
						text: this._oRb.getText("FILTER_BAR_BSEARCH_PLACE_HOLDER")
					});

					oVLayout.addContent(oInvisibleText);
					oControl.addAriaLabelledBy(oInvisibleText);
				}
			}
		}

		oVLayout.addContent(oControl);

		oVLayout.addStyleClass("sapUiCompFilterBarPaddingRight");
		oVLayout.addStyleClass("sapUiCompFilterBarPaddingTop");

		if (!this.getAdvancedMode() && (!this._oFilterDialog || (!this._oFilterDialog.hasOwnProperty("bDoNotAddToBasicArea")))) {

			if (oFilterItem && oFilterItem.getVisible() && oFilterItem.getVisibleInFilterBar()) {
				if (this._isNewFilterBarDesign()) {
					var aContent = this._oBasicAreaLayout.getContent();
					if (this._isPhone()) {
						this._oBasicAreaLayout.addContent(oVLayout);
					} else {
						this._oBasicAreaLayout.insertContent(oVLayout, aContent.length - 1);
					}
				} else {
					this._oBasicAreaLayout.addContent(oVLayout);
				}
			}
		}

		return oVLayout;
	};

	FilterBar.prototype._rerenderAA = function() {

		this._oAdvancedAreaForm.removeAllFormContainers();

		var aControls = this._flattenMap();
		this._layOutAA(aControls);
	};

	/**
	 * Recreates the layout for all visible filters in the advanced area.
	 * @private
	 * @param {array} aControls list of visible advanced area filter elements
	 */
	FilterBar.prototype._layOutAA = function(aControls) {

		if (this._mAdvancedAreaFilter && Object.keys(this._mAdvancedAreaFilter).length > 1) {
			this._layOutAAMultipleGroup(aControls);
		} else {
			this._layOutAASingleGroup(aControls);
		}
	};

	/**
	 * Recreates the layout for all visible filters in the advanced area. Each Group will be rendered in a FormContainer.
	 * @private
	 * @param {array} aControls list of visible advanced area filter elements
	 */
	FilterBar.prototype._layOutAAMultipleGroup = function(aControls) {

		var i, j, nGroups = 0;
		var oFormContainer = null;

		for (i = 0; i < aControls.length; i++) {
			if (aControls[i].control === null) {
				nGroups++;
			}
		}

		var oAdvancedLayout = this._oAdvancedAreaForm.getLayout();
		if (oAdvancedLayout) {
			if (nGroups >= 3) {
				oAdvancedLayout.setLabelSpanL(5);
				oAdvancedLayout.setLabelSpanM(5);
				oAdvancedLayout.setColumnsL(3);
				oAdvancedLayout.setColumnsM(2);
			} else if (nGroups === 2) {
				oAdvancedLayout.setLabelSpanL(4);
				oAdvancedLayout.setLabelSpanM(5);
				oAdvancedLayout.setColumnsL(2);
				oAdvancedLayout.setColumnsM(2);
			} else if (nGroups === 1) {

				// + dummy group
				oAdvancedLayout.setLabelSpanL(4);
				oAdvancedLayout.setLabelSpanM(5);
				oAdvancedLayout.setColumnsL(2);
				oAdvancedLayout.setColumnsM(2);
			}
		}

		for (i = 0; i < aControls.length; i++) {
			if (aControls[i].control === null) {
				oFormContainer = new FormContainer();

				if (Object.keys(this._mAdvancedAreaFilter).length > 1) { // hide group when only one group is present

					oFormContainer.setTitle(aControls[i].filterItem.getGroupTitle());
				}
				this._oAdvancedAreaForm.addFormContainer(oFormContainer);

				j = i + 1;
				while (j < aControls.length && (aControls[j].control)) {
					this._addControlToAdvancedArea(aControls[j].filterItem, aControls[j].control, oFormContainer);
					j++;
				}

				i = j - 1;
			}
		}

		if (nGroups === 1) {
			this._oAdvancedAreaForm.addFormContainer(new FormContainer()); // dummy
		}
	};

	/**
	 * If only one group with multiple filter fields is available, it will be layouted in two columns. a dummy group will be created and the controls
	 * will be destributed between them.
	 * @private
	 * @param {array} aControls list of visible advanced area filter elements. First element is a group
	 */
	FilterBar.prototype._layOutAASingleGroup = function(aControls) { // adapt to LMS

		var i, idx, nCount, bMod;
		var nFields = aControls.length - 1;
		var nNewGroups = nFields > 2 ? 2 : 1;

		if (nNewGroups > 1) {
			nCount = Math.floor(nFields / nNewGroups);
			bMod = ((nCount * nNewGroups) < nFields);

			for (i = 1; i < nNewGroups; i++) {
				idx = i * nCount;
				if (bMod) {
					++idx;
				}

				if ((idx + i) < aControls.length) {
					aControls.splice(idx + i, 0, aControls[0]); // add dummy group
				}
			}
		}

		this._layOutAAMultipleGroup(aControls);
	};

	/**
	 * Converts the map containing the advanced area filters to an array for simpler handling; only visible filter items are considered.
	 * @private
	 * @returns {array} oControl the visible filter fields
	 */
	FilterBar.prototype._flattenMap = function() {

		var n = null, i;
		var aControls = [];
		var bGroupIsAdded;

		if (this._mAdvancedAreaFilter) {

			for (n in this._mAdvancedAreaFilter) {

				if (n && this._mAdvancedAreaFilter[n].items) {

					bGroupIsAdded = false;
					for (i = 0; i < this._mAdvancedAreaFilter[n].items.length; i++) {
						var oItem = this._mAdvancedAreaFilter[n].items[i];

						if (oItem.filterItem && oItem.filterItem.getVisibleInFilterBar() && oItem.filterItem.getVisible() && !oItem.filterItem.getHiddenFilter()) {

							if (!bGroupIsAdded) {
								bGroupIsAdded = true;

								aControls.push({
									control: null,
									filterItem: this._mAdvancedAreaFilter[n].filterItem
								});
							}

							aControls.push({
								control: oItem.control,
								filterItem: oItem.filterItem
							});
						}
					}
				}
			}
		}

		return aControls;
	};

	/**
	 * Executes search in the 'Add/Remove Filters' dialog.
	 * @private
	 * @param {string} sValue the search string
	 */
	FilterBar.prototype._triggerSearchByValue = function(sValue) {

		var i, sText, sTooltip;
		var aContent;
		var bIsVisible;

		sValue = sValue.replace(/^\s+|\s+$/g, "").toLowerCase();

		if (this._aListItems) {

			var iSelectedItems = 0;
			for (i = this._aListItems.length - 1; i >= 0; i--) {

				aContent = this._aListItems[i].getContent();
				if (aContent && (aContent.length > 0)) {
					sText = aContent[0].getText();
					sTooltip = this._aListItems[i].data("quickinfo");
					// we want to show an item if it's either an item matching the search or if it's a group item with at least one item selected.
					if ((sText.toLowerCase().indexOf(sValue) >= 0 || (sTooltip && sTooltip.toLowerCase().indexOf(sValue) >= 0)) || (this._aListItems[i].hasStyleClass("sapUiCompFilterBarGroupListItem") && iSelectedItems > 0)) {

						bIsVisible = true;
						if (this._aListItems[i].hasStyleClass("sapUiCompFilterBarGroupListItem")) {

							if (!iSelectedItems) {
								bIsVisible = false; // matching text for group, but not hits in items
							}

						} else {
							iSelectedItems++; // a matching non-group item
						}
						this._aListItems[i].setVisible(bIsVisible);
					} else {
						this._aListItems[i].setVisible(false); // no hit
					}
				}
			}
		}
	};

	/**
	 * Reacts to search field selection.
	 * @private
	 * @param {object} oEvent containing the search string
	 */
	FilterBar.prototype._triggerSearch = function(oEvent) {

		if (!oEvent) {
			return;
		}

		var parameters = oEvent.getParameters();
		if (!parameters) {
			return;
		}

		var sValue = parameters.newValue ? parameters.newValue : "";

		this._triggerSearchByValue(sValue);
	};

	/**
	 * Reacts to search field selection. Hide all non matching list entries.
	 * @private
	 * @param {string} sValue the search string
	 */
	FilterBar.prototype._triggerSearchByValueInFilterDialog = function(sValue) {

		var n = null, i;
		var sText;
		var oGroupElement, oFilterItem;
		var nCountInvisibleElements;
		var nCountNonPartOfCurrentVariant;

		var bNoFilterIsVisible = true;

		sValue = sValue.replace(/^\s+|\s+$/g, "").toLowerCase();

		if (this._mAdvancedAreaFilter) {
			for (n in this._mAdvancedAreaFilter) {
				if (n) {
					oGroupElement = this._mAdvancedAreaFilter[n];
					if (oGroupElement && oGroupElement.items) {

						nCountInvisibleElements = 0;
						nCountNonPartOfCurrentVariant = 0;

						for (i = 0; i < oGroupElement.items.length; i++) {
							if (oGroupElement.items[i] && oGroupElement.items[i].filterItem) {

								oFilterItem = oGroupElement.items[i].filterItem;

								if (oFilterItem.getHiddenFilter()) {
									++nCountInvisibleElements;
									continue;
								}

								if (oFilterItem.getVisible()) {

									if (sValue && oGroupElement.items[i].formelement) {

										sText = oFilterItem.getLabel();

										if (sText.toLowerCase().indexOf(sValue) >= 0) {
											if (oFilterItem.getPartOfCurrentVariant()) {
												oGroupElement.items[i].formelement.setVisible(true);
											} else {
												++nCountNonPartOfCurrentVariant;
											}
										} else {
											++nCountInvisibleElements;
											oGroupElement.items[i].formelement.setVisible(false);
										}

									} else if (oGroupElement.items[i].formelement) {
										// reset to a state without considering search
										oGroupElement.items[i].formelement.setVisible(oFilterItem.getVisibleInFilterBar() || oFilterItem.getPartOfCurrentVariant());
										if (oGroupElement.link && !oGroupElement.link.getVisible()) {
											oGroupElement.link.setVisible(true);
										}
									}
								} else {
									++nCountInvisibleElements;
								}
							}
						}

						if (oGroupElement && oGroupElement.formcontainer) {
							if (nCountInvisibleElements === oGroupElement.items.length) {
								oGroupElement.formcontainer.setVisible(false);
							} else {

								bNoFilterIsVisible = false;

								oGroupElement.formcontainer.setVisible(true);

								if (oGroupElement.link) {
									oGroupElement.link.setVisible((sValue && (nCountNonPartOfCurrentVariant === 0)) ? false : true);

									if (sValue && (nCountNonPartOfCurrentVariant > 0)) {
										this._setLinkTextAndCount(n, oGroupElement.link, nCountNonPartOfCurrentVariant);
									} else {
										this._setLinkText(n, oGroupElement.link);
									}
								}
							}
						}
					}
				}
			}
		}

		if (this._oAddToFilterBarLabel) {
			this._oAddToFilterBarLabel.setVisible(!bNoFilterIsVisible);
		}
	};

	/**
	 * Reacts to search from 'Filters'- dialog. Hide all non matching list entries.
	 * @private
	 * @param {object} oEvent containing the search string
	 */
	FilterBar.prototype._triggerSearchInFilterDialog = function(oEvent) {

		if (!oEvent) {
			return;
		}

		var parameters = oEvent.getParameters();
		if (!parameters) {
			return;
		}

		var sValue = parameters.newValue ? parameters.newValue : "";

		this._sSearchCriteriaInFiltersDialog = sValue;

		this._triggerSearchByValueInFilterDialog(sValue);
	};

	/**
	 * Generate for a passed group all the filters in the 'Add/Remove Filters'-dialog
	 * @private
	 * @param {string} sGroupName filter group name
	 * @param {sap.m.List} oList containing the fields of a group
	 */
	FilterBar.prototype._generateListItems = function(sGroupName, oList) {

		jQuery.sap.require("sap.m.CustomListItem");

		var i;
		var oListItem, aAdvacedElements;
		// var aListItems = [];
		var oLabel;
		var bCompactMode = false;

		if (this.$().closest(".sapUiSizeCompact").length > 0) {
			bCompactMode = true;
		}

		if (sGroupName && this._mAdvancedAreaFilter) {

			aAdvacedElements = this._mAdvancedAreaFilter[sGroupName];

			if (aAdvacedElements && aAdvacedElements.items) {

				for (i = 0; i < aAdvacedElements.items.length; i++) {
					var oItem = aAdvacedElements.items[i];

					if (oItem && oItem.filterItem) {

						if (!oItem.filterItem.getVisible() || oItem.filterItem.getHiddenFilter()) {
							continue;
						}

						oListItem = new sap.m.CustomListItem();
						oListItem.setVisible(true);

						// details
						if (!bCompactMode) {
							oListItem.addStyleClass("sapUiCompFilterBarListItem");
						} else {
							oListItem.addStyleClass("sapUiCompFilterBarListItemCompact");
						}
						oListItem.data("quickinfo", oItem.filterItem.getLabelTooltip());

						oItem.initialPartOfCurrentVariant = oItem.filterItem.getPartOfCurrentVariant();
						oItem.initialVisibleInFilterBar = oItem.filterItem.getVisibleInFilterBar();

						oListItem.data('item', oItem);

						oLabel = new Label({
							text: oItem.filterItem.getLabel(),
							tooltip: oItem.filterItem.getLabelTooltip()
						});
						oListItem.addContent(oLabel);

						oList.addItem(oListItem);
						if (oItem.filterItem.getPartOfCurrentVariant()) {
							oList.setSelectedItem(oListItem);
						}

						if (oItem.filterItem.getMandatory() && oItem.checkbox && !oItem.checkbox.getEnabled()) {
							oListItem.getModeControl().setEnabled(false);
						}
					}
				}
			}
		}

		var that = this;
		oList.attachSelectionChange(function(oEvent) {
			if (oEvent) {
				var oParams = oEvent.getParameters();
				if (oParams) {
					var oListItem = oParams.listItem;
					if (oListItem) {
						var oCheckBox = oListItem.getModeControl();
						var oItem = oListItem.data('item');
						that._selectionChangedInAddFiltersDialog(oCheckBox, oItem);
					}
				}
			}
		});
	};

	/**
	 * Adapts the visibility of the filter containers.
	 * @private
	 * @param {object} oItem representing the filter item
	 */
	FilterBar.prototype._rerenderItem = function(oItem) {

		var bFlag;
		if (oItem) {

			bFlag = oItem.filterItem.getVisible() && oItem.filterItem.getVisibleInFilterBar();

			if (oItem.container) {
				oItem.container.setVisible(bFlag);

				if (bFlag) {
					this._addContainer(oItem);
				}
			}

			if (oItem.formelement) {
				oItem.formelement.setVisible(oItem.filterItem.getVisible() && (oItem.filterItem.getVisibleInFilterBar() || oItem.filterItem.getPartOfCurrentVariant()));
				if (oItem.checkbox) {
					oItem.checkbox.setSelected(oItem.filterItem.getVisibleInFilterBar());
				}
			}
		}
	};

	/**
	 * Adapt the visibility for all filter containers.
	 * @private
	 */
	FilterBar.prototype._rerenderFilters = function() {

		var i;
		var n = null;
		var oItem = null;

		if (this._mAdvancedAreaFilter) {
			for (n in this._mAdvancedAreaFilter) {
				if (n && this._mAdvancedAreaFilter[n] && this._mAdvancedAreaFilter[n].items) {
					for (i = 0; i < this._mAdvancedAreaFilter[n].items.length; i++) {
						oItem = this._mAdvancedAreaFilter[n].items[i];
						this._rerenderItem(oItem);
					}
				}
			}
		}

		this._updateToolbarText();
	};

	/**
	 * Adapts the visibility for all filter containers.
	 * @private
	 */
	FilterBar.prototype.rerenderFilters = function() {

		this._rerenderFilters();
	};

	/**
	 * Cleans-up and closes the 'Add/Remove Filters'- dialog.
	 * @private
	 * @param {string} sGroupName name of the group for which the filters will be displayed
	 * @param {sap.m.Link} oLink control from filters dialog
	 */
	FilterBar.prototype._closeAddRemoveFiltersDialog = function(sGroupName, oLink) {

		if (sGroupName && oLink) {
			if (this._sSearchCriteriaInFiltersDialog && this._oFilterDialog) {
				this._triggerSearchByValueInFilterDialog(this._sSearchCriteriaInFiltersDialog);
			} else {
				this._setLinkText(sGroupName, oLink);
			}
		}
	};

	/**
	 * Eventhandler for the 'Cancel'-button on the 'Add/Remove Filters'- dialog.
	 * @private
	 * @param {string} sGroupName name of the group for which the filters will be displayed
	 */
	FilterBar.prototype._cancelAddRemoveFiltersDialog = function(sGroupName) {

		var i;
		var oItem;

		if (sGroupName && this._mAdvancedAreaFilter && this._mAdvancedAreaFilter[sGroupName] && this._mAdvancedAreaFilter[sGroupName].items) {
			for (i = 0; i < this._mAdvancedAreaFilter[sGroupName].items.length; i++) {
				oItem = this._mAdvancedAreaFilter[sGroupName].items[i];
				if ((oItem.initialPartOfCurrentVariant !== undefined || oItem.initialVisibleInFilterBar !== undefined) && oItem.filterItem) {

					if (oItem.filterItem.getHiddenFilter()) {
						continue;
					}

					if ((oItem.initialPartOfCurrentVariant !== undefined) && (oItem.filterItem.getPartOfCurrentVariant() !== oItem.initialPartOfCurrentVariant)) {
						oItem.filterItem.setPartOfCurrentVariant(oItem.initialPartOfCurrentVariant);
						this._notifyAboutChangedFilters(oItem.initialPartOfCurrentVariant, oItem.control);
					}

					if ((oItem.initialVisibleInFilterBar !== undefined) && (oItem.filterItem.getVisibleInFilterBar() !== oItem.initialVisibleInFilterBar)) {
						oItem.filterItem.setVisibleInFilterBar(oItem.initialVisibleInFilterBar);
					}
				}
			}
		}

		if (this._oVariantManagement && (this._oVariant.modified2 !== undefined)) {
			this._oVariantManagement.currentVariantSetModified(this._oVariant.modified2);
		}
	};

	/**
	 * Creates the 'Add/Remove Filters' - dialog.
	 * @private
	 * @param {string} sGroupName filter group name
	 * @param {sap.m.Link} oLink more/clear filters link
	 */
	FilterBar.prototype._createAddRemoveFiltersDialog = function(sGroupName, oLink) {

		jQuery.sap.require("sap.m.Dialog");
		jQuery.sap.require("sap.m.ListMode");

		var i, that = this;

		if (!sGroupName) {
			return;
		}

		this._oDialog = new sap.m.Dialog(this.getId() + "-set-filters-dialog", {
			stretch: Device.system.phone,
			resizable: true,
			draggable: true
		});
		this._oDialog.addStyleClass("sapUiPopupWithPadding");
		this._oDialog.addStyleClass("sapUiCompAddRemoveFilterDialog");

		if (this.$().closest(".sapUiSizeCompact").length > 0) {
			this._oDialog.addStyleClass("sapUiSizeCompact");
		}

		this._oDialog.setTitle(this._oRb.getText("SELECT_FILTER_FIELDS"));

		this._oDialog.addStyleClass("sapMH4FontSize");
		this._oDialog.addStyleClass("sapMH4Style");

		this._oDialog.setVerticalScrolling(true);

		var oSubHeader = new Bar();
		var oSearchField = new SearchField({
			placeholder: this._oRb.getText("FILTER_BAR_SEARCH")
		});
		this._oSearchField = oSearchField;
		oSearchField.attachLiveChange(function(oEvent) {
			that._triggerSearch(oEvent);
		});

		oSubHeader.addContentRight(oSearchField);
		this._oDialog.setSubHeader(oSubHeader);

		var oList = new List({
			mode: sap.m.ListMode.MultiSelect
		});
		oList.setShowSeparators(ListSeparators.None);
		this._oDialog.addContent(oList);

		this._generateListItems(sGroupName, oList);

		this._aListItems = oList.getItems();

		for (i = 0; i < this._aListItems.length; i++) {
			oList.addItem(this._aListItems[i]);
		}

		if (this._oVariant && this._oVariantManagement) {
			this._oVariant.modified2 = this._oVariantManagement.currentVariantGetModified();
		}

		this._bOKButtonAddRemoveFilterDialogTriggered = false;
		// OK button
		var oOKButton = new Button(this.getId() + "-btnOKAddRemoveDialog", {
			text: this._oRb.getText("FILTER_BAR_OK")
		});
		oOKButton.attachPress(function() {
			that._bOKButtonAddRemoveFilterDialogTriggered = true;
			that._oDialog.close();
		});
		this._oDialog.addAggregation("buttons", oOKButton);

		this._oDialog.setInitialFocus(this._oSearchField);

		if (this._sSearchCriteriaInFiltersDialog) {
			this._oSearchField.setValue(this._sSearchCriteriaInFiltersDialog);
			this._triggerSearchByValue(this._sSearchCriteriaInFiltersDialog);
		}

		// Cancel button
		var oCancelButton = new Button(this.getId() + "-btnCancelAddRemoveDialog", {
			text: this._oRb.getText("FILTER_BAR_CANCEL"),
			press: function() {
				that._oDialog.close();
			}
		});
		this._oDialog.addAggregation("buttons", oCancelButton);

		this._oDialog.attachBeforeClose(function() {
			if (!that._bOKButtonAddRemoveFilterDialogTriggered) {
				that._cancelAddRemoveFiltersDialog(sGroupName);
			}

			that.rerenderFilters();

			that._closeAddRemoveFiltersDialog(sGroupName, oLink);

			if (that._oFilterDialog) {
				that._oFilterDialog.invalidate();
			}
		});

		this._oDialog.attachAfterClose(function() {
			this._aListItems = null;

			that._oDialog.destroy();
			that._oDialog = null;
		});

		this._oDialog.open();
	};

	/**
	 * Handles the selection change of the checkbox in the 'Add/Remove Filters' - dialog.
	 * @private
	 * @param {sap.m.Checkbox} oCheckBox representing visible in FilterBar
	 * @param {object} oItem internal object associated with this checkbox
	 */
	FilterBar.prototype._selectionChangedInAddFiltersDialog = function(oCheckBox, oItem) {

		var bVisible = oCheckBox.getSelected();

		if (!bVisible && oItem.filterItem.getMandatory() && !oItem.checkbox.getEnabled()) {
			oCheckBox.setSelected(true);
			return; // only enabled entries (mandatory with values) can be removed from the filters dialog
		}

		oItem.filterItem.setPartOfCurrentVariant(bVisible);
		oItem.filterItem.setVisibleInFilterBar(bVisible);

		// this._rerenderItem(oItem);

		this._notifyAboutChangedFilters(bVisible, oItem.control);
	};

	FilterBar.prototype._setTriggerFilterChangeState = function(bFlag) {

		this._triggerFilterChangeState = bFlag;
	};
	FilterBar.prototype._getTriggerFilterChangeState = function() {

		return this._triggerFilterChangeState;
	};

	/**
	 * Sets the semaphore for variant change.
	 * @private
	 * @param {boolean} bFlag setting the semaphore state
	 */
	FilterBar.prototype._setConsiderFilterChanges = function(bFlag) {

		this._filterChangeSemaphore = bFlag;
	};

	/**
	 * Retrieves the semaphore for variant change.
	 * @private
	 * @returns {boolean} the semaphore state
	 */
	FilterBar.prototype._getConsiderFilterChanges = function() {

		return this._filterChangeSemaphore;
	};

	/**
	 * Notifies about a filter change.
	 * @private
	 * @param {object} oEvent general event object
	 * @param {boolean} bDoNotPropagate if set do not raise the filterChange event
	 */
	FilterBar.prototype.fireFilterChange = function(oEvent) {

		this._updateToolbarText();

		if (!this._getTriggerFilterChangeState()) {
			return;
		}

		if (this._getConsiderFilterChanges() && this._oVariantManagement && !this._oVariantManagement.getInErrorState()) {
			this._oVariantManagement.currentVariantSetModified(true);
		}

		if (this._oFilterDialog && !(this._oFilterDialog.isOpen())) {
			return;
		}

		this._bDirtyViaDialog = true;
		this.fireEvent("filterChange", oEvent);

		if (this._isNewFilterBarDesign()) {
			// this._fHandleResize();
		}
	};

	/**
	 * Prepares event object and fire the 'filterChange' event.
	 * @private
	 * @param {boolean} bVisible indicated whether an filter was added or removed
	 * @param {sap.ui.core.Control} oControl which was either added or removed
	 */
	FilterBar.prototype._notifyAboutChangedFilters = function(bVisible, oControl) {

		var oObj, oFilterItem = this._determineByControl(oControl);

		if (bVisible) {
			oObj = {
				"added": oControl,
				"filterItem": oFilterItem
			};
		} else {
			oObj = {
				"deleted": oControl,
				"filterItem": oFilterItem
			};
		}

		this.fireFilterChange(oObj);

	};

	FilterBar.prototype._determineVariantFiltersInfo = function(bConsiderInvisibleFilters, bIgnoreConsiderFilter) {
		var i;
		var n = null, oItem, oFilter;
		var aFilters = [];
		if (this._mAdvancedAreaFilter) {
			for (n in this._mAdvancedAreaFilter) {
				if (n) {
					if (this._mAdvancedAreaFilter[n].items) {
						for (i = 0; i < this._mAdvancedAreaFilter[n].items.length; i++) {
							oItem = this._mAdvancedAreaFilter[n].items[i];
							if (bConsiderInvisibleFilters || oItem.filterItem.getVisible()) {
								oFilter = {
									group: oItem.filterItem.getGroupName(),
									name: oItem.filterItem.getName(),
									partOfCurrentVariant: oItem.filterItem.getPartOfCurrentVariant(),
									visibleInFilterBar: oItem.filterItem.getVisibleInFilterBar(),
									visible: oItem.filterItem.getVisible()
								};
								if (bIgnoreConsiderFilter || this._considerFilter(oFilter)) {
									aFilters.push(oFilter);
								}
							}
						}
					}
				}
			}
		}

		return aFilters;
	};

	FilterBar.prototype.mergeVariant = function(oBase, oDelta) {

		var oMerge = {};
		jQuery.extend(true, oMerge, oDelta);
		oMerge.filterbar = [];
		oMerge.filterBarVariant = {};

		jQuery.extend(true, oMerge.filterbar, oBase.filterbar);
		jQuery.extend(true, oMerge.filterBarVariant, oBase.filterBarVariant);

		if (oDelta && oDelta.version === "V2") {
			oMerge.filterbar = this._mergeVariantFields(oMerge.filterbar, oDelta.filterbar);
			oMerge.filterBarVariant = oDelta.filterBarVariant;
		}

		return oMerge;
	};

	FilterBar.prototype._mergeVariantFields = function(aBaseFilters, aDeltaFilters) {

		var i;

		aDeltaFilters.forEach(function(element) {
			for (i = 0; i < aBaseFilters.length; i++) {
				if ((aBaseFilters[i].group === element.group) && (aBaseFilters[i].name === element.name)) {
					aBaseFilters.splice(i, 1);
					break;
				}
			}

		});

		return aBaseFilters.concat(aDeltaFilters);

	};

	FilterBar.prototype._isUi2Mode = function() {
		if (this._oVariantManagement instanceof SmartVariantManagementUi2) {
			return true;
		}

		return false;
	};

	FilterBar.prototype._isDeltaHandling = function() {
		if (this._isUi2Mode()) {
			return false;
		}

		return this.getDeltaVariantMode();
	};

	FilterBar.prototype._getStandardVariant = function() {

		return this._oVariantManagement.getStandardVariant(this);

	};

	FilterBar.prototype._considerFilter = function(oFilter) {

		if (!this._isDeltaHandling()) {
			return true;
		}

		var oBaseFilter = null;
		var oStandardVariant = this._getStandardVariant();
		if (oStandardVariant && oStandardVariant.filterbar) {
			for (var i = 0; i < oStandardVariant.filterbar.length; i++) {
				if ((oStandardVariant.filterbar[i].group === oFilter.group) && (oStandardVariant.filterbar[i].name === oFilter.name)) {
					oBaseFilter = oStandardVariant.filterbar[i];
					break;
				}
			}
		}

		if (!oBaseFilter) {

			if (!oFilter.partOfCurrentVariant) {
				return false;
			}
			return true;
		}

		if ((oBaseFilter.partOfCurrentVariant !== oFilter.partOfCurrentVariant) || (oBaseFilter.visibleInFilterBar !== oFilter.visibleInFilterBar) || (oBaseFilter.visible !== oFilter.visible)) {
			return true;
		}

		return false;
	};

	/**
	 * Adds a filter to the form container.
	 * @private
	 * @param {sap.ui.comp.filterbar.FilterItem} oFilterItem the corresponding filter item
	 * @param {sap.ui.core.Control} oControl the control itself
	 * @param {sap.ui.layout.form.FormContainer} oFormContainer in which the control will be added
	 */
	FilterBar.prototype._addControlToAdvancedArea = function(oFilterItem, oControl, oFormContainer) {

		var oFormElement = new FormElement({
			label: oFilterItem.getLabelControl(this.getId()),
			fields: [
				(oControl !== null) ? oControl : new Text()
			]
		});

		oFormContainer.addFormElement(oFormElement);
	};

	/**
	 * Determines if an item is relevant for the query, based on its visibility.
	 * @private
	 * @param {sap.ui.comp.filterbar.FilterItem} oFilterItem which is beeing checked
	 * @returns {boolean} true for relevant, false for not relevat
	 */
	FilterBar.prototype._determineVisibility = function(oFilterItem) {

		var bVisible = false;

		if (oFilterItem) {
			bVisible = oFilterItem.getVisible() && (oFilterItem.getVisibleInFilterBar() || oFilterItem.getPartOfCurrentVariant());
			bVisible = bVisible && !oFilterItem.getHiddenFilter();
		}

		return bVisible;
	};

	/**
	 * Returns an array of all visible filters.
	 * @private
	 * @returns {array} all visible advanced items
	 */
	FilterBar.prototype._retrieveVisibleAdvancedItems = function() {

		var i, n = null, oItem;
		var aAdvancedItems = [];

		if (this._mAdvancedAreaFilter) {
			for (n in this._mAdvancedAreaFilter) {
				if (n) {
					if (this._mAdvancedAreaFilter[n] && this._mAdvancedAreaFilter[n].items) {
						for (i = 0; i < this._mAdvancedAreaFilter[n].items.length; i++) {
							oItem = this._mAdvancedAreaFilter[n].items[i];
							if (oItem) {
								// if (oItem.filterItem.getVisibleInFilterBar() || oItem.filterItem.getPartOfCurrentVariant()) {
								if (this._determineVisibility(oItem.filterItem)) {
									aAdvancedItems.push(oItem);
								}
							}
						}
					}
				}
			}
		}

		return aAdvancedItems;
	};

	/**
	 * Retrieves the controls for all visible filters.
	 * @private
	 * @param {boolean} bWithName determines the returning structure. Either list of controls, or list of filter name and control.
	 * @param {boolean} bConsiderParameters determines if parameters should be considered.
	 * @returns {array} all visible controls/filter name & controls
	 */
	FilterBar.prototype._retrieveCurrentSelectionSet = function(bWithName, bConsiderParameters) {

		var i, oItem, oObj, aArray = [];

		var aItems = this._retrieveVisibleAdvancedItems();

		for (i = 0; i < aItems.length; i++) {
			oItem = aItems[i];
			if (oItem.control && oItem.filterItem && (bConsiderParameters || !oItem.filterItem._isParameter())) {
				if (bWithName) {
					oObj = {
						name: aItems[i].filterItem.getName(),
						control: aItems[i].control
					};
				} else {
					oObj = aItems[i].control;
				}

				aArray.push(oObj);
			}
		}

		return aArray;
	};

	/**
	 * Executes the search event. Controls of all visible filters will be passed as event-parameters.
	 * @public
	 * @returns {boolean} indicates the validation result. true means no validation errors.
	 */
	FilterBar.prototype.search = function() {

		var parameter = {};
		parameter.selectionSet = this._retrieveCurrentSelectionSet(false);

		this.fireSearch(parameter);

		return true;
	};

	/**
	 * Executes the clear event. Controls of all visible filters will be passed as event-parameters.
	 * @private
	 */
	FilterBar.prototype.clear = function() {

		var parameter = {};
		parameter.selectionSet = this._retrieveCurrentSelectionSet(false);

		this._clearErrorState();

		this.fireClear(parameter);

		this._updateToolbarText();
	};

	/**
	 * Executes the reset event. Controls of all visible filters will be passed as event-parameters.
	 * @private
	 */
	FilterBar.prototype.reset = function() {

		var parameter = {};
		parameter.selectionSet = this._retrieveCurrentSelectionSet(false);

		this.fireReset(parameter);

		this._resetVariant();
	};

	/**
	 * Obtains from the variant management the current selected entry ands applies the corresponding variant. In case nothing was selected variant
	 * management returns null -> no variant will be applied.
	 * @private
	 */
	FilterBar.prototype._resetVariant = function() {

		var oVariant = null, oVariantSnapshot = null;

		this._resetFiltersInErrorValueState();

		if (this._oVariantManagement) { // in case a variant is currently selected, re-apply this variant

			var sKey = this._oVariantManagement.getSelectionKey();
			if (sKey) {

				oVariant = this._oVariantManagement.getVariantContent(this, sKey);
				if (this._oVariant) {
					this._oVariant.content = oVariant;
					this._oVariant.modified = false;

					if (this.getPersistencyKey() && this._oInitialVariant) {
						// BCP: 1780323271
						// reset the snapshot
						this._oInitialVariant.content = oVariant;
						this._oInitialVariant.modified = false;

						// BCP: 1770468283
						// reset the variant key
						this._oInitialVariant.key = sKey;
					}
				}

				if (!this.getPersistencyKey() && (this.getUseSnapshot() === undefined) && this._oInitialVariant && this._oInitialVariant.content) {
					oVariantSnapshot = this._oInitialVariant.content;
				}

				if (oVariant || oVariantSnapshot) {
					this.applyVariant(oVariant || oVariantSnapshot, "RESET");
				}
			}
		}

		this._resetFilterBarSearch();

		// this._bDirtyViaDialog = false;
	};

	FilterBar.prototype._resetFilterBarSearch = function() {

		this._sSearchCriteriaInFiltersDialog = "";

		if (this._oFiltersSearchField) {
			this._oFiltersSearchField.setValue(this._sSearchCriteriaInFiltersDialog);
			this._triggerSearchByValueInFilterDialog(this._sSearchCriteriaInFiltersDialog);
		}
	};

	/**
	 * Retrieve the data for a specific variant and apply it.
	 * @private
	 * @param {object} oVariant the variant
	 * @param {string} sContext may be undefined, RESET or CANCEL and indicates the source of the appliance
	 * @param {boolean} bInitial indicates if the apply was executed during the initialization phase
	 */
	FilterBar.prototype._applyVariant = function(oVariant, sContext, bInitial) {

		var aFieldsAndValues, aPersFields = null, bTriggerFilterChangeState, bExecuteOnSelection = false;

		if (oVariant) {

			if (bInitial) {
				bTriggerFilterChangeState = this._getTriggerFilterChangeState();
				this._setTriggerFilterChangeState(false);
			}

			this._setConsiderFilterChanges(false);

			aFieldsAndValues = oVariant.filterBarVariant;
			aPersFields = oVariant.filterbar;

			this._ensureFilterLoaded(aPersFields);
			this._reapplyVisibility(aPersFields);

			this._applyVariantFields(aFieldsAndValues);

			if (this._oBasicSearchField && this._oBasicSearchField.setValue) {
				this._oBasicSearchField.setValue("" || oVariant.basicSearch);
			}

			if (oVariant.executeOnSelection) {
				bExecuteOnSelection = oVariant.executeOnSelection;
			}

			this.fireAfterVariantLoad(sContext, bExecuteOnSelection);

			this._setConsiderFilterChanges(true);

			this._updateToolbarText();

			if (bExecuteOnSelection || (this.getLiveMode && this.getLiveMode())) {
				this.search();
			} else {
				this._clearErrorState();
			}

			if (bInitial) {
				this._setTriggerFilterChangeState(bTriggerFilterChangeState);
			}
		}
	};

	/**
	 * Triggers the registered callBack for fetching the current variant data.
	 * @private
	 * @returns {Object} the data representing part of the variant content
	 */
	FilterBar.prototype._fetchVariantFiltersData = function() {

		if (this._fRegisteredFetchData) {
			try {
				return this._fRegisteredFetchData();
			} catch (ex) {
				jQuery.sap.log.error("callback for fetching data throws an exception");
			}
		} else {
			jQuery.sap.log.warning("no callback for fetch data supplied");
		}

		return null;
	};

	/**
	 * Triggers the registered callBack for applying the variant data.
	 * @private
	 * @param {Object} oJson the data blob representing part of the variant content
	 * @returns {object} data to be stored as part of the variant content
	 */
	FilterBar.prototype._applyVariantFields = function(oJson) {

		if (this._fRegisteredApplyData) {
			try {
				return this._fRegisteredApplyData(oJson);
			} catch (ex) {
				jQuery.sap.log.error("callback for applying data throws an exception");
			}
		} else {
			jQuery.sap.log.warning("no callback for appy data supplied");
		}
	};

	FilterBar.prototype._isStandardVariant = function() {
		var sKey = this.getCurrentVariantId();
		if (!sKey) {
			return true;
		}
		if (this._oVariantManagement) {
			if ((sKey === this._oVariantManagement.getStandardVariantKey())) {
				return true;
			}

			if (this._oVariantManagement._oStandardVariant === null) {
				return true;
			}
		}

		return false;
	};

	/**
	 * Returns the information whether the flag 'executeOnSelect' is set or not on current variant.
	 * @public
	 * @returns {boolean} Flag 'executeOnSelect' flag. If varaint management is disabled <code>false</code> is retuned.
	 */
	FilterBar.prototype.isCurrentVariantExecuteOnSelectEnabled = function() {
		if (this._oVariantManagement && !this._oVariantManagement.getInErrorState()) {

			var sKey = this.getCurrentVariantId();
			if (!sKey) {
				return this._oVariantManagement.getExecuteOnSelectForStandardVariant();
			}

			var oItem = this._oVariantManagement.getItemByKey(sKey);
			if (oItem) {
				return oItem.getExecuteOnSelection();
			}
		}
		return false;
	};

	/**
	 * Creates and returns the variant representation.
	 * @returns {object} JSON object
	 * @public
	 */
	FilterBar.prototype.fetchVariant = function() {

		var aFiltersInfo, oVariant = {}, sBasicSearch;

		if (this._isDeltaHandling()) {
			if (!this._isStandardVariant()) {
				oVariant.version = "V2";
			}
		}

		this.fireBeforeVariantFetch();

		aFiltersInfo = this._determineVariantFiltersInfo(true, !oVariant.version);

		oVariant.filterbar = (!aFiltersInfo) ? [] : aFiltersInfo;

		oVariant.filterBarVariant = this._fetchVariantFiltersData();

		sBasicSearch = this._getBasicSearchValue();
		if (sBasicSearch) {
			oVariant.basicSearch = sBasicSearch;
		}

		if (this._oVariant && this._oVariant.content) {
			this._oVariant.content = oVariant;
		}

		return oVariant;
	};

	/**
	 * Applies the variant.
	 * @param {object} oVariant JSON object
	 * @param {string} sContext Describes in which context the variant is applied. The context is passed on to the application via the
	 *        afterVariantLoad event
	 * @param {boolean} bInitial indicates if the apply was executed during the initialization phase.
	 * @public
	 */
	FilterBar.prototype.applyVariant = function(oVariant, sContext, bInitial) {

		if (oVariant.version === "V2") {
			oVariant = this.mergeVariant(this._getStandardVariant(), oVariant, sContext);
		}

		this._applyVariant(oVariant, sContext, bInitial);

		if (bInitial && this._isNewFilterBarDesign()) {
			// this._fHandleResize();
		}
	};

	/**
	 * Retrieves the mandatory filters.
	 * @public
	 * @returns {array} Of visible mandatory filters
	 */
	FilterBar.prototype.determineMandatoryFilterItems = function() {

		var i;
		var aMandatoryFilters = [];

		var aItems = this._retrieveVisibleAdvancedItems();

		for (i = 0; i < aItems.length; i++) {
			if (aItems[i].filterItem.getMandatory() === true) {
				if (aItems[i].control) {
					aMandatoryFilters.push(aItems[i].filterItem);
				}
			}
		}

		return aMandatoryFilters;
	};

	/**
	 * Retrieves the control associated to the filter.
	 * @public
	 * @param {sap.ui.comp.filterbar.FilterItem} oFilterItem From the aggregations
	 * @param {boolean} bConsiderParameters check also analytics parameter
	 * @returns {sap.ui.core.Control} The corresponding control. If no match is found <code>null</code> is returned.
	 */
	FilterBar.prototype.determineControlByFilterItem = function(oFilterItem, bConsiderParameters) {

		var i, n = null;
		var oItem, oGroupElement;

		if (!oFilterItem || (!bConsiderParameters && oFilterItem._isParameter())) {
			return null;
		}

		if (this._aBasicAreaSelection) {
			for (i = 0; i < this._aBasicAreaSelection.length; i++) {
				oItem = this._aBasicAreaSelection[i];
				if (oFilterItem === oItem.filterItem) {
					return oItem.control;
				}
			}
		}

		if (this._mAdvancedAreaFilter) {
			for (n in this._mAdvancedAreaFilter) {
				if (n) {
					oGroupElement = this._mAdvancedAreaFilter[n];
					if (oGroupElement && oGroupElement.items) {
						for (i = 0; i < oGroupElement.items.length; i++) {
							oItem = oGroupElement.items[i];
							if ((bConsiderParameters || !oItem.filterItem._isParameter()) && (oFilterItem === oItem.filterItem)) {
								return oItem.control;
							}
						}
					}
				}
			}
		}

		return null;
	};

	/**
	 * Retrieves the control based on the name and group name.
	 * @public
	 * @param {string} sName Name of the filter.
	 * @param {string} sGroupName Group name of the filter; <code>null</code> for filter that belongs to basic group.
	 * @returns {sap.ui.core.Control} The corresponding control, if no match is found, <code>null</code> is returned.
	 */
	FilterBar.prototype.determineControlByName = function(sName, sGroupName) {

		var oItem = this._determineEnsuredItemByName(sName, sGroupName);
		if (oItem && oItem.filterItem && !oItem.filterItem._isParameter()) {
			return oItem.control;
		}

		return null;
	};

	/**
	 * Retrieves the associated label based on the name and group name.
	 * @public
	 * @param {string} sName Name of the filter.
	 * @param {string} sGroupName Group name of the filter; <code>null</code> for filter that belongs to basic group.
	 * @returns {sap.m.Label} The associated Label, if no match is found, <code>null</code> is returned.
	 */
	FilterBar.prototype.determineLabelByName = function(sName, sGroupName) {

		var oItem = this._determineEnsuredItemByName(sName, sGroupName);
		if (oItem && oItem.filterItem) {
			return oItem.filterItem._oLabel;
		}

		return null;
	};

	FilterBar.prototype._determineEnsuredItemByName = function(sName, sGroupName) {

		if (!sGroupName) {
			sGroupName = this._determineGroupNameByName(sName);
		}

		this._ensureFilterLoaded([
			{
				name: sName,
				group: sGroupName
			}
		]);

		return this._determineItemByName(sName, sGroupName);
	};

	FilterBar.prototype._determineGroupNameByName = function(sName) {

		if (this._aFields) {
			for (var i = 0; i < this._aFields.length; i++) {
				if (this._aFields[i].fieldName === sName) {
					return this._aFields[i].groupName;
				}
			}
		}

		var oFilterItem = this._determineFilterItemByName(sName);
		if (oFilterItem) {
			var sGroupName = oFilterItem.getGroupName();
			if (sGroupName !== FilterBar.INTERNAL_GROUP) {
				return sGroupName;
			}
		}

		return null;
	};

	/**
	 * Retrieves the internal filter representation based on the name and (optional) group name.
	 * @private
	 * @param {string} sName the control's name
	 * @param {string} sGrpName sGroupName is null for basic area
	 * @returns {object} the corresponding internal item. If no match is found null will returned.
	 */
	FilterBar.prototype._determineItemByName = function(sName, sGrpName) {

		var i;
		var oItem, oGroupElement;
		var sGroupName = sGrpName;

		if (!sName) {
			return null;
		}

		if (!sGroupName) {
			sGroupName = FilterBar.INTERNAL_GROUP;
		}

		if (this._mAdvancedAreaFilter) {
			// check the filter
			oGroupElement = this._mAdvancedAreaFilter[sGroupName];
			if (oGroupElement && oGroupElement.items) {
				for (i = 0; i < oGroupElement.items.length; i++) {
					oItem = oGroupElement.items[i];
					if (oItem && oItem.filterItem && (oItem.filterItem.getName() === sName)) {
						return oItem;
					}
				}
			}
		}

		return null;
	};

	/**
	 * Retrieves the filter corresponding to the filter name.
	 * @public
	 * @param {string} sName the control's name
	 * @returns {sap.ui.comp.filterbar.FilterGroupItem} the corresponding filter item. If no match is found <code>null</code> will returned.
	 */
	FilterBar.prototype.determineFilterItemByName = function(sName) {

		var oItem = this._determineEnsuredItemByName(sName);
		if (oItem && oItem.filterItem) {
			return oItem.filterItem;
		}

		return null;
	};

	FilterBar.prototype._determineFilterItemByName = function(sName) {

		var n, oItem;

		if (this._mAdvancedAreaFilter) {
			for (n in this._mAdvancedAreaFilter) {
				oItem = this._determineItemByName(sName, n);
				if (oItem) {
					return oItem.filterItem;
				}
			}
		}

		return null;
	};

	/**
	 * Retrives for a givven control the corresponding filter.
	 * @private
	 * @param {sap.ui.core.Control} oControl for a filter
	 * @returns {object} the corresponding internal representation. If no match is found null will returned.
	 */
	FilterBar.prototype._determineByControl = function(oControl) {

		var n = null, i;

		if (this._mAdvancedAreaFilter) {
			for (n in this._mAdvancedAreaFilter) {
				if (n) {
					var oGroupElement = this._mAdvancedAreaFilter[n];
					if (oGroupElement && oGroupElement.items) {
						for (i = 0; i < oGroupElement.items.length; i++) {
							if (oGroupElement.items[i] && oGroupElement.items[i].control === oControl) {
								return oGroupElement.items[i];
							}
						}
					}
				}
			}
		}

		return null;
	};

	/**
	 * Delete all 'Filters'-dialog specific informations.
	 * @private
	 */
	FilterBar.prototype._deleteProperties = function() {

		var n = null, i;

		if (this._mAdvancedAreaFilter) {
			for (n in this._mAdvancedAreaFilter) {
				if (n) {
					var oGroupElement = this._mAdvancedAreaFilter[n];
					if (oGroupElement && oGroupElement.items) {

						if (oGroupElement.formcontainer) {
							oGroupElement.formcontainer.destroy();
							delete oGroupElement.formcontainer;
						}

						if (oGroupElement.link) {
							delete oGroupElement.link;
						}

						for (i = 0; i < oGroupElement.items.length; i++) {
							if (oGroupElement.items[i] && oGroupElement.items[i].checkbox) {
								delete oGroupElement.items[i].checkbox;
							}
							if (oGroupElement.items[i] && oGroupElement.items[i].formelement) {
								delete oGroupElement.items[i].formelement;
							}
						}
					}
				}
			}
		}
	};

	FilterBar.prototype.onAfterRendering = function(oEvent) {
		if (!this._bDoItOnce && !(this._isPhone() || this._isTablet())) {
			this._bDoItOnce = true;

			if (this._oHintText && this._oHintText.getVisible()) {
				this.setFilterBarExpanded(false);
			}
		}

		this._checkAndAdaptFilterWidth();
	};

	FilterBar.prototype._fHandleResize = function(oEvent) {

		if (!this._isPhone() && this._oFilterDialog && this._oFilterDialog.isOpen() && this._mAdvancedAreaFilter) {
			this._repositionAddToFilterBarLabel();
		}

		this._checkAndAdaptFilterWidth();

	};

	FilterBar.prototype._checkAndAdaptFilterWidth = function() {
		if (this._isNewFilterBarDesign() && !this._oFilterDialog) {
			this._adaptFilterWidth();
		}
	};

	FilterBar.prototype._adaptFilterWidth = function() {

		var i;

		if (!this._oBasicAreaLayout) {
			return;
		}

		if (!this._bIsInitialized) {
			return;
		}

		var aContainer = this._oBasicAreaLayout.getContent();
		if (!aContainer) {
			return;
		}

		// check if the buttons have to be considered at all
		var bButtonsVisible = this._isButtonsContainerVisible(this._isPhone() ? aContainer[0] : aContainer[aContainer.length - 1]);

		for (i = aContainer.length - 1; i >= 0; i--) {
			if (!aContainer[i].getVisible()) {
				aContainer.splice(i, 1);
			}
		}

		if (aContainer.length < 1) {
			return;
		}

		var nWidthContainer = this._oBasicAreaLayout.$().width() - 1;

		var nWidth, nCalcWidth = this._calculateRequiredWidthAndResetToInitialWidth(aContainer, bButtonsVisible);

		if (nCalcWidth > nWidthContainer) {
			nWidth = 0;
		} else {
			nWidth = aContainer[aContainer.length - 1].$().width() + 16;
		}

		var startIdx = 0, endIdx = aContainer.length - 1;

		if (bButtonsVisible) {
			if (this._isPhone()) {
				startIdx++;
			} else {
				endIdx--;
			}
		}

		var nFilters = 0;
		for (i = startIdx; i <= endIdx; i++) {

			if ((nWidth + aContainer[i].$().width() + 16) > nWidthContainer) {
				break;
			}

			nWidth += aContainer[i].$().width() + 16;
			nFilters++;
		}

		var nDeltaFilter = Math.floor((nWidthContainer - nWidth) / nFilters);

		if ((nFilters === 1) && (nCalcWidth < nWidthContainer)) {
			nDeltaFilter = Math.floor(nDeltaFilter / 3);
		}

		if (nDeltaFilter > 0) {
			this._increaseFilterWidth(aContainer, nDeltaFilter, nWidthContainer, bButtonsVisible);
		}

	};

	FilterBar.prototype._isButtonsContainerVisible = function(oContainer) {
		var bVisible = false, aOuterContent, aInnerContent;
		if (oContainer && oContainer.getVisible()) {
			aOuterContent = oContainer.getContent();
			if (aOuterContent && (aOuterContent.length > 1) && aOuterContent[1]) {
				aInnerContent = aOuterContent[1].getContent();
				if (aInnerContent) {
					aInnerContent.some(function(oItem) {
						if (oItem.getVisible()) {
							bVisible = true;
						}

						return bVisible;
					});
				}
			}

			if (!bVisible) {
				oContainer.setVisible(bVisible);
			}
		}

		return bVisible;
	};

	FilterBar.prototype._calculateRequiredWidthAndResetToInitialWidth = function(aContainer, bButtonsVisible) {
		var i, nContainerWidth, nWidth = 0;

		var aItems = this._retrieveVisibleAdvancedItems();

		if (bButtonsVisible) {
			if (this._isPhone()) {
				nWidth = aContainer[0].$().width() + 16; // buttons
			} else {
				nWidth = aContainer[aContainer.length - 1].$().width() + 16; // buttons
			}
		}

		if (this._oBasicSearchFieldContainer && this._oBasicSearchFieldContainer.$()) {
			this._oBasicSearchFieldContainer.$().width(this.getFilterContainerWidth());

			this._oBasicSearchFieldContainer.$().css({
				"min-width": this.getFilterContainerWidth()
			});

			this._oBasicSearchFieldContainer.$().css({
				"max-width": this._oBasicSearchFieldContainer.$().width() * 1.5
			});

			nWidth += this._oBasicSearchFieldContainer.$().width();
			nWidth += 16;
		}

		for (i = 0; i < aItems.length; i++) {
			if (aItems[i].filterItem && aItems[i].filterItem.getVisible() && aItems[i].filterItem.getVisibleInFilterBar()) {
				var oContainer = aItems[i].container;
				if (oContainer && oContainer.$()) {
					if (aItems[i].filterWidth) {
						nContainerWidth = oContainer.$().width();

						if (nContainerWidth !== aItems[i].filterWidth) {
							oContainer.$().width(aItems[i].filterWidth);
							nContainerWidth = aItems[i].filterWidth;
						}
					} else {

						oContainer.$().width(this.getFilterContainerWidth());
						nContainerWidth = oContainer.$().width();
						aItems[i].filterWidth = nContainerWidth;
					}

					oContainer.$().css({
						"min-width": nContainerWidth
					});

					oContainer.$().css({
						"max-width": nContainerWidth * 1.5
					});

					nWidth += nContainerWidth;
					nWidth += 16;
				}
			}
		}

		return nWidth;
	};

	FilterBar.prototype._increaseFilterWidth = function(aContainer, nDelta, nWidthContainer, bButtonsVisible) {

		var nFilterWidth, startIdx = 0, endIdx = aContainer.length - 1;

		if (bButtonsVisible) {
			if (this._isPhone()) {
				startIdx++;
			} else {
				endIdx--;
			}
		}

		for (var i = startIdx; i <= endIdx; i++) {
			nFilterWidth = aContainer[i].$().width() + nDelta;
			aContainer[i].$().width(nFilterWidth);
		}
	};

	FilterBar.prototype._destroyLazyFilterControl = function() {
		var j, oField;

		if (this._aFields && (this._aFields.length > 0)) {
			// delete eventuell not yet created filteritems
			if (this._aFields && this._aFields.length > 0) {
				for (j = 0; j < this._aFields.length; j++) {
					oField = this._aFields[j];

					if (oField.factory) {
						/* eslint-disable no-lonely-if */
						if (oField.control) {
							oField.control.destroy();
						}
						/* eslint-enable no-lonely-if */
					}
				}
			}
		}
	};

	FilterBar.prototype._destroyNonVisibleFilterControl = function() {
		var i, n, oItem;

		// delete currently not visible filteritems
		if (this._mAdvancedAreaFilter) {
			for (n in this._mAdvancedAreaFilter) {
				if (n && this._mAdvancedAreaFilter[n] && this._mAdvancedAreaFilter[n].items) {
					for (i = 0; i < this._mAdvancedAreaFilter[n].items.length; i++) {
						oItem = this._mAdvancedAreaFilter[n].items[i];
						if (oItem && oItem.container) {
							if (this._oBasicAreaLayout && (this._oBasicAreaLayout.indexOfContent(oItem.container) < 0)) {
								if (oItem.control && !oItem.bDestroyed) {
									oItem.control.destroy();
									oItem.bDestroyed = true;
								}
							}
						}
					}
				}
			}
		}

	};

	FilterBar.prototype._destroyFilterControls = function() {

		if (!this.getAdvancedMode()) {

			// delete eventuell not yet created filteritems
			this._destroyLazyFilterControl();

			// delete currently not visible filteritems
			this._destroyNonVisibleFilterControl();

		}
	};

	FilterBar.prototype._registerVariantManagement = function() {
		if (this._oVariantManagement) {
			this._oVariantManagement.attachSave(this._variantSave, this);
			this._oVariantManagement.attachAfterSave(this._afterVariantSave, this);
		}
	};

	FilterBar.prototype._unregisterVariantManagement = function() {

		if (this._oVariantManagement) {

			if (this._fInitialiseVariants) {
				this._oVariantManagement.detachInitialise(this._fInitialiseVariants);
				this._fInitialiseVariants = null;
			}

			this._oVariantManagement.detachSave(this._variantSave, this);
			this._oVariantManagement.detachAfterSave(this._afterVariantSave, this);

			// VM was created by the smart filterbar without a toolbar and has a custom-data persistency key
			// BCP: 1680052358
			// Destroy the VM whenever it was created, but not added to the UI-tree
			// BCP: 1670396582
			if ((!this.getUseToolbar() || this.getAdvancedMode()) && !this._oVariantManagement.getDomRef()) {
				this._oVariantManagement.destroy();
			}
		}
	};

	FilterBar.prototype.destroy = function() {

		// unregister eventhandler for resizing
		// jQuery(window).off("resize." + this.getId());
		sap.ui.core.ResizeHandler.deregister(this._hResizeListener);
		this._hResizeListener = null;

		this._unregisterVariantManagement();

		this._destroyFilterControls();

		Grid.prototype.destroy.apply(this, arguments);

		if (this._oDialog) {
			this._oDialog.destroy();
			this._oDialog = null;
		}

		if (this._oFilterDialog) {
			this._oFilterDialog.destroy();
			this._oFilterDialog = null;
		}

		if (this.oModel) {
			this.oModel.destroy();
			this.oModel = null;
		}

		this._aFields = null;

		this._oHintText = null;

		this._aBasicAreaSelection = null;
		this._mAdvancedAreaFilter = null;
		this._oBasicAreaLayout = null;
		this._oVariantManagement = null;

		this._oCollectiveSearch = null;

		this._oVariant = null;

		this._fRegisteredFetchData = null;
		this._fRegisteredApplyData = null;
		this._fRegisterGetFiltersWithValues = null;
		this._fRegisteredFilterChangeHandlers = null;

		this._oSearchButton = null;
		this._oFiltersButton = null;
		this._oHideShowButton = null;
		this._oClearButtonOnFB = null;
		this._oRestoreButtonOnFB = null;

		this._oAddToFilterBarLabel = null;

		this._oBasicSearchField = null;
		this._oBasicSearchFieldContainer = null;

		this._oButtonsVLayout = null;
	};

	// Hide the follwing sap.ui.layout.Grid functionality in jDoc
	/**
	 * @name sap.ui.comp.filterbar.FilterBar#setDefaultIndent
	 * @private
	 */
	/**
	 * @name sap.ui.comp.filterbar.FilterBar#getDefaultIndent
	 * @private
	 */

	/**
	 * @name sap.ui.comp.filterbar.FilterBar#setDefaultSpan
	 * @private
	 */
	/**
	 * @name sap.ui.comp.filterbar.FilterBar#getDefaultSpan
	 * @private
	 */

	/**
	 * @name sap.ui.comp.filterbar.FilterBar#setHSpacing
	 * @private
	 */
	/**
	 * @name sap.ui.comp.filterbar.FilterBar#getHSpacing
	 * @private
	 */

	/**
	 * @name sap.ui.comp.filterbar.FilterBar#setVSpacing
	 * @private
	 */
	/**
	 * @name sap.ui.comp.filterbar.FilterBar#getVSpacing
	 * @private
	 */

	/**
	 * @name sap.ui.comp.filterbar.FilterBar#setPosition
	 * @private
	 */
	/**
	 * @name sap.ui.comp.filterbar.FilterBar#getPosition
	 * @private
	 */

	/**
	 * @name sap.ui.comp.filterbar.FilterBar#setContainerQuery
	 * @private
	 */
	/**
	 * @name sap.ui.comp.filterbar.FilterBar#getContainerQuery
	 * @private
	 */

	/**
	 * @name sap.ui.comp.filterbar.FilterBar#addContent
	 * @private
	 */
	/**
	 * @name sap.ui.comp.filterbar.FilterBar#insertContent
	 * @private
	 */
	/**
	 * @name sap.ui.comp.filterbar.FilterBar#removeContent
	 * @private
	 */
	/**
	 * @name sap.ui.comp.filterbar.FilterBar#removeAllContent
	 * @private
	 */
	/**
	 * @name sap.ui.comp.filterbar.FilterBar#destroyContent
	 * @private
	 */
	/**
	 * @name sap.ui.comp.filterbar.FilterBar#getContent
	 * @private
	 */
	/**
	 * @name sap.ui.comp.filterbar.FilterBar#indexOfContent
	 * @private
	 */
	/**
	 * @name sap.ui.comp.filterbar.FilterBar#insertFilterItem
	 * @private
	 */
	/**
	 * @name sap.ui.comp.filterbar.FilterBar#insertFilterGroupItem
	 * @private
	 */

	return FilterBar;

}, /* bExport= */true);
