// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

/**
 * @fileOverview
 *
 * Exposes a singleton that provides logging functionality for complex
 * operations, carried out in a multi-staged fashion.
 *
 * <p>
 * As
 * a general design principle, the amount of code used to set-up and perform logging is
 * regarded as potentially expensive, and it's a bad idea to run this coded when not
 * needed (e.g., when debugging is not enabled).
 *
 * Because of this, functions that are only called when debugging is enabled are used
 * to obtain input parameters for any public method exported by the module.
 *
 * Usage:
 *
 * oLogger.begin(function () {
 *     return {
 *         logId: "some unique id",
 *         title: "Grow a tree",
 *         moduleName: "sap.ushell.services.ClientSideTargetResolution",
 *         stages: [
 *             "STAGE1: Buy seeds",
 *             "STAGE2: Plant seeds",
 *             "STAGE3: Water",
 *             "STAGE4: Wait"
 *         ]
 *     };
 * });
 *
 * oLogger.log(function () {
 *     return {
 *         logId: "some unique id",
 *         stage: 1,
 *         prefix: "-",
 *         lines: [ "going to the shop", "buying seeds" ]
 *     };
 * });
 *
 * oLogger.end();  // logs on the console
 *
 * <p>This is a dependency of ClientSideTargetResolution.  Interfaces
 * exposed by this module may change at any time without notice.</p>
 *
 * @version 1.52.4
 */
sap.ui.define([
    "sap/ushell/services/_ClientSideTargetResolution/Utils"
], function (oUtils) {
    "use strict";

    var _oLogs = {};

    /**
     * Resets the logger.
     *
     * @param {object} fnGetArgs
     *
     * A function that must return an object with the logging setup arguments.
     * For example:
     *
     * <pre>
     * function () {
     *     return {
     *         logId: "uniqueId", // Multiple log operations may be performed
     *                            // at the same time (potentially
     *                            // asynchronously). This id must be specified
     *                            // with every log operation.
     *         title: "Grow a tree",
     *         moduleName: "sap.ushell.services.ClientSideTargetResolution",
     *         stages: [
     *             "STAGE1: Buy seeds",
     *             "STAGE2: Plant seeds",
     *             "STAGE3: Water",
     *             "STAGE4: Wait"
     *         ]
     *     };
     * }
     * </pre>
     *
     *
     * @private
     */
    function begin(fnGetArgs) {
        var sLogId,
            oLog,
            oSetupArgs = fnGetArgs();

        if (!oSetupArgs.hasOwnProperty("logId")) {
            throw new Error("'logId' argument was not provided in #begin method of StagedLogger.");
        }
        sLogId = oSetupArgs.logId;

        if (_oLogs[sLogId]) {
            throw new Error("'cannot call #begin twice with same log id: '" + sLogId + "'");
        } else {
            _oLogs[sLogId] = {};
        }

        oLog = _oLogs[sLogId];

        oLog.title = oSetupArgs.title || null;
        oLog.moduleName = oSetupArgs.moduleName || null;
        // Array.prototype.fill is not available in ie11, so use
        // repeatChar instead, that puts n Chars of a Char into a string
        var repeatChar = function(sChar, nNumber){
            if (nNumber === 1){
                return sChar
            }
            else {
                return repeatChar(sChar, nNumber - 1) + sChar;
            }
        };
        oLog.stages = oSetupArgs.stages.map(function (sStageName) {
            return [
                sStageName, // first line of the output is the stage name
                repeatChar('-',sStageName.length)
            ];
        });

        return sLogId;
    }

    /**
     * Stores one or more lines of log in memory (no console output).
     *
     * @param {object} fnGetArgs
     *
     * A function that must return an object with the logging arguments.
     * For example:
     *
     * <pre>
     * function () {
     *     return {
     *         logId: "uniqueId", // the same provided during #begin call
     *         stage: 1,
     *         prefix: "-",
     *         number: true,  // produces 1-... 2-...
     *         lines: [ "going to the shop", "buying seeds" ]
     *     };
     * }
     * </pre>
     *
     * @private
     */
    function log(fnGetArgs) {
        var sLogId,
            aLogStage,
            sLine,
            aLines,
            sPrefix,
            iStage,
            bNumber,
            oArgs;

        oArgs = fnGetArgs();

        if (!oArgs.hasOwnProperty("logId")) {
            throw new Error("'logId' argument was not provided in #log method of StagedLogger.");
        }
        sLogId = oArgs.logId;

        iStage = oArgs.stage;
        sPrefix = oArgs.prefix;
        aLines = oArgs.lines;
        sLine = oArgs.line;
        bNumber = oArgs.number;

        // prefix must be added to the single line only if there are no
        // multiple lines
        if (!aLines && sLine && sPrefix) {
            sLine = sPrefix + " " + sLine;
        }

        aLogStage = _oLogs[sLogId].stages[iStage - 1];

        if (sLine) {
            aLogStage.push(sLine);
        }

        if (aLines) {
            if (sPrefix) {
                // indent lines if a single line (the heading) was given
                sPrefix = (sLine ? " " : "") + sPrefix;
            }

            var aLinesWithPrefix = aLines.map(function (sLine, iIdx) {
                return (bNumber ? (iIdx + 1) : "") + (sPrefix ? sPrefix + " " : "") + sLine;
            });
            aLogStage.push.apply(aLogStage, aLinesWithPrefix);
        }
    }

    /**
     * Calls jQuery.sap.log.debug and logs output to the console.
     *
     * @param {object} fnGetArgs
     *
     * A function that must return an object representing the arguments for
     * this method. Currently the unique id is the only argument required.
     *
     * For example:
     *
     * <pre>
     * function () {
     *     return {
     *         logId: "uniqueId", // the same provided during #begin call
     *     };
     * }
     * </pre>
     *
     * @private
     */
    function end(fnGetArgs) {
        var oArgs,
            oLog,
            sLogId;

        oArgs = fnGetArgs();

        if (!oArgs.hasOwnProperty("logId")) {
            throw new Error("'logId' argument was not provided in #log method of StagedLogger.");
        }
        sLogId = oArgs.logId;

        oLog = _oLogs[sLogId];

        if (typeof oLog !== "object") {
            throw new Error("Logger .end was called on an already ended logger");
        }

        var sLogString = oLog.stages.map(function (aStage) {
            return aStage.join("\n");
        }).join("\n\n");

        jQuery.sap.log.debug(
            "[REPORT #" + sLogId + "] " + oLog.title, // avoid timestamp on the same line
            "\n" + sLogString  // avoid overlap between title and first log line
            + "\n",             // avoid overlap between last line and module name
            oLog.moduleName
        );

        delete _oLogs[sLogId];
    }

    /**
     * For testing purposes only.
     */
    function _getLogs() {
        return _oLogs;
    }

    return {
        begin: function () {
            if (!oUtils.isDebugEnabled()) { return; }
            begin.apply(null, arguments);
        },
        log: function () {
            if (!oUtils.isDebugEnabled()) { return; }
            log.apply(null, arguments);
        },
        end: function () {
            if (!oUtils.isDebugEnabled()) { return; }
            end.apply(null, arguments);
        },
        _getLogs: _getLogs // for testing
    };
});
