/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */

/*global sap window*/
sap.ui.define(["jquery.sap.global", 'sap/ovp/cards/CommonUtils', "sap/ovp/library"],
    function (jQuery, commonUtils) {
        "use strict";
        jQuery.sap.require('sap.ovp.ui.UIActions');

        var ReplaceItems = function (settings) {
            this.init(settings);
        };

        ReplaceItems.prototype.init = function (settings) {
            settings.beforeDragCallback = this._beforeDragHandler.bind(this);
            settings.dragStartCallback = this._dragStartHandler.bind(this);
            settings.dragMoveCallback = this._dragMoveHandler.bind(this);
            settings.dragEndCallback = this._dragEndHandler.bind(this);
            settings.endCallback = this._endHandler.bind(this);

            this.layout = settings.layout;
            this.afterReplaceElements = settings.afterReplaceElements || function () {
            };
            this.settings = settings;
            delete settings.afterReplaceElements;
            this.destroy(); //destroy the previous instance of UIActions
            this.uiActions = new sap.ovp.ui.UIActions(this.settings).enable();
            this.aCardsOrder = null; //DOM elements array
            this.verticalMargin = null; //space vertical between items
            this.horizontalMargin = null; //horizontal space vertical between items
            this.columnCount = null; //number of layout columns
            this.top = null; //space between layout top and first card
            this.left = null; //space between layout left and first card
            this.width = null; //item width
            this.layoutOffset = null; //layout coordinates on screen, needed to normalize mouse position to layout
            this.jqLayout = null; //layout jQuery reference
            this.jqLayoutInner = null; //layout inner wrapper jQuery reference
            this.isRTLEnabled = null; //RTL flag
            this.lastCollidedEl = null; //last collided element
            this.lastCollisionTop = null; //last element collision top or bottom true/false
            this.SCROLL_OFFSET = 16;
        };


        //search collision with elements,
        //moveX - normalized X cord.
        //moveY - normalized Y cord.
        //itemList array of elements with posDnD property {top: , left: , height:, width: }
        //returns found element or undefined
        ReplaceItems.prototype.findCollision = function (moveX, moveY, itemList) {
            var colliedItem;
            for (var i = 0; i < itemList.length; i++) {
                var item = itemList[i];
                var isHorizontalIntersection = !(item.posDnD.right < moveX || item.posDnD.left > moveX);
                var isVerticalIntersection = !(item.posDnD.bottom < moveY || item.posDnD.top > moveY);
                if (isHorizontalIntersection && isVerticalIntersection) {
                    colliedItem = item;
                    break;
                }
            }
            return colliedItem;
        };

        //returns which part of element has collision - true for top, false for bottom
        ReplaceItems.prototype.isCollisionTop = function (moveX, moveY, item) {
            var halfBottom = ((item.posDnD.bottom - item.posDnD.top) / 2) + item.posDnD.top;
            var isCollisionTop = !(halfBottom < moveY || item.posDnD.top > moveY);
            return isCollisionTop;
        };

        //callback for UIActions, every time when mouse is moved in drag mode.
        ReplaceItems.prototype._dragMoveHandler = function (actionObject, qElement) {
            //{evt : evt, clone : this.clone, element: this.element, isScrolling: isScrolling, moveX : this.moveX, moveY : this.moveY}
            var sourceElement = actionObject.element;
            var moveX = actionObject.moveX - this.layoutOffset.left;
            var moveY = actionObject.moveY - this.jqLayout.get(0).getBoundingClientRect().top + this.jqLayout.scrollTop();
            if (!qElement) {
                var viewElement = document.getElementsByClassName("sapFDynamicPageContentWrapper")[0];
                var viewHeight = viewElement.offsetHeight;
                var viewRect = viewElement.getBoundingClientRect();
                if ((actionObject.evt.clientY - viewElement.offsetTop + this.SCROLL_OFFSET) > viewHeight) {
                    viewElement.scrollTop = viewElement.scrollTop + this.SCROLL_OFFSET;
                } else if (((actionObject.evt.clientY - viewElement.offsetTop) < viewRect.top + this.SCROLL_OFFSET) && viewElement.scrollTop !== 0) {
                    viewElement.scrollTop = viewElement.scrollTop - this.SCROLL_OFFSET;
                }
            }
            var collidedItem = this.findCollision(moveX, moveY, this.aCardsOrder);
            if (!collidedItem) {
                return; //no collided item, no need to act
            }
            var collidedItemTopCollision = this.isCollisionTop(moveX, moveY, collidedItem); //get element collision part
            if (collidedItem === sourceElement) {
                this.lastCollidedEl = collidedItem; //collided is dragged element, save it as last collided, and exit.
                return;
            }
            if (collidedItem === this.lastCollidedEl) {
                //current collided element the same as it was last time
                if (this.lastCollisionTop === collidedItemTopCollision) {
                    //mouse was not moved to another element part (from top to bottom or wise versa), so no need to act
                    return;
                }
                if (this.lastCollisionTop) {
                    this.lastCollisionTop = collidedItemTopCollision;
                    if (sourceElement.posDnD.top > collidedItem.posDnD.top) {
                        //mouse was moved from top to bottom, but sourceElement already on the bottom of collided element, no need to switch.
                        return;
                    }
                } else {
                    this.lastCollisionTop = collidedItemTopCollision;
                    if (sourceElement.posDnD.top < collidedItem.posDnD.top) {
                        //mouse was moved from bottom to top, but sourceElement already on the top of collided element, no need to switch.
                        return;
                    }
                }
            }
            if (this.lastCollidedEl && (this.lastCollidedEl !== collidedItem && this.lastCollidedEl !== sourceElement) &&
                (this.lastCollidedEl.posDnD.left === collidedItem.posDnD.left && this.lastCollidedEl.posDnD.left === sourceElement.posDnD.left)) {
                //complicated situation, when lastCollided, currentCollided and sourceElement, it's 3 different items, and they all in the same column.
                //it means that we don't want to switch with currentCollided element, becouse it dosn't look good.
                //Instead we switch with lastCollided item, which is more logical behaviour for user.
                collidedItem = this.lastCollidedEl;
            }
            //switch elements and recalculate new layout state.
            this.dragAndDropElement(sourceElement, collidedItem);
            //we want to know under which card mouse will be after  cards change places.
            //Because cards could be very high, it's possible that after change, mouse will appear under another card.
            //So we need to prevent future collision with this card, else you could face endless loop, when two high card will change each other endlessly.
            this.lastCollidedEl = this.findCollision(moveX, moveY, this.aCardsOrder);
            if (this.lastCollidedEl) {
                this.lastCollisionTop = this.isCollisionTop(moveX, moveY, this.lastCollidedEl);
            }
        };

        //switch elements and apply new element positions
        ReplaceItems.prototype.dragAndDropElement = function (sourceElement, targetElement) {
            if (sourceElement && targetElement) {
                this.aCardsOrder = this.dragAndDropSwapElement(sourceElement, targetElement, this.aCardsOrder);
                this.drawLayout(this.aCardsOrder);
            }
        };

        //switch two elements
        ReplaceItems.prototype.dragAndDropSwapElement = function (sourceElement, targetElement, itemsList) {
            var newOrder = itemsList.slice();
            var sourceElementIndex = itemsList.indexOf(sourceElement);
            var targetElementIndex = itemsList.indexOf(targetElement);
            newOrder[targetElementIndex] = sourceElement;
            newOrder[sourceElementIndex] = targetElement;
            //store position changes for personalization delta changes
            if (!!this.positionChanges && targetElement && targetElement.children) {
                var sTargetElementId = targetElement.children[0].getAttribute("id");
                this.positionChanges.push({
                    changeType: "position",
                    content: {
                        // sTargetElementId gives full core ID, so remove the prefix "mainView--"
                        cardId: sTargetElementId.substring(sTargetElementId.indexOf("mainView--") + 10, sTargetElementId.length),
                        position: sourceElementIndex,
                        oldPosition: targetElementIndex
                    },
                    isUserDependent: true
                });
            }
            return newOrder;
        };


        //keyboard navigation
        ReplaceItems.prototype.dragAndDropSwapElementForKeyboardNavigation = function (sourceElement, targetElement) {
            if (sourceElement && targetElement) {
                var aLayoutCards = this.layout.getVisibleLayoutItems().map(function (item) {
                    return item.$().parent()[0];
                });

                var changes = 0;
                for (var i = 0; i < aLayoutCards.length; i++) {
                    if (aLayoutCards[i] === sourceElement) {
                        aLayoutCards[i] = targetElement;
                        changes++;
                        continue;
                    }
                    if (aLayoutCards[i] === targetElement) {
                        aLayoutCards[i] = sourceElement;
                        changes++;
                        continue;
                    }
                }

                //callback afterSwapItems
                if (changes === 2) {
                    this.afterReplaceElements(aLayoutCards);
                }
            }
        };

        //init function called when drag start
        ReplaceItems.prototype.initCardsSettingsForDragAndDrop = function () {
            this.jqLayout = this.layout.$();
            this.jqLayoutInner = this.jqLayout.children().first();
            var layoutScroll = this.jqLayout.scrollTop();
            var layoutHeight = this.jqLayoutInner.height();
            this.isRTLEnabled = sap.ui.getCore().getConfiguration().getRTL() ? 1 : -1;
            this.aCardsOrder = [];
            this.layoutOffset = this.jqLayout.offset();

            // fix for infinite scroll issue in iPad
            if (sap.ui.Device.system.tablet === true && sap.ui.Device.system.desktop === false) {
                this.jqLayout.css('height', this.jqLayoutInner.height());
            }

            var visibleLayoutItems = this.layout.getVisibleLayoutItems();
            if (!visibleLayoutItems) {
                return;
            }
            this.aCardsOrder = visibleLayoutItems.map(function (item) {
                var element = item.$().parent()[0];
                element.posDnD = {
                    width: element.offsetWidth,
                    height: element.offsetHeight
                };
                element.style.width = element.offsetWidth + "px";
                return element;
            });
            var jqFirstColumn = this.jqLayoutInner.children().first();
            var marginProp = (this.isRTLEnabled === 1) ? "margin-left" : "margin-right";
            this.verticalMargin = parseInt(jqFirstColumn.css(marginProp), 10);
            var firstItemEl = this.aCardsOrder[0];
            this.horizontalMargin = parseInt(jQuery(firstItemEl).css("margin-bottom"), 10);
            this.columnCount = this.layout.getColumnCount();
            this.top = firstItemEl.getBoundingClientRect().top - this.jqLayoutInner[0].getBoundingClientRect().top;
            this.left = firstItemEl.getBoundingClientRect().left - this.jqLayoutInner[0].getBoundingClientRect().left;
            this.width = firstItemEl.offsetWidth;

            jQuery(this.aCardsOrder).css("position", "absolute");
            this.drawLayout(this.aCardsOrder);

            //all elements are switched to position absolute to prevent layout from collapsing we put height on it like it was before change.
            //and fix scroll, so user will not see position changes on the screen.
            this.jqLayoutInner.height(layoutHeight);
            this.jqLayout.scrollTop(layoutScroll);

        };

        //put all elements to new position.
        ReplaceItems.prototype.drawLayout = function (aCardsLayout) {
            var oCountColumnHeight = [];
            for (var i = 0; i < this.columnCount; i++) {
                oCountColumnHeight[i] = 0;
            }
            for (var naturalIndex = 0; naturalIndex < aCardsLayout.length; naturalIndex++) {
                var currentColumn = naturalIndex % this.columnCount;
                var currentHeight = oCountColumnHeight[currentColumn]++;
                var currentLeft = this.left - this.isRTLEnabled * (currentColumn * this.verticalMargin + currentColumn * this.width);
                var currentTop = this.top;
                var domElement = aCardsLayout[naturalIndex];

                for (var j = 0; j < currentHeight; j++) {
                    currentTop += this.horizontalMargin;
                    var parentIndex = naturalIndex - (j + 1) * this.columnCount;
                    currentTop += aCardsLayout[parentIndex].posDnD.height;
                }

                domElement.posDnD.top = currentTop;
                domElement.posDnD.bottom = currentTop + domElement.posDnD.height;
                domElement.posDnD.left = currentLeft;
                domElement.posDnD.right = currentLeft + domElement.posDnD.width;
                this.updateElementCSS(aCardsLayout[naturalIndex]);
            }
        };

        ReplaceItems.prototype.updateElementCSS = function (element) {
            jQuery(element).css({
                top: element.posDnD.top,
                left: element.posDnD.left
            });
        };

        //callback when drag starts
        ReplaceItems.prototype._dragStartHandler = function (evt, cardElement) {

            //Array to store position swap changes
            this.positionChanges = [];
            //Prevent the browser to mark any elements while dragging
            if (sap.ui.Device.system.desktop) {
                jQuery('body').addClass("sapOVPDisableUserSelect sapOVPDisableImageDrag");
            }

            //Prevent selection of text on tiles and groups
            if (window.getSelection) {
                var selection = window.getSelection();
                selection.removeAllRanges();
            }
            this.initCardsSettingsForDragAndDrop();
        };

        //callback before clone created
        ReplaceItems.prototype._beforeDragHandler = function (evt, ui) {
            //Prevent text selection menu and magnifier on mobile devices
            if (sap.ui.Device.browser.mobile) {
                this.selectableElemets = jQuery(ui).find('.sapUiSelectable');
                this.selectableElemets.removeClass('sapUiSelectable');
            }
            jQuery(this.settings.wrapper).addClass("dragAndDropMode");
        };

        //model changes, and cleanup after drag and drop finished
        ReplaceItems.prototype._dragEndHandler = function (evt, ui) {
            this.lastCollidedEl = null;
            // replacing items only if the drag and drop is completed via lifting the mouse key
            if (evt.type == 'mouseup' || evt.type == 'touchend') {
                if (this.aCardsOrder) {
                    this.afterReplaceElements(this.aCardsOrder);
                }
            }
            //Cleanup added classes and styles before drag
            if (sap.ui.Device.system.desktop) {
                jQuery('body').removeClass("sapOVPDisableUserSelect sapOVPDisableImageDrag");
            }
            jQuery(this.settings.wrapper).removeClass("dragAndDropMode");
            if (this.jqLayoutInner) {
                this.jqLayoutInner.removeAttr("style");
            }
            if (this.aCardsOrder) {
                jQuery(this.aCardsOrder).removeAttr("style");
            }
            this.uiActions.removeClone();
        };

        ReplaceItems.prototype._endHandler = function (evt, ui) {
            //Prevent text selection menu and magnifier on mobile devices
            if (sap.ui.Device.browser.mobile && this.selectableElemets) {
                this.selectableElemets.addClass('sapUiSelectable');
            }
        };

        ReplaceItems.prototype.getSwapItemsFunction = function () {
            return this.dragAndDropSwapElementForKeyboardNavigation.bind(this);
        };

        ReplaceItems.prototype.destroy = function () {
            if (this.uiActions) {
                this.uiActions.disable();
                this.uiActions = null;
            }
        };

        var DragAndDropFactory = {
            buildReplaceItemsInstance: function (settings) {
                var defaultSettings = {
                    containerSelector: ".sapUshellEasyScanLayoutInner",
                    wrapper: ".sapUshellEasyScanLayout",
                    draggableSelector: ".easyScanLayoutItemWrapper",
                    placeHolderClass: "easyScanLayoutItemWrapper-placeHolder",
                    cloneClass: "easyScanLayoutItemWrapperClone",
                    moveTolerance: 10,
                    switchModeDelay: 800,
                    isTouch: !sap.ui.Device.system.desktop,
                    debug: false
                };

                settings = jQuery.extend(defaultSettings, settings);
                return new ReplaceItems(settings);
            }
        };

        var KeyboardNavigation = function (easyScanLayout, swapItemsFunction) {
            this.init(easyScanLayout, swapItemsFunction);
        };

        KeyboardNavigation.prototype.init = function (easyScanLayout, swapItemFunction) {
            this.easyScanLayout = easyScanLayout;
            this.swapItemsFunction = (typeof swapItemFunction === "function") ? swapItemFunction : function () {
            };
            this.keyCodes = jQuery.sap.KeyCodes;
            this.jqElement = easyScanLayout.$();
            this.jqElement.on('keydown.keyboardNavigation', this.keydownHandler.bind(this));
            this.jqElement.find(".after").on("focus.keyboardNavigation", this.afterFocusHandler.bind(this));
            this.jqElement.find(".sapUshellEasyScanLayoutInner").on("focus.keyboardNavigation", this.layoutFocusHandler.bind(this));
            this.jqElement.on("focus.keyboardNavigation", ".easyScanLayoutItemWrapper", this.layoutItemFocusHandler.bind(this));
            this._ignoreSelfFocus = false;
            this.swapSourceElement = null;
            // variables to capture the last focussed element inside the card that will be used
            // for f7 handling
            this.lastFocussedElement = null;
            this.lastFocussedClassId = null;

            // handler function for ctrl + up/down keys since the control + updown arrows are not triggered on keydown
            this.jqElement.on('keyup', this.ctrlArrowUpDownHandler.bind(this));
        };

        /*
         function to handle keydown for ctrl + up/down arrows and ctrl + pg up/down
         */
        KeyboardNavigation.prototype.ctrlArrowUpDownHandler = function (e) {
            switch (e.keyCode) {
                case this.keyCodes.ARROW_UP:
                    if (e.ctrlKey == true) {
                        this.ctrlArrowHandler(e);
                        this.arrowUpDownHandler(e, true);
                    }
                    break;
                case this.keyCodes.ARROW_DOWN:
                    if (e.ctrlKey == true) {
                        this.ctrlArrowHandler(e);
                        this.arrowUpDownHandler(e, false);
                    }
                    break;
                case this.keyCodes.PAGE_UP:
                    if (e.ctrlKey) {
                        this.ctrlArrowHandler(e);
                        this.pageUpDownHandler(e, true);
                    }
                    break;
                case this.keyCodes.PAGE_DOWN:
                    if (e.ctrlKey) {
                        this.ctrlArrowHandler(e);
                        this.pageUpDownHandler(e, false);
                    }
                    break;
            }
        };

        KeyboardNavigation.prototype.destroy = function () {
            if (this.jqElement) {
                this.jqElement.off(".keyboardNavigation");
                this.jqElement.find(".after").off(".keyboardNavigation");
                this.jqElement.find(".sapUshellEasyScanLayoutInner").off(".keyboardNavigation");
            }
            delete this.jqElement;
            delete this.easyScanLayout;
        };

        KeyboardNavigation.prototype.getVisibleLayoutItems = function () {
            //layout items could be hidden, so we filter them and receive only visible
            var content = this.easyScanLayout.getContent();
            var filteredItems = content.filter(function (item) {
                return item.getVisible();
            });
            return filteredItems;
        };

        KeyboardNavigation.prototype.afterFocusHandler = function () {
            //two options are possible, or focus came to us from outside, as a result of outside navigation (Shift+tab Shift+F6 etc...)
            //or we put focus as a result of Tab button inside layout, to maintain Accessibility guide:
            // If focus is on the last control inside a Item, move focus to the next control in the tab chain after the Item Container
            if (this._ignoreSelfFocus) {
                //focus was on the last control inside a Item, move focus to the next control in the tab chain after the Item Container
                //so, this function was called from tabButtonHandler,  we put focus on after element, so browser will move it outside of layout
                this._ignoreSelfFocus = false;
                return;
            }
            //focus came to us from outside, as a result of outside navigation (Shift+tab Shift+F6 etc...)
            //	On enter first time, move focus to the last control of the first Item.
            //	On enter any consecutive time, move focus to the last control of the Item which had the focus before
            var jqItem = this.jqElement.find(".easyScanLayoutItemWrapper:sapTabbable").first();
            var lastTabbable = jqItem.find(":sapTabbable").last();
            if (!lastTabbable.length) {
                lastTabbable = jqItem;
            }
            lastTabbable.focus();
        };

        KeyboardNavigation.prototype.layoutFocusHandler = function () {
            //two options are possible, or focus came to us from outside, as a result of outside navigation (tab F6 etc...)
            //or we put focus as a result of Shift+Tab button inside layout, to maintain Accessibility guide:
            // If focus is on a Item, move focus to the previous control in the tab chain before the Item Container.
            if (this._ignoreSelfFocus) {
                //focus was on the Item, move focus to the previous control in the tab chain before the Item Container
                //so  this function was called from shiftTabButtonHandler, and we put focus on layout itself, so browser will move it outside of layout
                this._ignoreSelfFocus = false;
                return;
            }
            //focus was received from outside element
            //On enter first time, move focus to the first Item (as a whole).
            //On enter any consecutive time, move focus to the Item which had the focus before.
            this.jqElement.find(".easyScanLayoutItemWrapper:sapTabbable").first().focus();
        };

        KeyboardNavigation.prototype.layoutItemFocusHandler = function () {
            var jqFocused = jQuery(document.activeElement);

            // Check that focus element exits, id this item exits it will be easyScanLayoutItemWrapper (because the jQuery definitions
            // After we have the element we want to add to his aria-labelledby attribute all the IDs of his sub elements that have aria-label and role headind
            if (jqFocused) {

                // Select all sub elements with aria-label
                var labelledElement = jqFocused.find("[aria-label]");
                var i, strIdList = "";


                // code to add the aria label for the ObjectNumber having state.
                // We need to add both the value state as well as the text to be added to the aria-label
                if (jqFocused.find('.valueStateText').length == 1) {
                    var sText = jqFocused.find('.valueStateText').find('.sapMObjectNumberText').text();
                    var sValueState = jqFocused.find('.valueStateText').find('.sapUiInvisibleText').text();
                    jqFocused.find('.valueStateText').attr('aria-label', sText + " " + sValueState);
                    jqFocused.find('.valueStateText').attr('aria-labelledby', "");
                }

                //replacing the aria-label for the KPI header and making it similar to the content of the control
                if (jQuery(labelledElement).hasClass('kpiHeaderClass')) {
                    var sKpiHeaderText = jQuery(labelledElement).closest('div.kpiHeaderClass').text();
                    jQuery(labelledElement).closest('div.kpiHeaderClass').attr('aria-label', sKpiHeaderText);
                }

                jqFocused.find("[role='listitem']").attr('aria-label', "");

                // creating a dummy div that contains the position of the card in the application and refering it's id in the aria-labelledby for the card container
                if (jqFocused.hasClass('easyScanLayoutItemWrapper')) {
                    var sCountDivId = "";
                    var cardCountDiv = jqFocused.find('.cardCount');
                    var sCardPositionText = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("cardPositionInApp", [jqFocused.attr('aria-posinset'), jqFocused.attr('aria-setsize')]);
                    if (cardCountDiv.length === 0) {
                        sCountDivId = "countDiv_" + new Date().getTime();
                        var sDummyDivForCardCount = '<div id="'+ sCountDivId +'" class="cardCount" aria-label="'+ sCardPositionText +'" hidden></div>';
                        jqFocused.append(sDummyDivForCardCount);
                    } else {
                        sCountDivId = cardCountDiv[0].id;
                        cardCountDiv.attr('aria-label', sCardPositionText);
                    }
                    strIdList += sCountDivId + " ";
                    var oCardType = jqFocused.find('.cardType');
                    if (oCardType.length !== 0) {
                        strIdList += oCardType[0].id + " ";
                    }
                }

                // adding the text card header before if the focus is on the header section
                if (jqFocused.hasClass('sapOvpCardHeader') && !jqFocused.hasClass('sapOvpStackCardContent')) {
                    var sCardHeaderTypeDivId = "";
                    var cardHeaderDiv = jqFocused.find('.cardHeaderType');
                    if (cardHeaderDiv.length === 0) {
                        var sCardHeaderType = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("CardHeaderType");
                        sCardHeaderTypeDivId = "cardHeaderType_" + new Date().getTime();
                        var sDummyDivForCardHeader = '<div id="'+ sCardHeaderTypeDivId +'" class="cardHeaderType" aria-label="'+ sCardHeaderType +'" hidden></div>';
                        jqFocused.append(sDummyDivForCardHeader);
                    } else {
                        sCardHeaderTypeDivId = cardHeaderDiv[0].id;
                    }

                    strIdList += sCardHeaderTypeDivId + " ";
                }

                //  Add every element id with aria label and e heading inside the LayoutItemWrapper to string list
                for (i = 0; i < labelledElement.length; i++) {
                    if (labelledElement[i].getAttribute("role") === "heading") {
                        strIdList += labelledElement[i].id + " ";
                    }
                }

                if (jqFocused.hasClass('sapOvpCardHeader')) {
                    var cardHeaders = jqFocused.find('.cardHeaderText');
                    if (cardHeaders.length !== 0) {
                        for (var i = 0; i < cardHeaders.length; i++) {
                            strIdList += cardHeaders[i].id + " ";
                        }
                    }
                }

                // add the id string list to the focus element (warpper) aria-labelledby attribute
                if (strIdList.length) {
                    jqFocused.attr("aria-labelledby", strIdList);
                }
            }
        };

        //return array index of visible items from layout content aggregation
        KeyboardNavigation.prototype._getLayoutItemIndex = function (jqFocused) {
            if (!jqFocused.hasClass("easyScanLayoutItemWrapper")) {
                return false;
            }
            var currentItemId = jqFocused.children().attr("id");
            var itemIndex = false;
            this.getVisibleLayoutItems().forEach(function (item, index) {
                if (currentItemId == item.getId()) {
                    itemIndex = index;
                }
            });
            return itemIndex;
        };

        KeyboardNavigation.prototype._changeItemsFocus = function (jqItem) {
            //to preserve last focusable item, we need to set all other items tabindex=-1
            var jqTabbableElements = jQuery('.easyScanLayoutItemWrapper');
            jqTabbableElements.attr("tabindex", "-1");
            jqItem.attr("tabindex", 0);
            // waiting for the item to change the position and set on the DOM
            // before adding the focus to the current item
            setTimeout(function () {
                jqItem.focus();
            }, 500);
        };

        KeyboardNavigation.prototype._swapItemsFocus = function (e, jqItemFrom, jqItemTo) {
            //to preserve last focusable item, first item received tabindex=-1, second tabindex=-1.
            e.preventDefault();
            jqItemFrom.attr("tabindex", "-1");
            // waiting for the scroll to happen and set on the DOM
            // before changing the focus to the new position
            setTimeout(function () {
                jqItemTo.attr("tabindex", "0").focus();
            }, 0);
        };


        KeyboardNavigation.prototype.tabButtonHandler = function (e) {
            //Forward navigation:
            //On enter first time, move focus to the first Item (as a whole).
            //On enter any consecutive time, move focus to the Item which had the focus before.
            //If focus is on a Item, move focus to the first control in the tab chain inside the Item.
            //If focus is on a control inside a Item, move focus to the next control in the tab chain inside the same Item.
            //If focus is on the last control inside a Item, move focus to the next control in the tab chain after the Item Container
            var jqFocusedElement = jQuery(document.activeElement);
            this.lastFocussedElement = jqFocusedElement;
            if (jqFocusedElement.hasClass("easyScanLayoutItemWrapper")) {
                return;
            }
            var jqItem = jqFocusedElement.closest(".easyScanLayoutItemWrapper");
            //need to check if focus is inside layout item
            if (!jqItem.length) {
                return;
            }
            //we know that focus is inside item, so now we want to check if it is last focusable.
            var jqTabbables = jqItem.find(":sapTabbable");
            //need to filter elements which have `after` in id, becouse those are dummy focusable elements and they
            // prevent us from finding real last element
            jqTabbables = jqTabbables.filter(":not([id$=after])");
            //if currently focused element is itm's last one, then we place focus outside of layout
            if (jqTabbables.eq(jqTabbables.length - 1).is(jqFocusedElement)) {
                e.stopPropagation();
                e.stopImmediatePropagation();
                var beforeScrollLocation = this.jqElement.scrollTop();
                this._ignoreSelfFocus = true;
                this.jqElement.find(".after").focus();
                this.jqElement.scrollTop(beforeScrollLocation);
            }
        };

        KeyboardNavigation.prototype.f7Handler = function (e) {
            //If focus is on a Item, move focus to the control inside the Item. Default: first control in the tab chain inside the Item.
            //If focus is on a control inside a Item, move focus to the Item.
            var jqFocusedElement = jQuery(document.activeElement);
            if (jqFocusedElement.hasClass("easyScanLayoutItemWrapper")) {
                //focus on item we place on first element inside
                jqFocusedElement.find(":sapTabbable").first().focus();
            } else {
                //focus inside item, we put it on item itself
                jqFocusedElement.closest(".easyScanLayoutItemWrapper").focus();
            }
            e.preventDefault();
        };

        KeyboardNavigation.prototype.shiftTabButtonHandler = function (e) {
            //Backward navigation:
            //On enter first time, move focus to the last control of the first Item.
            //If focus is on a control inside a Item, move focus to the previous control in the tab chain inside the same Item.
            //If focus is on the first control inside a Item, move focus to the corresponding Item (as a whole).
            //If focus is on a Item, move focus to the previous control in the tab chain before the Item Container.
            var jqFocusedElement = jQuery(document.activeElement);

            if (jqFocusedElement.hasClass('after')) {
                this.lastFocussedElement.focus();
                return;
            }

            if (!jqFocusedElement.hasClass("easyScanLayoutItemWrapper")) {
                return;
            }
            //focus was on the Item, move focus to the previous control in the tab chain before the Item Container
            //we  put focus on layout itself, so browser will move it outside of layout
            this._ignoreSelfFocus = true;
            this.jqElement.find(".sapUshellEasyScanLayoutInner").focus();
        };

        KeyboardNavigation.prototype.arrowUpDownHandler = function (e, isArrowUp) {
            //UP - If focus is on a Item, move focus to the Item above. If focus is on the first Item of a column, do nothing.
            //DOWN - If focus is on a Item, move focus to the Item below. If focus is on the last Item of a column, do nothing.
            e.preventDefault();
            var fName = isArrowUp ? "prev" : "next";
            var jqFocused = jQuery(document.activeElement);
            if (!jqFocused.hasClass("sapOvpCardHeader")) {
                var nextFocus = jQuery(jqFocused)[fName](".easyScanLayoutItemWrapper");
                if (!nextFocus.is(jqFocused)) {
                    this._swapItemsFocus(e, jqFocused, nextFocus);
                }
            }
        };

        KeyboardNavigation.prototype.arrowRightLeftHandler = function (e, isArrowRight) {
            //Left - If focus is on a Card, move focus one Card to the left.
            //      If focus is on the first Card of a row, move focus to the last Card of the previous row.
            //      If focus is on the first Card, do nothing.
            //Right - If focus is on a Card, move focus one Card to the right.
            //      If focus is on the last Card of a row, move focus to the first Card of the next row.
            //      If focus is on the last Card, do nothing.
            var indexDiff = isArrowRight ? 1 : -1;
            var jqFocused = jQuery(document.activeElement);
            var currentItemIndex = this._getLayoutItemIndex(jqFocused);
            if (currentItemIndex === false) {
                return;
            }
            var oItem = this.getVisibleLayoutItems()[currentItemIndex + indexDiff];
            if (oItem) {
                this._swapItemsFocus(e, jqFocused, oItem.$().parent());
            }
        };

        KeyboardNavigation.prototype.altPageUpAndHomeHandler = function (e) {
            //If focus is on a Card, move focus to the first Card of the same row.
            //If focus is on the first Card of a row, move focus to the first item within the Card Container.
            var jqFocused = jQuery(document.activeElement);
            var focusedElementIndex = this._getLayoutItemIndex(jqFocused);
            if (focusedElementIndex === false) {
                return;
            }
            var colCount = this.easyScanLayout.getColumnCount();
            var indexDelta = focusedElementIndex % colCount;
            var item;
            var layoutItems = this.getVisibleLayoutItems();
            if (indexDelta == 0) {
                //focus will be put to the first item in layout
                item = layoutItems[0];
            } else {
                //focus will be put to the first element in row
                item = layoutItems[focusedElementIndex - indexDelta];
            }

            this._swapItemsFocus(e, jqFocused, item.$().parent());
        };

        KeyboardNavigation.prototype.altPageDownAndEndHandler = function (e) {
            //If focus is on a Card, move focus to the last Card of the same row.
            //If focus is on the last Card of a row, move focus to the last item within the Card Container.
            var jqFocused = jQuery(document.activeElement);
            var focusedElementIndex = this._getLayoutItemIndex(jqFocused);
            if (focusedElementIndex === false) {
                return;
            }
            var colCount = this.easyScanLayout.getColumnCount();
            var indexDelta = focusedElementIndex % colCount;
            var item;
            var layoutItems = this.getVisibleLayoutItems();
            if ((indexDelta == (colCount - 1)) ||
                ((focusedElementIndex + (colCount - indexDelta)) > layoutItems.length)) {
                //focus wil be put to last layout item
                item = layoutItems[(layoutItems.length - 1)];
            } else {
                //focus will be put to last item in row
                item = layoutItems[focusedElementIndex + (colCount - indexDelta - 1)];
            }
            this._swapItemsFocus(e, jqFocused, item.$().parent());
        };

        KeyboardNavigation.prototype.ctrlHomeHandler = function (e) {
            //If focus is on a Card, move focus to the first Card of the same column.
            //If focus is on the first Card of a column, move focus to the first Card within the Card Container.
            var jqFocused = jQuery(document.activeElement);
            var focusedElementIndex = this._getLayoutItemIndex(jqFocused);
            if (focusedElementIndex === false) {
                return;
            }
            var colCount = this.easyScanLayout.getColumnCount();
            var indexDelta = focusedElementIndex % colCount;
            var visibleItems = this.getVisibleLayoutItems();
            var item = visibleItems[indexDelta];
            var nextFocus = item.$().parent();
            if (nextFocus.is(jqFocused)) {
                nextFocus = visibleItems[0].$().parent();
            }
            this._swapItemsFocus(e, jqFocused, nextFocus);
        };

        KeyboardNavigation.prototype.ctrlEndHandler = function (e) {
            //If focus is on a Card, move focus to the last Card of the same column.
            //If focus is on the last Card of a column, move focus to the last Card within the Card Container.
            var jqFocused = jQuery(document.activeElement);
            var focusedElementIndex = this._getLayoutItemIndex(jqFocused);
            if (focusedElementIndex < 0) {
                return;
            }
            var colCount = this.easyScanLayout.getColumnCount();
            var indexDelta = focusedElementIndex % colCount;
            var item;
            var visibleItems = this.getVisibleLayoutItems();
            for (var i = visibleItems.length - 1; i >= 0; i--) {
                if ((i % colCount) == indexDelta) {
                    item = visibleItems[i];
                    break;
                }
            }
            var nextFocus = item.$().parent();
            if (nextFocus.is(jqFocused)) {
                nextFocus = visibleItems[visibleItems.length - 1].$().parent();
            }
            this._swapItemsFocus(e, jqFocused, nextFocus);
        };
        /*
        KeyboardNavigation.prototype.altPageUpHandler = function (e) {
            //If focus is on a Card, move focus left by page size. Page size can be set by apps, default page size is 5 Cards.
            //If there are less Cards available than page size, move focus to the first Card of the row.
            //If focus is on the first Card of the row, do nothing.
            var jqFocused = jQuery(document.activeElement);
            var focusedElementIndex = this._getLayoutItemIndex(jqFocused);
            if (!focusedElementIndex) {
                return;
            }
            var colCount = this.easyScanLayout.getColumnCount();
            var indexDelta = focusedElementIndex % colCount;
            var item = this.getVisibleLayoutItems()[focusedElementIndex - indexDelta];
            this._swapItemsFocus(e, jqFocused, item.$().parent());
        };

        KeyboardNavigation.prototype.altPageDownHandler = function (e) {
            //If focus is on a Card, move focus right by page size. Page size can be set by apps, default page size is 5 Cards.
            //If there are less Cards available than page size, move focus to the last Card of the row.
            //If focus is on the last Card of the row, do nothing.
            var jqFocused = jQuery(document.activeElement);
            var focusedElementIndex = this._getLayoutItemIndex(jqFocused);
            if (focusedElementIndex < 0) {
                return;
            }
            var colCount = this.easyScanLayout.getColumnCount();
            var indexDelta = focusedElementIndex % colCount;
            var item;
            var layoutItems = this.getVisibleLayoutItems();
            if (indexDelta != (colCount - 1)) {
                item = layoutItems[focusedElementIndex + (colCount - indexDelta - 1)];
                if (!item) {
                    item = layoutItems[layoutItems.length - 1];
                }
                this._swapItemsFocus(e, jqFocused, item.$().parent());
            }
        };
        */

        KeyboardNavigation.prototype.pageUpDownHandler = function (e, isPageUp) {
            //move focus Up/Down to the first not visible (outside of viewport).
            //if all items (on direction) are visible, then to first/last
            var fName = isPageUp ? "prev" : "next";

            var jqFocused = jQuery(document.activeElement);
            if (!jqFocused.hasClass("easyScanLayoutItemWrapper")) {
                return;
            }
            if (!jqFocused[fName]().length) {
                return;
            }
            var nextFocusEl = false;
            var currentEl = jqFocused;
            var windowHeight = jQuery(window).height();
            //var layoutTop = this.jqElement.offset().top;
            //find first "outside of viewport" item
            while (!nextFocusEl) {
                var next = currentEl[fName]();
                if (!next.length) {
                    nextFocusEl = currentEl;
                    break;
                }
                if (!isPageUp && next.offset().top > windowHeight) {
                    nextFocusEl = next;
                    break;
                }
                var offset = next.offset().top;
                var sign = offset ? offset < 0 ? -1 : 1 : 0;
                if (isPageUp && (sign <= 0)) {
                    nextFocusEl = next;
                    break;
                }
                currentEl = next;
            }
            this._swapItemsFocus(e, jqFocused, nextFocusEl);
        };

        KeyboardNavigation.prototype.ctrlArrowHandler = function (e) {
            //Check that we are not in Drag mode already
            //then we need to start the DragMode if it's possible
            if (this.swapSourceElement == null) {
                this.swapSourceElement = jQuery(document.activeElement);
                if (!this.swapSourceElement.hasClass("easyScanLayoutItemWrapper")) {
                    this.endSwap();
                } else {
                    this.jqElement.on('keyup.keyboardNavigation', this.keyupHandler.bind(this));
                    //change css of the current element
                    this.jqElement.addClass('dragAndDropMode');
                    this.swapSourceElement.addClass('dragHovered');
                }
            }
        };

        KeyboardNavigation.prototype.keyupHandler = function (e) {
            //This is the case when we finished our Drag and Drop actions, and we want to swap items
            if (this.swapSourceElement != null && e.keyCode === this.keyCodes.CONTROL) {
                var jqFocused = jQuery(document.activeElement);
                if (jqFocused.hasClass("easyScanLayoutItemWrapper")) {
                    this.swapItemsFunction(this.swapSourceElement[0], jqFocused[0]);
                    this._changeItemsFocus(this.swapSourceElement);
                }
                this.endSwap();
            }
        };


        KeyboardNavigation.prototype.endSwap = function (e) {
            this.swapSourceElement.removeClass('dragHovered');
            this.jqElement.removeClass('dragAndDropMode');
            this.swapSourceElement = null;
            this.jqElement.off('keyup.keyboardNavigation');
        };

        KeyboardNavigation.prototype.checkIfSwapInterrupted = function (e) {
            //When Drag&Drop mode is enabled, any other button except arrowKey will stop Drag&Drop action
            if (this.swapSourceElement != null &&
                e.keyCode != this.keyCodes.ARROW_LEFT &&
                e.keyCode != this.keyCodes.ARROW_RIGHT &&
                e.keyCode != this.keyCodes.ARROW_UP &&
                e.keyCode != this.keyCodes.ARROW_DOWN) {
                this.endSwap();
            }
        };

        KeyboardNavigation.prototype.spacebarHandler = function (e) {
            // checking if the item has a press event associated and explicitly firing the press event on the item
            var item = sap.ui.getCore().byId(e.target.id);
            if (item && item.mEventRegistry.hasOwnProperty('press')) {
                jQuery('#' + e.target.id).addClass('sapMLIBActive');
                jQuery('#' + e.target.id + ' span').css('color', '#FFFFFF');
                item.firePress();
            }
        };

        KeyboardNavigation.prototype.keydownHandler = function (e) {
            //in case swap was interrupted call end swap
            this.checkIfSwapInterrupted(e);

            switch (e.keyCode) {
                case this.keyCodes.TAB:
                    (e.shiftKey) ? this.shiftTabButtonHandler(e) : this.tabButtonHandler(e);
                    break;
                case this.keyCodes.F6:
                    if (e.shiftKey) {
                        this._ignoreSelfFocus = true;
                        this.jqElement.find(".sapUshellEasyScanLayoutInner").focus();
                        jQuery.sap.handleF6GroupNavigation(e);
                    } else {
                        this._ignoreSelfFocus = true;
                        var beforeScrollLocation = this.jqElement.scrollTop();
                        this.jqElement.find(".after").focus();
                        jQuery.sap.handleF6GroupNavigation(e);
                        this.jqElement.scrollTop(beforeScrollLocation);
                    }
                    break;
                case this.keyCodes.F7:
                    this.f7Handler(e);
                    break;
                case this.keyCodes.ARROW_UP:
                    if (e.ctrlKey == true) {
                        this.ctrlArrowHandler(e);
                    }
                    this.arrowUpDownHandler(e, true);
                    break;
                case this.keyCodes.ARROW_DOWN:
                    if (e.ctrlKey == true) {
                        this.ctrlArrowHandler(e);
                    }
                    this.arrowUpDownHandler(e, false);
                    break;
                case this.keyCodes.ARROW_RIGHT:
                    if (e.ctrlKey == true) {
                        this.ctrlArrowHandler(e);
                    }
                    this.arrowRightLeftHandler(e, true);
                    break;
                case this.keyCodes.ARROW_LEFT:
                    if (e.ctrlKey == true) {
                        this.ctrlArrowHandler(e);
                    }
                    this.arrowRightLeftHandler(e, false);
                    break;
                case this.keyCodes.HOME:
                    (e.ctrlKey == true) ? this.ctrlHomeHandler(e) : this.altPageUpAndHomeHandler(e);
                    break;
                case this.keyCodes.END:
                    (e.ctrlKey == true) ? this.ctrlEndHandler(e) : this.altPageDownAndEndHandler(e);
                    break;
                case this.keyCodes.PAGE_UP:
                    (e.altKey == true) ? this.altPageUpAndHomeHandler(e) : this.pageUpDownHandler(e, true);
                    if (e.ctrlKey) {
                        this.ctrlArrowHandler(e);
                        this.pageUpDownHandler(e, true);
                    }
                    break;
                case this.keyCodes.PAGE_DOWN:
                    (e.altKey == true) ? this.altPageDownAndEndHandler(e) : this.pageUpDownHandler(e, false);
                    if (e.ctrlKey) {
                        this.ctrlArrowHandler(e);
                        this.pageUpDownHandler(e, false);
                    }
                    break;
                case this.keyCodes.SPACE:
                case this.keyCodes.ENTER:
                    this.spacebarHandler(e);
                    break;
            }
        };

        var EasyScanLayout = sap.ui.core.Control.extend("sap.ovp.ui.EasyScanLayout", {

            metadata: {
                designTime: true,
                library: "sap.ovp",
                aggregations: {
                    content: {type: "sap.ui.core.Control", multiple: true, singularName: "content"}
                },
                defaultAggregation: "content",
                events: {
                    afterRendering: {},
                    afterDragEnds: {},
                    afterColumnUpdate: {}
                },
                properties: {
                    useMediaQueries: {group: "Misc", type: "boolean", defaultValue: false},
                    dragAndDropRootSelector: {group: "Misc", type: "string"},
                    dragAndDropEnabled: {group: "Misc", type: "boolean", defaultValue: true},
                    debounceTime: {group: "Misc", type: "int", defaultValue: 150}
                }
            },

            renderer: {
                render: function (oRm, oControl) {
                    oRm.write("<div");
                    oRm.writeControlData(oControl);
                    oRm.addClass("sapUshellEasyScanLayout");
                    oRm.writeClasses();
                    oRm.write(">");

                    oRm.write("<div class='sapUshellEasyScanLayoutInner' role='list' tabindex='0' aria-label='Cards'>");

                    var columnCount = oControl.columnCount;
                    var columnList = Array.apply(null, new Array(columnCount)).map(function () {
                        return [];
                    });
                    var filteredItems = oControl.getContent().filter(function (item) {
                        return item.getVisible();
                    });
                    for (var i = 0; i < filteredItems.length; i++) {
                        columnList[i % columnCount].push(filteredItems[i]);
                    }
                    var itemCounter = 1;
                    columnList.forEach(function (column) {
                        oRm.write("<div");
                        oRm.addClass("easyScanLayoutColumn");
                        oRm.writeClasses();
                        oRm.write(">");
                        column.forEach(function (item, index) {
                            oRm.write("<div ");
                            (itemCounter === 1) ? oRm.write("tabindex='0' ") : oRm.write("tabindex='-1' ");
                            oRm.addClass("easyScanLayoutItemWrapper");
                            /* Commented out the following line as the screen reader reads out the role too which should ideally not be read out. See internal incident with ID: 1680054459 */
                            /* oRm.writeAccessibilityState(undefined, {role: "listitem"}); */
                            oRm.write("aria-setsize=" + filteredItems.length + " aria-posinset=" + itemCounter);
                            itemCounter++;
                            oRm.writeClasses();
                            oRm.write(">");
                            oRm.renderControl(item);
                            oRm.write("</div>");
                        });
                        oRm.write("</div>");
                    });

                    oRm.write("</div>");
                    // dummy after focusable area
                    oRm.write("<div class='after' tabindex='0'></div>");
                    oRm.write("</div>");
                }
            }

        });

        var getColumnResolutionList = function () {
            return [
                {minWidth: 0, styleClass: "columns-blank", columnCount: 1},
                {minWidth: 240, styleClass: "columns-block", columnCount: 1},
                {minWidth: 352, styleClass: "columns-narrow", columnCount: 1},
                {minWidth: 433, styleClass: "columns-wide", columnCount: 1},
                {minWidth: 704, styleClass: "columns-narrow", columnCount: 2},
                {minWidth: 864, styleClass: "columns-wide", columnCount: 2},
                {minWidth: 1024, styleClass: "columns-narrow", columnCount: 3},
                {minWidth: 1280, styleClass: "columns-wide", columnCount: 3},
                {minWidth: 1440, styleClass: "columns-narrow", columnCount: 4},
                {minWidth: 1800, styleClass: "columns-wide", columnCount: 4},
                {minWidth: 2560, styleClass: "columns-narrow", columnCount: 5},
                {minWidth: 3008, styleClass: "columns-wide", columnCount: 5},

                //This is for 8K and 4K Screens (on 3600px flp make 1rem - 32px)
                {minWidth: 3600, styleClass: "columns-narrow", columnCount: 4},
                {minWidth: 3840, styleClass: "columns-wide", columnCount: 4},
                {minWidth: 5120, styleClass: "columns-wide", columnCount: 5},
                {minWidth: 6016, styleClass: "columns-wide", columnCount: 5}
            ];
        };

        EasyScanLayout.prototype.init = function () {
            this.data("sap-ui-fastnavgroup", "true", true);
            this.columnResolutionList = getColumnResolutionList();
            this.columnCount = this.columnResolutionList[0].columnCount;
            this.columnStyle = "";
            this.updateColumnClass(this.columnResolutionList[0].styleClass);
            var matchMediaSupported = sap.ui.Device.browser.msie && sap.ui.Device.browser.version > 9;
            if (matchMediaSupported && this.getUseMediaQueries()) { //if matchMedia supported and full page --> use media queries
                this.mediaQueryList = this.initMediaListeners(this.columnResolutionList);
            } else { //if not full page --> use resize handler
                this.resizeHandlerId = this.initResizeHandler(this.columnResolutionList);
            }
        };

        var mediaListenerHandlerTimerId;

        var mediaListenersDebounce = function (columnCount, columnStyle, mq) {
            var mediaListenerHandler = function (cols, className) {
                this.updateColumnClass(className);
                this.refreshColumnCount(cols, this.getContent());
            };
            if (mq.matches) {
                window.clearTimeout(mediaListenerHandlerTimerId);
                mediaListenerHandlerTimerId = window.setTimeout(mediaListenerHandler.bind(this, columnCount, columnStyle), this.getDebounceTime());
            }
        };

        var buildQuery = function (bottomRes, topRes) {
            var min = bottomRes.minWidth;
            var max = topRes && topRes.minWidth;
            return "(min-width: " + min + "px)" + (max ? " and (max-width: " + (max - 1) + "px)" : "");
        };

        EasyScanLayout.prototype.initMediaListeners = function (colResList) {
            var mediaQueryList = [];
            for (var i = 0; i < colResList.length; i++) {
                var query = buildQuery(colResList[i], colResList[i + 1]);
                var mediaQuery = window.matchMedia(query);
                var boundedListener = mediaListenersDebounce.bind(this, colResList[i].columnCount, colResList[i].styleClass);
                mediaQuery.addListener(boundedListener);
                mediaQuery.bindedListener = boundedListener;
                boundedListener(mediaQuery);
                mediaQueryList.push(mediaQuery);
            }
            return mediaQueryList;
        };

        EasyScanLayout.prototype.initResizeHandler = function (colResList) {
            var resizeHandlerTimerId;
            var debounceTime = this.getDebounceTime();
            var resizeHandlerDebounce = function () {
                window.clearTimeout(resizeHandlerTimerId);
                resizeHandlerTimerId = window.setTimeout(this.oControl.resizeHandler.bind(this, colResList), debounceTime);
            };

            return sap.ui.core.ResizeHandler.register(this, resizeHandlerDebounce);
        };

        EasyScanLayout.prototype.resizeHandler = function (colResList) {
            var width = this.iWidth;
            var that = this;
            var oControl = this.oControl;
            var resObject;
            if (jQuery(".sapFDynamicPageContent").length > 0) {
                width = window.innerWidth;
            }
            for (var i = 0; i < colResList.length; i++) {
                if (!colResList[i + 1]) {
                    resObject = colResList[i];
                    break;
                }
                if (colResList[i].minWidth <= width && colResList[i + 1].minWidth > width) {
                    resObject = colResList[i];
                    break;
                }
            }
            
            oControl.refreshColumnCount(resObject.columnCount, oControl.getContent(),that);
            oControl.updateColumnClass(resObject.styleClass);
            oControl.fireAfterColumnUpdate(resObject);
        };

        /*This function is used to get the width of the cards based on the screen size, dependent on less file*/
        EasyScanLayout.prototype.getColumnWidth = function (styleClass) {
            var columnWidth;
            switch (styleClass) {
                case "columns-blank":
                    columnWidth = 0;
                    break;
                case "columns-narrow":
                    columnWidth = 20;
                    break;
                case "columns-wide":
                    columnWidth = 25;
                    break;
            }
            return columnWidth;
        };

        EasyScanLayout.prototype.refreshColumnCount = function (columnCount, content, that) {
            this.columnCount = columnCount;
            var jqColumnsNew = jQuery();
            for (var i = 0; i < columnCount; i++) {
                jqColumnsNew = jqColumnsNew.add("<div class='easyScanLayoutColumn'/>");
            }
            var filteredItems = content.filter(function (item) {
                return item.getVisible();
            });
            var nCardPosition = 1;
            for (var j = 0; j < filteredItems.length; j++) {
                jQuery(filteredItems[j].getDomRef()).parent().attr('aria-posinset', nCardPosition);
                nCardPosition++;
                jqColumnsNew.get(j % columnCount).appendChild(filteredItems[j].getDomRef().parentNode);
            }
            this.$().children(".sapUshellEasyScanLayoutInner").empty().append(jqColumnsNew);
            if (that && that.iWidth) {
                this.headerMargin(that);
            }
        };

        EasyScanLayout.prototype.headerMargin = function (that) {
            var contentWidth = 0,
                marginAdd = 0;
            var width = that.iWidth;
            var resObject,
                margin,
                columnsContainerWidth,
                scrollWidth = 0, //width of the scroll bar
                columnWidth,
                val = 0;
            var colResList = getColumnResolutionList();
            var iRemToPx = commonUtils.getPixelPerRem();
            var screenWidth = (window.innerWidth * 1.0) / iRemToPx;
            if (jQuery(".sapFDynamicPageContent").length > 0) {
                width = window.innerWidth;
            }
            for (var i = 0; i < colResList.length; i++) {
                if (!colResList[i + 1]) {
                    resObject = colResList[i];
                    break;
                }
                if (colResList[i].minWidth <= width && colResList[i + 1].minWidth > width) {
                    resObject = colResList[i];
                    break;
                }
            }
            columnWidth = this.getColumnWidth(resObject.styleClass);

            /*multiplied by 16 to convert rem to px and
             columnCount-1 gives the number of paddings in the column container
             and is being multiplied by 1 as the padding between the columns is 1rem */
            columnsContainerWidth = (resObject.columnCount * columnWidth + (resObject.columnCount - 1) * 1);
            if (sap.ui.Device.system.desktop) {
                scrollWidth = jQuery('.sapFDynamicPageScrollBar').css('width');
                if (typeof scrollWidth === "string" || scrollWidth instanceof String) { //take string with a rem unit
                    val = scrollWidth.length > 0 ? parseInt(scrollWidth.split("px")[0], 10) : 0;
                }
                scrollWidth = (val * 1.0) / iRemToPx;
            }
            margin = (screenWidth - scrollWidth - columnsContainerWidth) / 2;
            jQuery('.sapFDynamicPageTitle').css({"margin-left": margin + "rem", "margin-right": margin + "rem","visibility": "visible"});
            jQuery('.sapFDynamicPageHeader').css({"margin-left": margin + "rem", "margin-right": margin + "rem","visibility": "visible"});

            
            if (sap.ui.Device.system.desktop) {
                screenWidth = jQuery("body").width();
                if (jQuery(".sapFDynamicPageContentFitContainer").length > 0) {
                    contentWidth = jQuery(".sapFDynamicPageContentFitContainer")[0].clientWidth;
                }

                if (screenWidth === contentWidth) {
                    var marginLeft = jQuery('.sapFDynamicPageTitle').css('margin-left');
                    var marginRight = jQuery('.sapFDynamicPageTitle').css('margin-right');
                    if (typeof marginLeft === "string" || marginLeft instanceof String) {
                        marginLeft = marginLeft.length > 0 ? parseInt(marginLeft.split("px")[0], 10) : 0;
                    }
                    if (typeof marginRight === "string" || marginRight instanceof String) { //take string with a rem unit
                        marginRight = marginRight.length > 0 ? parseInt(marginRight.split("px")[0], 10) : 0;
                    }
                    scrollWidth = jQuery('.sapFDynamicPageScrollBar').css('width');
                    if (typeof scrollWidth === "string" || scrollWidth instanceof String) { //take string with a rem unit
                        val = scrollWidth.length > 0 ? parseInt(scrollWidth.split("px")[0], 10) : 0;
                    }
                    scrollWidth = val;
                    marginAdd = scrollWidth / 2;
                    marginLeft = (marginLeft + marginAdd) / (iRemToPx * 1.0);
                    marginRight = (marginRight + marginAdd) / (iRemToPx * 1.0);
                    jQuery('.sapFDynamicPageTitle').css({"margin-left": marginLeft + "rem", "margin-right": marginRight + "rem", "visibility": "visible"});
                    jQuery('.sapFDynamicPageHeader').css({"margin-left": marginLeft + "rem", "margin-right": marginRight + "rem", "visibility": "visible"});
                }
            }
        };

        EasyScanLayout.prototype.getColumnCount = function () {
            return this.columnCount;
        };

        EasyScanLayout.prototype.getVisibleLayoutItems = function () {
            //layout items could be hidden, so we filter them and receive only visible
            var content = this.getContent();
            var filteredItems = content.filter(function (item) {
                return item.getVisible();
            });
            return filteredItems;
        };

        EasyScanLayout.prototype.updateColumnClass = function (columnClass) {
            if (this.columnStyle === columnClass) {
                return;
            }
            this.removeStyleClass(this.columnStyle);
            this.addStyleClass(columnClass);
            this.columnStyle = columnClass;
        };


        EasyScanLayout.prototype.afterDragAndDropHandler = function (aElements) {
            var aAllControls = this.removeAllAggregation("content", true);
            var aVisibleControls = [];
            var iVizibleIndex = 0;
            //receive contols list from wrapperDOM list
            aElements.forEach(function (el, index) {
                var elementId = el.children[0].getAttribute("id");
                var oControl = sap.ui.getCore().byId(elementId);
                aVisibleControls.push(oControl);
                jQuery(el).attr('aria-posinset', index+1);
            });

            // We need to keep all controls in the content aggregation, keep
            // the original order and change the order only for the visible controls
            for (var i = 0; i < aAllControls.length; i++) {
                if (aAllControls[i].getVisible()) {
                    this.addAggregation("content", aVisibleControls[iVizibleIndex], true);
                    iVizibleIndex++;
                } else {
                    this.addAggregation("content", aAllControls[i], true);
                }

            }
            // Pass the position changes as parameter to be saved as delta changes for position
            this.fireAfterDragEnds({positionChanges: this.layoutDragAndDrop.positionChanges});
            this.refreshColumnCount(this.getColumnCount(), this.getContent());
        };


        EasyScanLayout.prototype.onAfterRendering = function () {
            if (!this.getDragAndDropRootSelector()) {
                this.setDragAndDropRootSelector("#" + this.getId());
            }
            if (this.layoutDragAndDrop) {
                this.layoutDragAndDrop.destroy();
            }
            if (this.getDragAndDropEnabled()) {
                this.layoutDragAndDrop = DragAndDropFactory.buildReplaceItemsInstance({
                    afterReplaceElements: this.afterDragAndDropHandler.bind(this),
                    rootSelector: this.getDragAndDropRootSelector(),
                    layout: this
                });
            }
            if (this.keyboardNavigation) {
                this.keyboardNavigation.destroy();
            }
            var swapItemsFunc = this.layoutDragAndDrop ? this.layoutDragAndDrop.getSwapItemsFunction() : null;
            this.keyboardNavigation = new KeyboardNavigation(this, swapItemsFunc);
            this.fireAfterRendering();
        };

        EasyScanLayout.prototype.exit = function () {
            if (this.mediaQueryList) {
                this.mediaQueryList.forEach(function (mediaQuery) {
                    mediaQuery.removeListener(mediaQuery.bindedListener);
                });
                delete this.mediaQueryList;
            }
            if (this.resizeHandlerId) {
                sap.ui.core.ResizeHandler.deregister(this.resizeHandlerId);
            }
            if (this.layoutDragAndDrop) {
                this.layoutDragAndDrop.destroy();
                delete this.layoutDragAndDrop;
            }
        };

        return EasyScanLayout;

    }, /* bExport= */ true);
