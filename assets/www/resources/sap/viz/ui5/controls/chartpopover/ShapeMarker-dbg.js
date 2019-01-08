/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */
sap.ui.define([
        'jquery.sap.global',
        'sap/ui/core/Control',
        'sap/ui/core/theming/Parameters',
        '../common/utils/SelectionDetailUtil'
    ],
    function(jQuery, Control, Parameters, SelectionDetailUtil) {
        "use strict";

        var ShapeMarker = Control.extend('sap.viz.ui5.controls.chartpopover.ShapeMarker', {
            metadata: {
                properties: {
                    'type': 'string',
                    'color': 'string',
                    'markerSize': 'int',
                    'showWithLine': 'string',
                    'lineInfo': 'object',
                    'stroke': 'object',
                    'pattern': 'string'
                }
            },

            renderer: {
                render: function(oRm, oControl) {
                    var markerSize = oControl.getMarkerSize() ? oControl.getMarkerSize() : 10;
                    var posX = markerSize / 2,
                        posY = posX,
                        width = markerSize,
                        height = markerSize;
                    if (oControl._isShowWithLine()) {
                        posX = markerSize;
                        width = markerSize * 2;

                        markerSize = 6;
                    }
                    var props = {
                        rx: markerSize / 2,
                        ry: markerSize / 2,
                        type: oControl.getType(),
                        borderWidth: 0
                    };
                    oRm.write('<div');
                    oRm.writeClasses();
                    oRm.write('>');
                    oRm.write('<svg width=' + width + 'px height=' + height + 'px ' + 'focusable = false');
                    oRm.write('>');
                    if (oControl._isShowWithLine()) {
                        var lineInfo = oControl.getLineInfo(),
                            lineColor = Parameters.get(lineInfo.lineColor);
                        if (!lineColor) {
                            lineColor = lineInfo.lineColor ? lineInfo.lineColor : oControl.getColor();
                        }

                        if (lineInfo.lineType === 'dotted' || lineInfo.lineType === 'dash') {
                            oRm.write("<line x1 = '0' y1='" + posY + "' x2 = '" + width + "' y2 = '" + posY + "' ");
                            oRm.write("stroke-width = '2' ");
                            oRm.write(" stroke-dasharray = '5, 3' ");
                        } else if (lineInfo.lineType === 'dot') {
                            var pointCount = Math.floor(width / 2);
                            pointCount = pointCount & 1 ? pointCount : pointCount - 1;
                            if (pointCount < 3) {
                                pointCount = 3;
                            }
                            var lineWidth = width / pointCount;
                            oRm.write("<line x1 ='" + (lineWidth / 2) + "'y1='" + posY + "' x2 = '" + width + "' y2 = '" + posY + "' ");
                            oRm.write(" stroke-dasharray = ' 0," + lineWidth * 2 + "'");
                            oRm.write("stroke-width = '" + lineWidth + "'");
                            oRm.write("stroke-linecap = 'round'");
                        } else {
                            oRm.write("<line x1 = '0' y1='" + posY + "' x2 = '" + width + "' y2 = '" + posY + "' ");
                            oRm.write("stroke-width = '2' ");
                        }
                        oRm.write(" stroke = '" + lineColor + "'");
                        oRm.write("> </line>");
                    }
                    if (props.type) {
                        oRm.write("<path d = '" + SelectionDetailUtil.generateShapePath(props) + "'");
                        var pattern = oControl.getPattern();
                        if (!pattern) {
                            oRm.write(" fill = '" + oControl.getColor() + "'");
                        } else if (pattern === 'noFill') {
                            var fColor = Parameters.get('sapUiChartBackgroundColor');
                            if (fColor === 'transparent') {
                                fColor = "white";
                            }
                            oRm.write(" fill = '" + fColor + "'");
                            oRm.write(" stroke = '" + oControl.getColor() + "' stroke-width= '1px'");
                        } else {
                            oRm.write(" fill = '" + pattern + "'");
                        }


                        oRm.write(" transform = 'translate(" + posX + "," + posY + ")'");
                        oRm.write('></path>');
                    }
                    oRm.write('</svg>');
                    oRm.write('</div>');
                    oRm.writeStyles();
                }
            }
        });

        ShapeMarker.prototype._isShowWithLine = function() {
            return (this.getShowWithLine() === 'line') && this.getLineInfo();
        };



        return ShapeMarker;
    });
