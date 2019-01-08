// iteration 0 : Holger
/* global sap,window,$, jQuery */

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/controls/SearchResultListItem',
    'sap/ushell/renderers/fiori2/search/controls/SearchText',
    'sap/ushell/renderers/fiori2/search/SearchHelper'
], function(SearchResultListItem, SearchText, SearchHelper) {
    "use strict";

    var noValue = '\u2013'; // dash

    return SearchResultListItem.extend("sap.ushell.renderers.fiori2.search.controls.SearchResultListItemDocument", {

        renderer: function(oRm, oControl) { // static function, so use the given "oControl" instance instead of "this" in the renderer function
            oControl._renderer(oRm);
        },

        _renderContentContainer: function(oRm) {
            oRm.write('<div class="sapUshellSearchResultListItem-Content">');


            this._renderTitleContainer(oRm);
            this._renderAttributesContainer(oRm);
            //this._renderThumbnailContainer(oRm);

            oRm.write('</div>');
        },


        _renderTitleContainer: function(oRm) {
            var that = this;

            oRm.write('<div class="sapUshellSearchResultListItem-TitleAndImageContainer">');
            oRm.write('<div class="sapUshellSearchResultListItem-TitleContainer">');

            that._renderCheckbox(oRm);

            /// /// Title
            var titleURL = that.getTitleUrl();
            var titleLink = that.getAggregation("_titleLink");
            titleLink.setHref(titleURL);
            titleLink.setText(that.getTitle());

            if (titleURL.length === 0) {
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


        _renderAttributesContainer: function(oRm) {
            var that = this;

            oRm.write('<div class="sapUshellSearchResultListItemDoc-AttributesExpandContainer');

            var expanded = that.getProperty("expanded");
            if (expanded) {
                oRm.write(" sapUshellSearchResultListItem-AttributesExpanded");
            }

            oRm.write('">');
            oRm.write('<div class="sapUshellSearchResultListItem-AttributesAndActions">');
            oRm.write('<ul class="sapUshellSearchResultListItem-Attributes">');

            this._renderThumbnailSnippetContainer(oRm);
            this._renderDocAttributesContainer(oRm);



            // This is just a dummie attribute to store additional space information for the expand and collapse JavaScript function
            oRm.write('<div class="sapUshellSearchResultListItem-ExpandSpacerAttribute" aria-hidden="true"></div>');

            oRm.write('</ul>');

            that._renderRelatedObjectsToolbar(oRm);


            oRm.write('</div>');
            oRm.write('</div>');
        },

        _renderThumbnailContainer: function(oRm) {

            var that = this;

            if (!that.getImageUrl()) {
                return;
            }

            if (that.getContainsThumbnail() === true) {
                oRm.write('<div class="sapUshellSearchResultListItemDoc-ThumbnailContainer">');
                oRm.write('<div class="sapUshellSearchResultListItemDoc-ThumbnailContainerInner">');

                var oZoomIcon = new sap.ui.core.Icon({
                    src: sap.ui.core.IconPool.getIconURI("search"),
                    useIconTooltip: false
                });
                if (that.getContainsSuvFile() === true) {
                    var pressHandler = function() {
                        window.open(that.getSuvlink(), '_blank');
                    };
                    oZoomIcon.attachPress(pressHandler);
                }

                oZoomIcon.addStyleClass("sapUshellSearchResultListItemDoc-ThumbnailZoomIcon");
                oRm.renderControl(oZoomIcon);
                if (that.getContainsSuvFile() === true) {
                    oRm.write('<a target="_blank" href="' + that.getSuvlink() + '">');
                } else {
                    oRm.write('<a target="_blank" >');
                }
                oRm.write('<img class="sapUshellSearchResultListItemDoc-Thumbnail" src="');
                oRm.write(that.getImageUrl());

                oRm.write('" onerror="this.parentElement.parentElement.parentElement.className=\'sapUshellSearchResultListItemDoc-ThumbnailContainer-hidden\';" onload="this.parentElement.parentElement.parentElement.style.visibility = \'visible\';">');

                oRm.write('</a>');

                oRm.write('</div>');
                oRm.write('</div>');
            } else {
                oRm.write('<div class="sapUshellSearchResultListItemDoc-ThumbnailContainer-hidden">');
                oRm.write('</div>');
            }

        },

        _renderImageForPhone: function(oRm) {
            var that = this;
            if (that.getImageUrl() && that.getContainsThumbnail() === true) {

                oRm.write('<div class="sapUshellSearchResultListItem-TitleImage">');

                oRm.write('<div class="sapUshellSearchResultListItem-ImageContainerAlignmentHelper"></div>');

                oRm.write('<img class="sapUshellSearchResultListItem-Image" src="');
                oRm.write(that.getImageUrl());
                oRm.write('">');

                oRm.write('</div>');
            }
        },

        _renderDocAttributesContainer: function(oRm) {
            oRm.write('<div class="sapUshellSearchResultListItemDoc-AttributesContainer">');
            var itemAttributes = this.getAttributes();
            this._renderAllAttributes(oRm, itemAttributes);
            oRm.write('</div>');
        },


        _renderThumbnailSnippetContainer: function(oRm) {
            oRm.write('<div class="sapUshellSearchResultListItemDoc-ThumbnailSnippetContainer">');
            this._renderThumbnailContainer(oRm);
            this._renderSnippetContainer(oRm);
            oRm.write('</div>');
        },

        _renderSnippetContainer: function(oRm) {
            var itemAttributes = this.getAttributes();
            for (var i = 0; i < itemAttributes.length; i++) {
                var itemAttribute = itemAttributes[i];
                if (itemAttribute.longtext) {
                    //oRm.write('<li class="sapUshellSearchResultListItem-SnippetContainer">');

                    var value = new SearchText();
                    value.setText(itemAttribute.value);
                    value.addStyleClass("sapUshellSearchResultListItemDoc-Snippet");
                    //value.addStyleClass("sapUshellSearchResultListItem-MightOverflow");
                    oRm.renderControl(value);
                }

            }
        },

        // render Attributes
        // ===================================================================
        _renderAllAttributes: function(oRm, itemAttributes) {
            var that = this;

            var itemAttribute;
            var labelText;
            var valueText;
            var value;
            var oProperty;


            // skip first attribute which is the title attribute for the table
            var i = 0,
                j = 0,
                k = 0;
            var numberOfMainAttributes = 8;
            if (that.getImageUrl()) {
                numberOfMainAttributes--;
            }

            var containsFileProertyAttribute = function(attributeList) {
                var attr;
                for (var i = 0; i < attributeList.length; i++) {
                    attr = attributeList[i];
                    if (attr.key === 'FILE_PROPERTY' && attr.value) {
                        return true;
                    }
                }
                return false;
            };

            var bContainsFilePropertyAttribute = containsFileProertyAttribute(itemAttributes);

            that.destroyAggregation("_attributeValues");

            for (; j < numberOfMainAttributes && i < itemAttributes.length; i++) {
                itemAttribute = itemAttributes[i];

                if (itemAttribute.isTitle || itemAttribute.longtext) {
                    continue;
                }

                if (bContainsFilePropertyAttribute === true && itemAttribute.key !== 'FILE_PROPERTY') {
                    continue;
                }

                if (!itemAttribute.value) {
                    continue;
                }


                if (bContainsFilePropertyAttribute === true) {
                    var aFileProperties = JSON.parse(itemAttribute.value);


                    for (; k < aFileProperties.length && k < 10; k++) { // currently the maximum limit for file properties is 10
                        oProperty = aFileProperties[k];

                        switch (oProperty.type) {
                            case "date-time":
                                // format date type
                                var oDate = new Date(oProperty.value);
                                var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                                    style: "medium"
                                }, sap.ui.getCore().getConfiguration().getLocale());
                                valueText = oDateFormat.format(oDate);
                                break;
                            case "byte":
                                valueText = SearchHelper.formatFileSize(Number(oProperty.value));
                                break;
                            case "integer":
                                valueText = SearchHelper.formatInteger(Number(oProperty.value));
                                break;

                            default:
                                valueText = oProperty.value;
                        }
                        labelText = oProperty.category + ': ' + oProperty.name;
                        if (valueText === undefined) {
                            continue;
                        }
                        if (!valueText || valueText === "") {
                            valueText = noValue;
                        }

                        value = new SearchText();
                        value.setText(valueText);
                        value.addStyleClass("sapUshellSearchResultListItemDoc-AttributeValue");
                        value.addStyleClass("sapUshellSearchResultListItem-MightOverflow");
                        oRm.renderControl(value);
                        that.addAggregation("_attributeValues", value, true /* do not invalidate this object */ );
                    }
                } else {
                    labelText = itemAttribute.name;
                    valueText = itemAttribute.value;
                    if (labelText === undefined || valueText === undefined) {
                        continue;
                    }
                    if (!valueText || valueText === "") {
                        valueText = noValue;
                    }

                    value = new SearchText();
                    value.setText(valueText);
                    value.addStyleClass("sapUshellSearchResultListItemDoc-AttributeValue");
                    value.addStyleClass("sapUshellSearchResultListItem-MightOverflow");
                    oRm.renderControl(value);
                    that.addAggregation("_attributeValues", value, true /* do not invalidate this object */ );
                }

                j++;
            }
        },

        _getExpandAreaObjectInfo: function() {
            var that = this;

            var resultListItem = $(that.getDomRef());

            var attributesExpandContainer = resultListItem.find(".sapUshellSearchResultListItemDoc-AttributesExpandContainer");
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

        hideDetails: function(animated) {
            var that = this;
            var resultListItem = $(that.getDomRef());

            if (!that.isShowingDetails()) {
                return;
            }

            var expandAreaObjectInfo = this._getExpandAreaObjectInfo();

            var attributeHeight = resultListItem.find(".sapUshellSearchResultListItem-Attributes").outerHeight(true);
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
        }

    });
});
