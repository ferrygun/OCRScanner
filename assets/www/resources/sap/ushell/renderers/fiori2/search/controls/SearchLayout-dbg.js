sap.ui.define([], function() {
    "use strict";

    return sap.ui.layout.FixFlex.extend("sap.ushell.renderers.fiori2.search.controls.SearchLayout", {

        metadata: {
            properties: {
                isBusy: {
                    type: "boolean",
                    defaultValue: false
                },
                showFacets: {
                    type: "boolean",
                    defaultValue: false
                }
            },
            aggregations: {
                "resultListContainer": {
                    type: "sap.ui.core.Control",
                    multiple: false
                },
                "facets": {
                    type: "sap.ui.core.Control",
                    multiple: false
                },
                "busyIndicator": {
                    type: "sap.ui.core.Control",
                    multiple: false
                }
            }
        },

        init: function() {
            var that = this;
            sap.ui.layout.FixFlex.prototype.init.apply(this);

            var resultListScrollContainer = new sap.m.ScrollContainer({
                height: '100%',
                vertical: true
            });
            that.setFlexContent(resultListScrollContainer);
        },

        constructor: function(options, sId) {
            var that = this;
            sap.ui.layout.FixFlex.prototype.constructor.apply(this, [options], sId);

            that.setVertical(false);

            this.addEventDelegate({
                onAfterRendering: function() {
                    var $searchFacets = jQuery(".sapUiFixFlexFixed");
                    if (that.getShowFacets() && !sap.ui.Device.system.phone) {
                        $searchFacets.addClass('sapUshellSearchFacetPanelOpen');
                    } else {
                        $searchFacets.removeClass('sapUshellSearchFacetPanelOpen');
                    }
                }
            });
        },

        getFacets: function() {
            return this.getFixContent();
        },

        setFacets: function(oControl) {
            this.addFixContent(oControl);
        },

        getResultListContainer: function() {
            var resultListScrollContainer = this.getFlexContent();
            var content = resultListScrollContainer.getContent();
            if (content.length > 0) {
                return content[0];
            }
            return undefined;
        },

        setResultListContainer: function(oControl) {
            var resultListScrollContainer = this.getFlexContent();
            resultListScrollContainer.destroyContent();
            resultListScrollContainer.addContent(oControl);
        },

        setIsBusy: function(isBusy) {
            if (isBusy) {
                this.getBusyIndicator().open();
                this.busyFlag = true; // workaround for UI5 problem
            } else if (this.busyFlag) {
                this.getBusyIndicator().close();
                this.busyFlag = false;
            }
            this.setProperty("isBusy", isBusy, true);
        },

        setShowFacets: function(areFacetsShown) {
            var $searchFacets = jQuery(".sapUiFixFlexFixed");
            var $searchResultListContainer = jQuery(".sapUshellSearchResultListsContainer");

            if (!areFacetsShown) {
                $searchResultListContainer.removeClass("sapUshellSearchFacetPanelOpen");
                $searchFacets.removeClass("sapUshellSearchFacetPanelOpen");
                $searchFacets.attr("aria-hidden", "true");
            } else {
                $searchResultListContainer.addClass("sapUshellSearchFacetPanelOpen");
                $searchFacets.addClass("sapUshellSearchFacetPanelOpen");
                $searchFacets.attr("aria-hidden", "false");
            }

            var handleAnimationEnd = function(event) {
                //if (event.originalEvent.propertyName === 'width') {
                sap.ui.getCore().getEventBus().publish("searchLayoutChanged");
                //}
            };

            $searchFacets.one("transitionend", handleAnimationEnd);

            // the 3. parameter supress rerendering
            this.setProperty("showFacets", areFacetsShown, true); // this validates and stores the new value

            return this; // return "this" to allow method chaining
        },

        renderer: "sap.ui.layout.FixFlexRenderer"

    });

});
