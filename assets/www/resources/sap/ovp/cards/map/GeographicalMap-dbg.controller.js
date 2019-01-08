(function() {
	"use strict";
	/*global sap, jQuery */

	sap.ui.controller("sap.ovp.cards.map.GeographicalMap", {

		onInit: function(evt) {
			/**
			 *If the state is 'Loading' or 'Error', we do not render the popover header. Hence, this is no oHeader.
			 */
			var sState = this.getView().mPreprocessors.xml[0].ovpCardProperties.oData.state;
			if (sState !== "Loading" && sState !== "Error") {
				var oHeader = this.getView().byId("popoverHeader");
				oHeader.attachBrowserEvent("click", this.onPopoverHeaderPress.bind(this, oHeader));

				// Attach the keyboard events so the you can navigate using Space and Return key
				oHeader.addEventDelegate({
					onkeydown: function(oEvent) {
						if (!oEvent.shiftKey && (oEvent.keyCode == 13 || oEvent.keyCode == 32)) {
							oEvent.preventDefault();
							this.onPopoverHeaderPress(oHeader);
						}
					}.bind(this)
				});
			}
		},

		resizeCard: function(newCardLayout) {
			var oVBI = this.getView().byId("oVBI");
			var oCardPropertiesModel = this.getCardPropertiesModel();
			oCardPropertiesModel.setProperty("/cardLayout/rowSpan", newCardLayout.rowSpan);
			oCardPropertiesModel.setProperty("/cardLayout/colSpan", newCardLayout.colSpan);
			var oGenCardCtrl = this.getView().getController();
			var iHeaderHeight = this.getItemHeight(oGenCardCtrl, 'ovpCardHeader');
			var iMapHeight = newCardLayout.rowSpan * newCardLayout.iRowHeightPx - (iHeaderHeight + 2 * newCardLayout.iCardBorderPx);
			oVBI.setHeight(iMapHeight + "px");
			oVBI.setWidth("100%");
            var oOvpContent = this.getView().byId('ovpCardContentContainer').getDomRef();
            if (oOvpContent) {
                if (!newCardLayout.showOnlyHeader) {
                    oOvpContent.classList.remove('sapOvpContentHidden');
                } else {
                    oOvpContent.classList.add('sapOvpContentHidden');
                }
            }
		},

		onPopoverHeaderPress: function(oHeader) {
			var aNavigationFields = this.getEntityNavigationEntries(oHeader.getBindingContext(), this.getCardPropertiesModel().getProperty("/annotationPath"));
			this.doNavigation(oHeader.getBindingContext(), aNavigationFields[0]);
		},

		getAllSpotsCoordinates: function(map) {
			var spotCoordinates = {
				lonValues: [],
				latValues: []
			};

			map.getAggregation("vos")[0].getItems().forEach(function(item) {
				var coordinates = item.getPosition().split(";");
				spotCoordinates.lonValues.push(parseFloat(coordinates[0]));
				spotCoordinates.latValues.push(parseFloat(coordinates[1]));
			});

			return spotCoordinates;
		},

		onClickSpot: function(evt) {
			var spot = evt.getSource();
			// Retrieving the click offset; how many pixels away from the top-left corner of the map;
			var clickOffset = {};
			clickOffset[evt.getParameter("data").Action.Params.Param[0].name] = evt.getParameter("data").Action.Params.Param[0]["#"];
			clickOffset[evt.getParameter("data").Action.Params.Param[1].name] = evt.getParameter("data").Action.Params.Param[1]["#"];

			var oVBI = this.getView().byId("oVBI");

			if (!this.oQuickViewPopover) {
				this.oQuickViewPopover = this.getView().byId("quickViewPopover");
			} else if (this.oQuickViewPopover.isOpen()){
				// If the popover exists, we make sure we close to close it
				this.oQuickViewPopover.close();
			}

			if (!this.oPopoverAnchor) {
				this.oPopoverAnchor = document.createElement("div");
				this.oPopoverAnchor.style.position = "absolute";
				this.oPopoverAnchor.style.display = "inline-block";
				this.oPopoverAnchor.style.width = "0px";
				this.oPopoverAnchor.style.height = "0px";
			}
			this.oPopoverAnchor.style.top = Math.floor(parseFloat(clickOffset.y)) + "px";
			this.oPopoverAnchor.style.left = Math.floor(parseFloat(clickOffset.x)) + "px";

			oVBI.getParent().getDomRef().appendChild(this.oPopoverAnchor);

			// Set the model and open the quick view popover
			this.oQuickViewPopover.openBy(this.oPopoverAnchor);
			this.oQuickViewPopover.setBindingContext(spot.getBindingContext());
		},
		
		onAfterOpen: function () {
			//Store all the focusable elements' classes/ids in an array
			var aFocusItemsOrder = ['.quickViewResponsivePopover', '.mapPopoverHeader', '.sapMQuickViewPage', '.sapOvpActionFooter'];
			var oPopover = this.getView().byId("quickViewPopover");
			var popoverDOMElement = oPopover.$();
			//After the popover opens, put focus on the whole popover
			popoverDOMElement[0].focus();
			var index = 0;
			//Add the buttons in the actions footer dynamically to the array
			var aActionFooter = popoverDOMElement.find('.sapOvpActionFooter').children();
			for (var i = 0; i < aActionFooter.length; i++){
				if (jQuery(aActionFooter[i]).hasClass('sapMTBSpacer')) {
					//Ignore the spaces b/w the buttons
					continue;
				}
				var btnId = "#" + aActionFooter[i].id;
				aFocusItemsOrder.push(btnId);
			}
			oPopover.attachBrowserEvent("keydown", function(oEvent){
				var aElements = oEvent.target.closest('.quickViewResponsivePopover');
				if (oEvent.keyCode == 9){
					if (oEvent.shiftKey){
						//the control is inside this if block when the shift key is also pressed along with the tab key
						index--;
						index = index == -1 ? aFocusItemsOrder.length - 1 : index;
					} else {
						//index of the next element to be focused
						index++;
						index = index >= aFocusItemsOrder.length ? 0 : index;
					}
					var jqItem = aElements.querySelector(aFocusItemsOrder[index]);
					if (index === 0) {
						jqItem = aElements;
					}
					// set the tabindex attribute to 0, to fall in the tab order
					jqItem.setAttribute("tabindex", 0);
					jqItem.focus();
					//Making sure all the other default handlers are removed
					oEvent.preventDefault();
				} 
				
			});
		},

		onBeforeRendering: function() {
			var mapInstance = this.getView().byId("oVBI");

			mapInstance.getAggregation("vos")[0].getBinding("items").attachChange(function(item) {
				// Retrieving all spot coordinates
				var subTitle, allSpotsCoordinates = this.getAllSpotsCoordinates(mapInstance),
					spotsTotal = allSpotsCoordinates.lonValues.length;
                if (this && this.getView() && this.getView().getDomRef() && this.getView().getDomRef().getElementsByClassName("noDataSubtitle")) {
                    subTitle = this.getView().getDomRef().getElementsByClassName("noDataSubtitle");
                }
				// Adjust the zoom level and map position so all spots are visible
				if (spotsTotal > 0) {
					mapInstance.zoomToGeoPosition(allSpotsCoordinates.lonValues, allSpotsCoordinates.latValues, spotsTotal === 1 ? 5 : undefined);
                    if (subTitle && subTitle.length > 0) {
                        subTitle[0].style.display = "none";
                    }
                } else {
                    if (subTitle && subTitle.length > 0) {
                        subTitle[0].style.display = "flex";
                    }
				}
			}.bind(this));

			//set the map using object oMapConfig created in Manifest file.
			var oMapConfig = this.getOwnerComponent().getComponentData().settings.oMapConfig;
			mapInstance.setMapConfiguration(oMapConfig);
		},

		onGeoCardResize: function(event) {
			// This method gets called everytime the geomap changes it's size.
			// We get all spots positions and readjust the map position and zoom level
			// so we can have all spots visibile.
			var allSpotsCoordinates = this.getAllSpotsCoordinates(event.control),
				spotsTotal = allSpotsCoordinates.lonValues.length;

			if (spotsTotal > 0) {
				event.control.zoomToGeoPosition(allSpotsCoordinates.lonValues, allSpotsCoordinates.latValues, spotsTotal === 1 ? 5 : undefined);
			}
		},

		onAfterRendering: function() {
			//Register a resize handler so we are aware when the map resizes
			this._resizeListenerId = sap.ui.core.ResizeHandler.register(this.getView().byId("oVBI"), this.onGeoCardResize.bind(this));
		},

		exit: function() {
			//Deregistering the resize watcher
			if (this._resizeListenerId) {
				sap.ui.core.ResizeHandler.deregister(this.resizeHandlerId);
			}
		}
	});
})();
