/* eslint-disable strict */

/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides Controller
sap.ui.define([
	'jquery.sap.global', 'sap/ui/base/ManagedObject', './ColumnsController', './FilterController', './GroupController', './SortController', './DimeasureController', './SelectionController', './Util', 'sap/ui/comp/library', './ChartWrapper', './SelectionWrapper', './ColumnHelper', 'sap/ui/core/MessageType', 'sap/m/P13nDialog', './Validator'
], function(jQuery, ManagedObject, ColumnsController, FilterController, GroupController, SortController, DimeasureController, SelectionController, Util, CompLibrary, ChartWrapper, SelectionWrapper, ColumnHelper, MessageType, P13nDialog, Validator) {
	"use strict";

	/**
	 * The controller represents the central communication hub with respect to personalisation. It makes sure to present the right user interface, do
	 * the necessary communication with this user interface and to provide events with which the consumer can require additional information needed,
	 * e.g. when an additional column is chosen via the user interface. It also exposes methods to set personalisation data 'from outside' and to
	 * revert to a latest clean state (with different definitions of "clean"). It is important to notice that the controller in general exposes
	 * changes as delta to a "baseline state". The "baseline state" is first and foremost the state defined via the table instance used to instantiate
	 * the controller. (We use the phrase "first and foremost" since the controller also exposes json objects which represents deltas to the last
	 * personalisation data set 'from outside' - this can be used by the consumer to handle dirty state.) This table instance, and thus the "baseline
	 * state", cannot be changed at a later point in time. As a consequence, the consumer should instantiate the controller with exactly the table
	 * instance on which she wishes the deltas to be calculated.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The personalization Controller provides capabilities in order to orchestrate the P13nDialog.
	 * @extends sap.ui.base.ManagedObject
	 * @author SAP SE
	 * @version 1.52.4
	 * @constructor
	 * @experimental This module is only for internal/experimental use!
	 * @private
	 * @since 1.26.0
	 * @alias sap.ui.comp.personalization.Controller
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var Controller = ManagedObject.extend("sap.ui.comp.personalization.Controller", /** @lends sap.ui.comp.personalization.Controller */
	{
		constructor: function(sId, mSettings) {
			ManagedObject.apply(this, arguments);
		},
		metadata: {
			publicMethods: [
				"setPersonalizationData"
			],
			properties: {

				/**
				 * For each panel type, the <code>setting</code> property can contain <code>visible</code>, <code>controller</code>,
				 * <code>payload</code> and <code>ignoreColumnKeys</code> attributes can be defined. The <code>setting</code> property is used
				 * in a black list, meaning that specific panels can be overwritten. In this example, the Group panel will not be shown, and for the
				 * Columns panel the <code>visibleItemsThreshold</code> is set to 10. The attribute <code>ignoreColumnKeys</code> provides an
				 * array of column keys which should be ignored in the Columns panel. Additionally, a new controller instance can be defined.
				 * <bold>Note</bold>: this property should be passed into constructor and is not allowed to be changed afterwards.
				 *
				 * <pre><code>
				 * {
				 * 	group: {
				 * 		visible: false,
				 * 		ignoreColumnKeys: []
				 * 	},
				 * 	columns: {
				 * 		visible: true,
				 * 		payload: {
				 * 			visibleItemsThreshold: 10
				 * 		},
				 * 		ignoreColumnKeys: [],
				 * 		controller: new sap.ui.comp.personalization.TestController(&quot;TestController&quot;)
				 * 	},
				 * 	dimeasure: {
				 * 		visible: true,
				 * 		payload: {
				 * 			availableChartTypes: [
				 * 				&quot;pie&quot;, &quot;column&quot;, &quot;line&quot;, &quot;donut&quot;
				 * 			]
				 * 		}
				 * 	},
				 * 	selection: {
				 * 		visible: true,
				 * 		payload: {
				 * 			callbackSaveChanges: function
				 * 		}
				 * 	}
				 * }
				 * </code></pre>
				 */
				setting: {
					type: "object",
					defaultValue: {}
				},
				/**
				 * The current state can be set back either to the state of initial table (ResetFull) or to the specific state of the table
				 * (ResetPartial) which has been set via <code>setPersonalizationData</code> method
				 */
				resetToInitialTableState: {
					type: "boolean",
					defaultValue: true
				},
				/**
				 * Once the <code>columnKeys</code> is passed it must contain all possible column keys. The order of the column keys is taken into account.
				 * <bold>Note</bold>: this property should be passed into constructor and is not allowed to be changed afterwards.
				 */
				columnKeys: {
					type: "string[]",
					defaultValue: []
				}
			},
			associations: {
				/**
				 * Table on which the personalization will be performed. <bold>Note</bold>: this property is mandatory and should be passed into
				 * constructor and is not allowed to be changed afterwards.
				 */
				table: {
					type: "object",
					multiple: false
				}
			},
			events: {
				/**
				 * If a table is manipulated directly, such as column move, column resize etc., this event is raised <b>before</b> the action has
				 * been finished. However, that does not mean that the table is really changed. For example, the column touched could be moved to a
				 * new position or could also be dropped at the old position.
				 */
				beforePotentialTableChange: {},
				/**
				 * If a table is manipulated directly, such as column move, column resize etc., this event is raised <b>after</b> the action has been
				 * finished. However, that does not mean that the table is really changed. For example, the column touched could be moved to a new
				 * position or could also be dropped at the old position.
				 */
				afterPotentialTableChange: {},

				/**
				 * Event is fired if the personalization model data is changed
				 */
				afterP13nModelDataChange: {
					parameters: {
						/**
						 * Reason for change
						 */
						changeReason: {
							type: "sap.ui.comp.personalization.ResetType"
						},
						/**
						 * Fragment of model data in JSON format that is relevant for persistence.
						 */
						persistentData: {
							type: "object"
						},
						/**
						 * Fragment of model data in JSON format that has been changed since last <code>afterP13nModelDataChange</code> event was
						 * raised. Consumers of the personalization dialog have to react to it in order to sort or filter the table.
						 */
						changeData: {
							type: "object"
						},
						/**
						 * Information about what has been changed since last <code>afterP13nModelDataChange</code> event was raised. Consumers of
						 * the personalization dialog have to react to it in order to sort or filter the table.
						 */
						changeType: {
							type: "sap.ui.comp.personalization.ChangeType"
						},
						/**
						 * Information about what has been changed since last variant was set. Consumers of the personalization dialog have to react
						 * to it in order to show dirty flag.
						 */
						changeTypeVariant: {
							type: "sap.ui.comp.personalization.ChangeType"
						},
						/**
						 * Information about what has been changed with respect to the restore point. This "restore point" is dependent upon
						 * resetToInitialTableState; if "true" then this restore point is equal to initial state of the table
						 * (this._oPersistentDataRestore), if "false" then the restore point is equal to the current variant
						 * (this._oPersistentDataCurrentVariant).
						 */
						changeTypeRestore: {
							type: "sap.ui.comp.personalization.ChangeType"
						}
					}
				},
				/**
				 * Event is fired in order to request columns which were not passed together with table in constructor.
				 *
				 * @since 1.38.0
				 */
				requestColumns: {
					parameters: {
						columnKeys: {
							type: "string"
						}
					}
				},
				/**
				 * Event is fired after the dialog has been closed.
				 *
				 * @since 1.46.0
				 */
				dialogAfterClose: {},

				/**
				 * Event is fired after the Restore button has been pressed and, at the same time, after it has been confirmed by pressing the OK
				 * button in the dialog.
				 *
				 * @since 1.46.0
				 */
				dialogConfirmedReset: {}
			},
			library: "sap.ui.comp"
		}
	});

	// TODO: due to performance reason: avoid bypass of oTable in case that only JSON object is available
	Controller.prototype.setTable = function(oTable) {
		if (this._bInitCalled) {
			throw "The table instance should be passed only into constructor.";
		}
		this.setAssociation("table", oTable);
		return this;
	};

	Controller.prototype.setSetting = function(oSetting) {
		if (this._bInitCalled) {
			throw "The setting instance should be passed only into constructor.";
		}
		oSetting = this.validateProperty("setting", oSetting);
		this.setProperty("setting", oSetting, true); // no rerendering
		return this;
	};

	Controller.prototype.setColumnKeys = function(aColumnKeys) {
		if (this._bInitCalled) {
			throw "The columnKeys array should be passed only into constructor.";
		}
		aColumnKeys = this.validateProperty("columnKeys", aColumnKeys);
		this.setProperty("columnKeys", aColumnKeys, true); // no rerendering
		return this;
	};

	Controller.prototype.setResetToInitialTableState = function(bResetToInitialTableState) {
		if (this._bInitCalled) {
			throw "The resetToInitialTableState property should be passed only into constructor.";
		}
		bResetToInitialTableState = this.validateProperty("resetToInitialTableState", bResetToInitialTableState);
		this.setProperty("resetToInitialTableState", bResetToInitialTableState, true); // no rerendering
		return this;
	};

	Controller.prototype._mergeSettingCurrentBy = function(oSetting) {

		if (Util.getTableType(this.getTable()) === sap.ui.comp.personalization.TableType.ChartWrapper) {
			this._oSettingCurrent = Util.copy(this._oSettingOriginalChart);
		} else if (Util.getTableType(this.getTable()) === sap.ui.comp.personalization.TableType.SelectionWrapper) {
			this._oSettingCurrent = Util.copy(this._oSettingOriginalSelection);
		} else {
			this._oSettingCurrent = Util.copy(this._oSettingOriginalTable);
		}

		for ( var type in oSetting) {
			if (oSetting[type].visible === false) {
				delete this._oSettingCurrent[type];
				continue;
			}
			if (this._oSettingCurrent[type] && this._oSettingCurrent[type].visible === true) {
				// Take over well known panels
				this._oSettingCurrent[type].controller = oSetting[type].controller ? oSetting[type].controller : this._oSettingCurrent[type].controller;
				this._oSettingCurrent[type].payload = oSetting[type].payload ? oSetting[type].payload : undefined;
				this._oSettingCurrent[type].ignoreColumnKeys = oSetting[type].ignoreColumnKeys ? oSetting[type].ignoreColumnKeys : [];
				this._oSettingCurrent[type].triggerModelChangeOnColumnInvisible = oSetting[type].triggerModelChangeOnColumnInvisible ? oSetting[type].triggerModelChangeOnColumnInvisible : undefined;
			} else {
				// Take over custom panels
				this._oSettingCurrent[type] = {
					visible: oSetting[type].visible,
					controller: oSetting[type].controller ? oSetting[type].controller : undefined,
					payload: oSetting[type].payload ? oSetting[type].payload : undefined,
					ignoreColumnKeys: oSetting[type].ignoreColumnKeys ? oSetting[type].ignoreColumnKeys : [],
					triggerModelChangeOnColumnInvisible: oSetting[type].triggerModelChangeOnColumnInvisible ? oSetting[type].triggerModelChangeOnColumnInvisible : undefined
				};
			}
		}

		this._removeUnsupportedNamespaces();
	};

	Controller.prototype._mixSetting = function(oSettingGlobal, oSetting) {
		if (!oSetting) {
			return oSettingGlobal;
		}
		for ( var type in oSetting) {
			if (oSetting[type].visible && oSettingGlobal[type] && oSettingGlobal[type].visible) {
				// Enrich controller
				oSetting[type].controller = oSettingGlobal[type].controller;
				// Payload on oSetting has higher priority then payload on oSettingGlobal
				oSetting[type].payload = oSetting[type].payload ? oSetting[type].payload : oSettingGlobal[type].payload;
			}
		}
		return oSetting;
	};

	Controller.prototype.getTable = function() {
		var oTable = this.getAssociation("table");
		if (typeof oTable === "string") {
			oTable = sap.ui.getCore().byId(oTable);
		}
		return oTable;
	};

	Controller.prototype.getModel = function() {
		return this._oModel;
	};

	/**
	 * Adds all requested columns.
	 * @param {object} oColumnKey2ColumnMap Format: {<path>: oColumn}
	 */
	Controller.prototype.addColumns = function(oColumnKey2ColumnMap) {
		// TODO: shall we check the new columns with _checkIgnoredColumnKeys()?
		// TODO: in Filter, Sort, Group und Dimeasure: reiche neu hinzugekommenen
		// Columns (addColumns) in Restore Snapshot (_getTable2JsonRestore)
		this._oColumnHelper.addColumnMap(oColumnKey2ColumnMap);
	};

	Controller.prototype.applySettings = function(mSettings) {
		ManagedObject.prototype.applySettings.apply(this, arguments);
		this._initialize();
	};

	Controller.prototype._initialize = function() {

		// Process table
		var oTable = this.getTable();
		if (!oTable) {
			throw "The table instance should be passed into constructor.";
		}
		var aColumns = oTable.getColumns();
		if (!Util.isConsistent(aColumns)) {
			throw "The table instance provided contains some inconsistences (it could be a columnKey which is not provided or a duplicate columnKey).";
		}

		// 1. Init _oSettingCurrent
		this._mergeSettingCurrentBy(this.getSetting());

		// 2. Init _oColumnHelper with at this point of time known columns
		this._oColumnHelper.addColumnsToMap(aColumns);
		var aColumnKeys = this.getProperty("columnKeys");
		if (!aColumnKeys.length) {
			aColumnKeys = this._oColumnHelper.getColumnKeysOfMap();
		}
		this.setColumnKeys(aColumnKeys);

		// 3. Check ignored column keys
		this._checkIgnoredColumnKeys(oTable, this._oColumnHelper.getVisibleColumnKeys());

		this._masterSync(Controller.SyncReason.Initialize, null, null);

		this._bInitCalled = true;
	};

	/**
	 * Initializes the personalization Controller instance after creation.
	 *
	 * @protected
	 */
	Controller.prototype.init = function() {
		var that = this;
		this._oDialog = null;
		this._oPayload = null;
		this._oPersistentDataRestore = null;
		this._oPersistentDataCurrentVariant = null;
		this._oPersistentDataAlreadyKnown = null;
		this._oPersistentDataBeforeOpen = null;
		this._oModel = null;
		this._aColumnKeysOfDateType = [];
		this._aColumnKeysOfBooleanType = [];
		this._aColumnKeysOfTimeType = [];
		this._bIsDirty = false;
		this._bInitCalled = false;
		this._bSuspend = false;
		this._bUnconfirmedResetPressed = false;

		this._oColumnHelper = new ColumnHelper({
			callbackOnSetVisible: this._onSetVisible.bind(this),
			callbackOnSetSummed: this._onSetSummed.bind(this)
		});

		// default: all panels are set to visible

		// NOTE: instantiating the sub-Controllers only when opening the dialog is
		// too late since this data could be set before this and we expect
		// sub-Controllers to handle these data
		this._oSettingOriginalTable = {
			columns: {
				controller: new ColumnsController({
					columnHelper: this._oColumnHelper,
					afterColumnsModelDataChange: function() {
						that._fireChangeEvent();
					},
					beforePotentialTableChange: function() {
						that.fireBeforePotentialTableChange();
					},
					afterPotentialTableChange: function() {
						that.fireAfterPotentialTableChange();
					}
				}),
				visible: true
			},
			sort: {
				controller: new SortController({
					columnHelper: this._oColumnHelper,
					afterSortModelDataChange: function() {
						that._fireChangeEvent();
					},
					beforePotentialTableChange: function() {
						that.fireBeforePotentialTableChange();
					},
					afterPotentialTableChange: function() {
						that.fireAfterPotentialTableChange();
					}
				}),
				visible: true
			},
			filter: {
				controller: new FilterController({
					columnHelper: this._oColumnHelper,
					afterFilterModelDataChange: function() {
						that._fireChangeEvent();
					},
					beforePotentialTableChange: function() {
						that.fireBeforePotentialTableChange();
					},
					afterPotentialTableChange: function() {
						that.fireAfterPotentialTableChange();
					}
				}),
				visible: true
			},
			group: {
				controller: new GroupController({
					columnHelper: this._oColumnHelper,
					afterGroupModelDataChange: function() {
						that._fireChangeEvent();
					},
					beforePotentialTableChange: function() {
						that.fireBeforePotentialTableChange();
					},
					afterPotentialTableChange: function() {
						that.fireAfterPotentialTableChange();
					}
				}),
				visible: true
			}
		};
		this._oSettingOriginalChart = {
			dimeasure: {
				controller: new DimeasureController({
					columnHelper: this._oColumnHelper,
					afterDimeasureModelDataChange: function() {
						that._fireChangeEvent();
					},
					beforePotentialTableChange: function() {
						that.fireBeforePotentialTableChange();
					},
					afterPotentialTableChange: function() {
						that.fireAfterPotentialTableChange();
					}
				}),
				visible: true
			},
			sort: {
				controller: new SortController({
					columnHelper: this._oColumnHelper,
					afterSortModelDataChange: function() {
						that._fireChangeEvent();
					},
					beforePotentialTableChange: function() {
						that.fireBeforePotentialTableChange();
					},
					afterPotentialTableChange: function() {
						that.fireAfterPotentialTableChange();
					}
				}),
				visible: true
			},
			filter: {
				controller: new FilterController({
					columnHelper: this._oColumnHelper,
					afterFilterModelDataChange: function() {
						that._fireChangeEvent();
					},
					beforePotentialTableChange: function() {
						that.fireBeforePotentialTableChange();
					},
					afterPotentialTableChange: function() {
						that.fireAfterPotentialTableChange();
					}
				}),
				visible: true
			}
		};
		this._oSettingOriginalSelection = {
			selection: {
				controller: new SelectionController({
					columnHelper: this._oColumnHelper,
					afterSelectionModelDataChange: function() {
						that._fireChangeEvent();
					},
					beforePotentialTableChange: function() {
						that.fireBeforePotentialTableChange();
					},
					afterPotentialTableChange: function() {
						that.fireAfterPotentialTableChange();
					}
				}),
				visible: true
			}
		};
	};

	/**
	 * Opens the personalization dialog
	 *
	 * @param {object} oSettingsForOpen contains additional settings information for opening the dialog with its panels. Settings information is used
	 *        in the manner of white list, meaning that only specified panels are considered. Example for a dialog with sort and filter panels:
	 *
	 * <pre><code>
	 * {
	 * 	contentWidth: CSSSize,
	 * 	contentHeight: CSSSize,
	 * 	styleClass: <string>,
	 * 	showReset: <boolean>,
	 * 	sort: {
	 * 		visible: true
	 * 	},
	 * 	filter: {
	 * 		visible: true
	 * 	},
	 * 	dimeasure: {
	 * 		visible: true,
	 * 		payload: {
	 * 			availableChartTypes: [
	 * 				new sap.ui.core.Item({
	 * 					key: sap.chart.ChartType.Column,
	 * 					text: 'Column'
	 * 				}), new sap.ui.core.Item({
	 * 					key: sap.chart.ChartType.Donut,
	 * 					text: 'Donut'
	 * 				})
	 * 			]
	 * 		}
	 * 	},
	 * 	selection: {
	 * 		visible: true
	 * 	}
	 * }
	 * </code></pre>
	 */
	Controller.prototype.openDialog = function(oSettingsForOpen) {

		this._suspendTable();

		var aMissingColumnKeys = this._determineMissingColumns(this.getColumnKeys());
		if (aMissingColumnKeys.length) {
			this.fireRequestColumns({
				columnKeys: aMissingColumnKeys
			});
			// We do it here and only here manually because in case of variant load, the _masterSync handles adding of columns into table anyway.
			// TODO: make just one masterSync instead of two (NewModelData + NewTableBinding)
			this._masterSync(Controller.SyncReason.NewModelData, this._getPersistentDataCopy(), null);
		}

		// we assume at this point that the binding is done !!
		this._masterSync(Controller.SyncReason.NewTableBinding, null, null);

		this._oDialog = new P13nDialog({
			stretch: sap.ui.Device.system.phone,
			showReset: (oSettingsForOpen && oSettingsForOpen.showReset !== undefined) ? oSettingsForOpen.showReset : true,
			showResetEnabled: this._bIsDirty,
			initialVisiblePanelType: this._oInitialVisiblePanelType,
			validationExecutor: this._handleDialogValidate.bind(this)
		});

		if (oSettingsForOpen && oSettingsForOpen.contentWidth) {
			this._oDialog.setContentWidth(oSettingsForOpen.contentWidth);
		}
		if (oSettingsForOpen && oSettingsForOpen.contentHeight) {
			this._oDialog.setContentHeight(oSettingsForOpen.contentHeight);
		}
		if (oSettingsForOpen && oSettingsForOpen.styleClass) {
			this._oDialog.addStyleClass(oSettingsForOpen.styleClass);
		}

		// Set compact style class if the table is compact too
		this._oDialog.toggleStyleClass("sapUiSizeCompact", !!jQuery(this.getTable().getDomRef()).closest(".sapUiSizeCompact").length);

		var oSettingForOpen = this._mixSetting(this._oSettingCurrent, oSettingsForOpen);

		var oPanels = this._callControllers(oSettingForOpen, "getPanel");
		for ( var type in oSettingForOpen) {
			if (oPanels[type]) {
				this._oDialog.addPanel(oPanels[type]);
			}
		}

		this._oPersistentDataBeforeOpen = this._getPersistentDataCopy();

		this._oDialog.attachOk(this._handleDialogOk, this);
		this._oDialog.attachCancel(this._handleDialogCancel, this);
		this._oDialog.attachReset(this._handleDialogReset, this);
		this._oDialog.attachAfterClose(this._handleDialogAfterClose, this);

		this._oDialog.open();
	};

	/**
	 * @private
	 */
	Controller.prototype._determineNeededColumnKeys = function(oPersistentData) {
		var oNeededColumnKeys = this._callControllers(this._oSettingCurrent, "determineNeededColumnKeys", oPersistentData);
		return Util.getUnionOfColumnKeys(oNeededColumnKeys);
	};

	/**
	 * @private
	 */
	Controller.prototype._determineMissingColumns = function(aNeededColumnKeys) {
		if (!aNeededColumnKeys.length) {
			return [];
		}
		var aMissingColumnKeys = [];
		var aTableColumnKeys = this._oColumnHelper.getColumnKeysOfMap();
		aNeededColumnKeys.forEach(function(sColumnKey) {
			if (aTableColumnKeys.indexOf(sColumnKey) < 0) {
				aMissingColumnKeys.push(sColumnKey);
			}
		});
		return aMissingColumnKeys;
	};

	/**
	 * @private
	 */
	Controller.prototype._getSettingOfPanels = function() {
		if (!this._oDialog || !this._oDialog.getPanels()) {
			return {};
		}
		var oSetting = {};
		this._oDialog.getPanels().forEach(function(oPanel) {
			var sType = oPanel.getType();
			oSetting[sType] = {
				controller: this._oSettingCurrent[sType].controller,
				visible: this._oSettingCurrent[sType].visible,
				payload: this._oSettingCurrent[sType].payload
			};
		}, this);
		return oSetting;
	};

	/**
	 * @private
	 */
	Controller.prototype._getPersistentDataCopy = function() {
		var oPersistentData = {};
		if (this.getModel() && this.getModel().getData().persistentData) {
			oPersistentData = Util.copy(this.getModel().getData().persistentData);
		}
		return oPersistentData;
	};

	/**
	 * Returns a current snapshot of persistent data in DataSuiteFormat.
	 * @returns {Object} DataSuiteFormat
	 */
	Controller.prototype.getDataSuiteFormatSnapshot = function() {
		var oDataSuiteFormat = {};
		this._callControllers(this._oSettingCurrent, "getDataSuiteFormatSnapshot", oDataSuiteFormat);
		return oDataSuiteFormat;
	};

	/**
	 * Replaces the current snapshot with the persistent data represented in Data Suite Format <code>oDataSuiteFormat</code>. The <code>oPersistentDataVariant</code> defines the base line of restore.
	 * @param {object} oDataSuiteFormat
	 * @param {object} oPersistentDataVariant
	 */
	Controller.prototype.setDataSuiteFormatSnapshot = function(oDataSuiteFormat, oPersistentDataVariant) {
		if (!this._sanityCheck(oPersistentDataVariant)) {
			return;
		}

		var oPersistentData = this._callControllers(this._oSettingCurrent, "_getDataSuiteFormat2Json", oDataSuiteFormat);
		var aMissingColumns1 = this._determineNeededColumnKeys(oPersistentData);
		var aMissingColumns2 = this._determineNeededColumnKeys(oPersistentDataVariant);
		var aMissingColumns = jQuery.extend(true, {}, aMissingColumns1, aMissingColumns2);
		aMissingColumns = Util.getUnionOfColumnKeys(aMissingColumns);

		var aMissingColumnKeys = this._determineMissingColumns(aMissingColumns);
		if (aMissingColumnKeys.length) {
			this.fireRequestColumns({
				columnKeys: aMissingColumnKeys
			});
		}

		this._suspendTable();
		this._masterSync(Controller.SyncReason.NewModelDataMixedWithVariant, oPersistentData, oPersistentDataVariant);
		this._fireChangeEvent();
		this._resumeTable(true);
	};

	/**
	 * Setter for personalization model. Note: for data of type Date the object instance is expected and not string representation.
	 *
	 * @param{object} oNewPersistentData Contains personalization data that is taken over into the model
	 */
	Controller.prototype.setPersonalizationData = function(oNewPersistentData) {
		if (!this._sanityCheck(oNewPersistentData)) {
			return;
		}

		var aMissingColumnKeys = this._determineMissingColumns(this._determineNeededColumnKeys(oNewPersistentData));
		if (aMissingColumnKeys.length) {
			this.fireRequestColumns({
				columnKeys: aMissingColumnKeys
			});
		}

		this._suspendTable();
		this._masterSync(Controller.SyncReason.NewModelDataVariant, oNewPersistentData, null);

		this._resumeTable(true);
		this._fireChangeEvent();

		// The variable "this._oPersistentDataAlreadyKnown" is already set up-to-date in _fireChangeEvent()
	};

	/**
	 * Notice that the dirty calculation and hence intrinsic restore handling is based exclusively on the property "resetToInitialTableState", the
	 * parameter sResetType is ignored !! TODO: not quite clear if there are use cases in which this (the above statement) is a problem --> maybe
	 * remove the parameter sResetType.
	 *
	 * @param {sap.ui.comp.personalization.ResetType} sResetType is optional.
	 */
	Controller.prototype.resetPersonalization = function(sResetType) {
		// TODO: compare with _handleDialogReset: make common method and parameter 'silent' 'isOpen'

		this._suspendTable();

		var bResetToInitialTableState = this.getResetToInitialTableState();
		if (sResetType === sap.ui.comp.personalization.ResetType.ResetFull || sResetType === sap.ui.comp.personalization.ResetType.ResetPartial) {
			bResetToInitialTableState = (sResetType === sap.ui.comp.personalization.ResetType.ResetFull);
		}

		if (bResetToInitialTableState) {
			this._masterSync(Controller.SyncReason.ResetModelData, null, null);
			this._fireChangeEvent(sap.ui.comp.personalization.ResetType.ResetFull);
		} else {
			this._masterSync(Controller.SyncReason.ResetModelDataVariant, null, null);
			this._fireChangeEvent(sap.ui.comp.personalization.ResetType.ResetPartial);
		}

		this._resumeTable(true);
		// The variable "this._oPersistentDataAlreadyKnown" is already set up-to-date in _fireChangeEvent()
	};

	/**
	 * Handles the dialog "reset" event.
	 *
	 * @param {object} oEvent is of type sap.ui.base.Event and contains information about source object where event was raised
	 */
	Controller.prototype._handleDialogReset = function(oEvent) {

		this._suspendTable();

		this._bUnconfirmedResetPressed = true;

		if (this.getResetToInitialTableState()) {
			this._masterSync(Controller.SyncReason.ResetModelData, null, null);
		} else {
			this._masterSync(Controller.SyncReason.ResetModelDataVariant, null, null);
		}

		var relevantControllers = this._getSettingOfPanels();
		this._callControllers(relevantControllers, "onAfterReset", oEvent.getParameter("payload"));

		this._resumeTable(true);
		// Note: do not fire event since triggering reset does not mean that this reset will be actually submitted.
		// Could even consider to hold back _masterSync
	};

	/**
	 * Handle the dialog "close" event
	 *
	 * @param {object} oEvent is of type sap.ui.base.Event and contains information about source object where event was raised
	 */
	Controller.prototype._handleDialogCancel = function(oEvent) {

		this._oDialog.detachCancel(this._handleDialogCancel, this);

		this._oDialog.close();
	};

	/**
	 * Handle the dialog "ok" event
	 *
	 * @param {object} oEvent is of type sap.ui.base.Event and contains information about source object where event was raised
	 */
	Controller.prototype._handleDialogOk = function(oEvent) {

		this._oDialog.detachOk(this._handleDialogOk, this);

		if (this._bUnconfirmedResetPressed) {
			this.fireDialogConfirmedReset();
		}

		// TODO: consider to improve this ! Perhaps better to transport payload as custom data on dialog though then we must potentially take more
		// care about life cycle of the dialog
		this._oPayload = {
			trigger: "ok",
			payload: oEvent.getParameter("payload")
		};

		this._oDialog.close();
	};

	Controller.prototype._handleDialogAfterClose = function() {
		var that = this;
		var _oPayload = this._oPayload;

		// Store the latest open panel
		this._oInitialVisiblePanelType = this._oDialog.getVisiblePanel() ? this._oDialog.getVisiblePanel().getType() : this._getInitialVisiblePanelType();

		// Initialize '_bUnconfirmedResetPressed'
		this._bUnconfirmedResetPressed = false;

		if (_oPayload && _oPayload.trigger === "ok") {
			setTimeout(function() {
				var oSettingOfVisiblePanels = that._getSettingOfPanels();
				if (that._oDialog) {
					that._oDialog.destroy();
					that._oDialog = null;
				}

				that._callControllers(oSettingOfVisiblePanels, "onAfterSubmit", that._oPayload.payload);
				that._oPayload = null;
				that._fireChangeEvent();
				that._oPersistentDataBeforeOpen = null;
				that._resumeTable(true);
				that.fireDialogAfterClose();
			}, 0);

		} else {
			setTimeout(function() {
				// cancel
				if (that._oDialog) {
					that._oDialog.destroy();
					that._oDialog = null;
				}
				// call _masterSync only after dialog has been closed and destroyed, otherwise changing the model will update the
				// dialog's bindings which causes performance issues
				that._masterSync(Controller.SyncReason.NewModelData, that._oPersistentDataBeforeOpen, null);
				that._oPersistentDataBeforeOpen = null;
				// TODO: check if OK to avoid invalidation ...
				that._resumeTable(false);
				that.fireDialogAfterClose();
			}, 0);
		}
	};

	/**
	 * Handles the Validate event of the dialog.
	 *
	 * @param {object} oPayload Payload of all panels
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution containing array of objects of format: {columnKey: <string>, panelTypes: <string[]>, messageType: <string>, messageText: <string>}
	 */
	Controller.prototype._handleDialogValidate = function(oPayload) {
		var aResult = [];
		var oTable = this.getTable();
		var oSetting = this._getSettingOfPanels();
		var oColumnKey2ColumnMap = this._oColumnHelper.getColumnMap();
		var oPersistentDataTotal = this._callControllers(oSetting, "getUnionData", Util.copy(this._oPersistentDataRestore), this._getPersistentDataCopy());

		return Validator.checkGroupAndColumns(Util.getTableType(oTable), oSetting, oPayload, oColumnKey2ColumnMap, oPersistentDataTotal, aResult).then(function(aResultTotal) {
			return Validator.checkSaveChanges(Util.getTableType(oTable), oSetting, oPayload, aResultTotal).then(function(aResultTotal) {
				return aResultTotal;
			});
		});
	};

	/**
	 * Get first property of current setting object
	 *
	 * @returns {string} that represents the panel type
	 */
	Controller.prototype._getInitialVisiblePanelType = function() {
		for ( var type in this._oSettingCurrent) {
			return type;
		}
	};

	Controller.prototype._suspendTable = function() {
		if (Util.getTableBaseType(this.getTable()) === sap.ui.comp.personalization.TableType.Table) {
			this._bSuspend = true;
		}
	};

	Controller.prototype._resumeTable = function(bInvalidate) {
		// default is to invalidate table
		bInvalidate = (bInvalidate === undefined) ? true : bInvalidate;
		var oTable = this.getTable();
		if (this._bSuspend) {
			if (oTable) {
				if (bInvalidate) {
					oTable.invalidate();
				}
			}
			this._bSuspend = false;
		}
	};

	/**
	 * setSetting can be called after setTable() is called. It is recommended to avoid communicating with MiniControllers in case MiniControllers are
	 * not final yet.
	 *
	 * @param {string} sUseCase For execution of masterSync
	 * @param {object} oNewPersistentData New persistent data
	 */
	Controller.prototype._masterSync = function(sUseCase, oNewPersistentData, oNewPersistentDataVariant) {
		var type;
		var oJson;
		var oPersistentDataTotal;
		var oPersistentDataNew;

		switch (sUseCase) {

			case Controller.SyncReason.NewTableBinding:

				// this.initializeModel();

				this._callControllers(this._oSettingCurrent, "syncTable2TransientModel");
				break;

			case Controller.SyncReason.Initialize:

				this.initializeModel();
				// e.g. set up event handlers based on table instance

				this._callControllers(this._oSettingCurrent, "setTable", this.getTable());
				// Set model binding size dependent of column length in model data.
				// This is necessary as otherwise the table does show maximum 100 items.
				// We assume that filter with more than 1000 conditions is unrealistic
				this._setSizeLimit(this.getTable());

				this._callControllers(this._oSettingCurrent, "setIgnoreColumnKeys");
				this._callControllers(this._oSettingCurrent, "setTriggerModelChangeOnColumnInvisible");

				// re-build transient data to reflect 'final' state of table (TODO: lazy optimization possible, i.e. move to
				// getPanel e.g.)
				this._callControllers(this._oSettingCurrent, "syncTable2TransientModel");

				// take snapshot of table so that we can restore this state later
				this._callControllers(this._oSettingCurrent, "createTableRestoreJson", this.getColumnKeys());

				// no new persistent data was provided from outside - in this case the table instance represent the correct
				// state of persistent data which is why we update the persistent data from the table. There are limitations though,
				// since we cannot ask the table for filter and sort info e.g.
				this._callControllers(this._oSettingCurrent, "syncTable2PersistentModel");

				// Copy the current table state in order to put back in case that it is needed (aka standard variant).
				oJson = this._callControllers(this._oSettingCurrent, "getTableRestoreJson");
				this._oPersistentDataRestore = Util.copy(oJson);

				// TODO: should we check if _oPersistentDataCurrentVariant is existing first?
				this._oPersistentDataCurrentVariant = {};

				this._aColumnKeysOfDateType = [];
				this._aColumnKeysOfTimeType = [];
				this._aColumnKeysOfBooleanType = [];

				// Notice that _getPersistentDataCopy() is equal to <subController>._getTable2Json
				this._oPersistentDataAlreadyKnown = Util.copy(this._oPersistentDataRestore);

				// Reduce data to current setting in case that setSetting() is called after setTable()
				for (type in this._oPersistentDataRestore) {
					if (!this._oSettingCurrent[type]) {
						delete this._oPersistentDataRestore[type];
					}
				}
				// Reduce data to current setting in case that setSetting() is called after setTable()
				for (type in this._oPersistentDataAlreadyKnown) {
					if (!this._oSettingCurrent[type]) {
						delete this._oPersistentDataAlreadyKnown[type];
					}
				}
				// Reduce data to current setting in case that setSetting() is called after setTable()
				for (type in this._oPersistentDataCurrentVariant) {
					if (!this._oSettingCurrent[type]) {
						delete this._oPersistentDataCurrentVariant[type];
					}
				}
				break;

			case Controller.SyncReason.NewModelDataVariant:
				if (oNewPersistentData === null) {
					oNewPersistentData = {};
				}

				oPersistentDataTotal = this._callControllers(this._oSettingCurrent, "getUnionData", Util.copy(this._oPersistentDataRestore), Util.copy(oNewPersistentData));
				this.initializeModel(oPersistentDataTotal);
				this._callControllers(this._oSettingCurrent, "syncTable2TransientModel");
				this._callControllers(this._oSettingCurrent, "syncJsonModel2Table", oPersistentDataTotal);
				this._callControllers(this._oSettingCurrent, "reducePersistentModel");
				this._oPersistentDataCurrentVariant = Util.copy(oNewPersistentData);
				break;

			case Controller.SyncReason.NewModelData:
				if (oNewPersistentData === null) {
					oNewPersistentData = {};
				}
				oPersistentDataTotal = this._callControllers(this._oSettingCurrent, "getUnionData", Util.copy(this._oPersistentDataRestore), Util.copy(oNewPersistentData));
				this.initializeModel(oPersistentDataTotal);
				this._callControllers(this._oSettingCurrent, "syncTable2TransientModel");
				this._callControllers(this._oSettingCurrent, "syncJsonModel2Table", oPersistentDataTotal);
				this._callControllers(this._oSettingCurrent, "reducePersistentModel");
				break;

			case Controller.SyncReason.NewModelDataMixedWithVariant:
				if (oNewPersistentData === null) {
					oNewPersistentData = {};
				}
				if (oNewPersistentDataVariant === null) {
					oNewPersistentDataVariant = {};
				}

				oPersistentDataTotal = this._callControllers(this._oSettingCurrent, "getUnionData", Util.copy(this._oPersistentDataRestore), Util.copy(oNewPersistentData));
				this.initializeModel(oPersistentDataTotal);
				this._callControllers(this._oSettingCurrent, "syncTable2TransientModel");
				this._callControllers(this._oSettingCurrent, "syncJsonModel2Table", oPersistentDataTotal);
				this._callControllers(this._oSettingCurrent, "reducePersistentModel");
				this._oPersistentDataCurrentVariant = Util.copy(oNewPersistentDataVariant);
				break;

			case Controller.SyncReason.ResetModelData:

				oPersistentDataNew = this._projectRestoreData2PersistentModel4Panels(this._oPersistentDataRestore);
				this.initializeModel(oPersistentDataNew);

				// re-build transient data to reflect 'final' state of table (TODO: lazy optimization possible, i.e. move to
				// getPanel e.g.)
				this._callControllers(this._oSettingCurrent, "syncTable2TransientModel");

				// Note: persistentData to table is not enough since we must first revert table back to restore version - remember
				// oNewPersistentData is restore!
				this._callControllers(this._oSettingCurrent, "syncJsonModel2Table", Util.copy(oPersistentDataNew));

				this._callControllers(this._oSettingCurrent, "reducePersistentModel");

				this._oPersistentDataCurrentVariant = {};
				// Note: since the consumer in this case also want the change events, we do *not* update the
				// _oPersistentDataAlreadyKnown here
				// this._oPersistentDataAlreadyKnown = this._getPersistentDataCopy();
				break;

			case Controller.SyncReason.ResetModelDataVariant:

				// Note: when calling syncJsonModel2Table we need to ensure that we enrich _oPersistentDataCurrentVariant with the
				// _oPersistentDataRestore (think of the example in which _oPersistentDataCurrentVariant is empty then the table wouldn't be
				// changed). This comment is similar to the one for "case Controller.SyncReason.ResetModelData:".
				oPersistentDataNew = this._projectRestoreData2PersistentModel4Panels(this._oPersistentDataCurrentVariant);
				var oPersistentDataCurrentVariantTotal = this._callControllers(this._oSettingCurrent, "getUnionData", Util.copy(this._oPersistentDataRestore), Util.copy(oPersistentDataNew));
				this.initializeModel(oPersistentDataCurrentVariantTotal);

				this._callControllers(this._oSettingCurrent, "syncTable2TransientModel");

				this._callControllers(this._oSettingCurrent, "syncJsonModel2Table", oPersistentDataCurrentVariantTotal);

				this._callControllers(this._oSettingCurrent, "reducePersistentModel");

				this._oPersistentDataCurrentVariant = {};
				// Note: since the consumer in this case also want the change events, we do *not* update the
				// _oPersistentDataAlreadyKnown here
				// this._oPersistentDataAlreadyKnown = this._getPersistentDataCopy();
				break;

			default:
		}
		this.getModel().refresh();
	};

	/**
	 * @param {object} oNewPersistentData for initializing the model
	 */
	Controller.prototype.initializeModel = function(oNewPersistentData) {
		if (!this.getModel()) {
			this._oModel = new sap.ui.model.json.JSONModel();
			this._oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
		}

		var oNewPersistentDataCopy = null;
		if (oNewPersistentData) {
			oNewPersistentDataCopy = Util.copy(oNewPersistentData);
		}

		var oCurrentPersistentData = oNewPersistentDataCopy || ((this.getModel().getData() && this.getModel().getData().persistentData) ? this.getModel().getData().persistentData : {});

		// Reduce persistent data to current setting
		for ( var type in oCurrentPersistentData) {
			if (!this._oSettingCurrent[type]) {
				delete oCurrentPersistentData[type];
			}
		}

		this.getModel().setData({
			transientData: {},
			persistentData: oCurrentPersistentData
		});

		this._callControllers(this._oSettingCurrent, "initializeModel", this.getModel());
	};

	/**
	 * Fire 'afterP13nModelDataChange' event with model data and change information.
	 *
	 * @param {sap.ui.comp.personalization.ResetType} sResetType is optional. Contains the reason why it has been changed
	 */
	Controller.prototype._fireChangeEvent = function(sResetType) {
		var oChangeInformation = {};
		// relevant change for consumer, delta : (restore + persistent) - oPersistentDataAlreadyKnown

		// oPersistentDataTotal : = restore + persistent, i.e. delta = oPersistentDataTotal - oPersistentDataAlreadyKnown
		var oPersistentDataTotal = this._callControllers(this._oSettingCurrent, "getUnionData", Util.copy(this._oPersistentDataRestore), this._getPersistentDataCopy());

		var oPersistentDataAlreadyKnownCopy = Util.copy(this._oPersistentDataAlreadyKnown);
		// note that .changeType is really semantically .changeTypeAlreadyKnown
		oChangeInformation.changeType = this._callControllers(this._oSettingCurrent, "getChangeType", oPersistentDataTotal, oPersistentDataAlreadyKnownCopy);

		if (this.getResetToInitialTableState()) {
			// for resetToInitialTableState = true (note that _oPersistentDataRestore is already 'total' in the sense that it is not a delta)
			// note also that in this case oChangeInformation.changeTypeVariant is undefined !
			var oPersistentDataCurrentRestoreTotal = Util.copy(this._oPersistentDataRestore);
			oChangeInformation.changeTypeRestore = this._callControllers(this._oSettingCurrent, "getChangeType", oPersistentDataTotal, oPersistentDataCurrentRestoreTotal);
			this._bIsDirty = Util.hasChangedType(oChangeInformation.changeTypeRestore);
		} else {
			// for resetToInitialTableState = false
			var oPersistentDataCurrentVariantTotal = this._callControllers(this._oSettingCurrent, "getUnionData", Util.copy(this._oPersistentDataRestore), Util.copy(this._oPersistentDataCurrentVariant));
			oChangeInformation.changeTypeVariant = this._callControllers(this._oSettingCurrent, "getChangeType", oPersistentDataTotal, oPersistentDataCurrentVariantTotal);
			oChangeInformation.changeTypeRestore = oChangeInformation.changeTypeVariant;
			this._bIsDirty = Util.hasChangedType(oChangeInformation.changeTypeRestore);
		}

		if (!Util.hasChangedType(oChangeInformation.changeType)) {
			return;
		}

		this._aColumnKeysOfDateType = this._oColumnHelper.getColumnKeysOfType("date");
		this._aColumnKeysOfTimeType = this._oColumnHelper.getColumnKeysOfType("time");
		this._aColumnKeysOfBooleanType = this._oColumnHelper.getColumnKeysOfType("boolean");

		if (sResetType === sap.ui.comp.personalization.ResetType.ResetFull || sResetType === sap.ui.comp.personalization.ResetType.ResetPartial) {
			oChangeInformation.changeReason = sResetType;
		}

		var oChangeData = this._callControllers(this._oSettingCurrent, "getChangeData", oPersistentDataTotal, oPersistentDataAlreadyKnownCopy);
		oChangeInformation.changeData = Util.removeEmptyProperty(Util.copy(oChangeData));
		Util.recoverPersonalisationDateData(oChangeInformation.changeData, this._aColumnKeysOfDateType);
		Util.recoverPersonalisationTimeData(oChangeInformation.changeData, this._aColumnKeysOfTimeType);
		Util.recoverPersonalisationBooleanData(oChangeInformation.changeData, this._aColumnKeysOfBooleanType);

		var oPersistentDataRestoreCopy = Util.copy(this._oPersistentDataRestore);
		var oPersistentData = this._callControllers(this._oSettingCurrent, "getChangeData", oPersistentDataTotal, oPersistentDataRestoreCopy);
		oChangeInformation.persistentData = Util.removeEmptyProperty(oPersistentData);
		Util.recoverPersonalisationDateData(oChangeInformation.persistentData, this._aColumnKeysOfDateType);
		Util.recoverPersonalisationTimeData(oChangeInformation.persistentData, this._aColumnKeysOfTimeType);
		Util.recoverPersonalisationBooleanData(oChangeInformation.persistentData, this._aColumnKeysOfBooleanType);

		this.fireAfterP13nModelDataChange(oChangeInformation);

		// calculate new version of 'AlreadyKnown' by adding above calculated 'small' delta to 'AlreadyKnown'
		this._oPersistentDataAlreadyKnown = this._callControllers(this._oSettingCurrent, "getUnionData", Util.copy(this._oPersistentDataAlreadyKnown), oChangeData);
	};

	Controller.prototype._projectRestoreData2PersistentModel4Panels = function(oPersistentData) {
		if (!this._oDialog || jQuery.isEmptyObject(oPersistentData)) {
			return oPersistentData;
		}
		var oPersistentDataCopy = this._getPersistentDataCopy();
		var aPanels = this._oDialog.getPanels();
		aPanels.forEach(function(oPanel) {
			if (oPersistentData[oPanel.getType()]) {
				oPersistentDataCopy[oPanel.getType()] = Util.copy(oPersistentData[oPanel.getType()]);
			} else {
				delete oPersistentDataCopy[oPanel.getType()];
			}
		});
		return oPersistentDataCopy;
	};

	Controller.prototype._checkIgnoredColumnKeys = function(oTable, aVisibleColumnKeys) {
		if (Util.getTableType(oTable) === sap.ui.comp.personalization.TableType.ChartWrapper) {
			return;
		}
		var aIgnoredColumnKeys = Util.getUnionOfAttribute(this._oSettingCurrent, "ignoreColumnKeys");
		aIgnoredColumnKeys.some(function(sColumnKey) {
			if (aVisibleColumnKeys.indexOf(sColumnKey) > -1) {
				throw "The provided 'ignoreColumnKeys' are inconsistent. No columns specified as ignored is allowed to be visible.";
			}
		});
	};

	Controller.prototype._onSetVisible = function(bVisible, sColumnKey) {
		if (bVisible) {
			var aIgnoredColumnKeys = Util.getUnionOfAttribute(this._oSettingCurrent, "ignoreColumnKeys");
			if (aIgnoredColumnKeys.indexOf(sColumnKey) > -1) {
				throw "The provided 'ignoreColumnKeys' are inconsistent. No column specified as ignored is allowed to be visible. " + this;
			}
		}
	};

	Controller.prototype._onSetSummed = function(bIsSummed, oColumn) {
		this._oSettingCurrent.columns.controller._onColumnTotal({
			column: oColumn,
			isSummed: bIsSummed
		});
	};

	/**
	 * Special case for tables of type sap.ui.table.Table (with exception of AnalyticalTable). Currently sap.ui.table.Table does not support grouping
	 * feature as expected.
	 */
	Controller.prototype._removeUnsupportedNamespaces = function() {
		if (Util.getTableBaseType(this.getTable()) === sap.ui.comp.personalization.TableType.Table && Util.getTableType(this.getTable()) !== sap.ui.comp.personalization.TableType.AnalyticalTable) {
			delete this._oSettingCurrent.group;
		}
	};

	/**
	 * Gets arguments of corresponding type.
	 *
	 * @param {array} aArgs contains all arguments in which the search for type is done
	 * @param {string} sType is the type for which the search is done
	 * @returns {array} aResult contains the identified arguments
	 */
	Controller.prototype._getArgumentsByType = function(aArgs, sType) {
		var aResult = [], oObject = null;

		if (aArgs && aArgs.length && sType) {
			aArgs.forEach(function(oArg) {
				if (oArg && oArg[sType] && typeof oArg[sType] !== "function") {
					oObject = {};
					oObject[sType] = oArg[sType];
					aResult.push(oObject);
				} else {
					aResult.push(oArg);
				}
			});
		}

		return aResult;
	};

	/**
	 * Calls a method "sMethodName" of all controllers in generic way.
	 *
	 * @param {string} oSettings contains additional setting for execution of mini-controller methods
	 * @param {string} sMethodName that is executed in the mini-controller
	 * @returns {object} oResult contains the result of the called mini-controller method packaged into mini-controller specific namespace.
	 */
	Controller.prototype._callControllers = function(oSettings, sMethodName) {
		var type = null, oSetting = null, oController = null, aArgsPartially = null;
		var oResults = {}, aArgs = Array.prototype.slice.call(arguments, 2);

		for (type in oSettings) {
			oSetting = oController = aArgsPartially = null;

			oSetting = oSettings[type];
			oController = oSetting.controller;
			if (!oController || !oSetting.visible || !oController[sMethodName]) {
				continue;
			}
			aArgsPartially = this._getArgumentsByType(aArgs, type);
			if (sMethodName === "getPanel") {
				aArgsPartially.push(oSetting.payload);
			} else if (sMethodName === "setIgnoreColumnKeys") {
				aArgsPartially.push(oSetting.ignoreColumnKeys);
			} else if (sMethodName === "setTriggerModelChangeOnColumnInvisible") {
				aArgsPartially.push(oSetting.triggerModelChangeOnColumnInvisible);
			}
			var oResult = oController[sMethodName].apply(oController, aArgsPartially);
			if (oResult !== null && oResult !== undefined && oResult[type] !== undefined) {
				oResults[type] = oResult[type];
			} else {
				oResults[type] = oResult;
			}
		}
		return oResults;
	};

	Controller.prototype._setSizeLimit = function(oTable) {
		this.getModel().setSizeLimit(this.getTable().getColumns().length + 1000);
	};

	Controller.prototype._sanityCheck = function(oNewPersistentData) {
		// TODO: sanity check
		// Only allow the right format e.g. "sort.sortItems" but not "sort".
		// {} is also allowed i.e. all personalization data are deleted.
		// null is also allowed i.e. go back to restore
		return true;
	};

	/**
	 * Cleans up before destruction.
	 */
	Controller.prototype.exit = function() {
		var type;

		// if for some reason we exit when suspended we should put table back into resume mode
		this._resumeTable(false);

		// destroy dialog
		if (this._oDialog) {
			this._oDialog.destroy();
			this._oDialog = null;
		}

		// destroy controller
		this._callControllers(this._oSettingCurrent, "destroy");
		for (type in this._oSettingCurrent) {
			this._oSettingCurrent[type] = null;
		}
		this._oSettingCurrent = null;
		for (type in this._oSettingOriginalTable) {
			this._oSettingOriginalTable[type] = null;
		}
		this._oSettingOriginalTable = null;

		this._oSettingCurrent = null;
		for (type in this._oSettingOriginalChart) {
			this._oSettingOriginalChart[type] = null;
		}
		this._oSettingOriginalChart = null;

		// destroy model and its data
		if (this.getModel()) {
			this.getModel().destroy();
			this._oModel = null;
		}
		this._oPersistentDataRestore = null;
		this._oPersistentDataCurrentVariant = null;
		this._oPersistentDataAlreadyKnown = null;
		this._oPersistentDataBeforeOpen = null;
		this._oPayload = null;
		this._oColumnHelper = null;
	};

	Controller.SyncReason = {
		NewTable: 0,
		NewSetting: 1,
		NewTableBinding: 5,

		NewModelData: 6,
		NewModelDataVariant: 2,
		NewModelDataMixedWithVariant: 7,

		ResetModelData: 3,
		ResetModelDataVariant: 4
	};

	/* eslint-enable strict */

	return Controller;

}, /* bExport= */true);
