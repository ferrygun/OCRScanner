/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */

/*global sap window*/
sap.ui.define(["jquery.sap.global", "sap/ovp/ui/DashboardLayoutUtil", "sap/ovp/library"
	],
	function(jQuery, DashboardLayoutUtil) {	
		"use strict";

		var DashboardLayout = sap.ui.core.Control.extend("sap.ovp.ui.DashboardLayout", {

			metadata: {
				designTime: true,
				library: "sap.ovp",
				aggregations: {
					content: {
						type: "sap.ui.core.Control",
						multiple: true,
						singularName: "content"
					}
				},
				defaultAggregation: "content",
				events: {
					afterRendering: {},
					afterDragEnds: {}
				},
				properties: {
					dragAndDropRootSelector: {
						group: "Misc",
						type: "string"
					},
					dragAndDropEnabled: {
						group: "Misc",
						type: "boolean",
						defaultValue: true
					},
					debounceTime: {
						group: "Misc",
						type: "int",
						defaultValue: 150
					}
				}
			},

			renderer: {

				render: function(oRm, oControl) {

					// get viewport width depending layout data
					var ctrlWidth = oControl.$().width();
                    var bRTL = sap.ui.getCore().getConfiguration().getRTL();

					var oLayoutData = oControl.dashboardLayoutUtil.updateLayoutData(ctrlWidth ? ctrlWidth : jQuery(window).width());
					var aCards = oControl.dashboardLayoutUtil.getCards(oLayoutData.colCount);

					var filteredItems = oControl.getContent().filter(function(item) {
						return item.getVisible();
					});

					oRm.write("<div");
					oRm.writeControlData(oControl);
					oRm.addClass("sapUshellEasyScanLayout");
					if (!sap.ui.Device.system.phone) {
						oRm.addClass("sapOvpDashboardDragAndDrop");
					}
					oRm.addClass("sapOvpDashboard");
					oRm.writeClasses();
                    bRTL ? oRm.addStyle("margin-right", oLayoutData.marginPx + "px") : oRm.addStyle("margin-left", oLayoutData.marginPx + "px");
					oRm.writeStyles();
					oRm.write(">");

					oRm.write("<div class='sapUshellEasyScanLayoutInner' tabindex='0'>");

					if (aCards.length > 0) {
						var card = {};
                        var colCount = oControl.dashboardLayoutUtil.oLayoutData.colCount;
						filteredItems.forEach(function(item, index) {
							card = aCards.filter(function(element) {
								return element.id === this.getId().split("--")[1];
							}.bind(item))[0];

							//re-set css values for current card
							oControl.dashboardLayoutUtil.setCardCssValues(card);
                            var classToBeAdded = '';
                            var bSideCard = card.dashboardLayout.column + card.dashboardLayout.colSpan === colCount + 1;
                            if (bSideCard) {
                                if (card.dashboardLayout.colSpan === 1) {
                                    classToBeAdded = 'sapOvpNotResizableLeftRight';
                                } else {
                                    classToBeAdded = 'sapOvpNotResizableRight';
                                }
                            }

                            if (card.template === "sap.ovp.cards.stack" || card.settings.stopResizing) {
                                oRm.write("<div id='" + oControl.dashboardLayoutUtil.getCardDomId(card.id) +
                                    //padding: 1rem; vs. border: 0.5rem solid transparent
                                "' class='easyScanLayoutItemWrapper sapOvpDashboardLayoutItem sapOvpDashboardLayoutItemNoDragIcon' style='" +
                                "; transform:translate3d(" + card.dashboardLayout.left + " ," + card.dashboardLayout.top + " ,0px)" +
                                "; -ms-transform:translate3d(" + card.dashboardLayout.left + " ," + card.dashboardLayout.top + " ,0px)" +
                                "; -moz-transform:translate3d(" + card.dashboardLayout.left + " ," + card.dashboardLayout.top + " ,0px)" +
                                "; -webkit-transform:translate3d(" + card.dashboardLayout.left + " ," + card.dashboardLayout.top + " ,0px)" +
                                "; height:" + card.dashboardLayout.height + "; width:" + card.dashboardLayout.width + ";'" +
                                " tabindex='0'; aria-setsize=" + filteredItems.length + " aria-posinset=" + index + ">");
                            } else if (!sap.ui.Device.support.touch) {
                                oRm.write("<div id='" + oControl.dashboardLayoutUtil.getCardDomId(card.id) +
                                    //padding: 1rem; vs. border: 0.5rem solid transparent
                                "' class='easyScanLayoutItemWrapper sapOvpDashboardLayoutItem " + classToBeAdded +"' style='" +
                                "; transform:translate3d(" + card.dashboardLayout.left + " ," + card.dashboardLayout.top + " ,0px)" +
                                "; -ms-transform:translate3d(" + card.dashboardLayout.left + " ," + card.dashboardLayout.top + " ,0px)" +
                                "; -moz-transform:translate3d(" + card.dashboardLayout.left + " ," + card.dashboardLayout.top + " ,0px)" +
                                "; -webkit-transform:translate3d(" + card.dashboardLayout.left + " ," + card.dashboardLayout.top + ", 0px)" +
                                "; height:" + card.dashboardLayout.height + "; width:" + card.dashboardLayout.width + ";'" +
                                " tabindex='0'; aria-setsize=" + filteredItems.length + " aria-posinset=" + index + ">");
                            } else { //this is a workaround since UI5 do not yet provide a touch device information
                                oRm.write("<div id='" + oControl.dashboardLayoutUtil.getCardDomId(card.id) +
                                    //padding: 1rem; vs. border: 0.5rem solid transparent
                                "' class='easyScanLayoutItemWrapper sapOvpDashboardLayoutItem sapOvpDashboardLayoutItemTouch' style='" +
                                "; transform:translate3d(" + card.dashboardLayout.left + " ," + card.dashboardLayout.top + " ,0px)" +
                                "; -ms-transform:translate3d(" + card.dashboardLayout.left + " ," + card.dashboardLayout.top + " ,0px)" +
                                "; -moz-transform:translate3d(" + card.dashboardLayout.left + " ," + card.dashboardLayout.top + " ,0px)" +
                                "; -webkit-transform:translate3d(" + card.dashboardLayout.left + "," + card.dashboardLayout.top + ", 0px)" +
                                "; height:" + card.dashboardLayout.height + "; width:" + card.dashboardLayout.width + ";'" +
                                " tabindex='0'; aria-setsize=" + filteredItems.length + " aria-posinset=" + index + ">");
                            }

							oRm.renderControl(item);

							oRm.write("</div>");
						});
					}

					oRm.write("</div>");
					oRm.write("</div>");
				}
			},

			init: function() {
				this.oColumnLayoutData = {};
				this.resizeHandlerId = this.initResizeHandler();

				var oComponent = sap.ui.getCore().getComponent(this._sOwnerId);
				this.dashboardLayoutUtil = oComponent.getDashboardLayoutUtil();
				this.dashboardLayoutUtil.setLayout(this);
			},

			exit: function() {
				//de-register event handler
				if (this.resizeHandlerId) {
					sap.ui.core.ResizeHandler.deregister(this.resizeHandlerId);
				}
				//delete rearrange instance (incl. its ui actions)
				if (this.layoutDragAndDrop) {
					this.layoutDragAndDrop.destroy();
					delete this.layoutDragAndDrop;
				}
			},

			onBeforeRendering: function() {},

			onAfterRendering: function() {

				if (!this.getDragAndDropRootSelector()) {
					this.setDragAndDropRootSelector("#" + this.getId());
				}
				if (this.layoutDragAndDrop) {
					this.layoutDragAndDrop.destroy();
				}
				if (this.getDragAndDropEnabled()) {

					this.layoutDragAndDrop = this.dashboardLayoutUtil.getRearrange({
						rootSelector: this.getDragAndDropRootSelector(),
						layout: this
					});

					this.fireAfterRendering();
				}
			},

			/** 
			 * get the DashboardLayout variants in JSON format
			 * @method getLayoutVariantsJSON
			 * @returns {Object} JSON containing the layout variants
			 */
			getLayoutDataJSON: function() {
				//JSON.stringify(...?
				return this.dashboardLayoutUtil.getDashboardLayoutModel().getLayoutVariants4Pers();
			},

			getDashboardLayoutUtil: function() {
				return this.dashboardLayoutUtil;
			},

			getDashboardLayoutModel: function() {
				return this.dashboardLayoutUtil.getDashboardLayoutModel();
			},

			getVisibleLayoutItems: function() {
				//layout items could be hidden, so we filter them and receive only visible
				var content = this.getContent();
				var filteredItems = content.filter(function(item) {
					return item.getVisible();
				});
				return filteredItems;
			},

			initResizeHandler: function() {
				var resizeHandlerTimerId;
				var debounceTime = this.getDebounceTime();
				var resizeHandlerDebounce = function(evt) {
					window.clearTimeout(resizeHandlerTimerId);
					resizeHandlerTimerId = window.setTimeout(this.oControl.resizeHandler.bind(this, evt), debounceTime);
				};

				return sap.ui.core.ResizeHandler.register(this, resizeHandlerDebounce);
			},

			resizeHandler: function(evt) {
				this.oControl.dashboardLayoutUtil.resizeLayout(evt.size.width);
			}

		});

		return DashboardLayout;

	}, /* bExport= */
	true);