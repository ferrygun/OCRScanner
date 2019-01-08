/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */
sap.ui.define([
    'jquery.sap.global',
    'sap/m/Bar',
    'sap/m/Button',
    'sap/m/Label',
    'sap/ui/core/IconPool'
    ],
function(jQuery, Bar, Button, Label, IconPool) {

    var HeaderBar = Bar.extend('sap.viz.ui5.controls.chartpopover.HeaderBar', {
        metadata : {
            properties : {
                'showNavButton' : 'boolean',
                'title' : 'string'
            },
            publicMethods : [],
            events : {
                "navButtonPress" : {},
                "closeButtonPress" : {}
            }
        },
        renderer : {}
    });
    
    HeaderBar.prototype.getContentLeft = function() {
        if (!this._oNavButton) {
            this._oNavButton = new Button(this._createId("popoverNavButton"), {
                type : sap.m.ButtonType.Back,
                tooltip : sap.ui.getCore().getLibraryResourceBundle("sap.m").getText("PAGE_NAVBUTTON_TEXT"),
                press : jQuery.proxy(function() {
                    this.fireNavButtonPress();
                }, this)
            }).addStyleClass('viz-controls-chartPopover-backButton');
        }
        this._oNavButton.setVisible(this.getShowNavButton());
        this._oNavButton.onAfterRendering = function(){
            this.focus();
        }
        return [this._oNavButton];
    };

    HeaderBar.prototype.getContentMiddle = function() {
        if (!this._oTitleLabel) {
            this._oTitleLabel = new Label(this._createId('popoverHeaderTitle'));
            this.addAriaLabelledBy(this._oTitleLabel);
        }
        this._oTitleLabel.setText(this.getTitle());
        return [this._oTitleLabel];
    };

    HeaderBar.prototype.getContentRight = function() {
        if (!this._oCloseButton) {
            this._oCloseButton = new Button(this._createId("popoverCloseButton"), {
                icon : IconPool.getIconURI("decline"),
                tooltip : sap.ui.getCore().getLibraryResourceBundle("sap.m").getText("MESSAGEPOPOVER_CLOSE"),
                press : jQuery.proxy(function() {
                    this.fireCloseButtonPress();
                }, this)
            }).addStyleClass('viz-controls-chartPopover-closeButton');
        }
        return [this._oCloseButton];
    };
    
//    HeaderBar.prototype.onBeforeRendering = function () {
//        this.addAriaLabelledBy(this._oTitleLabel);
//    };
    
    HeaderBar.prototype.exit = function() {
        if (this._oCloseButton) {
            this._oCloseButton.destroy();
            this._oCloseButton = null;
        }

        if (this._oTitleLabel) {
            this._oTitleLabel.destroy();
            this._oTitleLabel = null;
        }

        if (this._oNavButton) {
            this._oNavButton.destroy();
            this._oNavButton = null;
        }
    };

    HeaderBar.prototype._createId = function(sId) {
        return this.getId() + "-" + sId;
    };
    
    return HeaderBar;
});
