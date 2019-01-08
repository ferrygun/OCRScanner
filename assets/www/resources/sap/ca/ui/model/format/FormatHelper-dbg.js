/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */

// Provides class sap.ca.ui.model.format.FormatHelper
jQuery.sap.declare("sap.ca.ui.model.format.FormatHelper");

jQuery.sap.require("sap.ui.core.format.NumberFormat");
jQuery.sap.require("sap.ui.core.LocaleData");


sap.ui.base.Object.extend("sap.ca.ui.model.format.FormatHelper", {});


sap.ca.ui.model.format.FormatHelper.stringToNumeric = function(str) {
    // Regexp for detecting hexadecimal prefix => requires parseInt instead of parseFloat
    var hexaDetect = /^\s*[\+-]?0[xX]/;
    if (hexaDetect.test(str)) {
        return parseInt(str, 16);
    }
    else {
        return parseFloat(str);
    }
};

sap.ca.ui.model.format.FormatHelper.toNumeric = function(obj) {
    if ((obj === null) || (obj === undefined)) {
        return NaN;
    }
    var t = typeof obj;
    var result;
    switch (t) {
        case "number":
            result = obj;
            break;
        case "string":
            result = sap.ca.ui.model.format.FormatHelper.stringToNumeric(obj);
            break;
        case "object":
            var v = obj.valueOf();
            if (typeof v === "number") {
                // Value object (e.g. Number)
                result = v;
            }
            else if (Array.isArray(obj)) {
                result = NaN;
            }
            else {
                result = sap.ca.ui.model.format.FormatHelper.stringToNumeric(obj.toString());
            }
            break;
        default:
            result = NaN;
            break;
    }
    return result;
};

sap.ca.ui.model.format.FormatHelper.isNumeric = function(obj) {
    return isFinite(sap.ca.ui.model.format.FormatHelper.toNumeric(obj));
};

sap.ca.ui.model.format.FormatHelper.getFormatOptions = function(options, locale) {
    var formatOptions = {};
    formatOptions.locale = locale;
    var t = typeof options;
    switch (t) {
        case "number":
            formatOptions.decimals = options;
            break;
        case "object":
            if (typeof options.locale === "string") {
                formatOptions.locale = new sap.ui.core.Locale(options.locale);
            }
            else if (options.locale) {
                formatOptions.locale = options.locale;
            }
            formatOptions.decimals = options.decimals;
            formatOptions.rounding = options.rounding;
            formatOptions.formatStyle = options.formatStyle;
            formatOptions.shortDecimals = options.shortDecimals;
            formatOptions.shortRounding = options.shortRounding;
            break;
    }
    if (!formatOptions.locale) {
        if (sap.ui.getCore().getConfiguration().getLanguage() == "ZH") {
            formatOptions.locale = new sap.ui.core.Locale("zh_CN");
        }
        else {
            formatOptions.locale = sap.ui.getCore().getConfiguration().getFormatSettings().getFormatLocale();
        }
    }
    return formatOptions;
};

sap.ca.ui.model.format.FormatHelper.hasRounding = function (options) {
    var rounding;
    if (options !== undefined) {
        if (typeof options === "number") {
            rounding = true;
        }
        else {
            if (options.formatStyle === "short") {
                rounding = (options.shortDecimals !== undefined) || (options.shortRounding !== undefined);
            }
            else {
                rounding = (options.decimals !== undefined) || (options.rounding !== undefined);
            }
        }
    }
    else {
        rounding = false;
    }
    return rounding;
};

sap.ca.ui.model.format.FormatHelper.roundNumber = function(number, options) {
    options = options || {};
    var roundedNumber;
    var fRounding, oDecimals;
    if (options.formatStyle === "short") {
        fRounding = options.shortRounding;
        oDecimals = options.shortDecimals;
    }
    else {
        fRounding = options.rounding;
        oDecimals = options.decimals;
    }
    if (fRounding) {
        roundedNumber = fRounding(number);
    }
    // WARNING: oDecimals can be 0 => we cannot simply test (oDecimals)
    else if (oDecimals !== undefined) {
        var decimals = sap.ca.ui.model.format.FormatHelper._getDecimals(oDecimals, number);
        roundedNumber = number.toFixed(decimals);
    }
    else {
        roundedNumber = number;
    }
    return roundedNumber;
};

sap.ca.ui.model.format.FormatHelper._getDecimals = function (oDecimals, number) {
    var decimals;
    if (typeof oDecimals === "function") {
        decimals = oDecimals(number);
    }
    else {
        decimals = oDecimals;
    }

    return decimals;
};

/**
 * Fix for Id4019bf373d32035a8061baa59a436e55f1872ea
 */
sap.ca.ui.model.format.FormatHelper._getUi5DecimalsFormatOptions = function (formatOptions, numValue, number) {
    var ui5FormatOptions = {};
    var oDecimals = null;

    if (formatOptions.formatStyle === "short") {
        oDecimals = formatOptions.shortDecimals;
    }
    else if (formatOptions.decimals || formatOptions.decimals === 0) {
        oDecimals = formatOptions.decimals;
    }

    if (oDecimals !== null) {
        var iDecimals = sap.ca.ui.model.format.FormatHelper._getDecimals(oDecimals, numValue);
        ui5FormatOptions.minFractionDigits = iDecimals;
        ui5FormatOptions.maxFractionDigits = iDecimals;
    }
    else if (typeof number === "string") {
        // If decimals format options are not set then preserve server side formatting.
        var decimalPos = number.indexOf(".");
        var iDecimalsCount = (decimalPos > -1) ? Math.max(number.length - decimalPos - 1, 0) : 0;
        ui5FormatOptions.minFractionDigits = iDecimalsCount;
        ui5FormatOptions.maxFractionDigits = iDecimalsCount;
    }

    return ui5FormatOptions;
};

// TODO: handle NaN and Infinity through "symbols-latn-infinity" and "symbols-latn-nan" properties
sap.ca.ui.model.format.FormatHelper.formatNumber = function(number, options) {
    var numValue  = sap.ca.ui.model.format.FormatHelper.toNumeric(number);
    if (!isFinite(numValue)) {
        return "";
    }

    var formatOptions = sap.ca.ui.model.format.FormatHelper.getFormatOptions(options);
    var ui5FormatOptions = sap.ca.ui.model.format.FormatHelper._getUi5DecimalsFormatOptions(formatOptions, numValue, number);
    var numberFormatter = sap.ui.core.format.NumberFormat.getFloatInstance(ui5FormatOptions, formatOptions.locale);

    if (sap.ca.ui.model.format.FormatHelper.hasRounding(options)) {
        numValue = sap.ca.ui.model.format.FormatHelper.roundNumber(numValue, formatOptions);
        return numberFormatter.format(numValue);
    }
    else {
        // If no rounding is specified, pass the initial parameter to UI5 as it could be pre-formatted
        return numberFormatter.format(number);
    }
};


sap.ca.ui.model.format.FormatHelper.getMagnitude = function(number) {
    // Currently, only supported multiples are { k, M, G, T }
    var _magnitudes = [
        { value: 1e3, suffix: "Kilo" }
        , { value: 1e6, suffix: "Mega" }
        , { value: 1e9, suffix: "Giga" }
        , { value: 1e12, suffix: "Tera" }
        , { value: 1e15, suffix: "Peta" }
        , { value: 1e18, suffix: "Exa" }
        , { value: 1e21, suffix: "Zetta" }
        , { value: 1e24, suffix: "Yotta" }
    ];
    var num = (number >= 0 ? number : -number);
    for (var idx = _magnitudes.length - 1; idx >= 0; --idx) {
        var mag = _magnitudes[idx];
        if (num >= mag.value) {
            return mag;
        }
    }
    return { value: 1, suffix: "" };
};
