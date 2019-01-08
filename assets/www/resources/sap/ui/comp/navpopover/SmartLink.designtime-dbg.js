/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides the Design Time Metadata for the sap.ui.comp.navpopover.SmartLink control.
sap.ui.define([
	'./RTAHandler', 'sap/m/ObjectIdentifier'
], function(RTAHandler, ObjectIdentifier) {
	"use strict";
	(function() {
		ObjectIdentifier.getMetadata().loadDesignTime().then(function(oDesignTime) {
			if (oDesignTime.registerSettingsHandler) {
				oDesignTime.registerSettingsHandler({
					getStableElements: function(oObjectIdentifier) {
						var oNavigationPopoverHandler;
						oObjectIdentifier.fireEvent("ObjectIdentifier.designtime", {
							caller: "ObjectIdentifier.designtime",
							registerNavigationPopoverHandler: function(oNavigationPopoverHandler_) {
								oNavigationPopoverHandler = oNavigationPopoverHandler_;
							}
						});
						return RTAHandler.getStableElements(oNavigationPopoverHandler);
					},
					isSettingsAvailable: function() {
						return RTAHandler.isSettingsAvailable();
					},
					execute: function(oObjectIdentifier, fGetUnsavedChanges) {
						var oNavigationPopoverHandler;
						oObjectIdentifier.fireEvent("ObjectIdentifier.designtime", {
							caller: "ObjectIdentifier.designtime",
							registerNavigationPopoverHandler: function(oNavigationPopoverHandler_) {
								oNavigationPopoverHandler = oNavigationPopoverHandler_;
							}
						});
						return RTAHandler.execute(oNavigationPopoverHandler, fGetUnsavedChanges);
					}
				});
			}
		});
	})();
	return {
		getStableElements: function(oSmartLink) {
			return RTAHandler.getStableElements(oSmartLink.getNavigationPopoverHandler());
		},
		actions: {
			settings: function() {
				if (!RTAHandler.isSettingsAvailable()) {
					jQuery.sap.log.error("sap.ui.comp.navpopover.SmartLink.designtime: 'settings' action is not available");
					return;
				}
				return {
					handler: function(oSmartLink, mPropertyBag) {
						return RTAHandler.execute(oSmartLink.getNavigationPopoverHandler(), mPropertyBag.getUnsavedChanges, mPropertyBag.styleClass);
					}
				};
			}
		},
		annotations: {
			/**
			 * Maps properties of the annotated <code>EntityType</code> or sibling properties of the annotated property to properties of the
			 * Semantic Object. The <code>SmartLink</code> control can be created from the XML view or from the OData metadata. <i>XML Example of
			 * OData V4 with SemanticObjectMapping on Product/Name</i>
			 *
			 * <pre>
			 *  &lt;Annotations Target=&quot;ProductCollection.Product/Name&quot; xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot;&gt;
			 * 		&lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.SemanticObject&quot; String=&quot;SemanticObjectName&quot; /&gt;
			 * 		&lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.SemanticObjectMapping&quot;&gt;
			 * 			&lt;Collection&gt;
			 * 				&lt;Record&gt;
			 * 					&lt;PropertyValue Property=&quot;LocalProperty&quot; PropertyPath=&quot;SupplierId&quot; /&gt;
			 * 					&lt;PropertyValue Property=&quot;SemanticObjectProperty&quot; String=&quot;SupplierIdOfSemanticObjectName&quot; /&gt;
			 * 				&lt;/Record&gt;
			 * 			&lt;/Collection&gt;
			 * 		&lt;/Annotation&gt;
			 * 	&lt;/Annotations&gt;
			 * </pre>
			 */
			semanticObjectMapping: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "SemanticObjectMapping",
				target: [
					"Property"
				],
				defaultValue: null,
				appliesTo: [
					"text"
				],
				group: [
					"Behavior"
				],
				since: "1.48.0"
			},

			/**
			 * Renders the contact information inside the <code>NavigationPopover</code> control. The Contact annotation contains various
			 * <code>ContactType</code> which can be used for providing additional information for distinguishing between the contact details. List
			 * of enumeration types supported is listed below:
			 * <ul>
			 * <li><code>com.sap.vocabularies.Communication.v1.PhoneType/fax</code>: This enumeration type can be used for defining a fax number.</li>
			 * <li><code>com.sap.vocabularies.Communication.v1.PhoneType/work</code>: This enumeration type can be used for defining a work phone
			 * number.</li>
			 * <li><code>com.sap.vocabularies.Communication.v1.PhoneType/cell</code>: This enumeration type can be used for defining a mobile
			 * number.</li>
			 * <li><code>com.sap.vocabularies.Communication.v1.ContactInformationType/work"</code>: This enumeration type can be used for defining
			 * a work email address.</li>
			 * </ul>
			 * <i>XML Example of OData V4 with Contact Annotation</i>
			 *
			 * <pre>
			 *    &lt;Annotations Target=&quot;EntityTypeName.Supplier&quot;
			 *      xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot;&gt;
			 *       &lt;Annotation Term=&quot;com.sap.vocabularies.Communication.v1.Contact&quot;&gt;
			 *         &lt;Record&gt;
			 *           &lt;PropertyValue Property=&quot;fn&quot; Path=&quot;FormattedName&quot; /&gt;
			 *           &lt;PropertyValue Property=&quot;title&quot; Path=&quot;Title&quot; /&gt;
			 *           &lt;PropertyValue Property=&quot;org&quot; Path=&quot;CompanyName&quot; /&gt;
			 *           &lt;PropertyValue Property=&quot;role&quot; Path=&quot;OrganizationRole&quot; /&gt;
			 *           &lt;PropertyValue Property=&quot;photo&quot; Path=&quot;Photo&quot; /&gt;
			 *           &lt;PropertyValue Property=&quot;tel&quot;&gt;
			 *             &lt;Collection&gt;
			 *               &lt;Record&gt;
			 *                 &lt;PropertyValue Property=&quot;type&quot;
			 *                   EnumMember=&quot;com.sap.vocabularies.Communication.v1.PhoneType/fax&quot; /&gt;
			 *                 &lt;PropertyValue Property=&quot;uri&quot; Path=&quot;FaxNumber&quot; /&gt;
			 *               &lt;/Record&gt;
			 *               &lt;Record&gt;
			 *                 &lt;PropertyValue Property=&quot;type&quot;
			 *                   EnumMember=&quot;com.sap.vocabularies.Communication.v1.PhoneType/work /&gt;
			 *                 &lt;PropertyValue Property=&quot;uri&quot; Path=&quot;PhoneNumber&quot; /&gt;
			 *               &lt;/Record&gt;
			 *               &lt;Record&gt;
			 *                 &lt;PropertyValue Property=&quot;type&quot;
			 *                   EnumMember=&quot;com.sap.vocabularies.Communication.v1.PhoneType/cell&quot; /&gt;
			 *                 &lt;PropertyValue Property=&quot;uri&quot; Path=&quot;MobileNumber&quot; /&gt;
			 *               &lt;/Record&gt;
			 *             &lt;/Collection&gt;
			 *           &lt;/PropertyValue&gt;
			 *           &lt;PropertyValue Property=&quot;email&quot;&gt;
			 *             &lt;Collection&gt;
			 *               &lt;Record&gt;
			 *                 &lt;PropertyValue Property=&quot;type&quot;
			 *                   EnumMember=&quot;com.sap.vocabularies.Communication.v1.ContactInformationType/work&quot; /&gt;
			 *                 &lt;PropertyValue Property=&quot;address&quot; Path=&quot;EmailAddress&quot; /&gt;
			 *               &lt;/Record&gt;
			 *             &lt;/Collection&gt;
			 *           &lt;/PropertyValue&gt;
			 *         &lt;/Record&gt;
			 *      &lt;/Annotation&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			contact: {
				namespace: "com.sap.vocabularies.Communication.v1",
				annotation: "Contact",
				target: [
					"EntityType"
				],
				defaultValue: null,
				appliesTo: [
					"text", "label", "value"
				],
				group: [
					"Behavior"
				],
				since: "1.40.1"
			}
		},

		properties: {
			semanticObject: {
				ignore: true
			},
			additionalSemanticObjects: {
				ignore: true
			},
			semanticObjectController: {
				ignore: true
			},
			fieldName: {
				ignore: true
			},
			// deprecated as of version 1.40.0
			semanticObjectLabel: {
				ignore: true
			},
			createControlCallback: {
				ignore: true
			},
			mapFieldToSemanticObject: {
				ignore: true
			},
			// changed to <code>false</code> as of version 1.48.0
			contactAnnotationPath: {
				ignore: false
			},
			ignoreLinkRendering: {
				ignore: true
			},
			enableAvailableActionsPersonalization: {
				ignore: false
			},
			uom: {
				ignore: true
			},
			// changed to <code>false</code> as of version 1.48.0
			enabled: {
				ignore: false
			}
		},

		customData: {}
	};
}, /* bExport= */false);
