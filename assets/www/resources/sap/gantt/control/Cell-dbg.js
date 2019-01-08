/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/ui/core/Control", "sap/m/Label", "sap/ui/model/Context"
], function (Control, Label, Context) {
	"use strict";

	/**
	 * Creates and initializes a new Cell class.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * Cell acts as an abstract class. You can use this class to define a placeholder for your application 
	 * to provide the specific implementation. Applications can fill the cell content by using cellCallback
	 * which returns instances such as Icon, Text, or Text input.
	 * 
	 * You can also use this class to define column specific properties that are applied when rendering a list.
	 * @extends sap.ui.core.Control
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.control.Cell
	 */
	var Cell = Control.extend("sap.gantt.control.Cell",/** @lends sap.gantt.control.Cell.prototype */ {
		metadata : {
			properties : {
				/**
				 * Cell callback function that returns the specific control instance which is rendered in a table.
				 */
				cellCallback : {type : "object"},
				/**
				 * Column configuration object.
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.HierarchyColumn</code>. 
				 * Otherwise some properties you set may not function properly.
				 */
				columnConfig: {type: "object"}
			}
		}
	});

	Cell.prototype.setColumnConfig = function (oColumnConfig) {
		this.setProperty("columnConfig", oColumnConfig);
		if (oColumnConfig) {
			var aAttributes = oColumnConfig.getAttributes();
			if (aAttributes && aAttributes.length > 0) {
				this._oMapAttributes = {};
				aAttributes.forEach(function (oAttribute) {
					this._oMapAttributes[oAttribute.getObjectTypeKey()] = oAttribute.getAttribute();
				}.bind(this));
			}
		}
		return this;
	};

	/**
	 * Returns a control instance provided by cellCallback. If cellCallback does not provides the control instance, this
	 * function returns Text by default. This indicates the function is overwritten by your application.
	 * 
	 * @param {object} oColumnConfig Column configuration object
	 * @return {sap.ui.core.Control} Control instance is rendered in Table/TreeTable
	 */
	Cell.prototype.createCellContent = function (oColumnConfig) {
		var oCellCallback = this.getCellCallback();
		if (oCellCallback && oCellCallback.createCellContent) {
			return oCellCallback.createCellContent(oColumnConfig);
		}
		return new Label();
	};

	/**
	 * To be overwritten by your application. 
	 * The oContext argument is used for some binding feature and editing feature in a table.
	 * 
	 * @param {sap.ui.core.Control} oCellContent Instance of Cell content
	 * @param {sap.ui.model.Context} oContext Cell binding context
	 * @param {string} sAttributeName Key path of the property name
	 * @param {string} sObjectType Object type
	 * @param {sap.gantt.config.HierarchyColumn} oColumnConfig Column of the configuration object
	 */
	Cell.prototype.updateCellContent = function (oCellContent, oContext, sAttributeName, sObjectType, oColumnConfig) {
		var oCellCallback = this.getCellCallback();
		if (oCellCallback && oCellCallback.updateCellContent) {
			oCellCallback.updateCellContent(oCellContent, oContext, sAttributeName, sObjectType, oColumnConfig);
		} else {
			oCellContent.setText(oContext.getProperty(sAttributeName));
		}
	};

	/**
	 * Updates the table cell instance when scrolling or when SAPUI5 needs to update.
	 *
	 * This function is called by a table.
	 * oTable.updateTableContent() -> _updateBindingContext() -> _updateRowBindingContext -> _updateCellBindingContext -> oCell._updateTableCell
	 *
	 * @private
	 * @param {sap.ui.core.Control} oCell Cell control
	 * @param {sap.ui.model.Context} oContext Cell context
	 * @param {DomRef} $tdDomRef jQuery object for <TD>
	 * @param {int} iAbsoluteRowIndex Absolute row index
	 */
	Cell.prototype._updateTableCell = function (oCell, oContext, $tdDomRef, iAbsoluteRowIndex) {
		if (!oContext) {
			return;
		}
		if (!(oContext instanceof Context)) {
			oContext = oContext.context;
		}

		if (!this._oAttributeControl) {
			this._oAttributeControl = this.createCellContent(this.getColumnConfig());
		}

		this._oContext = oContext;
	
		//the  row type name, which is configured while initialize ganttchart, or ganttchartwithtable
		var sRowTypeName = this.data("rowTypeName");
		sRowTypeName = sRowTypeName ? sRowTypeName : "type";
		var sObjectType = oContext.getProperty(sRowTypeName);

		if (this._oMapAttributes) { // attribute name per object type
			this.updateCellContent(this._oAttributeControl, oContext, this._oMapAttributes[sObjectType], sObjectType, this.getColumnConfig());
		} else {// single attribute name
			this.updateCellContent(this._oAttributeControl, oContext, this.getColumnConfig().getAttribute(), sObjectType, this.getColumnConfig());
		}

		if (this.bOutput) {
			var oRM = sap.ui.getCore().createRenderManager(),
				oRenderer = this._oAttributeControl.getRenderer();

			oRenderer.render(oRM, this._oAttributeControl);
			if ($tdDomRef && $tdDomRef.length > 0) {
				oRM.flush(this.getDomRef(), false, false);
			}
			oRM.destroy();
		}
	};

	/**
	 * Creates Cell content if needed or returns Cell content if it is created.
	 * 
	 * @return {sap.ui.core.Control} Content to render in the table
	 */
	Cell.prototype.getContentToRender = function () {
		return this._oAttributeControl;
	};

	/**
	 * Provide accessibility support for control Cell
	 * 
	 * @return {object} Current accessibility state of the control.
	 * @see {sap.ui.core.Control#getAccessibilityInfo}
	 * @protected
	 */
	Cell.prototype.getAccessibilityInfo  = function () {
		var oInnerControl = this.getContentToRender();
		return oInnerControl && oInnerControl.getAccessibilityInfo ? oInnerControl.getAccessibilityInfo() : null;
	};

	return Cell;
}, true);
