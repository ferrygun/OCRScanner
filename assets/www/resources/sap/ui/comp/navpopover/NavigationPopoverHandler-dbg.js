/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides control sap.ui.comp.navpopover.NavigationPopoverHandler.
sap.ui.define([
	'jquery.sap.global', 'sap/ui/comp/library', "sap/ui/base/ManagedObject", './SemanticObjectController', 'sap/ui/model/json/JSONModel', 'sap/ui/core/Control', './Factory', './NavigationPopover', './Util', 'sap/m/VBox', './LinkData', 'sap/m/MessageBox', 'sap/ui/comp/personalization/Controller', 'sap/ui/comp/personalization/Util', './FlexHandler', './NavigationContainer'
], function(jQuery, CompLibrary, ManagedObject, SemanticObjectController, JSONModel, Control, Factory, NavigationPopover, Util, VBox, LinkData, MessageBox, Controller, PersonalizationUtil, FlexHandler, NavigationContainer) {
	"use strict";

	/**
	 * Constructor for a new navpopover/NavigationPopoverHandler.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class The NavigationPopoverHandler control determines navigation targets for a semantic object and shows them together with further information in a Popover.<br>
	 * <b>Note:</b> Navigation targets are determined using {@link sap.ushell.services.CrossApplicationNavigation CrossApplicationNavigation} of the unified shell service.
	 * @extends sap.ui.base.ManagedObject
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.navpopover.NavigationPopoverHandler
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var NavigationPopoverHandler = ManagedObject.extend("sap.ui.comp.navpopover.NavigationPopoverHandler",
	/** @lends sap.ui.comp.navpopover.NavigationPopoverHandler.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			properties: {

				/**
				 * Name of semantic object which is used to determine target navigations.
				 *
				 * @since 1.36.0
				 */
				semanticObject: {
					type: "string",
					defaultValue: null
				},

				/**
				 * Names of additional semantic objects which are used to determine target navigations.
				 *
				 * @since 1.42.0
				 */
				additionalSemanticObjects: {
					type: "string[]",
					defaultValue: []
				},

				/**
				 * The semantic object controller controls events for several NavigationPopoverHandler controls. If the controller is not set
				 * manually, it tries to find a SemanticObjectController in its parent hierarchy.
				 *
				 * @since 1.36.0
				 */
				semanticObjectController: {
					type: "any",
					defaultValue: null
				},

				/**
				 * The metadata field name for this NavigationPopoverHandler control.
				 *
				 * @since 1.36.0
				 */
				fieldName: {
					type: "string",
					defaultValue: null
				},

				/**
				 * Shown title of semantic object.
				 *
				 * @deprecated As of version 1.40.0 Title section with <code>semanticObjectLabel</code> has been removed due to new UI design
				 * @since 1.36.0
				 */
				semanticObjectLabel: {
					type: "string",
					defaultValue: null
				},

				/**
				 * If set to <code>false</code>, the NavigationPopoverHandler control will not replace its field name with the according
				 * <code>semanticObject</code> property during the calculation of the semantic attributes. This enables the usage of several
				 * NavigationPopoverHandler on the same semantic object. *
				 *
				 * @since 1.36.0
				 */
				mapFieldToSemanticObject: {
					type: "boolean",
					defaultValue: true
				},

				/**
				 * Navigation property that points from the current to the related entity type where the com.sap.vocabularies.Communication.v1.Contact
				 * annotation is defined, for example, <code>'to_Supplier'</code>. An empty string means that the related entity type is the
				 * current one.
				 *
				 * @since 1.40.0
				 */
				contactAnnotationPath: {
					type: "string",
					defaultValue: undefined
				},

				/**
				 * Determines whether the personalization link is shown inside the NavigationPopover control.
				 *
				 * @since 1.44.0
				 */
				enableAvailableActionsPersonalization: {
					type: "boolean",
					defaultValue: true
				}
			},
			associations: {
				/**
				 * The parent control.
				 *
				 * @since 1.36.0
				 */
				control: {
					type: "sap.ui.core.Control",
					multiple: false
				}
			},
			events: {

				/**
				 * Event is fired before the navigation popover opens and before navigation target links are getting retrieved. Event can be used to
				 * change the parameters used to retrieve the navigation targets. In case of NavigationPopoverHandler, the
				 * <code>beforePopoverOpens</code> is fired after the link has been clicked.
				 *
				 * @since 1.36.0
				 */
				beforePopoverOpens: {
					parameters: {
						/**
						 * The semantic object for which the navigation targets will be retrieved.
						 */
						semanticObject: {
							type: "string"
						},

						/**
						 * Map containing the semantic attributes calculated from the binding that will be used to retrieve the navigation targets.
						 *
						 * @deprecated Since 1.42.0. The parameter <code>semanticAttributes</code> is obsolete. Instead use the parameter
						 *             <code>semanticAttributesOfSemanticObjects</code>.
						 */
						semanticAttributes: {
							type: "object"
						},

						/**
						 * A map of semantic objects for which the navigation targets will be retrieved and it's semantic attributes calculated from
						 * the binding context. The semantic attributes will be used as parameters in order to retrieve the navigation targets.
						 *
						 * @since 1.42.0
						 */
						semanticAttributesOfSemanticObjects: {
							type: "object"
						},

						/**
						 * This callback function enables you to define a changed semantic attributes map. Signatures:
						 * <code>setSemanticAttributes(oSemanticAttributesMap)</code> Parameter:
						 * <ul>
						 * <li>{object} oSemanticAttributesMap New map containing the semantic attributes</li>
						 * <li>{string} sSemanticObject Semantic Object for which the oSemanticAttributesMap belongs</li>
						 * </ul>
						 */
						setSemanticAttributes: {
							type: "function"
						},

						/**
						 * This callback function sets an application state key that is used over the cross-application navigation. Signatures:
						 * <code>setAppStateKey(sAppStateKey)</code> Parameter:
						 * <ul>
						 * <li>{string} sAppStateKey</li>
						 * </ul>
						 */
						setAppStateKey: {
							type: "function"
						},

						/**
						 * The ID of the NavigationPopoverHandler.
						 */
						originalId: {
							type: "string"
						},

						/**
						 * This callback function triggers the retrieval of navigation targets and leads to the opening of the navigation popover.
						 * Signatures: <code>open()</code> If the <code>beforePopoverOpens</code> has been registered, the <code>open</code>
						 * function has to be called manually in order to open the navigation popover.
						 */
						open: {
							type: "function"
						}
					}
				},

				/**
				 * After the navigation targets are retrieved, <code>navigationTargetsObtained</code> is fired and provides the possibility to
				 * change the targets.
				 *
				 * @since 1.36.0
				 */
				navigationTargetsObtained: {
					parameters: {
						/**
						 * The main navigation object.
						 */
						mainNavigation: {
							type: "sap.ui.comp.navpopover.LinkData"
						},

						/**
						 * Array of available navigation target objects.
						 */
						actions: {
							type: "sap.ui.comp.navpopover.LinkData[]"
						},

						/**
						 * The navigation object for the own application. This navigation option is by default not visible on the popover.
						 */
						ownNavigation: {
							type: "sap.ui.comp.navpopover.LinkData"
						},

						/**
						 * Array containing contact data.
						 */
						popoverForms: {
							type: "sap.ui.layout.form.SimpleForm[]"
						},

						/**
						 * The semantic object for which the navigation targets have been retrieved.
						 */
						semanticObject: {
							type: "string"
						},

						/**
						 * Map containing the semantic attributes.
						 */
						semanticAttributes: {
							type: "object"
						},

						/**
						 * The ID of the NavigationPopoverHandler.
						 */
						originalId: {
							type: "string"
						},

						/**
						 * This callback function shows the actual navigation popover. If the <code>navigationTargetsObtained</code> has been
						 * registered, the <code>show</code> function has to be called manually in order to open the navigation popover. Signatures:
						 * <code>show()</code>
						 * <ul>
						 * <li><code>show(oMainNavigation, aAvailableActions, oAdditionalContent)</code> Parameters:
						 * <ul>
						 * <li>{sap.ui.comp.navpopover.LinkData | null | undefined} oMainNavigation The main navigation object. With
						 * <code>null</code> the main navigation object will be removed. With <code>undefined</code> the old object will remain.</li>
						 * <li>{sap.ui.comp.navpopover.LinkData[] | [] | undefined} aAvailableActions Array containing the cross application
						 * navigation links. With empty array all available links will be removed. With <code>undefined</code> the old links will
						 * remain.</li>
						 * <li>{sap.ui.core.Control | null | undefined} oAdditionalContent Control that will be displayed in extra content section on
						 * the popover. With <code>null</code> the main extra content object will be removed. With <code>undefined</code> the old
						 * object still remains.</li>
						 * </ul>
						 * </li>
						 * <li><code>show(sMainNavigationId, oMainNavigation, aAvailableActions, oAdditionalContent)</code> Parameters:
						 * <ul>
						 * <li>{string | undefined} sMainNavigationId The visible description for the main navigation link. With <code>''</code>,
						 * both the description and subtitle will be removed. With <code>undefined</code>, the description is calculated using the
						 * binding context of a given source object (for example <code>SmartLink</code> control).</li>
						 * <li>{sap.ui.comp.navpopover.LinkData | null | undefined} oMainNavigation The main navigation object. With
						 * <code>null</code> the main navigation object will be removed. With <code>undefined</code> the old object will remain.</li>
						 * <li>{sap.ui.comp.navpopover.LinkData[] | [] | undefined} aAvailableActions Array containing the cross application
						 * navigation links. With empty array all available links will be removed. With <code>undefined</code> the old links will
						 * remain.</li>
						 * <li>{sap.ui.core.Control | null | undefined} oAdditionalContent Control that will be displayed in extra content section on
						 * the popover. With <code>null</code> the main extra content object will be removed. With <code>undefined</code> the old
						 * object still remains.</li>
						 * </ul>
						 * </li>
						 * </ul>
						 */
						show: {
							type: "function"
						}
					}
				},

				/**
				 * This event is fired after a navigation link on the navigation popover has been clicked. This event is only fired, if the user
				 * left-clicks the link. Right-clicking the link and selecting 'Open in New Window' etc. in the context menu does not fire the event.
				 *
				 * @since 1.36.0
				 */
				innerNavigate: {
					parameters: {
						/**
						 * The UI text shown in the clicked link.
						 */
						text: {
							type: "string"
						},

						/**
						 * The navigation target of the clicked link.
						 */
						href: {
							type: "string"
						},

						/**
						 * The semantic object used to retrieve this target.
						 */
						semanticObject: {
							type: "string"
						},

						/**
						 * Map containing the semantic attributes used to retrieve this target.
						 */
						semanticAttributes: {
							type: "object"
						},

						/**
						 * The ID of the NavigationPopoverHandler.
						 */
						originalId: {
							type: "string"
						}
					}
				}
			}
		}
	});

	NavigationPopoverHandler.prototype.init = function() {
		this._oPopover = null;

		var oModel = new JSONModel({
			semanticObject: undefined,
			// Internal map containing the semantic attributes calculated from the binding that will be used
			// to retrieve the navigation targets.
			semanticAttributes: undefined,
			appStateKey: undefined,
			mainNavigationId: undefined,
			contact: {
				exists: false,
				bindingPath: undefined,
				expand: undefined,
				select: undefined
			},
			navigationTarget: {
				mainNavigation: undefined,
				enableAvailableActionsPersonalization: undefined,
				availableActionsPersonalizationText: undefined,
				extraContent: undefined
			},
			// Store internally the available links returned from FLP and modified by application
			availableActions: []
		});
		oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
		oModel.setSizeLimit(1000);
		this.setModel(oModel, "$sapuicompNavigationPopoverHandler");
	};

	NavigationPopoverHandler.prototype.applySettings = function(mSettings) {
		ManagedObject.prototype.applySettings.apply(this, arguments);
		// Initialize 'semanticAttributes' after all properties in constructor have been set
		this._setSemanticAttributes(this._calculateSemanticAttributes(null));
	};

	// ----------------------- Public Methods --------------------------

	/**
	 * Opens the <code>Popover</code> with target navigations in an asynchronous manner.
	 * <b>Note:</b>If no content is to show, the <code>Popover</code> will not open.
	 *
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution
	 * @public
	 */
	NavigationPopoverHandler.prototype.openPopover = function(oDomRef) {
		var that = this;
		return this._getPopover().then(function(oPopover) {

			// Popover without content should not be opened.
			if (!oPopover.hasContent()) {
				that._showErrorDialog(sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("POPOVER_DETAILS_NAV_NOT_POSSIBLE"), sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("POPOVER_MSG_NAV_NOT_POSSIBLE"), oPopover);
				// Destroy popover with StableID.
				that._destroyPopover();
				return;
			}

			// Popover with direct link should not be opened.
			var oLink = oPopover.getDirectLink();
			if (oLink) {
				that._fireInnerNavigate({
					text: oLink.getText(),
					href: oLink.getHref()
				});
				window.location.href = oLink.getHref();
				// Destroy popover with StableID.
				that._destroyPopover();
				return;
			}
			oPopover.show(oDomRef);
		});
	};

	/**
	 * Gets the current value assigned to the field with the NavigationPopoverHandler's semantic object name.
	 *
	 * @returns {object} The semantic object's value.
	 * @public
	 */
	NavigationPopoverHandler.prototype.getSemanticObjectValue = function() {
		var oSemanticAttributes = this._getSemanticAttributes();
		if (oSemanticAttributes) {
			return oSemanticAttributes[this.getSemanticObject()][this.getSemanticObject()];
		}
		return undefined;
	};

	/**
	 * Gets the stable ID, if <code>semanticObject</code> property and component are set.
	 *
	 * @returns {string | undefined} Stable ID
	 * @private
	 */
	NavigationPopoverHandler.prototype.getNavigationPopoverStableId = function() {
		var oAppComponent = this._getAppComponent();
		var sSemanticObjectDefault = this.getModel("$sapuicompNavigationPopoverHandler").getProperty("/semanticObject");
		if (!oAppComponent || !sSemanticObjectDefault) {
			return undefined;
		}
		var aSemanticObjects = [
			sSemanticObjectDefault
		].concat(this.getAdditionalSemanticObjects());
		Util.sortArrayAlphabetical(aSemanticObjects);
		var sSemanticObjects = aSemanticObjects.join("--");

		return oAppComponent.createId("sapuicompnavpopoverNavigationPopover---" + sSemanticObjects);
	};

	// ----------------------- Overwrite Methods --------------------------

	NavigationPopoverHandler.prototype.updateBindingContext = function() {
		Control.prototype.updateBindingContext.apply(this, arguments);

		// Update 'semanticAttributes' due to new 'semanticObject'
		this._setSemanticAttributes(this._calculateSemanticAttributes(null));

		this._destroyPopover();
	};

	NavigationPopoverHandler.prototype.setSemanticObject = function(sSemanticObject) {

		this._destroyPopover();

		this.setProperty("semanticObject", sSemanticObject);
		this.getModel("$sapuicompNavigationPopoverHandler").setProperty("/semanticObject", sSemanticObject);

		// Update 'semanticAttributes' due to new 'semanticObject'
		this._setSemanticAttributes(this._calculateSemanticAttributes(null));
		return this;
	};

	NavigationPopoverHandler.prototype._setSemanticAttributes = function(oSemanticAttributes) {
		this.getModel("$sapuicompNavigationPopoverHandler").setProperty("/semanticAttributes", oSemanticAttributes);
	};

	NavigationPopoverHandler.prototype._getSemanticAttributes = function() {
		return this.getModel("$sapuicompNavigationPopoverHandler").getProperty("/semanticAttributes");
	};

	NavigationPopoverHandler.prototype.setEnableAvailableActionsPersonalization = function(bEnableAvailableActionsPersonalization) {
		this.setProperty("enableAvailableActionsPersonalization", bEnableAvailableActionsPersonalization);
		this.getModel("$sapuicompNavigationPopoverHandler").setProperty("/navigationTarget/enableAvailableActionsPersonalization", bEnableAvailableActionsPersonalization);
		return this;
	};

	NavigationPopoverHandler.prototype.setFieldName = function(sFieldName) {
		this.setProperty("fieldName", sFieldName);

		// Update 'semanticAttributes' due to new 'fieldName'
		this._setSemanticAttributes(this._calculateSemanticAttributes(null));

		return this;
	};

	NavigationPopoverHandler.prototype.setControl = function(oControl) {
		this.setAssociation("control", oControl);

		this.setModel(oControl.getModel());

		// TODO: SmartTable -> ControlProvider for each ObjectIdentifier there is only one NavigationPopoverHandler which gets set a new 'control'
		this._destroyPopover();

		this._updateSemanticObjectController();

		// Update 'semanticAttributes' due to new 'control'
		this._setSemanticAttributes(this._calculateSemanticAttributes(null));
		return this;
	};

	NavigationPopoverHandler.prototype.setMapFieldToSemanticObject = function(bMapFieldToSemanticObject) {
		this.setProperty("mapFieldToSemanticObject", bMapFieldToSemanticObject);

		// Update 'semanticAttributes' due to new 'mapFieldToSemanticObject'
		this._setSemanticAttributes(this._calculateSemanticAttributes(null));
		return this;
	};

	NavigationPopoverHandler.prototype.setSemanticObjectController = function(oSemanticObjectController) {
		this._updateSemanticObjectController(oSemanticObjectController);

		// Update 'semanticAttributes' due to new 'semanticObjectController'
		this._setSemanticAttributes(this._calculateSemanticAttributes(null));
		return this;
	};

	NavigationPopoverHandler.prototype.exit = function() {
		this._destroyPopover();

		// Disconnect from SemanticObjectController
		if (this.getSemanticObjectController()) {
			this.getSemanticObjectController().unregisterControl(this);
		}

		// destroy model and its data
		if (this.getModel("$sapuicompNavigationPopoverHandler")) {
			this.getModel("$sapuicompNavigationPopoverHandler").destroy();
		}
	};

	// -------------------------- Private Methods ------------------------------------

	/**
	 * @private
	 */
	NavigationPopoverHandler.prototype._initModel = function() {
		var that = this;

		var oSemanticAttributes;
		var sSemanticObjectDefault = this.getSemanticObject();
		var aAdditionalSemanticObjects = this.getAdditionalSemanticObjects();

		// Priority rules: 1. own contact annotation path 2. contact annotation path of SemanticObjectController
		var sContactAssociationPath = this.getContactAnnotationPath();
		if (sContactAssociationPath === undefined && this.getSemanticObjectController() && this.getSemanticObjectController().getContactAnnotationPaths() && this.getSemanticObjectController().getContactAnnotationPaths()[this.getFieldName()] !== undefined) {
			sContactAssociationPath = this.getSemanticObjectController().getContactAnnotationPaths()[this.getFieldName()];
		}
		var oControl = sap.ui.getCore().byId(this.getControl());
		var sBindingPath = oControl && oControl.getBindingContext() ? oControl.getBindingContext().getPath() : null;
		var oODataModel = this.getModel();
		var oComponent = this._getComponent();

		var sId = oControl && oControl.getId();
		var sMainNavigationId, sSemanticObjectValue;
		var oContactForm;

		// 1. Read metadata in order to calculate the semanticAttributes
		return Util.retrieveSemanticObjectMapping(this.getFieldName(), oODataModel, sBindingPath).then(function(oSemanticObjects) {

			// Determine 'semanticAttributes' as it is the latest point in time before passing it to the applications
			that._setSemanticAttributes(that._calculateSemanticAttributes(oSemanticObjects));
			oSemanticAttributes = that._getSemanticAttributes();

			// 2. Fire 'beforePopoverOpens' event. Here 'semanticAttributes' can be changed and 'appStateKey' can be set by application.
			return that._fireBeforePopoverOpens(oSemanticAttributes, sSemanticObjectDefault, sId);
		}).then(function(oResultFromOpen) {

			oSemanticAttributes = oResultFromOpen.semanticAttributes;

			// Set the potentially modified semanticAttributes
			that._setSemanticAttributes(oSemanticAttributes);

			// Set depending on semanticAttributes 'sSemanticObjectValue'
			sSemanticObjectValue = that.getSemanticObjectValue();

			// Set depending on semanticAttributes 'sMainNavigationId'.
			// Note: if binding context does not contain attribute equals to semantic object (either because the mapping didn't taken place or
			// because no attribute equals to semantic object exists) we take the value of the field name. We do so in order to avoid standard text
			// 'Display Fact Sheet' and show instead of it the text of SmartLink which user can see.
			sMainNavigationId = (oControl && oControl._getTextOfDom && oControl._getTextOfDom()) || that.getSemanticObjectValue();

			that.getModel("$sapuicompNavigationPopoverHandler").setProperty("/appStateKey", oResultFromOpen.appStateKey);

			// 3. Create Form reading OData Metadata with BindingContext and get navigationTargets from UShell service
			return that._prepareFormsAndTargets(sSemanticObjectDefault, aAdditionalSemanticObjects, oResultFromOpen.appStateKey, oComponent, oSemanticAttributes, sMainNavigationId, oODataModel, sBindingPath, sContactAssociationPath, sSemanticObjectValue);
		}).then(function(aResultFormsAndTargets) {
			oContactForm = aResultFormsAndTargets[0];

			// 4. Fire 'navigationTargetsObtained' event. Here 'Form' and 'navigationTargets' can be changed by application.
			return that._fireNavigationTargetsObtained(sMainNavigationId, sSemanticObjectDefault, oSemanticAttributes, sId, oContactForm.forms, aResultFormsAndTargets[1]);
		}).then(function(oResultFromNavigationObtained) {

			var oModel = that.getModel("$sapuicompNavigationPopoverHandler");
			oModel.setProperty("/mainNavigationId", oResultFromNavigationObtained.mainNavigationId);
			oModel.setProperty("/navigationTarget/mainNavigation", oResultFromNavigationObtained.mainNavigation);
			oModel.setProperty("/navigationTarget/extraContent", oResultFromNavigationObtained.extraContent);
			oModel.setProperty("/contact/exists", !!oContactForm.forms.length);
			oModel.setProperty("/contact/bindingPath", oContactForm.bindingPath);
			oModel.setProperty("/contact/expand", oContactForm.expand);
			oModel.setProperty("/contact/select", oContactForm.select);
			oModel.setProperty("/availableActions", that._updateVisibilityOfAvailableActions(LinkData.convert2Json(oResultFromNavigationObtained.availableActions)));
			oModel.setProperty("/navigationTarget/enableAvailableActionsPersonalization", that._isAvailableActionsPersonalizationTextEnabled(oModel.getProperty("/availableActions")));
		});
	};

	/**
	 * @private
	 */
	NavigationPopoverHandler.prototype._initPopover = function() {
		var that = this;

		return this._initModel().then(function() {
			var oModel = that.getModel("$sapuicompNavigationPopoverHandler");

			var oPopover = that._createPopover();

			// JSONModel
			oPopover.setModel(oModel, "$sapuicompNavigationPopoverHandler");

			var oControl = sap.ui.getCore().byId(that.getControl());
			if (oControl) {
				oControl.addDependent(oPopover);
			}

			// Update the "Link Personalization" Text after "addDependent" is called and all changes are applied to NavigationContainer
			oPopover.getContent()[0]._updateAvailableActionsPersonalizationText();

			that._requestBindingContextForContact(oPopover, oModel.getProperty("/contact/exists"));

			return oPopover;
		});
	};

	/**
	 * @private
	 */
	NavigationPopoverHandler.prototype._initNavigationContainer = function() {
		var that = this;

		return this._initModel().then(function() {
			var oModel = that.getModel("$sapuicompNavigationPopoverHandler");

			var oNavigationContainer = that._createNavigationContainer();

			// JSONModel
			oNavigationContainer.setModel(oModel, "$sapuicompNavigationPopoverHandler");

			var oControl = sap.ui.getCore().byId(that.getControl());
			if (oControl) {
				oControl.addDependent(oNavigationContainer);
			}

			// Update the "Link Personalization" Text after "addDependent" is called and all changes are applied to NavigationContainer
			oNavigationContainer._updateAvailableActionsPersonalizationText();

			that._requestBindingContextForContact(oNavigationContainer, oModel.getProperty("/contact/exists"));

			return oNavigationContainer;
		});
	};

	NavigationPopoverHandler.prototype._requestBindingContextForContact = function(oNavigationControl, bIsContactExists) {
		// Read data only if needed
		if (!bIsContactExists) {
			return;
		}
		var oModel = this.getModel("$sapuicompNavigationPopoverHandler");
		var oControl = sap.ui.getCore().byId(this.getControl());
		var sBindingPath = oControl && oControl.getBindingContext() ? oControl.getBindingContext().getPath() : null;

		if (oModel.getProperty("/contact/bindingPath")) {
			oNavigationControl.bindContext({
				path: oModel.getProperty("/contact/bindingPath"),
				events: {
					change: function() {
						oNavigationControl.invalidate();
					}
				}
			});
		} else if (sBindingPath) {
			oNavigationControl.bindContext({
				path: sBindingPath,
				parameters: {
					expand: oModel.getProperty("/contact/expand"),
					select: oModel.getProperty("/contact/select")
				},
				events: {
					change: function() {
						oNavigationControl.invalidate();
					}
				}
			});
		}
	};

	/**
	 * The NavigationPopoverHandler is responsible for destroying of NavigationPopover instance. This is done whenever the NavigationPopover is
	 * closed.
	 *
	 * @private
	 */
	NavigationPopoverHandler.prototype._getPopover = function() {
		if (!this._oPopover) {
			return this._initPopover();
		} else {
			return Promise.resolve(this._oPopover);
		}
	};

	/**
	 * The NavigationPopoverHandler can not be responsible for destroying of NavigationContainer instance. This should be done by requester.
	 *
	 * @private
	 */
	NavigationPopoverHandler.prototype._getNavigationContainer = function() {
		return this._initNavigationContainer().then(function(oNavigationContainer) {
			return oNavigationContainer;
		});
	};

	/**
	 * @private
	 */
	NavigationPopoverHandler.prototype._destroyPopover = function() {
		if (this._oPopover) {
			this._oPopover.destroy();
			this._oPopover = null;
		}
	};

	/**
	 * Creates the <code>NavigationPopover</code>.
	 *
	 * @returns {sap.ui.comp.navpopover.NavigationPopover}
	 * @private
	 */
	NavigationPopoverHandler.prototype._createPopover = function() {
		if (this._oPopover) {
			return this._oPopover;
		}
		var oNavigationContainer = this._createNavigationContainer();

		oNavigationContainer.attachAvailableActionsPersonalizationPress(this._onAvailableActionsPersonalizationPress, this);

		// this._oTimestampStart = Date.now();
		var oInvisibleText = new sap.ui.core.InvisibleText({
			text: "{$sapuicompNavigationPopoverHandler>/mainNavigationId}"
		});
		this._oPopover = new NavigationPopover({
			customData: new sap.ui.core.CustomData({
				key: "useExternalContent"
			}),
			content: [
				oNavigationContainer, oInvisibleText
			],
			ariaLabelledBy: oInvisibleText,
			semanticObjectName: "{$sapuicompNavigationPopoverHandler>/semanticObject}", // DEPRECATED
			semanticAttributes: "{$sapuicompNavigationPopoverHandler>/semanticAttributes}", // DEPRECATED
			appStateKey: "{$sapuicompNavigationPopoverHandler>/appStateKey}", // DEPRECATED
			source: this.getControl(),
			// targetsObtained: jQuery.proxy(this._onTargetsObtained, this), // DEPRECATED
			afterClose: this._destroyPopover.bind(this)
		});

		return this._oPopover;
	};

	/**
	 * Creates the NavigationContainer. Note that registration for 'availableActionsPersonalizationPress' event should be done by the caller.
	 *
	 * @private
	 */
	NavigationPopoverHandler.prototype._createNavigationContainer = function() {

		if (!!sap.ui.getCore().byId(this.getNavigationPopoverStableId())) {
			jQuery.sap.log.error("Duplicate ID '" + this.getNavigationPopoverStableId() + "'. The instance of NavigationContainer should be destroyed first in order to avoid duplicate creation of NavigationContainer with stable ID.");
			throw "Duplicate ID";
		}

		var oModel = this.getModel("$sapuicompNavigationPopoverHandler");

		var oNavigationContainer = new NavigationContainer(this.getNavigationPopoverStableId(), {
			mainNavigationId: "{$sapuicompNavigationPopoverHandler>/mainNavigationId}",
			mainNavigation: oModel.getProperty("/navigationTarget/mainNavigation"),
			availableActions: {
				path: '$sapuicompNavigationPopoverHandler>/availableActions',
				templateShareable: false,
				template: new LinkData({
					key: "{$sapuicompNavigationPopoverHandler>key}",
					href: "{$sapuicompNavigationPopoverHandler>href}",
					text: "{$sapuicompNavigationPopoverHandler>text}",
					target: "{$sapuicompNavigationPopoverHandler>target}",
					description: "{$sapuicompNavigationPopoverHandler>description}",
					visible: "{$sapuicompNavigationPopoverHandler>visible}"
				})
			},
			extraContent: oModel.getProperty("/navigationTarget/extraContent") ? oModel.getProperty("/navigationTarget/extraContent").getId() : undefined,
			component: this._getComponent(),
			enableAvailableActionsPersonalization: "{$sapuicompNavigationPopoverHandler>/navigationTarget/enableAvailableActionsPersonalization}",
			availableActionsPersonalizationText: "{$sapuicompNavigationPopoverHandler>/navigationTarget/availableActionsPersonalizationText}",
			navigate: this._onNavigate.bind(this)
		});
		oNavigationContainer._getFlexHandler().setInitialSnapshot(FlexHandler.convertArrayToSnapshot("key", oModel.getProperty("/availableActions")));

		return oNavigationContainer;
	};

	/**
	 * @private
	 */
	NavigationPopoverHandler.prototype._prepareFormsAndTargets = function(sSemanticObjectDefault, aAdditionalSemanticObjects, sAppStateKey, oComponent, oSemanticAttributes, sMainNavigationId, oODataModel, sBindingPath, sContactAssociationPath, sSemanticObjectValue) {
		var oPromiseForm = Util.retrieveContactAnnotationData(oODataModel, sBindingPath, sContactAssociationPath).then(function(oContactAnnotationData) {
			var oParsedJson = Util.parseContactAnnotation(oContactAnnotationData);
			return {
				bindingPath: oContactAnnotationData.entitySet ? "/" + oContactAnnotationData.entitySet + "('" + sSemanticObjectValue + "')" : undefined,
				expand: oParsedJson.expand,
				select: oParsedJson.select,
				forms: Util.createContactDetailForms(oParsedJson.groups)
			};
		});
		var oPromiseNavigationTargets = Util.retrieveNavigationTargets(sSemanticObjectDefault, aAdditionalSemanticObjects, sAppStateKey, oComponent, oSemanticAttributes, sMainNavigationId);
		return Promise.all([
			oPromiseForm, oPromiseNavigationTargets
		]);
	};

	/**
	 * @private
	 */
	NavigationPopoverHandler.prototype._fireBeforePopoverOpens = function(oSemanticAttributes, sSemanticObjectDefault, sId) {
		var that = this;
		return new Promise(function(resolve) {
			var oResult = {
				semanticAttributes: oSemanticAttributes,
				appStateKey: undefined
			};
			if (!that.hasListeners("beforePopoverOpens")) {
				return resolve(oResult);
			}

			that.fireBeforePopoverOpens({
				originalId: sId,
				semanticObject: sSemanticObjectDefault,
				semanticAttributes: oSemanticAttributes ? oSemanticAttributes[sSemanticObjectDefault] : oSemanticAttributes,
				semanticAttributesOfSemanticObjects: oSemanticAttributes,
				setSemanticAttributes: function(aSemanticAttributes, sSemanticObject) {
					sSemanticObject = sSemanticObject || sSemanticObjectDefault;
					oResult.semanticAttributes = oResult.semanticAttributes || {};
					oResult.semanticAttributes[sSemanticObject] = aSemanticAttributes;
				},
				setAppStateKey: function(sAppStateKey) {
					oResult.appStateKey = sAppStateKey;
				},
				open: function() {
					return resolve(oResult);
				}
			});
		});
	};

	/**
	 * @private
	 */
	NavigationPopoverHandler.prototype._fireNavigationTargetsObtained = function(sMainNavigationId, sSemanticObjectDefault, oSemanticAttributes, sId, aForms, oNavigationTargets) {
		var that = this;

		return new Promise(function(resolve) {
			var oResult = {
				mainNavigationId: sMainNavigationId,
				mainNavigation: oNavigationTargets.mainNavigation,
				availableActions: oNavigationTargets.availableActions,
				ownNavigation: oNavigationTargets.ownNavigation,
				extraContent: aForms.length ? new VBox({
					items: aForms
				}) : undefined
			};
			if (!that.hasListeners("navigationTargetsObtained")) {
				return resolve(oResult);
			}

			that.fireNavigationTargetsObtained({
				mainNavigation: oNavigationTargets.mainNavigation,
				actions: oNavigationTargets.availableActions,
				ownNavigation: oNavigationTargets.ownNavigation,
				popoverForms: aForms,
				semanticObject: sSemanticObjectDefault,
				semanticAttributes: oSemanticAttributes ? oSemanticAttributes[sSemanticObjectDefault] : oSemanticAttributes,
				originalId: sId,
				show: function(sMainNavigationId, oMainNavigation, aAvailableActions, oAdditionalContent) {
					// Due to backward compatibility we have to support the use-case where only 3 parameters can be passed. The meaning for these
					// parameters is: [oMainNavigation, aAvailableActions, oAdditionalContent]
					if (arguments.length > 0 && !(typeof sMainNavigationId === "string" || oMainNavigation instanceof sap.ui.comp.navpopover.LinkData || jQuery.isArray(aAvailableActions)) && oAdditionalContent === undefined) {
						oAdditionalContent = aAvailableActions;
						aAvailableActions = oMainNavigation;
						oMainNavigation = sMainNavigationId;
						sMainNavigationId = undefined;
					}

					// Empty string '' is allowed
					if (sMainNavigationId !== undefined && sMainNavigationId !== null) {
						oResult.mainNavigationId = sMainNavigationId;
					}
					if (oMainNavigation !== undefined) {
						oResult.mainNavigation = oMainNavigation;
					}
					if (aAvailableActions) {
						aAvailableActions.forEach(function(oAvailableAction) {
							// If 'key' is not provided by application, this link should be always shown in NavigationPopover (due to personalization
							// reasons - 1. the link can not be stored as change and therefore this link will not appear in selection dialog. 2. The
							// user is not able to set this link as visible in case that there are a lot of links and only 'Define Links' is
							// provided).
							if (oAvailableAction.getKey() === undefined) {
								jQuery.sap.log.error("'key' attribute of 'availableAction' '" + oAvailableAction.getText() + "' is undefined. Links without 'key' can not be persisted.");
								jQuery.sap.log.warning("The 'visible' attribute of 'availableAction' '" + oAvailableAction.getText() + "' is set to 'true'");
								oAvailableAction.setVisible(true);
							}
						});
						oResult.availableActions = aAvailableActions;
					}

					if (oAdditionalContent) {
						oResult.extraContent = oAdditionalContent;
					}
					return resolve(oResult);
				}
			});
		});
	};

	/**
	 * Eventhandler for NavigationPopover's navigate event, exposes event
	 *
	 * @param {object} oEvent The event parameters
	 * @private
	 */
	NavigationPopoverHandler.prototype._onNavigate = function(oEvent) {
		var aParameters = oEvent.getParameters();

		this._fireInnerNavigate({
			text: aParameters.text,
			href: aParameters.href
		});
	};

	/**
	 * @private
	 */
	NavigationPopoverHandler.prototype._onAvailableActionsPersonalizationPress = function(oEvent) {
		var that = this;
		var oNavigationContainer = oEvent.getSource();
		this._oPopover.setModal(true);
		oNavigationContainer.openSelectionDialog(false, true, undefined, true, undefined).then(function() {
			// Note: in the meantime the _oPopover could be closed outside of NavigationPopoverHandler, so we have to check if the instance still exists
			if (that._oPopover) {
				that._oPopover.setModal(false);
			}
		});
	};

	/**
	 * @private
	 */

	NavigationPopoverHandler.prototype._fireInnerNavigate = function(aParameters) {
		var oControl = sap.ui.getCore().byId(this.getControl());
		var sSemanticObjectDefault = this.getSemanticObject();
		var oSemanticAttributes = this._getSemanticAttributes();

		this.fireInnerNavigate({
			text: aParameters.text,
			href: aParameters.href,
			originalId: oControl ? oControl.getId() : undefined,
			semanticObject: sSemanticObjectDefault,
			semanticAttributes: oSemanticAttributes ? oSemanticAttributes[sSemanticObjectDefault] : oSemanticAttributes
		});
	};

	/**
	 * Finds the parental component.
	 *
	 * @private
	 * @returns {sap.ui.core.Component | null} the found parental component or null
	 */
	NavigationPopoverHandler.prototype._getComponent = function() {
		var oControl = sap.ui.getCore().byId(this.getControl());
		if (!oControl) {
			return null;
		}
		var oParent = oControl.getParent();
		while (oParent) {
			if (oParent instanceof sap.ui.core.Component) {
				// special case for SmartTemplating to reach the real appComponent
				if (oParent && oParent.getAppComponent) {
					oParent = oParent.getAppComponent();
				}
				return oParent;
			}
			oParent = oParent.getParent();
		}
		return null;
	};

	NavigationPopoverHandler.prototype._getAppComponent = function() {
		return Factory.getService("FlexConnector").getAppComponentForControl(sap.ui.getCore().byId(this.getControl()));
	};

	/**
	 * Gets the current binding context and creates a copied map where all empty and unnecessary data is deleted from.
	 *
	 * @param {object || null} oSemanticObjects Format: {/semanticObjectName/: {{/localProperty/: string},...}}
	 * @returns{object}
	 * @private
	 */
	NavigationPopoverHandler.prototype._calculateSemanticAttributes = function(oSemanticObjects) {
		var oControl = sap.ui.getCore().byId(this.getControl());
		var oBindingContext = this.getBindingContext() || (oControl && oControl.getBindingContext());
		if (!oBindingContext) {
			return null;
		}

		var that = this;
		var sCurrentField = this.getFieldName();
		var oContext = oBindingContext.getObject(oBindingContext.getPath());
		var aSemanticObjects = [
			"", this.getSemanticObject()
		].concat(this.getAdditionalSemanticObjects());
		var bMapFieldToSemanticObject = this.getMapFieldToSemanticObject();
		if (this.getSemanticObjectController() && this.getSemanticObjectController().getMapFieldToSemanticObject() !== undefined) {
			bMapFieldToSemanticObject = this.getSemanticObjectController().getMapFieldToSemanticObject();
		}
		var oResults = {};

		aSemanticObjects.forEach(function(sSemanticObject) {
			oResults[sSemanticObject] = {};

			for ( var sAttributeName in oContext) {
				// Ignore metadata
				if (sAttributeName === "__metadata") {
					continue;
				}
				// Ignore empty values
				if (!oContext[sAttributeName]) {
					continue;
				}
				// Ignore plain objects (BCP 1770496639)
				if (jQuery.isPlainObject(oContext[sAttributeName])) {
					continue;
				}

				// Priority: 1. mapping from SemanticObjectMapping annotation 2. mapFieldToSemanticObject
				var sAttributeNameMapped;
				if (oSemanticObjects) {
					sAttributeNameMapped = (oSemanticObjects[sSemanticObject] && oSemanticObjects[sSemanticObject][sAttributeName]) ? oSemanticObjects[sSemanticObject][sAttributeName] : sAttributeName;
				} else {
					// Map attribute name by semantic object name
					sAttributeNameMapped = sAttributeName;
					if (bMapFieldToSemanticObject) {
						sAttributeNameMapped = that._mapFieldToSemanticObject(sAttributeName);
					}
				}

				// If more then one attribute field maps to the same semantic object we take the value of the current binding path.
				var oAttributeValue = oContext[sAttributeName];
				if (oResults[sSemanticObject][sAttributeNameMapped]) {
					if (oContext[sCurrentField]) {
						// Take over the value of current field in case of clash. If other field has clash we have no clue which value is the right one. So write error log.
						// Keep in mind: we do not explicitly check whether we are in the 'mapping' use-case when calling _mapFieldToSemanticObject because in not 'mapping'
						// use-case we do not come in the clash situation at all.
						if (sAttributeNameMapped === that._mapFieldToSemanticObject(that.getFieldName())) {
							oAttributeValue = oContext[sCurrentField];
						} else {
							jQuery.sap.log.error("During the mapping of the attribute " + sAttributeName + " a clash situation is occurred. This can lead to wrong navigation later on.");
						}
					}
				}

				// Copy the value replacing the attribute name by semantic object name
				oResults[sSemanticObject][sAttributeNameMapped] = oAttributeValue;
			}
		});

		return oResults;
	};

	/**
	 * Maps the given field name to the corresponding semantic object.
	 *
	 * @param {string} sFieldName The field name which should be mapped to a semantic object
	 * @returns {string} Corresponding semantic object, or the original field name if semantic object is not available.
	 * @private
	 */
	NavigationPopoverHandler.prototype._mapFieldToSemanticObject = function(sFieldName) {
		// For own field return the semantic object if exists
		// Note: if the field is assigned to another semantic object in 'SemanticObject' annotation than in the 'semanticObject' property then the
		// property 'semanticObject' is preferred.
		if (this.getFieldName() === sFieldName && this.getSemanticObject()) {
			return this.getSemanticObject();
		}
		var oSOController = this.getSemanticObjectController();
		if (!oSOController) {
			return sFieldName;
		}
		var oMap = oSOController.getFieldSemanticObjectMap();
		if (!oMap) {
			return sFieldName;
		}
		return oMap[sFieldName] || sFieldName;
	};

	/**
	 * @private
	 */
	NavigationPopoverHandler.prototype._updateSemanticObjectController = function(oControllerNew) {
		// In case that 'semantiObjectController' has not been set, check if parent has a SemanticObjectController and take it as
		// 'semanticObjectController' property. This is especially needed when SmartLink is manually defined as column in view.xml and
		// SemanticObjectController is defined at the SmartTable. It is also needed in case of SmartField embedded into SmartForm which provides
		// 'semanticObjectController' aggregation.
		var oControllerOld = this.getProperty("semanticObjectController");
		var oControl = sap.ui.getCore().byId(this.getControl());
		oControllerNew = oControllerNew || this.getSemanticObjectController() || this._getSemanticObjectControllerOfControl(oControl);

		if (oControllerNew && oControl && oControllerNew.isControlRegistered(oControl)) {
			oControllerNew.unregisterControl(this);
		}

		if (oControllerNew !== oControllerOld && oControllerOld) {
			oControllerOld.unregisterControl(this);
		}

		this.setProperty("semanticObjectController", oControllerNew);

		// Register NavigationPopoverHandler if the SmartLink was not registered. In case of ObjectIdentifier the 'control' property is set later on.
		// In this case the 'control' is of type ObjectIdentifier.
		if (oControllerNew && !oControllerNew.isControlRegistered(oControl)) {
			oControllerNew.registerControl(this);
		}
	};

	/**
	 * @private
	 */
	NavigationPopoverHandler.prototype._getSemanticObjectControllerOfControl = function(oControl) {
		if (!oControl) {
			return undefined;
		}
		var oSemanticObjectController;
		var oParent = oControl.getParent();
		while (oParent) {
			if (oParent.getSemanticObjectController) {
				oSemanticObjectController = oParent.getSemanticObjectController();
				if (oSemanticObjectController) {
					this.setSemanticObjectController(oSemanticObjectController);
					break;
				}
			}
			oParent = oParent.getParent();
		}
		return oSemanticObjectController;
	};

	/**
	 * @private
	 */
	NavigationPopoverHandler.prototype._updateVisibilityOfAvailableActions = function(aMAvailableActions) {

		if (!this._getEnabledAvailableActionsPersonalizationTotal()) {
			return aMAvailableActions;
		}

		// Update the 'visible' attribute only for storable (i.e. links with filled 'key') availableActions.
		var aMValidAvailableActions = Util.getStorableAvailableActions(aMAvailableActions);
		var bHasSuperiorAction = aMValidAvailableActions.some(function(oMAvailableAction) {
			return !!oMAvailableAction.isSuperiorAction;
		});
		aMValidAvailableActions.forEach(function(oMAvailableAction) {
			// Do not show links as 'Related Apps' in case of many links. Exception: the links without 'key' which should be shown always.
			if (aMAvailableActions.length > 10) {
				oMAvailableAction.visible = false;
			}
			// If at least one superiorAction exists, do not show other links
			if (bHasSuperiorAction) {
				oMAvailableAction.visible = false;
			}
			// Show always superiorAction
			if (oMAvailableAction.isSuperiorAction) {
				oMAvailableAction.visible = true;
			}
		});
		return aMAvailableActions;
	};

	/**
	 * @private
	 */
	NavigationPopoverHandler.prototype._isAvailableActionsPersonalizationTextEnabled = function(aMAvailableActions) {

		// Do not show any text if there are no available actions
		var aMValidAvailableActions = Util.getStorableAvailableActions(aMAvailableActions);
		if (aMValidAvailableActions.length === 0) {
			return false;
		}

		return this._getEnabledAvailableActionsPersonalizationTotal();
	};

	/**
	 * @private
	 */
	NavigationPopoverHandler.prototype._getEnabledAvailableActionsPersonalizationTotal = function() {
		// Default: text is enabled
		var bEnableAvailableActionsPersonalization = this.getEnableAvailableActionsPersonalization();
		// Application can overwrite to disable the text (i.e. 'Define Links' link will not be shown)
		if (this.getSemanticObjectController() && this.getSemanticObjectController().getEnableAvailableActionsPersonalization() && this.getSemanticObjectController().getEnableAvailableActionsPersonalization()[this.getFieldName()] !== undefined) {
			bEnableAvailableActionsPersonalization = this.getSemanticObjectController().getEnableAvailableActionsPersonalization()[this.getFieldName()];
		}
		return bEnableAvailableActionsPersonalization;
	};

	/**
	 * @private
	 */
	NavigationPopoverHandler.prototype._showErrorDialog = function(sText, sTitle, oControl) {
		MessageBox.show(sText, {
			icon: MessageBox.Icon.ERROR,
			title: sTitle,
			actions: [
				sap.m.MessageBox.Action.CLOSE
			],
			styleClass: (oControl.$() && oControl.$().closest(".sapUiSizeCompact").length) ? "sapUiSizeCompact navigationPopoverErrorDialog" : "navigationPopoverErrorDialog"
		});
	};

	return NavigationPopoverHandler;

}, /* bExport= */true);
