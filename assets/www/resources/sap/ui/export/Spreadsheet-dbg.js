/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define(['jquery.sap.global', './library', './ExportDialog', 'sap/ui/Device'], 
	function(jQuery, library, ExportDialog, Device) {
	'use strict';

	/**
	 * Creates a new spreadsheet export object. Use this object to build and download a spreadsheet file in Office Open XML Spreadsheet format from tabular data.
	 * This functionality is normally used together with UI5 tables.
	 *
	 *
	 * <h3>Overview</h3>
	 * The class builds a spreadsheet in an Office Open XML Spreadsheet format using tabular data from a specified data source.
	 * Data is retrieved and the document is built asynchronously in a worker thread of the browser.
	 * The status of the process is visually presented to the user in a progress dialog that can be suppressed.
	 * The user can cancel the process with the Cancel button of the dialog.
	 *
	 *
	 * This class provides a low level API for spreadsheet export. The {@link sap.ui.comp.smarttable.SmartTable} control implements it internally and provides the export
	 * functionality out of the box. For special cases, please refer to details below.
	 *
	 *
	 * Optional features:
	 * <ul>
	 *   <li>Suppress the progress dialog.</li>
	 *   <li>Suppress worker and run the document generation process in a main thread.</li>
	 *   <li>Configure the exported file name.</li>
	 * </ul>
	 *
	 *
	 * <h3>Export settings object</h3>
	 * Export settings should be provided in the constructor as an <code>mSettings</code> property map with the following fields:
	 * <ul>
	 *   <li><code>workbook</code> - Spreadsheet properties object
	 *   <ul><li><code>workbook.columns</code> - Array of column configurations. Each column configuration is an object with the following fields:
	 *      <ul>
	 *         <li><code>label</code> (string) - Column header text</li>
	 *         <li><code>property</code> (string) - Field name or Array of field names in the data source feed</li>
	 *         <li><code>type</code> (string) - Optional data type of the field. See {@link sap.ui.export.EdmType} for the list of supported types.
	 *             If this property is omitted, the property is processed as a string field.</li>
	 *         <li><code>width</code> (number) - Optional width of the column in characters. There is no 1:1 correspondence between
	 *           character widths in the exported spreadsheet and CSS units.The width of one character
	 *           is approximately 0.5em in CSS units, depending on the fonts that are
	 *           used in the table and in the resulting spreadsheet. The default value is 10 characters.</li>
	 *         <li><code>textAlign</code> (string) - Horizontal alignment of cell contents. The following values of the CSS <code>text-align</code>
	 *           property are accepted: <code>[left, right, center, begin, end]</code>. If not specified, the columns are
	 *           horizontally aligned based on the property type.</li>
	 *         <li><code>scale</code> (number) - Number of digits after decimal point for numeric values</li>
	 *         <li><code>delimiter</code> (boolean) - Set to <code>true</code> to display thousands separators in numeric values.
	 *           The default value is <code>false</code>.</li>
	 *         <li><code>unit</code> (string) - Text to display as the unit of measurement or currency next to the numeric value.
	 *           It is treated as a string and has no influence on the value itself. For example, a value of 150 with the unit "%" is still 150
	 *           and not 1.5, as a user may expect.</li>
	 *         <li><code>unitProperty</code> (string) - Name of the data source field that contains the unit/currency text</li>
	 *         <li><code>displayUnit</code> (boolean) - The property applies to currency values only and defines if the currency is shown in the column.
	 *           The default value is <code>true</code>.</li>
	 *         <li><code>trueValue</code> (string) - Textual representation of a boolean type that has the value <code>true</code></li>
	 *         <li><code>falseValue</code> (string) - Textual representation of a boolean type that has the value <code>false</code></li>
	 *         <li><code>template</code> (string) - Formatting template that supports indexed placeholders within curly brackets</li>
	 *      </ul>
	 *   </ul></li>
	 *   <li><code>dataSource</code> - Source of spreadsheet data. It can be a JSON array with row data,
	 *      an URL or an OData properties object with the following fields:
	 *      <ul>
	 *         <li><code>type</code> (string) - Type of the data source. Currently, only OData is supported and the value have to be set to <code>"OData"</code>.</li>
	 *         <li><code>dataUrl</code> (string) - URL to table data on the server, including all select, filter, and search query parameters</li>
	 *         <li><code>serviceUrl</code> (string) - URL to the OData service. The parameter is required for OData batch requests.</li>
	 *         <li><code>count</code> (number) - Count of available records on the server</li>
	 *         <li><code>useBatch</code> (boolean) - Set to <code>true</code> if OData batch requests are used to fetch the spreadsheet data.
	 *            In this case, <code>serviceUrl</code> and <code>headers</code> have to be specified, too.</li>
	 *         <li><code>headers</code> (object) - Map of HTTP request header properties. They should correspond to the HTTP request headers that are
	 *            used to obtain table data for display in the browser.</li>
	 *         <li><code>sizeLimit</code> (number) - Maximal allowed number of records that can be obtained from the service in a single request</li>
	 *      </ul>
	 *   </li>
	 *   <li><code>count</code> (number) - The maximal number of records to export. If not specified, all data from the data source is fetched.</li>
	 *   <li><code>worker</code> (boolean) - Run export process in a worker thread. Set to <code>false</code> to disable worker and run export
	 *        in a main thread. This is needed, for example, if a mock server is used to provide spreadsheet data.<br>
	 *        <b>Note:</b> In case of a strict content security policy, it is not always possible to create an export worker.
	 *        In this case, export runs in a main thread disregarding the <code>worker</code> value.</li>
	 *   <li><code>fileName</code> (string) - Optional file name for the exported file. If not specified, the spreadsheet is exported as <code>export.xlsx</code>.</li>
	 *   <li><code>showProgress</code> (boolean) - Set to <code>false</code> to suppress the progress dialog</li>
	 * </ul>
	 *
	 *
	 * <h3>Usage</h3>
	 * To start export, create a new <code>sap.ui.export.Spreadsheet</code> object and call the <code>build</code> method.
	 * Column configuration, data source, and export settings must be provided in the constructor.
	 * The <code>build</code> method opens a progress dialog and starts an asynchronous export process.
	 * The export process fetches data rows from the data source, builds a spreadsheet in-browser in a worker thread, and finally downloads the document
	 * to the client.
	 *
	 *
	 * Example:
	 * <pre>
	 *   var oSpreadsheet = new sap.ui.export.Spreadsheet(mSettings);
	 *   oSpreadsheet.build();
	 * </pre>
	 *
	 *
	 * Optionally, you can attach <code>onprogress</code> event listeners to be notified about the
	 * export progress and follow the completion status of the returned <code>Promise</code>.
	 *
	 *
	 * Example:
	 * <pre>
	 *   var oSpreadsheet = new sap.ui.export.Spreadsheet(mSettings);
	 *   oSpreadsheet.onprogress = function(iValue) {
	 *     jQuery.sap.log.debug("Export: %" + iValue + " completed");
	 *   };
	 *   oSpreadsheet.build()
	 *     .then( function() { jQuery.sap.log.debug("Export is finished"); })
	 *     .catch( function(sMessage) { jQuery.sap.log.error("Export error: " + sMessage); });
	 * </pre>
	 *
	 *
	 * Example of column configuration:
	 * <pre>
	 *   var aColumns = [];
	 *   aColumns.push({
	 *     label: "Name",
	 *     property: "name"
	 *   });
	 *   aColumns.push({
	 *     label: "Salary",
	 *     property: "salary",
	 *     type: "number",
	 *     scale: 2
	 *   });
	 *   var mSettings = {
	 *     workbook: { columns: aColumns },
	 *     dataSource: mDataSource,
	 *     fileName: "salary.xlsx"
	 *   };
	 *   var oSpreadsheet = new sap.ui.export.Spreadsheet(mSettings);
	 *   oSpreadsheet.build();
	 * </pre>

	 *
	 * <h3>Limitations</h3>
	 * You can export only the primitive cell data types that are listed in {@link sap.ui.export.EdmType}. Icons, images, check boxes, and complex controls
	 * in UI5 table cells are not supported.
	 *
	 *
	 * Custom formatters in data binding are not supported.
	 *
	 *
	 * The size of an exported table is limited by available browser memory.
	 * Export of large data sets can lead to memory overflow errors.
	 * Therefore, do not use <code>sap.ui.export.Spreadsheet</code> with data tables containing more than one million table cells on desktop
	 * computers and more than 100000 cells on mobile devices. Consider a specialized export solution in such cases. For example,
	 * MS Excel® can import spreadsheets from an OData services directly, without any UI.
	 *
	 *
	 * The export process runs in a worker thread whenever possible. However, code injection to native XMLHttpRequest events
	 * is not available in the worker environment. Therefore, the <code>worker</code> parameter in export settings should be set to <code>false</code>
	 * if the application uses a mock server to fetch table data.
	 *
	 * @param {Object} mSettings - Export settings
	 * @param {Object} mSettings.workbook - Spreadsheet properties
	 * @param {string | Object} mSettings.dataSource - Source of spreadsheet data. A JSON array, data source properties map or
	 *        URL to an OData source can be provided.
	 *        For example, <code>"someUrl"</code> is an equivalent to <code>{dataUrl:"someUrl", type:"OData"}</code>.
	 * @param {number} [mSettings.count] - The maximal number of records to export
	 * @param {boolean} [mSettings.worker=true] - Run export process in a worker thread. Set to <code>false</code> to disable worker and run export
	 *        in a main thread. This is needed, for example, if a mock server is used to provide spreadsheet data.<br>
	 *        <b>Note:</b> In case of a strict content security policy, it is not always possible to create an export worker.
	 *        In this case, export runs in a main thread disregarding the <code>worker</code> value.
	 * @param {string} [mSettings.fileName="export.xlsx"] - Optional file name for the exported file
	 * @param {boolean} [mSettings.showProgress=true] - Set to <code>false</code> to suppress the progress dialog
	 *
	 * @constructor The <code>sap.ui.export.Spreadsheet</code> class allows you to export table data from a UI5 application to a spreadsheet file.
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @since 1.50
	 * @name sap.ui.export.Spreadsheet
	 * @public
	 */
	var Spreadsheet = function (mSettings) {
		this.mSettings = jQuery.extend(true, {}, mSettings);
	};


	/**
	 * Cancels a running export process. This method does nothing if no export is running.
	 *
	 * @function
	 * @name sap.ui.export.Spreadsheet#cancel
	 * @public
	 */
	Spreadsheet.prototype.cancel = function() {
		if (this.process) {
			this.process.cancel();
			this.process = null;
		}
	};


	/**
	 * Progress callback. The function is called when the progress status changes.
	 *
	 * @function
	 * @param {number} iProgress - A number between 0 and 100 indicates the export progress in percent
	 *
	 * @name sap.ui.export.Spreadsheet#onprogress
	 * @public
	 */
	Spreadsheet.prototype.onprogress = function(iProgress) {
		jQuery.sap.log.debug("Spreadsheet export: " + iProgress + "% loaded.");
	};


	/**
	 * Map of accepted EDM types in lower case.
	 *
	 * @private
	 */
	var mPrimitiveTypes = (function() {
		var result = {};
		for (var key in library.EdmType) {
			result[key.toLowerCase()] = key;
		}
		return result;
	})();

	var ERROR_MSG_PREFIX = "Spreadsheet export: ";

	/**
	 * Validates and normalizes export parameters.
	 *
	 * @function
	 * @param {Object} mParameters - Export parameters object
	 *
	 * @private
	 */
	function validateParameters(mParameters) {

		var pre = ERROR_MSG_PREFIX;
		var odata = "odata";
		var sExtension = ".xlsx";
		var count = mParameters.count || 1;
		var sourceType;

		// Exported file name
		mParameters.fileName = mParameters.fileName || 'export';
		if (!jQuery.sap.endsWith(mParameters.fileName, sExtension)) {
			mParameters.fileName += sExtension;
		}

		// Data source
		jQuery.sap.assert(mParameters.dataSource, pre + "data source is not specified.");
		var dataSource =  mParameters.dataSource;
		if (typeof dataSource === "string") {
			mParameters.dataSource = {dataUrl : dataSource, type: odata, count: count};
			mParameters.count = count;
		} else if (Array.isArray(dataSource)) {
			// Due to possible conversion of date fields, make a deep copy of the array to preserve original data
			var aData = dataSource.map(function(row) {
				return jQuery.extend(true, {}, row);
			});
			mParameters.dataSource = {data: aData, type: "array"};
		} else if (dataSource && dataSource.dataUrl) {
			sourceType = (dataSource.type || odata).toLowerCase();
			jQuery.sap.assert([odata].indexOf(sourceType) >= 0, pre + "unsupported data source type.");
			mParameters.dataSource.type = sourceType;
			if (dataSource.useBatch) {
				jQuery.sap.assert(dataSource.serviceUrl, pre + "serviceUrl is required for OData batch requests.");
				jQuery.sap.assert(dataSource.headers, pre + "model.headers is required for OData batch requests.");
			}
		}

		// Check sizeLimit
		var sizeLimit = mParameters.dataSource.sizeLimit;
		if (sourceType === odata && (!sizeLimit || isNaN(sizeLimit))) {
			sizeLimit = Math.round(count / 1000) * 200; // try to load data in 5 steps, but each step should be at least 200 rows;
			sizeLimit = Math.min(10000, Math.max(sizeLimit, 200));
			jQuery.sap.log.error(pre + "dataSource.sizeLimit is not provided. sizeLimit is set to " + sizeLimit);
			mParameters.dataSource.sizeLimit = sizeLimit;
		}

		// Column configurations
		var spreadsheetConfig = mParameters && mParameters.workbook;
		jQuery.sap.assert(spreadsheetConfig && Array.isArray(spreadsheetConfig.columns), pre + "column configuration is not provided. Export is not possible");

		spreadsheetConfig.columns.forEach(function(col) {

			jQuery.sap.assert(col, pre + "column configuration is not provided. Export is not possible.");
			jQuery.sap.assert(col.property, pre + "column property is not provided. The column is not exported.");
			jQuery.sap.assert(col.label, pre + "column label is not provided.");
			col.label = col.label || (col.property instanceof Array ? col.property[0] : col.property) || "";

			// Width
			var width = col.width;
			if (typeof width === "string") {
				var sWidth = width.toLowerCase();
				width = parseFloat(sWidth);
				if (sWidth.indexOf("em") > 0) {
					width = width * 2;
				} else if (sWidth.indexOf("px") > 0) {
					width = width / 8;
				}
			}
			if (isNaN(width) || width < 1) {
				width = 10;
			}
			if (col.label.length < 30) {
				width = Math.max(col.label.length, width);
			}
			col.width = Math.round(width);

			// Property type
			if (col.type) {
				col.type = col.type.toLowerCase();
				if (!mPrimitiveTypes[col.type]) {
					jQuery.sap.log.error(pre + "insupported column property type " + col.type + ". Type is reverted to 'string'.");
					col.type = "";
				}
				if (col.type === "currency" && !col.unitProperty) {
					jQuery.sap.log.error(pre + "missing unit property for currency column. Type is reverted to 'string'.");
					col.type = "";
				}
			}

			// Scale parameter for numeric types
			var scale = col.scale;
			if (col.type === "number" && isNaN(scale) && scale !== "variable") {
				jQuery.sap.log.warning(pre + "scale parameter for numerical column configuration is missing.");
			}
			if (typeof scale === "string") {
				scale = parseInt(scale, 10);
			}
			if (isNaN(scale)) {
				scale = null;
			}
			col.scale = scale;

			// Text align
			var textAlign = (col.textAlign + "").toLowerCase();
			if (textAlign !== "" && ["left","right","center","begin","end"].indexOf(textAlign) == -1) {
				jQuery.sap.log.warning(pre + "incorrect column alignment property: " + textAlign + ". Default alignment is used.");
				textAlign = "";
			}
			col.textAlign = textAlign;
		});
	}


	/**
	 * Loads data from the backend, builds and saves the resulting spreadsheet file. You can use the <code>cancel</code> method to stop a running export.
	 *
	 * @function
	 * @returns {Promise} Promise object. You may use it to track the result of the export process.
	 *
	 * @name sap.ui.export.Spreadsheet#build
	 * @public
	 */
	Spreadsheet.prototype.build = function() {
		var spreadsheet = this;

		var mParameters = jQuery.extend(true, {}, this.mSettings);
		validateParameters(mParameters);

		return new Promise(function (fnResolve, fnReject) {

			var progressDialog;
			var sizeLimit = Device.system.desktop ? 2000000 : 100000; // 2.000.000 cells on desktop and 100.000 otherwise 
			var nRows = mParameters.dataSource.count;
			var nColumns = mParameters.workbook.columns.length;

			function onmessage(message) {
				if (!isNaN(message.progress)) {
					if (progressDialog) {
						progressDialog.updateStatus(message.progress);
					}
					spreadsheet.onprogress(message.progress);
				}
				if (message.error || message.finish) {
					spreadsheet.process = null;
					if (progressDialog) {
						progressDialog.finish();
					}
					if (message.error) {
						fnReject(message.error);
						ExportDialog.showErrorMessage(message.error);
					} else if (message.finish) {
						fnResolve();
					}
				}
			}

			if (spreadsheet.process) {
				fnReject("Cannot start export: the process is already running");
				return;
			}

			function startExport() {
				// Show progress dialog
				if (mParameters.showProgress !== false) {

					progressDialog = ExportDialog.getProgressDialog();

					progressDialog.oncancel = function() {
						return spreadsheet.process && spreadsheet.process.cancel();
					};

					progressDialog.open();
				}

				// Start export
				spreadsheet.process = sap.ui.requireSync("sap/ui/export/SpreadsheetExport").execute(mParameters, onmessage);
			}

			// Show warning and execute
			if (nRows * nColumns > sizeLimit) {
				ExportDialog.showWarningDialog({rows: nRows, columns: nColumns})
					.then( startExport )
					.catch( function() {
						fnReject('Export cancelled by the user.');
					});
			} else {
				startExport();
			}

		});
	};


	return Spreadsheet;

}, /* bExport= */ true);
