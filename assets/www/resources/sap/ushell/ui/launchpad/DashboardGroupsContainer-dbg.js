/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

// Provides control sap.ushell.ui.launchpad.DashboardGroupsContainer.
sap.ui.define(['sap/ui/core/Control','sap/ushell/library', 'sap/ushell/override'],
	function(Control, library, override) {
	"use strict";

/**
 * Constructor for a new ui/launchpad/DashboardGroupsContainer.
 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given 
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * Add your documentation for the newui/launchpad/DashboardGroupsContainer
 * @extends sap.ui.core.Control
 *
 * @constructor
 * @public
 * @name sap.ushell.ui.launchpad.DashboardGroupsContainer
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
var DashboardGroupsContainer = Control.extend("sap.ushell.ui.launchpad.DashboardGroupsContainer", /** @lends sap.ushell.ui.launchpad.DashboardGroupsContainer.prototype */ { metadata : {

	library : "sap.ushell",
	properties : {

		/**
		 * An value for an optional accessibility label
		 */
		accessibilityLabel : {type : "string", defaultValue : null},

		/**
		 */
		displayMode : {type : "string", defaultValue : null}
	},
	aggregations : {

		/**
		 */
		groups : {type : "sap.ui.core.Control", multiple : true, singularName : "group"}
	},
	events : {

		/**
		 */
		afterRendering : {}
	}
}});

/**
 * @name sap.ushell.ui.launchpad.DashboardGroupsContainer
 *
 * @private
 */
/*global jQuery, sap*/

    // Overwrite update function (version without filter/sort support)
    DashboardGroupsContainer.prototype.updateGroups = override.updateAggregatesFactory("groups");
    // Alternative (supports all bindings, uses default as fallback)
    //sap.ushell.ui.launchpad.TileContainer.prototype.updateAggregation = sap.ushell.override.updateAggregation;

    DashboardGroupsContainer.prototype.onAfterRendering = function () {
        this.fireAfterRendering();
    };

    DashboardGroupsContainer.prototype.getGroupControlByGroupId = function (groupId) {
        try {
            var groups = this.getGroups();
            for (var i = 0; i < groups.length; i++) {
                if (groups[i].getGroupId() == groupId) {
                    return groups[i];
                }
            }
        } catch (e){
            // continue regardless of error
        }

        return null;
    };

	DashboardGroupsContainer.prototype.addLinksToUnselectedGroups = function () {
		var aGroups = this.getGroups();
		aGroups.forEach(function(oGroup, index) {
			if (!oGroup.getIsGroupSelected()) {
				sap.ui.base.ManagedObject.prototype.updateAggregation.call(oGroup, "links");
			}
		});
	};


        DashboardGroupsContainer.prototype.removeLinksFromAllGroups = function () {
            var aGroups = this.getGroups();
            aGroups.forEach(function(oGroup, index) {
                var aLinks = oGroup.getLinks();
                if (aLinks.length) {
                    if (aLinks[0].getMetadata().getName() === "sap.m.GenericTile") {
                        oGroup.removeAllLinks();
                    } else {
                        for (var i = 0; i < aLinks.length; i++) {
                            aLinks[i].destroy();
                        }
                    }
                }
            });
        };


        DashboardGroupsContainer.prototype.removeLinksFromUnselectedGroups = function () {
            var aGroups = this.getGroups();
            aGroups.forEach(function(oGroup, index) {
                var aLinks = oGroup.getLinks();
                if (aLinks.length && !oGroup.getIsGroupSelected()) {
                    if (aLinks[0].getMetadata().getName() === "sap.m.GenericTile") {
                        oGroup.removeAllLinks();
                    } else {
                        for (var i = 0; i < aLinks.length; i++) {
                            aLinks[i].destroy();
                        }
                    }
                }
            });
        };

	return DashboardGroupsContainer;

});
