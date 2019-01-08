(function () {
	"use strict";
	/*global sap, jQuery */

	sap.ui.controller("sap.ovp.cards.charts.analytical.analyticalChart", {
		onInit: function () {
				sap.ovp.cards.charts.VizAnnotationManager.formatChartAxes();
//				this.bFlag = true;
		},
		onBeforeRendering : function() {
			if (this.bCardProcessed) {
				return;
			}
			sap.ovp.cards.charts.VizAnnotationManager.validateCardConfiguration(this);
			var vizFrame = this.getView().byId("analyticalChart");
            var oCompData = this.getOwnerComponent().getComponentData();
            if (this.getCardPropertiesModel().getProperty("/layoutDetail") === "resizable" && oCompData.appComponent) {
                var oDashboardLayoutUtil = oCompData.appComponent.getDashboardLayoutUtil();
                var oCard = oDashboardLayoutUtil.dashboardLayoutModel.getCardById(oCompData.cardId);
                if (oCard.dashboardLayout.autoSpan && vizFrame) {
                    vizFrame.setHeight("340px");
                }
            }
//		    var bubbleText = this.getView().byId("bubbleText");
//			var chartTitle = this.getView().byId("ovpCT");
			var vbLayout = this.getView().byId("vbLayout");
//			var bubbleSizeText = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("BUBBLESIZE");
			var navigation;
			
			var isVizPropSet = false;
			
			var oDataSet = new sap.viz.ui5.data.FlattenedDataset({
				data : {
					path : "/"
				}
			});
			
			this.isVizPropSet = isVizPropSet;
			this.oDataSet = oDataSet;
			this.vizFrame = vizFrame;
			this.vbLayout = vbLayout;
			/*var navigation = vizFrame.getModel('ovpCardProperties').getProperty("/navigation");
			if (navigation == "chartNav") {
				vizFrame.attachBrowserEvent("click", this.onHeaderClick.bind(this));
			} else {
				sap.ovp.cards.charts.VizAnnotationManager.getSelectedDataPoint(vizFrame, this);
			}*/
			if (!vizFrame) {
				jQuery.sap.log.error(sap.ovp.cards.charts.VizAnnotationManager.constants.ERROR_NO_CHART +
						": (" + this.getView().getId() + ")");
			} else {
				this.vbLayout.setBusy(true);
				navigation = vizFrame.getModel('ovpCardProperties').getProperty("/navigation");
				//FIORITECHP1-6021 - Allow Disabling of Navigation from Graph
				if (navigation === undefined || navigation == "datapointNav" || navigation != "headerNav") {
					sap.ovp.cards.charts.VizAnnotationManager.getSelectedDataPoint(vizFrame, this);
				} 
				vizFrame.destroyDataset();
//				vizFrame.addEventDelegate(this.busyDelegate, vizFrame);
//				var handler = vizFrame.getParent();
//				handler.setBusy(true);
//				sap.ovp.cards.charts.VizAnnotationManager.buildVizAttributes(vizFrame,handler,chartTitle);
//				if (bubbleText != undefined) {
//					var feeds = vizFrame.getFeeds();
//					jQuery.each(feeds,function(i,v){
//						if (feeds[i].getUid() == "bubbleWidth") {
//							bubbleText.setText(bubbleSizeText + " " + feeds[i].getValues());
//						}
//					});
//				}
//				sap.ovp.cards.charts.VizAnnotationManager.hideDateTimeAxis(vizFrame);
				var binding = vizFrame.getParent().getBinding("data");

				this._handleKPIHeader();
				
				if (binding && binding.getPath()) {
					binding.attachDataReceived(jQuery.proxy(this.onDataReceived, this));
					binding.attachDataRequested(jQuery.proxy(this.onDataRequested, this));
				} else {
					var noDataDiv = sap.ui.xmlfragment("sap.ovp.cards.charts.generic.noData");
					var cardContainer = this.getCardContentContainer();
					cardContainer.removeAllItems();
					cardContainer.addItem(noDataDiv);
				}
			}
			this.bCardProcessed = true;
		},

        onAfterRendering: function () {
            var oCompData = this.getOwnerComponent().getComponentData();
            if (this.getCardPropertiesModel().getProperty("/layoutDetail") === "resizable" && oCompData.appComponent) {
                var oDashboardLayoutUtil = oCompData.appComponent.getDashboardLayoutUtil();
                var sCardId = oDashboardLayoutUtil.getCardDomId(oCompData.cardId);
                var oCard = oDashboardLayoutUtil.dashboardLayoutModel.getCardById(oCompData.cardId);
                var element = document.getElementById(sCardId);
                var iHeaderHeight = this.getHeaderHeight();
                if (!oCard.dashboardLayout.autoSpan) {
                    var ovpWrapper = element.getElementsByClassName('sapOvpWrapper')[0];
                    if (ovpWrapper) {
                        ovpWrapper.style.height = oCard.dashboardLayout.rowSpan * oDashboardLayoutUtil.ROW_HEIGHT_PX + 2 - (iHeaderHeight + 2 * oDashboardLayoutUtil.CARD_BORDER_PX) + "px";
                    }
                }
                if (oCard.dashboardLayout.showOnlyHeader) {
                    element.classList.add("sapOvpMinHeightContainer");
                }
                var vizCard = this.getView().byId("analyticalChart");
                if (vizCard) {
                    vizCard.setHeight(this._calculateVizFrameHeight() + "px");
                }
            }
        },

		onDataReceived: function(oEvent) {
			var that = this;
			var vizFrame = this.getView().byId("analyticalChart");
			
			var bubbleText = this.getView().byId("bubbleText");
			var chartTitle = this.getView().byId("ovpCT");
			var bubbleSizeText = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("BUBBLESIZE");
			
			this.oDataSet.bindData("analyticalmodel>/","");
			vizFrame.setDataset(this.oDataSet);
			
			var handler = vizFrame.getParent();
			
			if (!this.isVizPropSet) {
				
				sap.ovp.cards.charts.VizAnnotationManager.buildVizAttributes(vizFrame,handler,chartTitle);
				this.isVizPropSet = true;
			
				if (bubbleText != undefined) {
					var feeds = vizFrame.getFeeds();
					jQuery.each(feeds,function(i,v){
						if (feeds[i].getUid() == "bubbleWidth") {
							bubbleText.setText(bubbleSizeText + " " + feeds[i].getValues());
						}
					});
				}
				sap.ovp.cards.charts.VizAnnotationManager.hideDateTimeAxis(vizFrame);
			}
//			var handler = vizFrame.getParent();
//			var chartScaleTitle = this.getView().byId("ovpScaleUnit");
//			var vizData = oEvent ? oEvent.getParameter('data') : null;
			//FIORITECHP1-4935Reversal of Scale factor in Chart and Chart title.
//			sap.ovp.cards.charts.VizAnnotationManager.setChartScaleTitle(vizFrame,vizData,handler,chartScaleTitle);
			if (this.bFlag == true) {
//			vizFrame.addEventDelegate(this.freeDelegate, vizFrame);
			this.bFlag = false;
			this.vbLayout.setBusy(false);
			} else {
				setTimeout(function(){
					that.vbLayout.setBusy(false);
					},0);
			}
			sap.ovp.cards.charts.VizAnnotationManager.checkNoData(oEvent, this.getCardContentContainer(), vizFrame);
		},
		onDataRequested : function() {
//			var vizFrame = this.getView().byId("analyticalChart");
//			vizFrame.removeEventDelegate(this.freeDelegate, vizFrame);
			this.vbLayout.setBusy(true);
		},
		
		getCardItemsBinding: function() {
            var vizFrame = this.getView().byId("analyticalChart");
//            var handler = vizFrame.getParent();
          //vizFrame.setBusy(true); Commenting for the issue 1780015305
           // if (this.vizFrame.getParent().getBinding("data")){
			if (vizFrame && vizFrame.getDataset() && vizFrame.getDataset().getBinding("data")) {
				this.vbLayout.setBusy(false);
			}
			
			if (vizFrame && vizFrame.getParent()) {
				return vizFrame.getParent().getBinding("data");
			}
			
			return null;
        },

        /**
         * Method called upon when card is resized manually
         *
         * @method resizeCard
         * @param {Object} newCardLayout - new card layout after resize
         */
        resizeCard: function (newCardLayout) {
            var oCardPropertiesModel = this.getCardPropertiesModel();
            this.newCardLayout = newCardLayout;
            oCardPropertiesModel.setProperty("/cardLayout/rowSpan", newCardLayout.rowSpan);
            oCardPropertiesModel.setProperty("/cardLayout/colSpan", newCardLayout.colSpan);
            var oCardLayout = this.getCardPropertiesModel().getProperty("/cardLayout");
            var iHeaderHeight = this.getHeaderHeight();
            //Set the height of cardContentContainer
            jQuery(this.getView().$()).find(".sapOvpWrapper").css({
                height: (newCardLayout.rowSpan * oCardLayout.iRowHeightPx + 2) - (iHeaderHeight + 2 * oCardLayout.iCardBorderPx) + "px"
            });
            var vizCard = this.getView().byId("analyticalChart");
            var bubbleText = this.getView().byId("bubbleText");
            var chartTitle = this.getView().byId("ovpCT");

            if (vizCard) {
                if (vizCard.getVizType() === 'timeseries_bubble' || vizCard.getVizType() === 'bubble') {
                    if (oCardLayout.colSpan > 1) {
                        bubbleText.setVisible(false);
                    } else {
                        bubbleText.setVisible(true);
                    }
                }
                vizCard.setHeight(this._calculateVizFrameHeight() + "px");
            }
            var oOvpContent = this.getView().byId('ovpCardContentContainer').getDomRef();
            if (oOvpContent) {
                if (!newCardLayout.showOnlyHeader) {
                    oOvpContent.classList.remove('sapOvpContentHidden');
                } else {
                    oOvpContent.classList.add('sapOvpContentHidden');
                }
            }

            var bubbleSizeText = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("BUBBLESIZE");
            this.oDataSet.bindData("analyticalmodel>/", "");
            this.vizFrame.setDataset(this.oDataSet);

            var handler = vizCard.getParent();
            if (!this.isVizPropSet) {
                sap.ovp.cards.charts.VizAnnotationManager.buildVizAttributes(vizCard, handler, chartTitle);
                this.isVizPropSet = true;
                if (bubbleText != undefined) {
                    var feeds = vizCard.getFeeds();
                    jQuery.each(feeds, function (i, v) {
                        if (feeds[i].getUid() == "bubbleWidth") {
                            bubbleText.setText(bubbleSizeText + " " + feeds[i].getValues());
                        }
                    });
                }
                sap.ovp.cards.charts.VizAnnotationManager.hideDateTimeAxis(vizCard);
            }
            sap.ovp.cards.charts.VizAnnotationManager.reprioritizeContent(this.newCardLayout, vizCard);
        },

        /**
         * Method to calculate viz frame height
         *
         * @method _calculateVizFrameHeight
         * @return {Integer} iVizFrameHeight - Calculated height of the viz frame
         *                                      For Fixed layout - 480 px
         *                                      For resizable layout - Calculated according to the rowspan
         */
        _calculateVizFrameHeight: function () {
            var iVizFrameHeight;
            var oCompData = this.getOwnerComponent().getComponentData();
            var oDashboardLayoutUtil = this.getDashboardLayoutUtil();
            var oCard = oDashboardLayoutUtil.dashboardLayoutModel.getCardById(oCompData.cardId);
            var vizCard = this.getView().byId("analyticalChart");
            //For resizable layout calculate height of vizframe
            if (oCard) {
                var oGenCardCtrl = this.getView().getController();
                var iDropDownHeight = this.getItemHeight(oGenCardCtrl, 'toolbar');
                var iHeaderHeight = this.getHeaderHeight();
                var iChartTextHeight = this.getView().byId("ovpCT") ? 20 : 0;
                var iBubbleTextHeight = (vizCard.getVizType() === 'timeseries_bubble' || vizCard.getVizType() === "bubble") && oCard.dashboardLayout.colSpan === 1 ? 43 : 0;
                //Viz container height = Card Container height + Border top of OvpCardContainer[1px--.sapOvpCardContentContainer] - (Header height + Card padding top and bottom{16px} +
                //                          View switch toolbar height + Height of the Chart text(if present) + Height of bubble chart text +
                //                          Padding top to  the card container[0.875rem -- .ovpChartTitleVBox] + Margin top to viz frame[1rem .ovpViz])
                iVizFrameHeight = oCard.dashboardLayout.rowSpan * oDashboardLayoutUtil.ROW_HEIGHT_PX + 2 - ( iHeaderHeight+ 2 * oDashboardLayoutUtil.CARD_BORDER_PX + iDropDownHeight + iChartTextHeight + iBubbleTextHeight + 30);
            }
            return iVizFrameHeight;
        },

        /**
         * Method to refresh the view after drag completion
         *
         * @method refreshCard
         */
        refreshCard: function () {
            this.getView().rerender();
        }
     });
})();
