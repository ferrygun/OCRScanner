/**
 * Spreadsheet Worker - Document Export Services
 */
var spreadsheet;
var request;
var origin = self.origin || "";

// Load libraries
importScripts(origin + 'libs/uri.all.min.js');
importScripts(origin + 'XLSXBuilder.js');
importScripts(origin + 'XLSXExportUtils.js');
importScripts(origin + 'libs/jszip.min.js');

// Promise implementation for IE
if (!self.Promise) {
	importScripts(origin + 'libs/es6-promise.js');
	ES6Promise.polyfill();
}

onmessage = function(e) {
	if (e.data.cancel) {
		if (request) {
			request.cancel();
		}
		close();
		return;
	}
	cancelled = false;
	var mSettings = e.data;
	spreadsheet = new XLSXBuilder(mSettings.workbook.columns);
	request = XLSXExportUtils.oData.fetch(mSettings, processCallback);
};

function processCallback(oMessage) {
	if (oMessage.rows) {
		spreadsheet.append(oMessage.rows);
	}
	if (oMessage.error) {
		postMessage({
			error: oMessage.error
		});
		close();
	}
	if (oMessage.progress) {
		postMessage({
			status: oMessage.progress
		}); // Send status update
	}
	oMessage.finished && spreadsheet.build().then(saveSpreadsheet);
}

function saveSpreadsheet(arraybuffer) {
	postMessage(arraybuffer, [arraybuffer]);
	close(); // Terminate the Worker
}