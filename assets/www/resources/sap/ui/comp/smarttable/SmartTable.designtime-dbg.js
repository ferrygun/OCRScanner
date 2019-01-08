/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides the Design Time Metadata for the sap.ui.comp.smarttable.SmartTable control.
sap.ui.define([], function() {
	"use strict";
	// Function to check if the specified type name is related to some UI5 table
	var fCheckTableTypesMatch = function(sType) {
		if (sType === "sap.m.Table" || sType === "sap.m.Column" || sType.indexOf("sap.ui.table") > -1) {
			return true;
		}
		return false;
	};

	return {
		aggregations: {
			customToolbar: {
				ignore: true
			},
			semanticObjectController: {
				ignore: true
			},
			noData: {
				ignore: true
			},
			items: {
				propagateMetadata: function(oElement) {
					var sType = oElement.getMetadata().getName();
					// Check if element is related to SmartLink (allow both SmartLink and ObjectIdentifier for RTA)
					var bIsSmartLink = (sType === "sap.ui.comp.navpopover.SmartLink" || sType === "sap.m.ObjectIdentifier");
					// Disable RTA for all other UI5 table related code and sap.m.Title
					if (!bIsSmartLink && (sType === "sap.m.Title" || fCheckTableTypesMatch(sType) || fCheckTableTypesMatch(oElement.getParent().getMetadata().getName()))) {
						return {
							actions: null
						};
					}
				}
			}
		},
		annotations: {
			/**
			 * Defines whether a column can be sorted.
			 * Columns are sortable by default. If sorting on columns has to be restricted,
			 * then such columns must be listed under <code>NonSortableProperties</code> (exclude from sorting).
			 *
			 * The annotation is calculated from the currently bound <code>EntitySet</code> and contains a <code>Property</code> collection of the
			 * corresponding <code>EntityType</code> definition. Only <code>PropertyPath</code> for columns to be excluded from sorting can be applied.
			 *
			 * For columns added to the content of the SmartTable control, the annotation is not used, and the hosting component needs to take care
			 * of correct settings.
			 *
			 * <i>XML Example of OData V4 with Customer and CompanyCode Properties Excluded from Sorting</i>
			 * <pre>
			 *    &lt;Annotation Term="Org.OData.Capabilities.V1.SortRestrictions"&gt;
			 *      &lt;PropertyValue Property="NonSortableProperties"&gt;
			 *        &lt;Collection&gt;
			 *           &lt;PropertyPath&gt;Customer&lt;/PropertyPath&gt;
			 *           &lt;PropertyPath&gt;CompanyCode&lt;/PropertyPath&gt;
			 *        &lt;/Collection&gt;
			 *      &lt;/PropertyValue&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 *
			 * For OData v2 the <code>sap:sortable</code> annotation on the <code>Property</code> can be used to exclude from sorting.
			 * <pre>
			 *    &lt;Property Name="Customer" ... sap:sortable="false"/&gt;
			 *    &lt;Property Name="CompanyCode" ... sap:sortable="false"/&gt;
			 * </pre>
			 */
			sortable: {
				namespace: "Org.OData.Capabilities.V1",
				annotation: "SortRestrictions",
				target: ["EntitySet"],
				whiteList: {
					properties: ["NonSortableProperties"]
				},
				defaultValue: true,
				interpretation: "exclude",
				appliesTo: ["columns/#"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Defines whether a column can be filtered.
			 * Columns are filterable by default and need to be excluded.
			 *
			 * The annotation is calculated from the currently bound <code>EntitySet</code> and contains a <code>PropertyPath</code> collection of the
			 * corresponding <code>EntityType</code> definition. Only PropertyPaths for columns to be excluded from filtering can be applied.
			 *
			 * For columns added to the content's table of the SmartTable, the annotation is not used and the hosting component needs to take care
			 * of correct settings.
			 *
			 * <b>Note:</b> Currently only OData V2 annotation is supported.
			 *
			 * <i>XML Example of OData V4 with Excluded Customer and CompanyCode Properties from Filtering</i>
			 * <pre>
			 *    &lt;Annotation Term="Org.OData.Capabilities.V1.FilterRestrictions"&gt;
			 *      &lt;PropertyValue Property="NonFilterableProperties"&gt;
			 *        &lt;Collection&gt;
			 *           &lt;PropertyPath&gt;Customer&lt;/PropertyPath&gt;
			 *           &lt;PropertyPath&gt;CompanyCode&lt;/PropertyPath&gt;
			 *        &lt;/Collection&gt;
			 *      &lt;/PropertyValue&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 *
			 * For OData v2 the <code>sap:filterable</code> annotation on the <code>Property</code> can be used to exclude from filtering.
			 * <pre>
			 *    &lt;Property Name="Customer" ... sap:filterable="false"/&gt;
			 *    &lt;Property Name="CompanyCode" ... sap:filterable="false"/&gt;
			 * </pre>
			 */
			filterable: {
				namespace: "Org.OData.Capabilities.V1",
				annotation: "FilterRestrictions",
				target: ["EntitySet"],
				whiteList: {
					properties: ["NonFilterableProperties"]
				},
				defaultValue: true,
				interpretation: "exclude",
				appliesTo: ["columns/#"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * A short, human-readable text suitable for the column header's text.
			 *
			 * Either <code>com.sap.vocabularies.Common.v1.Label</code> annotation on the <code>Property</code> or <code>Label</code> annotation of
			 * <code>com.sap.vocabularies.UI.v1.DataFieldAbstract</code> within <code>com.sap.vocabularies.UI.v1.LineItem</code> annotation can be used.
			 * If <code>com.sap.vocabularies.Common.v1.Label</code> annotation is given, it has precedence.
			 * If none of the annotations is given the label will be the Property name of the column.
			 *
			 * For columns added to the content's table of the SmartTable, the annotation is not used and the hosting component needs to take care
			 * of correct settings and translation.
			 *
			 * <i>XML Example of OData V4 with CustomerName as Label for Customer Property</i>
			 * <pre>
			 *    &lt;Property Name="Customer"&gt;
			 *       &lt;Annotation Term="com.sap.vocabularies.Common.v1.Label" Path="CustomerName" /&gt;
			 *    &lt;/Property&gt;
			 *    &lt;Property Name="CustomerName" type="Edm.String" /&gt;
			 * </pre>
			 *
			 * For OData v2 the <code>sap:label</code> annotation on the <code>Property</code> can be used to define the label of the column.
			 * <pre>
			 *    &lt;Property Name="Customer" ... sap:label="My Customer"/&gt;
			 * </pre>
			 *
			 */
			columnLabelOnProperty: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "Label",
				target: ["Property", "PropertyPath"],
				defaultValue: null,
				appliesTo: ["columns/#/label"],
				group: ["Appearance", "Behavior"],
				since: "1.28.1"
			},

			/**
			 * Defines whether the column is visible.
			 * The SmartTable control interprets the <code>EnumMember</code> <code>FieldControlType/Hidden</code> of the <code>FieldControl</code> annotation for setting the visibility.
			 * If a <code>Property</code> is set to hidden in OData annotation, then the SmartTable control ignores processing this <code>Property</code>.
			 *
			 * <b>Note:</b> Currently only <code>FieldControlType/Hidden</code> is supported for statically hiding the columns.
			 *
			 * <i>XML Example of OData V4 with Hidden Customer and CompanyCode Properties</i>
			 * <pre>
			 *    &lt;Property Name="Customer"&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.FieldControl&quot; EnumMember=&quot;com.sap.vocabularies.Common.v1.FieldControlType/Hidden&quot;/&gt;
			 *    &lt;/Property&gt;
			 *    &lt;Property Name="CompanyCode"&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.FieldControl&quot; EnumMember=&quot;com.sap.vocabularies.Common.v1.FieldControlType/Hidden&quot;/&gt;
			 *    &lt;/Property&gt;
			 * </pre>
			 *
			 * For OData v2 the <code>sap:visible</code> annotation on the <code>Property</code> can be used to assign visibility.
			 * <pre>
			 *    &lt;Property Name=&quot;Customer&quot; ... sap:visible=&quot;false&quot;/&gt;
			 *    &lt;Property Name=&quot;CompanyCode&quot; ... sap:visible=&quot;false&quot;/&gt;
			 * </pre>
			 */
			columnVisible: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "FieldControlType",
				target: ["Property"],
				whiteList: {
					values: ["Hidden"]
				},
				defaultValue: false,
				appliesTo: ["columns/#/visible"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Defines a currency code for an amount according to the ISO 4217 standard.
			 * <code>ISOCurrency</code> annotation can point to a <code>Property</code>, which can also be <code>null</code>.
			 *
			 * <i>XML Example of OData V4 with CurrencyCode Associated to Price Property</i>
			 * <pre>
			 *    &lt;Property Name="Price"&gt;
			 *       &lt;Annotation Term="Org.OData.Measures.V1.ISOCurrency" Path="CurrencyCode" /&gt;
			 *    &lt;/Property&gt;
			 *    &lt;Property Name="CurrencyCode" type="Edm.String" /&gt;
			 * </pre>
			 *
			 * For OData v2 the <code>sap:semantics="currency-code"</code> along with <code>sap:unit</code> annotations on the <code>Property</code> can be used to assign a currency code to the field.
			 * <pre>
			 *    &lt;Property Name="Price" ... sap:ubit="CurrencyCode"/&gt;
			 *    &lt;Property Name="CurrencyCode" ... sap:semantics="currency-code"/&gt;
			 * </pre>
			 */
			columnCurrencyCode: {
				namespace: "Org.OData.Measures.V1",
				annotation: "ISOCurrency",
				target: ["Property"],
				defaultValue: null,
				appliesTo: ["columns/#/cellContent"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * The unit of measure for a measured quantity, for example, cm for centimeters.
			 * Renders the value associated with the unit annotation of a <code>Property</code>, which can be <code>null</code>.
			 *
			 * <i>XML Example of OData V4 with OrderedUnit Associated to OrderedQuantity Property</i>
			 * <pre>
			 *   &lt;Property Name="OrderedQuantity"&gt;
			 *     &lt;Annotation Term="Org.OData.Measures.V1.Unit" Path="OrderedUnit" /&gt;
			 *   &lt;/Property&gt;
			 *   &lt;Property Name="OrderedUnit" type="Edm.String" /&gt;
			 * </pre>
			 *
			 * For OData v2 the <code>sap:semantics="unit-of-measure"</code> along with <code>sap:unit</code> annotations on the <code>Property</code> can be used to assign unit of measure to the field.
			 * <pre>
			 *    &lt;Property Name="OrderedQuantity" ... sap:unit="OrderedUnit"/&gt;
			 *    &lt;Property Name="OrderedUnit" ... sap:semantics="unit-of-measure"/&gt;
			 * </pre>
			 */
			columnUnitOfMeasure: {
				namespace: "Org.OData.Measures.V1",
				annotation: "Unit",
				target: ["Property"],
				defaultValue: null,
				appliesTo: ["columns/#/cellContent"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Defines whether a string is capitalized.
			 *
			 * <i>XML Example of OData V4 with Capitalized Customer and CompanyCode Properties</i>
			 * <pre>
			 *    &lt;Annotation Term="com.sap.vocabularies.Common.v1.IsUpperCase"&gt;
			 *        &lt;Collection&gt;
			 *           &lt;PropertyPath&gt;Customer&lt;/PropertyPath&gt;
			 *           &lt;PropertyPath&gt;CompanyCode&lt;/PropertyPath&gt;
			 *        &lt;/Collection&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 *
			 * For OData v2 the <code>sap:display-format="UpperCase"</code> annotation on the <code>Property</code> can be used to render the text in upper case format.
			 * <pre>
			 *    &lt;Property Name="Customer" ... sap:display-format="UpperCase"/&gt;
			 *    &lt;Property Name="CompanyCode" ... sap:display-format="UpperCase"/&gt;
			 * </pre>
			 */
			columnUpperCase: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "IsUpperCase",
				target: ["Property", "Parameter"],
				defaultValue: true,
				appliesTo: ["columns/#", "columns/#/cellContent"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Renders the initial columns for the SmartTable control.
			 *
			 * <i>XML Example of OData V4 Customer and CompanyCode Properties as LineItem</i>
			 * <pre>
			 *    &lt;Annotation Term="com.sap.vocabularies.UI.v1.LineItem"&gt;
			 *        &lt;Collection&gt;
			 *          &lt;Record&gt;
			 *             &lt;PropertyValue Property="Value" Path="Customer" /&gt;
			 *             &lt;PropertyValue Property="Value" Path="CompanyCode" /&gt;
			 *           &lt;/Record&gt;
			 *        &lt;/Collection&gt;
			 *    &lt;/Annotation&gt;
			 * </pre>
			 *
			 * Supported record types are: <code>DataFieldWithUrl</code> and <code>DataField</code>.
			 */
			lineItem: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "LineItem",
				target: ["EntityType"],
				whiteList: {
					types: ["DataFieldWithUrl", "DataField"]
				},
				defaultValue: null,
				appliesTo: ["columns"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Renders the initial columns for the SmartTable control.
			 * A <code>PropertyPath</code> and an <code>AnnotationPath</code> can be used for constructing PresentationVariant annotation.
			 *
			 * <i>XML Example of OData V4 with Customer and CompanyCode Properties as PresentationVariant</i>
			 * <pre>
			 *    &lt;Annotation Term="com.sap.vocabularies.UI.v1.PresentationVariant"&gt;
			 *      &lt;Record&gt;
			 *        &lt;PropertyValue Property="Visualizations"&gt;
			 *          &lt;Collection&gt;
			 *            &lt;AnnotationPath&gt;@UI.LineItem&lt;/AnnotationPath&gt;
			 *          &lt;/Collection&gt;
			 *        &lt;/PropertyValue&gt;
			 *        &lt;PropertyValue Property="RequestAtLeast"&gt;
			 *          &lt;Collection&gt;
			 *            &lt;PropertyPath&gt;Customer&lt;/PropertyPath&gt;
			 *            &lt;PropertyPath&gt;CompanyCode&lt;/PropertyPath&gt;
			 *          &lt;/Collection&gt;
			 *        &lt;/PropertyValue&gt;
			 *          &lt;PropertyValue Property="SortOrder"&gt;
			 *            &lt;Collection&gt;
			 *              &lt;Record&gt;
			 *                &lt;PropertyValue Property="Property" PropertyPath="CompanyCode"/&gt;
			 *                &lt;PropertyValue Property="Descending" Bool="true"/&gt;
			 *              &lt;/Record&gt;
			 *              &lt;Record&gt;
			 *                &lt;PropertyValue Property="Property" PropertyPath="Customer"/&gt;
			 *              &lt;/Record&gt;
			 *            &lt;/Collection&gt;
			 *          &lt;/PropertyValue&gt;
			 *        &lt;/Record&gt;
			 *      &lt;/Annotation&gt;
			 * </pre>
			 */
			presentationVariant: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "PresentationVariant",
				target: ["EntitySet", "EntityType"],
				defaultValue: null,
				appliesTo: ["columns"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Shows columns with priority high on phones, with priority medium or high on tablets, and with all priorities on the desktop.
			 *
			 * <b>Note:</b> Currently the <code>Importance</code> annotation is only evaluated in the <code>LineItem DataField</code> annotation.
			 *
			 * <i>XML Example of OData V4 with the Importance Annotation</i>
			 * <pre>
			 *    &lt;Property Name="Customer"&gt;
			 *      &lt;Annotation Term="com.sap.vocabularies.UI.v1.Importance" EnumMember="com.sap.vocabularies.UI.v1.ImportanceType/High" /&gt;
			 *    &lt;/Property&gt;
			 *    &lt;Property Name="CompanyCode"&gt;
			 *      &lt;Annotation Term="com.sap.vocabularies.UI.v1.Importance" EnumMember="com.sap.vocabularies.UI.v1.ImportanceType/Medium" /&gt;
			 *    &lt;/Property&gt;
			 * </pre>
			 */
			columnImportance: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "Importance",
				target: ["Record", "Annotation"],
				defaultValue: null,
				appliesTo: ["columns/#/visible"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * This annotation can be specified along with the <code>LineItem</code> annotation in order to specify that a property
			 * is rendered as a regular data field.
			 *
			 * <i>XML Example for OData V4 with DataField Annotation</i>
			 * <pre>
			 *    &lt;Record Type="com.sap.vocabularies.UI.v1.DataField"&gt;
			 *      &lt;Annotation Term="UI.Importance" EnumMember="UI.ImportanceType/High"/&gt;
			 *      &lt;PropertyValue Property="Label" String="Language"/&gt;
			 *      &lt;PropertyValue Property="Value" Path="Language"/&gt;
			 *    &lt;/Record&gt;
			 * </pre>
			 *
			 *  Supported properties are: <code>Criticality, CriticalityRepresentation, Label</code> and <code>Value</code>.
			 */
			columnDataField: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "DataField",
				target: ["LineItem/Record"],
				whiteList: {
					properties: [
						"Criticality",
						"CriticalityRepresentation",
						"Label",
						"Value"
					]
				},
				defaultValue: null,
				appliesTo: ["columns/cellContent"],
				group:["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Renders the value as a URL, if a URL parameter path is present.
			 * This annotation must be specified along with the <code>LineItem</code> annotation.
			 *
			 * <b>Note:</b> Currently only <code>odata.fillUriTemplate</code> with LabeledElement for filling the URL parameter is support
			 * in the <code>Apply Function</code>.
			 *
			 * <i>XML Example for OData V4 with DataFieldWithUrl Annotation</i>
			 * <pre>
			 *    &lt;Record Type="com.sap.vocabularies.UI.v1.DataFieldWithUrl"&gt;
			 *      &lt;PropertyValue Property="Label" String="Link to"/&gt;
			 *      &lt;PropertyValue Property="Value" String="Google Maps"/&gt;
			 *      &lt;PropertyValue Property="Url"&gt;
			 *        &lt;Apply Function="odata.fillUriTemplate"&gt;
			 *          &lt;String&gt;https://www.google.de/maps/{city1}/{street},{city2}&lt;/String&gt;
			 *            &lt;LabeledElement Name="street"&gt;
			 *              &lt;Path&gt;Address/Street&lt;/Path&gt;
			 *            &lt;/LabeledElement&gt;
			 *            &lt;LabeledElement Name="city1"&gt;
			 *              &lt;Path&gt;Address/City&lt;/Path&gt;
			 *            &lt;/LabeledElement&gt;
			 *            &lt;LabeledElement Name="city2"&gt;
			 *              &lt;Path&gt;Address/City&lt;/Path&gt;
			 *            &lt;/LabeledElement&gt;
			 *        &lt;/Apply&gt;
			 *      &lt;/PropertyValue&gt;
			 *    &lt;/Record&gt;
			 * </pre>
			 *
			 * Supported properties are: <code>Url, Label</code> and <code>Value</code>.
			 */
			columnDataFieldWithUrl: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "DataFieldWithUrl",
				target: ["LineItem/Record"],
				whiteList: {
					properties: [
						"Label",
						"Url",
						"Value"
					]
				},
				defaultValue: null,
				appliesTo: ["columns/cellContent"],
				group:["Behavior"],
				since: "1.38.1"
			},

			/**
			 * Represents the criticality state of the data that is present inside the column.
			 * This annotation must be specified along with the <code>LineItem</code> annotation.
			 * Color coding is also applied to the criticality state based on the provided <code>EnumMember</code>.
			 *
			 * <i>XML Example for OData V4 with CriticalityType Annotation</i>
			 * <pre>
			 *    &lt;Record Type="com.sap.vocabularies.UI.v1.DataField"&gt;
			 *      &lt;PropertyValue Property="Criticality"
			 *        Path="to_StockAvailability/StockAvailability" /&gt;
			 *      &lt;PropertyValue Property="CriticalityRepresentation"
			 *        EnumMember="com.sap.vocabularies.UI.v1.CriticalityRepresentationType/WithoutIcon" /&gt;
			 *      &lt;PropertyValue Property="Value" Path="to_StockAvailability/StockAvailability" /&gt;
			 *    &lt;/Record&gt;
			 * </pre>
			 */
			columnCriticality: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "CriticalityType",
				target: ["PropertyPath"],
				defaultValue: null,
				appliesTo: ["columns/criticality"],
				group:["Behavior"],
				since: "1.38.1"
			},

			/**
			 * Determines if criticality is visualized by means of an icon.
			 * The <code>CriticalityRepresentation</code> contains <code>EnumMember</code> that can be used to control the visibility of the icon.
			 * An icon is added along with the criticality state by default.
			 * If <code>PropertyPath</code> is to be excluded from having an icon,
			 * then <code>PropertyPath</code> must be annotated with the <code>CriticalityRepresentationType/WithoutIcon</code> annotation.
			 *
			 * <i>XML Example for OData V4 with CriticalityRepresentationType/WithoutIcon Annotation</i>
			 * <pre>
			 *    &lt;Record Type="com.sap.vocabularies.UI.v1.DataField"&gt;
			 *      &lt;PropertyValue Property="Criticality"
			 *        Path="to_StockAvailability/StockAvailability" /&gt;
			 *      &lt;PropertyValue Property="CriticalityRepresentation"
			 *        EnumMember="com.sap.vocabularies.UI.v1.CriticalityRepresentationType/WithoutIcon" /&gt;
			 *      &lt;PropertyValue Property="Value" Path="to_StockAvailability/StockAvailability" /&gt;
			 *    &lt;/Record&gt;
			 * </pre>
			 */
			columnCriticalityRepresentationType: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "CriticalityRepresentationType",
				target: ["Property"],
				whiteList: {
					values: ["WithoutIcon"]
				},
				interpretation: "excludeIcon",
				defaultValue: null,
				appliesTo: ["columns/criticalityIcon"],
				group:["Behavior"],
				since: "1.38.1"
			},

			/**
			 * Defines whether a property is a semantic key which is used for key columns (rendering sap.m.ObjectIdentifier).
			 *
			 * <i>XML Example of OData V4 with SemanticKey Annotation</i>
			 * <pre>
			 *    &lt;Annotations Target="SalesOrderType" xmlns="http://docs.oasis-open.org/odata/ns/edm"&gt;
			 *      &lt;Annotation Term="com.sap.vocabularies.Common.v1.SemanticKey"&gt;
			 *        &lt;Collection&gt;
			 *          &lt;PropertyPath&gt;SalesOrderID&lt;/PropertyPath&gt;
			 *          &lt;PropertyPath&gt;SalesOrderItemID&lt;/PropertyPath&gt;
			 *        &lt;/Collection&gt;
			 *      &lt;/Annotation&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			semanticKey: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "SemanticKey",
				target: ["EntityType"],
				defaultValue: null,
				appliesTo: ["columns/cellContent"],
				group: ["Behavior"],
				since: "1.38.1"
			},

			/**
			 * Defines a name of the <code>SemanticObject</code> that can be represented with a <code>Property</code> that is defined within an
			 * <code>EntityType</code>. The <code>SmartTable</code> control creates a <code>SmartLink</code> control by providing relevant information
			 * to the <code>SmartLink</code> control.
			 *
			 * <br>
			 * <b>Note:</b> Navigation targets are determined using {@link sap.ushell.services.CrossApplicationNavigation CrossApplicationNavigation} of the unified shell service.
			 *
			 * <i>XML Example of OData V4 with SemanticObject Annotation</i>
			 * <pre>
			 *   &lt;Annotations Target=&quot;ProductCollection.Product/Name&quot; xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.SemanticObject&quot; String=&quot;SemanticObjectName&quot; /&gt;
			 *   &lt;/Annotations&gt;
			 * </pre>
			 */
			semanticObject: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "SemanticObject",
				target: ["Property"],
				defaultValue: null,
				appliesTo: ["columns/cellContent"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Renders an image in the cell if the annotation is present.
			 *
			 * <i>XML Example of OData V4 with the IsImageURL Annotation</i>
			 * <pre>
			 *    &lt;Property Name="Product"&gt;
			 *      &lt;Annotation Term="com.sap.vocabularies.Common.v1.IsImageURL" Bool="true" /&gt;
			 *    &lt;/Property&gt;
			 * </pre>
			 */
			columnIsImageURL: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "IsImageURL",
				target: ["Property"],
				defaultValue: true,
				appliesTo: ["columns/image"],
				group: ["Behavior"],
				since: "1.38.1"
			},

			/**
			 * A descriptive text for values of the annotated property.
			 * <b>Note:</b> The value must be a dynamic expression when used as metadata annotation.
			 *
			 * <i>XML Example of OData V4 Text on CustomerName Property</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Customer&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.Text&quot; Path=&quot;CustomerName&quot; /&gt;
			 *    &lt;/Property&gt;
			 *    &lt;Property Name=&quot;CustomerName&quot; type=&quot;Edm.String&quot; /&gt;
			 * </pre>
			 *
			 * For OData v2 the <code>sap:text</code> annotation on the <code>Property</code> can be used to assign text.
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Customer&quot; ... sap:text=&quot;CustomerName&quot;/&gt;
			 *    &lt;Property Name=&quot;CustomerName&quot; type=&quot;Edm.String&quot;/&gt;
			 * </pre>
			 */
			columnText: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "Text",
				target: ["Property"],
				defaultValue: null,
				appliesTo: ["column/cellContent"],
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Describes the arrangement of a code value and its text. The <code>TextArragement</code> annotation requires the
			 * <code>com.sap.vocabularies.Common.v1.Text</code> annotation to be defined.
			 * The enumeration members can have the following values:
			 * <ul>
			 * <li><code>com.sap.vocabularies.UI.v1.TextArrangementType/TextFirst</code><br>
			 * The underlying control is represented with the specified description followed by its ID. This is the default, if no annotation is specified.</li>
			 * <li><code>com.sap.vocabularies.UI.v1.TextArrangementType/TextOnly</code><br>
			 * The underlying control is represented with the specified description only. </li>
			 * <li><code>com.sap.vocabularies.UI.v1.TextArrangementType/TextLast</code><br>
			 * The underlying control is represented with the specified ID followed by its description. </li>
			 * <li><code>com.sap.vocabularies.UI.v1.TextArrangementType/TextSeparate</code><br>
			 * The underlying control is represented with the specified ID only. </li>
			 * </ul>
			 *
			 * <i>XML Example of OData V4 with EntityType ProductType</i>
			 *
			 * <pre>
			 *    &lt;Annotations Target=&quot;ProductType&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.TextArrangement&quot; EnumMember=&quot;com.sap.vocabularies.UI.v1.TextArrangementType/TextFirst&quot;/&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			textArrangement: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "TextArrangement",
				target: ["EntityType", "com.sap.vocabularies.Common.v1.Text"],
				defaultValue: null,
				appliesTo: ["column/cellContent"],
				group: ["Appearance", "Behavior"],
				since: "1.38"
			}
		},

		customData: {
			/**
			 * Defines whether SmartField controls can be used in the SmartTable control. For editable tables, this property must be set to <code>true</code>.
			 */
			useSmartField: {
				type: "boolean",
				defaultValue: false,
				group: ["Appearance", "Behavior"],
				since: "1.28.1"
			},

			/**
			 * Overrides the default settings for formatting dates in all columns of the SmartTable control. The format settings can be provided as a JSON object or a JSON string.
			 *
			 * @see sap.ui.model.type.Date
			 */
			dateFormatSettings: {
				type: "string",
				defaultValue: "{ UTC : true }",
				group: ["Appearance"],
				since: "1.28.1"
			},

			/**
			 * Defines whether currency symbols are to be applied to currency fields.
			 */
			currencyFormatSettings: {
				type: "string",
				defaultValue: null,
				appliesTo: ["cellContent"],
				since: "1.28.1"
			},

			/**
			 * A unique key used to save, retrieve, or apply custom personalization for a column.
			 */
			columnKey: {
				type: "string",
				defaultValue: null,
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Sorts the table based on the column specified; ODataModel property name must be used.
			 */
			sortProperty: {
				type: "string",
				defaultValue: null,
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Filters the table with the condition that is defined; ODataModel property name must be used.
			 */
			filterProperty: {
				type: "string",
				defaultValue: null,
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Defines controls according to the type that is defined. Value can be either date, numeric, or empty string; control will be switched accordingly.
			 */
			type: {
				type: "string",
				defaultValue: null,
				group: ["Behavior"],
				since: "1.28.1"
			},

			/**
			 * Numeric value to restrict number of entries in input fields.
			 */
			maxLength: {
				type: "string",
				defaultValue: null,
				group: ["Appearance"],
				since: "1.28.1"
			},

			/**
			 * Numeric value for precision.
			 */
			precision: {
				type: "string",
				defaultValue: null,
				group: ["Appearance"],
				since: "1.28.1"
			},

			/**
			 * Numeric value for scale.
			 */
			scale: {
				type: "string",
				defaultValue: null,
				group: ["Appearance"],
				since: "1.28.1"
			}
		},

		properties: {
			entitySet: {
				ignore: true
			},
			smartFilterId: {
				ignore: true
			},
			ignoredFields: {
				ignore: true
			},
			initiallyVisibleFields: {
				ignore: true
			},
			requestAtLeastFields: {
				ignore: true
			},
			ignoreFromPersonalisation: {
				ignore: true
			},
			tableType: {
				ignore: true
			},
			useVariantManagement: {
				ignore: true
			},
			showVariantManagement: {
				ignore: false
			},
			useExportToExcel: {
				ignore: false
			},
			exportType: {
				ignore: false
			},
			useTablePersonalisation: {
				ignore: true
			},
			showTablePersonalisation: {
				ignore: false
			},
			showRowCount: {
				ignore: false
			},
			header: {
				ignore: false
			},
			toolbarStyleClass: {
				ignore: true
			},
			enableCustomFilter: {
				ignore: true
			},
			persistencyKey: {
				ignore: true
			},
			useOnlyOneSolidToolbar: {
				ignore: true
			},
			currentVariantId: {
				ignore: true
			},
			editable: {
				ignore: false
			},
			enableAutoBinding:{
				ignore: false
			},
			tableBindingPath: {
				ignore: false
			},
			editTogglable: {
				ignore: true
			},
			demandPopin: {
				ignore: false
			},
			showFullScreenButton: {
				ignore: true
			}
		}
	};
}, /* bExport= */false);
