/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

/**
 * Spreadsheet export utility
 * @private
 */
sap.ui.define(['jquery.sap.global'], function(jQuery) {
	'use strict';

	var LIB_JSZIP = "sap/ui/thirdparty/jszip",
		LIB_EXPORT = "sap/ui/export/js/XLSXExportUtils",
		LIB_BUILDER = "sap/ui/export/js/XLSXBuilder";

	/**
	 * Utility class to perform spreadsheet export.
	 *
	 * @class Utility class to perform spreadsheet export
	 * @author SAP SE
	 * @version 1.52.4
	 * @static
	 *
	 * @private
	 * @since 1.50.0
	 */

	function doExport(mParams, fnCallback) {
		/*eslint new-cap: [0, { "capIsNewExceptions": ["URI","window.URI"] }]*/

		function postMessage(message) {
			return fnCallback && fnCallback(message);
		}
		function onprogress(value) {
			postMessage({ progress: value });
		}

		function onerror(error) {
			postMessage({ error: error.message || error });
		}

		function onfinish() {
			postMessage({ finish: true});
		}

		// Export directly from an array in memory.
		// TBD: convert dates as in exportUtils
		function exportArray() {
			var oSpreadsheet;
			var fnSaveFile;
			var fnConvertData;
			var timer;

			function start(XLSXExportUtils, XLSXBuilder) {
				fnSaveFile = XLSXExportUtils.saveFile;
				fnConvertData = XLSXExportUtils.oData.getConverter(mParams);
				oSpreadsheet = new XLSXBuilder(mParams.workbook.columns);
				onprogress(0);
				timer = window.setTimeout(processData,0);
			}

			function processData() {
				if (oSpreadsheet) {
					var aData = mParams.dataSource.data || [];
					var aRows = fnConvertData(aData.slice());
					oSpreadsheet.append(aRows);
					onprogress(50);
					timer = window.setTimeout(buildSpreadsheet, 0);
				}
			}

			function buildSpreadsheet() {
				if (oSpreadsheet) {
					oSpreadsheet.build().then(finish);
				}
			}

			function finish(arraybuffer) {
				if (arraybuffer) {
					fnSaveFile(new Blob([arraybuffer]), mParams.fileName);
				}
				onfinish();
				oSpreadsheet = null;
			}

			function cancel() {
				window.clearTimeout(timer);
				finish();
			}

			// Load libraries and start export
			sap.ui.require([LIB_EXPORT, LIB_BUILDER, LIB_JSZIP], start);

			return {cancel: cancel};
		}

		// make URL absolute
		function normalizeUrl(url) {
			return url ? window.URI(url).absoluteTo(window.location.href).toString() : url;
		}

		function exportInProcess() {

			var oSpreadsheet, oRequest, fnSaveFile;

			function start(XLSXExportUtils, XLSXBuilder) {
				fnSaveFile = XLSXExportUtils.saveFile;
				oSpreadsheet = new XLSXBuilder(mParams.workbook.columns);
				oRequest = XLSXExportUtils.oData.fetch(mParams, processData);
				onprogress(0);
			}

			function processData(oMessage) {
				if (oMessage.rows) {
					oSpreadsheet.append(oMessage.rows);
				}
				if (oMessage.progress) {
					onprogress(oMessage.progress);
				}
				if (oMessage.error) {
					oSpreadsheet = null;
					return onerror(oMessage.error);
				}
				return oMessage.finished && oSpreadsheet.build().then(finish);
			}

			function finish(arraybuffer) {
				fnSaveFile(new Blob([arraybuffer]), mParams.fileName);
				onfinish();
				oSpreadsheet = null;
			}

			function cancel() {
				oRequest.cancel();
				onfinish();
				oSpreadsheet = null;
			}

			// Load libraries and start export
			sap.ui.require([LIB_EXPORT, LIB_BUILDER, LIB_JSZIP], start);

			return {cancel: cancel};
		}

		function exportInWorker() {
			var exportUtils;
			var spreadsheetWorker;
			var params = jQuery.extend(true, {}, mParams);
			var workerParams = typeof params.worker === "object" ?  params.worker : {};

			var fnCancel = function() {
				spreadsheetWorker.postMessage({ cancel: true });
				onfinish();
			};

			function createWorker(url) {
				var worker = new Worker(url);
				worker.onmessage = function (e) {
					if (e.data.status) {
						onprogress(e.data.status);
					} else if (e.data.error) {
						onerror(e.data.error);
					} else {
						exportUtils.saveFile(new Blob([e.data]), params.fileName);
						onfinish();
					}
				};
				worker.postMessage(params); // window.location.origin + 
				return worker;
			}

			function blobWorker() {
				jQuery.sap.log.warning("Direct worker is not allowed. Load the worker via blob.");
				var baseUrl = window.URI(workerParams.base).absoluteTo().search("").hash("").toString();
				workerParams.src = baseUrl + workerParams.ref;
				var blobCode = 'self.origin = "' + baseUrl + '"; ' + 'importScripts("' + workerParams.src + '")';
				var blob = new Blob([blobCode]);
				var blobUrl = window.URL.createObjectURL(blob);
				return createWorker(blobUrl);
			}

			function noWorker() {
				jQuery.sap.log.warning("Blob worker is not allowed. Use in-process export.");
				fnCancel = exportInProcess(params).cancel;
			}

			function start(XLSXExportUtils) {
				exportUtils = XLSXExportUtils;
				try {
					spreadsheetWorker = createWorker(workerParams.src);
					spreadsheetWorker.addEventListener("error", function (e) { // Firefox fires an error event instead of a security exception
						spreadsheetWorker = blobWorker();
						spreadsheetWorker.addEventListener("error", function (e){
							noWorker();
							e.preventDefault();
						});
						e.preventDefault();
					});
				} catch (err1) {
					try {
						spreadsheetWorker = blobWorker();
					} catch (err2) {
						noWorker();
					}
				}
			}

			// with workers, the download url must be absolute
			params.dataSource.dataUrl = normalizeUrl(params.dataSource.dataUrl);
			params.dataSource.serviceUrl = normalizeUrl(params.dataSource.serviceUrl);

			// worker settings
			workerParams.base = workerParams.base || sap.ui.resource("sap.ui.export.js", "");
			workerParams.ref = workerParams.ref || "SpreadsheetWorker.js";
			workerParams.src = workerParams.base + workerParams.ref;

			sap.ui.require([LIB_EXPORT], start); // load the export module and start export

			// fnCancel may be overwritten asynchronously after return, therefore it should be wrapped into a closure
			return {cancel: function() {fnCancel();}};
		}

		if (mParams.dataSource.type === "array") {
			return exportArray();
		} else if (mParams.worker === false || sap.ui.disableExportWorkers === true) {
			return exportInProcess();
		} else {
			return exportInWorker();
		}
	}

	return {execute: doExport};
	
}, /* bExport= */ true);
