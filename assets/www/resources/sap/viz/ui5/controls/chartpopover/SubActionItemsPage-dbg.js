/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */
sap.ui.define([
    'jquery.sap.global',
    'sap/ui/core/Control'
    ],
function(jQuery, Control) {

    var SubActionItemsPage = Control.extend('sap.viz.ui5.controls.chartpopover.SubActionItemsPage', {
        metadata : {
            properties : {
                items : {
                    type : 'sap.m.ListBase[]'
                }
            }
        },
        renderer : {
            render : function(oRm, oControl) {
                oRm.write('<div');
                oRm.addClass("viz-controls-chartPopover-subActionItemsPage");
                oRm.writeClasses();
                oRm.write('>');
                oRm.renderControl(oControl._oList);
                oRm.write('</div>');
            }
        }
    });

    SubActionItemsPage.prototype.init = function() {
        this._oList = new sap.m.List({
        });
    };
    
    SubActionItemsPage.prototype.onAfterRendering = function() {
        jQuery.sap.delayedCall(10, this, function(){
            this._oList.focus();
        });
    };

    SubActionItemsPage.prototype.exit = function() {
        if (this._oList) {
            this._oList.destroy();
            this._oList = null;
        }
    };

    SubActionItemsPage.prototype.setItems = function(items) {
        this._oList.removeAllItems();
        var item;
        for (var i = 0; i < items.length; i++) {
            item = new sap.m.ActionListItem({
                text : items[i].text,
                press : items[i].press ? items[i].press : function() {
                }
            });
            this._oList.addItem(item);
        }
    };

    SubActionItemsPage.prototype._createId = function(sId) {
        return this.getId() + "-" + sId;
    };
    
    return SubActionItemsPage;
});
