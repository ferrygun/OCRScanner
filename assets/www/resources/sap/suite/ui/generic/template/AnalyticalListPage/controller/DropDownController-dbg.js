sap.ui.define([
		'jquery.sap.global',
		'sap/ui/core/mvc/Controller',
		'sap/ui/model/Filter',
		'sap/ui/model/json/JSONModel',
		"sap/m/Button",
		"sap/m/StandardListItem",
		"sap/m/List",
		"sap/m/ToolbarSpacer",
		"sap/suite/ui/generic/template/AnalyticalListPage/util/FilterUtil"
	], function(jQuery, Controller, Filter, JSONModel, Button, StandardListItem, List, Toolbar, FilterUtil) {
	"use strict";

	var bShowOnlySelected = false, oToolbar = {}, oInfoLabel = {}, oUpdatedDimensionFilter = "",
	DropDownController = Controller.extend("sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController", {});

	/**
	 * createMatchingConceptDropdown creates a drop down with pre filled from compact filter value entity set it's selections.
	 *
	 * @param {oControl, oChart, oModel, title, property}
	 * oControl - current element control
	 * oChart - chart
	 * oModel - _filter Model
	 * title - dimLabel
	 * property - property
	 * @returns {void}
	 *
	 * @private
	 */
	sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController.createDropdown = function(oControl, oChart, oModel, title, property) {
		oUpdatedDimensionFilter = (property.filterRestriction == 'multiple') ? jQuery.extend(true, {items: [], ranges: [], value: null}, oChart.getDimensionFilter()) : oChart.getDimensionFilter();
		var i18n = oControl.getModel('i18n'),
		filterBy = {"descriptionAndId":property.dimensionFieldDisplay, "descriptionOnly":property.dimensionFieldDisplay, "idAndDescription":property.dimensionField, "idOnly":property.dimensionField},
		filterBy = (Object.keys(filterBy).indexOf(property.textArrangement) !== -1) ? filterBy[property.textArrangement] : property.dimensionFieldDisplay,
		oToolbarMenuButton = new sap.m.ToggleButton({
			icon :"sap-icon://menu",
			type : "Transparent",
			iconFirst :true,
			enabled : (oUpdatedDimensionFilter && oUpdatedDimensionFilter.hasOwnProperty("items")) ? Boolean(oUpdatedDimensionFilter.items.length) : Boolean(oUpdatedDimensionFilter),
			tooltip :i18n.getResourceBundle().getText("VIS_VALUEHELP_DROPDOWN_VIEW_SELECTED")
		}),
		oList = sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController.createStandardListItem(oModel, oChart, i18n, title, property, oToolbarMenuButton),
		oDialog = sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController.createPopoverWithList(oModel, oChart, i18n, property, title, oList, filterBy, oToolbarMenuButton),
		oOkButton = new sap.m.Button({
							text: i18n.getResourceBundle().getText("OK"),
							press: function (oEvt) {
								oChart.setDimensionFilter(oUpdatedDimensionFilter);
								oChart.fireFilterChange();
								oDialog.close();
							}
						}),
		oCancelButton = new sap.m.Button({
							text: i18n.getResourceBundle().getText("CANCEL"),
							press: function () {
								oDialog.close();
							}
						});
		bShowOnlySelected = false;
		oDialog.addContent(oList);
		//Attaching the selection change of the list to update the selection accordingly.
		oList.attachSelectionChange(function(oEvt) {
			var currentSelectedItem = oList.getModel().getData(oEvt.mParameters.listItem.getBindingContext().sPath);
			currentSelectedItem = currentSelectedItem[property.dimensionField];
			var selected = oEvt.getParameters().listItem.mProperties.selected;
			if (property.filterRestriction === 'multiple') {
				if (oUpdatedDimensionFilter.items && oUpdatedDimensionFilter.items.length) {
					for (var j = 0; j < oUpdatedDimensionFilter.items.length; j++) {
						if (oUpdatedDimensionFilter.items[j].key === currentSelectedItem) {
							oUpdatedDimensionFilter.items.splice(j,1);
						} else if (selected) {
							oUpdatedDimensionFilter.items.push({
								key: currentSelectedItem
							});
							break;
						}
					}
				} else if (oUpdatedDimensionFilter.items) {
					oUpdatedDimensionFilter.items.push({
						key: currentSelectedItem
					});
				} else {
					oUpdatedDimensionFilter.items = [];
				}
				if (oUpdatedDimensionFilter.items.length) {
					oToolbar.setVisible(true);
					oInfoLabel.setText(i18n.getResourceBundle().getText("VIS_VALUEHELP_DROPDOWN_SELECTED_COUNT", [title, oUpdatedDimensionFilter.items.length]));
				}
				oToolbar.setVisible(Boolean(oUpdatedDimensionFilter.items.length));
				oToolbarMenuButton.setEnabled(Boolean(oUpdatedDimensionFilter.items.length));
			} else if (property.filterRestriction === 'single') {
				oUpdatedDimensionFilter = currentSelectedItem;
				if (oUpdatedDimensionFilter) {
					oToolbar.setVisible(true);
					oInfoLabel.setText(i18n.getResourceBundle().getText("VIS_VALUEHELP_DROPDOWN_SELECTED_COUNT", [title, +Boolean(oUpdatedDimensionFilter)]));
				}
				oToolbarMenuButton.setEnabled(Boolean(oUpdatedDimensionFilter));
			}
		});
		oDialog.addStyleClass("sapSmartTemplatesAnalyticalListPageSelectedLinkDialog");
		oDialog.setBeginButton(oOkButton);
		oDialog.setEndButton(oCancelButton);
		oDialog.openBy(oControl);
	};
	//createPopoverWithList --  to create a popover dialog and add the search and menu tab.
	sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController.createPopoverWithList = function(oModel, oChart, i18n, property, title, oList, filterBy, oToolbarMenuButton) {
		//to avoid multiple popovers being created on each press event of the chart toolbar buttons
		//TO-Do need to look a way to optimise it rather than calling it every time.
		var bIsEntitytypeSearchable = sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController.isEntitytypeSearchable(oModel, property);
		if (this._oPopoverDialog) {
			this._oPopoverDialog;
		}
		if (oList) {
			this._oPopoverDialog = new sap.m.ResponsivePopover('',{
				placement: sap.m.PlacementType.Bottom,
				verticalScrolling : true,
				title: title,
				subHeader: [new sap.m.Toolbar({
					content : [new sap.m.SearchField({
					liveChange: function (oEvt) {
					var aFilters = [];
					var sQuery = oEvt.getSource().getValue();
					if (sQuery && sQuery.length > 0) {
						var filter = new Filter(filterBy, sap.ui.model.FilterOperator.Contains, sQuery);
						aFilters.push(filter);
					}
					var binding = oList.getBinding("items");
					bShowOnlySelected = false;
					oToolbarMenuButton.setPressed(false);
					oToolbarMenuButton.setTooltip(i18n.getResourceBundle().getText("VIS_VALUEHELP_DROPDOWN_VIEW_SELECTED"));
					binding.filter(aFilters);
					},
					enabled:bIsEntitytypeSearchable,
					initialFocus : true
					}),
					oToolbarMenuButton
					]
				})],
				content: [oList]
				});
			this._oPopoverDialog.setModel(oChart.getModel("_filter"), "_filter");
		}

		return this._oPopoverDialog;
	};
	//createStandardListItem -- create a Standard list item template.
	sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController.createStandardListItem = function(oModel, oChart, i18n, title, property, oToolbarMenuButton) {
		var sBindingPath = "/" + property.entitySet,
		template = sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController.standardListItemTemplateCreation(oChart, property);
		oInfoLabel = new sap.m.Label({
				text : i18n.getResourceBundle().getText("VIS_VALUEHELP_DROPDOWN_SELECTED_COUNT", [title, typeof (oChart.getDimensionFilter()) === "object" && oChart.getDimensionFilter() !== null  ? oChart.getDimensionFilter().items.length : +Boolean(oChart.getDimensionFilter())])
			});
		oToolbar = new sap.m.Toolbar({
			content : [
				oInfoLabel,
				new sap.m.ToolbarSpacer(),
				new sap.ui.core.Icon({
					src :"sap-icon://sys-cancel",
					tooltip :i18n.getResourceBundle().getText("VIS_VALUEHELP_DROPDOWN_CLEAR_SELECTION"),
					press : function(oEvt) {
						oToolbar.setVisible(false);
						bShowOnlySelected = false;
						oToolbarMenuButton.setTooltip(i18n.getResourceBundle().getText("VIS_VALUEHELP_DROPDOWN_VIEW_SELECTED"));
						oToolbarMenuButton.setEnabled(false);
						oToolbarMenuButton.setPressed(false);
						oList.removeSelections(true);
						(oUpdatedDimensionFilter && oUpdatedDimensionFilter.hasOwnProperty("items")) ?  oUpdatedDimensionFilter.items = [] : oUpdatedDimensionFilter = "";
						oInfoLabel.setText(i18n.getResourceBundle().getText("VIS_VALUEHELP_DROPDOWN_SELECTED_COUNT", [title, (oUpdatedDimensionFilter && oUpdatedDimensionFilter.hasOwnProperty("items")) ? oUpdatedDimensionFilter.items.length : +Boolean(oUpdatedDimensionFilter)]));
						//todo : to check if this is the correct way to trigger list rebind
						oList.getBinding("items").filter([]);
					}
				}).addStyleClass("sapSmartTemplatesAnalyticalListPageDropdownDialogCancelButton")
				],
				"visible" :(oUpdatedDimensionFilter && oUpdatedDimensionFilter.hasOwnProperty("items")) ?  Boolean(oUpdatedDimensionFilter.items.length) : Boolean(oUpdatedDimensionFilter)
			});

		if (oChart.getSmartFilterId()) {
			var oSmartFilterBar = sap.ui.getCore().byId(oChart.getSmartFilterId());
			if (oSmartFilterBar && oSmartFilterBar.getEntitySet() === property.entitySet) {
				sBindingPath = oChart.considerAnalyticBinding(sBindingPath,oSmartFilterBar);
			}
		}
		var aSelectionFields = [property.measureField, property.dimensionField, property.dimensionFieldDisplay],
		//Creating new Sap.m.list
		oList = new sap.m.List({
			mode: property.filterRestriction === "single" ? sap.m.ListMode.SingleSelectMaster : sap.m.ListMode.MultiSelect,
			growing: true,
			//compact filter shows two hundred records only , ALP should also move to that approach for dropdown
			growingThreshold: 15,
			//compact filter does not show this message
			showNoData: false,
			infoToolbar: oToolbar,
			items: {
			path: sBindingPath,
			template: template,
			sorter: sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController.getSortObject(property),
			parameters: {
					select: aSelectionFields.join(",")
				}
			}
		});
		template.setModel(oChart.getModel("_filter"), "_filter");
		oList.setModel(oModel);

		oToolbarMenuButton.attachPress(function(oEvt) {
			if (property.filterRestriction == "multiple" && oUpdatedDimensionFilter.items.length || oUpdatedDimensionFilter && oUpdatedDimensionFilter.hasOwnProperty('items') && !oUpdatedDimensionFilter.items.length && bShowOnlySelected) {
				sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController.updateFilterWithListBindings(oList, oToolbarMenuButton, i18n, property.filterRestriction, property.dimensionField);
			} else if (property.filterRestriction == "single" && oUpdatedDimensionFilter != null || oUpdatedDimensionFilter == null && bShowOnlySelected) {
				sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController.updateFilterWithListBindings(oList, oToolbarMenuButton, i18n, property.filterRestriction, property.dimensionField);
			}
		});
		return oList;
	};
	//Formmater function to update the visiblity of the list based based on the current selection.
	sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController.selectedVisibilityUpdateFormatter = function (oUpdatedDimensionFilter, currentElement) {
		for (var i = 0; i < oUpdatedDimensionFilter.items.length; i++) {
			if (oUpdatedDimensionFilter.items[i].key === currentElement) {
				return true;
			}
		}
		return false;
	};
	//Check if the entity set is searchable or not
	//To-Do Currently parked as it need to be confirmed with PO
	sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController.isEntitytypeSearchable = function (oModel, property) {
		var oODataEntitySet = oModel.getMetaModel().getODataEntitySet(property.entitySet);
		if (oODataEntitySet.extensions.length) {
			for (var i = 0; i < oODataEntitySet.extensions.length; i++) {
				if (oODataEntitySet.extensions[i].name == "searchable") {
					return oODataEntitySet.extensions[i].value == "true";
				}
			}
		}
		return true;
	};

	//StandardListItemCreation
	sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController.standardListItemTemplateCreation = function (oChart, property) {
		var sTextArrangement = property.textArrangement;
		var template = new sap.m.StandardListItem({
			title: {
				parts: [property.dimensionFieldDisplay, property.dimensionField],
				formatter: function(oDimFieldDisplay, sDimField) {
					return FilterUtil.getTextArrangement(oDimFieldDisplay, sDimField, sTextArrangement);
				}
			},
			description: sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController.standardListItemTemplateDescriptionFormatter(property.measureField, property.unitFeild),
			selected: {
				parts: ["_filter>/" + oChart.getParentProperty(), property.dimensionField],
				formatter: function(oDimensionFilter, currentElement) {
					//if the show selected menu is selected then we form a query to get only matching value hence, it's true always
					if (bShowOnlySelected) {
						return true;
					} else {
						// if the show All is true then only selected the values as per oUpdatedDimensionFilter
						if (typeof (oUpdatedDimensionFilter) === "object" && oUpdatedDimensionFilter !== null) {
							for (var i = 0; i < oUpdatedDimensionFilter.items.length; i++) {
								if (oUpdatedDimensionFilter.items[i].key === currentElement) {
									return true;
								}
							}
						} else {
							return (oUpdatedDimensionFilter !== null && oUpdatedDimensionFilter === currentElement) ? true : false;
						}
					}
				}
			}
		});
		return template;
	};

	/**
	 * getSortObject takes the property object to returns the sorted object.
	 *
	 * @param { property}
	 * @returns {sorter object}
	 *
	 * @private
	 */
	sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController.getSortObject = function (property) {
		if (property.sortOrder && property.sortOrder.length) {
			return new sap.ui.model.Sorter((property.sortOrder[0].Field) ? property.sortOrder[0].Field.String : "", property.sortOrder[0].Descending.Boolean);
		}
	};

	/**
	 * getSortObject takes the property object to returns the sorted object.
	 *
	 * @param { property}
	 * @returns {sorter object}
	 *
	 * @private
	 */
	sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController.updateFilterWithListBindings = function (oList, oToolbarMenuButton, i18n, filterRestriction, filterBy) {
		var aFilters = [];
		bShowOnlySelected = !bShowOnlySelected;
		if (bShowOnlySelected) {
			oToolbarMenuButton.setTooltip(i18n.getResourceBundle().getText("VIS_VALUEHELP_DROPDOWN_VIEW_ALL"));
			oToolbarMenuButton.setEnabled(true);
			if (filterRestriction === 'multiple') {
				for (var i = 0; i < oUpdatedDimensionFilter.items.length; i++) {
					var filter = new Filter(filterBy, sap.ui.model.FilterOperator.EQ, (filterRestriction === "multiple") ? oUpdatedDimensionFilter.items[i].key : oUpdatedDimensionFilter);
					aFilters.push(filter);
				}
			} else if (filterRestriction === 'single') {
				var filter = new Filter(filterBy, sap.ui.model.FilterOperator.EQ, oUpdatedDimensionFilter);
				aFilters.push(filter);
			}
			oList.getBinding("items").filter(aFilters);
		} else {
			oToolbarMenuButton.setEnabled((oUpdatedDimensionFilter && oUpdatedDimensionFilter.hasOwnProperty("items")) ? Boolean(oUpdatedDimensionFilter.items.length) : Boolean(oUpdatedDimensionFilter));
			oList.getBinding("items").filter(aFilters);
		}
	};
	/**
	 * standardListItemTemplateDescriptionFormatter takes measureFeild & unitFeild.
	 *
	 * @param { measureFeild, unitFeild}
	 * @returns {fomatter value of measureFeild & unitfeild}
	 *
	 * @private
	 */
	sap.suite.ui.generic.template.AnalyticalListPage.controller.DropDownController.standardListItemTemplateDescriptionFormatter = function(oMeasureFeild, sUnitField) {
		if (sUnitField) {
			return "{" + oMeasureFeild + "}" + " " + "{" + sUnitField + "}";
		} else {
			return "{" + oMeasureFeild + "}";
		}
	};

	return DropDownController;

});