/* eslint-disable strict */

/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides BaseController
sap.ui.define([
	'sap/ui/base/ManagedObject', './Util'
], function(ManagedObject, Util) {
	"use strict";

	/**
	 * The BaseController is a base class for personalization Controller like e.g. FilterController, SortController etc. *
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class An abstract class for personalization Controllers.
	 * @extends sap.ui.base.ManagedObject
	 * @author SAP SE
	 * @version 1.25.0-SNAPSHOT *
	 * @constructor
	 * @private
	 * @since 1.28.0
	 * @alias sap.ui.comp.personalization.BaseController
	 */
	var BaseController = ManagedObject.extend("sap.ui.comp.personalization.BaseController",
	/** @lends sap.ui.comp.personalization.BaseController */
	{
		metadata: {
			"abstract": true,
			library: "sap.ui.comp",
			properties: {
				/**
				 * Controller type for generic use. Due to extensibility reason the type of "type" property should be "string". So it is feasible to
				 * add a custom controller without expanding the type.
				 */
				type: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},
				/**
				 * Controller model. Each controller has its own name space as part of the entire model.
				 */
				model: {
					type: "sap.ui.model.json.JSONModel",
					group: "Misc",
					defaultValue: null
				},
				/**
				 * Stores the restore data.
				 */
				persistentDataRestore: {
					type: "object",
					group: "Misc",
					defaultValue: null,
					visibility: "hidden"
				},
				/**
				 * @since 1.32.0
				 */
				ignoreColumnKeys: {
					type: "object",
					group: "Misc",
					defaultValue: []
				},
				columnHelper: {
					type: "sap.ui.comp.personalization.ColumnHelper",
					defaultValue: null
				}
			},
			associations: {
				/**
				 * Table for which settings are applied.
				 */
				table: {
					type: "sap.ui.core.Control",
					multiple: false
				}
			},
			events: {
				/**
				 * Event is raised before potential change on table will be applied.
				 */
				beforePotentialTableChange: {},
				/**
				 * Event is raised after potential change on table has be applied.
				 */
				afterPotentialTableChange: {}
			}
		}
	});

	/**
	 * Initialization hook.
	 *
	 * @private
	 */
	BaseController.prototype.init = function() {
		this._aColumnKeys = [];
	};

	/**
	 * Load data - used for lazy loading
	 *
	 * @protected
	 * @returns {function} to set the model data
	 */
	BaseController.prototype.setModelFunction = function() {
		var that = this;
		return function() {
			if (!this.getModel("$sapmP13nPanel")) {
				this.setModel(that.getModel("$sapuicomppersonalizationBaseController"), "$sapmP13nPanel");
			}
		};
	};

	/**
	 * Getter for association <code>table</code>
	 *
	 * @returns {object} that represents sap.m.Table || sap.ui.table.Table
	 * @protected
	 */
	BaseController.prototype.getTable = function() {
		var oTable = this.getAssociation("table");
		if (typeof oTable === "string") {
			oTable = sap.ui.getCore().byId(oTable);
		}
		return oTable;
	};

	/**
	 * Creates persistent object
	 *
	 * @param {array} aItems is a list of items that will be placed in the new created persistent structure
	 * @returns {object} JSON object
	 * @protected
	 */
	BaseController.prototype.createPersistentStructure = function(aItems) {
		aItems = aItems || [];
		var oPersistentData = {};
		oPersistentData[this.getType()] = {};
		oPersistentData[this.getType()][this.getItemType()] = aItems;
		return oPersistentData;
	};

	/**
	 * Creates transient object
	 *
	 * @param {array} aItems is a list of items that will be placed in the new created transient structure
	 * @returns {object} JSON object
	 * @protected
	 */
	BaseController.prototype.createTransientStructure = function(aItems) {
		aItems = aItems || [];
		var oTransientData = {};
		oTransientData[this.getType()] = {};
		oTransientData[this.getType()].items = aItems;
		return oTransientData;
	};

	BaseController.prototype.getItemType = function() {
		return this.getType() + "Items";
	};

	/**
	 * Getter of persistent data object
	 *
	 * @returns {object} JSON object
	 * @protected
	 */
	BaseController.prototype.getPersistentData = function() {
		var oData = this.getModel("$sapuicomppersonalizationBaseController").getData();
		var oPersistentData = {};
		if (!oData.persistentData[this.getType()]) {
			oPersistentData = this.createPersistentStructure();
		} else {
			oPersistentData[this.getType()] = oData.persistentData[this.getType()];
		}
		return oPersistentData;
	};

	/**
	 * Setter of persistent data object *
	 *
	 * @param {object} oDataNew contains the new data that will be set into model persistentData
	 * @protected
	 */
	BaseController.prototype.setPersistentData = function(oDataNew) {
		var oData = this.getModel("$sapuicomppersonalizationBaseController").getData();
		oData.persistentData[this.getType()] = oDataNew[this.getType()];
	};

	/**
	 * Getter of persistent items data object
	 *
	 * @returns {object} JSON object
	 * @protected
	 */
	BaseController.prototype.getPersistentDataItems = function() {
		return this.getPersistentData()[this.getType()][this.getItemType()];
	};

	/**
	 * Getter of transient data object
	 *
	 * @returns {object} JSON object
	 * @protected
	 */
	BaseController.prototype.getTransientData = function() {
		var oData = this.getModel("$sapuicomppersonalizationBaseController").getData();
		var oTransientData = {};
		if (!oData.transientData[this.getType()]) {
			oTransientData = this.createTransientStructure();
		} else {
			oTransientData[this.getType()] = oData.transientData[this.getType()];
		}
		return oTransientData;
	};

	/**
	 * Setter of transient data object
	 *
	 * @param {object} oDataNew contains the new data that will be set into model transientData
	 * @protected
	 */
	BaseController.prototype.setTransientData = function(oDataNew) {
		var oData = this.getModel("$sapuicomppersonalizationBaseController").getData();
		oData.transientData[this.getType()] = oDataNew[this.getType()];
	};

	/**
	 * Initialization of model
	 *
	 * @param {object} oModel of type sap.ui.model.json.JSONModel that will be used for initialization
	 */
	BaseController.prototype.initializeModel = function(oModel) {
		this.setModel(oModel, "$sapuicomppersonalizationBaseController");
		this.setTransientData(this.getTransientData());
		this.setPersistentData(this.getPersistentData());
	};

	BaseController.prototype.getColumnMap = function(bOnlyValid) {
		return bOnlyValid ? this.getColumnHelper().getColumnMapOfValidColumnKeys(this.getType(), this.getIgnoreColumnKeys()) : this.getColumnHelper().getColumnMap();
	};

	BaseController.prototype.createTableRestoreJson = function(aColumnKeys) {
		this._aColumnKeys = aColumnKeys;
		// TODO: this is not correct but the best we can do - problem is that the order in which we sort is not extractable from the table instance.
		// Consider to log error if more that one sort criteria
		this.setProperty("persistentDataRestore", this._getTable2JsonRestore(aColumnKeys));
	};

	BaseController.prototype.getTableRestoreJson = function() {
		return Util.copy(this.getProperty("persistentDataRestore"));
	};

	/**
	 * only keep a columnItem if key is available in table
	 */
	BaseController.prototype.reducePersistentModel = function() {
		var oTable = this.getTable();
		if (!oTable) {
			return;
		}

		var aItemsReduced = [];
		var oPersistentData = this.getPersistentData();
		oPersistentData[this.getType()][this.getItemType()].forEach(function(oItem) {
			if (this._aColumnKeys.indexOf(oItem.columnKey) > -1) {
				aItemsReduced.push(oItem);
			}
		}, this);
		oPersistentData[this.getType()][this.getItemType()] = aItemsReduced;
		this.setPersistentData(oPersistentData);
	};

	/**
	 * this method will make a complete json snapshot of the current table instance ("original") from the perspective of the columns controller; the
	 * json snapshot can later be applied to any table instance to recover all columns related infos of the "original" table TODO: This really only
	 * works for when max 1 sort criteria is defined since otherwise potentially order of sort criteria is destroyed
	 */
	BaseController.prototype._getTable2Json = function() {
	};

	BaseController.prototype._getTable2JsonRestore = function(aColumnKeys) {
		return this._getTable2Json();
	};

	BaseController.prototype.syncTable2PersistentModel = function() {
		// first put table representation into persistentData - full json representation
		// NOTE: This really only works for when max 1 sort criteria is defined since otherwise potentially order of sort
		// criteria is destroyed
		this.setPersistentData(this._getTable2Json());

		// NOTE: we leave persistentData in this form though for persistence we have too much data (compared to what we need to persist); reason is
		// that we wish to expose this data in the UI.
	};

	BaseController.prototype.syncTable2TransientModel = function() {
	};

	BaseController.prototype.getPanel = function() {
	};

	/**
	 * hook to apply made changes. The "oPayload" object can be used by subclasses.
	 *
	 * @param {object} oPayload is an object that contains additional data, which can be filled by the connected panels
	 */
	BaseController.prototype.onAfterSubmit = function(oPayload) {
		this.syncJsonModel2Table(this.getModel("$sapuicomppersonalizationBaseController").getData().persistentData);
	};

	/**
	 * This method is called from Controller after Reset button was executed. This method is a base implementation and it is optional to re-implement
	 * it in the specific sub-controller
	 *
	 * @param {object} oPayload is an object that contains additional data, which can be filled by the connected panels
	 */
	BaseController.prototype.onAfterReset = function(oPayload) {
	};

	BaseController.prototype.syncJsonModel2Table = function(oJsonModel) {
	};

	/**
	 * Operations on sorting are processed sometime directly at the table and sometime not. In case that something has been changed via
	 * Personalization Dialog the consumer of the Personalization Dialog has to apply sorting at the table. In case that sorting has been changed via
	 * user interaction at table, the change is instantly applied at the table.
	 *
	 * @param {object} oPersistentDataBase JSON object
	 * @param {object} oPersistentDataCompare JSON object
	 */
	BaseController.prototype.getChangeType = function(oPersistentDataBase, oPersistentDataCompare) {
	};

	/**
	 * Result is XOR based difference = oPersistentDataBase - oPersistentDataCompare
	 *
	 * @param {object} oPersistentDataBase JSON object.
	 * @param {object} oPersistentDataCompare JSON object. Note: if sortItems is [] then it means that all sortItems have been deleted
	 */
	BaseController.prototype.getChangeData = function(oPersistentDataBase, oPersistentDataCompare) {
	};

	/**
	 * @param {object} oPersistentDataBase: JSON object to which different properties from JSON oPersistentDataCompare are added
	 * @param {object} oPersistentDataCompare: JSON object from where the different properties are added to oPersistentDataBase. Note: if sortItems is []
	 *        then it means that all sortItems have been deleted
	 * @returns {object} Copied union data
	 */
	BaseController.prototype.getUnionData = function(oPersistentDataBase, oPersistentDataCompare) {
	};

	BaseController.prototype.determineNeededColumnKeys = function(oPersistentData) {
		var oResult = {};
		oResult[this.getType()] = [];

		if (!oPersistentData || !oPersistentData[this.getType()] || !oPersistentData[this.getType()][this.getItemType()]) {
			return oResult;
		}
		oPersistentData[this.getType()][this.getItemType()].forEach(function(oModelColumn) {
			oResult[this.getType()].push(oModelColumn.columnKey);
		}, this);
		return oResult;
	};

	/**
	 * Cleans up before destruction.
	 *
	 * @private
	 */
	BaseController.prototype.exit = function() {
		this._aColumnKeys = null;
	};

	/* eslint-enable strict */

	return BaseController;

}, /* bExport= */true);
