sap.ui.define(['jquery.sap.global', 'sap/ui/core/Control', 'sap/ui/core/IconPool', 'sap/ushell/library' ],
function (jQuery, Control, IconPool) {
    "use strict";

    /**
     * Constructor for a new ToolAreaItem.
     *
     * @param {string} [sId] id for the new control, generated automatically if no id is given
     * @param {object} [mSettings] initial settings for the new control
     *
     * @class
     * A control to be placed in the tool area
     * @extends sap.ui.core.Control
     *
     * @version 1.52.4
     *
     * @constructor
     * @public
     * @since 1.30.5
     *
     * @alias sap.ushell.ui.shell.ToolAreaItem
     */

    var ToolAreaItem = Control.extend("sap.ushell.ui.shell.ToolAreaItem", /** @lends sap.ushell.ui.shell.ShellHeadItem.prototype */ {
        metadata : {

        properties : {

            /**
             * Icon that is displayed in the item.
             */
            icon : {type : "sap.ui.core.URI", group : "Appearance", defaultValue : null},

            /**
             * Defines whether to mark the control as selected
             */
            selected : {type : "boolean", group : "Appearance", defaultValue : false},

            text: {type : "string", group : "Appearance", defaultValue : null},

            /**
             * Text  which will be read by screenreader.
             * @since 1.30
             * @private
             */
            ariaLabel : {type : "string", group : "Appearance", defaultValue : null},

            /**
             * Defines whether to display the control
             */
            visible : {type : "boolean", group : "Appearance", defaultValue : true},

            /**
             * Defines whether the control will have an expand functionality containing sub-items or actions.
             * If the property is set to true, a small "expand" icon appears in the lower corner of the control.
             * The "expand" event is fired when the "expand" icon is pressed.
             */
            expandable : {type : "boolean", group : "Appearance", defaultValue : false}
        },
        events : {

            /**
             * Event is fired when the user presses the item.
             */
            press : {},
            /**
             * Event is fired when the user presses the Expand icon.
             */
            expand : {}
        }
    },
        renderer: {
            render: function (rm, oToolAreaItem) {
                var oIcon;

                rm.write("<div");

                rm.writeControlData(oToolAreaItem);
                if (!oToolAreaItem.getIcon()) {
                    rm.addClass("sapUshellToolAreaItmTextOnly");
                } else {
                    rm.addClass("sapUshellToolAreaItm");
                }

                if (!oToolAreaItem.getVisible()) {
                    rm.addClass("sapUshellShellHidden");
                }
                if (oToolAreaItem.getAriaLabel()) {
                    //Handle Aria Label rendering
                    rm.writeAccessibilityState({
                        label: this.getAriaLabel(),
                        role: "button"
                    });
                }
                rm.writeClasses();
                var tooltip = oToolAreaItem.getTooltip_AsString();
                if (tooltip) {
                    rm.writeAttributeEscaped("title", tooltip);
                }
                rm.write(">");
                if (oToolAreaItem.getIcon()) {
                    oIcon = IconPool.createControlByURI(oToolAreaItem.getIcon());
                    oIcon.setUseIconTooltip(false);
                    oIcon.addStyleClass("sapUshellToolAreaItemIcon");
                    rm.renderControl(oIcon);
                }

                if  (oToolAreaItem.getText()) {
                    rm.write("<span");
                    rm.addClass("sapUshellToolAreaItemText");
                    rm.writeClasses();
                    rm.write(">");
                    rm.writeEscaped(oToolAreaItem.getText());
                    rm.write("</span>");
                }

                if (oToolAreaItem.getExpandable()) {
                    this.renderExpandable(rm);
                }
                rm.write("</div>");

            },

            renderExpandable: function(rm) {
                var oIcon = IconPool.createControlByURI("sap-icon://icon-dropdown");
                oIcon.addStyleClass("sapUshellToolAreaItemExpandable");
                rm.renderControl(oIcon);
            }

        }
    });

    ToolAreaItem.prototype.onclick = function (oEvent) {

        if (this.$().parent().hasClass("sapUshellToolAreaItemSelected")) {
            this.setSelected(false);
        } else {
            this.setSelected(true);
        }
        if (oEvent.target.className.indexOf("sapUshellToolAreaItemExpandable") > 0) {
            this.fireExpand();

        } else {
            this.firePress();
        }

    };

    ToolAreaItem.prototype.onsapenter = ToolAreaItem.prototype.onclick;

    ToolAreaItem.prototype.setExpandable = function (bExpandable) {
        bExpandable = !!bExpandable;
        this.setProperty("expandable", bExpandable, true);
        this.$().toggleClass("sapUshellToolAreaItemExpandable", bExpandable);
    };

    ToolAreaItem.prototype.setSelected = function (bSelected) {
        bSelected = !!bSelected;
        if (bSelected) {
            var jqSelected = jQuery(".sapUshellToolAreaItemSelected");
            jqSelected.each( function () {
                jQuery(this).removeClass("sapUshellToolAreaItemSelected");
            });
        }
        this.setProperty("selected", bSelected, true);
        this.$().parent().toggleClass("sapUshellToolAreaItemSelected", bSelected);
    };

    ToolAreaItem.prototype.setVisible = function (bVisible) {
        var bRendered = this.getParent().getDomRef();
        this.setProperty("visible", !!bVisible, bRendered);
        this.$().toggleClass("sapUshellShellHidden", !bVisible);


    };

    ToolAreaItem.prototype.setAriaLabel = function (sAriaLabel) {
        this.setProperty('ariaLabel', sAriaLabel);
        return this;
    };

    return ToolAreaItem;

}, true);
