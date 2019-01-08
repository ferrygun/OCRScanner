/*!
 * ${copyright}
 */

// Provides control sap.fileviewer.FileViewer.
sap.ui.define(['jquery.sap.global', './library', 'sap/ui/core/Control', './FileViewerModuleLoader', 'sap/ui/model/resource/ResourceModel'],
    function(jQuery, library, Control, FileViewerModuleLoader, ResourceModel) {
        "use strict";

        /**
         * Constructor for FileViewer control.
         *
         * @param {string} [sId] id for the new control, generated automatically if no id is given
         * @param {object} [mSettings] initial settings for the new control
         *
         * @class
         * SAP UI5 FileViewer control can be used to view files. It's based on PDFJS.
         * @extends sap.ui.core.Control
         *
         * @author SAP SE
         * @version 1.52.2
         *
         * @public
         * @alias sap.fileviewer.FileViewer
         */
        var FileViewer = Control.extend("sap.fileviewer.FileViewer", /** @lends sap.fileviewer.FileViewer.prototype */ {

            PDFJS: FileViewerModuleLoader.PDFJS,

            DEFAULT_SCALE_DELTA: 1.1,
            MIN_SCALE: 0.25,
            MAX_SCALE: 10.0,
            DEFAULT_SCALE_VALUE: 'auto',

            metadata: {

                library: "sap.fileviewer",
                properties: {

                    /**
                     * height property
                     */
                    height: {
                        type: "sap.ui.core.CSSSize",
                        defaultValue: "100%"
                    },

                    /**
                     * width property
                     */
                    width: {
                        type: "sap.ui.core.CSSSize",
                        defaultValue: "100%"
                    },

                    /**
                     * source property
                     */
                    source: {
                        type: "sap.ui.core.URI"
                    },

                    /**
                     * data property
                     */
                    data: {
                        type: "string"
                    }

                },
                aggregations: {
                    "_layoutContainer": {
                        type: "sap.m.FlexBox",
                        multiple: false,
                        visibility: "hidden"
                    },
                    "_toolbar": {
                        type: "sap.m.OverflowToolbar",
                        multiple: false,
                        visibility: "hidden"
                    },
                    "_errorMessage": {
                        type: "sap.m.Label",
                        multiple: false,
                        visibility: "hidden"
                    }
                }
            },

            init: function() {
                var that = this;

                var i18nModel = new ResourceModel({
                    bundleName: "sap.fileviewer.resources.messagebundle"
                });
                that.setModel(i18nModel, "i18n");

                that._pdfLoadingTask = null;
                that._pdfDocument = null;
                that._pdfViewer = null;
                that._pdfHistory = null;
                that._pdfLinkService = null;

                that.addStyleClass("sapFileViewer-outermostContainer");

                that._previousPageButton = new sap.m.Button({
                    text: "Previous Page",
                    press: function() {
                        var previousPageNumber = that._getPageNumber() - 1;
                        if (previousPageNumber >= 1) {
                            that._setPageNumber(previousPageNumber);
                        }
                    },
                    enabled: false
                });

                that._nextPageButton = new sap.m.Button({
                    text: "Next Page",
                    press: function() {
                        var nextPageNumber = that._getPageNumber() + 1;
                        if (nextPageNumber <= that._getPagesCount()) {
                            that._setPageNumber(nextPageNumber);
                        }
                    },
                    enabled: false
                });

                var toolbarContent = [
                    that._previousPageButton,
                    that._nextPageButton
                ];

                that.setAggregation("_toolbar", new sap.m.OverflowToolbar({
                    content: toolbarContent
                }));

                // that.setAggregation("_layoutContainer", new sap.m.FlexBox({
                //     items: [that.getAggregation("_toolbar")],
                //     fitContainer: true
                // }));


                var errorMessage = i18nModel.getResourceBundle().getText("PDF_VIEWER_PLACEHOLDER_ERROR_TEXT");
                that.setAggregation("_errorMessage", new sap.m.Label({
                    textAlign: "Center",
                    text: errorMessage
                }).addStyleClass("sapFileViewer-pdfViewerErrorMessage"));
            },

            exit: function() {
                this._close();
            },

            renderer: function(oRm, oControl) { // static function, so use the given "oControl" instance instead of "this" in the renderer function
                oControl._renderer(oRm);
            },

            _renderer: function(oRm) {
                var width = this.getWidth();
                if (width && width != "100%") {
                    oRm.addStyle("width", width);
                }

                var height = this.getHeight();
                if (height && height != "100%") {
                    oRm.addStyle("height", height);
                }

                oRm.write("<div");
                oRm.writeControlData(this);
                oRm.writeClasses();
                oRm.writeStyles();
                oRm.write(">");

                oRm.write('<div class="sapFileViewer-pdfViewerErrorContainer">');
                oRm.renderControl(this.getAggregation("_errorMessage"));
                oRm.write('</div>');

                // this._renderOuterContainer(oRm);

                // oRm.write('<div class="sapFileViewer-toolbarContainer">');
                // var layoutContainer = this.getAggregation("_toolbar");
                // oRm.renderControl(layoutContainer);
                // oRm.write("</div>");

                oRm.write('<div class="sapFileViewer-pdfViewerContainer"><div class="sapFileViewer-pdfViewer"><div id="viewer" class="pdfViewer"></div></div></div>');
                //oRm.write('<div class="sapFileViewer-pdfViewer"><div id="viewer" class="pdfViewer"></div></div>');

                oRm.write("</div>");
            },



            _setTitleUsingUrl: function pdfViewSetTitleUsingUrl(url) {
                this.url = url;
                var title = this.PDFJS.getFilenameFromUrl(url) || url;
                try {
                    title = decodeURIComponent(title);
                } catch (e) {
                    // decodeURIComponent may throw URIError,
                    // fall back to using the unprocessed url in that case
                }
                this._setTitle(title);
            },

            _setTitleUsingMetadata: function(pdfDocument) {
                var that = this;
                pdfDocument.getMetadata().then(function(data) {
                    var info = data.info,
                        metadata = data.metadata;
                    that.documentInfo = info;
                    that.metadata = metadata;

                    // Provides some basic debug information
                    // console.log('PDF ' + pdfDocument.fingerprint + ' [' +
                    //     info.PDFFormatVersion + ' ' + (info.Producer || '-').trim() +
                    //     ' / ' + (info.Creator || '-').trim() + ']' +
                    //     ' (PDF.js: ' + (that.PDFJS.version || '-') +
                    //     (!that.PDFJS.disableWebGL ? ' [WebGL]' : '') + ')');

                    var pdfTitle;
                    if (metadata && metadata.has('dc:title')) {
                        var title = metadata.get('dc:title');
                        // Ghostscript sometimes returns 'Untitled', so prevent setting the
                        // title to 'Untitled.
                        if (title !== 'Untitled') {
                            pdfTitle = title;
                        }
                    }

                    if (!pdfTitle && info && info['Title']) {
                        pdfTitle = info['Title'];
                    }

                    if (pdfTitle) {
                        that._setTitle(pdfTitle + ' - ' + document.title);
                    }
                });
            },

            _setTitle: function pdfViewSetTitle(title) {
                // document.title = title;
                // document.getElementById('title').textContent = title;
            },

            _open: function(params) {
                var that = this;

                jQuery(that.getDomRef()).find(".sapFileViewer-pdfViewerErrorContainer").css("display", "none");

                if (this._pdfLoadingTask) {
                    // We need to destroy already opened document
                    return this._close().then(function() {
                        // ... and repeat the open() call.
                        return this._open(params);
                    }.bind(this));
                }

                var url = params.url;
                if (url) {
                    this._setTitleUsingUrl(url);
                } else if (params.data) {
                    url = {
                        data: params.data
                    };
                }

                // Loading document.
                var loadingTask = that.PDFJS.getDocument(url);
                this._pdfLoadingTask = loadingTask;

                loadingTask.onProgress = function(progressData) {
                    //that.progress(progressData.loaded / progressData.total);
                };

                return loadingTask.promise.then(function(pdfDocument) {
                    // Document loaded, specifying document for the viewer.
                    that._pdfDocument = pdfDocument;
                    that._pdfViewer.setDocument(pdfDocument);
                    that._pdfLinkService.setDocument(pdfDocument);
                    that._pdfHistory.initialize(pdfDocument.fingerprint);

                    // that._previousPageButton.setEnabled(true);
                    // that._nextPageButton.setEnabled(true);

                    // that.loadingBar.hide();
                    that._setTitleUsingMetadata(pdfDocument);
                }, function(exception) {

                    jQuery(that.getDomRef()).find(".sapFileViewer-pdfViewerErrorContainer").css("display", "block");

                    // var message = exception && exception.message;
                    // var loadingErrorMessage = mozL10n.get('loading_error', null,
                    //     'An error occurred while loading the PDF.');
                    //
                    // if (exception instanceof that.PDFJS.InvalidPDFException) {
                    //     // change error message also for other builds
                    //     loadingErrorMessage = mozL10n.get('invalid_file_error', null,
                    //         'Invalid or corrupted PDF file.');
                    // } else if (exception instanceof that.PDFJS.MissingPDFException) {
                    //     // special message for missing PDFs
                    //     loadingErrorMessage = mozL10n.get('missing_file_error', null,
                    //         'Missing PDF file.');
                    // } else if (exception instanceof that.PDFJS.UnexpectedResponseException) {
                    //     loadingErrorMessage = mozL10n.get('unexpected_response_error', null,
                    //         'Unexpected server response.');
                    // }

                    // var moreInfo = {
                    //   message: message
                    // };
                    // that.error(loadingErrorMessage, moreInfo);
                    // that.loadingBar.hide();
                });
            },

            _close: function() {
                // var errorWrapper = document.getElementById('errorWrapper');
                // errorWrapper.setAttribute('hidden', 'true');

                if (!this._pdfLoadingTask) {
                    return Promise.resolve();
                }

                var promise = this._pdfLoadingTask.destroy();
                this._pdfLoadingTask = null;

                if (this.pdfDocument) {
                    this._pdfDocument = null;

                    this._pdfViewer.setDocument(null);
                    this._pdfLinkService.setDocument(null, null);
                }

                jQuery(this.getDomRef()).find(".sapFileViewer-pdfViewerErrorContainer").css("display", "none");

                return promise;
            },

            _getPagesCount: function() {
                return this._pdfDocument && this.pdfDocument.numPages || 0;
            },

            _setPageNumber: function(pageNumber) {
                if (this._pdfViewer) {
                    this._pdfViewer.currentPageNumber = pageNumber;
                }
            },

            _getPageNumber: function() {
                return this._pdfViewer && this._pdfViewer.currentPageNumber || 0;
            },

            _initUI: function pdfViewInitUI() {
                var that = this;

                var linkService = new that.PDFJS.PDFLinkService();
                this._pdfLinkService = linkService;

                this._l10n = that.PDFJS.NullL10n;

                //var container = document.getElementById('viewerContainer');
                var container = jQuery(this.getDomRef()).find(".sapFileViewer-pdfViewer").get(0);
                var pdfViewer = new that.PDFJS.PDFViewer({
                    container: container,
                    linkService: linkService,
                    l10n: this._l10n
                });
                this._pdfViewer = pdfViewer;
                linkService.setViewer(pdfViewer);

                this._pdfHistory = new that.PDFJS.PDFHistory({
                    linkService: linkService
                });
                linkService.setHistory(this._pdfHistory);

                // //document.getElementById('previous')
                // that._previousPageButton.getDomRef().addEventListener('click', function() {
                //   //PDFViewerApplication.page--;
                //   that.setPageNumber(that.getPageNumber() - 1);
                // });
                //
                // //document.getElementById('next')
                // that._nextPageButton.getDomRef().addEventListener('click', function() {
                //   //PDFViewerApplication.page++;
                //   that.setPageNumber(that.getPageNumber() + 1);
                // });

                // document.getElementById('zoomIn').addEventListener('click', function() {
                //   PDFViewerApplication.zoomIn();
                // });

                // document.getElementById('zoomOut').addEventListener('click', function() {
                //   PDFViewerApplication.zoomOut();
                // });

                // document.getElementById('pageNumber').addEventListener('click', function() {
                //   this.select();
                // });
                //
                // document.getElementById('pageNumber').addEventListener('change',
                //     function() {
                //   PDFViewerApplication.page = (this.value | 0);
                //
                //   // Ensure that the page number input displays the correct value, even if the
                //   // value entered by the user was invalid (e.g. a floating point number).
                //   if (this.value !== PDFViewerApplication.page.toString()) {
                //     this.value = PDFViewerApplication.page;
                //   }
                // });

                // container.addEventListener('pagesinit', function () {
                //   // We can use pdfViewer now, e.g. let's change default scale.
                //   pdfViewer.currentScaleValue = that.DEFAULT_SCALE_VALUE;
                // });
                //
                // container.addEventListener('pagechange', function (evt) {
                //   var page = evt.pageNumber;
                //   var numPages = PDFViewerApplication.pagesCount;
                //
                //   document.getElementById('pageNumber').value = page;
                //   document.getElementById('previous').disabled = (page <= 1);
                //   document.getElementById('next').disabled = (page >= numPages);
                // }, true);
            },

            onAfterRendering: function() {
                var that = this;

                that._initUI();
                var params;
                var source = this.getSource();
                if (source) {
                    params = {
                        url: source
                    };
                } else {
                    var data = this.getData();
                    if (data) {
                        params = {
                            data: data
                        };
                    }
                }

                if (params) {
                    that._open(params);
                }
            }
        });

        return FileViewer;

    });
