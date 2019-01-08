/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

// Provides control sap.ushell.ui.appfinder.AppBox.
sap.ui.define(['sap/ui/core/Control','sap/ushell/library'],
	function(Control, library) {
	"use strict";

/**
 * Constructor for a new ui/appfinder/AppBox.
 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given 
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * Add your documentation for the newui/appfinder/AppBox
 * @extends sap.ui.core.Control
 *
 * @constructor
 * @public
 * @name sap.ushell.ui.appfinder.AppBox
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
var AppBox = Control.extend("sap.ushell.ui.appfinder.AppBox", /** @lends sap.ushell.ui.appfinder.AppBox.prototype */ { metadata : {

	library : "sap.ushell",
	properties : {

		/**
		 */
		title : {type : "string", group : "Misc", defaultValue : null},

		/**
		 */
		subtitle : {type : "string", group : "Misc", defaultValue : null},

		/**
		 */
		icon : {type : "string", group : "Misc", defaultValue : null},

		/**
		 */
		url : {type : "string", group : "Misc", defaultValue : null},

        /**
         */
        navigationMode : {type : "string", group : "Misc", defaultValue : null}
	},
	aggregations : {

		/**
		 */
		pinButton : {type : "sap.m.Button", multiple : false}
	},
	events : {

		/**
		 */
		press : {}, 

		/**
		 */
		afterRendering : {}
	}
}});

/*global jQuery, sap*/
/**
 * @name sap.ushell.ui.appfinder.AppBox
 *
 * Provides control sap.ushell.ui.appfinder.AppBox
 * @private
 */
    /*global sap */
    AppBox.prototype.init = function () {
    };

    AppBox.prototype.onAfterRendering = function () {
        this._adjustHeaderElementsHeight();
        this.fireAfterRendering();
    };

    AppBox.prototype.setTitle = function (sTitle) {
        this.setProperty("title", sTitle, true); // set property, but suppress rendering
    };

    AppBox.prototype.setUrl = function (sIntent) {
        this.setProperty("url", sIntent, true); // set property, but suppress rendering
    };

     AppBox.prototype.setNavigationMode = function (sNavigationMode) {
         this.setProperty("navigationMode", sNavigationMode, true); // set property, but suppress rendering
     };

    // browser events
    AppBox.prototype.onclick = function (e) {
        this.firePress(e);
    };

    AppBox.prototype.onsapspace = function (e) {
        e.preventDefault();
        this.firePress(e);
    };

    /**
     * give the AppBox title and subtitle the right height according to the text length
     * @private
     */
    AppBox.prototype._adjustHeaderElementsHeight = function () {
        var jqTitle = this.$().find(".sapUshellAppBoxTitle");
        var titleNumberOfLines = this._getNumberOfLines(jqTitle);
        var jqSubtitle = this.$().find(".sapUshellAppBoxSubtitle");
        if (titleNumberOfLines ===  2) {
            jqTitle.addClass('sapUshellAppBoxHeaderElementTwoLines');
            jqSubtitle.addClass('sapUshellAppBoxHeaderElementOneLine');
        } else {
            jqTitle.addClass('sapUshellAppBoxHeaderElementOneLine');
            jqSubtitle.addClass('sapUshellAppBoxHeaderElementTwoLines');
        }
    };

    /**
     *
     * @param jqElement - the title or the subtitle
     * @returns {number} - the number of line the element take
     * @private
     */
    AppBox.prototype._getNumberOfLines = function (jqElement) {
        var lineHeight = parseInt(jqElement.css("line-height"), 10);
        var height = jqElement.height();
        if (!height) {
            return 0;
        }
        return ((height / lineHeight) > 1) ? 2 : 1;
    };

    AppBox.prototype.onsapenter = AppBox.prototype.onsapspace;



	return AppBox;

});
