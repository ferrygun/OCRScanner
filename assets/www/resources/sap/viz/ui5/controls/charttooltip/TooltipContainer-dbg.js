/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */
sap.ui.define([
    'sap/ui/core/Control',
    './ContentPanel'
], function(
    Control,
    ContentPanel
) {
    "use strict";

    var TooltipContainer = Control.extend("sap.viz.ui5.controls.charttooltip.TooltipContainer", {
        metadata: {
            properties: {}
        },

        renderer: {
            render: function(oRm, oControl) {
                var sId = oControl.getId();
                oRm.write('<div');
                oRm.writeAttribute("id", sId);
                oRm.addClass("viz-controls-chartTooltip");
                oRm.writeClasses();
                oRm.write('>');
                oRm.renderControl(oControl._oPanel);
                oRm.write('</div>');
            }
        }
    });

    TooltipContainer.prototype.init = function() {
        this._oPanel = new ContentPanel();
    };

    TooltipContainer.prototype.setContent = function(data) {
        this._oPanel.setContent(data);
    };

    TooltipContainer.prototype.exit = function() {
        if (this._oPanel) {
            this._oPanel.destroy();
            this._oPanel = null;
        }
    };

    return TooltipContainer;
});
