/*!
 * SAP UI development toolkit for HTML5 (SAPUI5/OpenUI5)
 * (c) Copyright 2009-2014 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
jQuery.sap.require("sap.ui.core.delegate.ScrollEnablement");

sap.ui.define(['jquery.sap.global','sap/ui/Device'],
    function(jQuery,Device) {
        "use strict";

        var _srcCard = null;

        var KeyboardNavigation = function (objectStream) {
            this.init(objectStream);
        };

        KeyboardNavigation.prototype.init = function(objectStream) {
            this.objectStream = objectStream;
            this.keyCodes = jQuery.sap.KeyCodes;
            this.jqElement = objectStream.$();
            this.jqElement.on('keydown.keyboardNavigation', this.keydownHandler.bind(this));
            this.jqElement.on("focus.keyboardNavigation",".sapOvpObjectStreamItem", this.ObjectStreamFocusAccessabilityHandler.bind(this));
        };

        KeyboardNavigation.prototype.destroy = function () {
            if (this.jqElement) {
                this.jqElement.off(".keyboardNavigation");
            }
            delete this.jqElement;
            delete this.objectStream;
        };

        KeyboardNavigation.prototype._swapItemsFocus = function (e, jqItemFrom, jqItemTo) {
            //to preserve last focusable item, first item received tabindex=-1, second tabindex=-1.
            e.preventDefault();
            jqItemFrom.attr("tabindex", "-1");
            jqItemTo.attr("tabindex", "0").focus();
        };

        //Handle focus on object stream item
        KeyboardNavigation.prototype.ObjectStreamFocusAccessabilityHandler = function () {
            var focusedDomElement = document.activeElement;
            focusedDomElement = jQuery(focusedDomElement);
            //Check that we got a focused item, after that will add to aria-labelledby every id
            // of items inside the object stream item that have role=heading and aria-label
            if (focusedDomElement){
                // get all elements inside that have aria-label
                var labelledElement = focusedDomElement.find("[aria-label]");
                var i, strIdList = "";
                // add every item that also have role heading to id list string
                for (i = 0; i < labelledElement.length; i++ ){
                    if (labelledElement[i].getAttribute("role") == "heading"){
                        strIdList += labelledElement[i].id + " ";
                    }
                }
                //add the object stream item the aria-labelledby attribute with list of relevants IDs
                if (strIdList.length) {
                    focusedDomElement.attr("aria-labelledby", strIdList);
                }

                // Removing the labelledby property of the card when the focus is in the header area. Having focus on the card reads the header twice //
                if (focusedDomElement.hasClass('sapOvpCardHeader')) {
                    focusedDomElement.closest('.sapOvpObjectStreamItem').removeAttr("aria-labelledby");
                }

            }
        };

        KeyboardNavigation.prototype.tabButtonHandler = function (e) {
            //Forward navigation:
            //On enter first time, move focus to the first Item (as a whole).
            //If focus is on a Item, move focus to the first control in the tab chain inside the Item.
            //If focus is on a control inside a Item, move focus to the next control in the tab chain inside the same Item.
            //If focus is on the last control inside a Item, move focus to the next control in the tab chain after the Object Stream, usually it's Close button
            var jqFocused = jQuery(document.activeElement);
            if (jqFocused.hasClass("sapOvpObjectStreamItem")) {
                return;
            }
            if (jqFocused.hasClass("sapOvpObjectStreamClose")) {
                //focus on the close button, move focus to last focused item.
                e.preventDefault();
                this.jqElement.find(".sapOvpObjectStreamItem:sapTabbable").focus();
                return;
            }
            var jqCard = jqFocused.closest(".sapOvpObjectStreamItem");
            if (!jqCard.length) {
                return;
            }
            var jqTabbables = jqCard.find(":sapTabbable");
            //If focus is on the last control inside a Item, move focus to the next control in the tab chain after the Object Stream, usually it's Close button
            if (jqTabbables.eq(jqTabbables.length - 1).is(jqFocused)) {
                e.preventDefault();
                this.jqElement.find("a.sapOvpObjectStreamHeader").focus();
            }
        };

        KeyboardNavigation.prototype.shiftTabButtonHandler = function (e) {
            //Backward navigation:
            //On enter first time, move focus to the last control of the first Card.
            //On enter any consecutive time, move focus to the last control of the Card which had the focus before.
            //If focus is on a control inside a Card, move focus to the previous control in the tab chain inside the same Card. usually it's Close button
            var jqFocused = jQuery(document.activeElement);
            if (jqFocused.hasClass("sapOvpObjectStreamItem")) {
                e.preventDefault();
                this.jqElement.find(".sapOvpObjectStreamClose").focus();
            }
            if (jqFocused.hasClass("sapOvpObjectStreamClose")) {
                e.preventDefault();
                this.jqElement.find('a.sapOvpObjectStreamHeader').focus();
            }
            if (jqFocused.hasClass("sapOvpObjectStreamHeader")) {
                e.preventDefault();
                this.jqElement.find(".sapOvpObjectStreamItem:sapTabbable *:sapTabbable").last().focus();
                return;
            }
        };


        KeyboardNavigation.prototype.enterHandler = function (e) {
            var jqFocused = jQuery(document.activeElement);
            //if Space/Enter was on Close button, close dialog
            if (jqFocused.hasClass("sapOvpObjectStreamClose")) {
                e.preventDefault();
                this.objectStream.getParent().close();
                if (_srcCard) {
                    _srcCard.focus();
                }
                return;
            }

            //if Space/Enter was last item (it is a Placeholder), trigger click
            if (jqFocused.hasClass("sapOvpObjectStreamItem") && !jqFocused.next().length) {
                jqFocused.children().click();
                return;
            }
        };

        KeyboardNavigation.prototype.f6Handler = function (e) {
            //No matter where the focus resides inside the Object Stream, move it to the first element in the tab chain of the next F6-group. (It's Close button)
            var jqFocused = jQuery(document.activeElement);
            if (jqFocused.hasClass("sapOvpObjectStreamClose")) {
                this.jqElement.find('.sapOvpObjectStreamItem').attr("tabindex", "-1").first().attr("tabindex", "0").focus();
            } else {
                this.jqElement.find('.sapOvpObjectStreamClose').focus();
            }
        };

        KeyboardNavigation.prototype.f7Handler = function (e) {
            //If focus is on a Card, move focus to the control inside the Default: first control in the tab chain inside the Card.
            //If focus is on a control inside a Card, move focus to the Card.
            var jqFocused = jQuery(document.activeElement);
            if (jqFocused.hasClass("sapOvpObjectStreamItem")) {
                jqFocused.find(':sapTabbable').first().focus();
            } else {
                jqFocused.closest('.sapOvpObjectStreamItem').focus();
            }
            e.preventDefault();
        };

        KeyboardNavigation.prototype.leftRightHandler = function (e, isRight) {
            //Left - If focus is on a Card, move focus to the previous Card. If focus is on the first Card, do nothing.
            //Right - If focus is on a Card, move focus to the next Card. If focus is on the last Card, do nothing.

                var fName = isRight ? "next" : "prev";
            var jqFocused = jQuery(document.activeElement);
            if (!jqFocused.hasClass("sapOvpObjectStreamItem")) {
                return false;
            }
            var nextFocus = jqFocused[fName]();
            if (!nextFocus.length) {
                return;
            }
            this._swapItemsFocus(e, jqFocused, nextFocus);
        };

        KeyboardNavigation.prototype.homeEndHandler = function (e, isHome) {
            //Home - If focus is on a Card, move focus to the first Card.
            //End - If focus is on a Card, move focus to the last Card. This is usually the Placeholder Card.
            var fName = isHome ? "first" : "last";
            var jqFocused = jQuery(document.activeElement);
            if (!jqFocused.hasClass("sapOvpObjectStreamItem")) {
                return false;
            }
            e.preventDefault();
            var nextFocus = this.jqElement.find(".sapOvpObjectStreamItem")[fName]();
            this._swapItemsFocus(e, jqFocused, nextFocus);
        };

        KeyboardNavigation.prototype.pageUpDownHandler = function (e, isPageUp) {
            //move focus Left/Right to the first not visible (outside of viewport) item.
            //if all items (on direction) are visible, then to first/last
            var fName = isPageUp ? "prev" : "next";

            var jqFocused = jQuery(document.activeElement);
            if (!jqFocused.hasClass("sapOvpObjectStreamItem")) {
                return;
            }
            if (!jqFocused[fName]().length) {
                return;
            }
            var nextFocusEl = false;
            var currentEl = jqFocused;
            var windowWidth = jQuery(window).width();

            while (!nextFocusEl) {
                var next = currentEl[fName]();
                if (!next.length) {
                    nextFocusEl = currentEl;
                    break;
                }
                if (!isPageUp && next.offset().left > windowWidth) {
                    nextFocusEl = next;
                    break;
                }
                if (isPageUp && (next.offset().left + next.outerHeight()) <= 0) {
                    nextFocusEl = next;
                    break;
                }
                currentEl = next;
            }
            this._swapItemsFocus(e, jqFocused, nextFocusEl);
        };

        KeyboardNavigation.prototype.keydownHandler = function(e) {
            switch (e.keyCode) {
                case this.keyCodes.TAB:
                    (e.shiftKey) ? this.shiftTabButtonHandler(e) : this.tabButtonHandler(e);
                    break;
                case this.keyCodes.ENTER:
                case this.keyCodes.SPACE:
                    this.enterHandler(e);
                    break;
                case this.keyCodes.F6:
                    this.f6Handler(e);
                    break;
                case this.keyCodes.F7:
                    this.f7Handler(e);
                    break;
                case this.keyCodes.ARROW_UP:
                case this.keyCodes.ARROW_LEFT:
                    this.leftRightHandler(e, false);
                    break;
                case this.keyCodes.ARROW_DOWN:
                case this.keyCodes.ARROW_RIGHT:
                    this.leftRightHandler(e, true);
                    break;
                case this.keyCodes.HOME:
                    this.homeEndHandler(e, true);
                    break;
                case this.keyCodes.END:
                    this.homeEndHandler(e, false);
                    break;
                case this.keyCodes.PAGE_UP:
                    this.pageUpDownHandler(e, true);
                    break;
                case this.keyCodes.PAGE_DOWN:
                    this.pageUpDownHandler(e, false);
                    break;
            }
        };


        var ObjectStream = sap.ui.core.Control.extend("sap.ovp.ui.ObjectStream", { metadata : {
            library : "sap.ovp",
            aggregations : {
                content: {type: "sap.ui.core.Control", multiple: true},
                placeHolder: {type: "sap.ui.core.Control", multiple: false},
                title: {type: "sap.ui.core.Control", multiple: false}
            }
        }});


        ObjectStream.prototype.init = function() {
            var that = this;
            this._closeIcon = new sap.ui.core.Icon({
                src: "sap-icon://decline",
                tooltip: sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("close")
            });
            this._closeIcon.addEventDelegate({
                onclick: function () {
                    that.getParent().close();
                }
            });
        };

        ObjectStream.prototype._startScroll = function(direction) {
            this._direction = direction;
            var scrollDiff = this.wrapper.scrollWidth - this.wrapper.offsetWidth - Math.abs(this.wrapper.scrollLeft);
            var leftToScroll;
            if (direction == "left" ) {
                leftToScroll = (this.rtl && !this.scrollReverse) ? scrollDiff :  this.wrapper.scrollLeft;
                if (leftToScroll <= 0) {
                    return;
                }
                this.jqRightEdge.css("opacity", 1);
            } else {
                leftToScroll = (this.rtl && !this.scrollReverse) ? Math.abs(this.wrapper.scrollLeft) : scrollDiff;
                if (leftToScroll <= 0) {
                    return;
                }
                this.jqLeftEdge.css("opacity", 1);
            }
            var scrollTime = leftToScroll * 3;
            var translateX = (direction == "left") ? leftToScroll : ~leftToScroll + 1;
            jQuery(this.container).one("transitionend", function () {
                this._mouseLeave({data: this});
            }.bind(this));
            this.container.style.transition = 'transform ' + scrollTime + 'ms linear';
            this.container.style.transform = 'translate(' + translateX + 'px, 0px) scale(1) translateZ(0px) ';
        };

        ObjectStream.prototype._mouseLeave = function (e) {
            var containerTransform = window.getComputedStyle(e.data.container).transform;
            e.data.container.style.transform = containerTransform;
            e.data.container.style.transition = '';
            this.rtl = sap.ui.getCore().getConfiguration().getRTL();
            var transformX;
            var transformParamsArr = containerTransform.split(",");
            if (containerTransform.substr(0, 8) == "matrix3d") {
                transformX = parseInt(transformParamsArr[12], 10);
            } else if (containerTransform.substr(0, 6) == "matrix") {
                transformX = parseInt(transformParamsArr[4], 10);
            }
            if (isNaN(transformX)) {
                return;
            }
            e.data.container.style.transform = "none";
            if (Device.browser.msie) {
                transformX = this.rtl ? ~transformX : transformX;
            }
            e.data.wrapper.scrollLeft += ~transformX + (e.data._direction == "left" ? -5 : 5);
            e.data._checkEdgesVisibility();
        };

        var scrollHandlerTimerId;
        ObjectStream.prototype.debounceScrollHandler = function () {
            window.clearTimeout(scrollHandlerTimerId);
            scrollHandlerTimerId = window.setTimeout(this._checkEdgesVisibility.bind(this), 150);
        };

        ObjectStream.prototype._initScrollVariables = function () {
            var jqObjectStream = this.$();
            this.container =  jqObjectStream.find(".sapOvpObjectStreamScroll").get(0);
            this.rtl = sap.ui.getCore().getConfiguration().getRTL();
            this.wrapper = jqObjectStream.find(".sapOvpObjectStreamCont").get(0);
            this.scrollReverse = this.scrollReverse || this.wrapper.scrollLeft > 0;
            this.shouldShowScrollButton = (!sap.ui.Device.system.phone && !sap.ui.Device.system.tablet) || sap.ui.Device.system.combi; //should be shown only in desktop (and combi)
            this.jqRightEdge = jqObjectStream.find(".sapOvpOSEdgeRight");
            this.jqLeftEdge = jqObjectStream.find(".sapOvpOSEdgeLeft");
            if (this.shouldShowScrollButton) {
                this.jqRightEdge.add(this.jqLeftEdge).on("mouseenter.objectStream", this, this._mouseEnter).
                    on("mouseleave.objectStream", this, this._mouseLeave);
                jQuery(this.wrapper).on("scroll.objectStream", this.debounceScrollHandler.bind(this));
            }else {
                this.jqLeftEdge.css("display", "none");
                this.jqRightEdge.css("display", "none");
            }

            this._checkEdgesVisibility();
        };

        ObjectStream.prototype._afterOpen = function () {
            if (sap.ui.Device.os.ios && this.$().length) {
                //prevent sap.m.Dialog from stop scroll by cancelling "touchmove" on iOS
                this.$().on("touchmove.scrollFix", function (e) {e.stopPropagation(); });
            }

            var objectStreamHeader = this.$().find('a.sapOvpObjectStreamHeader');
            objectStreamHeader.removeAttr('aria-describedby');
            objectStreamHeader.removeAttr('href');
            var linkId = objectStreamHeader.attr('id');
            objectStreamHeader.parent('div').attr('aria-labelledby', linkId);
            objectStreamHeader.focus();

            if (this.keyboardNavigation) {
                this.keyboardNavigation.destroy();
            }
            this.keyboardNavigation = new KeyboardNavigation(this);
            this._initScrollVariables();
            this.jqBackground = jQuery("<div id='objectStreamBackgroundId' class='objectStreamNoBackground'></div>");
            jQuery.sap.byId("sap-ui-static").prepend(this.jqBackground);
            this.jqBackground.on('click.closePopup', function () {
                this._oPopup.close();
            }.bind(this));
            jQuery(".sapUshellEasyScanLayout").addClass("bluredLayout");

            // Code to remove the tabindex from the quick view card footer if there are no action buttons in the footer
            var oCards = this.$().find('.sapOvpObjectStreamItem');
            for (var i = 0; i < oCards.length; i++) {
                var oFooter = jQuery(oCards[i]).find('.sapOvpActionFooter');
                if (oFooter.find('button').length == 0) {
                    oFooter.attr('tabindex', '-1');
                }
            }
        };

        ObjectStream.prototype._beforeClose = function () {
            if (sap.ui.Device.os.ios && this.$().length) {
                this.$().off(".scrollFix");
            }
            this.keyboardNavigation.destroy();
            this.jqBackground.remove();
            this.jqLeftEdge.add(this.jqRightEdge).add(this.wrapper).off(".objectStream");
            jQuery(".sapUshellEasyScanLayout").removeClass("bluredLayout");
            /*Till sap.ui5 1.46 _oPopup was getting undefined by default on close of dialog
            * But from sap.ui.1.47 it was not getting undefined by default,hence was not creating new dialog on
            * call of this.open function called on click of stack card. Therefore making it undefined
            * on call of close function*/
            this._oPopup = undefined;
        };

        ObjectStream.prototype._mouseEnter = function (evt) {
            var scrollDirection = 'right';
            if ((evt.target == evt.data.jqRightEdge.get(0)) ||
                (evt.currentTarget == evt.data.jqRightEdge.get(0))){
                scrollDirection = sap.ui.getCore().getConfiguration().getRTL() ? 'left' : 'right';
            }
            if ((evt.target == evt.data.jqLeftEdge.get(0)) ||
                (evt.currentTarget == evt.data.jqLeftEdge.get(0))){
                scrollDirection = sap.ui.getCore().getConfiguration().getRTL() ? 'right' : 'left';
            }
            evt.data._startScroll(scrollDirection);
        };

        ObjectStream.prototype._checkEdgesVisibility = function () {
            var scrollPosition = this.wrapper.scrollLeft;
            var leftToScroll = this.wrapper.scrollWidth - this.wrapper.offsetWidth - this.wrapper.scrollLeft;
            var leftEdgeOpacity = (scrollPosition == 0) ? 0 : 1;
            var rightEdgeOpacity = (leftToScroll == 0) ? 0 : 1;
            if (sap.ui.getCore().getConfiguration().getRTL() && this.scrollReverse) {
                this.jqLeftEdge.css("opacity", rightEdgeOpacity);
                this.jqRightEdge.css("opacity", leftEdgeOpacity);
                //For right side arrow button set z-index to 0 as well when the opacity is 0
                this.jqRightEdge.css("z-index", (leftEdgeOpacity === 0) ? 0 : 1);
            } else {
                this.jqLeftEdge.css("opacity", leftEdgeOpacity);
                this.jqRightEdge.css("opacity", rightEdgeOpacity);
                //For right side arrow button set z-index to 0 as well when the opacity is 0
                this.jqRightEdge.css("z-index", (rightEdgeOpacity === 0) ? 0 : 1);
            }
        };

        ObjectStream.prototype._createPopup = function () {
            this._oPopup = new sap.m.Dialog({
                showHeader: false,
                afterOpen: this._afterOpen.bind(this),
                beforeClose: this._beforeClose.bind(this),
                content: [this],
                stretch: sap.ui.Device.system.phone
            }).removeStyleClass("sapUiPopupWithPadding").addStyleClass("sapOvpStackedCardPopup");
            this._oPopup.oPopup.setModal(false);
        };

        ObjectStream.prototype.open = function (cardWidth, cardReference) {
            if (!this._oPopup) {
                this._createPopup();
            }
            //save card width for after rendering
            this._cardWidth = cardWidth;

            _srcCard = cardReference;

            //set height and width of each card on object stream
            this.setCardsSize(this._cardWidth);

            this._oPopup.open();
        };

        ObjectStream.prototype.onBeforeRendering = function() {
            /**
             * IF an object stream's total content has more than 20 cards (Cards >20), a Placeholder Card shall be displayed at position 21.
             * For non-quickview cards, there is no placeholder anyway.
             */
            var oContent = this.getBinding("content");
            var oPlaceHolder = this.getPlaceHolder();
            if (oContent && oContent.getLength() <= 20) {
                this.setPlaceHolder(null);
                if (oPlaceHolder) {
                    oPlaceHolder.destroy();
                }
            }
        };

        ObjectStream.prototype.onAfterRendering = function() {

            if (!this._oPopup || !this._oPopup.isOpen() || !this.getContent().length ) {
                return;
            }

            //set height and width of each card on object stream
            this.setCardsSize(this._cardWidth);
            setTimeout(function () {
                this._initScrollVariables();
            }.bind(this));
        };


        ObjectStream.prototype.exit = function() {
            if (this._oPopup){
                this._oPopup.destroy();
            }
            this._closeIcon.destroy();
            if (this._oScroller) {
                this._oScroller.destroy();
                this._oScroller = null;
            }
        };

        ObjectStream.prototype.setCardsSize = function(cardWidth) {
            var remSize = parseInt(window.getComputedStyle(document.documentElement).fontSize, 10);
            var cardHeight = sap.ui.Device.system.phone ? document.body.clientHeight / remSize - 4.5 : 28.75;
            var cardList = this.getContent();
            cardList.map(function (oCard) {
                oCard.setWidth(cardWidth + "px");
                oCard.setHeight(cardHeight + "rem");
            });

            var oPlaceHolder = this.getPlaceHolder();
            if (oPlaceHolder) {
                oPlaceHolder.setWidth(cardWidth + "px");
                oPlaceHolder.setHeight(cardHeight + "rem");
            }
        };

        ObjectStream.prototype.updateContent = function(reason){
            /* We are updaing the content only data was change and not by refresh
             * This is done due to the fact that UI5 is calling the updateContent
             * twice, one with reason = 'refresh' with no data in the model and second
             * with reason = 'change' with the data.
             * In order to be able to have rendering optimization we are updating only when
             * we have the data in the model and therefore we can reuse most of the items
             * Ticket was open on this # 1570807520
             */
            // in any case we need to call the oBinding.getContexts().
            // it seams that this will trigger the second call with the change reason
            var oBindingInfo = this.mBindingInfos["content"],
                oBinding = oBindingInfo.binding,
                aBindingContexts = oBinding.getContexts(oBindingInfo.startIndex, oBindingInfo.length);
            if (reason === "change"){
                var fnFactory = oBindingInfo.factory,
                    i = 0,
                    aItems = this.getContent(),
                    addNewItem = jQuery.proxy(function (oContext) {
                        var sId = this.getId() + "-" + jQuery.sap.uid(),
                            oClone = fnFactory(sId, oContext);
                        oClone.setBindingContext(oContext, oBindingInfo.model);
                        this.addContent(oClone);
                    }, this);


                // Bind as many context as possible to existing elements. Create new ones if necessary.
                for (i = 0; i < aBindingContexts.length; ++i) {
                    if (i < aItems.length) {
                        aItems[i].setBindingContext(aBindingContexts[i], oBindingInfo.model);
                    } else {
                        addNewItem(aBindingContexts[i]);
                    }
                }

                if (aItems.length > aBindingContexts.length){
                    // Delete unused elements.
                    for (; i < aItems.length; ++i) {
                        aItems[i].destroy();
                    }
                    // Update the array length.
                    aItems.length = aBindingContexts.length;
                }
            }
        };

        return ObjectStream;

    }, /* bExport= */ true);
