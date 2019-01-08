/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

/**
 * Provides utility functions for the personalization dialog
 *
 * @author SAP SE
 * @version 1.52.4
 * @private
 * @since 1.25.0
 * @alias sap.ui.comp.personalization.Util
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ui.define([
	'sap/ui/comp/library', './Factory', './LinkData', 'sap/m/Link', 'sap/m/Text', 'sap/ui/layout/form/SimpleFormLayout', 'sap/m/Label', 'sap/ui/core/TitleLevel', 'sap/ui/core/Title', 'sap/ui/layout/form/SimpleForm', 'sap/m/Image'
], function(CompLibrary, Factory, LinkData, Link, Text, SimpleFormLayout, Label, CoreTitleLevel, CoreTitle, SimpleForm, Image) {
	"use strict";

	var Util = {

		/**
		 * Returns available actions with key.
		 *
		 * @param {Object[]} aMAvailableActions Available actions
		 * @returns {Object[]} Available actions containing key
		 */
		getStorableAvailableActions: function(aMAvailableActions) {
			return aMAvailableActions.filter(function(oMAvailableAction) {
				return oMAvailableAction.key !== undefined;
			});
		},

		/**
		 * Sort the string array in alphabetical order.
		 *
		 * @param {String[]} aNames String array
		 */
		sortArrayAlphabetical: function(aNames) {
			var sLanguage;
			try {
				sLanguage = sap.ui.getCore().getConfiguration().getLocale().toString();
				if (typeof window.Intl !== 'undefined') {
					var oCollator = window.Intl.Collator(sLanguage, {
						numeric: true
					});
					aNames.sort(function(a, b) {
						return oCollator.compare(a, b);
					});
				} else {
					aNames.sort(function(a, b) {
						return a.localeCompare(b, sLanguage, {
							numeric: true
						});
					});
				}
			} catch (oException) {
				// this exception can happen if the configured language is not convertible to BCP47 -> getLocale will deliver an exception
			}
		},

		/**
		 * Reads navigation targets using CrossApplicationNavigation of the unified shell service.
		 *
		 * @param {string} sSemanticObjectDefault Default semantic object name
		 * @param {string[]} aAdditionalSemanticObjects String array of additional semantic objects
		 * @param {string} sAppStateKey Application state key
		 * @param {sap.ui.core.Component} oComponent Component
		 * @param {object} oSemanticAttributes Semantic attributes
		 * @param {string} sMainNavigationId Main navigation id
		 * @returns {Promise} A <code>Promise</code> for asynchronous execution
		 */
		retrieveNavigationTargets: function(sSemanticObjectDefault, aAdditionalSemanticObjects, sAppStateKey, oComponent, oSemanticAttributes, sMainNavigationId) {
			var oNavigationTargets = {
				mainNavigation: undefined,
				ownNavigation: undefined,
				availableActions: []
			};
			return new Promise(function(resolve) {
				var oXApplNavigation = Factory.getService("CrossApplicationNavigation");
				var oURLParsing = Factory.getService("URLParsing");
				if (!oXApplNavigation || !oURLParsing) {
					jQuery.sap.log.error("Service 'CrossApplicationNavigation' or 'URLParsing' could not be obtained");
					return resolve(oNavigationTargets);
				}
				var aSemanticObjects = [
					sSemanticObjectDefault
				].concat(aAdditionalSemanticObjects);
				var aParams = aSemanticObjects.map(function(sSemanticObject) {
					return [
						{
							semanticObject: sSemanticObject,
							params: oSemanticAttributes ? oSemanticAttributes[sSemanticObject] : undefined,
							appStateKey: sAppStateKey,
							ui5Component: oComponent,
							sortResultsBy: "text" // since 1.50
						}
					];
				});

				oXApplNavigation.getLinks(aParams).then(function(aLinks) {
					if (!aLinks || !aLinks.length) {
						return resolve(oNavigationTargets);
					}
					var sCurrentHash = oXApplNavigation.hrefForExternal();
					if (sCurrentHash && sCurrentHash.indexOf("?") !== -1) {
						// sCurrentHash can contain query string, cut it off!
						sCurrentHash = sCurrentHash.split("?")[0];
					}
					if (sCurrentHash) {
						// BCP 1770315035: we have to set the end-point '?' of action in order to avoid matching of "#SalesOrder-manage" in "#SalesOrder-manageFulfillment"
						sCurrentHash += "?";
					}

					aLinks[0][0].forEach(function(oLink) {
						var oShellHash = oURLParsing.parseShellHash(oLink.intent);
						var sKey = (oShellHash.semanticObject && oShellHash.action) ? oShellHash.semanticObject + "-" + oShellHash.action : undefined;
						var isSuperiorAction = (oLink.tags && oLink.tags.indexOf("superiorAction") > -1);

						if (oLink.intent.indexOf(sCurrentHash) === 0) {
							// Prevent current app from being listed
							// NOTE: If the navigation target exists in
							// multiple contexts (~XXXX in hash) they will all be skipped
							oNavigationTargets.ownNavigation = new LinkData({
								key: sKey,
								href: oLink.intent,
								text: oLink.text,
								visible: true,
								isSuperiorAction: isSuperiorAction
							});
							return;
						}
						// Check if a FactSheet exists for this SemanticObject (to skip the first one found)

						if (oShellHash.action && (oShellHash.action === 'displayFactSheet')) {
							// Prevent FactSheet from being listed in 'Related Apps' section. Requirement: Link with action 'displayFactSheet' should
							// be shown in the 'Main Link' Section
							oNavigationTargets.mainNavigation = new LinkData({
								key: sKey,
								href: oLink.intent,
								text: sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("POPOVER_FACTSHEET"),
								visible: true,
								isSuperiorAction: isSuperiorAction
							});
							return;
						}
						oNavigationTargets.availableActions.push(new LinkData({
							key: sKey,
							href: oLink.intent,
							text: oLink.text,
							visible: true,
							isSuperiorAction: isSuperiorAction
						}));
					});

					// Main navigation could not be resolved, so only set link text as MainNavigation
					if (!oNavigationTargets.mainNavigation && typeof sMainNavigationId === "string") {
						oNavigationTargets.mainNavigation = new LinkData({
							text: sMainNavigationId,
							visible: true
						});
					}

					var aAvailableIntents = [];
					for (var i = 1; i < aSemanticObjects.length; i++) {
						aAvailableIntents = aAvailableIntents.concat(aLinks[i][0]);
					}
					aAvailableIntents.forEach(function(oLink) {
						var oShellHash = oURLParsing.parseShellHash(oLink.intent);
						oNavigationTargets.availableActions.push(new LinkData({
							key: (oShellHash.semanticObject && oShellHash.action) ? oShellHash.semanticObject + "-" + oShellHash.action : undefined,
							href: oLink.intent,
							text: oLink.text,
							visible: true,
							isSuperiorAction: (oLink.tags && oLink.tags.indexOf("superiorAction") > -1)
						}));
					});

					return resolve(oNavigationTargets);
				}, function() {
					jQuery.sap.log.error("'retrieveNavigationTargets' failed");
					return resolve(oNavigationTargets);
				});
			});
		},

		/**
		 * Retrieves SemanticObjectMapping annotation.
		 *
		 * @param {string} sPropertyName Name of property
		 * @param {sap.ui.model.odata.ODataModel} oODataModel OData model
		 * @param {string} sBindingPath Qualified name with namespace of current EntityType
		 * @returns {object|null} SemanticObjectMapping  annotation
		 * @private
		 */
		retrieveSemanticObjectMapping: function(sPropertyName, oODataModel, sBindingPath) {
			if (!sPropertyName) {
				return Promise.resolve(null);
			}
			// ODataModel returns MetaModel, JSONModel returns undefined
			if (!oODataModel || !oODataModel.getMetaModel()) {
				return Promise.resolve(null);
			}
			var that = this;
			var oMetaModel = oODataModel.getMetaModel();
			return new Promise(function(resolve) {
				oMetaModel.loaded().then(function() {
					var sOwnEntityType = that._getEntityTypeNameOfBindingContext(sBindingPath, oMetaModel);
					var oEntityType = oMetaModel.getODataEntityType(sOwnEntityType);
					if (!oEntityType || !oEntityType.property) {
						return resolve(null);
					}
					var aProperties = oEntityType.property.filter(function(oProperty) {
						return oProperty.name === sPropertyName;
					});
					if (aProperties.length !== 1) {
						return resolve(null);
					}
					if (!aProperties[0]["com.sap.vocabularies.Common.v1.SemanticObjectMapping"]) {
						return resolve(null);
					}
					var oSemanticObjectQualifiers = that._getSemanticObjectMappingsOfProperty(aProperties[0], that._getSemanticObjectsOfProperty(aProperties[0]));
					var oSemanticObjects = {};
					for ( var sQualifier in oSemanticObjectQualifiers) {
						oSemanticObjects[oSemanticObjectQualifiers[sQualifier].name] = oSemanticObjectQualifiers[sQualifier].mapping;
					}

					return resolve(oSemanticObjects);
				});
			});
		},

		_getSemanticObjectsOfProperty: function(oProperty) {
			var oSemanticObjects = {};
			for ( var sAttr in oProperty) {
				var sAnnotationName = sAttr.split("#")[0];
				var sQualifierName = sAttr.split("#")[1] || ""; // as of specification the qualifier MUST have at least one character
				if (jQuery.sap.startsWith(sAnnotationName, "com.sap.vocabularies.Common.v1.SemanticObject") && jQuery.sap.endsWith(sAnnotationName, "com.sap.vocabularies.Common.v1.SemanticObject")) {
					oSemanticObjects[sQualifierName] = {
						name: oProperty[sAttr]["String"],
						mapping: undefined
					};
				}
			}
			return oSemanticObjects;
		},

		_getSemanticObjectMappingsOfProperty: function(oProperty, oSemanticObjects) {
			var fGetMapping = function(oSemanticObjectMappingAnnotation) {
				var oMapping = {};
				if (jQuery.isArray(oSemanticObjectMappingAnnotation)) {
					oSemanticObjectMappingAnnotation.forEach(function(oPair) {
						oMapping[oPair.LocalProperty.PropertyPath] = oPair.SemanticObjectProperty.String;
					});
				}
				return oMapping;
			};
			for ( var sAttr in oProperty) {
				var sAnnotationName = sAttr.split("#")[0];
				var sQualifierName = sAttr.split("#")[1] || ""; // as of specification the qualifier MUST have at least one character
				if (jQuery.sap.startsWith(sAnnotationName, "com.sap.vocabularies.Common.v1.SemanticObjectMapping") && jQuery.sap.endsWith(sAnnotationName, "com.sap.vocabularies.Common.v1.SemanticObjectMapping")) {
					if (oSemanticObjects[sQualifierName]) {
						oSemanticObjects[sQualifierName].mapping = fGetMapping(oProperty[sAttr]);
					}
				}
			}
			return oSemanticObjects;
		},

		/**
		 * Retrieves the entity type.
		 *
		 * @param {string} sBindingPath Binding path
		 * @param {sap.ui.model.odata.ODataMetaModel} oMetaModel OData MetaModel
		 * @returns {string || null} Entity type
		 * @private
		 */
		_getEntityTypeNameOfBindingContext: function(sBindingPath, oMetaModel) {
			if (!sBindingPath || !oMetaModel) {
				return null;
			}
			var oMetaContext;
			try {
				oMetaContext = oMetaModel.getMetaContext(sBindingPath);
			} catch (oError) {
				jQuery.sap.log.error("sap.ui.comp.navpopover.Util: binding path '" + sBindingPath + "' is not valid. Error has been catched: " + oError);
			}
			if (!oMetaContext) {
				return null;
			}
			var oObj = oMetaModel.getObject(oMetaContext.getPath());
			return oObj.namespace ? oObj.namespace + "." + oObj.name : oObj.name;
		},

		/**
		 * @param {sap.ui.model.odata.ODataModel} oODataModel
		 * @param {string} sBindingPath
		 * @param {string || ""} sCommunicationContactAnnotationPath NavigationProperty or foreign simple EntitySet with communication contact
		 *        annotation
		 * @returns {object}
		 * @private
		 */
		retrieveContactAnnotationData: function(oODataModel, sBindingPath, sCommunicationContactAnnotationPath) {
			var that = this;
			return new Promise(function(resolve) {
				// ODataModel returns MetaModel, JSONModel returns undefined
				if (!oODataModel || !oODataModel.getMetaModel() || sCommunicationContactAnnotationPath === undefined) {
					return resolve({
						entitySet: undefined,
						path: undefined,
						contactAnnotation: undefined
					});
				}
				var oMetaModel = oODataModel.getMetaModel();
				oMetaModel.loaded().then(function() {
					var sOwnEntityType = that._getEntityTypeNameOfBindingContext(sBindingPath, oMetaModel);
					var oEntityType = oMetaModel.getODataEntityType(sOwnEntityType);
					if (!oEntityType) {
						return resolve({
							entitySet: undefined,
							path: undefined,
							contactAnnotation: undefined
						});
					}

					// Check if 'sCommunicationContactAnnotationPath' is a navigationProperty or an entitySet
					var oEntitySet = oMetaModel.getODataEntitySet(sCommunicationContactAnnotationPath);
					if (oEntitySet) {
						// 'sCommunicationContactAnnotationPath' is an entitySet
						oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
						return resolve({
							entitySet: sCommunicationContactAnnotationPath,
							path: "",
							contactAnnotation: oEntityType["com.sap.vocabularies.Communication.v1.Contact"]
						});
					}

					// 'sCommunicationContactAnnotationPath' is a navigationProperty
					var aAssociationPaths = [];
					sCommunicationContactAnnotationPath.split("/").some(function(sNavigationProperty) {
						var oAssociation = oMetaModel.getODataAssociationEnd(oEntityType, sNavigationProperty);
						if (!oAssociation) {
							return false;
						}
						aAssociationPaths.push(sNavigationProperty);
						oEntityType = oMetaModel.getODataEntityType(oAssociation.type);
					});

					return resolve({
						entitySet: undefined,
						path: oEntityType["com.sap.vocabularies.Communication.v1.Contact"] ? aAssociationPaths.join("/") : undefined,
						contactAnnotation: oEntityType["com.sap.vocabularies.Communication.v1.Contact"]
					});
				});
			});
		},

		/**
		 * <code>
		 * 	group: {heading: "", elements: []}
		 *  element: {label: "", value: "", url: "", target: "", emailSubject: "", control: sap.ui.core.Control}
		 * </code>
		 */
		parseContactAnnotation: function(oContactAnnotationData) {
			var oContactAnnotation = oContactAnnotationData.contactAnnotation;
			if (!oContactAnnotation || jQuery.isEmptyObject(oContactAnnotation)) {
				return {
					groups: [],
					expand: "",
					select: ""
				};
			}

			var sPath = oContactAnnotationData.path ? oContactAnnotationData.path + "/" : "";
			var oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp");
			var aExpand = [
				oContactAnnotationData.path
			];
			var aSelects = [];
			var aGroups = [];

			// Contact Details -------------------------------------------------------
			var oGroup = {
				heading: oResourceBundle.getText("POPOVER_CONTACT_SECTION_TITLE"),
				elements: []
			};
			if (oContactAnnotation.photo) {
				aSelects.push(sPath + oContactAnnotation.photo.Path);
				var oControl = new Image({
					// width: "3rem",
					src: {
						path: sPath + oContactAnnotation.photo.Path
					},
					visible: {
						path: sPath + oContactAnnotation.photo.Path,
						formatter: function(oValue) {
							return !!oValue;
						}
					},
					decorative: false
				});
				oControl.addStyleClass("sapUiIcon");
				oControl.addStyleClass("navigationPopoverThumbnail");
				oGroup.elements.push({
					label: "",
					control: oControl
				});
			}
			if (oContactAnnotation.fn) {
				aSelects.push(sPath + oContactAnnotation.fn.Path);
				oGroup.elements.push({
					label: oResourceBundle.getText("POPOVER_CONTACT_SECTION_NAME"),
					control: new Text({
						text: {
							path: sPath + oContactAnnotation.fn.Path
						},
						visible: {
							path: sPath + oContactAnnotation.fn.Path,
							formatter: function(oValue) {
								return !!oValue;
							}
						}
					})
				});
			}
			if (oContactAnnotation.role) {
				aSelects.push(sPath + oContactAnnotation.role.Path);
				oGroup.elements.push({
					label: oResourceBundle.getText("POPOVER_CONTACT_SECTION_ROLE"),
					control: new Text({
						text: {
							path: sPath + oContactAnnotation.role.Path
						},
						visible: {
							path: sPath + oContactAnnotation.role.Path,
							formatter: function(oValue) {
								return !!oValue;
							}
						}
					})
				});
			}
			if (oContactAnnotation.title) {
				aSelects.push(sPath + oContactAnnotation.title.Path);
				oGroup.elements.push({
					label: oResourceBundle.getText("POPOVER_CONTACT_SECTION_JOBTITLE"),
					control: new Text({
						text: {
							path: sPath + oContactAnnotation.title.Path
						},
						visible: {
							path: sPath + oContactAnnotation.title.Path,
							formatter: function(oValue) {
								return !!oValue;
							}
						}
					})
				});
			}
			if (oContactAnnotation.org) {
				aSelects.push(sPath + oContactAnnotation.org.Path);
				oGroup.elements.push({
					label: oResourceBundle.getText("POPOVER_CONTACT_SECTION_DEPARTMENT"),
					control: new Text({
						text: {
							path: sPath + oContactAnnotation.org.Path
						},
						visible: {
							path: sPath + oContactAnnotation.org.Path,
							formatter: function(oValue) {
								return !!oValue;
							}
						}
					})
				});
			}
			if (oContactAnnotation.email) {
				var fnAddEmailsOrdered = function(aEmails) {
					if (!aEmails.length) {
						return;
					}
					// First email/s is/are 'work' or if only 'pref' is annotated
					aEmails.filter(function(oEmail) {
						return oEmail.type && !oEmail.deleted && (oEmail.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.ContactInformationType/work") > -1 || oEmail.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.ContactInformationType/preferred") > -1);
					}).forEach(function(oEmail) {
						oEmail.deleted = true;
						aSelects.push(sPath + oEmail.address.Path);
						oGroup.elements.push({
							label: oResourceBundle.getText("POPOVER_CONTACT_SECTION_EMAIL"),
							control: new Link({
								href: {
									path: sPath + oEmail.address.Path,
									formatter: function(oValue) {
										if (!oValue) {
											return oValue;
										}
										return "mailto:" + oValue;// + (oGroupElement.emailSubject ? '?subject=' + oGroupElement.emailSubject : '');
									}
								},
								text: {
									path: sPath + oEmail.address.Path
								},
								visible: {
									path: sPath + oEmail.address.Path,
									formatter: function(oValue) {
										return !!oValue;
									}
								}
							})
						});
					});
				};
				// First preferred email(s)
				fnAddEmailsOrdered(oContactAnnotation.email.filter(function(oEmail) {
					return oEmail.type && oEmail.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.ContactInformationType/preferred") > -1;
				}));
				// Then non preferred email(s)
				fnAddEmailsOrdered(oContactAnnotation.email.filter(function(oEmail) {
					return oEmail.type && oEmail.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.ContactInformationType/preferred") < 0;
				}));
			}

			// Supported types: "com.sap.vocabularies.Communication.v1.PhoneType/fax", "com.sap.vocabularies.Communication.v1.PhoneType/work" or
			// "com.sap.vocabularies.Communication.v1.PhoneType/cell".
			// Preferred type "com.sap.vocabularies.Communication.v1.PhoneType/preferred" should be shown on top.
			if (oContactAnnotation.tel) {
				var fnAddTel = function(oTel, sLabel) {
					oTel.deleted = true;
					aSelects.push(sPath + oTel.uri.Path);
					oGroup.elements.push({
						label: sLabel,
						control: new Link({
							href: {
								path: sPath + oTel.uri.Path,
								formatter: function(oValue) {
									if (!oValue) {
										return oValue;
									}
									return "tel:" + oValue;
								}
							},
							text: {
								path: sPath + oTel.uri.Path
							},
							visible: {
								path: sPath + oTel.uri.Path,
								formatter: function(oValue) {
									return !!oValue;
								}
							}
						})
					});
				};
				var fnAddTelsOrdered = function(aTelephones) {
					if (!aTelephones.length) {
						return;
					}
					// First number(s) is(are) 'work'
					aTelephones.filter(function(oTel) {
						return oTel.type && !oTel.deleted && oTel.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.PhoneType/work") > -1;
					}).forEach(function(oTel) {
						fnAddTel(oTel, oResourceBundle.getText("POPOVER_CONTACT_SECTION_PHONE"));
					});
					// Second number(s) is(are) 'mobile'
					aTelephones.filter(function(oTel) {
						return oTel.type && !oTel.deleted && oTel.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.PhoneType/cell") > -1;
					}).forEach(function(oTel) {
						fnAddTel(oTel, oResourceBundle.getText("POPOVER_CONTACT_SECTION_MOBILE"));
					});
					// Third number(s) is(are) 'fax'
					aTelephones.filter(function(oTel) {
						return oTel.type && !oTel.deleted && oTel.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.PhoneType/fax") > -1;
					}).forEach(function(oTel) {
						fnAddTel(oTel, oResourceBundle.getText("POPOVER_CONTACT_SECTION_FAX"));
					});
					// In case that only 'pref' is annotated
					aTelephones.filter(function(oTel) {
						return oTel.type && !oTel.deleted && oTel.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.PhoneType/preferred") > -1;
					}).forEach(function(oTel) {
						fnAddTel(oTel, oResourceBundle.getText("POPOVER_CONTACT_SECTION_PHONE"));
					});
				};

				// First preferred number(s)
				fnAddTelsOrdered(oContactAnnotation.tel.filter(function(oTel) {
					return oTel.type && oTel.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.PhoneType/preferred") > -1;
				}));
				// Then non preferred number(s)
				fnAddTelsOrdered(oContactAnnotation.tel.filter(function(oTel) {
					return oTel.type && oTel.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.PhoneType/preferred") < 0;
				}));
			}

			if (oContactAnnotation.adr) {
				var fnAddAdrOrdered = function(aAddresses) {
					if (!aAddresses.length) {
						return;
					}
					var aAddressesCopy = jQuery.extend(true, [], aAddresses);

					// First address/es is/are 'work' or if only 'pref' is annotated
					aAddressesCopy.filter(function(oAdr) {
						return oAdr.type && !oAdr.deleted && (oAdr.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.ContactInformationType/work") > -1 || oAdr.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.ContactInformationType/preferred") > -1);
					}).forEach(function(oAdr) {
						oAdr.deleted = true;
						var aParts = [];
						// Street with House number
						if (oAdr.street) {
							aSelects.push(sPath + oAdr.street.Path);
						}
						aParts.push(oAdr.street ? {
							path: sPath + oAdr.street.Path
						} : {
							path: "$notExisting"
						});
						// PostalCode
						if (oAdr.code) {
							aSelects.push(sPath + oAdr.code.Path);
						}
						aParts.push(oAdr.code ? {
							path: sPath + oAdr.code.Path
						} : {
							path: "$notExisting"
						});
						// City
						if (oAdr.locality) {
							aSelects.push(sPath + oAdr.locality.Path);
						}
						aParts.push(oAdr.locality ? {
							path: sPath + oAdr.locality.Path
						} : {
							path: "$notExisting"
						});
						// State
						if (oAdr.region) {
							aSelects.push(sPath + oAdr.region.Path);
						}
						aParts.push(oAdr.region ? {
							path: sPath + oAdr.region.Path
						} : {
							path: "$notExisting"
						});
						// Country
						if (oAdr.country) {
							aSelects.push(sPath + oAdr.country.Path);
						}
						aParts.push(oAdr.country ? {
							path: sPath + oAdr.country.Path
						} : {
							path: "$notExisting"
						});
						if (aParts.length) {
							oGroup.elements.push({
								label: oResourceBundle.getText("POPOVER_CONTACT_SECTION_ADR"),
								control: new Text({
									text: {
										parts: aParts,
										formatter: function(sStreet, sCode, sLocality, sRegion, sCountry) {
											var aValidComponents = [];
											if (sStreet) {
												aValidComponents.push(sStreet);
											}
											if (sCode) {
												aValidComponents.push(sCode);
											}
											if (sLocality) {
												aValidComponents.push(sLocality);
											}
											if (sRegion) {
												aValidComponents.push(sRegion);
											}
											if (sCountry) {
												aValidComponents.push(sCountry);
											}
											return aValidComponents.join(', ');
										}
									},
									visible: {
										parts: aParts,
										formatter: function(sStreet, sCode, sLocality, sRegion, sCountry) {
											return !!(sStreet || sCode || sLocality || sRegion || sCountry);
										}
									}
								})
							});
						}
					});
				};
				// First preferred address(es)
				var aAddresses = oContactAnnotation.adr.filter(function(oAdr) {
					return oAdr.type && oAdr.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.ContactInformationType/preferred") > -1;
				});
				fnAddAdrOrdered(aAddresses);
				// Then non preferred address(es)
				aAddresses = oContactAnnotation.adr.filter(function(oAdr) {
					return oAdr.type && oAdr.type.EnumMember.indexOf("com.sap.vocabularies.Communication.v1.ContactInformationType/preferred") < 0;
				});
				fnAddAdrOrdered(aAddresses);
			}

			if (oGroup.elements.length) {
				aGroups.push(oGroup);
			}

			return {
				groups: aGroups,
				expand: aExpand.join(","),
				select: aSelects.join(",")
			};
		},

		/**
		 *
		 */
		createContactDetailForms: function(aGroups) {
			if (!aGroups.length) {
				return [];
			}

			var aForms = [];
			aGroups.forEach(function(oGroup) {
				if (!oGroup.elements.length) {
					return;
				}
				var oGroupForm = new SimpleForm({
					maxContainerCols: 1,
					editable: false,
					layout: SimpleFormLayout.ResponsiveGridLayout
				});

				oGroup.elements.forEach(function(oElement) {
					if (!oElement.control) {
						return;
					}

					if (oElement.label) {
						var oLabel = new Label({
							text: oElement.label,
							labelFor: oElement.control.getId()
						});
						oGroupForm.addContent(oLabel);
					}
					oGroupForm.addContent(oElement.control);
				});

				if (oGroupForm.getContent().length && oGroup.heading) {
					oGroupForm.insertContent(new CoreTitle({
						text: oGroup.heading,
						level: CoreTitleLevel.H2
					}), 0);
				}
				aForms.push(oGroupForm);
			});
			return aForms;
		}
	};
	return Util;
}, /* bExport= */true);
