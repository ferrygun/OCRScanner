/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides control sap.ui.comp.navpopover.NavigationPopover.
sap.ui.define([
	'jquery.sap.global', 'sap/m/Link', 'sap/m/ResponsivePopover', 'sap/m/Button', 'sap/m/Title', 'sap/m/Image', 'sap/m/Text', 'sap/ui/layout/form/SimpleForm', 'sap/m/VBox', 'sap/m/HBox', 'sap/m/ResponsivePopoverRenderer', './Factory', './LinkData', 'sap/ui/model/json/JSONModel'
], function(jQuery, Link, ResponsivePopover, Button, Title, Image, Text, SimpleForm, VBox, HBox, ResponsivePopoverRenderer, Factory, LinkData, JSONModel) {
	"use strict";

	/**
	 * Constructor for a new navpopover/NavigationPopover.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class The NavigationPopover control is used to present information in a specific format. <b>Note</b>: This control is used by the
	 *        {@link sap.ui.comp.navpopover.NavigationPopoverHandler NavigationPopoverHandler} and must not be used manually.
	 * @extends sap.m.ResponsivePopover
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.navpopover.NavigationPopover
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var NavigationPopover = ResponsivePopover.extend("sap.ui.comp.navpopover.NavigationPopover", /** @lends sap.ui.comp.navpopover.NavigationPopover.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			properties: {

				/**
				 * The name of the semantic object.
				 *
				 * @deprecated Since 1.40.0. The property <code>semanticObjectName</code> is obsolete as target determination is no longer done by
				 *             NavigationPopover. Instead the NavigationPopoverHandler is responsible for target determination.
				 * @since 1.28.0
				 */
				semanticObjectName: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Describes the semantic attributes. The attribute has to be a map.
				 *
				 * @deprecated Since 1.40.0. The property <code>semanticAttributes</code> is obsolete as target determination is no longer done by
				 *             NavigationPopover. Instead the NavigationPopoverHandler is responsible for target determination.
				 * @since 1.28.0
				 */
				semanticAttributes: {
					type: "object",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * The application state key passed to retrieve the navigation targets.
				 *
				 * @deprecated Since 1.40.0. The property <code>appStateKey</code> is obsolete as target determination is no longer done by
				 *             NavigationPopover. Instead the NavigationPopoverHandler is responsible for target determination.
				 * @since 1.28.0
				 */
				appStateKey: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Sets the description of the main navigation link. If <code>mainNavigation</code> also contains an href description, then
				 * <code>mainNavigationId</code> is displayed. If <code>mainNavigationId</code> is set to an empty string <code>''</code>,
				 * neither description nor subtitle are displayed.
				 *
				 * @since 1.28.0
				 */
				mainNavigationId: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Determines the text of personalization link. If this property is set to some string, choosing the personalization link will trigger
				 * the <code>availableActionsPersonalizationPress</code> event. If this property is not set, the personalization link is not shown.
				 *
				 * @since 1.44.0
				 */
				availableActionsPersonalizationText: {
					type: "string",
					group: "Misc",
					defaultValue: undefined
				}
			},
			aggregations: {

				/**
				 * A list of available actions shown as links.
				 *
				 * @since 1.28.0
				 */
				availableActions: {
					type: "sap.ui.comp.navpopover.LinkData",
					multiple: true,
					singularName: "availableAction"
				},

				/**
				 * The main navigation link. If <code>mainNavigationId</code> is not set then <code>text</code> of <code>mainNavigation</code>
				 * is displayed. Otherwise the <code>mainNavigationId</code> is displayed.
				 *
				 * @since 1.28.0
				 */
				mainNavigation: {
					type: "sap.ui.comp.navpopover.LinkData",
					multiple: false
				},

				/**
				 * The navigation taking the user back to the source application.
				 *
				 * @deprecated Since 1.40.0. The property <code>ownNavigation</code> is obsolete as target determination is no longer done by
				 *             NavigationPopover. Instead the NavigationPopoverHandler is responsible for target determination.
				 * @since 1.28.0
				 */
				ownNavigation: {
					type: "sap.ui.comp.navpopover.LinkData",
					multiple: false
				}
			},
			associations: {

				/**
				 * Source control for which the popover is displayed.
				 *
				 * @since 1.28.0
				 */
				source: {
					type: "sap.ui.core.Control",
					multiple: false
				},

				/**
				 * In addition to main navigation link and available links some additional content can be displayed in the popover.
				 *
				 * @since 1.28.0
				 */
				extraContent: {
					type: "sap.ui.core.Control",
					multiple: false
				},

				/**
				 * The parent component.
				 */
				component: {
					type: "sap.ui.core.Element",
					multiple: false
				}
			},
			events: {

				/**
				 * The navigation targets that are shown.
				 *
				 * @deprecated Since 1.40.0. The event <code>navigationTargetsObtained</code> is obsolete as target determination is no longer done
				 *             by NavigationPopover. Instead the NavigationPopoverHandler is responsible for target determination. The event
				 *             <code>navigationTargetsObtained</code> is fired from NavigationPopoverHandler after navigation targets are
				 *             determined.
				 * @since 1.28.0
				 */
				targetsObtained: {},

				/**
				 * This event is fired when a link is chosen.
				 *
				 * @since 1.28.0
				 */
				navigate: {
					parameters: {
						/**
						 * The UI text shown in the chosen link
						 */
						text: {
							type: "string"
						},

						/**
						 * The navigation target of the chosen link
						 */
						href: {
							type: "string"
						}
					}
				},

				/**
				 * This event is fired when personalization of <code>availableActions</code> is chosen.
				 *
				 * @since 1.44.0
				 */
				availableActionsPersonalizationPress: {}
			}
		},
		renderer: ResponsivePopoverRenderer.render
	});

	NavigationPopover.prototype.init = function() {
		ResponsivePopover.prototype.init.call(this);

		var oModel = new JSONModel({
			mainNavigationLink: {
				title: undefined,
				subtitle: undefined,
				href: undefined,
				target: undefined
			},
			ownNavigation: undefined, // obsolete
			availableActions: [],
			availableActionsPressMap: {},
			availableActionsPersonalizationText: undefined,
			extraContent: undefined
		});
		oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
		oModel.setSizeLimit(1000);
		this.setModel(oModel, "$sapuicompNavigationPopover");

		this._bUseExternalContent = false;

		this.addStyleClass("navigationPopover");
		this.setContentWidth("380px");
		this.setHorizontalScrolling(false);
		this.setShowHeader(sap.ui.Device.system.phone);
		this.setPlacement(sap.m.PlacementType.Auto);
	};

	NavigationPopover.prototype.applySettings = function(mSettings) {
		if (mSettings && mSettings.customData && mSettings.customData.getProperty("key") === "useExternalContent") {
			this._bUseExternalContent = true;
		}
		this._createContent();
		ResponsivePopover.prototype.applySettings.apply(this, arguments);
	};

	// ----------------------- Public Methods --------------------------

	/**
	 * Determines the potential navigation targets for the semantical object and visualize the popover.
	 *
	 * @public
	 * @deprecated Since 1.42.0. Target determination is no longer done by NavigationPopover. Instead the NavigationPopoverHandler is responsible for
	 *             target determination.
	 */
	NavigationPopover.prototype.retrieveNavTargets = function() {

		var oXApplNavigation = Factory.getService("CrossApplicationNavigation");
		var oURLParsing = Factory.getService("URLParsing");
		if (!oXApplNavigation || !oURLParsing) {
			jQuery.sap.log.error("Service 'CrossApplicationNavigation' could not be obtained");
			// still fire targetsObtained event: easier for testing and the eventhandlers still could provide static links
			this.fireTargetsObtained();
			return;
		}

		var that = this;

		this.setMainNavigation(null);
		this.setOwnNavigation(null);
		this.removeAllAvailableActions();

		var oPromise = oXApplNavigation.getLinks({
			semanticObject: this.getSemanticObjectName(),
			params: this.getSemanticAttributes(),
			appStateKey: this.getAppStateKey(),
			ui5Component: this._getComponent(),
			sortResultOnTexts: true
		// ignoreFormFactor: false
		});
		oPromise.done(function(aLinks) {
			if (!aLinks || !aLinks.length) {
				that.fireTargetsObtained();
				return;
			}

			var sCurrentHash = oXApplNavigation.hrefForExternal();
			if (sCurrentHash && sCurrentHash.indexOf("?") !== -1) {
				// sCurrentHash can contain query string, cut it off!
				sCurrentHash = sCurrentHash.split("?")[0];
			}

			aLinks.forEach(function(oLink) {
				if (oLink.intent.indexOf(sCurrentHash) === 0) {
					// Prevent current app from being listed
					// NOTE: If the navigation target exists in
					// multiple contexts (~XXXX in hash) they will all be skipped
					that.setOwnNavigation(new LinkData({
						href: oLink.intent,
						text: oLink.text
					}));
					return;
				}
				// Check if a FactSheet exists for this SemanticObject (to skip the first one found)
				var oShellHash = oURLParsing.parseShellHash(oLink.intent);
				if (oShellHash.action && (oShellHash.action === 'displayFactSheet')) {
					// Prevent FactSheet from being listed in 'Related Apps' section. Requirement: Link with action 'displayFactSheet' should
					// be shown in the 'Main Link' Section
					that.setMainNavigation(new LinkData({
						href: oLink.intent,
						text: sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("POPOVER_FACTSHEET")
					}));
					return;
				}

				that.addAvailableAction(new LinkData({
					href: oLink.intent,
					text: oLink.text
				}));
			});

			that.fireTargetsObtained();
		});
		oPromise.fail(function() {
			// Reset actions
			jQuery.sap.log.error("'retrieveNavTargets' failed");
		});
	};

	/**
	 * Displays the popover. This method should be called, once all navigation targets are adapted by the application.
	 *
	 * @public
	 */
	NavigationPopover.prototype.show = function(oDomRef) {
		if (!this._hasNavigationTargets()) {
			jQuery.sap.log.error("no navigation targets assigned");
			return;
		}
		var oControl = oDomRef || this._getControl();
		if (!oControl) {
			jQuery.sap.log.error("no source assigned");
			return;
		}

		this.openBy(oControl);
	};

	/**
	 * Returns link for direct navigation if the NavigationPopover has only <code>mainNavigation</code> or
	 * one <code>availableAction</code> and no <code>extraContent</code>.
	 *
	 * @returns {sap.m.Link | null} Link for direct navigation
	 * @public
	 */
	NavigationPopover.prototype.getDirectLink = function() {
		if (this._bUseExternalContent) {
			return this.getContent()[0].getDirectLink();
		}
		var oModel = this.getModel("$sapuicompNavigationPopover");

		// Extra content should be shown always, no direct navigation possible
		if (oModel.getProperty('/extraContent')) {
			return null;
		}

		// If only main navigation link exists, direct navigation is possible
		if (oModel.getProperty('/mainNavigationLink/href') && !oModel.getProperty('/availableActions').length) {
			return this._oHeaderArea.getItems()[0];
		}

		// If only one availabel action exists (independent whether it is visible or not), direct navigation is possible
		if (oModel.getProperty('/availableActions').length === 1 && !oModel.getProperty('/mainNavigationLink/href')) {
			return this._oActionArea.getItems()[0].getItems()[0];
		}
		return null;
	};

	/**
	 * @private
	 */
	NavigationPopover.prototype.hasContent = function() {
		if (this._bUseExternalContent) {
			return this.getContent()[0].hasContent();
		}
		var oModel = this.getModel("$sapuicompNavigationPopover");
		return !!oModel.getProperty("/mainNavigationLink/href") || !!oModel.getProperty("/availableActions").length || !!oModel.getProperty('/extraContent');
	};

	// ----------------------- Overwrite Property Methods --------------------------

	NavigationPopover.prototype.setMainNavigationId = function(sMainNavigationId) {
		if (this._bUseExternalContent) {
			throw "The API should not be used in case that the external content has been set";
		}
		this.setProperty("mainNavigationId", sMainNavigationId, true);
		var oModel = this.getModel("$sapuicompNavigationPopover");
		if (typeof sMainNavigationId === "string") {
			oModel.setProperty("/mainNavigationLink/title", sMainNavigationId);
		}
		return this;
	};

	NavigationPopover.prototype.setAvailableActionsPersonalizationText = function(sAvailableActionsPersonalizationText) {
		if (this._bUseExternalContent) {
			throw "The API should not be used in case that the external content has been set";
		}
		this.setProperty("availableActionsPersonalizationText", sAvailableActionsPersonalizationText, true);
		var oModel = this.getModel("$sapuicompNavigationPopover");
		oModel.setProperty("/availableActionsPersonalizationText", sAvailableActionsPersonalizationText);
		return this;
	};

	// ----------------------- Overwrite Aggregation Methods --------------------------

	// ----------------------- Overwrite Association Methods --------------------------

	NavigationPopover.prototype.setExtraContent = function(oControl) {
		if (this._bUseExternalContent) {
			throw "The API should not be used in case that the external content has been set";
		}
		var oModel = this.getModel("$sapuicompNavigationPopover");
		if (oModel.getProperty("/extraContent")) {
			this._getContentContainer().removeItem(1);
		}
		// Note: 'extraContent' is an association of an control which is created by application in 'navigationTargetsObtained' event. Now we have to
		// add this control to the popover content aggregation. Doing so the NavigationPopover is responsible for life cycle of this control which
		// will be destroyed together with NavigationPopover.
		if (typeof oControl === "string") {
			oControl = sap.ui.getCore().byId(oControl);
		}

		this._getContentContainer().insertItem(oControl, 1);

		this.setAssociation("extraContent", oControl);
		oModel.setProperty("/extraContent", oControl);
		return this;
	};

	NavigationPopover.prototype.setMainNavigation = function(oLinkData) {
		if (this._bUseExternalContent) {
			throw "The API should not be used in case that the external content has been set";
		}
		this.setAggregation("mainNavigation", oLinkData, true);
		if (!oLinkData) {
			return this;
		}
		var oModel = this.getModel("$sapuicompNavigationPopover");
		if (oLinkData.getHref()) {
			oModel.setProperty("/mainNavigationLink/href", this._convertToExternal(oLinkData.getHref()));
			oModel.setProperty("/mainNavigationLink/target", oLinkData.getTarget());
			this._oHeaderArea.removeStyleClass("navpopoversmallheader");
		} else {
			// oModel.setProperty("/mainNavigationLink/href", null);
			// oModel.setProperty("/mainNavigationLink/target", null);
			this._oHeaderArea.addStyleClass("navpopoversmallheader");
		}
		// Priority for 'title':
		// 1. 'mainNavigationId' 2. oLinkData.getText()
		// Note: Empty string '' have to lead that both title and subtitle will not be displayed. So if title is equal to '' then do not take over the
		// text of link.
		if (!oModel.getProperty("/mainNavigationLink/title") && oModel.getProperty("/mainNavigationLink/title") !== '') {
			oModel.setProperty("/mainNavigationLink/title", oLinkData.getText());
		}
		oModel.setProperty("/mainNavigationLink/subtitle", oLinkData.getDescription());
		return this;
	};

	NavigationPopover.prototype.addAvailableAction = function(oLinkData) {
		if (this._bUseExternalContent) {
			throw "The API should not be used in case that the external content has been set";
		}
		this.addAggregation("availableActions", oLinkData);
		if (!oLinkData) {
			return this;
		}

		oLinkData.setHref(this._convertToExternal(oLinkData.getHref()));
		oLinkData.setPress(this._onLinkPress.bind(this));

		var oModel = this.getModel("$sapuicompNavigationPopover");
		var iIndex = oModel.getProperty("/availableActions").length;
		oModel.getData().availableActions.splice(iIndex, 0, oLinkData.getJson());
		// TODO ändern auf oModel.setProperty("/availableActions", sAvailableActions;
		oModel.getData().availableActionsPressMap[oLinkData.getText() + "---" + oLinkData.getHref()] = this._onLinkPress.bind(this);
		oModel.refresh(true);
		return this;
	};

	NavigationPopover.prototype.insertAvailableAction = function(oLinkData, iIndex) {
		if (this._bUseExternalContent) {
			throw "The API should not be used in case that the external content has been set";
		}
		this.insertAggregation("availableActions", oLinkData, iIndex);
		if (!oLinkData) {
			return this;
		}

		oLinkData.setHref(this._convertToExternal(oLinkData.getHref()));
		oLinkData.setPress(this._onLinkPress.bind(this));

		var oModel = this.getModel("$sapuicompNavigationPopover");
		oModel.getData().availableActions.splice(iIndex, 0, oLinkData.getJson());
		// TODO ändern auf oModel.setProperty("/availableActions", sAvailableActions;
		oModel.getData().availableActionsPressMap[oLinkData.getText() + "---" + oLinkData.getHref()] = this._onLinkPress.bind(this);
		oModel.refresh(true);
		return this;
	};

	NavigationPopover.prototype.removeAvailableAction = function(oLinkData) {
		if (this._bUseExternalContent) {
			throw "The API should not be used in case that the external content has been set";
		}
		var iIndex = this.indexOfAvailableAction(oLinkData);
		if (iIndex > -1) {
			// Remove item data from model
			var oModel = this.getModel("$sapuicompNavigationPopover");
			oModel.getData().availableActions.splice(iIndex, 1);
			oModel.refresh(true);
		}
		oLinkData = this.removeAggregation("availableActions", oLinkData);
		return oLinkData;
	};

	NavigationPopover.prototype.removeAllAvailableActions = function() {
		if (this._bUseExternalContent) {
			throw "The API should not be used in case that the external content has been set";
		}
		var aAvailableActions = this.removeAllAggregation("availableActions");
		// Remove items data from model
		var oModel = this.getModel("$sapuicompNavigationPopover");
		oModel.setProperty("/availableActions", []);
		oModel.refresh(true);
		return aAvailableActions;
	};

	NavigationPopover.prototype.exit = function(oControl) {
		// destroy model and its data
		if (this.getModel("$sapuicompNavigationPopover")) {
			this.getModel("$sapuicompNavigationPopover").destroy();
		}
		ResponsivePopover.prototype.exit.apply(this, arguments);
	};

	NavigationPopover.prototype.onAfterRenderingActionForm = function() {
		var oModel = this.getModel("$sapuicompNavigationPopover");
		var $ContentContainer = oModel.getProperty("/extraContent") ? oModel.getProperty("/extraContent").$()[0] : undefined;

		if ($ContentContainer && $ContentContainer.scrollHeight > $ContentContainer.clientHeight) {
			// Change the default behavior for the case that all three sections can not fit the height of phone (e.g. the additionalContentSection is
			// larger then the spared place
			this._getContentContainer().setFitContainer(false).setJustifyContent(sap.m.FlexJustifyContent.Start);
		}
	};

	// -------------------------- Private Methods ------------------------------------

	/**
	 * @private
	 */
	NavigationPopover.prototype._createContent = function() {
		if (this._bUseExternalContent) {
			return;
		}
		var that = this;

		var oTitle = new Link({
			href: {
				path: '/mainNavigationLink/href'
			},
			text: {
				path: '/mainNavigationLink/title'
			},
			target: {
				path: '/mainNavigationLink/target'
			},
			visible: {
				path: '/mainNavigationLink/title',
				formatter: function(oTitle_) {
					return !!oTitle_;
				}
			},
			enabled: {
				path: '/mainNavigationLink/href',
				formatter: function(oValue) {
					return !!oValue;
				}
			},
			press: this._onLinkPress.bind(this)
		});
		oTitle.addStyleClass("navigationPopoverTitle");

		var oSubTitle = new Text({
			text: {
				path: '/mainNavigationLink/subtitle'
			},
			visible: {
				path: '/mainNavigationLink/subtitle',
				formatter: function(oValue) {
					return !!oValue;
				}
			}
		});

		this._oHeaderArea = new VBox({
			items: [
				oTitle, oSubTitle
			],
			visible: {
				path: '/mainNavigationLink/title',
				formatter: function(oTitle_) {
					return !!oTitle_;
				}
			}
		});
		this._oHeaderArea.addStyleClass("navigationPopoverTitleH1");
		this._oHeaderArea.addStyleClass("navigationPopoverHeader");
		this._oHeaderArea.setModel(this.getModel("$sapuicompNavigationPopover"));

		this._oActionArea = new VBox({
			visible: {
				parts: [
					{
						path: '/availableActions'
					}, {
						path: '/availableActionsPersonalizationText'
					}
				],
				formatter: function(aMAvailableActions, sAvailableActionsPersonalizationText) {
					var aMVisibleAvailableActions = aMAvailableActions.filter(function(oMAvailableAction) {
						return oMAvailableAction.visible === true;
					});
					return aMVisibleAvailableActions.length > 0 || !!sAvailableActionsPersonalizationText;
				}
			},
			items: [
				new VBox({
					items: {
						path: '/availableActions',
						templateShareable: false,
						template: new Link({
							text: "{text}",
							href: "{href}",
							target: "{target}",
							press: function(oEvent) {
								var fOnPress = that.getModel("$sapuicompNavigationPopover").getProperty("/availableActionsPressMap")[this.getText() + "---" + this.getHref()];
								if (fOnPress) {
									fOnPress(oEvent);
								}
							},
							visible: "{visible}"
						})
					}
				})
			]
		});
		this._oActionArea.addEventDelegate({
			onAfterRendering: this.onAfterRenderingActionForm.bind(this)
		});
		this._oActionArea.addStyleClass("navigationPopoverAvailableLinks");
		this._oActionArea.setModel(this.getModel("$sapuicompNavigationPopover"));

		this._oPersonalizationButton = new HBox({
			justifyContent: "End",
			items: new Button({
				type: sap.m.ButtonType.Transparent,
				text: {
					path: '/availableActionsPersonalizationText'
				},
				visible: {
					parts: [
						{
							path: '/availableActions'
						}, {
							path: '/availableActionsPersonalizationText'
						}
					],
					formatter: function(aMAvailableActions, sAvailableActionsPersonalizationText) {
						return aMAvailableActions.length > 0 && !!sAvailableActionsPersonalizationText;
					}
				},
				press: function() {
					that.fireAvailableActionsPersonalizationPress();
				}
			})
		});
		this._oPersonalizationButton.setModel(this.getModel("$sapuicompNavigationPopover"));
		this._oPersonalizationButton.addStyleClass("navigationPopoverPersonalizationButton");

		var oSeparator = new VBox({
			visible: {
				parts: [
					{
						path: '/availableActions'
					}, {
						path: '/availableActionsPersonalizationText'
					}
				],
				formatter: function(aMAvailableActions, sAvailableActionsPersonalizationText) {
					var aMVisibleAvailableActions = aMAvailableActions.filter(function(oMAvailableAction) {
						return oMAvailableAction.visible === true;
					});
					return aMVisibleAvailableActions.length > 0 || !!sAvailableActionsPersonalizationText;
				}
			}
		});
		oSeparator.setModel(this.getModel("$sapuicompNavigationPopover"));
		oSeparator.addStyleClass("navigationPopoverSeparator");

		this.addContent(new VBox({
			// Default behavior for the case that all three sections can fit the height of phone (e.g. only mainNavigationSection and
			// relatedAppsSection w/o additionalContentSection or mainNavigationSection, relatedAppsSection and small additionalContentSection)
			fitContainer: true,
			justifyContent: sap.m.FlexJustifyContent.Start,
			items: [
				this._oHeaderArea, oSeparator, this._oActionArea, this._oPersonalizationButton
			]
		}));
	};

	/**
	 * Returns the container (currently VBox) which contains the mainNavigationSection, additionalContentSection and relatedAppsSection.
	 * @private
	 */
	NavigationPopover.prototype._getContentContainer = function() {
		return this.getContent()[0];
	};

	/**
	 * EventHandler for all link press on this popover
	 *
	 * @param {object} oEvent - the event parameters
	 * @private
	 */
	NavigationPopover.prototype._onLinkPress = function(oEvent) {
		this.fireNavigate({
			text: oEvent.getSource().getText(),
			href: oEvent.getSource().getHref()
		});
	};

	/**
	 * When no fact sheet exists and no actions and no content, then do not show popover.
	 *
	 * @private
	 */
	NavigationPopover.prototype._hasNavigationTargets = function() {
		if (!this.hasContent()) {
			jQuery.sap.require("sap.m.MessageBox");
			var MessageBox = sap.ui.require("sap/m/MessageBox");
			MessageBox.show(sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("POPOVER_DETAILS_NAV_NOT_POSSIBLE"), {
				icon: MessageBox.Icon.ERROR,
				title: sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("POPOVER_MSG_NAV_NOT_POSSIBLE"),
				actions: [
					sap.m.MessageBox.Action.CLOSE
				],
				styleClass: (this.$() && this.$().closest(".sapUiSizeCompact").length) ? "sapUiSizeCompact" : ""
			});
			return false;
		}
		return true;
	};

	/**
	 * @private
	 */
	NavigationPopover.prototype._convertToExternal = function(sHref) {
		var oXApplNavigation = Factory.getService("CrossApplicationNavigation");
		if (!oXApplNavigation) {
			return sHref;
		}
		return oXApplNavigation.hrefForExternal({
			target: {
				shellHash: sHref
			}
		}, this._getComponent());
	};

	/**
	 * Returns the control instance for which the popover should be displayed.
	 *
	 * @returns { sap.ui.core.Control}
	 * @private
	 */
	NavigationPopover.prototype._getControl = function() {
		var oControl = this.getAssociation("source");
		if (typeof oControl === "string") {
			oControl = sap.ui.getCore().byId(oControl);
		}
		return oControl;
	};

	/**
	 * Returns the component object.
	 *
	 * @returns {object} the component
	 * @private
	 */
	NavigationPopover.prototype._getComponent = function() {
		var oComponent = this.getComponent();
		if (typeof oComponent === "string") {
			oComponent = sap.ui.getCore().getComponent(oComponent);
		}
		return oComponent;
	};

	return NavigationPopover;

}, /* bExport= */true);
