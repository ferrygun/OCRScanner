/* global module, console, window, require, Uint8Array, GLOBAL */

(function () {

    'use strict';

    // ===========================================================================
    // set exports
    // ===========================================================================
    var exports;
    if (typeof module === 'undefined') {
        // 1) browser
        window.sap = window.sap || {};
        window.sap.es = window.sap.es || {};
        window.sap.es.pdf2text = window.sap.es.pdf2text || {};
        exports = window.sap.es.pdf2text;
    } else {
        // 2) nodejs
        var Promise = require('bluebird');
        var fs = Promise.promisifyAll(require('fs'));
        var PDFJS = require('sap-pdfjs');
        exports = module.exports;
    }

    // ===========================================================================
    // text buffer
    // ===========================================================================
    var TextBuffer = function () {
        this.init.apply(this, arguments);
    };

    TextBuffer.prototype = {
        init: function () {
            this.parts = [];
        },
        write: function (data) {
            this.parts.push(data);
        },
        saveToFile: function (filePath) {
            /* global require, module */
            var textStream = fs.createWriteStream(filePath);
            textStream.write(this.parts.join(''));
            return textStream.endAsync();
        },
        getData: function () {
            return this.parts.join('');
        }
    };


    // ===========================================================================
    // helper document statistic
    // ===========================================================================
    var DocumentStatistic = function () {
        this.init.apply(this, arguments);
    };

    DocumentStatistic.prototype = {
        init: function () {
            this.pages = [];
        },
        newPage: function () {
            var page = {};
            this.pages.push(page);
            return page;
        },
        save: function () {

        }
    };

    // ===========================================================================
    // class text converter
    // ===========================================================================
    var TextConverter = function () {
        this.init.apply(this, arguments);
    };

    TextConverter.prototype = {

        init: function (pdfDocument) {
            this.pdfDocument = pdfDocument;
            this.highlightIndex = 0;
            this.highlights = [];
            this.totalLength = 0;
            this.textStream = {
                write: function () { }
            };
            this.documentStatistic = new DocumentStatistic();
        },

        convertToText: function (textStream) {
            var that = this;
            this.textStream = textStream;
            return this.writePage(1).then(function () {
                //
            });
        },

        convertHighlights: function (highlights) {
            var that = this;
            this.highlights = highlights;
            this.highlightIndex = 0;
            return this.writePage(1).then(function () {
                return that.highlights;
            });
        },

        writePage: function (pageNumber) {
            var that = this;

            var page = this.documentStatistic.newPage();
            page.startIndex = this.totalLength;

            if (pageNumber > this.pdfDocument.numPages) {
                return true;
            }
            return this.pdfDocument.getPage(pageNumber).then(function (page) {
                var options = {
                    normalizeWhitespace: true
                };
                return page.getTextContent(options);
            }).then(function (textContent) {
                that.processTextContent(pageNumber, textContent);
                return that.writePage(pageNumber + 1);
            });
        },

        processTextContent: function (pageNumber, textContent) {
            //console.log('page', pageNumber);
            var item, prevItem;
            for (var j = 0; j < textContent.items.length; ++j) {
                item = textContent.items[j];

                // add artifical space betwene items
                if (prevItem && prevItem.str.length > 0 && item.str.length > 0) {
                    if (prevItem.str[prevItem.str.length - 1].trim().length > 0 &&
                        item.str[0].trim().length > 0) {
                        this.writeAndHighlight(pageNumber, undefined, ' ', j - 1);
                    }
                }
                prevItem = item;

                /*if (item.str.indexOf('challenge') >= 0) {
                    this.writeAndHighlight(pageNumber, undefined, 'add', j - 1);
                }*/

                // remove items starting with invalid utf8 character 0x00
                if (item.str.length > 0 && item.str.charCodeAt(0) === 0) {
                    this.writeAndHighlight(pageNumber, j, "");
                    continue;
                }

                this.writeAndHighlight(pageNumber, j, item.str);

            }
        },

        writeAndHighlight: function (pageNumber, itemIndex, text, prevItemIndex) {
            var index1 = this.totalLength;
            this.textStream.write(text);
            this.totalLength += text.length;
            var index2 = this.totalLength - 1;
            this.processHighlight(pageNumber, itemIndex, index1, index2, prevItemIndex);
        },

        processHighlight: function (pageNumber, itemIndex, index1, index2, prevItemIndex) {

            if (this.highlightIndex >= this.highlights.length) {
                return;
            }
            var highlight = this.highlights[this.highlightIndex];

            if (!highlight.pdfFrom && highlight.from <= index2) {
                highlight.pdfFrom = {
                    page: pageNumber,
                    item: itemIndex,
                    prevItem: prevItemIndex,
                    offset: highlight.from - index1
                };
            }
            if (!highlight.pdfTo && highlight.to <= index2) {
                highlight.pdfTo = {
                    page: pageNumber,
                    item: itemIndex,
                    prevItem: prevItemIndex,
                    offset: highlight.to - index1
                };
                this.highlightIndex++;
                this.processHighlight(pageNumber, itemIndex, index1, index2);
            }

        }

    };

    // ===========================================================================
    // convert 2 text
    // ===========================================================================
    exports.convert2Text = function (pdfFilePath, textFilePath) {
        var helper = require('../util/helper.js');
        var textBuffer = new TextBuffer();
        return fs.readFileAsync(pdfFilePath).then(function (pdfData) {
            return PDFJS.getDocument(new Uint8Array(pdfData));
        }).then(function (pdfDocument) {
            var converter = new TextConverter(pdfDocument);
            return converter.convertToText(textBuffer);
        }).then(function () {
            return textBuffer.saveToFile(helper.replaceFileExtension(pdfFilePath, '.txt'));
        }).then(function () {
            console.log('converted to text and saved to', helper.replaceFileExtension(pdfFilePath, '.txt'));
        });
    };

    // ===========================================================================
    // convert 2 text using buffers
    // ===========================================================================
    exports.convert2TextBuffer = function (pdfBuffer) {
        var textBuffer = new TextBuffer();
        return PDFJS.getDocument(new Uint8Array(pdfBuffer)).then(function (pdfDocument) {
            var converter = new TextConverter(pdfDocument);
            return converter.convertToText(textBuffer);
        }).then(function () {
            return textBuffer.getData();
        });
    };

    // ===========================================================================
    // convert highlights
    // ===========================================================================
    exports.convertHighlights = function (pdfDocument, highlights) {
        var converter = new TextConverter(pdfDocument);
        return converter.convertHighlights(highlights);
    };

})();
