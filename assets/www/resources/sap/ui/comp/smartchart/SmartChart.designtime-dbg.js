/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides the Design Time Metadata for the sap.ui.comp.smartchart.SmartChart control.
sap.ui.define([], function() {
	"use strict";
	return {
		annotations: {
			/**
			 * Defines a name of the <code>SemanticObject</code> that can be represented with an <code>EntitySet</code>, <code>EntityType</code>
			 * or identified by a <code>Property</code>. With this annotation in place, the <code>SemanticObjectController</code> will provide
			 * all the available features for the <code>SmartChart</code> control. <i>XML Example of OData V4 with SemanticObject on ProductName</i>
			 * <br>
			 * <b>Note:</b> Navigation targets are determined using {@link sap.ushell.services.CrossApplicationNavigation CrossApplicationNavigation} of the unified shell service.
			 *
			 * <pre>
			 *    &lt;Annotations Target=&quot;ProductName&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.SemanticObject&quot; String=&quot;SemanticObjectName&quot; /&gt;
			 *   &lt;/Annotations&gt;
			 * </pre>
			 */
			semanticObject: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "SemanticObject",
				target: [
					"EntitySet", "EntityType", "Property"
				],
				defaultValue: null,
				appliesTo: [
					"text"
				],
				group: [
					"Behavior"
				],
				since: "1.34.1"
			},

			/**
			 * Defines whether a field in the SmartChart control is visible. The SmartChart interprets the
			 * <code>EnumMember</code> <code>FieldControlType/Hidden</code> of the <code>FieldControl</code> annotation for setting the
			 * visibility. <b>Note:</b> Currently only <code>FieldControlType/Hidden</code> is supported for statically hiding the fields. <i>XML
			 * Example of OData V4 with hidden Customer and CompanyCode Properties</i>
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Customer&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.FieldControl&quot; EnumMember=&quot;com.sap.vocabularies.Common.v1.FieldControlType/Hidden&quot;/&gt;
			 *    &lt;/Property&gt;
			 *    &lt;Property Name=&quot;CompanyCode&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.Common.v1.FieldControl&quot; EnumMember=&quot;com.sap.vocabularies.Common.v1.FieldControlType/Hidden&quot;/&gt;
			 *    &lt;/Property&gt;
			 * </pre>
			 *
			 * For OData v2 the <code>sap:visible</code> annotation on the <code>Property</code> can be used to assign visibility.
			 *
			 * <pre>
			 *    &lt;Property Name=&quot;Customer&quot; ... sap:visible=&quot;false&quot;/&gt;
			 *    &lt;Property Name=&quot;CompanyCode&quot; ... sap:visible=&quot;false&quot;/&gt;
			 * </pre>
			 */
			fieldVisible: {
				namespace: "com.sap.vocabularies.Common.v1",
				annotation: "FieldControlType",
				target: [
					"Property"
				],
				whiteList: {
					values: [
						"Hidden"
					]
				},
				defaultValue: false,
				appliesTo: [
					"field/#/visible"
				],
				group: [
					"Behavior"
				],
				since: "1.34.1"
			},

			/**
			 * Renders the initial chart fields for the SmartChart control. A <code>PropertyPath</code> and an <code>AnnotationPath</code> can be
			 * used for constructing PresentationVariant annotation. <i>XML Example of OData V4 with Customer and CompanyCode Properties as
			 * PresentationVariant</i>
			 *
			 * <pre>
			 *    &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.PresentationVariant&quot;&gt;
			 *      &lt;Record&gt;
			 *        &lt;PropertyValue Property=&quot;Visualizations&quot;&gt;
			 *          &lt;Collection&gt;
			 *            &lt;AnnotationPath&gt;@UI.Chart&lt;/AnnotationPath&gt;
			 *          &lt;/Collection&gt;
			 *        &lt;/PropertyValue&gt;
			 *        &lt;PropertyValue Property=&quot;RequestAtLeast&quot;&gt;
			 *          &lt;Collection&gt;
			 *            &lt;PropertyPath&gt;Customer&lt;/PropertyPath&gt;
			 *            &lt;PropertyPath&gt;CompanyCode&lt;/PropertyPath&gt;
			 *          &lt;/Collection&gt;
			 *        &lt;/PropertyValue&gt;
			 *          &lt;PropertyValue Property=&quot;SortOrder&quot;&gt;
			 *            &lt;Collection&gt;
			 *              &lt;Record&gt;
			 *                &lt;PropertyValue Property=&quot;Property&quot; PropertyPath=&quot;CompanyCode&quot;/&gt;
			 *                &lt;PropertyValue Property=&quot;Descending&quot; Bool=&quot;true&quot;/&gt;
			 *              &lt;/Record&gt;
			 *              &lt;Record&gt;
			 *                &lt;PropertyValue Property=&quot;Property&quot; PropertyPath=&quot;Customer&quot;/&gt;
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
				target: [
					"EntitySet", "EntityType"
				],
				defaultValue: null,
				appliesTo: [
					"chartFields"
				],
				group: [
					"Behavior"
				],
				since: "1.34.1"
			},

			/**
			 * Renders a chart based on the information that is provided within the <code>Chart</code> annotation. <code>Chart</code> annotation
			 * must be defined for an </code>EntityType</code>
			 *
			 * <i>XML Example of OData V4 with Chart Annotation and ChartType Column Chart</i>
			 *
			 * <pre>
			 *    &lt;Annotations Target=&quot;Item&quot; xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.Chart&quot;&gt;
			 *        &lt;Record&gt;
			 *          &lt;PropertyValue Property=&quot;Title&quot; String=&quot;Line Items&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;ChartType&quot;
			 *             EnumMember=&quot;com.sap.vocabularies.UI.v1.ChartType/Column&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;Dimensions&quot;&gt;
			 *            &lt;Collection&gt;
			 *              &lt;PropertyPath&gt;CompanyCode&lt;/PropertyPath&gt;
			 *              &lt;PropertyPath&gt;Customer&lt;/PropertyPath&gt;
			 *            &lt;/Collection&gt;
			 *          &lt;/PropertyValue&gt;
			 *          &lt;PropertyValue Property=&quot;Measures&quot;&gt;
			 *            &lt;Collection&gt;
			 *              &lt;PropertyPath&gt;AmountInCompanyCodeCurrency&lt;/PropertyPath&gt;
			 *              &lt;PropertyPath&gt;AmountInTransactionCurrency&lt;/PropertyPath&gt;
			 *            &lt;/Collection&gt;
			 *          &lt;/PropertyValue&gt;
			 *        &lt;/Record&gt;
			 *      &lt;/Annotation&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 */
			chart: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "Chart",
				target: [
					"EntityType"
				],
				defaultValue: null,
				appliesTo: [
					"chart"
				],
				group: [
					"Behavior"
				],
				since: "1.34.1"
			},
			/**
			 * Based on the UI.DataPoint that is provided by the measure attributes, semantic patterns and coloring can be defined for the chart. The
			 * <code>UI.DataPoint</code> annotation must be defined for an </code>EntityType</code> <i>XML Example of OData V4 with DataPoint
			 * Annotation with semantic coloring</i> For more information see {@link sap.chart.ColoringType.Criticality}
			 *
			 * <pre>
			 *    &lt;Annotations Target=&quot;Item&quot; xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.Chart&quot;&gt;
			 *        &lt;Record&gt;
			 *          &lt;PropertyValue Property=&quot;Title&quot; String=&quot;Line Items&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;ChartType&quot;
			 *             EnumMember=&quot;com.sap.vocabularies.UI.v1.ChartType/Column&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;Dimensions&quot;&gt;
			 *            &lt;Collection&gt;
			 *              &lt;PropertyPath&gt;CompanyCode&lt;/PropertyPath&gt;
			 *              &lt;PropertyPath&gt;Customer&lt;/PropertyPath&gt;
			 *            &lt;/Collection&gt;
			 *          &lt;/PropertyValue&gt;
			 *          &lt;PropertyValue Property=&quot;Measures&quot;&gt;
			 *            &lt;Collection&gt;
			 *              &lt;PropertyPath&gt;AmountInCompanyCodeCurrency&lt;/PropertyPath&gt;
			 *              &lt;PropertyPath&gt;AmountInTransactionCurrency&lt;/PropertyPath&gt;
			 *            &lt;/Collection&gt;
			 *          &lt;/PropertyValue&gt;
			 *          &lt;PropertyValue Property=&quot;MeasureAttributes&quot;&gt;
			 *            &lt;Collection&gt;
			 *               &lt;Record&gt;
			 *                  &lt;PropertyValue Property=&quot;Measure&quot; PropertyPath=&quot;AmountInCompanyCodeCurrency&quot; /&gt;
			 *                  &lt;PropertyValue Property=&quot;Role&quot; EnumMember=&quot;com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis1&quot; /&gt;
			 *                  &lt;PropertyValue Property=&quot;DataPoint&quot; AnnotationPath=&quot;@com.sap.vocabularies.UI.v1.DataPoint#semanticColoring&quot; /&gt;
			 *               &lt;/Record&gt;
			 *            &lt;/Collection&gt;
			 *          &lt;/PropertyValue&gt;
			 *        &lt;/Record&gt;
			 *      &lt;/Annotation&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.DataPoint&quot; Qualifier=&quot;semanticColoring&quot; &gt;
			 * 	  &lt;Record Type=&quot;com.sap.vocabularies.UI.v1.DataPointType&quot;&gt;
			 * 		&lt;PropertyValue Property=&quot;Value&quot; Path=&quot;AmountInCompanyCodeCurrency&quot; /&gt;
			 * 		&lt;PropertyValue Property=&quot;Criticality&quot; EnumMember=&quot;sap.chart.ColoringType.Negative&quot; /&gt;
			 * 	  &lt;/Record&gt;
			 *     &lt;/Annotation&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 *
			 * Using this UI.DataPoint annotation, the semantic coloring for a measure changes as follows:
			 *
			 * <pre>
			 *    var oColorings = {
			 *        Criticality: {
			 *           MeasureValues: {
			 *               &quot;AmountInCompanyCodeCurrency&quot;: {
			 *                    Static: sap.chart.ColoringType.Negative
			 *               }
			 *           }
			 *    }
			 * </pre>
			 *
			 * <i>XML Example of OData V4 with DataPoint Annotation with semantic pattern</i> For more information see
			 * {@link sap.chart.data.MeasureSemantics}
			 *
			 * <pre>
			 *    &lt;Annotations Target=&quot;Item&quot; xmlns=&quot;http://docs.oasis-open.org/odata/ns/edm&quot;&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.Chart&quot;&gt;
			 *        &lt;Record&gt;
			 *          &lt;PropertyValue Property=&quot;Title&quot; String=&quot;Line Items&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;ChartType&quot;
			 *             EnumMember=&quot;com.sap.vocabularies.UI.v1.ChartType/Column&quot; /&gt;
			 *          &lt;PropertyValue Property=&quot;Dimensions&quot;&gt;
			 *            &lt;Collection&gt;
			 *              &lt;PropertyPath&gt;CompanyCode&lt;/PropertyPath&gt;
			 *              &lt;PropertyPath&gt;Customer&lt;/PropertyPath&gt;
			 *            &lt;/Collection&gt;
			 *          &lt;/PropertyValue&gt;
			 *          &lt;PropertyValue Property=&quot;Measures&quot;&gt;
			 *            &lt;Collection&gt;
			 *              &lt;PropertyPath&gt;AmountInCompanyCodeCurrency&lt;/PropertyPath&gt;
			 *              &lt;PropertyPath&gt;TargetAmountInCompanyCodeCurrency&lt;/PropertyPath&gt;
			 *            &lt;/Collection&gt;
			 *          &lt;/PropertyValue&gt;
			 *          &lt;PropertyValue Property=&quot;MeasureAttributes&quot;&gt;
			 *            &lt;Collection&gt;
			 *               &lt;Record&gt;
			 *                  &lt;PropertyValue Property=&quot;Measure&quot; PropertyPath=&quot;AmountInCompanyCodeCurrency&quot; /&gt;
			 *                  &lt;PropertyValue Property=&quot;Role&quot; EnumMember=&quot;com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis1&quot; /&gt;
			 *                  &lt;PropertyValue Property=&quot;DataPoint&quot; AnnotationPath=&quot;@com.sap.vocabularies.UI.v1.DataPoint#semanticPattern&quot; /&gt;
			 *               &lt;/Record&gt;
			 *            &lt;/Collection&gt;
			 *          &lt;/PropertyValue&gt;
			 *        &lt;/Record&gt;
			 *      &lt;/Annotation&gt;
			 *      &lt;Annotation Term=&quot;com.sap.vocabularies.UI.v1.DataPoint&quot; Qualifier=&quot;semanticPattern&quot; &gt;
			 * 	  &lt;Record Type=&quot;com.sap.vocabularies.UI.v1.DataPointType&quot;&gt;
			 * 		&lt;PropertyValue Property=&quot;Value&quot; Path=&quot;AmountInCompanyCodeCurrency&quot; /&gt;
			 * 		&lt;PropertyValue Property=&quot;TargetValue&quot; Path=&quot;TargetAmountInCompanyCodeCurrency&quot; /&gt;
			 * 	  &lt;/Record&gt;
			 *     &lt;/Annotation&gt;
			 *    &lt;/Annotations&gt;
			 * </pre>
			 *
			 * Using this UI.DataPoint annotation, the semantics of the chart measures are set as follows:
			 *
			 * <pre>
			 * var oAmountInCompanyCodeCurrency = oChart.getMeasureByName(&quot;AmountInCompanyCodeCurrency&quot;);
			 * oAmountInCompanyCodeCurrency.setSemantics(sap.chart.data.MeasureSemantics.Actual);
			 *
			 * var oTargetAmountInCompanyCodeCurrency = oChart.getMeasureByName(&quot;TargetAmountInCompanyCodeCurrency&quot;);
			 * oTargetAmountInCompanyCodeCurrency.setSemantics(sap.chart.data.MeasureSemantics.Reference);
			 * </pre>
			 */
			dataPoint: {
				namespace: "com.sap.vocabularies.UI.v1",
				annotation: "DataPoint",
				target: [
					"PropertyValue"
				],
				defaultValue: null,
				appliesTo: [
					"dataPoint"
				],
				group: [
					"Behavior"
				],
				since: "1.48.0"
			}
		},
		customData: {
			/**
			 * Overrides the default settings for formatting dates in all dimensions of the SmartChart control. The format settings can be provided as
			 * a JSON object or a JSON string. For more information see {@link sap.ui.model.type.Date}
			 */
			dateFormatSettings: {
				type: "string",
				defaultValue: "\{'UTC':'true'\}",
				group: [
					"Appearance"
				],
				since: "1.28.1"
			},
			/**
			 * If set to
			 * <code>true</true> the UI.Chart annotation will not be taken into account when creating the content of the Smart Chart control.
			 */
			skipAnnotationParse: {
				type: "boolean",
				defaultValue: null,
				appliesTo: [
					"content"
				],
				since: "1.28.1"
			},
			/**
			 * Used for dimension properties that has an additional sap:text annotation for further description. For more information see
			 * {@link sap.ui.comp.smartfilterbar.DisplayBehaviour} <b>Note</b> Use the annotation UI.TextArrangement instead.
			 */
			defaultDimensionDisplayBehaviour: {
				type: "sap.ui.comp.smartfilterbar.DisplayBehaviour",
				defaultValue: "",
				since: "1.28.1"
			},
			/**
			 * When set to the SmartChart control the UI.Chart annotation that matches the qualifier is rendered on the UI, otherwise the
			 * non-qualified UI.Chart annotation is rendered. <b>Note</b> the chart qualifier is only evaluated in case no presentation variant is
			 * available -or- no valid visualization in presentation variant is available.
			 */
			chartQualifier: {
				type: "string",
				defaultValue: null,
				appliesTo: [
					"content"
				]
			},
			/**
			 * When set to the SmartChart control, the UI.PresentationVariant annotation that matches the qualifier and have a visualization for the
			 * UI:Chart annotation is used to have influence on presented chart type, on sorting etc.
			 */
			presentationVariantQualifier: {
				type: "string",
				defaultValue: null,
				appliesTo: [
					"content"
				]
			},
			/**
			 * A JSON object containing the personalization dialog settings.
			 *
			 * <i>Below you can find a brief example</i>
			 *
			 * <pre><code>
			 * {
			 * 		group: {
			 * 			visible: false
			 * 		},
			 * 		sort: {
			 *      	visible: true
			 *  	},
			 *  	filter: {
			 *     	 	visible:false
			 *  	}
			 * }
			 * </code></pre>
			 */
			p13nDialogSettings: {
				type: "object",
				defaultValue: {}
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

			requestAtLeastFields: {
				ignore: false
			},

			ignoreFromPersonalisation: {
				ignore: true
			},

			chartType: {
				ignore: true
			},

			ignoredChartTypes: {
				ignore: false
			},

			useVariantManagement: {
				ignore: true
			},

			useChartPersonalisation: {
				ignore: true
			},

			header: {
				ignore: false
			},

			persistencyKey: {
				ignore: true
			},

			currentVariantId: {
				ignore: false
			},

			enableAutoBinding: {
				ignore: false
			},

			chartBindingPath: {
				ignore: false
			},

			showDrillButtons: {
				ignore: false
			},

			showZoomButtons: {
				ignore: false
			},

			showSemanticNavigationButton: {
				ignore: false
			},

			showVariantManagement: {
				ignore: false
			},

			showDownloadButton: {
				ignore: false
			},

			showDetailsButton: {
				ignore: false
			},

			showDrillBreadcrumbs: {
				ignore: false
			},

			showChartTooltip: {
				ignore: false
			},

			showLegendButton: {
				ignore: false
			},

			legendVisible: {
				ignore: false
			},

			selectionMode: {
				ignore: false
			},

			showFullScreenButton: {
				ignore: false
			},

			useTooltip: {
				ignore: false
			},

			useListForChartTypeSelection: {
				ignore: true
			},

			detailsItemActionFactory: {
				ignore: false
			},

			detailsListActionFactory: {
				ignore: true
			},
			noData: {
				ignore: false
			},
			showChartTypeSelectionButton: {
				ignore: false
			}
		}
	};
}, /* bExport= */false);
