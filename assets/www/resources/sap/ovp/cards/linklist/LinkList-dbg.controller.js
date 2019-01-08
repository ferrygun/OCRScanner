(function() {
	"use strict";
	/*global sap, jQuery */
    jQuery.sap.require("sap.ovp.cards.CommonUtils");

	var ITEMHEIGHT_COZY = 72,
		ITEMHEIGHT_COZY_ONE_LINE_WITH_IMAGE = 56,
		ITEMHEIGHT_COZY_ONE_LINE_WITHOUT_IMAGE = 48,
		ITEMHEIGHT_COMPACT = 60,
		ITEMHEIGHT_COMPACT_ONE_LINE_WITH_IMAGE = 48,
        ITEMHEIGHT_COMPACT_ONE_LINE_WITHOUT_IMAGE = 40,
		CAROUSEL_PAGE_PADDING = 27,
		CAROUSEL_PAGE_INDICATOR = 8,
		LINKLIST_BORDER_TOP = 8,
		LINKLIST_BORDER_BOTTOM = 8,
		OVPLINKLIST = "ovpLinkList",
		PICTURECAROUSEL = "pictureCarousel",
		OVPCARDHEADER = "ovpCardHeader",
        ACTIVE = "sapMCrslActive";

	var oDelegateOnBefore = {
		onBeforeRendering: function(oEvent) {
			this.itemOnBeforeRendering(oEvent);
		}
	};
	var oDelegateOnAfter = {
		onAfterRendering: function(oEvent) {
			this.itemOnAfterRendering(oEvent);
		}
	};

	sap.ui.controller("sap.ovp.cards.linklist.LinkList", {

		onInit: function() {
			this._bInitialLoad = true;
            this._bListenerAttached = false;
            this._bListeningPopOver = false;
		},

		onBeforeRendering: function(oEvent) {
			var oCardPropertiesModel = this.getCardPropertiesModel();
			if (oCardPropertiesModel.getProperty("/listFlavor") === "standard" && !oCardPropertiesModel.getProperty("/staticContent")) {
				var oLiItem = this.byId("ovpCLI"); //Only available in case of Backend data
				if (oLiItem) {
					oLiItem.addEventDelegate(oDelegateOnBefore, this); //add a delegated "onBefore" event to the first list item. 
					//By this the method "itemOnBeforeRendering" is called
					//once the item will be rendered
				}
			}
		},

		onAfterRendering: function(oEvent) {
            this.attachingListenerToTheEventRefresh();
			var oCardPropertiesModel = this.getCardPropertiesModel();
			var iRows = oCardPropertiesModel.getProperty("/cardLayout/rowSpan");
			var iCols = oCardPropertiesModel.getProperty("/cardLayout/colSpan");

			switch (oCardPropertiesModel.getProperty("/listFlavor")) {
				case "standard":
                    if (oCardPropertiesModel.getProperty("/staticContent")) {
                        if (iCols && iRows) {
                            //Resizable card Layout
                            if (!this._bInitialLoad && this._aLinkListIds) {
                                this._mergeAllTheDataInOneList();
                            }
                            if (iRows === 1) {
                                this._aLinkListIds = [OVPLINKLIST]; //remember the id of the "List" element in the variable "_aLinkListIds" for further usage
                                this._setListColumnWidthInStandardCard(1);
                            } else {
                                this._itemOnEventBuildStandard(oCardPropertiesModel, iCols, iRows, true); //build the Standard Link List(s)
                            }
                        } else {
							// Fixed card Layout
							this._aLinkListIds = [OVPLINKLIST]; //remember the id of the "List" element in the variable "_aLinkListIds" for further usage
							this._setListColumnWidthInStandardCard(1);
						}
					}
					break;

				case "carousel":
                    var oCarousel = this.byId(PICTURECAROUSEL);

                    // This Change should be modified in case the third party library mobify-carousel is changed
                    if (oCarousel.getId().indexOf('.') !== -1) {
                        var $element = oCarousel.$();
                        $element.off('beforeSlide');
                        $element.on('beforeSlide', this.onBeforeSlide);
                        $element.trigger('beforeSlide', [1, 1]);
                    }
                    // End of this change

                    if (oCardPropertiesModel.getProperty("/staticContent")) {
						//Static Content
                        //If for carousel card, the defaultSpan property is defined in the manifest, "this._setListHeightInCarouselCard(iRows)" will be executed.
                        if (iRows && !(iRows === 1)) {
                            // Resizable card Layout
                            this._setListHeightInCarouselCard(iRows);
                        } else {
                            // Fixed card Layout
                            this._setListHeightInCarouselCard(-1);
                        }

                        this._setCarouselImageProperties(); // size the image properly ( Notice: the image will only be sized properly in case the carousel contains only one image)
					} else {
						// Backend Data
						oCarousel.addEventDelegate(oDelegateOnAfter, this); //add a delegated "onAfter" event to the carousel. 
						//By this the method "itemOnBeforeRendering" is called
						//once the carousel is rendered
					}
					break;

				case "grid": //experimental - DON´t USE
					jQuery.sap.log.info("FYI: currently nothing special to handle here");
					break;
			}
            if ('resizable' === oCardPropertiesModel.getProperty('/layoutDetail')) {
                var oCompData = this.getOwnerComponent().getComponentData();
                var oDashboardLayoutUtil = this.getDashboardLayoutUtil();
                var oCard = oDashboardLayoutUtil.dashboardLayoutModel.getCardById(oCompData.cardId);
                var sCardId = oDashboardLayoutUtil.getCardDomId(oCompData.cardId);
                var element = document.getElementById(sCardId);
                oCard.dashboardLayout.showOnlyHeader ? element.classList.add("sapOvpMinHeightContainer") : element.classList.remove("sapOvpMinHeightContainer");
            }
		},

        // This function should be modified in case the third party library mobify-carousel is changed
        onBeforeSlide: function(e, previousSlide, nextSlide) {
            // The event might bubble up from another carousel inside of this one.
            // In this case we ignore the event.
            if (e.target != this) {
                return;
            }

            var sPageIndicatorId = this.id + '-pageIndicator',
                oDomRef = document.getElementById(sPageIndicatorId);
            var oEl = oDomRef.querySelector('[data-slide=\'' + previousSlide + '\']');
            oEl.classList.remove(ACTIVE);
            oEl = oDomRef.querySelector('[data-slide=\'' + nextSlide + '\']');
            oEl.classList.add(ACTIVE);
        },

        getCardItemsBinding: function() {
            var linkList = this.getView().byId("ovpLinkList");
            var carousel = this.getView().byId("pictureCarousel");
            if (linkList) {
                return linkList.getBinding("items");
            } else if (carousel) {
                return carousel.getBinding("pages");
            } else {
                return null;
            }
        },

        attachingListenerToTheEventRefresh: function() {
            var oItemsBinding = this.getCardItemsBinding();
            var oCardPropertiesModel = this.getCardPropertiesModel();
            if (oItemsBinding) {
                if (!this._bListenerAttached) {
                    oItemsBinding.attachRefresh(function () {
                        if (this._aLinkListIds) {
                            for (var i = 1; i < this._aLinkListIds.length; i++) {
                                var oListAdd = this.byId(this._aLinkListIds[i]);
                                var iListLength = oListAdd.getItems().length;
                                oListAdd.getItems().splice(0, iListLength);
                                oListAdd.destroy();
                            }
                            this._aLinkListIds.splice(0, this._aLinkListIds.length);
                        }
                        if (this._oListRest) {
                            this._oListRest.destroy();
                        }
                    }.bind(this));
                    oItemsBinding.attachChange(function () {
                        this.settingHeightAndWidthOfLinkListCardsOnManageCardAndFilter();
                        if (oCardPropertiesModel.getProperty("/listFlavor") === "carousel") {
                            var oCarousel = this.byId(PICTURECAROUSEL);
                            oCarousel.addEventDelegate(oDelegateOnAfter, this);
                        }
                        if (oCardPropertiesModel.getProperty("/listFlavor") === "standard") {
                            var iTotal = oItemsBinding.getLength();
                            if (iTotal === 0) {
                                var oDomParent = this.byId(OVPLINKLIST).$().parent();
                                oDomParent.width("100%");
                            }
                        }
                    }.bind(this));
                } else if (this._aLinkListIds) {
                    this.settingHeightAndWidthOfLinkListCardsOnManageCardAndFilter();
                }
                this._bListenerAttached = true;
            }
        },

        settingHeightAndWidthOfLinkListCardsOnManageCardAndFilter: function() {
            if (this._aLinkListIds) {
                var oCardPropertiesModel = this.getCardPropertiesModel();
                var iRows = oCardPropertiesModel.getProperty("/cardLayout/rowSpan");
                var iCols = oCardPropertiesModel.getProperty("/cardLayout/colSpan");
                if (iRows) {
                    this._setListHeightInStandardCard(iRows);
                }
                if (iCols) {
                    this._setListColumnWidthInStandardCard(this._iVisibleColums);
                } else {
                    this._setListColumnWidthInStandardCard(1);
                }
            }
        },

		itemOnBeforeRendering: function(oEvent) {
			var oCardPropertiesModel = this.getCardPropertiesModel();
			switch (oCardPropertiesModel.getProperty("/listFlavor")) {
				case "standard":
                    //If there is no default span is not given in the manifest and the card is loaded for the first time and
                    // not a static card then read rowSpan from noOfItems property as set in annotationHelper
                    //Else read from rosSpan
                    if (!oCardPropertiesModel.getProperty("/defaultSpan") && !oCardPropertiesModel.getProperty("/staticContent") && oCardPropertiesModel.getProperty("/cardLayout/autoSpan")) {
                        var iRows = oCardPropertiesModel.getProperty("/cardLayout/noOfItems");
                    } else {
                        var iRows = oCardPropertiesModel.getProperty("/cardLayout/rowSpan");
                    }
					var iCols = oCardPropertiesModel.getProperty("/cardLayout/colSpan");
					var oList = this.byId(OVPLINKLIST);
					var aListItems = oList.getItems();
					//Loop over all list items and remove the delegated "onBefore" event
					for (var j = 0; j < aListItems.length; j++) {
						aListItems[j].removeEventDelegate(oDelegateOnBefore);
					}
					//build the Standard Link List(s)
					if (this._bInitialLoad) {
						this._itemOnEventBuildStandard(oCardPropertiesModel, iCols, iRows, true);
					} else {
						this._itemOnEventBuildStandard(oCardPropertiesModel, iCols, iRows, false);
					}
					break;

				case "carousel":
					jQuery.sap.log.info("FYI: currently nothing special to handle here");
					break;

				case "grid": //grid: experimental  -- DON´T USE
					jQuery.sap.log.info("FYI: currently nothing special to handle here");
					break;
			}
		},

        //Function to calculate the default row span during initial load for standard Linklist cards.
        getSpansWhenNoDefaultSpanMentioned: function () {
            var oCardPropertiesModel = this.getCardPropertiesModel();
            var iLinkListItemHeight = this._getLinkListItemHeight();
            var iHeaderHeight = 0;
            var oHeader = this.byId(OVPCARDHEADER);
            if (oHeader) {
                iHeaderHeight = oHeader.$().outerHeight();
            }
            var iRowHeight = oCardPropertiesModel.getProperty("/cardLayout/iRowHeightPx");
            return Math.ceil(((iLinkListItemHeight * 6) + ( iHeaderHeight + LINKLIST_BORDER_TOP + LINKLIST_BORDER_BOTTOM)) / iRowHeight);
        },

		itemOnAfterRendering: function(oEvent) {
			var oCardPropertiesModel = this.getCardPropertiesModel();
			var iRows = oCardPropertiesModel.getProperty("/cardLayout/rowSpan");
			var iCols = oCardPropertiesModel.getProperty("/cardLayout/colSpan");
			switch (oCardPropertiesModel.getProperty("/listFlavor")) {
				case "standard":
					//remove the delegated "onAfter" event on the last list item - if necessary it will be added again
					//this step is necessary as the actual last item might be next time not anymore the last item
					try {
						var oList = this.byId(OVPLINKLIST);
						var aListItems = oList.getItems(this._aLinkListIds[this._aLinkListIds.length - 1]);
						aListItems[aListItems.length - 1].removeEventDelegate(oDelegateOnAfter);
					} catch (e) {
						jQuery.sap.log.info("FYI: Unable to remove the delagted event at the last item of the last list");
					}

                    if (!oCardPropertiesModel.getProperty("/defaultSpan") && oCardPropertiesModel.getProperty("/cardLayout/autoSpan")) {
                        iRows = this.getSpansWhenNoDefaultSpanMentioned();
                    }
                    if (iRows) {
                        this._setListHeightInStandardCard(iRows);
                    }

					if (iCols) {
						// Resizable card Layout
						this._setListColumnWidthInStandardCard(this._iVisibleColums);
					} else {
						// Fixed card Layout
						this._setListColumnWidthInStandardCard(1);
					}
					break;

				case "carousel":
					//remove the delegated "onAfter" Event - if necessary if will added again
					try {
						var oCarousel = this.byId(PICTURECAROUSEL);
						oCarousel.removeEventDelegate(oDelegateOnAfter);
					} catch (e) {
						jQuery.sap.log.info("FYI: Unable to remove the delagted event on the carousel");
					}

                    if (iRows && !(iRows === 1)) {
                        // Resizable card Layout
                        this._setListHeightInCarouselCard(iRows);
                    } else {
                        // Fixed card Layout
                        this._setListHeightInCarouselCard(-1);
                    }

					// size the image properly ( Notice: the image will only be sized properly in case the carousel contains only one image)
					this._setCarouselImageProperties();
					break;

				case "grid": //grid: experimental  -- DON´T USE
					jQuery.sap.log.info("FYI: currently nothing special to handle here");
					break;
			}
            this._bInitialLoad = false;
		},

		_itemOnEventBuildStandard: function(oCardPropertiesModel, iCols, iRows, bInitiaLoad) {
			var iPossibleItems;
            var oList = this.byId(OVPLINKLIST);
            var duplicateRestList = this.getView().byId(this.getView().getId() + "--RestOfData");
            //Create a new list as a "container" for list items which are to much for the available space of the card
            if (duplicateRestList) {
                duplicateRestList.destroy();
            }
			if (bInitiaLoad && this._oListRest === undefined) {
				this._oListRest = new sap.m.List(this.getView().getId() + "--RestOfData", {});
			}
			this._aLinkListIds = [OVPLINKLIST]; //remember the id of the "List" element in the variable "_aLinkListIds" for further usage
			this._iAvailableItems = oList.getItems().length; //get the number a available items

			var iCardItems = oCardPropertiesModel.getProperty("/cardLayout/items"); //Number of items to be displayed - only available in Fixed Card Layout

			if (iCardItems !== undefined) {
				//Fixed card Layout
				this._iNoOfItemsPerColumn = iCardItems;
				iPossibleItems = iCardItems;
				this._iVisibleColums = 1;

			} else {
				//Resizable card Layout
				var iItemHeight = ITEMHEIGHT_COZY;
				try {
					iItemHeight = this._getLinkListItemHeight();
				} catch (e) {
					jQuery.sap.log.info("Error: " + e);
				}

				var iLinkListHeight = this._getListHeightInStandardCard(iRows); //calculate the available space for the items of one column

				this._iNoOfItemsPerColumn = Math.floor(iLinkListHeight / iItemHeight); //calculate list length ( = number of items per column )

				var iNeededColums = Math.ceil(this._iAvailableItems / this._iNoOfItemsPerColumn); // number of necessary columns to diplay all available items

				this._iVisibleColums = Math.min(iNeededColums, iCols); //get the number of columns for the card  

				iPossibleItems = this._iVisibleColums * this._iNoOfItemsPerColumn; //calculate the number of items which can be max. displayed on the card

			}
			if (iPossibleItems > this._iAvailableItems) {
				//less data available as space on the card, set iPossibleItems to the number of max. available items 
				iPossibleItems = this._iAvailableItems;
			} else {
                //remove all items which are too much for this card and add them to the "container" list
                for (var i = iPossibleItems; i < this._iAvailableItems; i++) {
                    oList.getItems()[i].setVisible(false);
                }
            }

			if (this._iVisibleColums > 1) {
				//more then one list is necessary so we need to dynamic create additional columns in addition to the one already delcared in the fragment 
				var oListRow = this.byId("ovpListRow");
				var iItemOfList = this._iNoOfItemsPerColumn; //Set the Startindex for the "first" new column
				var iLinkListIdCounter = 0; //ListId-Counter

				for (var j = this._iNoOfItemsPerColumn; j < iPossibleItems; j++) { //Loop over all items for the card
					if (iItemOfList >= this._iNoOfItemsPerColumn) {
						//create a new list as the list/column is filled completely 
						iItemOfList = 0; //reset the counter for the list itmes
						iLinkListIdCounter++; //increase the ListId-Counter
						var sLinkListId = OVPLINKLIST + iLinkListIdCounter;
						var oNewList = new sap.m.List(this.getView().getId() + "--" + sLinkListId, {
							showSeparators: oList.getProperty("showSeparators")
						});
						this._aLinkListIds.push(sLinkListId); //remeber the additional ListId as well 
						//add the necessary StyleClass to the new class
						if (oList.hasStyleClass("_iNoOfItemsPerColumnPaddingCozy")) {
							oNewList.addStyleClass("sapOvpLinkListStandardPaddingCozy");
						} else {
							oNewList.addStyleClass("sapOvpLinkListStandardPaddingCompact");
						}
						oListRow.addItem(oNewList); //add the List to the "HBox" which contains then all the displayed lists of the card
					}
					//add the next item of "original" list to the dynamic created list
					oNewList.addItem(oList.getItems()[this._iNoOfItemsPerColumn]);
					iItemOfList++;
				}
				//add a delegated "onAfter" event to the last item of the card
                //Action item - Need to check with Shashank
                if (oNewList) {
                    var aItemsLastList = oNewList.getItems();
                    aItemsLastList[aItemsLastList.length - 1].addEventDelegate(oDelegateOnAfter, this);
                }
			} else {
				//the card has only one column
				if (bInitiaLoad) {
					//as we are coming from the initial load all items already rendered -> call the method "itemOnAfterRendering" manually
					this.itemOnAfterRendering(null);
				} else {
					//add a delegated "onAfter" event to the last item of the list
					var aListItemsFirstList = oList.getItems();
					aListItemsFirstList[aListItemsFirstList.length - 1].addEventDelegate(oDelegateOnAfter, this);
				}
			}

		},

		/**
		 * Trigger resize of Card
		 * This methode is called by the DashboardLayouter once a card is resized
		 */
		resizeCard: function(newCardLayout) {
			//newCardLayout contains the new size values of the card (rowSpan and colSpan)
			var oCardPropertiesModel = this.getCardPropertiesModel();
			//update the CardPropertiesModel with the new card size values
			oCardPropertiesModel.setProperty("/cardLayout/rowSpan", newCardLayout.rowSpan);
			oCardPropertiesModel.setProperty("/cardLayout/colSpan", newCardLayout.colSpan);

			switch (oCardPropertiesModel.getProperty("/listFlavor")) {
				case "standard":
					this._resizeStandard(newCardLayout, oCardPropertiesModel);
					break;

				case "carousel":
					this._resizeCarousel(newCardLayout);

					break;

				case "grid": //grid: experimental  -- DON´T USE
					this._resizeGrid(newCardLayout);
					break;
			}
            //card was manually resized --> de-register handler
            if (this.resizeHandlerId) {
                sap.ui.core.ResizeHandler.deregister(this.resizeHandlerId);
                this.resizeHandlerId = null;
            }
            var oOvpContent = this.getView().byId('ovpCardContentContainer').getDomRef();
            if (oOvpContent) {
                if (newCardLayout.showOnlyHeader) {
                    oOvpContent.classList.add('sapOvpContentHidden');
                } else {
                    oOvpContent.classList.remove('sapOvpContentHidden');
                }
            }
		},

        _mergeAllTheDataInOneList: function () {
            var linkListLength = this._aLinkListIds.length;
            var originalList = this.getView().byId("ovpLinkList");
            var iIndex = -1;
            for (var index = 0; index < originalList.getItems().length; index++) {
                if (!originalList.getItems()[index].getVisible()) {
                    iIndex = index;
                    break;
                }
            }
            for (var i = 1; i < linkListLength; i++) {
                var extraList = this.getView().byId(this._aLinkListIds[i]);
                var extraListLength = extraList.getItems().length;
                for (var j = 0; j < extraListLength; j++) {
                    if (iIndex === -1) {
                        originalList.addItem(extraList.getItems()[0]);
                    } else {
                        originalList.insertItem(extraList.getItems()[0], iIndex);
                        iIndex++;
                    }
                }
                extraList.destroy();
            }
        },

		_resizeStandard: function(newCardLayout, oCardPropertiesModel) {
            if (this._aLinkListIds) {
                // 1 Step - select the Original List
                // 2 Step - copy from all addition list the Items to the original List and after that destroy the List
                this._mergeAllTheDataInOneList();
                var oList = this.getView().byId("ovpLinkList");

                this._aLinkListIds.splice(0, this._aLinkListIds.length);

                // 3 Step - copy the saved "rest" to the Original List back as well
                var iRestListLength = this._oListRest.getItems().length;
                try {
                    for (var k = 0; k < iRestListLength; k++) {
                        oList.addItem(this._oListRest.getItems()[0]);
                    }
                } catch (e) {
                    jQuery.sap.log.info("Error: " + e);
                }

                for (var s = 0; s < oList.getItems().length; s++) {
                    oList.getItems()[s].setVisible(true);
                }

                if (!oList) {
                    var oDomParent = this.byId(OVPLINKLIST).$().parent();
                    oDomParent.width("100%");
                    //var oCardPropertiesModel = this.getCardPropertiesModel();
                    var iRows = oCardPropertiesModel.getProperty("/cardLayout/rowSpan");
                    if (iRows) {
                        this._setListHeightInStandardCard(iRows);
                    }
                }

                // 4 Step build additional Lists (and if needed load additional Items from Backend)
                var oBindingInfo = oList.getBindingInfo("items");
                var iItemHeight = this._getLinkListItemHeight();
                var iNewCardHeight = this._getListHeightInStandardCard(newCardLayout.rowSpan);
                var iNewLengthTotal = Math.floor(iNewCardHeight / iItemHeight) * newCardLayout.colSpan; //number of items which could be displayed on the card
                this._bInitialLoad = false;
                jQuery(this.getView().$()).find(".sapOvpWrapper").css({
                    height: iNewCardHeight + "px"
                });
                if (oBindingInfo) {
                    //Card with backend data
                    if (iNewLengthTotal > this._iAvailableItems && oBindingInfo.length <= this._iAvailableItems) {
                        //load addtional data from the backend as more space is available as the already loaded data
                        oBindingInfo.length = iNewLengthTotal;
                        oList.bindItems(oBindingInfo);
                        this._bListenerAttached = false;
                        this.attachingListenerToTheEventRefresh();
                    } else {
                        //build the Standard Link List(s) new
                        this._itemOnEventBuildStandard(oCardPropertiesModel, newCardLayout.colSpan, newCardLayout.rowSpan, false);
                    }
                } else {
                    //Card with static content -> build the Standard Link List(s) new
                    this._itemOnEventBuildStandard(oCardPropertiesModel, newCardLayout.colSpan, newCardLayout.rowSpan, false);
                }
            }
        },

		_resizeCarousel: function(newCardLayout) {
            this._setListHeightInCarouselCard(newCardLayout.rowSpan);
			this._setCarouselImageProperties();
		},

		_resizeGrid: function(newCardLayout) {
			var oGrid = this.getView().byId("ovpLinkListGrid");
			var sOldColSpan = parseInt(this.getView().byId("idColSpan").getValue(), 10);
			var sNewColSpan = newCardLayout.colSpan;
			if (newCardLayout.colSpan > 5) {
				sNewColSpan = 5; // max supported column span
			}
			this.getView().byId("idColSpan").setValue(sNewColSpan);
			//Replace StyleClass dependent on colSpan
			if (sNewColSpan !== sOldColSpan) {
				var sStyleClassOld = "sapOvpCardLinkListGridColSpan" + sOldColSpan;
				oGrid.removeStyleClass(sStyleClassOld);
				var sStyleClassNew = "sapOvpCardLinkListGridColSpan" + sNewColSpan;
				oGrid.addStyleClass(sStyleClassNew);
			}
			//Calculate Items dependent on colSpan and rowSpan
			var iNewLength = newCardLayout.rowSpan * newCardLayout.colSpan * 2;
			var oBindingInfo = oGrid.getBindingInfo("items");
			var oItems = oGrid.getItems();
			if (iNewLength > oItems.length) {
				oBindingInfo.length = iNewLength;
				oGrid.bindItems(oBindingInfo);
			} else if (iNewLength < oItems.length) {
				var sRemoveItems = oItems.length - iNewLength;
				var sLastIndex = oItems.length - 1;
				for (var i = 0; i < sRemoveItems; i++) {
					var iItemIndex = sLastIndex - i;
					oGrid.removeItem(iItemIndex);
				}
			}
		},

		_setListHeightInCarouselCard: function(iRows) {
			var iCarouselHeight = 0,
                oCarousel = this.byId(PICTURECAROUSEL);

			if (iRows !== -1) {
				//Dashboad Layout -> only in this layout the height might be restricted
				var iHeaderHeight = 0;
				var oHeader = this.byId(OVPCARDHEADER);
				if (oHeader) {
                    //Height of the header
					iHeaderHeight = oHeader.$().outerHeight();
				}

				var oCardPropertiesModel = this.getCardPropertiesModel();
				var iRowHeight = oCardPropertiesModel.getProperty("/cardLayout/iRowHeightPx");

                // iCarouselHeight = ( iRows * RowHeight ) - ( HeaderHeight + Page Padding + Page indicator [dots] )
                iCarouselHeight = (iRows * iRowHeight) - (iHeaderHeight + CAROUSEL_PAGE_PADDING + CAROUSEL_PAGE_INDICATOR);
                oCarousel.$().height(iCarouselHeight + 16);
			} else {
                //Fixed Layout -> Height of the image is equal to Width
                var iCarouselWidth = oCarousel.$().width(),
                    oPage = null,
                    aPages = oCarousel.getPages(),
                    iInnerHeaderHeight = 0;
                for (var iPage = 0; iPage < aPages.length; iPage++) {
                    oPage = aPages[iPage];
                    if (oPage && oPage.getItems().length > 1) {
                        iInnerHeaderHeight = Math.max(iInnerHeaderHeight, oPage.getItems()[0].$().outerHeight());
                    }
                }
                var iNavigatorHeight = oCarousel.$().find(".sapMCrslControlsBottom.sapMCrslControls").outerHeight();
                var iCarouselHeight = iCarouselWidth + (iInnerHeaderHeight + iNavigatorHeight);
                oCarousel.$().height(iCarouselHeight);
            }
		},

		_setCarouselImageProperties: function() {
			// Check if we have a restriction in two dimensions ( like in the resizable card layout)

			var oCardPropertiesModel = this.getCardPropertiesModel();
			var iRows = oCardPropertiesModel.getProperty("/cardLayout/rowSpan");
			var iCols = oCardPropertiesModel.getProperty("/cardLayout/colSpan");

            var oCarousel = this.byId(PICTURECAROUSEL),
                iCarouselHeight = oCarousel.$().height(),
                oImg = null,
                oPage = null;

			if (iRows && iCols) {
				//sets the width and height of the background image in case the carousel shows only one page.
				//check if there is one or more pages in the carousel
				var oCardHeader = this.byId(OVPCARDHEADER),
                    sImgWidth;

				if (oCarousel.getPages().length === 1 && oCardHeader) {
					// try to get a reference to the cards image - if there is one it should be the last item of the page
					oPage = sap.ui.getCore().byId(oCarousel.getActivePage());
					if (oPage && oPage.getItems()[oPage.getItems().length - 1] instanceof sap.m.Image) {
						this._setCarouselImageHeight(oPage, iCarouselHeight);
						//calc image width -> needs to be set explicitly for background images
						//the image witdth shall be the same as the cards pseudo header width
						sImgWidth = oCardHeader.$().outerWidth();
						if (sImgWidth) {
							sImgWidth = sImgWidth + "px";
							oImg.setWidth(sImgWidth);
						}
						oImg.setMode(sap.m.ImageMode.Background);
						oImg.setBackgroundPosition("center center");
					}
				}
			} else {
                var aPages = oCarousel.getPages(),
                    iNavigatorHeight = oCarousel.$().find(".sapMCrslControlsBottom.sapMCrslControls").outerHeight();
                for (var iPage = 0; iPage < aPages.length; iPage++) {
                    oPage = aPages[iPage];
                    if (oPage && oPage.getItems()[oPage.getItems().length - 1] instanceof sap.m.Image) {
                        this._setCarouselImageHeight(oPage, iCarouselHeight - iNavigatorHeight);
                    }
                }
            }
		},

        _setCarouselImageHeight: function(oPage, iCarouselHeight) {
            var aItems = oPage.getItems(),
                oImg = aItems[aItems.length - 1],
                sImgHeight;
            //calc image height -> needs to be set explicitly for background images
            //the image shall use the complete card minus the cards' pseudo header
            if (aItems.length === 1) {
                //the page contains only the picture
                sImgHeight = iCarouselHeight;
            } else {
                // there is a inner header -> reduce picture height accordingly
                // the inner header is the first item of the page
                sImgHeight = iCarouselHeight - oPage.getItems()[0].$().outerHeight();
            }
            if (sImgHeight) {
                sImgHeight = sImgHeight + "px";
                oImg.setHeight(sImgHeight);
            }
        },

		_setListHeightInStandardCard: function(iRows) {
			var nLinkListHeight = 0;
			var oList;
			var oDomParent;
            oList = this.byId(OVPLINKLIST);
            if (oList) {
                nLinkListHeight = this._getListHeightInStandardCard(iRows);
                oDomParent = oList.$().parent();
                oDomParent.height(nLinkListHeight);
            }
            if (this._aLinkListIds) {
                //Loop over all created standard lists and set the corresponding height
                for (var i = 1; i < this._aLinkListIds.length; i++) {
                    oList = this.byId(this._aLinkListIds[i]);
                    nLinkListHeight = this._getListHeightInStandardCard(iRows);
                    oDomParent = oList.$().parent();
                    oDomParent.height(nLinkListHeight);
                }
            }
		},

		_getListHeightInStandardCard: function(iRows) {
			var iLinkListHeight = 0;
			var oCardPropertiesModel = this.getCardPropertiesModel();
			if (iRows) {
				var iHeaderHeight = 0;
				var oHeader = this.byId(OVPCARDHEADER);
				if (oHeader) {
					iHeaderHeight = oHeader.$().outerHeight();
				}
				var iRowHeight = oCardPropertiesModel.getProperty("/cardLayout/iRowHeightPx");
				iLinkListHeight = (iRows * iRowHeight) - ( iHeaderHeight + LINKLIST_BORDER_TOP  + LINKLIST_BORDER_BOTTOM);
			}
			return iLinkListHeight;
		},

		_setListColumnWidthInStandardCard: function(iCols) {
			var oList;
			var oDomParent;
			var sColumnWidth = "100%";
            if (this._aLinkListIds) {
                if (this._aLinkListIds.length > 1) {
                    //more then one lists are created -> columnWidth = 100% / columns
                    //loop over all lists and set the columnWidth
                    for (var j = 0; j < this._aLinkListIds.length; j++) {
                        oList = this.byId(this._aLinkListIds[j]);
                        oDomParent = oList.$().parent();
                        sColumnWidth = (100 / iCols) + "%";
                        oDomParent.width(sColumnWidth);
                    }
                } else {
                    //only one list was created -> columnWidth = 100%
                    oList = this.byId(this._aLinkListIds[0]);
                    if (oList) {
                        oDomParent = oList.$().parent();
                        oDomParent.width(sColumnWidth);
                    }
                }
            }
		},

		_getLinkListItemHeight: function(sListId) {
			var sLiId = (sListId) ? sListId : OVPLINKLIST;
			var oCardPropertiesModel = this.getCardPropertiesModel(),
				oList = this.byId(sLiId),
				iItemHeight = ITEMHEIGHT_COZY,
				sPicture = "",
				bTitle = false,
				bSubTitle = false,
				iNoOfLines = 1,
				density = oCardPropertiesModel.getProperty("/densityStyle"),
				iTitleIndex = 0,
				iSubTitleIndex = 0;

			//Loop over all items unil the item contain a "picture" - check if it´s a icon or a image 
			var aListItems = oList.getItems();
			for (var j = 0; j < aListItems.length; j++) {
				try {
					var sPictureUrl = aListItems[j]
						.getAggregation("content")[0]
						.getAggregation("items")[0]
						.getAggregation("items")[0]
						.getAggregation("items")[0]
						.getProperty("src");
					if (sPictureUrl.length > 0) {
						if (sPictureUrl.toLowerCase().indexOf("icon") > 0) {
							sPicture = "icon";
						} else {
							sPicture = "image";
						}
						iTitleIndex = 1; //increase the TitleIndex as the Item contains a picture (needed to access the "Title" below)
						break;
					}
				} catch (e) {
					jQuery.sap.log.info("Item:" + j + " doesn´t contain a image");
				}
			}

            //Title
            try {
                var sTitle = oList.getItems()[0]
                    .getAggregation("content")[0]
                    .getAggregation("items")[iTitleIndex]
                    .getAggregation("items")[0].getProperty("text");

                bTitle = sTitle.length > 0;
                iSubTitleIndex = 1;
            } catch (e) {
                jQuery.sap.log.info("Item doesn´t contain a title");
            }

            //SubTitle
            try {
                var sSubTitle = oList.getItems()[0]
                    .getAggregation("content")[0]
                    .getAggregation("items")[iTitleIndex]
                    .getAggregation("items")[iSubTitleIndex]
                    .getProperty("text");

                bSubTitle = sSubTitle.length > 0;
            } catch (e) {
                jQuery.sap.log.info("Item doesn´t contain a subTitle");
            }

            if (bTitle === true && bSubTitle === true) {
                iNoOfLines = 2;
            }

			if (density === "cozy") {
				iItemHeight = ITEMHEIGHT_COZY;
				if (iNoOfLines === 1) {
					iItemHeight = sPicture !== "image" ? ITEMHEIGHT_COZY_ONE_LINE_WITHOUT_IMAGE : ITEMHEIGHT_COZY_ONE_LINE_WITH_IMAGE;
				}
			} else {
				iItemHeight = ITEMHEIGHT_COMPACT;
				if (iNoOfLines === 1) {
					iItemHeight = sPicture !== "image" ? ITEMHEIGHT_COMPACT_ONE_LINE_WITHOUT_IMAGE : ITEMHEIGHT_COMPACT_ONE_LINE_WITH_IMAGE;
				}
			}
			return iItemHeight;
		},

		/**
		 * Navigates in case of usage of local data in the content of the card
		 */
		onLinkListItemPressLocalData: function(oEvent) {
            if (sap.ovp.cards.CommonUtils.checkIfAPIIsUsed(this)) {
                sap.ovp.cards.CommonUtils.onContentClicked(oEvent);
            } else {
                var sTargetUrl = oEvent.getSource().data("targetUri");
                var sInNewWindow = oEvent.getSource().data("openInNewWindow");
                var sBaseUrl = this.getView().getModel("ovpCardProperties").getProperty("/baseUrl");

                if (sTargetUrl) {
                    sTargetUrl = this.buildUrl(sBaseUrl, sTargetUrl);

                    if (sInNewWindow === "true") {
                        window.open(sTargetUrl);
                    } else {
                        window.location.href = sTargetUrl;
                    }
                }
            }
		},

		/**
		 * Calls a function import in case of usage of local data in the content of the card
		 */
		onLinkListActionPressLocalData: function(oEvent) {
            if (sap.ovp.cards.CommonUtils.checkIfAPIIsUsed(this)) {
                sap.ovp.cards.CommonUtils.onContentClicked(oEvent);
            } else {
                var sAction = oEvent.getSource().data("dataAction");

                this.getView().getModel().callFunction(sAction, {
                    method: "POST",
                    urlParameters: {
                        FunctionImport: sAction
                    },
                    success: (this.onFuImpSuccess.bind(this)),
                    error: (this.onFuImpFailed.bind(this))
                });
            }
		},

		onFuImpSuccess: function(oEvent) {
			sap.m.MessageToast.show(sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("Toast_Action_Success"), {
				duration: 3000
			});
		},

		onFuImpFailed: function(oResponse) {
			sap.m.MessageToast.show(sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("Toast_Action_Error"), {
				duration: 3000
			});
		},

		onLinkListItemPress: function(oEvent) {
            if (sap.ovp.cards.CommonUtils.checkIfAPIIsUsed(this)) {
                sap.ovp.cards.CommonUtils.onContentClicked(oEvent);
            } else {
                var aNavigationFields = this.getEntityNavigationEntries(oEvent.getSource().getBindingContext(),
                    this.getCardPropertiesModel().getProperty("/annotationPath"));
                this.doNavigation(oEvent.getSource().getBindingContext(), aNavigationFields[0]);
            }
		},

		/**
		 * Open the Details Popover
		 */
		onLinkPopover: function(oEvent) {
            if (sap.ovp.cards.CommonUtils.checkIfAPIIsUsed(this)) {
                sap.ovp.cards.CommonUtils.onContentClicked(oEvent);
            } else {
                var oPopover;
                switch (this.getCardPropertiesModel().getProperty("/listFlavor")) {
                    case "grid": //grid: experimental  -- DON´T USE
                        oPopover = oEvent.getSource().getParent().getParent().getParent().getParent().getParent()
                            .getAggregation("items")[1].getAggregation("items")[1];
                        break;

                    case "standard":
                        oPopover = this.getView().byId("ovpListRow").getParent().getAggregation("items")[2];
                        if (!oPopover) {
                            oPopover = this.getView().byId("ovpListRow").getParent().getAggregation("items")[1];
                        }
                        break;

                    case "carousel":
                        oPopover = oEvent.getSource().getParent().getParent().getParent().getParent().getAggregation("items")[1];
                        break;
                }

                var oCardPropertiesModel = this.getCardPropertiesModel();
                if (oCardPropertiesModel.getProperty("/listFlavor") === "carousel") {
                    var oCarousel = this.byId(PICTURECAROUSEL);
                    oCarousel.addEventDelegate(oDelegateOnAfter, this);
                }
                oPopover.bindElement(oEvent.getSource().getBindingContext().getPath());
                oPopover.openBy(oEvent.getSource());
                if (!this._bListeningPopOver) {
                    oPopover.attachAfterOpen(function () {
                        this.settingHeightAndWidthOfLinkListCardsOnManageCardAndFilter();
                    }.bind(this));
                }
                this._bListeningPopOver = true;
            }
		},
		
		/* navigation to LineItem 0 Url */
        onLinkListLineItemUrl: function (oEvent) {
            if (sap.ovp.cards.CommonUtils.checkIfAPIIsUsed(this)) {
                sap.ovp.cards.CommonUtils.onContentClicked(oEvent);
            } else {
                var sTargetUrl,
                    sAnnotationPath = "com.sap.vocabularies.UI.v1.LineItem",
                    oNavigation = this.entityType[sAnnotationPath][0].Url;
                if (oNavigation.hasOwnProperty("String")) {
                    sTargetUrl = oNavigation.String;
                } else {
                    var oNavigationFields = this.getEntityNavigationEntries(oEvent.getSource().getBindingContext(), sAnnotationPath)[0];
                    sTargetUrl = oNavigationFields.url;
                }
                if (sTargetUrl) {
                    window.location.href = sTargetUrl;
                } else {
                    jQuery.sap.log.info("LinkList Standard Card: No Navigation on line item");
                }
            }
        },

		/**
		 * Do CrossApplicationNavigation using the Identification annotation - all items have the same target app
         *
         * The second parameter to the function "getEntityNavigationEntries" is mentioned as "undefined" for enabling qualifier support.
		 */
        onLinkNavigationSingleTarget: function (oEvent) {
            if (sap.ovp.cards.CommonUtils.checkIfAPIIsUsed(this)) {
                sap.ovp.cards.CommonUtils.onContentClicked(oEvent);
            } else {
                var aNavigationFields = this.getEntityNavigationEntries(oEvent.getSource().getBindingContext(), undefined);
                this.doNavigation(oEvent.getSource().getBindingContext(), aNavigationFields[0]);
            }
        },

		/**
		 * Do CrossApplicationNavigation
		 */
		onLinkNavigation: function(oEvent) {
            if (sap.ovp.cards.CommonUtils.checkIfAPIIsUsed(this)) {
                sap.ovp.cards.CommonUtils.onContentClicked(oEvent);
            } else {
                if (sap.ushell.Container.getService("CrossApplicationNavigation")) {
                    var oBindingContext = oEvent.getSource().getBindingContext();
                    //var oNavArguments = {target : {	semanticObject : "Action",	action : "toappnavsample"} }; // for test with testOVP.html
                    if (oBindingContext.getProperty("SemanticObject")) {
                        var oNavArguments = {
                            target: {
                                semanticObject: oBindingContext.getProperty("SemanticObject"),
                                action: oBindingContext.getProperty("SemanticAction")
                            }
                        };
                        sap.ushell.Container.getService("CrossApplicationNavigation").toExternal(oNavArguments);
                    }
                }
            }
		},

		/**
		 * Create the URL 
		 */
		buildUrl: function(sBaseUrl, sManifestUrl) {
            // We use here lastIndexOf instead of startsWith because it doesn't work on safari (ios devices)
			if (sManifestUrl.lastIndexOf(sBaseUrl,0) === 0 || sManifestUrl.indexOf("://") > 0) {
				return sManifestUrl;
			} else if (sManifestUrl.lastIndexOf("/",0) === 0) {
				return sBaseUrl + sManifestUrl;
			} else {
				return sBaseUrl + "/" + sManifestUrl;
			}
		},
		/**
		 * Calls a function import for trigger an action
		 */
		onLinkListActionPress: function(oEvent) {
            if (sap.ovp.cards.CommonUtils.checkIfAPIIsUsed(this)) {
                sap.ovp.cards.CommonUtils.onContentClicked(oEvent);
            } else {
                var sAction = oEvent.getSource().data("dataAction");

                this.getView().getModel().callFunction(sAction, {
                    method: "POST",
                    urlParameters: {
                        FunctionImport: sAction
                    },
                    success: (this.onFuImpSuccess.bind(this)),
                    error: (this.onFuImpFailed.bind(this))
                });
            }
		},

		/**
		 * CrossApp Navigation with staticContent
		 */
		onLinkListSemanticObjectPressLocalData: function(oEvent) {
            if (sap.ovp.cards.CommonUtils.checkIfAPIIsUsed(this)) {
                sap.ovp.cards.CommonUtils.onContentClicked(oEvent);
            } else {
                var iRowIndex = parseInt(oEvent.getSource().data("contentRowIndex"), 10);
                this._oStaticContent = this.getCardPropertiesModel().getProperty("/staticContent");

                if (this._oStaticContent[iRowIndex].semanticObject && this._oStaticContent[iRowIndex].action) {
                    var oNavArguments = {
                        target: {
                            semanticObject: this._oStaticContent[iRowIndex].semanticObject,
                            action: this._oStaticContent[iRowIndex].action
                        },
                        params: this._oStaticContent[iRowIndex].params
                    };
                    var oIntent = this._oStaticContent[iRowIndex];
                    this.doCrossApplicationNavigation(oIntent, oNavArguments);
                } else {
                    sap.m.MessageToast.show(sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("Toast_Action_Error"), {
                        duration: 3000
                    });
                }
            }
		}
	});
})();