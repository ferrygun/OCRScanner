/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides control sap.ui.comp.navpopover.NavigationContainer.
sap.ui.define([
	'sap/m/Link', 'sap/ui/core/Control', 'sap/m/VBox', 'sap/m/HBox', 'sap/m/Button', 'sap/m/Title', 'sap/m/Image', 'sap/m/Text', 'sap/ui/layout/form/SimpleForm', 'sap/m/VBoxRenderer', './Factory', './LinkData', 'sap/ui/model/json/JSONModel', './Util', 'sap/ui/core/TitleLevel', 'sap/ui/layout/HorizontalLayout', 'sap/ui/layout/VerticalLayout', 'sap/ui/layout/form/SimpleFormLayout', 'sap/ui/comp/personalization/Util', './FlexHandler'
], function(Link, Control, VBox, HBox, Button, Title, Image, Text, SimpleForm, VBoxRenderer, Factory, LinkData, JSONModel, Util, CoreTitleLevel, HorizontalLayout, VerticalLayout, SimpleFormLayout, PersonalizationUtil, FlexHandler) {
	"use strict";

	/**
	 * Constructor for a new navpopover/NavigationContainer.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class The NavigationContainer...
	 * @extends sap.m.VBox
	 * @constructor
	 * @private
	 * @since 1.44.0
	 * @alias sap.ui.comp.navpopover.NavigationContainer
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var NavigationContainer = VBox.extend("sap.ui.comp.navpopover.NavigationContainer", /** @lends sap.ui.comp.navpopover.NavigationContainer.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			properties: {

				/**
				 * Sets the description of the main navigation link. If <code>mainNavigation</code> also contains an href description, then
				 * <code>mainNavigationId</code> is displayed. If <code>mainNavigationId</code> is set to an empty string <code>''</code>,
				 * neither description nor subtitle are displayed.
				 */
				mainNavigationId: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Determines the text of personalization link. If this property is set to some string, choosing the personalization link will trigger
				 * the <code>availableActionsPersonalizationPress</code> event. If this property is not set, the personalization link is not shown.
				 */
				availableActionsPersonalizationText: {
					type: "string",
					defaultValue: undefined
				},

				/**
				 * Determines whether the personalization link is shown inside the NavigationPopover control.
				 *
				 * @since 1.46.0
				 */
				enableAvailableActionsPersonalization: {
					type: "boolean",
					defaultValue: true
				}
			},
			aggregations: {

				/**
				 * A list of available actions shown as links.
				 */
				availableActions: {
					type: "sap.ui.comp.navpopover.LinkData",
					multiple: true,
					singularName: "availableAction"
				},

				/**
				 * The main navigation link. If <code>mainNavigationId</code> is not set then <code>text</code> of <code>mainNavigation</code>
				 * is displayed. Otherwise the <code>mainNavigationId</code> is displayed.
				 */
				mainNavigation: {
					type: "sap.ui.comp.navpopover.LinkData",
					multiple: false
				},

				/**
				 * Handler for communication with layered repository (LRep).
				 *
				 * @since 1.46.0
				 */
				flexHandler: {
					type: "sap.ui.comp.navpopover.FlexHandler",
					visibility: "hidden",
					multiple: false

				}
			},
			associations: {

				/**
				 * In addition to main navigation link and available links some additional content can be displayed in the popover.
				 */
				extraContent: {
					type: "sap.ui.core.Control",
					multiple: false
				},
				/**
				 * The parent component. TODO: to be removed. Also method _convertToExternal() should be removed. The converting of links to external
				 * format should be done in NavigationPopoverHandler.
				 */
				component: {
					type: "sap.ui.core.Element",
					multiple: false
				}
			},
			events: {

				/**
				 * This event is fired when a link is chosen.
				 */
				navigate: {},

				/**
				 * This event is fired when personalization of <code>availableActions</code> is chosen.
				 */
				availableActionsPersonalizationPress: {}
			}
		},
		renderer: VBoxRenderer.render
	});

	NavigationContainer.prototype.init = function() {
		VBox.prototype.init.call(this);

		var oModel = new JSONModel({
			mainNavigationLink: {
				title: undefined,
				subtitle: undefined,
				href: undefined,
				target: undefined
			},
			availableActions: [],
			availableActionsPressMap: {},
			availableActionsPersonalizationText: undefined,
			extraContent: undefined
		});
		oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
		oModel.setSizeLimit(1000);
		this.setModel(oModel, "$sapuicompNavigationContainer");

		this.setAggregation("flexHandler", new FlexHandler());

		this._createContent();
	};

	// ----------------------- Public Methods -------------------------

	NavigationContainer.prototype.openSelectionDialog = function(bForbidNavigation, bShowReset, fCallbackAfterClose, bIsEndUser, sStyleClass) {
		var that = this;
		return this._getFlexHandler().openSelectionDialog(this, bForbidNavigation, bShowReset, fCallbackAfterClose, bIsEndUser, sStyleClass).then(function() {
			that._updateAvailableActionsPersonalizationText();
		});
	};

	/**
	 * Returns link for direct navigation if the NavigationPopover has only <code>mainNavigation</code> or one <code>availableAction</code> and no
	 * <code>extraContent</code>.
	 *
	 * @returns {sap.m.Link | null}
	 * @private
	 */
	NavigationContainer.prototype.getDirectLink = function() {
		var oModel = this.getModel("$sapuicompNavigationContainer");

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
	NavigationContainer.prototype.hasContent = function() {
		var oModel = this.getModel("$sapuicompNavigationContainer");
		return !!oModel.getProperty("/mainNavigationLink/href") || !!oModel.getProperty("/availableActions").length || !!oModel.getProperty('/extraContent');
	};

	// ----------------------- Overwrite Property Methods --------------------------

	NavigationContainer.prototype.setExtraContent = function(oControl) {
		var oModel = this.getModel("$sapuicompNavigationContainer");
		if (oModel.getProperty("/extraContent")) {
			this.removeItem(1);
		}
		// Note: 'extraContent' is an association of an control which is created by application in 'navigationTargetsObtained' event. Now we have to
		// add this control to the popover content aggregation. Doing so the NavigationContainer is responsible for life cycle of this control which
		// will be destroyed together with NavigationContainer.
		if (typeof oControl === "string") {
			oControl = sap.ui.getCore().byId(oControl);
		}

		this.insertItem(oControl, 1);

		this.setAssociation("extraContent", oControl);
		oModel.setProperty("/extraContent", oControl);
		return this;
	};

	NavigationContainer.prototype.setMainNavigationId = function(sMainNavigationId) {
		this.setProperty("mainNavigationId", sMainNavigationId, true);
		var oModel = this.getModel("$sapuicompNavigationContainer");
		if (typeof sMainNavigationId === "string") {
			oModel.setProperty("/mainNavigationLink/title", sMainNavigationId);
		}
		return this;
	};

	NavigationContainer.prototype.setMainNavigation = function(oLinkData) {
		this.setAggregation("mainNavigation", oLinkData, true);
		if (!oLinkData) {
			return this;
		}
		var oModel = this.getModel("$sapuicompNavigationContainer");
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

	NavigationContainer.prototype.setAvailableActionsPersonalizationText = function(sAvailableActionsPersonalizationText) {
		this.setProperty("availableActionsPersonalizationText", sAvailableActionsPersonalizationText, true);
		var oModel = this.getModel("$sapuicompNavigationContainer");
		oModel.setProperty("/availableActionsPersonalizationText", sAvailableActionsPersonalizationText);
		return this;
	};

	NavigationContainer.prototype.setEnableAvailableActionsPersonalization = function(bEnableAvailableActionsPersonalization) {
		this.setProperty("enableAvailableActionsPersonalization", bEnableAvailableActionsPersonalization, true);
		this._updateAvailableActionsPersonalizationText();
		return this;
	};

	NavigationContainer.prototype.addAvailableAction = function(oLinkData) {
		this.addAggregation("availableActions", oLinkData);
		if (!oLinkData) {
			return this;
		}

		oLinkData.setHref(this._convertToExternal(oLinkData.getHref()));
		oLinkData.setPress(this._onLinkPress.bind(this));

		var oModel = this.getModel("$sapuicompNavigationContainer");
		var iIndex = oModel.getProperty("/availableActions").length;
		oModel.getData().availableActions.splice(iIndex, 0, oLinkData.getJson());
		// TODO ändern auf oModel.setProperty("/availableActions", sAvailableActions;
		oModel.getData().availableActionsPressMap[oLinkData.getText() + "---" + oLinkData.getHref()] = this._onLinkPress.bind(this);
		oModel.refresh(true);
		return this;
	};

	NavigationContainer.prototype.insertAvailableAction = function(oLinkData, iIndex) {
		this.insertAggregation("availableActions", oLinkData, iIndex);
		if (!oLinkData) {
			return this;
		}

		oLinkData.setHref(this._convertToExternal(oLinkData.getHref()));
		oLinkData.setPress(this._onLinkPress.bind(this));

		var oModel = this.getModel("$sapuicompNavigationContainer");
		oModel.getData().availableActions.splice(iIndex, 0, oLinkData.getJson());
		// TODO ändern auf oModel.setProperty("/availableActions", sAvailableActions;
		oModel.getData().availableActionsPressMap[oLinkData.getText() + "---" + oLinkData.getHref()] = this._onLinkPress.bind(this);
		oModel.refresh(true);
		return this;
	};

	NavigationContainer.prototype.removeAvailableAction = function(oLinkData) {
		var iIndex = this.indexOfAvailableAction(oLinkData);
		if (iIndex > -1) {
			// Remove item data from model
			var oModel = this.getModel("$sapuicompNavigationContainer");
			oModel.getData().availableActions.splice(iIndex, 1);
			oModel.refresh(true);
		}
		oLinkData = this.removeAggregation("availableActions", oLinkData);
		return oLinkData;
	};

	NavigationContainer.prototype.removeAllAvailableActions = function() {
		var aAvailableActions = this.removeAllAggregation("availableActions");
		// Remove items data from model
		var oModel = this.getModel("$sapuicompNavigationContainer");
		oModel.setProperty("/availableActions", []);
		oModel.refresh(true);
		return aAvailableActions;
	};

	NavigationContainer.prototype.exit = function(oControl) {
		// destroy model and its data
		if (this.getModel("$sapuicompNavigationContainer")) {
			this.getModel("$sapuicompNavigationContainer").destroy();
		}
	};

	NavigationContainer.prototype.onAfterRenderingActionForm = function() {
		var oModel = this.getModel("$sapuicompNavigationContainer");
		var $ContentContainer = oModel.getProperty("/extraContent") ? oModel.getProperty("/extraContent").$()[0] : undefined;

		if ($ContentContainer && $ContentContainer.scrollHeight > $ContentContainer.clientHeight) {
			// Change the default behavior for the case that all three sections can not fit the height of phone (e.g. the additionalContentSection is
			// larger then the spared place
			this.setFitContainer(false).setJustifyContent(sap.m.FlexJustifyContent.Start);
		}
	};

	// -------------------------- Private Methods ------------------------------------

	/**
	 * @private
	 */
	NavigationContainer.prototype._createContent = function() {
		var that = this;

		this.addStyleClass("navigationPopover");

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
		this._oHeaderArea.setModel(this.getModel("$sapuicompNavigationContainer"));

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
							press: this._onLinkPress.bind(this),
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
		this._oActionArea.setModel(this.getModel("$sapuicompNavigationContainer"));

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
		this._oPersonalizationButton.setModel(this.getModel("$sapuicompNavigationContainer"));
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
		oSeparator.setModel(this.getModel("$sapuicompNavigationContainer"));
		oSeparator.addStyleClass("navigationPopoverSeparator");

		// Default behavior for the case that all three sections can fit the height of phone (e.g. only mainNavigationSection and
		// relatedAppsSection w/o additionalContentSection or mainNavigationSection, relatedAppsSection and small additionalContentSection)
		this.setFitContainer(true);
		this.setJustifyContent(sap.m.FlexJustifyContent.Start);
		this.addItem(this._oHeaderArea).addItem(oSeparator).addItem(this._oActionArea).addItem(this._oPersonalizationButton);
	};

	/**
	 * EventHandler for all link press on this popover
	 *
	 * @param {object} oEvent - the event parameters
	 * @private
	 */
	NavigationContainer.prototype._onLinkPress = function(oEvent) {
		this.fireNavigate({
			text: oEvent.getSource().getText(),
			href: oEvent.getSource().getHref()
		});
	};

	/**
	 * @private
	 */
	NavigationContainer.prototype._convertToExternal = function(sHref) {
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
	 * Returns the component object.
	 *
	 * @returns {object} the component
	 * @private
	 */
	NavigationContainer.prototype._getComponent = function() {
		var oComponent = this.getComponent();
		if (typeof oComponent === "string") {
			oComponent = sap.ui.getCore().getComponent(oComponent);
		}
		return oComponent;
	};

	/**
	 * @private
	 */
	NavigationContainer.prototype._getFlexHandler = function() {
		return this.getAggregation("flexHandler");
	};

	/**
	 * @private
	 */
	NavigationContainer.prototype._updateAvailableAction = function(oLinkData, sLayer) {
		this._getFlexHandler().updateAvailableActionOfSnapshot(oLinkData, sLayer);
		this._syncAvailableActions();
	};

	/**
	 * @private
	 */
	NavigationContainer.prototype._discardAvailableActions = function(sLayer) {
		this._getFlexHandler().discardAvailableActionsOfSnapshot(sLayer);
		this._syncAvailableActions();
	};

	/**
	 * @private
	 */
	NavigationContainer.prototype._syncAvailableActions = function() {
		var oSnapshot = this._getFlexHandler().determineSnapshotOfAvailableActions();
		var oModel = this.getModel("$sapuicompNavigationContainer");

		// Update the value of '/availableActions' model
		oModel.getProperty("/availableActions").forEach(function(oMAvailableAction, iIndex) {
			if (oSnapshot[oMAvailableAction.key] !== undefined) {
				oModel.setProperty("/availableActions/" + iIndex + "/visible", oSnapshot[oMAvailableAction.key].visible);
			}
		});
	};

	/**
	 * @private
	 */
	NavigationContainer.prototype._updateAvailableActionsPersonalizationText = function() {
		// Default text is "More Links"
		var sAvailableActionsPersonalizationText = sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("POPOVER_DEFINE_LINKS");
		// Set text only if the link personalization is enabled
		if (this.getEnableAvailableActionsPersonalization()) {
			this.setAvailableActionsPersonalizationText(sAvailableActionsPersonalizationText);
		}
	};

	return NavigationContainer;

}, /* bExport= */true);
