/* global window, Promise, XMLHttpRequest, Uint8Array, module, require, Buffer*/
(function () {
    'use strict';

    // ===========================================================================
    // set exports
    // ===========================================================================    
    var exports, Promise;
    if (typeof module === 'undefined') {
        // 1) browser
        window.sap = window.sap || {};
        window.sap.es = window.sap.es || {};
        window.sap.es.suv = window.sap.es.suv || {};
        exports = window.sap.es.suv;
        Promise = window.Promise;
    } else {
        // 2) nodejs
        Promise = require('bluebird');
        var PDFJS = require('sap-pdfjs');
        exports = module.exports;
    }

    // ===========================================================================
    // utf8 decoder
    // ===========================================================================        
    var decodeUtf8 = function (arrayBuffer) {
        var result = "";
        var i = 0;
        var c = 0;
        var c3 = 0;
        var c2 = 0;


        var data = new Uint8Array(arrayBuffer);

        // If we have a BOM skip it
        if (data.length >= 3 && data[0] === 0xef && data[1] === 0xbb && data[2] === 0xbf) {
            i = 3;
        }

        while (i < data.length) {
            c = data[i];

            if (c < 128) {
                result += String.fromCharCode(c);
                i++;
            } else if (c > 191 && c < 224) {
                if (i + 1 >= data.length) {
                    throw "UTF-8 Decode failed. Two byte character was truncated.";
                }
                c2 = data[i + 1];
                result += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            } else {
                if (i + 2 >= data.length) {
                    throw "UTF-8 Decode failed. Multi byte character was truncated.";
                }
                c2 = data[i + 1];
                c3 = data[i + 2];
                result += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }
        return result;
    };

    // ===========================================================================
    // ajax get url
    // ===========================================================================        
    var getUrl = function (url, mode) {
        return new Promise(function (resolve, reject) {
            var httpRequest = new XMLHttpRequest();
            if (!httpRequest) {
                reject('error getting ' + url);
                return;
            }
            httpRequest.onreadystatechange = function () {
                if (httpRequest.readyState === XMLHttpRequest.DONE) {
                    if (httpRequest.status === 200) {
                        resolve(httpRequest.response);
                    } else {
                        reject('There was a problem with the request');
                    }
                }
            };
            //httpRequest.overrideMimeType('text\/plain; charset=x-user-defined');
            if (mode == 'binary') {
                httpRequest.responseType = "arraybuffer";
            }
            httpRequest.open('GET', url);
            httpRequest.send();
        });
    };

    // ===========================================================================
    // load suv
    // ===========================================================================    
    exports.getSuv = function (url) {
        var highlights;
        return getUrl(url, 'binary').then(function (data) {
            return exports.disAssembleSuv(data);
        });
    };

    // ===========================================================================
    // disassemble suv
    // ===========================================================================    
    exports.disAssembleSuv = function (data) {
        var headerData = data.slice(0, 80);
        var pdfByteLength = parseInt(String.fromCharCode.apply(null, new Uint8Array(headerData)));
        var pdfData = data.slice(80, 80 + pdfByteLength);
        var analysisResult = JSON.parse(decodeUtf8(data.slice(80 + pdfByteLength)));
        return {
            pdfData: pdfData,
            highlights: analysisResult.entities,
            entities: analysisResult.entities,
            title: analysisResult.title,
            version: analysisResult.version
        };
    };

    // ===========================================================================
    // assemble suv
    // ===========================================================================    
    exports.assembleSuv = function (pdfBuffer, entities, title) {
        var padString = new Array(81).join(' ');
        var headerBuffer = new Buffer(('' + pdfBuffer.length + padString).slice(0, 80));
        var analysisResult = {
            version: exports.version(),
            title: title || '',
            entities: entities
        };
        var analysisResultBuffer = new Buffer(JSON.stringify(analysisResult));
        var suvBuffer = Buffer.concat([headerBuffer, pdfBuffer, analysisResultBuffer]);
        return suvBuffer;
    };

    // ===========================================================================
    // version
    // ===========================================================================    
    exports.version = function () {
        return {
            'pdfjs': PDFJS.version,
            'sap-fpt': require('../package.json').version
        };
    };

})();