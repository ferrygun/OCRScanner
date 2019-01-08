// iteration 0 : Holger
/* global sap,window,$, jQuery */

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/controls/SearchText',
    'sap/ushell/renderers/fiori2/search/controls/SearchLink',
    'sap/ushell/renderers/fiori2/search/SearchHelper',
    'sap/ushell/renderers/fiori2/search/controls/SearchRelatedObjectsToolbar'
], function(SearchText, SearchLink, SearchHelper, SearchRelatedObjectsToolbar) {
    "use strict";

    var noValue = '\u2013'; // dash

    return sap.ui.core.Control.extend("sap.ushell.renderers.fiori2.search.controls.SearchResultListItem", {
        // the control API:
        metadata: {
            properties: {
                title: "string",
                titleUrl: "string",
                titleNavigation: "object",
                type: "string",
                imageUrl: "string",
                suvlink: "string",
                containsThumbnail: "boolean",
                containsSuvFile: "boolean",
                attributes: {
                    type: "object",
                    multiple: true
                },
                navigationObjects: {
                    type: "object",
                    multiple: true
                },
                selected: "boolean",
                expanded: "boolean",
                parentListItem: "object"
            },
            aggregations: {
                _titleLink: {
                    type: "sap.ushell.renderers.fiori2.search.controls.SearchLink",
                    multiple: false,
                    visibility: "hidden"
                },
                _typeText: {
                    type: "sap.ushell.renderers.fiori2.search.controls.SearchText",
                    multiple: false,
                    visibility: "hidden"
                },
                _selectionCheckBox: {
                    type: "sap.m.CheckBox",
                    multiple: false,
                    visibility: "hidden"
                },
                _expandButton: {
                    type: "sap.m.Button",
                    multiple: false,
                    visibility: "hidden"
                },
                _attributeLabels: {
                    type: "sap.m.Label",
                    multiple: true,
                    visibility: "hidden"
                },
                _attributeValues: {
                    type: "sap.ushell.renderers.fiori2.search.controls.SearchText",
                    multiple: true,
                    visibility: "hidden"
                },
                _attributeValuesWithoutWhyfoundHiddenTexts: {
                    type: "sap.ui.core.InvisibleText",
                    multiple: true,
                    visibility: "hidden"
                },
                _relatedObjectActionsToolbar: {
                    type: "sap.ushell.renderers.fiori2.search.controls.SearchRelatedObjectsToolbar",
                    multiple: false,
                    visibility: "hidden"
                },
                _titleLabeledByText: {
                    type: "sap.ui.core.InvisibleText",
                    multiple: false,
                    visibility: "hidden"
                }
            }
        },

        init: function() {
            var that = this;

            that.setAggregation("_titleLink", new SearchLink({})
                .addStyleClass("sapUshellSearchResultListItem-Title")
                .addStyleClass("sapUshellSearchResultListItem-MightOverflow")
                .attachPress(function(oEvent) {
                    var phoneSize = that._getPhoneSize();
                    var windowWidth = $(window).width();
                    if (windowWidth <= phoneSize) {
                        oEvent.preventDefault();
                    } else {
                        that._performOrTrackTitleNavigation(true);
                    }
                }));

            that.setAggregation("_typeText", new SearchText()
                .addStyleClass("sapUshellSearchResultListItem-Category")
                .addStyleClass("sapUshellSearchResultListItem-MightOverflow"));

            that.setAggregation("_selectionCheckBox", new sap.m.CheckBox({
                select: function(oEvent) {
                    that.setProperty("selected", oEvent.getParameters().selected, true /*no re-rendering needed, change originates in HTML*/ ); //see section Properties for explanation
                }
            }));

            that.setAggregation("_expandButton", new sap.m.Button({
                type: sap.m.ButtonType.Transparent,
                press: function(oEvent) {
                    that.toggleDetails();
                }
            }));

            that.setAggregation("_relatedObjectActionsToolbar", new SearchRelatedObjectsToolbar()
                .addStyleClass("sapUshellSearchResultListItem-RelatedObjectsToolbar"));

            that.setAggregation("_titleLabeledByText", new sap.ui.core.InvisibleText());
        },

        renderer: function(oRm, oControl) { // static function, so use the given "oControl" instance instead of "this" in the renderer function
            oControl._renderer(oRm);
        },

        // the part creating the HTML:
        _renderer: function(oRm) {

            this._resetPrecalculatedValues();
            this._renderContainer(oRm);
            this._renderAccessibilityInformation(oRm);
        },

        _renderContainer: function(oRm) {
            var that = this;

            oRm.write('<div');
            oRm.writeControlData(that); // writes the Control ID
            oRm.addClass("sapUshellSearchResultListItem-Container");
            oRm.writeClasses(); // this call writes the above class plus enables support for Square.addStyleClass(...)
            //             oRm.write(' tabindex="0"');
            oRm.write('>');

            that._renderContentContainer(oRm);
            that._renderExpandButtonContainer(oRm);

            oRm.write('</div>');
        },


        _renderContentContainer: function(oRm) {
            oRm.write('<div class="sapUshellSearchResultListItem-Content">');

            this._renderTitleContainer(oRm);
            this._renderAttributesContainer(oRm);

            oRm.write('</div>');
        },

        _renderExpandButtonContainer: function(oRm) {
            var that = this;

            oRm.write('<div class="sapUshellSearchResultListItem-ExpandButtonContainer">');

            //             oRm.write('<div class="sapUshellSearchResultListItem-ExpandButton" role="button" onClick="toggleExpand(\'ResultListItem01\')" tabindex="0"></div>');
            //             oRm.write('<div class="sapUshellSearchResultListItem-ExpandButton sapUiSizeXXCompact">');
            oRm.write('<div class="sapUshellSearchResultListItem-ExpandButton">');

            var icon, tooltip;
            var expanded = that.getProperty("expanded");
            if (expanded) {
                icon = sap.ui.core.IconPool.getIconURI("slim-arrow-up");
                tooltip = sap.ushell.resources.i18n.getText("hideDetailBtn_tooltip");
            } else {
                icon = sap.ui.core.IconPool.getIconURI("slim-arrow-down");
                tooltip = sap.ushell.resources.i18n.getText("showDetailBtn_tooltip");
            }

            var expandButton = that.getAggregation("_expandButton");
            expandButton.setIcon(icon);
            expandButton.setTooltip(tooltip);

            expandButton.onAfterRendering = function() {
                sap.m.Button.prototype.onAfterRendering.apply(this, arguments);

                that.setAriaExpandedState();
            };

            oRm.renderControl(expandButton);

            oRm.write('</div>');
            oRm.write('</div>');
        },


        _renderTitleContainer: function(oRm) {
            var that = this;

            oRm.write('<div class="sapUshellSearchResultListItem-TitleAndImageContainer">');
            oRm.write('<div class="sapUshellSearchResultListItem-TitleContainer">');

            that._renderCheckbox(oRm);

            /// /// Title
            var titleUrl = "";
            var target;
            var titleNavigation = that.getTitleNavigation();
            if (titleNavigation) {
                titleUrl = titleNavigation.getHref();
                target = titleNavigation.getTarget();
            }
            var titleLink = that.getAggregation("_titleLink");
            titleLink.setHref(titleUrl);
            titleLink.setText(that.getTitle());
            if (target) {
                titleLink.setTarget(target);
            }

            if (titleUrl.length === 0) {
                titleLink.setEnabled(false);
            }

            oRm.renderControl(titleLink);

            /// /// Object Type
            var typeText = that.getAggregation("_typeText");
            typeText.setText(that.getType());
            oRm.renderControl(typeText);

            oRm.write('</div>');

            that._renderImageForPhone(oRm);

            oRm.write('</div>');
        },

        _renderCheckbox: function(oRm) {
            var that = this;
            oRm.write('<div class="sapUshellSearchResultListItem-CheckboxExpandContainer">');
            oRm.write('<div class="sapUshellSearchResultListItem-CheckboxContainer">');
            oRm.write('<div class="sapUshellSearchResultListItem-CheckboxAlignmentContainer">');

            var checkbox = that.getAggregation("_selectionCheckBox");
            var selected = that.getProperty("selected");
            checkbox.setSelected(selected);
            oRm.renderControl(checkbox);

            oRm.write('</div>');
            oRm.write('</div>');
            oRm.write('</div>');
        },


        _renderImageForPhone: function(oRm) {
            var that = this;
            if (that.getImageUrl()) {

                oRm.write('<div class="sapUshellSearchResultListItem-TitleImage">');

                oRm.write('<div class="sapUshellSearchResultListItem-ImageContainerAlignmentHelper"></div>');

                oRm.write('<img class="sapUshellSearchResultListItem-Image" src="');
                oRm.write(that.getImageUrl());
                oRm.write('">');

                oRm.write('</div>');
            }
        },

        _renderAttributesContainer: function(oRm) {
            var that = this;

            oRm.write('<div class="sapUshellSearchResultListItem-AttributesExpandContainer');

            var expanded = that.getProperty("expanded");
            if (expanded) {
                oRm.write(" sapUshellSearchResultListItem-AttributesExpanded");
            }

            oRm.write('">');
            oRm.write('<div class="sapUshellSearchResultListItem-AttributesAndActions">');
            oRm.write('<ul class="sapUshellSearchResultListItem-Attributes">');

            that._renderImageAttribute(oRm);

            var itemAttributes = that.getAttributes();
            that._renderAllAttributes(oRm, itemAttributes);

            // This is just a dummie attribute to store additional space information for the expand and collapse JavaScript function
            oRm.write('<li class="sapUshellSearchResultListItem-ExpandSpacerAttribute" aria-hidden="true"></li>');

            oRm.write('</ul>');

            that._renderRelatedObjectsToolbar(oRm);


            oRm.write('</div>');
            oRm.write('</div>');
        },



        // render Attributes
        // ===================================================================
        _renderAllAttributes: function(oRm, itemAttributes) {
            var that = this;

            var itemAttribute;
            var labelText;
            var valueText;
            var valueWithoutWhyfound;
            var label, value;
            var hiddenValueText;

            // skip first attribute which is the title attribute for the table
            var i = 0,
                j = 0;
            var numberOfMainAttributes = 12;
            if (that.getImageUrl()) {
                numberOfMainAttributes--;
            }

            that.destroyAggregation("_attributeLabels");
            that.destroyAggregation("_attributeValues");
            that.destroyAggregation("_attributeValuesWithoutWhyfoundHiddenTexts");

            for (; j < numberOfMainAttributes && i < itemAttributes.length; i++) {
                itemAttribute = itemAttributes[i];

                if (itemAttribute.isTitle) {
                    continue;
                }

                labelText = itemAttribute.name;
                valueText = itemAttribute.value;
                valueWithoutWhyfound = itemAttribute.valueWithoutWhyfound;
                if (labelText === undefined || valueText === undefined) {
                    continue;
                }
                if (!valueText || valueText === "") {
                    valueText = noValue;
                }

                oRm.write('<li class="sapUshellSearchResultListItem-GenericAttribute sapUshellSearchResultListItem-MainAttribute">');

                label = new sap.m.Label({
                    displayOnly: true
                });
                label.setText(labelText);
                label.addStyleClass("sapUshellSearchResultListItem-AttributeKey");
                label.addStyleClass("sapUshellSearchResultListItem-MightOverflow");
                oRm.renderControl(label);

                value = new SearchText();
                value.setText(valueText);
                value.addStyleClass("sapUshellSearchResultListItem-AttributeValue");
                value.addStyleClass("sapUshellSearchResultListItem-MightOverflow");
                if (valueWithoutWhyfound) {
                    // for attribute values with why-found information, use the raw value information (without why-found-tags) for tooltip and ARIA description
                    hiddenValueText = new sap.ui.core.InvisibleText({});
                    hiddenValueText.setText(valueWithoutWhyfound);
                    value.data("tooltippedBy", hiddenValueText.getId(), true);
                    value.onAfterRendering = function() {
                        SearchText.prototype.onAfterRendering.apply(this, arguments);
                        var $this = $(this.getDomRef());
                        $this.attr("aria-describedby", $this.attr("data-tooltippedby"));
                    }
                    that.addAggregation("_attributeValuesWithoutWhyfoundHiddenTexts", hiddenValueText, true /* do not invalidate this object */ );
                    oRm.renderControl(hiddenValueText);
                }
                oRm.renderControl(value);

                oRm.write('</li>');

                that.addAggregation("_attributeLabels", label, true /* do not invalidate this object */ );
                that.addAggregation("_attributeValues", value, true /* do not invalidate this object */ );

                j++;
            }

            var hasWhyFoundAttributes = false;
            for (; i < itemAttributes.length; i++) {
                itemAttribute = itemAttributes[i];

                if (!itemAttribute.whyfound) {
                    continue;
                }

                labelText = itemAttribute.name;
                valueText = itemAttribute.value;
                valueWithoutWhyfound = itemAttribute.valueWithoutWhyfound;
                if (labelText === undefined || valueText === undefined) {
                    continue;
                }
                if (!valueText || valueText === "") {
                    valueText = noValue;
                }

                oRm.write('<li class="sapUshellSearchResultListItem-GenericAttribute sapUshellSearchResultListItem-WhyFoundAttribute">');

                label = new sap.m.Label({
                    displayOnly: true
                });
                label.setText(labelText);
                label.addStyleClass("sapUshellSearchResultListItem-AttributeKey");
                label.addStyleClass("sapUshellSearchResultListItem-MightOverflow");
                oRm.renderControl(label);

                value = new SearchText();
                value.setText(valueText);
                value.addStyleClass("sapUshellSearchResultListItem-AttributeValue");
                value.addStyleClass("sapUshellSearchResultListItem-MightOverflow");
                if (valueWithoutWhyfound) {
                    // for attribute values with why-found information, use the raw value information (without why-found-tags) for tooltip and ARIA description
                    hiddenValueText = new sap.ui.core.InvisibleText({});
                    hiddenValueText.setText(valueWithoutWhyfound);
                    value.data("tooltippedBy", hiddenValueText.getId(), true);
                    value.onAfterRendering = function() {
                        SearchText.prototype.onAfterRendering.apply(this, arguments);
                        var $this = $(this.getDomRef());
                        $this.attr("aria-describedby", $this.attr("data-tooltippedby"));
                    }
                    that.addAggregation("_attributeValuesWithoutWhyfoundHiddenTexts", hiddenValueText, true /* do not invalidate this object */ );
                    oRm.renderControl(hiddenValueText);
                }
                oRm.renderControl(value);

                oRm.write('</li>');

                that.addAggregation("_attributeLabels", label, true /* do not invalidate this object */ );
                that.addAggregation("_attributeValues", value, true /* do not invalidate this object */ );

                hasWhyFoundAttributes = true;
            }

            if (hasWhyFoundAttributes) {
                // Used for adding a line break between the main attributes and any additional why found attributes
                oRm.write('<li class="sapUshellSearchResultListItem-GenericAttribute sapUshellSearchResultListItem-WhyFoundSpacerAttribute" aria-hidden="true"></li>');
            }
        },


        _renderImageAttribute: function(oRm) {
            var that = this;

            if (!that.getImageUrl()) {
                return;
            }

            oRm.write('<div class="sapUshellSearchResultListItem-GenericAttribute sapUshellSearchResultListItem-ImageAttribute');
            if (!that.getImageUrl()) {
                oRm.write(' sapUshellSearchResultListItem-ImageAttributeHidden');
            }
            oRm.write('">');
            oRm.write('<div class="sapUshellSearchResultListItem-ImageContainer">');

            if (that.getImageUrl()) {
                oRm.write('<img class="sapUshellSearchResultListItem-Image" src="');
                oRm.write(that.getImageUrl());
                oRm.write('">');
            }

            oRm.write('<div class="sapUshellSearchResultListItem-ImageContainerAlignmentHelper"></div>');
            oRm.write('</div>');
            oRm.write('</div>');
        },


        // render Related Objects Toolbar
        // ===================================================================
        _renderRelatedObjectsToolbar: function(oRm) {
            var that = this;

            var navigationObjects = that.getNavigationObjects();

            if (!navigationObjects || navigationObjects.length === 0) {
                return;
            }

            that._showExpandButton = true;

            var relatedObjectActionsToolbar = that.getAggregation("_relatedObjectActionsToolbar");
            relatedObjectActionsToolbar.setProperty("navigationObjects", navigationObjects);

            oRm.renderControl(relatedObjectActionsToolbar);
        },

        _renderAccessibilityInformation: function(oRm) {
            var that = this;

            var parentListItem = that.getProperty("parentListItem");
            if (parentListItem) {

                var labelText = that.getTitle() + ", " + that.getType();

                var titleLabeledByText = that.getAggregation("_titleLabeledByText");
                titleLabeledByText.setText(labelText);

                oRm.renderControl(titleLabeledByText);
                //                 this.addDependent(titleLabeledByText.toStatic());
                //                 parentListItem.addAriaLabelledBy(titleLabeledByText);
                parentListItem.onAfterRendering = function() {
                    sap.m.CustomListItem.prototype.onAfterRendering.apply(this, arguments);
                    var $this = $(this.getDomRef());
                    $this.attr("aria-labelledby", titleLabeledByText.getId());
                };

                parentListItem.addEventDelegate({
                    onsapspace: function(oEvent) {
                        if (oEvent.target === oEvent.currentTarget) {
                            that.toggleDetails();
                        }
                    },
                    onsapenter: function(oEvent) {
                        if (oEvent.target === oEvent.currentTarget) {
                            var titleNavigation = that.getTitleNavigation();
                            if (titleNavigation) {
                                titleNavigation.performNavigation();
                            }
                        }
                    }
                });
            }
        },

        _getExpandAreaObjectInfo: function() {
            var that = this;

            var resultListItem = $(that.getDomRef());

            var attributesExpandContainer = resultListItem.find(".sapUshellSearchResultListItem-AttributesExpandContainer");
            var relatedObjectsToolbar = resultListItem.find(".sapUshellSearchResultListItem-RelatedObjectsToolbar");

            var relatedObjectsToolbarHidden = false;
            if (relatedObjectsToolbar.css("display") === "none") {
                relatedObjectsToolbar.css("display", "block");
                relatedObjectsToolbarHidden = true;
            }

            var currentHeight = attributesExpandContainer.height();
            var expandedHeight = resultListItem.find(".sapUshellSearchResultListItem-AttributesAndActions").height();

            if (relatedObjectsToolbarHidden) {
                relatedObjectsToolbar.css("display", "");
            }

            var elementsToFadeInOrOut = [];
            resultListItem.find(".sapUshellSearchResultListItem-GenericAttribute").each(function() {
                var element = $(this);
                if (element.css("order") > 2) {
                    elementsToFadeInOrOut.push(this);
                }
            });

            var expandAnimationDuration = 200;
            var fadeInOrOutAnimationDuration = expandAnimationDuration / 10;



            var expandAreaObjectInfo = {
                resultListItem: resultListItem,
                attributesExpandContainer: attributesExpandContainer,
                currentHeight: currentHeight,
                expandedHeight: expandedHeight,
                elementsToFadeInOrOut: elementsToFadeInOrOut,
                expandAnimationDuration: expandAnimationDuration,
                fadeInOrOutAnimationDuration: fadeInOrOutAnimationDuration,
                relatedObjectsToolbar: relatedObjectsToolbar
            };

            return expandAreaObjectInfo;
        },



        isShowingDetails: function() {
            var expandAreaObjectInfo = this._getExpandAreaObjectInfo();

            /////////////////////////////
            // Expand Result List Item
            if (expandAreaObjectInfo.currentHeight < expandAreaObjectInfo.expandedHeight) {
                return false;
            }
            return true;
        },



        showDetails: function(animated) {
            var that = this;

            if (that.isShowingDetails()) {
                return;
            }

            var expandAreaObjectInfo = this._getExpandAreaObjectInfo();

            expandAreaObjectInfo.relatedObjectsToolbar.css("display", "block");

            var relatedObjectActionsToolbar = that.getAggregation("_relatedObjectActionsToolbar");
            if (relatedObjectActionsToolbar) {
                relatedObjectActionsToolbar._layoutToolbarElements();
            }

            expandAreaObjectInfo.attributesExpandContainer.animate({
                    "height": expandAreaObjectInfo.expandedHeight
                },
                expandAreaObjectInfo.expandAnimationDuration,
                function() {
                    that.setProperty("expanded", true, true);

                    //                     $(this).css("height", "auto");
                    $(this).addClass("sapUshellSearchResultListItem-AttributesExpanded");
                    $(this).css("height", "");
                    $(expandAreaObjectInfo.elementsToFadeInOrOut).css("opacity", "");

                    var iconArrowUp = sap.ui.core.IconPool.getIconURI("slim-arrow-up");
                    var expandButton = that.getAggregation("_expandButton");
                    expandButton.setTooltip(sap.ushell.resources.i18n.getText("hideDetailBtn_tooltip"));
                    expandButton.setIcon(iconArrowUp);
                    expandButton.rerender();

                    expandAreaObjectInfo.relatedObjectsToolbar.css("display", "");
                }
            );

            $(expandAreaObjectInfo.elementsToFadeInOrOut).animate({
                    "opacity": 1
                },
                expandAreaObjectInfo.fadeInOrOutAnimationDuration
            );
        },



        hideDetails: function(animated) {
            var that = this;
            var resultListItem = $(that.getDomRef());

            if (!that.isShowingDetails()) {
                return;
            }

            var expandAreaObjectInfo = this._getExpandAreaObjectInfo();

            var attributeHeight = resultListItem.find(".sapUshellSearchResultListItem-MainAttribute").outerHeight(true) + resultListItem.find(".sapUshellSearchResultListItem-ExpandSpacerAttribute").outerHeight(true);
            var secondAnimationStarted = false;
            var deferredAnimation01 = expandAreaObjectInfo.attributesExpandContainer.animate({
                "height": attributeHeight
            }, {
                "duration": expandAreaObjectInfo.expandAnimationDuration,
                "progress": function(animation, progress, remainingMs) {
                    if (!secondAnimationStarted && remainingMs <= expandAreaObjectInfo.fadeInOrOutAnimationDuration) {
                        secondAnimationStarted = true;
                        var deferredAnimation02 = $(expandAreaObjectInfo.elementsToFadeInOrOut).animate({
                                "opacity": 0
                            },
                            expandAreaObjectInfo.fadeInOrOutAnimationDuration
                        ).promise();

                        jQuery.when(deferredAnimation01, deferredAnimation02).done(function() {
                            that.setProperty("expanded", false, true);

                            expandAreaObjectInfo.attributesExpandContainer.removeClass("sapUshellSearchResultListItem-AttributesExpanded");
                            $(expandAreaObjectInfo.elementsToFadeInOrOut).css("opacity", "");

                            var iconArrowDown = sap.ui.core.IconPool.getIconURI("slim-arrow-down");
                            var expandButton = that.getAggregation("_expandButton");
                            expandButton.setTooltip(sap.ushell.resources.i18n.getText("showDetailBtn_tooltip"));
                            expandButton.setIcon(iconArrowDown);
                            expandButton.rerender();
                        });
                    }
                }
            }).promise();
        },



        toggleDetails: function(animated) {
            if (this.isShowingDetails()) {
                this.hideDetails(animated);
            } else {
                this.showDetails(animated);
            }
        },



        isSelectionModeEnabled: function() {
            var that = this;
            var isSelectionModeEnabled = false;
            var selectionBoxContainer = $(that.getDomRef()).find(".sapUshellSearchResultListItem-multiSelect-selectionBoxContainer");
            if (selectionBoxContainer) {
                isSelectionModeEnabled = selectionBoxContainer.css("opacity") > 0;
            }
            return isSelectionModeEnabled;
        },



        enableSelectionMode: function(animated) {
            var that = this;
            var selectionBoxOuterContainer = $(that.getDomRef()).find(".sapUshellSearchResultListItem-multiSelect-innerContainer");
            var selectionBoxInnerContainer = selectionBoxOuterContainer.find(".sapUshellSearchResultListItem-multiSelect-selectionBoxContainer");

            var duration = 200; // aka 'fast'
            var secondAnimationStarted = false;
            selectionBoxOuterContainer.animate({
                width: "2rem"
            }, {
                "duration": duration,
                "progress": function(animation, progress, remainingMs) {
                    if (!secondAnimationStarted && progress > 0.5) {
                        selectionBoxInnerContainer.css("display", "");
                        selectionBoxInnerContainer.animate({
                            opacity: "1.0"
                        }, duration / 2);
                        secondAnimationStarted = true;
                    }
                }
            });
        },



        disableSelectionMode: function(animated) {
            var that = this;
            var selectionBoxOuterContainer = $(that.getDomRef()).find(".sapUshellSearchResultListItem-multiSelect-innerContainer");
            var selectionBoxInnerContainer = selectionBoxOuterContainer.find(".sapUshellSearchResultListItem-multiSelect-selectionBoxContainer");

            var duration = 200; // aka 'fast'
            selectionBoxInnerContainer.animate({
                opacity: "0.0"
            }, duration / 2, function() {
                selectionBoxInnerContainer.css("display", "none");
            });
            selectionBoxOuterContainer.animate({
                width: "0"
            }, duration);
        },



        toggleSelectionMode: function(animated) {
            if (this.isSelectionModeEnabled()) {
                this.disableSelectionMode(animated);
            } else {
                this.enableSelectionMode(animated);
            }
        },



        // after rendering
        // ===================================================================
        onAfterRendering: function() {
            var that = this;
            var $that = $(that.getDomRef());

            that.showOrHideExpandButton();

            $that.bind('click', function() {
                that._performOrTrackTitleNavigation();
            });

            if (that.getModel().config.odataProvider || !that.getModel().config.isLaunchpad()) {
                // active the quick view for list item click
                that.getAggregation("_titleLink").setEnabled(true);
                $(that.getAggregation("_titleLink").getDomRef()).bind('click', function() {
                    var titleUrl = "";
                    var titleNavigation = that.getTitleNavigation();
                    if (titleNavigation) {
                        titleUrl = titleNavigation.getHref();
                    }
                    if (!titleUrl || titleUrl.length === 0) {
                        var oQuickViewGroup = new sap.m.QuickViewGroup();
                        var sBindingPath = that.getBindingContext().sPath + "/itemattributes";
                        oQuickViewGroup.bindAggregation("elements", sBindingPath, function(sId, oContext) {
                            var oType = sap.m.QuickViewGroupElementType.text;
                            var oBinding = oContext.oModel.getProperty(oContext.sPath);
                            var sUrl;
                            if (oBinding.key.toLowerCase().indexOf("email") !== -1) {
                                oType = sap.m.QuickViewGroupElementType.email;
                            } else if (oBinding.key.toLowerCase().indexOf("url") !== -1) {
                                oType = sap.m.QuickViewGroupElementType.link;
                                sUrl = "http://" + oBinding.value;
                            } else if (oBinding.key.toLowerCase().indexOf("telefon") !== -1) {
                                oType = sap.m.QuickViewGroupElementType.phone;
                            }
                            var oQuickViewGroupElement = new sap.m.QuickViewGroupElement({
                                visible: !oBinding.isTitle && !oBinding.hidden,
                                label: "{name}",
                                value: "{value}",
                                type: oType,
                                url: sUrl
                            });
                            return oQuickViewGroupElement;
                        });
                        var oQuickViewPage = new sap.m.QuickViewPage({
                            //                        header: sap.ushell.resources.i18n.getText("resultsQuickViewHeader"),
                            header: that.getTitle(),
                            icon: that.getImageUrl(),
                            groups: [oQuickViewGroup]
                        });
                        var oQuickView = new sap.m.QuickView({
                            placement: sap.m.PlacementType.Auto,
                            width: $(window).width() / 3 + "px",
                            pages: [oQuickViewPage]
                        });
                        oQuickView.setModel(that.getModel());
                        oQuickView.openBy(that.getAggregation("_titleLink"));
                        oQuickView.addStyleClass("sapUshellSearchQuickView");
                        sap.ushell.renderers.fiori2.search.SearchHelper.boldTagUnescaper(oQuickView.getDomRef());
                    }
                });
            }

            //$('.sapUshellSearchResultListItemButton .sapUshellSearchResultListItemButtonContainer').attr('role', 'button');
            //             var $attributeValue = $('.sapUshellSearchResultListItem-attribute-value');
            //             $attributeValue.each(function() {
            //                 if ($(this).prev().hasClass('sapUshellSearchResultListItem-attribute-label')) {
            //                     $(this).attr('aria-label', $(this).prev().text());
            //                 }
            //             });

            // use boldtagunescape like in highlighting for suggestions //TODO
            // allow <b> in title and attributes
            that.forwardEllipsis($that.find(".sapUshellSearchResultListItem-Title, .sapUshellSearchResultListItem-AttributeKey, .sapUshellSearchResultListItem-AttributeValue"));

            //             var $detailsContainer = $(that.getDomRef()).find('.sapUshellSearchResultListItemDetails2');
            //             $detailsContainer.css("display", "none");
            //             $detailsContainer.css("height", "auto");
            //             $detailsContainer.css("overflow", "visible");

            SearchHelper.attachEventHandlersForTooltip(that.getDomRef());
        },



        // ===================================================================
        // Some Helper Functions
        // ===================================================================

        _getPhoneSize: function() {
            return 767;
        },


        _resetPrecalculatedValues: function() {
            this._visibleAttributes = undefined;
            this._detailsArea = undefined;
            this._showExpandButton = false;
        },


        showOrHideExpandButton: function() {
            var that = this;
            var element = $(that.getDomRef());

            var expandButtonContainer = element.find(".sapUshellSearchResultListItem-ExpandButtonContainer");
            var isVisible = expandButtonContainer.css("visibility") != "hidden";

            var shouldBeVisible = false;

            var actionBar = element.find(".sapUshellSearchResultListItem-RelatedObjectsToolbar");
            shouldBeVisible = actionBar.length > 0; // && actionBar.css("display") != "none";

            if (!shouldBeVisible) {
                element.find(".sapUshellSearchResultListItem-MainAttribute,.sapUshellSearchResultListItem-WhyFoundAttribute").each(function() {
                    if ($(this).css("order") > 2) {
                        shouldBeVisible = true;
                        return false;
                    }
                });
            }

            if (isVisible && !shouldBeVisible) {
                expandButtonContainer.css("visibility", "hidden");
                expandButtonContainer.attr("aria-hidden", "true");
                that.setAriaExpandedState();
            } else if (!isVisible && shouldBeVisible) {
                expandButtonContainer.css("visibility", "");
                expandButtonContainer.removeAttr("aria-hidden");
                that.setAriaExpandedState();
            }
        },


        setAriaExpandedState: function() {
            var that = this;
            var expandButton = that.getAggregation("_expandButton");
            var $expandButton = $(expandButton.getDomRef());
            var $that = $(that.getDomRef());
            var $parentListItem = that.getParentListItem() ? $(that.getParentListItem().getDomRef()) : $that.closest("li");
            var $expandButtonContainer = $that.find(".sapUshellSearchResultListItem-ExpandButtonContainer");

            if ($expandButtonContainer.css("visibility") == "hidden") {
                $expandButton.removeAttr("aria-expanded");
                $parentListItem.removeAttr("aria-expanded");
            } else {
                var expanded = that.getProperty("expanded");
                if (expanded) {
                    $expandButton.attr("aria-expanded", "true");
                    $parentListItem.attr("aria-expanded", "true");
                } else {
                    $expandButton.attr("aria-expanded", "false");
                    $parentListItem.attr("aria-expanded", "false");
                }

            }
        },


        _performOrTrackTitleNavigation: function(allowTrackingWithoutNavigation) {
            var titleNavigation = this.getTitleNavigation();
            if (titleNavigation) {
                var phoneSize = this._getPhoneSize();
                var windowWidth = $(window).width();
                if (windowWidth <= phoneSize) {
                    titleNavigation.performNavigation();
                } else if (allowTrackingWithoutNavigation) {
                    titleNavigation.trackNavigation();
                }
            }
        },


        forwardEllipsis: function(objs) {
            objs.each(function(i, d) {
                // recover bold tag with the help of text() in a safe way
                SearchHelper.forwardEllipsis4Whyfound(d);
            });
        }

    });
});
