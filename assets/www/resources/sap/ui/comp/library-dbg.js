/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

/**
 * Initialization Code and shared classes of library sap.ui.comp.
 */
sap.ui.define([
	'jquery.sap.global', 'sap/ui/core/Core', 'sap/ui/core/library', 'sap/m/library'
], function(jQuery, Core, library1, library2) {
	"use strict";

	/**
	 * SAPUI5 library with smart controls.<br>
	 * <b>Note:</b> The controls in this library only support OData V2 (see {@link sap.ui.model.odata.v2.ODataModel}) and default models.
	 * @namespace
	 * @name sap.ui.comp
	 * @public
	 */

	// delegate further initialization of this library to the Core
	sap.ui.getCore().initLibrary({
		name: "sap.ui.comp",
		version: "1.52.4",
		dependencies: [
			"sap.ui.core", "sap.m"
		],
		types: [
			"sap.ui.comp.smartfield.ControlProposalType", "sap.ui.comp.smartfield.ControlContextType", "sap.ui.comp.smartfield.ControlType", "sap.ui.comp.smartfield.DisplayBehaviour", "sap.ui.comp.smartfield.JSONType", "sap.ui.comp.smartfield.CriticalityRepresentationType", "sap.ui.comp.smarttable.TableType", "sap.ui.comp.smarttable.ExportType", "sap.ui.comp.smartlist.ListType", "sap.ui.comp.personalization.AggregationRole", "sap.ui.comp.personalization.ResetType", "sap.ui.comp.personalization.ChangeType", "sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation"
		],
		interfaces: [],
		controls: [
			"sap.ui.comp.filterbar.FilterBar", "sap.ui.comp.navpopover.NavigationPopover", "sap.ui.comp.navpopover.SmartLink", "sap.ui.comp.odata.FieldSelector", "sap.ui.comp.smartchart.SmartChart", "sap.ui.comp.smartfield.SmartField", "sap.ui.comp.smartfield.SmartLabel", "sap.ui.comp.smartfilterbar.SmartFilterBar", "sap.ui.comp.smartform.SmartForm", "sap.ui.comp.smartmultiedit.Field", "sap.ui.comp.smartmultiedit.Container", "sap.ui.comp.smartmicrochart.SmartAreaMicroChart", "sap.ui.comp.smartmicrochart.SmartBulletMicroChart", "sap.ui.comp.smartmicrochart.SmartRadialMicroChart", "sap.ui.comp.smartmicrochart.SmartMicroChart", "sap.ui.comp.smarttable.SmartTable", "sap.ui.comp.smartlist.SmartList", "sap.ui.comp.smartvariants.SmartVariantManagement", "sap.ui.comp.smartvariants.SmartVariantManagementUi2", "sap.ui.comp.transport.TransportDialog", "sap.ui.comp.valuehelpdialog.ValueHelpDialog", "sap.ui.comp.variants.EditableVariantItem", "sap.ui.comp.variants.VariantManagement"
		],
		elements: [
			"sap.ui.comp.filterbar.FilterGroupItem", "sap.ui.comp.filterbar.FilterItem", "sap.ui.comp.navpopover.LinkData", "sap.ui.comp.navpopover.SemanticObjectController", "sap.ui.comp.smartfield.Configuration", "sap.ui.comp.smartfield.ControlProposal", "sap.ui.comp.smartfield.ObjectStatus", "sap.ui.comp.smartfilterbar.ControlConfiguration", "sap.ui.comp.smartfilterbar.GroupConfiguration", "sap.ui.comp.smartfilterbar.SelectOption", "sap.ui.comp.smartform.Group", "sap.ui.comp.smartform.GroupElement", "sap.ui.comp.smartform.Layout", "sap.ui.comp.smartvariants.PersonalizableInfo", "sap.ui.comp.variants.VariantItem", "sap.ui.comp.navpopover.NavigationContainer"
		],
		extensions: {
			flChangeHandlers: {
				"sap.ui.comp.smartform.SmartForm": {
					"removeGroup": "sap/ui/comp/smartform/flexibility/changes/RemoveGroup",
					"addGroup": "sap/ui/comp/smartform/flexibility/changes/AddGroup",
					"moveGroups": "sap/ui/comp/smartform/flexibility/changes/MoveGroups",
					"renameField": "sap/ui/comp/smartform/flexibility/changes/RenameTitle",
					"combineFields": "sap/ui/comp/smartform/flexibility/changes/CombineFields",
					"splitField": "sap/ui/comp/smartform/flexibility/changes/SplitField",
					"moveControls": "default"
				},
				"sap.ui.comp.smartform.Group": {
					"hideControl": "default",
					"unhideControl": "default",
					"renameGroup": "sap/ui/comp/smartform/flexibility/changes/RenameGroup",
					"addField": "sap/ui/comp/smartform/flexibility/changes/AddField",
					"addFields": "sap/ui/comp/smartform/flexibility/changes/AddFields"
				},
				"sap.ui.comp.smartform.GroupElement": {
					"hideControl": "default",
					"unhideControl": "sap/ui/comp/smartform/flexibility/changes/UnhideControl",
					"renameField": "sap/ui/comp/smartform/flexibility/changes/RenameField"
				},
				"sap.ui.comp.navpopover.NavigationContainer": {
					"addLink": {
						"changeHandler": "sap/ui/comp/navpopover/flexibility/changes/AddLink",
						"layers": {
							"USER": true
						}
					},
					"removeLink": {
						"changeHandler": "sap/ui/comp/navpopover/flexibility/changes/RemoveLink",
						"layers": {
							"USER": true
						}
					}
				},
				"sap.ui.comp.smartvariants.SmartVariantManagement": {
					"addFavorite": {
						"changeHandler": "sap/ui/comp/smartvariants/flexibility/changes/addFavorite",
						"layers": {
							"USER": true
						}
					},
					"removeFavorite": {
						"changeHandler": "sap/ui/comp/smartvariants/flexibility/changes/removeFavorite",
						"layers": {
							"USER": true
						}
					}
				},
				"sap.ui.comp.smartfield.SmartField": "sap/ui/comp/smartfield/flexibility/SmartField"
			}
		}
	});

	sap.ui.comp.ANALYTICAL_PARAMETER_PREFIX = "$Parameter.";

	sap.ui.comp.STANDARD_VARIANT_NAME = "STANDARD";

	/**
	 * Determines if given <code>CustomData</code> should be inherited from <code>SmartForm</code> to the content <code>SmartField</code>
	 * controls.
	 * @param {sap.ui.core.CustomData} oCustomData <code>CustomData</code> to be checked
	 * @return {boolean} If <code>true</code> the <code>CustomData</code> should be inherited
	 * @private
	 * @function
	 */
	sap.ui.comp.smartform.inheritCostomDataToFields = function(oCustomData) {

		var aBlacklist = [
			"sap.ui.fl:AppliedChanges", "sap.ui.fl.appliedChanges", "sap-ui-custom-settings"
		];

		for (var i = 0; i < aBlacklist.length; i++) {
			if (oCustomData.getKey() == aBlacklist[i]) {
				return false;
			}
		}

		return true;

	};

	/**
	 * The available control types to configure the internal control selection of a SmartField control.
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.ui.comp.smartfield.ControlType = {

		/**
		 * The SmartField chooses the control.
		 * @public
		 */
		auto: "auto",

		/**
		 * The SmartField uses a drop down list box.
		 * @public
		 */
		dropDownList: "dropDownList",

		/**
		 * The SmartField displays an input field.
		 * @public
		 */
		input: "input",

		/**
		 * The SmartField displays a date picker.
		 * @public
		 */
		datePicker: "datePicker",

		/**
		 * The SmartField displays a check box.
		 * @public
		 */
		checkBox: "checkBox",

		/**
		 * The SmartField displays a <code>sap.m.Selection</code>.
		 * @public
		 */
		selection: "selection"
	};

	/**
	 * The different options to define display behavior for the value help of a SmartField control.
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.ui.comp.smartfield.DisplayBehaviour = {

		/**
		 * The SmartField chooses the display behavior.
		 * @public
		 */
		auto: "auto",

		/**
		 * Only the description of the available values is displayed.
		 * @public
		 */
		descriptionOnly: "descriptionOnly",

		/**
		 * Description and ID are displayed for available values.
		 * @public
		 */
		descriptionAndId: "descriptionAndId",

		/**
		 * ID and description are displayed for available values.
		 * @public
		 */
		idAndDescription: "idAndDescription",

		/**
		 * Shows the ID only.
		 * @public
		 */
		idOnly: "idOnly",

		/**
		 * Shows Boolean value as True/False
		 * @public
		 */
		TrueFalse: "TrueFalse",

		/**
		 * Shows Boolean value as On/Off
		 * @public
		 */
		OnOff: "OnOff",

		/**
		 * Shows Boolean value as Yes/No
		 * @public
		 */
		YesNo: "YesNo"

	};
	/**
	 * Enumeration of the different data types supported by the SmartField control, if it is using a JSON model.
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.ui.comp.smartfield.JSONType = {

		/**
		 * The JavaScript primary type String
		 * @public
		 */
		String: "String",

		/**
		 * The JavaScript Date Object
		 * @public
		 */
		Date: "Date",

		/**
		 * Float type
		 * @public
		 */
		Float: "Float",

		/**
		 * Integer type
		 * @public
		 */
		Integer: "Integer",

		/**
		 * Boolean Type
		 * @public
		 */
		Boolean: "Boolean",

		/**
		 * Date Time Type
		 * @public
		 */
		DateTime: "DateTime"

	};

	/**
	 * Enumeration of the different contexts supported by the SmartField, if it is using an OData model.
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.ui.comp.smartfield.ControlContextType = {
		/**
		 * No special context is selected. The Smart Field applies its internal defaults.
		 * @public
		 */
		None: "",

		/**
		 * Also the UoM layout is influenced.
		 * @public
		 */
		ResponsiveTable: "responsiveTable",

		/**
		 * Behaves currently exactly like <code>sap.ui.comp.smartfield.ControlContextType.None</code>.
		 * @public
		 */
		Form: "form",

		/**
		 * If this is selected the UoM layout is influenced.
		 * @public
		 */
		Table: "table",

		/**
		 * If this is selected the UoM layout is influenced.
		 * @public
		 */
		SmartFormGrid: "smartFormGrid"
	};

	/**
	 * Enumeration of the different control proposals supported by the Smart Field, if it is using an OData model.
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.ui.comp.smartfield.ControlProposalType = {
		/**
		 * No special context is selected. The Smart Field applies its internal defaults.
		 * @public
		 */
		None: "",

		/**
		 * If this is selected, the sap.m.ObjectNumber control is used to display units of measure. If the value property of the Smart Field is not
		 * bound to a unit of measure, the property is ignored.
		 * @public
		 */
		ObjectNumber: "ObjectNumber",

		/**
		 * If this is selected, the sap.m.ObjectIdentifier control is used to display IDs, if they are not editable. The current OData property is
		 * assumed to have a text annotation. Otherwise the configuration is ignored.
		 * @public
		 */
		ObjectIdentifier: "ObjectIdentifier"

	/**
	 * If this is selected, the sap.m.ObjectStatus control is used to display values, if they are not editable.
	 * @public
	 */
	// ObjectStatus: "ObjectStatus"
	};

	/**
	 * The different options to visualize the ObjectStatus control.
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.ui.comp.smartfield.CriticalityRepresentationType = {
		/**
		 * If this is selected, the sap.m.ObjectStatus control does not visualize the criticality using an icon.
		 * @public
		 */
		WithoutIcon: "WithoutIcon",

		/**
		 * If this is selected, the sap.m.ObjectStatus control visualizes the criticality using an icon.
		 * @public
		 */
		WithIcon: "WithIcon"
	};

	/**
	 * Provides enumeration sap.ui.comp.smarttable.TableType. A subset of table types that fit to a simple API returning one string.
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.ui.comp.smarttable.TableType = {

		/**
		 * A table (sap.ui.table.Table) control shall be created as the content of the SmartTable, if no table already exists (default)
		 * @public
		 */
		Table: "Table",

		/**
		 * A responsive table (sap.m.Table) control that can be used on mobile devices shall be created as the content of the SmartTable, if no table
		 * already exists
		 * @public
		 */
		ResponsiveTable: "ResponsiveTable",

		/**
		 * An analytical table (sap.ui.table.AnalyticalTable) control shall be created as the content of the SmartTable, if no table already exists
		 * @public
		 */
		AnalyticalTable: "AnalyticalTable",

		/**
		 * A tree table (sap.ui.table.TreeTable) control shall be created as the content of the SmartTable, if no table already exists
		 * @public
		 */
		TreeTable: "TreeTable"

	};

	/**
	 * Provides the type of services available for export in the <code>SmartTable</code> control.
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.ui.comp.smarttable.ExportType = {

		/**
		 * Gateway backend spreadsheet export service is used (default)
		 * @public
		 */
		GW: "GW",

		/**
		 * UI5 client-side spreadsheet export service is used
		 * @public
		 */
		UI5Client: "UI5Client"

	};

	/**
	 * Provides enumeration sap.ui.comp.smartlist.ListType. A subset of list types that fit to a simple API returning one string.
	 * @enum {string}
	 * @public
	 * @since 1.48
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.ui.comp.smartlist.ListType = {

		/**
		 * A list (sap.m.List) control shall be created as the content of the SmartList, if no list already exists (default)
		 * @public
		 */
		List: "List",

		/**
		 * A tree (sap.m.Tree) control shall be created as the content of the SmartList, if no list/tree already exists
		 * @public
		 */
		Tree: "Tree"
	};

	/**
	 * Provides enumeration sap.ui.comp.personalization.ResetType. A subset of reset types used in table personalization.
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.ui.comp.personalization.ResetType = {

		/**
		 * Reset back to Restore (i.e. the version of the table with which the controller was instantiated or via setter updated) was triggered
		 * (either via API or via reset button)
		 * @public
		 */
		ResetFull: "ResetFull",

		/**
		 * Reset back to the CurrentVariant was triggered
		 * @public
		 */
		ResetPartial: "ResetPartial"
	};

	/**
	 * Provides enumeration sap.ui.comp.personalization.AggregationRole. A subset of aggregation roles used in table personalization.
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.ui.comp.personalization.AggregationRole = {

		/**
		 * Dimension role.
		 * @public
		 */
		Dimension: "Dimension",

		/**
		 * Measure role.
		 * @public
		 */
		Measure: "Measure",

		/**
		 * Role which is neither dimension nor measure.
		 * @public
		 */
		NotDimeasure: "NotDimeasure"
	};

	/**
	 * Provides enumeration sap.ui.comp.personalization.ChangeType. A subset of changes done during table personalization.
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.ui.comp.personalization.ChangeType = {

		/**
		 * Not changed
		 * @public
		 */
		Unchanged: "Unchanged",

		/**
		 * Change is applied to model but not applied to table
		 * @public
		 */
		ModelChanged: "ModelChanged",

		/**
		 * Change is applied to model and to table
		 * @public
		 */
		TableChanged: "TableChanged"
	};

	/**
	 * Provides enumeration sap.ui.comp.personalization.TableType. A subset of table types that fit for table personalization.
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.ui.comp.personalization.TableType = {

		/**
		 * Represents <code>sap.m.Table</code>.
		 * @public
		 */
		ResponsiveTable: "ResponsiveTable",

		/**
		 * Represents <code>sap.ui.table.Table</code>.
		 * @public
		 */
		Table: "Table",

		/**
		 * Represents <code>sap.ui.table.AnalyticalTable</code>.
		 * @public
		 */
		AnalyticalTable: "AnalyticalTable",

		/**
		 * Represents <code>sap.ui.table.TreeTable</code>.
		 * @public
		 */
		TreeTable: "TreeTable",

		/**
		 * Represents <code>sap.ui.comp.personalization.ChartWrapper</code>.
		 * @public
		 */
		ChartWrapper: "ChartWrapper",

		/**
		 * Represents <code>sap.ui.comp.personalization.SelectionWrapper</code>.
		 * @public
		 */
		SelectionWrapper: "SelectionWrapper"
	};

	/**
	 * The available filter types to configure the internal control of a SmartFilterBar control.
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.ui.comp.smartfilterbar.FilterType = {
		/**
		 * Restrict filter based on metadata.
		 * @public
		 */
		auto: "auto",
		/**
		 * Restrict filter to a single entry.
		 * @public
		 */
		single: "single",
		/**
		 * Restrict filter to multiple entries.
		 * @public
		 */
		multiple: "multiple",
		/**
		 * Restrict filter to an interval.
		 * @public
		 */
		interval: "interval"
	};

	/**
	 * The available control types to configure the internal control selection of a SmartFilterBar control.
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.ui.comp.smartfilterbar.ControlType = {
		/**
		 * Shows field based on metadata.
		 * @public
		 */
		auto: "auto",

		/**
		 * Shows an input field.
		 * @public
		 */
		input: "input",

		/**
		 * Shows a drop down list field.
		 * @public
		 */
		dropDownList: "dropDownList",

		/**
		 * Shows a date picker field.
		 * @public
		 */
		date: "date",

		/**
		 * Shows a date time picker field.
		 * @public
		 */
		dateTimePicker: "dateTimePicker"

	};

	/**
	 * The different options to define mandatory state for fields in the SmartFilter control.
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.ui.comp.smartfilterbar.MandatoryType = {
		/**
		 * Shows values based on metadata.
		 * @public
		 */
		auto: "auto",
		/**
		 * Shows field as mandatory.
		 * @public
		 */
		mandatory: "mandatory",
		/**
		 * Shows field as not mandatory.
		 * @public
		 */
		notMandatory: "notMandatory"
	};

	/**
	 * The different options to define display behavior for fields in the SmartFilter control.
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.ui.comp.smartfilterbar.DisplayBehaviour = {
		/**
		 * Shows values based on metadata.
		 * @public
		 */
		auto: "auto",

		/**
		 * Shows only the description for values.
		 * @public
		 */
		descriptionOnly: "descriptionOnly",

		/**
		 * Shows description and then an id in values.
		 * @public
		 */
		descriptionAndId: "descriptionAndId",

		/**
		 * Shows id and then a description in values.
		 * @public
		 */
		idAndDescription: "idAndDescription",

		/**
		 * Shows only the id for values.
		 * @public
		 */
		idOnly: "idOnly"
	};

	/**
	 * The different options to define Sign for Select Options used in SmartFilter control.
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.ui.comp.smartfilterbar.SelectOptionSign = {
		/**
		 * Sign Include
		 * @public
		 */
		I: "I",
		/**
		 * Sign Include
		 * @public
		 */
		include: "I",
		/**
		 * Sign Exclude
		 * @public
		 */
		E: "E",
		/**
		 * Sign Exclude
		 * @public
		 */
		exclude: "E"
	};

	/**
	 * Type of change handler type for link personalization.
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.ui.comp.navpopover.ChangeHandlerType = {
		/**
		 * Change handler creating a change for an added link.
		 * @public
		 */
		addLink: "addLink",
		/**
		 * Change handler creating a change for a removed link.
		 * @public
		 */
		removeLink: "removeLink",
		/**
		 * Change handler creating a change for a moved link.
		 * @public
		 */
		moveLink: "moveLink"
	};

	/**
	 * Enumeration for changes for personalization of variant favorites.
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.ui.comp.smartvariants.ChangeHandlerType = {
		/**
		 * Change handler creating a change for an added favorite.
		 * @public
		 */
		addFavorite: "addFavorite",
		/**
		 * Change handler creating a change for a removed favorite.
		 * @public
		 */
		removeFavorite: "removeFavorite"
	};

	/**
	 * The range operations supported by the <code>ValueHelpDialog</code> control.
	 * @enum {string}
	 * @public
	 */
	sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation = {
		/**
		 * The Between operation for the ranges.
		 *
		 * @public
		 */
		BT: "BT",
		/**
		 * The Equals operation for the ranges.
		 *
		 * @public
		 */
		EQ: "EQ",
		/**
		 * The Contains operation for the ranges.
		 *
		 * @public
		 */
		Contains: "Contains",
		/**
		 * The StartsWith operation for the ranges.
		 *
		 * @public
		 */
		StartsWith: "StartsWith",
		/**
		 * The EndsWith operation for the ranges.
		 *
		 * @public
		 */
		EndsWith: "EndsWith",
		/**
		 * The Less operation for the ranges.
		 *
		 * @public
		 */
		LT: "LT",
		/**
		 * The Less or equals operation for the ranges.
		 *
		 * @public
		 */
		LE: "LE",
		/**
		 * The Greater operation for the ranges.
		 *
		 * @public
		 */
		GT: "GT",
		/**
		 * The Between or equals operation for the ranges.
		 *
		 * @public
		 */
		GE: "GE",
		/**
		 * The Initial operation for the ranges.
		 *
		 * @private
		 */
		Initial: "Initial"
	};
	
	return sap.ui.comp;

}, /* bExport= */true);
