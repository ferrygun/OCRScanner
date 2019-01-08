/* global PDFJS, console, document, Promise, XMLHttpRequest, window, module */

(function () {

    'use strict';

    // ===========================================================================
    // remove overlaps
    // ===========================================================================    
    var removeOverlaps = function (highlights) {

        if (highlights.length === 0) {
            return highlights;
        }

        var events = [];
        var highlight, i;
        for (i = 0; i < highlights.length; ++i) {
            highlight = highlights[i];
            events.push({
                eventType: 1,
                index: highlight.from,
                highlight: highlight
            });
            events.push({
                eventType: 2,
                index: highlight.to + 1,
                highlight: highlight
            });
        }

        events.sort(function (e1, e2) {
            return e1.index - e2.index;
        });

        var resultHighlights = [];
        highlight = null;
        var activeHighlights = [];
        var index = events[0].index;
        for (i = 0; i < events.length; ++i) {
            var event = events[i];
            if (event.index !== index) {
                if (highlight) {
                    highlight.to = index - 1;
                    resultHighlights.push(highlight);
                    highlight = null;
                }
                if (activeHighlights.length > 0) {
                    highlight = {
                        from: index,
                        types: assembleTypes(activeHighlights)
                    };
                }
                index = event.index;
            }
            if (event.eventType === 1) {
                activeHighlights.push(event.highlight);
            } else {
                activeHighlights.splice(activeHighlights.indexOf(event.highlight), 1);
            }
        }
        if (highlight) {
            highlight.to = index - 1;
            resultHighlights.push(highlight);
            highlight = null;
        }

        return resultHighlights;

    };

    // ===========================================================================
    // helper: assemble types
    // ===========================================================================        
    var assembleTypes = function (activeHighlights) {
        var types = [];
        var typesMap = {};
        for (var i = 0; i < activeHighlights.length; ++i) {
            var highlight = activeHighlights[i];
            if (!highlight.type) {
                continue;
            }
            if (typesMap[highlight.type]) {
                continue;
            }
            typesMap[highlight.type] = true;
            types.push(highlight.type);
        }
        return types;
    };

    // ===========================================================================
    // test
    // ===========================================================================        
    var test = function () {

        // Hallo_Test
        // 0123456789
        //  xxxx
        //    xxxx
        var highlights = [{
            from: 1,
            to: 4,
            type: 'A'
        }, {
            from: 3,
            to: 6,
            type: 'A'
        }];
        console.log(removeOverlaps(highlights));
        console.log('12 34 56');

        // Hallo_Test
        // 0123456789
        //  xxxxxx
        //    xxxx
        var highlights = [{
            from: 1,
            to: 6,
            type: 'A'
        }, {
            from: 3,
            to: 6,
            type: 'A'
        }];
        console.log(removeOverlaps(highlights));
        console.log('12 36');

        // Hallo_Test
        // 0123456789
        //  xxxxxx
        //  xxxx
        var highlights = [{
            from: 1,
            to: 6,
            type: 'A'
        }, {
            from: 1,
            to: 4,
            type: 'A'
        }];
        console.log(removeOverlaps(highlights));
        console.log('14 56');

        // Hallo_Test
        // 0123456789
        //  xxxxxx
        //   xxxx
        var highlights = [{
            from: 1,
            to: 6,
            type: 'A'
        }, {
            from: 2,
            to: 5,
            type: 'A'
        }];
        console.log(removeOverlaps(highlights));
        console.log('11 25 66');


    };

    //test();

    // ===========================================================================
    // set exports
    // ===========================================================================     

    if (typeof module === 'undefined') {
        // 1) browser
        window.sap = window.sap || {};
        window.sap.es = window.sap.es || {};
        window.sap.es.removeOverlaps = removeOverlaps;
    } else {
        // 2) nodejs
        module.exports = removeOverlaps;
    }

})();