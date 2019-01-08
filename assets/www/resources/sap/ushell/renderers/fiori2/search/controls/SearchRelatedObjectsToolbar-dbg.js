// iteration 0 : Holger
/* global sap,window,$,jQuery */

sap.ui.define([], function() {
    "use strict";

    return sap.ui.core.Control.extend("sap.ushell.renderers.fiori2.search.controls.SearchRelatedObjectsToolbar", {
        metadata: {
            properties: {
                navigationObjects: {
                    type: "object",
                    multiple: true
                }
            }
        },

        renderer: function(oRm, oControl) {
            oRm.write("<div");
            oRm.writeControlData(oControl); // writes the Control ID
            oRm.addClass("sapUshellSearchResultListItem-RelatedObjectsToolbar");
            oRm.writeClasses();
            oRm.write(">");

            oControl._renderToolbar(oRm);

            oRm.write("</div>");
        },

        _renderToolbar: function(oRm) {
            var that = this;
            var i;

            var createPressHandler = function(navigationObject) {
                return function() {
                    navigationObject.trackNavigation();
                };
            };

            var navigationObjects = that.getNavigationObjects();

            if (navigationObjects.length > 0) {

                var navigationObjectsLinks = [];
                for (i = 0; i < navigationObjects.length; i++) {
                    var navigationObject = navigationObjects[i];
                    var link = new sap.m.Link({
                        text: navigationObject.getText(),
                        href: navigationObject.getHref(),
                        layoutData: new sap.m.ToolbarLayoutData({
                            shrinkable: false
                        }),
                        press: createPressHandler(navigationObject)
                    });
                    var target = navigationObject.getTarget();
                    if (target) {
                        link.setTarget(target);
                    }
                    link.addStyleClass("sapUshellSearchResultListItem-RelatedObjectsToolbar-Element");
                    navigationObjectsLinks.push(link);
                }

                var toolbarContent = [];

                var toolbarSpacer = new sap.m.ToolbarSpacer();
                toolbarContent.push(toolbarSpacer);

                for (i = 0; i < navigationObjectsLinks.length; i++) {
                    toolbarContent.push(navigationObjectsLinks[i]);
                }

                that.overFlowButton = new sap.m.Button({
                    icon: sap.ui.core.IconPool.getIconURI("overflow")
                });
                that.overFlowButton.addStyleClass("sapUshellSearchResultListItem-RelatedObjectsToolbar-OverFlowButton");
                toolbarContent.push(that.overFlowButton);

                that.overFlowSheet = new sap.m.ActionSheet({
                    placement: sap.m.PlacementType.Top
                });

                that.overFlowButton.attachPress(function() {
                    that.overFlowSheet.openBy(that.overFlowButton);
                });

                that.relatedObjectActionsToolbar = new sap.m.Toolbar({
                    design: sap.m.ToolbarDesign.Solid,
                    content: toolbarContent
                });

                // define group for F6 handling
                that.relatedObjectActionsToolbar.data("sap-ui-fastnavgroup", "false", true /* write into DOM */ );

                that.relatedObjectActionsToolbar.addStyleClass("sapUshellSearchResultListItem-RelatedObjectsToolbar-Toolbar");

                oRm.renderControl(that.relatedObjectActionsToolbar);
            }
        },





        // after rendering
        // ===================================================================
        onAfterRendering: function() {
            var that = this;

            if (that.overFlowButton) {
                var $overFlowButton = $(that.overFlowButton.getDomRef());
                $overFlowButton.css("display", "none");
            }

            $(window).on("resize", function() {
                that._layoutToolbarElements();
            });

            that._layoutToolbarElements();
        },



        _layoutToolbarElements: function() {
            var that = this;

            if (!(that.getDomRef() && that.relatedObjectActionsToolbar.getDomRef())) {
                return;
            }

            var $toolbar = $(that.relatedObjectActionsToolbar.getDomRef());
            var toolbarWidth = $toolbar.innerWidth();

            if (toolbarWidth === 0 || (that.toolbarWidth && that.toolbarWidth === toolbarWidth)) {
                return;
            }

            if ($(that.getDomRef()).css("display") === "none" || $toolbar.css("display") === "none") {
                return;
            }

            that.toolbarWidth = toolbarWidth;

            var $overFlowButton = $(that.overFlowButton.getDomRef());
            $overFlowButton.css("display", "none");

            var toolbarElementsWidth = 0;

            var pressButton = function(event, _navigationObject) {
                _navigationObject.performNavigation();
            };

            var $toolbarElements = $toolbar.find(".sapUshellSearchResultListItem-RelatedObjectsToolbar-Element");
            for (var i = 0; i < $toolbarElements.length; i++) {
                var $element = $($toolbarElements[i]);
                $element.css("display", "");
                var _toolbarElementsWidth = toolbarElementsWidth + $element.outerWidth(true);

                if (_toolbarElementsWidth > toolbarWidth) {
                    if (i < $toolbarElements.length) {
                        $overFlowButton.css("display", "");
                        var overFlowButtonWidth = $overFlowButton.outerWidth(true);

                        for (; i >= 0; i--) {
                            $element = $($toolbarElements[i]);
                            _toolbarElementsWidth -= $element.outerWidth(true);
                            if (_toolbarElementsWidth + overFlowButtonWidth <= toolbarWidth) {
                                break;
                            }
                        }
                    }

                    var navigationObjects = that.getNavigationObjects();
                    that.overFlowSheet.destroyButtons();

                    for (; i < $toolbarElements.length; i++) {
                        $element = $($toolbarElements[i]);
                        $element.css("display", "none");

                        var navigationObject = navigationObjects[i];

                        var button = new sap.m.Button({
                            text: navigationObject.getText()
                        });
                        button.attachPress(navigationObject, pressButton);
                        that.overFlowSheet.addButton(button);
                    }
                    break;
                }
                toolbarElementsWidth = _toolbarElementsWidth;
            }

            that._setupItemNavigation();
        },


        _setupItemNavigation: function() {
            var that = this;

            if (!that.theItemNavigation) {
                that.theItemNavigation = new sap.ui.core.delegate.ItemNavigation();
                that.addDelegate(that.theItemNavigation);
            }
            that.theItemNavigation.setCycling(false);
            that.theItemNavigation.setRootDomRef(that.getDomRef());
            var itemDomRefs = [];
            var content = that.relatedObjectActionsToolbar.getContent();
            for (var i = 0; i < content.length; i++) {
                if (!content[i].hasStyleClass("sapUshellSearchResultListItem-RelatedObjectsToolbar-Element")) {
                    continue;
                }
                if (!$(content[i].getDomRef()).attr("tabindex")) {
                    var tabindex = "-1";
                    if (content[i].getPressed && content[i].getPressed()) {
                        tabindex = "0";
                    }
                    $(content[i].getDomRef()).attr("tabindex", tabindex);
                }
                itemDomRefs.push(content[i].getDomRef());
            }

            var _overflowButton = that.overFlowButton.getDomRef();
            itemDomRefs.push(_overflowButton);
            $(_overflowButton).attr("tabindex", "-1");

            that.theItemNavigation.setItemDomRefs(itemDomRefs);
        }
    });

});
