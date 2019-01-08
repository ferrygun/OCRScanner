sap.ui.define([
		"sap/m/Button", "sap/m/ButtonType", "sap/m/Label", "sap/m/Dialog", "sap/m/Bar", "sap/m/SearchField",
		"sap/m/Toolbar", "sap/m/ToolbarSpacer", "sap/m/Title", "sap/m/VBox", "sap/m/HBox", "sap/m/CheckBox",
		"sap/m/Link", "sap/m/List", "sap/m/TextArea","sap/m/Text", "sap/m/StandardListItem", "sap/m/ListSeparators", "sap/m/Popover",
		"sap/ui/layout/form/SimpleForm", "sap/ui/layout/GridData",
		"sap/ui/core/mvc/Controller", "sap/suite/ui/generic/template/AnalyticalListPage/util/FilterUtil",
		"sap/m/SegmentedButton","sap/m/SegmentedButtonItem", "sap/suite/ui/generic/template/AnalyticalListPage/util/V4Terms",'sap/ui/model/Filter',
		"sap/suite/ui/generic/template/AnalyticalListPage/controller/DropDownController",
		"sap/m/OverflowToolbarButton"
	], function(Button, ButtonType, Label, Dialog, Bar, SearchField, Toolbar, ToolbarSpacer, Title,
			VBox, HBox, CheckBox, Link, List, TextArea, Text, StandardListItem, ListSeparators, Popover, SimpleForm,
			GridData, Controller, FilterUtil, SegmentedButton, SegmentedButtonItem, V4Terms, Filter, DropDownController, OverflowToolbarButton) {
	"use strict";

	var BASIC_GROUP = "_BASIC";

	// Chart Default Settings
	var chartWidth = "100%";
	var labelWidthPercent = 0.33;
	var labelWidthPercentDonut = 0.5; //Donut should cover half the area

	var vfdController = Controller.extend("sap.suite.ui.generic.template.AnalyticalListPage.controller.VisualFilterDialogController", {
		/**
		 * Initialize the control
		 *
		 * @public
		 * @param {oState} oState - state of the application
		 */
		init: function(oState) {
			this.oState = oState;
			this.oRb = sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp");
			this.bIsTimeBasedLine;
			this.bSortOrder;
		},
		_createForm: function() {
			// store as a string to parse later ad restore
			// since cloning via jquery extend is not working on json model
			this.sJsonModel = this.oState.alr_visualFilterBar.getModel('_visualFilterConfigModel').getJSON();
			this.oConfig = JSON.parse(this.sJsonModel);
			this._filterModified = false;
			this.filterCompList = [];
			this.filterChartList = [];
			this._buildFiltersFromConfig();

			this.oVerticalBox = new VBox();

			this.oVerticalBox.setModel(this.oState.oController.getView().getModel("_templPriv"), "_templPriv");
			this.oVerticalBox.setModel(this.oState.oController.getView().getModel());
			this.oVerticalBox.setModel(this.oState.oController.getView().getModel("i18n"), "i18n");
			this.oVerticalBox.setModel(this.oState.oController.getOwnerComponent().getModel("_filter"), "_filter");
			this.oVerticalBox.setModel(this.oState.alr_visualFilterBar.getModel('_visualFilterConfigModel'), "_visualFilterConfigModel");

			this._addFilterSwitch();
			this._addGroupsAndFilters();
			return this.oVerticalBox;
		},

		_toggle: function() {
			var aContent = this.oState.oSmartFilterbar.getFilterDialogContent();
			if (aContent && (aContent.length === 2)) {
				//If CF is visible switch to VF and hide CF
				if (aContent[0].getVisible()) {
					aContent[0].setVisible(false);
					aContent[1].setVisible(true);
				} else {
				//If VF is visible switch to CF and hide VF
					aContent[0].setVisible(true);
					aContent[1].setVisible(false);
				}
			}
		},

		_addFilterSwitch: function() {
			var filterSwitchItems = [
				new sap.m.SegmentedButtonItem({icon:"sap-icon://filter-fields", width:"inherit", key:"compact", tooltip:"{i18n>FILTER_COMPACT}"}),
				new sap.m.SegmentedButtonItem({icon:"sap-icon://filter-analytics", width:"inherit", key:"visual", tooltip:"{i18n>FILTER_VISUAL}"})
			];

			var filterSwitch = new SegmentedButton({
				width:"inherit",
				selectedKey:"visual",
				items: filterSwitchItems
			});

			filterSwitch.attachSelect(function(oEvent){
				var oSwitch = oEvent.getSource();
				//Keep the selected key as visual on this content
				oSwitch.setSelectedKey("visual");
				this._toggle();
			}.bind(this));

			var oToolbar = new sap.m.OverflowToolbar({
				design: sap.m.ToolbarDesign.Transparent,
				content: [
					new sap.m.ToolbarSpacer(),
					filterSwitch
				]
			}).addStyleClass("sapSmartTemplatesAnalyticalListPageFilterDialogToolbar");

			this.oVerticalBox.addItem(oToolbar);
		},
		_searchDialog: function() {
			this.oState.alr_visualFilterBar._setVariantModified();
		},
		_restoreDialog: function() {
			// restore visual filter bar
			this.oState.alr_visualFilterBar.getModel('_visualFilterConfigModel').setData(JSON.parse(this.sJsonModel));
			this.oConfig = JSON.parse(this.sJsonModel);
			this._reloadForm();
			this._filterModified = false;
		},

		_cancelDialog: function() {
			if (this._filterModified) {
				var oVisualFilterConfigModel = this.oState.alr_visualFilterBar.getModel('_visualFilterConfigModel');
				oVisualFilterConfigModel.setData(JSON.parse(this.sJsonModel));
				this.oState.alr_visualFilterBar.updateVisualFilterBindings(true);
			}
		},

		_buildFiltersFromConfig: function() {
			var i;
			this.filterCompList = [];
			this.filterChartList = [];
			for (i = 0; i < this.oConfig.filterCompList.length; i++) {
				var aSortOrder = this.oConfig.filterCompList[i].component.properties.sortOrder;

				if (aSortOrder.constructor === Object && aSortOrder.value) {
					this.oConfig.filterCompList[i].component.properties.sortOrder = aSortOrder.value;
				}

				this.filterCompList.push({
					obj: {
						shownInFilterBar: this.oConfig.filterCompList[i].shownInFilterBar,
						shownInFilterDialog: this.oConfig.filterCompList[i].shownInFilterDialog,
						cellHeight: this.oConfig.filterCompList[i].cellHeight,
						component: {
							type: this.oConfig.filterCompList[i].component.type,
							cellHeight: this.oConfig.filterCompList[i].component.cellHeight
						},
						group: {
							label: this.oConfig.filterCompList[i].group.label,
							name: this.oConfig.filterCompList[i].group.name
						}
					},
					//Update searchVisible based on results of search in filter dialog
					searchVisible: this.oConfig.filterCompList[i].searchVisible === undefined || this.oConfig.filterCompList[i].searchVisible
				});
			}
		},

		_rebuildConfig: function() {
			var i;
			var config = {
					filterCompList: []
				};
			for (i = 0; i < this.filterCompList.length; i++) {
				config.filterCompList.push({
					shownInFilterBar: this.filterCompList[i].obj.shownInFilterBar && this.filterCompList[i].obj.shownInFilterDialog,
					shownInFilterDialog: this.filterCompList[i].obj.shownInFilterDialog,
					cellHeight: this.filterCompList[i].obj.cellHeight,
					group: {
						label: this.filterCompList[i].obj.group.label,
						name: this.filterCompList[i].obj.group.name
					},
					component: {
						type: this.filterCompList[i].obj.component.type,
						cellHeight: this.filterCompList[i].obj.component.cellHeight,
						properties: {
							scaleFactor: this.filterChartList[i].getScaleFactor(),
							numberOfFractionalDigits: this.filterChartList[i].getNumberOfFractionalDigits(),
							sortOrder: this.filterChartList[i].getSortOrder(),
							filterRestriction: this.oConfig.filterCompList[i].component.properties.filterRestriction,
							entitySet: this.filterChartList[i].getEntitySet(),
							isDropDown: this.oConfig.filterCompList[i].component.properties.isDropDown,
							width: this.oConfig.filterCompList[i].component.properties.width,
							height: this.oConfig.filterCompList[i].component.properties.height,
							dimensionField: this.filterChartList[i].getDimensionField(),
							dimensionFieldDisplay: this.filterChartList[i].getDimensionFieldDisplay(),
							dimensionFieldIsDateTime: this.filterChartList[i].getDimensionFieldIsDateTime(),
							dimensionFilter: this.filterChartList[i].getDimensionFilter(),
							unitField: this.filterChartList[i].getUnitField(),
							isCurrency: this.filterChartList[i].getIsCurrency(),
							isMandatory: this.oConfig.filterCompList[i].component.properties.isMandatory,
							measureField: this.filterChartList[i].getMeasureField(),
							outParameter: this.oConfig.filterCompList[i].component.properties.outParameter,
							inParameters: this.oConfig.filterCompList[i].component.properties.inParameters,
							parentProperty: this.oConfig.filterCompList[i].component.properties.parentProperty,
							chartQualifier: this.oConfig.filterCompList[i].component.properties.chartQualifier
						}
					}
				});
			}
			return config;
		},
		/*
		* @private
		* Destroys all the items in the verticalBox and recreates filters and groups it.
		*/
		_reloadForm : function () {
			this.oVerticalBox.destroyItems();
			this._buildFiltersFromConfig();
			//Restore SegmentedButtons
			this._addFilterSwitch();
			this._addGroupsAndFilters();
		},
		/*
		* @private
		* adds group containers and filters based on visual filters and hidden filters that exists
		*/
		_addGroupsAndFilters: function() {
			var i;
			var groupName;
			var groupContainer;
			var groupList = [];
			var filtersGroupCount = 0;
			//this._mergeFilters();
			for (i = 0; i < this.filterCompList.length; i++) {
				if (!Array.isArray(this.filterCompList[i])) {
					if (this.filterCompList[i].searchVisible === false) {
						continue;
					}
					//get the group name of the filter and add it to appropriate group container
					if (!(groupList.indexOf(this.filterCompList[i].obj.group.name) > -1)) {
						if (groupContainer) {
							this.oVerticalBox.addItem(groupContainer);
						}
						groupName = this.filterCompList[i].obj.group.name;
						groupList.push(groupName);
						groupContainer = new VBox();
						groupContainer.setWidth("100%");
						groupContainer.setLayoutData(new GridData({
							span: "L12 M12 S12"
						}));
						groupContainer.addStyleClass("sapUiSmallMarginTop");
						filtersGroupCount++;
						this._addGroupToolbar(groupContainer,  this.filterCompList[i].obj.group.label, this.filterCompList[i].obj.group.name);
					}
					if (this.filterCompList[i].obj.shownInFilterDialog) {
						// Add toolbar and chart only if filters are visible
						this.filterCompList[i].toolbar = this._addChartCustomToolbar(this.oConfig.filterCompList[i], i);
						this.filterCompList[i].overlay = this._addChartOverlay(this.oConfig.filterCompList[i] , i);
						this.filterChartList[i] = this._addChart(this.oConfig.filterCompList[i].component.type, this.oConfig.filterCompList[i].component.properties, i);

						var that = this,
						sShowInFBCheckBoxId = this.filterChartList[i].getParentProperty().replace(/[^\w]/gi, '') + "checkBox";

						var item = [
						new VBox({
							items: [
							that.filterCompList[i].toolbar,
							that.filterCompList[i].overlay,
							that.filterChartList[i]
							]
						}).setWidth("100%").addStyleClass("sapUiSmallMarginEnd")
						];
						//Create a new Vbox for ShowOnFilterBar only in case of Desktop
						if (sap.ui.Device.system.desktop) {
							item[0].setWidth("80%");
							item.splice(1,0,
							new VBox({
								items: [
								new Label({
									text: "{i18n>SHOW_ON_FILTER_BAR}",
									labelFor: sShowInFBCheckBoxId
								}).addStyleClass("sapUiTinyMarginTop"),
								new CheckBox({
									id: sShowInFBCheckBoxId,
									text: "",
									selected: that.oConfig.filterCompList[i].shownInFilterBar
								}).data("idx", i).attachSelect(null, that._onCheckBoxSelect, that)
								]
							}).setAlignItems("Center"));
							item[1].setWidth("20%");
						}
						var oChartBox = new HBox({
							items : item
						}).addStyleClass("sapUiSmallMarginTop").setWidth("100%");
						groupContainer.addItem(oChartBox);
					}
				}
				//add to dialog
				if (groupContainer) {
					this.oVerticalBox.addItem(groupContainer);
				}
			}
			if (filtersGroupCount == 1 && groupName === BASIC_GROUP) {
				FilterUtil.executeFunction(groupContainer, "mAggregations.items.0.setVisible", [false]);
			}
		},

		_onCheckBoxSelect: function(oEvent) {
			var idx = oEvent.getSource().data("idx");
			this.selectCheckBox(idx, oEvent.getSource().getSelected());
		},

		/*
		* @private
		* adds a group container for the group to which visual filter belongs
		* @param {object} groupContainer - box containing all visual filters under a group
		* @param {string} groupTitle - title for the groupContainer
		* @param {string} groupName - name of the group
		*/
		_addGroupToolbar: function(groupContainer, groupTitle, groupName) {
			var oGroupTitle = new Title({text: groupTitle});
			var groupToolbar = new Toolbar({
				content: [
					oGroupTitle,
					new ToolbarSpacer()
				]
			});
			if (groupName != BASIC_GROUP) {
				groupToolbar.addContent(this._createMoreFiltersLink(groupName, oGroupTitle));
			}
			groupContainer.addItem(groupToolbar);
		},
		/*
		* @public
		* Function to update shownInFilterBar according to visibility of filteritems/checkbox selection
		* @param {number} idx - index of the filterCompList[]
		* @param {boolean} bVisible - true or false value for vilibility
		*/
		selectCheckBox : function (idx, bVisible) {
			this._filterModified = true;
			var oVisualConfigModel = this.oState.alr_visualFilterBar.getModel('_visualFilterConfigModel'),
			oVisualConfigModelClone = jQuery.extend(true, {}, oVisualConfigModel);
			oVisualConfigModelClone.setProperty('/filterCompList/' + idx + '/shownInFilterBar', bVisible);
			oVisualConfigModel.setData(oVisualConfigModelClone.getData());
			//update config object when VFConfig model is updated
			this.oConfig = JSON.parse(oVisualConfigModel.getJSON());
			this.oState.alr_visualFilterBar.updateVisualFilterBindings(true);
			//to enable Restore button on change of chart type, sort order, measure field and  show in filter bar changes 
			this.oState.oSmartFilterbar._oVariantManagement.currentVariantSetModified(true);
		},
		/**
		 * Adds overlay in the filter dialog
		 * @param {object} obj
		 * @param {int} idx index in config object
		 */
		_addChartOverlay: function(obj, idx) {
			var oHeaderOverlay = new VBox({
				width: "100%",
				height: obj.component.properties.height,
				items: [
				new sap.m.Label({
					text : {
						path: '_visualFilterConfigModel>/filterCompList/' + idx  + '/overlayMessage',
						formatter: function(sOverlayMessage) {
							return this.getModel("i18n").getResourceBundle().getText(sOverlayMessage);
						}
					}
				})
				],
				visible: {
					path: '_visualFilterConfigModel>/filterCompList/' + idx + '/showChartOverlay',
					formatter: function( bValue) {
						return bValue;
					}
				}
			});
			oHeaderOverlay.addStyleClass("sapUiOverlay");
			oHeaderOverlay.addStyleClass("sapSmartTemplatesAnalyticalListPageVFOverflow");
			return oHeaderOverlay;

		},
		_addChartCustomToolbar: function(obj, idx) {
			var that = this;
			//This var would be needed to distinguish option button on line chart
			//var isItLineChart = (obj.component.type === "Line");

			var sParentProperty = obj.component.properties.parentProperty,
			props = obj.component.properties,
			dimLabel = FilterUtil.getPropertyNameDisplay(this.oState.alr_visualFilterBar.getModel(), obj.component.properties.entitySet, obj.component.properties.dimensionField),
			sMeasureButtonIdParentProperty = sParentProperty.replace(/[^\w]/gi, ''),
			sMeasureButtonIdEntityType = this.oState.alr_visualFilterBar._oMetadataAnalyser.getEntityTypeNameFromEntitySetName(obj.component.properties.entitySet),
			sortDescending = obj.component.properties.sortOrder[0].Descending.Boolean, //Inorder to consider the sort Order of only the first property
			bIsSortOrderButtonHidden = FilterUtil.readProperty(obj, "component.type") === "Line" && FilterUtil.readProperty(obj, "component.properties.dimensionFieldIsDateTime"),
			chartType = this.oState.alr_visualFilterBar._resolveChartType(obj.component.type),
			chartTypeIcon = this._getChartTypeIconLink(chartType),
			title = new Label({
				text: that._getChartTitle(obj, idx),
				tooltip: that._getChartTitle(obj, idx)
			});
			if (this.oConfig.filterCompList[idx].component.properties.isMandatory) {
				title.addStyleClass("sapMLabelRequired");
			}
			//Get the input control for corresponding property needed to fire valuehelp request
			var oInput = this.oState.oSmartFilterbar.getControlByKey(obj.component.properties.parentProperty);
			//ensure that value help annotations are loaded
			this.oState.oSmartFilterbar.ensureLoadedValueHelp(obj.component.properties.parentProperty);
			//Value help button is needed only if input control is defined
			var bIsValuehelp = oInput.getShowValueHelp && oInput.getShowValueHelp(),
			sShowDropdown = (props.isDropDown) ? "sap-icon://slim-arrow-down" : "",
			sIcon = bIsValuehelp ? "sap-icon://value-help" : sShowDropdown,
			count, rb = this.oVerticalBox.getModel("i18n").getResourceBundle(),
			items = [
					new Button({
						type: "Transparent",
						icon: "sap-icon://line-chart-time-axis",
						visible: false, //isItLineChart To drop support for this button in Wave 15
						press: function(oEvent) {
							that._showLineChartTimeAxisPopup(oEvent);
						}
					}).data("idx", idx),
					new Button({
						type: "Transparent",
						icon: (bIsValuehelp || props.isDropDown) ? sIcon : "",
						visible: {
							path: "_filter>/" + sParentProperty,
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
						text: {
							path: "_filter>/" + sParentProperty,
							formatter: function(oContext) {
								if (oContext) {
									count = 0;
									if (typeof oContext === "object") {	//For multi value
										if (oContext.value) {	//Add single value
											count++;
										}
										//Add items
										if (oContext.items) {	//items can be null
											count += oContext.items.length;
										}
										//Add ranges
										if (oContext.ranges) {	//ranges can be null
											count += oContext.ranges.length;
										}
									} else {	//For single value, it can be string or int
										count++;
									}
								}
								return count ? "(" + count + ")" : "";
							}
						},
						press: function(oEvent) {
							if (bIsValuehelp) {
								oInput.fireValueHelpRequest.call(oInput);
							} else if (props.isDropDown) {
								DropDownController.createDropdown(oEvent.getSource(), that.filterChartList[oEvent.getSource().data("idx")], this.getModel(), dimLabel, props);
							} else {
								sap.suite.ui.generic.template.AnalyticalListPage.controller.VisualFilterDialogController.launchAllFiltersPopup(oEvent.getSource(), that.filterChartList[oEvent.getSource().data("idx")], oEvent.getSource().getModel('i18n'));
							}
						},
						tooltip: {
							path: "_filter>/" + sParentProperty,
							formatter: function() {
								return FilterUtil.getTooltipForValueHelp(bIsValuehelp, dimLabel, rb, count);
							}
						},
						layoutData: new sap.m.OverflowToolbarLayoutData({
							priority: sap.m.OverflowToolbarPriority.NeverOverflow
						})
					}).data("idx",idx),
					new OverflowToolbarButton({
						type: "Transparent",
						icon: (sortDescending ? "sap-icon://sort-descending" : "sap-icon://sort-ascending"),
						visible: !bIsSortOrderButtonHidden,
						tooltip:"{i18n>VISUAL_FILTER_SORT_ORDER}",
						text:"{i18n>VISUAL_FILTER_SORT_ORDER}",
						press: function(oEvent) {
							that._showChartSortPopup(oEvent);
						},
						layoutData: new sap.m.OverflowToolbarLayoutData({
							closeOverflowOnInteraction: false,
							priority: (!sap.ui.Device.system.desktop) ? sap.m.OverflowToolbarPriority.AlwaysOverflow : sap.m.OverflowToolbarPriority.High
						})
					}).data("idx", idx),
					new OverflowToolbarButton({
						type: "Transparent",
						icon: chartTypeIcon,
						tooltip:"{i18n>VISUAL_FILTER_CHART_TYPE}",
						text:"{i18n>VISUAL_FILTER_CHART_TYPE}",
						press: function(oEvent) {
							that._showChartTypesPopup(oEvent);
						},
						layoutData: new sap.m.OverflowToolbarLayoutData({
							closeOverflowOnInteraction: false,
							priority: (!sap.ui.Device.system.desktop) ? sap.m.OverflowToolbarPriority.AlwaysOverflow : sap.m.OverflowToolbarPriority.High
						})
					}).data("idx", idx),
					new OverflowToolbarButton({
						//Stable ID for measure field
						id: "template::VisualFilterDialog::MeasureChangeButton::" + sMeasureButtonIdEntityType + "::" + sMeasureButtonIdParentProperty,
						type: "Transparent",
						icon: "sap-icon://measure",
						tooltip:"{i18n>VISUAL_FILTER_MEASURE}",
						text:"{i18n>VISUAL_FILTER_MEASURE}",
						press: function(oEvent) {
							that._showChartMeasuresPopup(oEvent);
						},
						layoutData: new sap.m.OverflowToolbarLayoutData({
							closeOverflowOnInteraction: false,
							priority: (!sap.ui.Device.system.desktop) ? sap.m.OverflowToolbarPriority.AlwaysOverflow : sap.m.OverflowToolbarPriority.High
						})
					}).data("idx", idx)
			];
			if ((sap.ui.Device.system.tablet || sap.ui.Device.system.phone) && !sap.ui.Device.system.desktop) { //Makes sure ShowOnFilterBar Checkbox goes into overflow only for Mobile and Tablet and not for Desktop
				items.splice(2,0,
					new CheckBox({
						tooltip: "{i18n>SHOW_ON_FILTER_BAR}",
						text: "{i18n>SHOW_ON_FILTER_BAR}",
						selected: that.oConfig.filterCompList[idx].shownInFilterBar,
						layoutData: new sap.m.OverflowToolbarLayoutData({
							closeOverflowOnInteraction: false,
							priority: sap.m.OverflowToolbarPriority.AlwaysOverflow
						})
					}).data("idx", idx).attachSelect(null, that._onCheckBoxSelect, that));
				items[2].addStyleClass("sapSmartTemplatesAnalyticalListPageVFDShowInFilterBarCozy");
			}
			var customToolbar = new sap.m.OverflowToolbar({
				design: sap.m.ToolbarDesign.Transparent,
				content: [
					title,
					new sap.m.ToolbarSpacer(),
					items
				]
			}).addStyleClass("sapSmartTemplatesAnalyticalListPageFilterDialogTitleToolbar");
			customToolbar.getContent()[0].addStyleClass("sapUiTinyMarginTop");
			customToolbar.getContent()[0].addStyleClass("sapSmartTemplatesAnalyticalListPageVFDialogChartTitle");
			customToolbar.setWidth("100%");

			return customToolbar;
		},
		_addChart: function (chartType, prop, idx) {
			var chart;
			var that = this;

			var oProp = {
					scaleFactor : prop.scaleFactor,
					numberOfFractionalDigits: prop.numberOfFractionalDigits,
					sortOrder: prop.sortOrder,
					filterRestriction: prop.filterRestriction,
					isDropDown: prop.isDropDown,
					width: chartWidth,
					height: prop.height,
					labelWidthPercent: labelWidthPercent,
					entitySet: prop.entitySet,
					dimensionField: prop.dimensionField,
					dimensionFieldDisplay: prop.dimensionFieldDisplay,
					dimensionFieldIsDateTime: prop.dimensionFieldIsDateTime,
					unitField: prop.unitField,
					isCurrency: prop.isCurrency,
					isMandatory: prop.isMandatory,
					measureField: prop.measureField,
					dimensionFilter: prop.dimensionFilter,
					outParameter: prop.outParameter,
					inParameters: prop.inParameters,
					parentProperty: prop.parentProperty,
					textArrangement: prop.textArrangement,
					chartQualifier: prop.chartQualifier
			};

			var sPath = "/filterCompList/" + idx;

			if (chartType === "Donut") {
				oProp.labelWidthPercent = labelWidthPercentDonut;
			}

			chartType = this.oState.alr_visualFilterBar._resolveChartType(chartType);

			var chart = this.oState.alr_visualFilterBar._createFilterItemOfType(chartType, oProp);
			chart.data("idx", idx);
			chart.addCustomData(new sap.ui.core.CustomData({
				key: 'sPath',
				value: sPath
			}));
			chart.bindProperty('visible', {
				path: '_visualFilterConfigModel>/filterCompList/' + idx + '/showChartOverlay',
				formatter: function(bValue) {
					return !bValue;
				}
			});
			// bind dimension filter property for seletions on the chart
			chart.bindProperty('dimensionFilter', {
				path: '_filter>/' + chart.getParentProperty()
			});
			var aInParameters = chart.getInParameters(),
			aBindingParts = [];

			if (aInParameters && aInParameters.length > 0) {
				aInParameters.forEach(function (element) {
					aBindingParts.push({
						path: "_filter>/" + element.localDataProperty
					});
				});
			}

			if (that.oState.alr_visualFilterBar.getEntitySet() === chart.getEntitySet()) {
				var aMandatoryFields = that.oState.alr_visualFilterBar._smartFilterContext.determineMandatoryFilterItems();
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

			if (aBindingParts && aBindingParts.length > 0) {
				// create property binding to handle In parameter changes
				chart.bindProperty('dimensionFilterExternal', {
			        parts: aBindingParts,
			        formatter: function () {
						var	aInParameters = this.getInParameters(),
							sParentProperty = this.getParentProperty(), oFilter, oCurrencyProperty;
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
						if (!(that.oState.alr_visualFilterBar.getEntitySet() === this.getEntitySet() && that.oState.oSmartFilterbar.getAnalyticBindingPath() !== "") && (that.oState.oSmartFilterbar.getAnalyticBindingPath() === "" || ((that.oState.oSmartFilterbar.getAnalyticBindingPath().indexOf("P_DisplayCurrency")) != -1))) {
							var displayCurrency = that.oState.alr_visualFilterBar.getProperty("displayCurrency");
							// If displayCurrency is set only then we proceed.
							if (displayCurrency) {
								var measureField = this.getMeasureField();
								var oModel = that.oState.alr_visualFilterBar.getModel();
								var metaModel = oModel.getMetaModel();
								var oEntityType = metaModel.getODataEntityType(that.oState.alr_visualFilterBar._oMetadataAnalyser.getEntityTypeNameFromEntitySetName(this.getEntitySet()));
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
												var aFilterData = that.oState.oSmartFilterbar.getFilterData();
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
						return that.oState.alr_visualFilterBar._getFiltersForFilterItem(aInParameters, sParentProperty, oFilter, sCurrencyField);
					}
				});
			}
			chart._updateBinding();
			chart._bAllowBindingUpdateOnPropertyChange = true;

			//chart click handler
			chart.attachFilterChange(function(oEvent) {
				//var idx = oEvent.getSource().data("idx");
				that._filterModified = true;

				// fire visual filter change event to get compact filter data for in params
				// so that other visual filter items can react
				that.oState.alr_visualFilterBar.fireFilterChange();
			});

			chart.attachTitleChange(function(oEvent) {
				var idx = oEvent.getSource().data("idx");
				if (that.filterCompList[idx].toolbar.getContent().length > 0) {
					// If Mandatory property then add an (*)
					if (oProp.isMandatory) {
						that.filterCompList[idx].toolbar.getContent()[0].addStyleClass("sapMLabelRequired");
					}
					that.filterCompList[idx].toolbar.getContent()[0].setText(that._getChartTitle(that.filterCompList[idx].obj, idx));
				}
			});

			return chart;
		},
		_createMoreFiltersLink: function(groupName, oGroupTitle) {
			var that = this;
			var count = 0;
			var i;
			var oLink = new Link();

			for (i = 0; i < this.filterCompList.length; i++) {
				if (this.filterCompList[i].searchVisible &&
						this.filterCompList[i].obj.group.name === groupName &&
						!this.filterCompList[i].obj.shownInFilterDialog) {
					count++;
				}
			}
			if (count > 0) {
				oLink.setText(this.oRb.getText("FILTER_BAR_SHOW_MORE_FILTERS", [count]));
			} else {
				oLink.setText(this.oRb.getText("FILTER_BAR_SHOW_CHANGE_FILTERS"));
			}

			oLink.attachPress(function(evnt) {
				that._createAddRemoveFiltersDialog(groupName, oLink);
			});
			//BCP: 1780364662 accessibility support for reading out group title in the visual filter dialog when the focus is on it's groupContainer element.
			if (oGroupTitle) {
				oLink.addAriaLabelledBy(oGroupTitle);
			}

			return oLink;
		},
		_showChartMeasuresPopup: function(oEvent) {
			var that = this;
			var idx = oEvent.getSource().data("idx");
			var collectionPath = this.filterChartList[idx].getProperty("entitySet");
			var oDialog = sap.suite.ui.generic.template.AnalyticalListPage.controller.VisualFilterDialogController._createPopoverDialog(oEvent.getSource().getModel('i18n'), "VISUAL_FILTER_MEASURES");
			var oList = new List({
				mode: sap.m.ListMode.SingleSelectLeft,
				includeItemInSelection: true
			});
			oList.data("idx", idx);
			oDialog.addContent(oList);
			var measures = this.oState.alr_visualFilterBar._getMeasureMap()[collectionPath];
			oList.addStyleClass("sapUiSizeCompact");
			//measures will be undefined if collectionPath does not exist in measures.
			if (measures) {
				for (var item in measures) {
					var oListItem = new StandardListItem({
						title: measures[item].label
					}).data("measureName", measures[item].name);
					oList.addItem(oListItem);
					if (this.filterChartList[idx].getMeasureField() === measures[item].name) {
						oList.setSelectedItem(oListItem);
					}
				}
			}

			oList.attachSelectionChange(function (oEvent) {
				var idx = oEvent.getSource().data("idx"),
				sMeasureName = oEvent.getSource().getSelectedItem().data("measureName");
				that.filterChartList[idx].setProperty("unitField", measures[sMeasureName].fieldInfo.unit);
				that.filterCompList[idx].toolbar.getContent()[0].setText(that._getChartTitle(that.filterCompList[idx].obj, idx));
				that.oConfig.filterCompList[idx].component.properties.measureField = sMeasureName;

				// if chart is line sort order should not change on measure change
				if (!that.filterChartList[idx]._chart.getPoints) {
					// set Sort Order without updating vf items
					var aSortProperty = jQuery.extend(true, [], that.filterChartList[idx].getSortOrder());
					//We consider only first sortProperty, hence 0 index is used
					aSortProperty[0].Field.String = sMeasureName;
					that.filterChartList[idx].setSortOrder(aSortProperty);
					that._updateVisualFilterConfigModel(idx, '/component/properties/sortOrder', aSortProperty);
				}

				var oMeasureProperty = {
					bUpdateBinding: true,
					value: sMeasureName
				};
				that.filterChartList[idx].setMeasureField(oMeasureProperty);
				// This triggers setMeasure for the filter item on the bar
				// passed as an oject so that update binding can be called
				that._updateVisualFilterConfigModel(idx, '/component/properties/measureField', oMeasureProperty);
				// set measure as string in the model so that it can be normally used at other places
				that._updateVisualFilterConfigModel(idx, '/component/properties/measureField', sMeasureName);
				that._updateVisualFilterConfigModel(idx, '/component/properties/unitField', measures[sMeasureName].fieldInfo.unit);
				that._filterModified = true;
				if (oDialog) {
					oDialog.close();
				}
			});

			oDialog.attachAfterClose(function() {
				oDialog.destroy();
				oDialog = null;
			});

			oDialog.openBy(oEvent.getSource());

		},

		_showChartTypesPopup: function(oEvent) {
			var that = this;
			var button = oEvent.getSource();
			var oDialog = sap.suite.ui.generic.template.AnalyticalListPage.controller.VisualFilterDialogController._createPopoverDialog(oEvent.getSource().getModel('i18n'), "VISUAL_FILTER_CHART_TYPES");
			var compList = this.oState.alr_visualFilterBar._getSupportedFilterItemList();
			var listItems = [];
			var bSelectionChanged = false;
			for (var i = 0; i < compList.length; i++) {
				var comp = compList[i];
				var listItem = new StandardListItem({
						title: "{i18n>" + comp.textKey + "}",
						icon: comp.iconLink,
						selected: button.getIcon() === comp.iconLink
					}).data("type", comp.type);
				listItems.push(listItem);
			}
			var oList = new List({
				mode: sap.m.ListMode.SingleSelectMaster,
				items: listItems
			});
			oList.data("button", button);
			oList.addStyleClass("sapUiSizeCompact");
			oDialog.addContent(oList);

			oList.attachSelectionChange(function (oEvent) {
				var idx = oEvent.getSource().data("button").data("idx"),
				chartType = oEvent.getSource().getSelectedItem().data("type"),
				oFilterItem = that.filterChartList[idx],
				sDimension = oFilterItem.getDimensionField(),
				sMeasure = oFilterItem.getMeasureField(),
				bDimensionIsDateTime = oFilterItem.getDimensionFieldIsDateTime(),
				sSortField = FilterUtil.readProperty(that.oConfig, "filterCompList." + idx + ".component.properties.sortOrder.0.Field.String"),
				oVisualConfigModel = that.oState.alr_visualFilterBar.getModel('_visualFilterConfigModel'),
				oModelData = jQuery.extend(true, {}, oVisualConfigModel.getProperty('/filterCompList/' + idx)),
				sModelSortField = FilterUtil.readProperty(oModelData, "component.properties.sortOrder.0.Field.String");
				// change chart type in VFD config
				that.oConfig.filterCompList[idx].component.type = chartType; // Updating new chart type to oConfig
				bSelectionChanged = true;
				oEvent.getSource().data("button").setIcon(that._getChartTypeIconLink(chartType));

				// change sort order based on chart selected
				if (sSortField && sModelSortField) {
					if (chartType === "Line") {
						// for line chart sort should always be on dimension
						that.oConfig.filterCompList[idx].component.properties.sortOrder[0].Field.String = sDimension;
						oModelData.component.properties.sortOrder[0].Field.String = sDimension;

						if (bDimensionIsDateTime) {
							// in case dimension is date time the order should be descending
							// else previous order should prevail
							// Store the value of previous sort order so that when chart type is changed back, sort order is correct
							that.bSortOrder = that.oConfig.filterCompList[idx].component.properties.sortOrder[0].Descending.Boolean;
							that.oConfig.filterCompList[idx].component.properties.sortOrder[0].Descending.Boolean = true;
							oModelData.component.properties.sortOrder[0].Descending.Boolean = true;
							// Making this.bLine = true to indicate that sortorder is changed for Time based Line chart
							that.bIsTimeBasedLine = true;
						}
					} else {
						// for line chart sort should always be on measure
						that.oConfig.filterCompList[idx].component.properties.sortOrder[0].Field.String = sMeasure;
						oModelData.component.properties.sortOrder[0].Field.String = sMeasure;
						if (that.bIsTimeBasedLine) { // if sort order is changed for time based line chart, we have to revert back to old sort order when chart type is changed
							that.oConfig.filterCompList[idx].component.properties.sortOrder[0].Descending.Boolean = that.bSortOrder;
							oModelData.component.properties.sortOrder[0].Descending.Boolean = that.bSortOrder;
							that.bIsTimeBasedLine = false;
						}
						// no change in sort order required here
					}
				}

				oModelData.component.type = chartType;
				oVisualConfigModel.setProperty('/filterCompList/' + idx, oModelData);
				that.oState.oSmartFilterbar._oVariantManagement.currentVariantSetModified(true);
				that.oState.alr_visualFilterBar.updateVisualFilterBindings(true);

				if (oDialog) {
					oDialog.close();
				}
			});
			oDialog.attachBeforeClose(function() {
				//to avoid reload of charts in the dialog when chart type is not changed
				if (bSelectionChanged) {
					that._filterModified = true;
					that._reloadForm();
				}
			});
			oDialog.attachAfterClose(function() {
				oDialog.destroy();
				oDialog = null;
			});

			oDialog.openBy(oEvent.getSource());
		},
		_showLineChartTimeAxisPopup: function(oEvent) {
			var idx = oEvent.getSource().data("idx");
			var button = oEvent.getSource();
			var oDialog = sap.suite.ui.generic.template.AnalyticalListPage.controller.VisualFilterDialogController._createPopoverDialog(oEvent.getSource().getModel('i18n'), "VISUAL_FILTER_LINE_CHART_TIME_LINE");
			var oList = new List({
				mode: sap.m.ListMode.SingleSelectLeft,
				items: [
					new StandardListItem({
						title: "{i18n>VISUAL_FILTER_LINE_CHART_TIME_LINE_DAYS}"
					}).data("idx", idx),
					new StandardListItem({
						title: "{i18n>VISUAL_FILTER_LINE_CHART_TIME_LINE_MONTH}"
					}).data("idx", idx),
					new StandardListItem({
						title: "{i18n>VISUAL_FILTER_LINE_CHART_TIME_LINE_QUARTERS}"
					}).data("idx", idx),
					new StandardListItem({
						title: "{i18n>VISUAL_FILTER_LINE_CHART_TIME_LINE_YEARS}"
					}).data("idx", idx)
				]
			});
			oList.data("button", button);
			oList.addStyleClass("sapUiSizeCompact");
			oDialog.addContent(oList);

			oList.attachSelectionChange(function (oEvent) {
				// add logic
				oDialog.close();
			});

			oDialog.attachAfterClose(function() {
				oDialog.destroy();
				oDialog = null;
			});

			oDialog.openBy(oEvent.getSource());
		},
		_showChartSortPopup: function(oEvent) {
			var that = this;
			var idx = oEvent.getSource().data("idx");
			var button = oEvent.getSource();
			var i18n = oEvent.getSource().getModel('i18n');
			var oDialog = sap.suite.ui.generic.template.AnalyticalListPage.controller.VisualFilterDialogController._createPopoverDialog(i18n, "VISUAL_FILTER_SORTING");
			var oList = new List({
				mode: sap.m.ListMode.SingleSelectLeft,
				includeItemInSelection: true,
				items: [
					new StandardListItem({
						title: i18n.getResourceBundle().getText("VISUAL_FILTER_SORTING_ASCENDING")
					}).data("idx", idx),
					new StandardListItem({
						title: i18n.getResourceBundle().getText("VISUAL_FILTER_SORTING_DESCENDING")
					}).data("idx", idx)
				]
			});
			oList.data("button", button);
			oList.addStyleClass("sapUiSizeCompact");
			if (this.filterChartList[idx].getSortOrder()[0].Descending.Boolean) {
				oList.setSelectedItem(oList.getItems()[1], true);
			} else {
				oList.setSelectedItem(oList.getItems()[0], true);
			}
			oDialog.addContent(oList);

			oList.attachSelectionChange(function (oEvent) {
				var button = oEvent.getSource().data("button");
				var idx = button.data("idx");
				var aSortProperty = jQuery.extend(true, [], that.filterChartList[idx].getSortOrder());
				//We consider only first sortProperty, hence 0 index is used
				aSortProperty[0].Descending.Boolean = oEvent.getSource().getItems()[1].isSelected();
				if (aSortProperty[0].Descending.Boolean) {
					button.setIcon("sap-icon://sort-descending");
				} else {
					button.setIcon("sap-icon://sort-ascending");
				}
				var oSortProperty = {
					bUpdateBinding: true,
					value: aSortProperty
				};
				that.filterChartList[idx].setSortOrder(oSortProperty);
				// This triggers setSortOrder for the filter item on the bar
				// passed as an oject so that update binding can be called
				that._updateVisualFilterConfigModel(idx, '/component/properties/sortOrder', oSortProperty);
				// set sortOrder as array in the model so that it can be normally used at other places
				that._updateVisualFilterConfigModel(idx, '/component/properties/sortOrder', aSortProperty);
				that._filterModified = true;
				if (oDialog) {
					oDialog.close();
				}
			});
			oDialog.attachAfterClose(function() {
				oDialog.destroy();
				oDialog = null;
			});

			oDialog.openBy(oEvent.getSource());
		},
		/**
		 * Creates the 'Add/Remove Filters' - dialog.
		 *
		 * @private
		 * @param {string} groupName filter group name
		 * @param {sap.m.Link} oLink more/clear filters link
		 */

		_createAddRemoveFiltersDialog: function(groupName, oLink) {
			var i; //, oDialog,
			var that = this;

			var oDialog = new sap.m.Dialog();
			oDialog.setTitle(this.oRb.getText("SELECT_FILTER_FIELDS"));
			oDialog.addStyleClass("sapUiPopupWithPadding");
			oDialog.addStyleClass("sapUiCompAddRemoveFilterDialog");
			oDialog.addStyleClass("sapUiSizeCompact");
			oDialog.setVerticalScrolling(true);

			var oSubHeader = new Bar();
			var oSearchField = new SearchField({
				placeholder: this.oRb.getText("FILTER_BAR_SEARCH")
			});

			this._oSearchField = oSearchField;
			oSearchField.attachLiveChange(function(oEvent) {
				that._onAddRemoveFiltersSearch(oEvent);
			});

			oSubHeader.addContentRight(oSearchField);
			oDialog.setSubHeader(oSubHeader);

			this.addRemoveList = new List({
				mode: sap.m.ListMode.MultiSelect
			});
			this.addRemoveList.setShowSeparators(ListSeparators.None);
			oDialog.addContent(this.addRemoveList);

			for (i = 0; i < this.filterCompList.length; i++) {
				if (this.filterCompList[i].obj.group.name === groupName && this.filterCompList[i].searchVisible) {
					var oListItem = new StandardListItem({
						title: this._getChartTitle(this.filterCompList[i].obj, i, true)
					}).data("idx", i);
					this.addRemoveList.addItem(oListItem);
					if (this.filterCompList[i].obj.shownInFilterDialog) {
						this.addRemoveList.setSelectedItem(oListItem, true);
					}
				}
			}
			//on selection Change of filters in more filters link
			this.addRemoveList.attachSelectionChange(function(oEvent) {
				if (oEvent) {
					var oParams = oEvent.getParameters();
					if (oParams) {
						var oListItem = oParams.listItem;
						var idx = oListItem.data("idx");
						if (oListItem) {
							var oVisibilityChange = {
								bVisible : oParams.selected,
								propertyName : that.oConfig.filterCompList[idx].component.properties.parentProperty
							};
							that.oState.alr_visualFilterBar.fireFilterChange(oVisibilityChange);
						}
					}
				}
			});
			// OK button
			var oOKButton = new Button({
				text: this.oRb.getText("FORM_PERS_DIALOG_OK")
			});
			oOKButton.attachPress(function() {
				var i;
				var items = that.addRemoveList.getItems();
				var oVisualConfigModel = that.oState.alr_visualFilterBar.getModel('_visualFilterConfigModel'),
					oVisualConfigModelClone = jQuery.extend(true, {}, oVisualConfigModel);
				for (i = 0; i < items.length; i++) {
					var idx = items[i].data("idx");
					var bSelected = items[i].isSelected();
					//if the chart is deselected in 'change filters' dialog of a field group, update VFConfigModel to hide the chart..
					//.. in dialog and VF bar.
					oVisualConfigModelClone.setProperty('/filterCompList/' + idx + '/shownInFilterBar', bSelected);
					oVisualConfigModelClone.setProperty('/filterCompList/' + idx + '/shownInFilterDialog', bSelected);
				}
				oVisualConfigModel.setData(oVisualConfigModelClone.getData());
				//update config object when VFConfig model is updated
				that.oConfig = JSON.parse(oVisualConfigModel.getJSON());
				that.oState.alr_visualFilterBar.updateVisualFilterBindings(true);
				//to enable Restore button on change of chart type, sort order, measure field and  show in filter bar changes 
				that.oState.oSmartFilterbar._oVariantManagement.currentVariantSetModified(true);
				that._filterModified = true;
				that._reloadForm();
				oDialog.close();
			});
			oDialog.addAggregation("buttons", oOKButton);
			oDialog.setInitialFocus(this._oSearchField);
			oDialog.setContentHeight("23.25rem"); // 30.25 - 2*2.5rem - 2rem

			// Cancel button
			var oCancelButton = new Button({
				text: this.oRb.getText("FORM_PERS_DIALOG_CANCEL"),
				press: function() {
					oDialog.close();
				}
			});
			oDialog.addAggregation("buttons", oCancelButton);

			oDialog.attachAfterClose(function() {
				oDialog.destroy();
				oDialog = null;
			});

			oDialog.open();
		},
		_onAddRemoveFiltersSearch : function (oEvent) {
			var i;

			if (!oEvent) {
				return;
			}

			var parameters = oEvent.getParameters();
			if (!parameters) {
				return;
			}

			var sValue = (parameters.newValue ? parameters.newValue : "").toLowerCase();
			var items = this.addRemoveList.getItems();
			for (i = 0; i < items.length; i++) {
				var sText = (items[i].getTitle()).toLowerCase();
				items[i].setVisible(sText.indexOf(sValue) >= 0);
			}
		},
		_getChartTypeIconLink: function(icon) {
			var compMap = this.oState.alr_visualFilterBar._getSupportedFilterItemMap();
			var comp = compMap[icon];
			return !comp ? "" : comp.iconLink;
		},
		_getChartTitle: function (obj, idx, useConfig) {
			var title = "";
			if (this.filterChartList[idx]) {
				if (useConfig) {
					obj.component.properties = this.filterChartList[idx].getP13NConfig();
					title = this.oState.alr_visualFilterBar.getTitleByFilterItemConfig(obj);
				} else {
					title = this.filterChartList[idx].getTitle();
				}
			} else {
				//Provide properties from config when chart is not created (hidden)
				obj.component.properties = this.oConfig.filterCompList[idx].component.properties;
				title = this.oState.alr_visualFilterBar.getTitleByFilterItemConfig(obj);
			}
			return title;
		},
		_adjustToolbarIcons: function(idx) {
			if (this.filterCompList[idx].obj.component.type === "Line") {
				this.filterCompList[idx].toolbar.getContent()[1].getItems()[1].setVisible(true);
				this.filterCompList[idx].toolbar.getContent()[1].getItems()[2].setVisible(false);
			} else {
				this.filterCompList[idx].toolbar.getContent()[1].getItems()[1].setVisible(false);
				this.filterCompList[idx].toolbar.getContent()[1].getItems()[2].setVisible(true);
			}
		},
		_updateVisualFilterConfigModel: function(idx, path, value, bIsUpdate) {
			var oVisualConfigModel = this.oState.alr_visualFilterBar.getModel('_visualFilterConfigModel');
			oVisualConfigModel.setProperty('/filterCompList/' + idx + path, value);
			if (bIsUpdate) {
				//To reload the aggregation,so that the chart will be rendered
				var oModelData = jQuery.extend(true, {}, oVisualConfigModel.getProperty('/filterCompList/' + idx));
				oVisualConfigModel.setProperty('/filterCompList/' + idx, oModelData);
				this.oState.alr_visualFilterBar.updateVisualFilterBindings(true);
			}
			//update config object when VFConfig model is updated
			this.oConfig = JSON.parse(oVisualConfigModel.getJSON());
			//to enable Restore button on change of chart type, sort order, measure field and  show in filter bar changes 
			this.oState.oSmartFilterbar._oVariantManagement.currentVariantSetModified(true);
		},
		/**
		 * Reacts to search from 'Filters'- dialog.
		 *
		 * @private
		 * @param {object} oEvent containing the search string
		 */
		_triggerSearchInFilterDialog: function (oEvent) {
			var i;

			if (!oEvent) {
				return;
			}

			var parameters = oEvent.getParameters();
			if (!parameters) {
				return;
			}

			var sValue = (parameters.newValue ? parameters.newValue : "").toLowerCase();
			for (i = 0; i < this.oConfig.filterCompList.length; i++) {
				var obj = this.oConfig.filterCompList[i].component.properties;
				// Search inside dialog looks for matches in parentProperty as well as measurefield
				this.oConfig.filterCompList[i].searchVisible = (obj.parentProperty.toLowerCase().indexOf(sValue) >= 0) || (obj.measureField.toLowerCase().indexOf(sValue) >= 0);
			}
			this._reloadForm();
		}
	});

	/**
	 * @private
	 * [_createPopoverDialog description]
	 * @param  {object} i18n object
	 * @param  {object} title string to display in dialog
	 * @return {object} oDialog object
	 */
	sap.suite.ui.generic.template.AnalyticalListPage.controller.VisualFilterDialogController._createPopoverDialog = function(i18n, title) {
		//to avoid multiple popovers being created on each press event of the chart toolbar buttons
		if (this._oPopoverDialog) {
			this._oPopoverDialog.destroy();
		}
		this._oPopoverDialog = new sap.m.Popover();
		this._oPopoverDialog.setTitle(i18n.getResourceBundle().getText(title));
		this._oPopoverDialog.setPlacement(sap.m.PlacementType.PreferredBottomOrFlip);
		this._oPopoverDialog.addStyleClass("sapUiPopupWithPadding");
		return this._oPopoverDialog;
	};

	sap.suite.ui.generic.template.AnalyticalListPage.controller.VisualFilterDialogController._createFilterItemSelectedList = function(oChart, oDialog) {
		var oList = new List({
			mode: sap.m.ListMode.Delete
		}),
		// get a clone of dimension filter so that _filter model is not updated yet
		oFilters,
		sFilterRestriction = oChart.getFilterRestriction();

		oList.data("chart", oChart);

		if (sFilterRestriction === 'multiple') {
			// multi-value
			oFilters = jQuery.extend(true, {}, oChart.getDimensionFilter());
			var aFilterItems = (oFilters && oFilters.items) ? oFilters.items : undefined,
			aFilterRanges = (oFilters && oFilters.ranges) ? oFilters.ranges : undefined,
			aFilterValue = (oFilters && oFilters.value) ? oFilters.value : null;
			oFilters = jQuery.extend(true, {}, oChart.getDimensionFilter());
			if (aFilterItems) {
				for (var i = 0; i < aFilterItems.length; i++) {
					var oListItem = new StandardListItem({
						title: aFilterItems[i].text ? aFilterItems[i].text : aFilterItems[i].key
					});
					// add custom data to determine whether value is part of items/ranges/value
					if ( oListItem ) {
						oListItem.addCustomData(new sap.ui.core.CustomData({
							key: 'items',
							value: i
						}));
					}
					oList.addItem(oListItem);
				}
			}


			if (aFilterRanges) {
				for (var i = 0; i < aFilterRanges.length; i++) {
					var oListItem = new StandardListItem({
						title: aFilterRanges[i].tokenText ? aFilterRanges[i].tokenText : FilterUtil.createTitleFromCode(aFilterRanges[i])
					});
					// add custom data to determine whether value is part of items/ranges/value
					// so that accessing the filter is easier while it is removed from the list
					oListItem.addCustomData(new sap.ui.core.CustomData({
						key: 'ranges',
						value: i
					}));
					oList.addItem(oListItem);
				}
			}

			// consider user typed in values
			if (aFilterValue) {
				var oListItem = new StandardListItem({
					title: aFilterValue
				});
				// add custom data to determine whether value is part of items/ranges/value
				// so that accessing the filter is easier while it is removed from the list
				oListItem.addCustomData(new sap.ui.core.CustomData({
					key: 'value'
				}));
				oList.addItem(oListItem);
			}
		} else {
			// single-value
			oList.addItem( new StandardListItem({ title: oChart.getDimensionFilter() }));
		}

		oList.attachDelete(function (oEvent) {
			var oItem = oEvent.getParameter("listItem"),
			chart = oList.data('chart'),
			oDimensionFilters;

			if (sFilterRestriction === 'single') {
				oDimensionFilters = null;
			} else {
				oDimensionFilters = jQuery.extend(true, {}, chart.getDimensionFilter());
				var aCustomData = oItem.getCustomData()[0],
				sFilterType = aCustomData.getKey(),
				aFilters = oDimensionFilters[sFilterType];
				if (sFilterType !== 'value') {
					// if type is items or ranges get index for filter
					var sIndex = aCustomData.getValue();
					// and remove index from filters
					aFilters.splice(sIndex, 1);
				} else {
					oDimensionFilters.value = null;
				}
			}
			oList.removeItem(oItem);
			chart.setDimensionFilter(oDimensionFilters);
			chart.fireFilterChange();
			// remove content from Dialog and add alist to dialog again
			// so that custom data (items/ranges/value) of list item
			// is always in sync with indexes of dimension filter
			oDialog.removeContent(oList);
			var oNewList = sap.suite.ui.generic.template.AnalyticalListPage.controller.VisualFilterDialogController._createFilterItemSelectedList(chart, oDialog);
			// add new list to dialog only if list has list items
			if (oNewList.getItems().length > 0) {
				oDialog.addContent(oNewList);
				// setting the focus to dialog keeps the dialog open
				oDialog.focus();
			} else {
				oDialog.close();
			}
		});

		return oList;
	};

	/**
	 * Launches the All Filters Popup
	 *
	 * @public
	 * @param {Control}  oControl the control requesting the popup
	 * @param {Chart}    oChart the selected chart
	 */
	sap.suite.ui.generic.template.AnalyticalListPage.controller.VisualFilterDialogController.launchAllFiltersPopup = function(oControl, oChart, i18n) {
		var oDialog = sap.suite.ui.generic.template.AnalyticalListPage.controller.VisualFilterDialogController._createPopoverDialog(i18n, "VISUAL_FILTER_ALL_SELECTED_FILTERS"),
		oList = sap.suite.ui.generic.template.AnalyticalListPage.controller.VisualFilterDialogController._createFilterItemSelectedList(oChart, oDialog);
		oDialog.addContent(oList);
		oDialog.addStyleClass("sapUiSizeCompact");
		oDialog.addStyleClass("sapSmartTemplatesAnalyticalListPageSelectedLinkDialog");

		//Adding a footer bar with a clear all button
		var oFooter = new sap.m.Bar();
		var oClearButton = new Button({
			text: i18n.getResourceBundle().getText("CLEAR_FILTERS_ALL"),
			press: function(oEvent) {
				// reset all filters to default
				var chart = oList.data('chart'),
				sFilterRestriction = chart.getFilterRestriction(),
				oDimensionFilters;
				if (sFilterRestriction === 'multiple') {
					oDimensionFilters = jQuery.extend(true, {}, chart.getDimensionFilter());
					oDimensionFilters.items = [];
					oDimensionFilters.ranges = [];
					oDimensionFilters.value = null;
				} else {
					oDimensionFilters = null;
				}
				// remove filter list from the dialog
				oDialog.removeContent(oList);
				// set dimension filter to trigger two-way binding
				chart.setDimensionFilter(oDimensionFilters);
				chart.fireFilterChange();
				// setting the focus to dialog keeps the dialog open
				oDialog.close();
			}
		});
		oFooter.addContentRight(oClearButton);
		oDialog.setFooter(oFooter);
		oDialog.attachAfterClose(function() {
			oDialog.destroy();
			oDialog = null;
		});

		oDialog.openBy(oControl);
	};

	return vfdController;
});
