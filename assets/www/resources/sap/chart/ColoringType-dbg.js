/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

// Provides enumeration sap.chart.ColoringType
sap.ui.define(function() {
    "use strict";


    /**
     * Enum of available colorings.
     *
     * @enum {string}
     * @public
     * @alias sap.chart.ColoringType
     */
    var ColoringType = {
        /**
         * Criticality is based on the semantic color palette. 
         *
         * It can be defined for measure values and dimension values.
         * <pre>
         * Criticality: {
         *     MeasureValues: {
         *         ...
         *     },
         *     DimensionValues: {
         *         ...
         *     }
         * }
         * </pre>
         *
         * <b>For measure values</b>, criticality can be based on <code>static</code>, <code>calculated</code>, <code>DynamicThresholds</code> and <code>ConstantThresholds</code>
         *
         * <code>Legend</code> is <b>optional</b> and can be used for custom legend labels.
         * <pre>
         * MeasureValues: {
         *     'measureName': {
         *         Static: ... ,
         *         Calculated: ... ,
         *         DynamicThresholds: {
         *             ...
         *         },
         *         ConstantThresholds: {
         *             ...
         *         },
         *         Legend: {
         *             Title: string,    // (optional) fixed, localized label
         *             Positive: string, // fixed, localized label
         *             Critical: string, // fixed, localized label
         *             Negative: string, // fixed, localized label
         *             Neutral:  string  // fixed, localized label
         *         }
         *     },
         *     'measureName': { 
         *         ...
         *     }
         * }
         * </pre>
         * <ul>
         *   <li><code>static</code>
         *
         *   It indicates that the measure is always considered in the same way, for example positive.
         *
         *   The value of <code>static</code> is listed in {@link sap.chart.coloring.CriticalityType}
         *
         *   Example:
         *
         *   In this case, all 'Profit' datapoints shall use Positive semantic color and all 'Revenue' datapoints shall use Negative semantic color.
         *   <pre>
         *   var oColorings = {
         *       Criticality: {
         *           MeasureValues: {
         *               Profit: {
         *                   Static: sap.chart.ColoringType.Positive
         *               },
         *               Revenue: {
         *                   Static: sap.chart.ColoringType.Negative
         *               }
         *           }
         *       }
         *   };
         *   var oActiveColoring = {
         *       coloring: sap.chart.ColoringType.Criticality,
         *       parameters: {
         *           measure: ['Profit', 'Revenue']
         *       }
         *   };
         *   </pre>
         *   </li>
         *   <li><code>Calculated</code>
         *
         *   Criticality is calculated by the backend service.
         *
         *   The value of <code>Calculated</code> is a dimension name. The criticality of the measure of a datapoint is determined by the value of this dimension
         *   and its textProperty(if exists) will be used as legend label.
         *
         *   The possible values of this certain dimension are listed in {@link sap.chart.coloring.CriticalityType}.
         *
         *   Example:
         *
         *   In this case, the criticality of 'Profit' measure is determined by the value of 'ProfitCriticality' dimension which is calculated by backend service.
         *   <pre>
         *   var oColorings = {
         *       Criticality: {
         *           MeasureValues: {
         *               Profit: {
         *                   Calculated: 'ProfitCriticality'
         *               }
         *           }
         *       }
         *   };
         *   var oActiveColoring = {
         *       coloring: sap.chart.ColoringType.Criticality,
         *       parameters: {
         *           measure: ['Profit']
         *       }
         *   };
         *   </pre>
         *   </li>
         *   <li><code>DynamicThresholds</code>
         *
         *   Criticality is expressed with thresholds for the boundaries between negative, critical, neutral, and positive.
         *
         *   The direction of improvement for measure values is mandatory, combined with corresponding thresholds.
         *
         *   Thresholds are optional. For unassigned values, defaults are determined in this order:
         *
         *   - For DeviationRange, an omitted LowValue translates into the smallest possible number (-INF), an omitted HighValue translates into the largest possible number (+INF)
         *
         *   - For ToleranceRange, an omitted LowValue will be initialized with DeviationRangeLowValue, an omitted HighValue will be initialized with DeviationRangeHighValue
         *
         *   - For AcceptanceRange, an omitted LowValue will be initialized with ToleranceRangeLowValue, an omitted HighValue will be initialized with ToleranceRangeHighValue
         *
         *   Please refer to {@link sap.chart.coloring.ImprovementDirectionType} for detailed usage.
         *   <pre>
         *   DynamicThresholds: {
         *       ImprovementDirection: string,    // refer to sap.chart.coloring.ImprovementDirectionType for detailed definition
         *       AcceptanceRangeLowValue: string or number, // property name or number
         *       AcceptanceRangeHighValue: string or number, // property name or number
         *       ToleranceRangeLowValue: string or number, // property name or number
         *       ToleranceRangeHighValue: string or number, // property name or number
         *       DeviationRangeLowValue: string or number, // property name or number
         *       DeviationRangeHighValue: string or number, // property name or number
         *   }
         *   </pre>
         *   Example:
         *
         *   In this case, the criticality of 'Profit' measure is determined by the value of 'ProfitAcceptanceRangeLowValue', 'ProfitToleranceRangeLowValue' and 'ProfitDeviationRangeLowValue' measure calculated with improvement direction <code>'Maximize'</code>.
        *   <pre>
         *   var oColorings = {
         *       Criticality: {
         *           MeasureValues: {
         *               Profit: {
         *                    DynamicThresholds : {
         *                        ImprovementDirection: sap.chart.coloring.ImprovementDirectionType.Maximize,
         *                        AcceptanceRangeLowValue: 'ProfitAcceptanceRangeLowValue',
         *                        ToleranceRangeLowValue: 'ProfitToleranceRangeLowValue',
         *                        DeviationRangeLowValue: 'ProfitDeviationRangeLowValue'
         *                    }
         *               }
         *           }
         *       }
         *   };
         *   var oActiveColoring = {
         *       coloring: sap.chart.ColoringType.Criticality,
         *       parameters: {
         *           measure: ['Profit']
         *       }
         *   };
         *   </pre>
         *   </li>
         *   <li><code>ConstantThresholds</code>
         *
         *   Criticality is expressed with thresholds for the boundaries between negative, critical, neutral, and positive.
         *
         *   The direction of improvement for measure values is mandatory, combined with corresponding thresholds.
         *
         *   Thresholds are optional. For unassigned values, defaults are determined in this order:
         *
         *   - For DeviationRange, an omitted LowValue translates into the smallest possible number (-INF), an omitted HighValue translates into the largest possible number (+INF)
         *
         *   - For ToleranceRange, an omitted LowValue will be initialized with DeviationRangeLowValue, an omitted HighValue will be initialized with DeviationRangeHighValue
         *
         *   - For AcceptanceRange, an omitted LowValue will be initialized with ToleranceRangeLowValue, an omitted HighValue will be initialized with ToleranceRangeHighValue
         *
         *   Also Aggregation level (the visible dimensions) must be specified for providing the context for assessing the criticality.
         *
         *   Legend label is shown as value range and do not support customization in ConstantThresholds.
         *
         *   Please refer to {@link sap.chart.coloring.ImprovementDirectionType} for detailed usage. 
         *   <pre>
         *   ConstantThresholds: {
         *       ImprovementDirection: string, refer to sap.chart.coloring.ImprovementDirectionType for detailed definition
         *       AggregationLevels: [{
         *            VisibleDimensions: ['dimensionName', ...],
         *            AcceptanceRangeLowValue: Number,
         *            AcceptanceRangeHighValue:Number,
         *            ToleranceRangeLowValue: Number,
         *            ToleranceRangeHighValue: Number,
         *            DeviationRangeLowValue: Number,
         *            DeviationRangeHighValue: Number
         *       },
         *       ...]
         *   }
         *   </pre>
         *   Example:
         *
         *   In this case, the criticality of 'Profit' measure is determined by two concrete thresholds calculated with improvement direction <code>'Maximize'</code>.
         *   <pre>
         *   var oColorings = {
         *       Criticality: {
         *           MeasureValues: {
         *               Profit: {
         *                    ConstantThresholds : {
         *                        ImprovementDirection: sap.chart.coloring.ImprovementDirectionType.Maximize,
         *                        AcceptanceRangeLowValue:100,
         *                        ToleranceRangeLowValue: 80,
         *                        DeviationRangeLowValue: 60
         *                    }
         *               }
         *           }
         *       }
         *   };
         *   var oActiveColoring = {
         *       coloring: sap.chart.ColoringType.Criticality,
         *       parameters: {
         *           measure: ['Profit']
         *       }
         *   };
         *   </pre>
         *   </li>
         * </ul>
         *
         * <b>For dimension values</b>
         *
         * Criticality can be expressed by assigning values to negative, critical, and positive. Unassigned dimension values are automatically assigned to neutral.
         *
         * <code>'Values'</code> is used to specify concrete dimension value(s). <code>'Legend'</code> is used to customize legend label which is mandatory when multiple dimension values defined in <code>'Values'</code>.
         *
         * <pre> 
         * DimensionValues: { 
         *     'dimensionName': {
         *          Positive: {
         *              Values: 'dimensionValue' or ['dimensionValue', ...]
         *              Legend: string // mandatory for value array
         *          },
         *          Critical: {
         *              Values: 'dimensionValue' or ['dimensionValue', ...]
         *              Legend: string // mandatory for value array
         *          },
         *          Negative: {
         *              Values: 'dimensionValue' or ['dimensionValue', ...]
         *              Legend: string // mandatory for value array
         *          },
         *          Neutral: {
         *              Values: 'dimensionValue' or ['dimensionValue', ...]
         *              Legend: string // mandatory for value array
         *          }
         *     },
         *     'dimensionName': {
         *         ... 
         *     } 
         * }
         * </pre>
         * Example:
         *
         * In this case, the criticality of 'OrderStatus' dimension is determined by values specified to different criticality classes.
         * <pre>
         * var oColorings = {
         *     Criticality: {
         *         DimensionValues: {
         *             OrderStatus: {
         *                  Positive : {
         *                      Values: 'Finished'
         *                  },
         *                  Critical : {
         *                      Values: 'Pending'
         *                  },
         *                  Negative : {
         *                      Values: ['Stopped', 'Not Started'],
         *                      Legend: 'Alert'
         *                  },
         *                  Neutral : {
         *                      Values: ['Processing', 'Surveyed'],
         *                      Legend: 'Normal'
         *                  }
         *             }
         *         }
         *     }
         * };
         * var oActiveColoring = {
         *     coloring: sap.chart.ColoringType.Criticality,
         *     parameters: {
         *         dimension: ['OrderStatus']
         *     }
         * };
         * </pre>
         * @public
         */
        Criticality: "Criticality",
        /**
         * Emphasis is about highlighting certain data points in a chart.
         *
         * It can be defined for dimension values.
         * <pre>
         * Emphasis: {
         *     DimensionValues: {
         *         ...
         *     }
         * }
         * </pre>
         * <b>For dimension values</b>
         *
         * Highlight a specified set of values of a dimension visible in the current chart layout. The qualitative color palette is used.
         *
         * <code>'Values'</code> is used to specify dimension value(s) for highlight. <code>'Legend'</code> is used to customize legend label whose <code>'Hightlighted'</code> is mandatory when multiple dimension values defined in <code>'Values'</code>.
         * <pre>
         * DimensionValues: {
         *     'dimensionName': {
         *         Values: 'dimensionValue' or ['dimensionValue', ...],
         *         Legend: {
         *            Highlighted: string // mandatory for value array
         *            Others: string      // optional
         *         }
         *     },
         *     'dimensionName': {
         *         ...
         *     }
         * }
         * </pre>
         * Example:
         *
         * In this case, 'German' and 'France' are highlighted in 'Country' dimension with customized legend label 'Europe'.
         * <pre>
         * var oColorings = {
         *     Emphasis: {
         *         DimensionValues: {
         *             Country: {
         *                 Values: ['German', 'France']
         *                 Legend: 'Europe'
         *             }
         *         }
         *     }
         * };
         * var oActiveColoring = {
         *     coloring: sap.chart.ColoringType.Emphasis,
         *     parameters: {
         *         dimension: ['Country']
         *     }
         * };
         * </pre>
         * @public
         */
        Emphasis: "Emphasis"
    };

    return ColoringType;

}, /* bExport= */ true);
