/* global PDFJS, console, document, Promise, XMLHttpRequest, window, dobi, Uint8Array, WebSocket, FileReader, Blob */
(function () {
    'use strict';

    // ===========================================================================
    // import modules
    // ===========================================================================
    var pdf2text = window.sap.es.pdf2text;
    var exports = window.sap.es;  

    // ===========================================================================
    // helper: item renderer
    // ===========================================================================
    var ItemRenderer = function () {
        this.init.apply(this, arguments);
    };

    ItemRenderer.prototype = {
        init: function (div) {
            this.div = div;
            this.sections = [];
        },
        highlight: function (from, to, cssClasses) {
            this.sections.push([from, to, cssClasses]);
        },
        createTextNode: function (text) {
            if (text.length === 0) {
                return;
            }
            this.div.appendChild(document.createTextNode(text));
        },
        createHighlightedTextNode: function (text, cssClasses) {
            if (text.length === 0) {
                return;
            }
            var spanNode = document.createElement('span');
            for (var i = 0; i < cssClasses.length; ++i) {
                var cssClass = cssClasses[i];
                spanNode.classList.add(cssClass);
            }
            var textNode = document.createTextNode(text);
            spanNode.appendChild(textNode);
            this.div.appendChild(spanNode);
        },
        render: function () {
            var text = this.div.innerText;
            this.div.innerHTML = '';
            var last = 0;
            for (var i = 0; i < this.sections.length; ++i) {
                var section = this.sections[i];
                var from = section[0];
                var to = section[1];
                var cssClasses = section[2];
                this.createTextNode(text.slice(last, from));
                this.createHighlightedTextNode(text.slice(from, to + 1), cssClasses);
                last = to + 1;
            }
            if (last < text.length) {
                this.createTextNode(text.slice(last, text.length));
            }
        }
    };

    // ===========================================================================
    // pdf display
    // ===========================================================================
    exports.PdfHighlighter = function () {
        this.init.apply(this, arguments);
    };

    exports.PdfHighlighter.prototype = {

        init: function (highlights, textDivs, textContent, pageNumber) {
            this.highlights = highlights;
            this.textDivs = textDivs;
            this.textContent = textContent;
            this.pageNumber = pageNumber;
        },

        highlight: function () {
            var that = this;
            that.itemRenderer = null;
            for (var i = 0; i < this.highlights.length; ++i) {
                var highlight = this.highlights[i];
                if (highlight.pdfFrom.page < that.pageNumber) {
                    continue;
                }
                if (highlight.pdfFrom.page > that.pageNumber) {
                    break;
                }
                if (!that.correctUndefinedItems(highlight)) {
                    continue;
                }                
                that.doHighlight(highlight);
            }
            if (that.itemRenderer) {
                that.itemRenderer.render();
            }
        },

        correctUndefinedItems: function (highlight) {

            // highlights which have a valid start and end item need no corection
            if (highlight.pdfFrom.item !== undefined && highlight.pdfTo.item !== undefined) {
                return true;
            }

            // highlights which are located in invisible sections can be ignored
            if (highlight.pdfFrom.item === undefined && highlight.pdfTo.item === undefined) {
                return false;
            }

            if (highlight.pdfTo.item === undefined) {
                highlight.pdfTo.item = highlight.pdfTo.prevItem;
                highlight.pdfTo.offset = this.textContent.items[highlight.pdfTo.prevItem].str.length - 1;
                return true;
            }

            if (highlight.pdfFrom.item === undefined) {
                highlight.pdfFrom.item = highlight.pdfFrom.prevItem + 1;
                highlight.pdfFrom.offset = 0;
                return true;
            }

            return false;

        },

        getItemRenderer: function (div) {
            if (!this.itemRenderer || this.itemRenderer.div !== div) {
                if (this.itemRenderer) {
                    this.itemRenderer.render();
                }
                this.itemRenderer = new ItemRenderer(div);
            }
            return this.itemRenderer;
        },

        doHighlight: function (highlight) {
            for (var i = highlight.pdfFrom.item; i <= highlight.pdfTo.item; ++i) {
                var div = this.textDivs[i];
                var item = this.textContent.items[i];
                var itemRenderer = this.getItemRenderer(div);
                var cssClasses = highlight.types || [];
                if (highlight.pdfTo.page === this.pageNumber) {
                    if (highlight.pdfFrom.item === i && highlight.pdfTo.item === i) {
                        // highlight section within item
                        itemRenderer.highlight(highlight.pdfFrom.offset, highlight.pdfTo.offset, cssClasses);
                    }
                    if (highlight.pdfFrom.item < i && highlight.pdfTo.item > i) {
                        // highlight complete item
                        itemRenderer.highlight(0, item.str.length - 1, cssClasses);
                    }
                    if (highlight.pdfFrom.item < i && highlight.pdfTo.item === i) {
                        // highlight from begining to end position
                        itemRenderer.highlight(0, highlight.pdfTo.offset, cssClasses);
                    }
                    if (highlight.pdfFrom.item === i && highlight.pdfTo.item > i) {
                        // highlight from position to end
                        itemRenderer.highlight(highlight.pdfFrom.offset, item.str.length - 1, cssClasses);
                    }
                } else {
                    if (highlight.pdfFrom.item < i) {
                        // highlight complete item
                        itemRenderer.highlight(0, item.str.length - 1, cssClasses);
                    }
                    if (highlight.pdfFrom.item === i) {
                        // highlight from position to end
                        itemRenderer.highlight(highlight.pdfFrom.offset, item.str.length - 1, cssClasses);
                    }
                }
            }
        }

    };

})();