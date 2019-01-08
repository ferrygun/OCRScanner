/* global PDFJS */
/*!
 * ${copyright}
 */

sap.ui.define([
    './viewer/sap-fpt/pdf2text/pdf2text',
    './viewer/sap-fpt/util/removeoperlaps',
    './viewer/sap-fpt/viewer/pdfhighlighter',
    './viewer/sap-fpt/suv/suv',
    './viewer/web/compatibility',
    './viewer/web/l10n',
    './viewer/build/pdf',
    './viewer/build/pdf.worker',
    './viewer/web/pdf_viewer'
], function() {
    // sap.ui.define([], function() {
    "use strict";

    /**
     * FileViewer renderer.
     * @namespace
     */
    var FileViewerModuleLoader = {};

    FileViewerModuleLoader.PDFJS = PDFJS;
    // FileViewerModuleLoader.webViewerLoad = webViewerLoad;

    // PDFJS.disableWorker = true;

    PDFJS.workerSrc = sap.ui.resource("sap.fileviewer", "viewer/build/pdf.worker.js");

    // PDFJS.workerSrc = './viewer/build/pdf.worker.js';
    // PDFJS.workerSrc = 'pdf.worker.js';
    // PDFJS.cMapUrl = './viewer/web/cmaps/';
    // PDFJS.cMapPacked = true;

    // PDFJS.useOnlyCssZoom = true;
    // PDFJS.disableTextLayer = true;
    // PDFJS.maxImageSize = 1024 * 1024;

    return FileViewerModuleLoader;

}, /* bExport= */ true);
