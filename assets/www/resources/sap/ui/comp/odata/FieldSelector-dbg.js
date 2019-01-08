/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides control sap.ui.comp.odata.FieldSelector.
sap.ui.define(['jquery.sap.global', 'sap/ui/comp/library', 'sap/ui/core/Control', './FieldSelectorController'],
	function(jQuery, library, Control, FieldController) {
	"use strict";



/**
 * Constructor for a new odata/FieldSelector.
 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * Reuse control which displays the properties of OData entity sets.
 * @extends sap.ui.core.Control
 *
 * @constructor
 * @public
	 * @alias sap.ui.comp.odata.FieldSelector
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
	var FieldSelector = Control.extend("sap.ui.comp.odata.FieldSelector", /** @lends sap.ui.comp.odata.FieldSelector.prototype */ { metadata : {

	library : "sap.ui.comp",
	properties : {

		/**
		 * Indicates to show a search bar for property names inside a selected entity set.
		 */
		showSearchBar : {type : "boolean", group : "Misc", defaultValue : true}
	},
	aggregations : {

		/**
		 * Content of the control itself
		 */
		content : {type : "sap.ui.core.Control", multiple : false}
	},
	events : {

		/**
		 * User selected a different field.
		 */
		fieldSelectionChanged : {}
	}
}});

	FieldSelector._tooltipBinding = {
		parts: [
			{path: "com.sap.vocabularies.Common.v1.QuickInfo"},
			{path: "com.sap.vocabularies.Common.v1.Label"}
		],
		formatter: function tooltipFormatter(oQuickInfo, oLabel){
			if (oQuickInfo && oQuickInfo.String){
				return oQuickInfo.String;
			}

			if (oLabel && oLabel.String){
				return oLabel.String;
			}

			return '';
		}
	};


/**
 * Returns a map with the name of the entity set and the key of the selected field.
 *
 * @name sap.ui.comp.odata.FieldSelector#getSelectedField
 * @function
 * @type object
 * @public
 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
 */

	FieldSelector.prototype.init = function() {


	// do something for initialization...
	jQuery.sap.require("sap.m.HBox");
	jQuery.sap.require("sap.m.VBox");
	jQuery.sap.require("sap.m.FlexItemData");
	jQuery.sap.require("sap.m.FlexDirection");
	jQuery.sap.require("sap.m.FlexAlignSelf");
	jQuery.sap.require("sap.m.FlexAlignItems");
	jQuery.sap.require("sap.ui.core.ResizeHandler");
	jQuery.sap.require("sap.ui.comp.odata.FieldSelectorModelConverter");
	jQuery.sap.require("sap.m.Label");
	jQuery.sap.require("sap.ui.fl.fieldExt.Access");

	this._fieldNameText = sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("ODATA_FIELD_SEL_NAME");
	this._fieldTypeText = sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("ODATA_FIELD_SEL_TYPE");
	this._fieldLabelText = sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("ODATA_FIELD_SEL_LABEL");
	this._entityTypeText = sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("ODATA_FIELD_SEL_HEADER");
	this._createNewFieldText = sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("ODATA_CREATE_NEW_FIELD");

	this._oFieldController = new FieldController();
	this._sSelectedKey = undefined;
	this._oTable = undefined;
	this._oSearchField = undefined;
	this._oConverter = undefined;
	this._oCreateButton = undefined;
	this._bDisplayFieldExtButton = undefined;
	this._oCurrentFieldExtInfo = undefined;
	this._oScrollView = new sap.m.ScrollContainer();
	this._oTable = new sap.m.Table();
	this._oHeaderLayout = undefined;

	var smartFormDialog = sap.ui.getCore().byId("smartFormPersDialog");
	if (smartFormDialog) {
		this._oResizeDialogHandlerId = sap.ui.core.ResizeHandler.register(smartFormDialog, this._handleResizeDialog.bind(this));
	}
	if (this._oScrollView) {
		this._oResizeScrollViewHandlerId = sap.ui.core.ResizeHandler.register(this._oScrollView, this._handleResizeTable.bind(this));
	}

};

	FieldSelector.prototype._handleResizeDialog = function() {
	if (this._oScrollView) {
		var height = jQuery("#smartFormPersDialog-cont").height();
		var headerHeight = jQuery("#smartFormPersDialogFieldSelectorHeader").height();
		var headerSearchHeight = jQuery("#sapUiCompFieldSelectorHeaderSearch").height();
		var tableHeaderHeight = jQuery("#sapUiCompFieldSelectorTable-tblHeader").height();
		this._oScrollView.setHeight(height - headerHeight - headerSearchHeight - tableHeaderHeight + "px");
	}
};

	FieldSelector.prototype._handleResizeTable = function() {
	if (this._oScrollView) {
		var width = this._oScrollView.$("scroll").innerWidth();
		this._oTable.setWidth(width + "px");
	}
};

/**
 * Set the model for the entity and fields of an odata service
 *
 * @param {sap.ui.model.odata.ODataModel} oModel - odata model
 * @param {string} sEntityTypes - entity type name(s) separated by comma character or array
 * @param {boolean} bShowExtFieldButton - indicates if the create new field button will be displayed or not
 * @param {Array} aIgnoredFields - List of fields which should be ignored
 * @param {Object.<bindingPath:string, fieldListElement:Object>} mBindingPathToFieldListElement - Map absolute odata binding paths to the field list elements
 * @param {Object.<id:string, fieldListElement:Object>} mIdToFieldListElement - Map field list element ids to the field list elements
 * @public
 */
	FieldSelector.prototype.setModel = function(oModel, sEntityTypes, bShowExtFieldButton, aIgnoredFields, mBindingPathToFieldListElement, mIdToFieldListElement) {

	this._bDisplayFieldExtButton = bShowExtFieldButton;

	if (!oModel) {
		jQuery.sap.log.error("oModel has to be set otherwise nothing will be displayed");
	}
	if (!sEntityTypes) {
		jQuery.sap.log.error("sEntityTypes has to be set otherwise nothing will be displayed");
	}
	this._oFieldController.init(oModel, sEntityTypes, aIgnoredFields, mBindingPathToFieldListElement, mIdToFieldListElement);
	this._constructLayout();
	this._updateCreateButtonState();
};

/**
 * Returns a map with the name of the entity set and the key of the selected field.
 *
 * @public
 * @returns {object} map of the name of the entity set having the selected field as kex
 */
FieldSelector.prototype.getSelectedField = function() {

	var oResult = {
		entityType: this._sSelectedKey
	};
	var oSelectedRow = this._oTable.getSelectedItem();
	if (oSelectedRow) {
		var oSelectedRowBindingContext = oSelectedRow.getBindingContext();
		if (oSelectedRowBindingContext){
			var oRowData = oSelectedRowBindingContext.getProperty();
			if (oRowData){
				oResult.field = oRowData.fieldLabel;
				oResult.name = oRowData.name;
				oResult.entityName = oRowData.entityName;
				oResult.entitySet = this._oFieldController.getMetaDataAnalyzer().getEntitySetNameFromEntityTypeName(oResult.entityType);
				oResult.path = oRowData.name;
				oResult.isBoundToODataService = oRowData.id === undefined;
				if (!oResult.isBoundToODataService) {
					oResult.id = oRowData.id;
				} else {
					// a complextype can be identified, if the entitytype of the fieldselector dropdown (oResult.entityType)
					// does not match with the entityName of the user selected OData-field (oRowData).
					if (oResult.entityType !== oRowData.entityName){
						var sPropertyNameOfCmplxField = this._oFieldController.getMetaDataAnalyzer()._getNameOfPropertyUsingComplexType(oResult.entityType, oRowData.entityName);
						if (sPropertyNameOfCmplxField){
							oResult.path = sPropertyNameOfCmplxField + "/" + oRowData.name;
						} else {
							jQuery.sap.log.error("FieldSelector: Property of complex type " + oRowData.name + " not found on entityType " + oResult.entityType);
						}
					}
				}
			}
		}
	}
	return oResult;
};

/**
 * Based on the renamed label contained in the field list,
 * the label contained in the field selector will be updated.
 *
 * @param {Object} oFieldListElement - Field list element containing all relevant properties needed for the update
 * @public
 */
FieldSelector.prototype.updateFieldLabel = function(oFieldListElement) {
	var that = this;
	var oFields = this._oFieldController.getFields();
	var bIsBoundToODataService = oFieldListElement.isBoundToODataService;
	var sNewLabel = oFieldListElement.label;

	if (bIsBoundToODataService === true) {
		var aBindingPaths = oFieldListElement.bindingPaths;
		jQuery.each(aBindingPaths, function(nBindingPathsIndex, oBindingPath) {
			var sBindingPath = oBindingPath.path;
			var nFirstSlashIndex = sBindingPath.indexOf('/');
			var sReferenceEntityName = sBindingPath.slice(0, nFirstSlashIndex);
			var sReferenceName = sBindingPath.slice(nFirstSlashIndex + 1);
			var oEntityFields = oFields[sReferenceEntityName];
			jQuery.each(oEntityFields, function(sEntityFieldsKey, oEntityField){
				if (oEntityField.name && oEntityField.name === sReferenceName) {
					oEntityField.fieldLabel = sNewLabel;
					that._oFieldController.sortFieldsForEntity(sReferenceEntityName);
					that._updateTableData();
					return; // apply label change only for corresponding entity type
				}
			});
		});
	} else if (bIsBoundToODataService === false) { // do not change in !bIsBoundToODataService, because in case of undefined logic should not be executed !
		jQuery.each(oFields, function(sFieldsKey, oEntityFields) { // apply label change for each entity type
			jQuery.each(oEntityFields, function(sEntityFieldsKey, oEntityField) {
				if (oEntityField.id && oEntityField.id === oFieldListElement.id) {
					oEntityField.fieldLabel = sNewLabel;
					that._oFieldController.sortFieldsForEntity(sFieldsKey);
				}
			});
		});
		this._updateTableData();
	}
};

/**
 * @private
 */
	FieldSelector.prototype._constructLayout = function() {
	var that = this;
	var oLayout = new sap.m.VBox({
		direction: sap.m.FlexDirection.Column
	});

	this._oHeaderLayout = new sap.m.HBox("smartFormPersDialogFieldSelectorHeader", {
		direction: sap.m.FlexDirection.Row
	});
	this._oHeaderLayout.addStyleClass("sapUiCompFieldSelectorHeader");

	this._oHeaderLayoutSearch = new sap.m.HBox({
		direction:sap.m.FlexDirection.Row
	});
	this._oHeaderLayoutSearch.addStyleClass("sapUiCompFieldSelectorHeaderSearch");

	this._oResizeHeaderHandlerId = sap.ui.core.ResizeHandler.register(this._oHeaderLayout, this._handleResizeDialog.bind(this));

	var oEntitySelectionLayout = new sap.m.HBox({
		direction: sap.m.FlexDirection.Row,
		alignItems: sap.m.FlexAlignItems.Start,
		layoutData: new sap.m.FlexItemData({
			growFactor: 2
		})
	});
	oEntitySelectionLayout.addStyleClass("sapUiCompFieldSelectorHeaderEntitySelection");

	var oHeader = new sap.m.Label({
		text: this._entityTypeText,
		layoutData: new sap.m.FlexItemData({
			order: 1,
			growFactor: 1
		})
	});
	// oHeader.addStyleClass("sapUiCompFieldSelectorHeaderText");

	var oDropDown = this._getEntityTypesRow();
	oDropDown.setLayoutData(new sap.m.FlexItemData({
		order: 2,
		growFactor: 1
	}));
	oDropDown.addStyleClass("sapUiCompFieldSelectorComboBox");

	oHeader.setLabelFor(oDropDown);
	oHeader.setVisible(oDropDown.getVisible());
	oEntitySelectionLayout.addItem(oHeader);
	oEntitySelectionLayout.addItem(oDropDown);
	this._oHeaderLayout.addItem(oEntitySelectionLayout);

	// Search field
	var oSearchField = this._getSearchRow();
	oSearchField.setLayoutData(new sap.m.FlexItemData({
		growFactor: 1
	}));
	oSearchField.addStyleClass("sapUiCompFieldSelectorHeader");
	this._oHeaderLayoutSearch.addItem(oSearchField);

	// New field button
	this._oCreateButton = new sap.m.Button({
		text: this._createNewFieldText,
		press: function(oEvent) {
			if (that._oCurrentFieldExtInfo) {
				// open field ext ui
				var oCrossAppNav = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
				var sHrefForFieldExtensionUi = (oCrossAppNav && oCrossAppNav.hrefForExternal({
					target: {
						semanticObject: "CustomField",
						action: "develop"
					},
					params: {
						businessContexts: that._oCurrentFieldExtInfo.BusinessContexts,
						serviceName: that._oCurrentFieldExtInfo.ServiceName,
						serviceVersion: that._oCurrentFieldExtInfo.ServiceVersion
					}
				}));

				window.open(sHrefForFieldExtensionUi, "_blank");
			}
		}
	});
	this._oCreateButton.addStyleClass("sapUiCompFieldSelectorCreateButton");
	this._oHeaderLayout.addItem(this._oCreateButton);

	oLayout.addItem(this._oHeaderLayout);
	oLayout.addItem(this._oHeaderLayoutSearch);
	oLayout.addItem(this._getFieldsRow());

	this.setContent(oLayout);
};

/**
 * @private
 * @returns {sap.m.ComboBox} combobox instance
 */
	FieldSelector.prototype._getEntityTypesRow = function() {

	var that = this;
	var oDropDown = new sap.m.ComboBox({
		// placeholder: this._entitySetPlaceHolderText,
		selectionChange: function(oEvent) {
			that._oSearchField.setValue("");
			that._sSelectedKey = oEvent.mParameters.selectedItem.getKey();
			that._updateTableData();
			that._updateCreateButtonState();
		},
		layoutData: new sap.m.FlexItemData({
			growFactor: 1
		})
	});

	var aEntityTypes = this._oFieldController.getEntityTypes();
	for (var i = 0; i < aEntityTypes.length; i++) {
		oDropDown.addItem(new sap.ui.core.Item({
			text: aEntityTypes[i].label,
			key: aEntityTypes[i].key
		}));
	}

	if (aEntityTypes.length > 0) {
		this._sSelectedKey = aEntityTypes[0].key;
		oDropDown.setSelectedKey(this._sSelectedKey);
	}

	if (aEntityTypes.length === 1) {
		oDropDown.setVisible(false);
	}

	return oDropDown;
};

/**
 * @returns {sap.m.SearchField} search field instance
 */
	FieldSelector.prototype._getSearchRow = function() {

	var iLiveChangeTimer = 0;
	var that = this;
	var sValue;
	this._oSearchField = new sap.m.SearchField({
		visible: this.getShowSearchBar(),
		liveChange: function(oEvent) {
			sValue = oEvent.getSource().getValue();
			var iDelay = (sValue ? 300 : 0); // no delay if value is empty

			// execute search after user stops typing for 300ms
			clearTimeout(iLiveChangeTimer);
			if (iDelay) {
				iLiveChangeTimer = setTimeout(function() {
					that._executeSearch(sValue);
				}, iDelay);
			} else {
				that._executeSearch(sValue);
			}
		},
		// execute the standard search
		search: function(oEvent) {
			sValue = oEvent.getSource().getValue();
			that._executeSearch(sValue);
		},
		layoutData: new sap.m.FlexItemData({
			growFactor: 2
		})

	});

	return this._oSearchField;
};

/**
 * @param {string} sValue : value to be search
 * @private
 */
	FieldSelector.prototype._executeSearch = function(sValue) {

	var aFilters = [];
	// search for label, search for quick info
	var oFieldLabel = new sap.ui.model.Filter("fieldLabel", sap.ui.model.FilterOperator.Contains, sValue);
	var oQuickInfoFilter = new sap.ui.model.Filter("quickInfo", sap.ui.model.FilterOperator.Contains, sValue);
	var oFilter = new sap.ui.model.Filter([
		oFieldLabel, oQuickInfoFilter
	], false);

	aFilters.push(oFilter);
	var itemsBinding = this._oTable.getBinding("items");
	itemsBinding.filter(aFilters, "Application");
};

/**
 * @private
 * @returns {sap.m.Table} table instance
 */
	FieldSelector.prototype._getFieldsRow = function() {
	// this._oScrollView.setWidth("100%");
	this._oScrollView.setVertical(true);
	this._oScrollView.addStyleClass("sapUiCompFieldSelectorScrollContainer");


	var aColumns = [
		new sap.m.Column({
			header: new sap.m.Label({
				text: this._fieldLabelText
			})
		})
	];

	this._oTable = new sap.m.Table("sapUiCompFieldSelectorTable", {
		mode: "SingleSelectMaster",
		columns: aColumns,
		selectionChange: function(e) {
			var oSelection = this.getSelectedField();
			this.fireFieldSelectionChanged(oSelection);
		}.bind(this)
	});
	this._oTable.setFixedLayout(false);

	this._updateTableData();

	this._oScrollView.addContent(this._oTable);
	this._handleResizeDialog();

	return this._oScrollView;
};

/**
 * @private
 */
FieldSelector.prototype._updateTableData = function() {

	var oModel = new sap.ui.model.json.JSONModel();
	oModel.setData({
		modelData: this._oFieldController.getFields()
	});

	var oTemplate = new sap.m.ColumnListItem({
		cells: [
			new sap.m.Text({
				text: "{fieldLabel}",
				tooltip: FieldSelector._tooltipBinding,
				wrapping: false
			})
		],
		visible: {
			path: "fieldLabel",
			formatter: function (sFieldLabel) {
				return !!sFieldLabel;
			}
		}
	});

	this._oTable.setModel(oModel);
	this._oTable.getModel().setSizeLimit(this._oFieldController.getMaxEntitySetSize() + 5);
	this._oTable.bindItems("/modelData/" + this._sSelectedKey, oTemplate);
};

/**
 * Checks the support for ext fields and sets the enabled state for the create new field button
 *
 * @private
 */
	FieldSelector.prototype._updateCreateButtonState = function() {

	if (!this._bDisplayFieldExtButton) {
		this._oCreateButton.setVisible(false);
	} else {
		var that = this;
		var oMDA = this._oFieldController.getMetaDataAnalyzer();
		that._oCreateButton.setEnabled(false); // disabled by default
		try {
			var oPromise = sap.ui.fl.fieldExt.Access.getBusinessContexts(oMDA.oModel.sServiceUrl, this._sSelectedKey);
			oPromise.done(function(oResult) {
				if (oResult) {
					if (oResult.BusinessContexts) {
						if (oResult.BusinessContexts.length > 0) {
							that._oCurrentFieldExtInfo = oResult;
							that._oCreateButton.setEnabled(true);
						}
					}
				}

			});
			oPromise.fail(function(oError) {
				that._oCreateButton.setEnabled(false);
				if (oError) {
					if (jQuery.isArray(oError.errorMessages)) {
						for (var i = 0; i < oError.errorMessages.length; i++) {
							jQuery.sap.log.error(oError.errorMessages[i].text);
						}
					}
				}
			});
		} catch (oError) {
			that._oCreateButton.setEnabled(false);
			jQuery.sap.log.error("exception occured in sap.ui.fl.fieldExt.Access.getBusinessContexts");
		}
	}

};

/**
 * Cleans up the control
 *
 * @public
 */
	FieldSelector.prototype.exit = function() {

	if (this._oResizeDialogHandlerId) {
		sap.ui.core.ResizeHandler.deregister(this._oResizeDialogHandlerId);
	}
	if (this._oResizeHeaderHandlerId) {
		sap.ui.core.ResizeHandler.deregister(this._oResizeHeaderHandlerId);
	}
	if (this._oResizeScrollViewHandlerId) {
		sap.ui.core.ResizeHandler.deregister(this._oResizeScrollViewHandlerId);
	}
	this.destroyAggregation("content");
	this._oFieldController.destroy();
	this._sSelectedKey = null;
	this._oTable = null;
	this._oScrollView = null;
	this._oSearchField = null;
	this._oHeaderLayout = null;
	if (this._oConverter && this._oConverter.destroy) {
		this._oConverter.destroy();
	}
	this._oConverter = null;
	if (this._oCreateButton) {
		if (this._oCreateButton.destroy) {
			this._oCreateButton.destroy();
		}
	}
	this._oCreateButton = null;
	this._oCurrentFieldExtInfo = null;
};


	return FieldSelector;

}, /* bExport= */ true);
