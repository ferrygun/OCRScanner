/* global jQuery, sap, window, console */
sap.ui.define([
    'sap/m/Toolbar'
], function() {
    "use strict";

    return sap.m.Toolbar.extend("sap.ushell.renderers.fiori2.search.controls.SearchFilterBar", {

        constructor: function(options) {
            var that = this;

            // blue bar
            options = jQuery.extend({}, {
                design: sap.m.ToolbarDesign.Info
            }, options);
            sap.m.Toolbar.prototype.constructor.apply(that, [options]);
            that.addStyleClass('sapUshellSearchFilterContextualBar');

            // bind file formatter
            that.filterFormatter = that.filterFormatter.bind(that);

            // filter text string
            that.filterText = new sap.m.Text({
                text: {
                    parts: [{
                        path: "/uiFilter/defaultConditionGroup/conditions"
                    }, {
                        path: "/facets"
                    }],
                    formatter: that.filterFormatter
                },
                tooltip: {
                    parts: [{
                        path: "/uiFilter/defaultConditionGroup/conditions"
                    }, {
                        path: "/facets"
                    }],
                    formatter: that.filterFormatter
                }
            }).addStyleClass("sapUshellSearchFilterText");
            that.filterText.setMaxLines(1);
            that.filterText.clampText();
            that.addContent(that.filterText);

            // filter middle space
            that.addContent(new sap.m.ToolbarSpacer());

            // filter reset button
            that.resetButton = new sap.ui.core.Icon({
                src: "sap-icon://clear-filter",
                tooltip: sap.ushell.resources.i18n.getText("resetFilterButton_tooltip")
            }).addStyleClass("sapUshellSearchFilterResetButton");
            that.addContent(that.resetButton);
        },

        filterFormatter: function(conditions, facets) {
            var getLabel = function(condition) {
                return condition.label;
            };
            if (conditions.length === 0) {
                return "";
            }
            conditions = this.sortConditions(conditions, facets);
            var labels = [];
            /*eslint-disable no-loop-func*/
            for (var i = 0; i < conditions.length; i++) {
                var subLabels = jQuery.map(conditions[i].conditions, getLabel);
                labels = labels.concat(subLabels);
            }
            return sap.ushell.resources.i18n.getText("filtered_by", labels.join(', '));
        },

        sortConditions: function(conditions, facets) {
            var i;

            // helper for getting index
            var getIndex = function(attribute, value, list) {
                for (var i = 0; i < list.length; ++i) {
                    if (list[i][attribute] === value) {
                        return i;
                    }
                }
                return -1;
            };

            // helper for getting facet
            var getFacet = function(title, facets) {
                for (var i = 0; i < facets.length; ++i) {
                    if (facets[i].title === title) {
                        return facets[i];
                    }
                }
                return null;
            };

            // deep copy of conditions, we don't want to modify the original array
            var newConditions = [];
            for (i = 0; i < conditions.length; ++i) {
                newConditions.push(conditions[i].clone());
            }
            conditions = newConditions;

            // sort conditions
            conditions.sort(function(condition1, condition2) {
                return getIndex('title', condition1.label, facets) - getIndex('title', condition2.label, facets);
            });

            // sort subconditions (facet values) within conditions
            for (i = 0; i < conditions.length; ++i) {
                var condition = conditions[i];
                var facet = getFacet(condition.label, facets);
                if (!facet) {
                    continue;
                }
                condition.conditions.sort(function(condition1, condition2) {
                    return getIndex('label', condition1.label, facet.items) - getIndex('label', condition2.label, facet.items);
                }); // jshint ignore:line
            }
            return conditions;
        },

        renderer: 'sap.m.ToolbarRenderer',

        onAfterRendering: function() {
            var that = this;

            // don't have model until after rendering
            // attach press action
            that.resetButton.attachPress(function() {
                that.getModel().resetFilterConditions(true);
            });

            // add aria label
            var $filterText = jQuery('.sapUshellSearchFilterText');
            $filterText.attr('aria-label', sap.ushell.resources.i18n.getText("filtered_by_aria_label"));
        }
    });
});
