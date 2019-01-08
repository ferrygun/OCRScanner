/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
// Provides class sap.ca.ui.model.format.AmountFormat
jQuery.sap.declare("sap.ca.ui.model.format.AmountFormat");

jQuery.sap.require("sap.ui.core.LocaleData");
jQuery.sap.require("sap.ca.ui.model.format.FormatHelper");
jQuery.sap.require("sap.ca.ui.model.format.NumberFormat");
jQuery.sap.require("sap.ca.ui.utils.resourcebundle");

/**
 * Constructor for AmountFormat - must not be used: To get a AmountFormat instance, please use getInstance.
 *
 * @class
 * The AmountFormat is a static class for formatting and parsing file size values according
 * to a set of format options.
 *
 * If no pattern is specified a default pattern according to the locale settings is used.
 *
 * @public
 *
 * @deprecated Deprecated API:Since version 1.28. This control has been made available in sap.ui.core. Please use sap.ui.core.format.NumberFormat.getCurrencyInstance instead! This control will not be supported anymore.
 *
 */
sap.ca.ui.model.format.AmountFormat = function() {
	// Do not use the constructor
	throw new Error();
};

sap.ca.ui.model.format.AmountFormat.oValueInfo = {
	oDefaultFormatOptions: {
		style: "standard"
	}
};

/*
JSON Model containing ISO standard definition of number of decimals to use per currency.
As this is the ISO standard definition, it is shared between all apps.
It will be loaded with  model/currency.json file the first time it's requested.
 */
sap.ca.ui.model.format.AmountFormat.oCurrencyModel = null;


/**
 * Get a instance of the AmountFormat, which can be used for formatting.
 *
 * @param {object} [oFormatOptions] Object which defines the format options
 * @param {string} [oFormatOptions.style] either empty or 'standard or 'short'. If no pattern is given, a locale dependent default pattern of that style is used from the LocaleData class.
 * @param {sap.ui.core.Locale} [oLocale] Locale to ask for locale specific texts/settings
 * @return {sap.ca.ui.model.format.AmountFormat} instance of the AmountFormat
 * @static
 * @public
 */
sap.ca.ui.model.format.AmountFormat.getInstance = function(currencyCode, oFormatOptions, oLocale) {
	return this.createInstance(currencyCode, oFormatOptions, oLocale, this.oValueInfo);
};


/**
 * Create instance of the AmountFormat.
 *
 * @param {object} [oFormatOptions] Object which defines the format options
 * @param {sap.ui.core.Locale} [oLocale] Locale to ask for locale specific texts/settings
 * @return {sap.ca.ui.model.format.AmountFormat} time instance of the AmountFormat
 * @static
 * @private
 */
sap.ca.ui.model.format.AmountFormat.createInstance = function(currencyCode, oFormatOptions, oLocale, oInfo) {
	// Create an instance of the AmountFormat
	var oFormat = jQuery.sap.newObject(this.prototype);

	// Handle optional parameters
	if ( oFormatOptions instanceof sap.ui.core.Locale ) {
		oLocale = oFormatOptions;
		oFormatOptions = undefined;
	}

	// Get Locale and LocaleData to use
	if (!oLocale) {
		oFormat.oLocale = sap.ui.getCore().getConfiguration().getFormatSettings().getFormatLocale();
	} else {
		oFormat.oLocale = new sap.ui.core.Locale(oLocale);
	}
	oFormat.oLocaleData = sap.ui.core.LocaleData.getInstance(oFormat.oLocale);

	// Extend the default format options with custom format options
	oFormat.oFormatOptions = jQuery.extend(false, {}, oInfo.oDefaultFormatOptions, oFormatOptions);

	oFormat.init(currencyCode, oFormatOptions);

	return oFormat;
};

/**
 * Initialize currency format
 */
sap.ca.ui.model.format.AmountFormat.prototype.init = function(currencyCode, oFormatOptions) {
	// Rules Decimals "Precedence": if decimals are options defined it should override default and currency (defined)
	if (oFormatOptions){
		if (oFormatOptions.decimals != undefined){
			//special "preserve" value : preserve the number of decimals of the value to format.
			//currency dependant number of decimals will not be taken into account
			if (oFormatOptions.decimals == "preserve") {
				this.oFormatOptions.decimals = undefined;
			}
			return;
		}
	}
	if (currencyCode){
		//default number of decimals for standard currencies = 2
		this.oFormatOptions.decimals = 2;

		//load model with currency formatting exceptions
		if (!sap.ca.ui.model.format.AmountFormat.oCurrencyModel){
			sap.ca.ui.model.format.AmountFormat.oCurrencyModel = new sap.ui.model.json.JSONModel();
			var path = jQuery.sap.getModulePath("sap.ca.ui");
			sap.ca.ui.model.format.AmountFormat.oCurrencyModel.loadData(path + "/model/currency.json", "", false);
		}

		var data = sap.ca.ui.model.format.AmountFormat.oCurrencyModel.getData();
		for (var i = 0; i < data.length; i++) {
			if (data[i].Name === currencyCode) {
				this.oFormatOptions.decimals = data[i].Decimals;
				break;
			}
		}
	}
};


/**
 * Format an amount according to the given format options.
 *
 * @param {number} oValue the value to format
 * @return {string} the formatted output value
 * @public
 */
sap.ca.ui.model.format.AmountFormat.prototype.format = function(oValue) {
	var formatter = sap.ca.ui.model.format.NumberFormat.getInstance(this.oFormatOptions, this.oLocale);
	return formatter.format(oValue);
};

/**
 * Parse a string which is formatted according to the given format options.
 *
 * @param {string} sValue the string containing a formatted value
 * @return {number} the parsed value
 * @public
 */
sap.ca.ui.model.format.AmountFormat.prototype.parse = function(sValue) {
	var formatter = sap.ca.ui.model.format.NumberFormat.getInstance(this.oFormatOptions, this.oLocale);
	return formatter.parse(sValue);
};

/**
 * Convenience static function
 * Format an amount in short Style.
 * Number of decimals for values not "shortified" will be set :
 *          Using Decimals if specified
 *          else using the standard number of decimal for the given currency
 *          if decimals == "preserve", the number of decimals of the source value will be preserved (currency not taken into account).
 *
 * @param {string} oValue the string containing a formatted value
 * @param {string} currencyCode
 * @param {string} decimals
 * @return {string} the formatted value
 * @public
 */
sap.ca.ui.model.format.AmountFormat.FormatAmountShort = function(oValue, currencyCode, decimals) {
	return sap.ca.ui.model.format.AmountFormat.getInstance(currencyCode,{style:"short", decimals:decimals}).format(oValue);
};


/**
 * Convenience static function
 * Format an amount in standard Style.
 * Number of decimals will be set:
 *          Using Decimals if specified
 *          else using the standard number of decimal for the given currency
 *          if decimals == "preserve", the number of decimals of the source value will be preserved (currency not taken into account).
 *
 * @param {string} oValue the string containing a formatted value
 * @param {string} currencyCode
 * @param {string} decimals
 * @return {string} the formatted value
 * @public
 */
sap.ca.ui.model.format.AmountFormat.FormatAmountStandard = function(oValue, currencyCode, decimals) {
	return sap.ca.ui.model.format.AmountFormat.getInstance(currencyCode,{style:"standard", decimals:decimals}).format(oValue);
};


/**
 * Format an amount with the currency code according to the cldr currency format.
 *
 * @param {string} sValue the string containing a formatted value
 * @param {string} sCurrencyCode the string containing the currency code
 * @return {string} the formatted value
 * @public
 */
sap.ca.ui.model.format.AmountFormat.prototype.formatWithCurrency = function(sValue, sCurrencyCode) {
	var result;
	// First of all, we format the value itself
	var formattedValue = this.format(sValue);
	// We fetch the cldr currency format associated with the locale
	var currencyCldrFormats = sap.ui.core.LocaleData.getInstance(this.oLocale)._get("currencyFormat");
	if (!currencyCldrFormats){
		// The fallback cldr currency format is the one associated with "en" locale
		var sdLocale = new sap.ui.core.Locale("en");
		currencyCldrFormats = sap.ui.core.LocaleData.getInstance(sdLocale)._get("currencyFormat");
	}

	var standard = currencyCldrFormats["standard"];
	if (standard === undefined || standard == "") {
		result = formattedValue;
		jQuery.sap.log.error("no currency format available for the current locale");
	} else {
		// In addition to a standard currency format,
		// in which negative currency amounts might typically be displayed as something like "-$3.27",
		// locales may provide an "accounting" form,
		// in which for "en_US" the same example would appear as "($3.27)".
		// Example of a typical cldr currency format
		//                                   positive   negative
		//                                   |-------| |--------|
		// "currencyFormat" : {"standard" : "¤#,##0.00;¤-#,##0.00" }
		var separationIndex = standard.indexOf(";");
		var tmp = "";
		var valuePattern = /[\.0,#]+/;
		var positiveFormat;
		if (separationIndex != -1) {
			// We only handle positive pattern at the moment.
			// Therefore, only the standard positive part is used.
			 positiveFormat = standard.substring(0, separationIndex);
		} else {
			// There is not special accounting formatting for negative values
			positiveFormat = standard;
		}
		//replace the number pattern with the formatted value
		tmp = positiveFormat.replace(valuePattern, formattedValue);

		// As we are using currency codes and not currency symbols, we must add white space
		// between currency and number when the format doesn't already contain one
		// General currency sign in format is: \u00A4
		//
		// <FIXME description="Related to CSS 0120031469 0000146463 2014: Inconsistent use of '&nbsp;'">
		// The CLDR seems to be mostly using "&nbsp;" to separate the value from the currency code,
		// instead of plain spaces, as below.
		// Download: http://unicode.org/Public/cldr/24/json.zip
		// Look into file <LANGUAGE>\numbers.json
		// At the end, in the "currencyFormats-numberSystem-latn" property, there is "currencySpacing"
		// that contains "beforeCurrency" and "afterCurrency", that both contain "insertBetween".
		// "insertBetween" which seems to be the character to use in the code below, instead of plain spaces.
		// Additional information:
		// http://cldr.unicode.org/translation/currency-names
		// http://cldr.unicode.org/translation/number-patterns
		// </FIXME>
		var spaceNeededBefore = /[\.0,#]+\u00A4/;
		if (positiveFormat.match(spaceNeededBefore)) {
			// FIXME: The CLDR seems to mostly be using &nbsp; instead of plain spaces.
			sCurrencyCode = " " + sCurrencyCode;
		}
		var spaceNeededAfter = /\u00A4[\.0,#]+/;
		if (positiveFormat.match(spaceNeededAfter)) {
			// FIXME: The CLDR seems to mostly be using &nbsp; instead of plain spaces.
			sCurrencyCode = sCurrencyCode + " ";
		}

		result = tmp.replace(/\u00A4/, sCurrencyCode);
	}
	return result;
};

/**
 * Convenience static function
 * Format an amount in short Style with the currency code according to the cldr currency format.
 * Number of decimals for values not "shortified" will be set :
 *          Using Decimals if specified
 *          else using the standard number of decimal for the given currency
 *          If decimals == "preserve", the number of decimals of the source value will be preserved (currency not taken into account).
 *
 *
 * @param {string} sValue the string containing a formatted value
 * @param {string} sCurrencyCode
 * @param {string} decimals
 * @return {string} the formatted value
 * @public
 */
sap.ca.ui.model.format.AmountFormat.FormatAmountShortWithCurrency = function(sValue, sCurrencyCode, decimals) {
	return sap.ca.ui.model.format.AmountFormat.getInstance(sCurrencyCode,{style:"short", decimals:decimals}).formatWithCurrency(sValue, sCurrencyCode);
};


/**
 * Convenience static function
 * Format an amount in standard Style with the currency code according to the cldr currency format.
 * Number of decimals will be set:
 *          Using decimals if specified
 *          else using the standard number of decimal for the given currency
 *          if decimals == "preserve", the number of decimals of the source value will be preserved (currency not taken into account).
 *
 * @param {string} sValue the string containing a formatted value
 * @param {string} sCurrencyCode
 * @param {string} decimals
 * @return {string} the formatted value
 * @public
 */
sap.ca.ui.model.format.AmountFormat.FormatAmountStandardWithCurrency = function(sValue, sCurrencyCode, decimals) {
	return sap.ca.ui.model.format.AmountFormat.getInstance(sCurrencyCode,{style:"standard", decimals:decimals}).formatWithCurrency(sValue, sCurrencyCode);
};