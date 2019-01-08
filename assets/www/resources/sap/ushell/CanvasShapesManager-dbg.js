sap.ui.define(function() {
	"use strict";

    /*Module for drawing background shpes and performing animations on user events
    *   Draws three shapes, each shape is defined by its center, which is set randomly in predefined range on the screen ,
    *  3 anchor points that define 3 bezier curves to be set between them.
    *  Control points are calculated randomly with certain restrictions - two control  points for each pair of anchor points.
    *  Then, the cubic bezier curve is drawn by canvas, while each pair of anchors are passed as start and end points and their corresponding conrol points are passed as control points.*/

    /* Point object for controlling the points on canvas */

    var  Point = function (x, y){
        this.x = x || 0;
        this.y = y || 0;

    };
    Point.prototype.getDistance = function (point2) {
        var x = this.x - point2.x;
        var y = this.y - point2.y;
        return Math.floor(Math.sqrt(x * x + y * y));
    };
    Point.prototype.getSegment = function (oCenter) {

        if (this.x <= oCenter.x && this.y <= oCenter.y) {
            return 1;
        }
        if (this.x <= oCenter.x && this.y >= oCenter.y) {
            return 2;
        }
        if (this.x >= oCenter.x && this.y >= oCenter.y) {
            return 3;
        }
        if (this.x >= oCenter.x && this.y <= oCenter.y) {
            return 4;
        }
    };

    Point.prototype.offset = function (iOffsetX, iOffsetY) {
        this.x = this.x + iOffsetX;
        this.y = this.y + iOffsetY;
    };

    var Range = function (iXmin, iXmax, iYmin, iYmax) {
        this.x = {
            min : iXmin,
            max : iXmax
        };
        this.y = {
            min : iYmin,
            max : iYmax
        };
    };

    var canvasWidth = (window.innerWidth > 0) ? window.innerWidth : screen.width;
    var canvasHeight = (window.innerHeight > 0) ? window.innerHeight : screen.height;
    var centerRanges = {
            cpr1 : new Range(0, canvasWidth / 4, 0, canvasHeight / 4),

            cpr2 : new Range( canvasWidth / 2, canvasWidth, 0, canvasHeight / 4),

            cpr3 : new Range(canvasWidth / 4, 3 * canvasWidth / 4, canvasHeight * 3 / 4, canvasHeight)
        };
    var requestAnimationFrame =
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        function(callback) {
            return setTimeout(callback, 1);
        };

    var manager = function () {
        this.init();
    };
    manager.prototype = {

        radiusRange : {
            min : 800,
            max : 900
        },

        init : function () {
            this.Id = "shell-shapes";
            var cprs = {cpr1: centerRanges.cpr1,cpr2: centerRanges.cpr2,cpr3: centerRanges.cpr3},
                radius,
                center,
                squarePoints ,
                bezierCurves,
                isMobile = sap.ui.Device.system.phone;
            this.shapes = [];

            var cpr;
            //create circle shapes
            for (cpr in cprs) {
                radius = Math.random(this.radiusRange.max - this.radiusRange.min) + this.radiusRange.min;
                center = this.getRandomPoint(cprs[cpr]);
                squarePoints = this._getSquarePoints(radius, center);
                bezierCurves = this._calculatebezierCurves(radius, squarePoints);
                this.shapes.push({bezierCurves: bezierCurves, centerPoint: center});
            }
            //make the shapes amorphous
            for (var shape in this.shapes) {
                var values = this._generateRandomAmorphousShapeValues();
                this.shapes[shape] = this.makeAmorphousShape(this.shapes[shape], values.edge0.edgeNum, values.edge0.xOffSet, values.edge0.yOffSet, values.edge0.xStretch);
                this.shapes[shape] = this.makeAmorphousShape(this.shapes[shape], values.edge1.edgeNum, values.edge1.xOffSet, values.edge1.yOffSet, values.edge1.xStretch);
            }

            sap.ui.Device.resize.attachHandler(this.resizeHandler, this);
            if (!isMobile) {
                sap.ui.getCore().getEventBus().subscribe("launchpad", "afterSwitchState", this.startAnimation, this);
            }
        },
        /*return an object with random values to be used in makeAmorphousShape function*/
        _generateRandomAmorphousShapeValues: function (){
            var values = {
                edge0: {
                    edgeNum: 0,
                    xOffSet: 0,
                    yOffSet: 0,
                    xStretch: 0// currently not in use
                },
                edge1: {
                    edgeNum: 0,
                    xOffSet: 0,
                    yOffSet: 0,
                    xStretch: 0 // currently not in use
                }
                };

            var num = this._getRandomInt(0,3);
            for (var edge in values) {
                values[edge].edgeNum = num;
                values[edge].xOffSet = this._getRandomInt(200,400);
                values[edge].yOffSet = this._getRandomInt(-200,-400);
                num += this._getRandomInt(0,1) < 0.5 ? -1 : 1;
                if (num === -1) {
                    num = 3;
                }
                if (num === 4){
                    num = 0;
                }
            }
            // In probability of 50% we set random edge x and y values
            num = this._getRandomInt(0,1);
            if (num < 0.5) {
                num = num < 0.25 ? 0 : 1;
                values["edge" + num].xStretch = this._getRandomInt(0,200);
            }

            return values;
        },
        getPoint : function (x, y) {
            return new Point(x, y);
        },
        getRandomPoint : function (range) {
            var x = Math.floor(Math.random() * (range.x.max - range.x.min) + range.x.min),
                y = Math.floor(Math.random() * (range.y.max - range.y.min) + range.y.min);
            return new Point(x, y);
        },

        resizeHandler: function (){
            var canvas = jQuery('#' + this.Id)[0];
            if (canvas) {
                canvas.width  = window.innerWidth;
                canvas.height = window.innerHeight;
                this.drawShapes();
            }
        },

        enableAnimationDrawing: function (bEnableAnimationDrawing) {
            this._enableDrawing = bEnableAnimationDrawing;
        },

        /*
            Callback which is invoked on the user events.
            Currently called on meArea and notifications opening.
            The base offset is calculated here according to which area is going to be open.
         */
        startAnimation: function (evt, ctx, oData) {
            if (!this._enableDrawing) {
                return;
            }
            var duration = 2500;
            var translateOffset,
                current1 = this.shapes[0].centerPoint.x,
                current2 = this.shapes[1].centerPoint.x,
				current3 = this.shapes[2].centerPoint.x,
                direction,
                rem = parseFloat(jQuery("body").css("font-size")),
                sTo = oData.getParameter('to'),
                sFrom = oData.getParameter('from');

            if (!this.leftOffset || !this.rigthOffset) {
                this.setTranslateOffset();
            }

            if(sap.ui.getCore().getConfiguration().getRTL()){
                if(sTo === "RightCenter"){
                    sTo = "LeftCenter";
                }else if(sTo === "LeftCenter"){
                    sTo = "RightCenter";
                }


                if(sFrom === "RightCenter"){
                    sFrom = "LeftCenter";
                }else if(sFrom === "LeftCenter"){
                    sFrom = "RightCenter";
                }
            }

            if (sTo === "RightCenter") {
                direction = 1;
                translateOffset = this.rigthOffset * rem;
            }

            if (sTo === "LeftCenter") {
                direction = -1;
                translateOffset = this.leftOffset * rem;
            }
            if (sTo === "Center") {
                if (sFrom === "RightCenter") {
                    direction = -1;
                    translateOffset = this.rigthOffset * rem;
                }
                if (sFrom === "LeftCenter") {
                    direction = 1;
                    translateOffset = this.leftOffset * rem;
                }

            }

            this.animateTranslation(current1, current2, current3, translateOffset, duration, direction);

        },
        setTranslateOffset: function () {
            var oTheming = sap.ui.core.theming.Parameters,
                sLeftViewPortWidth,
                sRightViewPortWidth;

            if (window.matchMedia('(min-width: 1920px)').matches) {
                sLeftViewPortWidth = oTheming.get('sapUshellLeftViewPortWidthL');
                sRightViewPortWidth = oTheming.get('sapUshellRightViewPortWidthXXL');
            } else if (window.matchMedia('(min-width: 1600px)').matches) {
                sLeftViewPortWidth = oTheming.get('sapUshellLeftViewPortWidthM');
                sRightViewPortWidth = oTheming.get('sapUshellRightViewPortWidthXL');
            } else if (window.matchMedia('(min-width: 1440px)').matches) {
                sLeftViewPortWidth = oTheming.get('sapUshellLeftViewPortWidthM');
                sRightViewPortWidth = oTheming.get('sapUshellRightViewPortWidthL');
            } else if (window.matchMedia('(min-width: 1280px)').matches) {
                sLeftViewPortWidth = oTheming.get('sapUshellLeftViewPortWidthM');
                sRightViewPortWidth = oTheming.get('sapUshellRightViewPortWidthM');
            } else if (window.matchMedia('(min-width: 1024px)').matches) {
                sLeftViewPortWidth = oTheming.get('sapUshellLeftViewPortWidthXS');
                sRightViewPortWidth = oTheming.get('sapUshellRightViewPortWidthS');
            } else if (window.matchMedia('(min-width: 601px)').matches) {
                sLeftViewPortWidth =  oTheming.get('sapUshellLeftViewPortWidthXS');
                sRightViewPortWidth = oTheming.get('sapUshellRightViewPortWidthXS');
            } else if (window.matchMedia('(max-width : 600px)').matches) {
                sLeftViewPortWidth = (jQuery(window).width() / parseFloat(jQuery("body").css("font-size"))) + "";
                sRightViewPortWidth = (jQuery(window).width() / parseFloat(jQuery("body").css("font-size"))) + "";
            }
            this.leftOffset = parseInt(sLeftViewPortWidth.replace("rem", ""), 10);
            this.rigthOffset = parseInt(sRightViewPortWidth.replace("rem", ""), 10);
        },
        /*
            All the calculations required in order to move the shapes into desired positions are made here
         */
        animateTranslation: function (current1, current2, current3, translateX, duration, direction) {
            var start = new Date().getTime();
            var end = start + duration,
                distance3 = translateX,
                distance1 = translateX / 4,
                distance2 = translateX / 2,
                offset1,
                offset2,
                offset3,
                that = this;

            var step = function() {

                //Divide the duration time into segments,
                //Progress represents an easing factor which is used to calculate current shape coordinates.
                //Ease out with factor 5 is used to calculate the easing
                var timestamp = new Date().getTime(),
                    progress = 1 - Math.pow(1 - Math.min((duration - (end - timestamp)) / duration, 1), 5);

                offset1 = current1 + direction * distance1 * progress;
                offset2 = current2 + direction * distance2 * progress;
				offset3 = current3 + direction * distance3 * progress;
                that.updateShapes(offset1, offset2, offset3);
                that.drawShapes();

                //Repeat the step until we reached the required offset.
                if (progress < 1) {
                    requestAnimationFrame(step);
                }
            };
            return step();
        },
        /* Update the shapes properties according to current translation value,
           This method is called from animation step segment before the drawShapes method in ordr to change the actual location of
           the shape before it is redrawed
         */
        updateShapes: function (offset1, offset2, offset3) {
            var that = this,
                delta1 = this.shapes[0].centerPoint.x - offset1,
                delta2 = this.shapes[1].centerPoint.x - offset2,
                delta3 = this.shapes[2].centerPoint.x - offset3;

            this.shapes[0].centerPoint = new Point(offset1, this.shapes[0].centerPoint.y);
            this.shapes[1].centerPoint = new Point(offset2, this.shapes[1].centerPoint.y);
            this.shapes[2].centerPoint = new Point(offset3, this.shapes[2].centerPoint.y);

            this.shapes[0].bezierCurves.forEach(function (oCurve, iIndex) {
                that.shapes[0].bezierCurves[iIndex].controlPoint1 = new Point(oCurve.controlPoint1.x + delta1, oCurve.controlPoint1.y);
                that.shapes[0].bezierCurves[iIndex].controlPoint2 = new Point(oCurve.controlPoint2.x + delta1, oCurve.controlPoint2.y);
                that.shapes[0].bezierCurves[iIndex].startPoint = new Point(oCurve.startPoint.x + delta1, oCurve.startPoint.y);
                that.shapes[0].bezierCurves[iIndex].endPoint = new Point(oCurve.endPoint.x + delta1, oCurve.endPoint.y);
            });
            this.shapes[1].bezierCurves.forEach(function (oCurve, iIndex) {
                that.shapes[1].bezierCurves[iIndex].controlPoint1 = new Point(oCurve.controlPoint1.x + delta2, oCurve.controlPoint1.y);
                that.shapes[1].bezierCurves[iIndex].controlPoint2 = new Point(oCurve.controlPoint2.x + delta2, oCurve.controlPoint2.y);
                that.shapes[1].bezierCurves[iIndex].startPoint = new Point(oCurve.startPoint.x + delta2, oCurve.startPoint.y);
                that.shapes[1].bezierCurves[iIndex].endPoint = new Point(oCurve.endPoint.x + delta2, oCurve.endPoint.y);
            });
            this.shapes[2].bezierCurves.forEach(function (oCurve, iIndex) {
                that.shapes[2].bezierCurves[iIndex].controlPoint1 = new Point(oCurve.controlPoint1.x + delta3, oCurve.controlPoint1.y);
                that.shapes[2].bezierCurves[iIndex].controlPoint2 = new Point(oCurve.controlPoint2.x + delta3, oCurve.controlPoint2.y);
                that.shapes[2].bezierCurves[iIndex].startPoint = new Point(oCurve.startPoint.x + delta3, oCurve.startPoint.y);
                that.shapes[2].bezierCurves[iIndex].endPoint = new Point(oCurve.endPoint.x + delta3, oCurve.endPoint.y);
            });

        },
        /*Parameters:
         shape: the CircleShape that will become amorphous
         startPoint: start point that it's controlPoints should be rotated
         xOffSet: x increament value for closest controlPoints to start point
         yOffSet: y increament value for closest controlPoints to start point
         x: the x increament for right controlPoints
         y: the y increament for right controlPoint*/
        makeAmorphousShape: function(shape, startPoint, xOffSet, yOffSet, xStretch) {
            var controlPoint1,
                controlPoint2,
                controlPoints;

            switch (startPoint) {
                case 0:
                    controlPoint1 = shape.bezierCurves[0].controlPoint1;
                    controlPoint2 = shape.bezierCurves[3].controlPoint2;
                    controlPoints = this._rotatePoints(xOffSet, yOffSet, controlPoint1, controlPoint2);
                    //controlPoints[0] = this._stretchCircle(controlPoint1,  shape.bezierCurves[0].startPoint, xStretch);
                    shape.bezierCurves[0].controlPoint1 = controlPoints[0];
                    shape.bezierCurves[3].controlPoint2 = controlPoints[1];
                    break;
                case 1:
                    controlPoint1 = shape.bezierCurves[0].controlPoint2;
                    controlPoint2 = shape.bezierCurves[1].controlPoint1;
                    controlPoints = this._rotatePoints(xOffSet, yOffSet, controlPoint1, controlPoint2);
                    //controlPoints[0] = this._stretchCircle(controlPoint1,  shape.bezierCurves[1].startPoint, xStretch);
                    shape.bezierCurves[0].controlPoint2 = controlPoints[0];
                    shape.bezierCurves[1].controlPoint1 = controlPoints[1];
                    break;
                case 2:
                    controlPoint1 = shape.bezierCurves[1].controlPoint2;
                    controlPoint2 = shape.bezierCurves[2].controlPoint1;
                    controlPoints = this._rotatePoints(xOffSet, yOffSet, controlPoint1, controlPoint2);
                    //controlPoints[0] = this._stretchCircle(controlPoint1,  shape.bezierCurves[2].startPoint, xStretch);
                    shape.bezierCurves[1].controlPoint2 = controlPoints[0];
                    shape.bezierCurves[2].controlPoint1 = controlPoints[1];
                    break;
                case 3:
                    controlPoint1 = shape.bezierCurves[2].controlPoint2;
                    controlPoint2 = shape.bezierCurves[3].controlPoint1;
                    controlPoints = this._rotatePoints(xOffSet, yOffSet, controlPoint1, controlPoint2);
                    //controlPoints[0] = this._stretchCircle(controlPoint1,  shape.bezierCurves[3].startPoint, xStretch);
                    shape.bezierCurves[2].controlPoint2 = controlPoints[0];
                    shape.bezierCurves[3].controlPoint1 = controlPoints[1];
                    break;
            }

            return shape;
        },
        /*Increment controlPoint1 coordinates by given offsets, and decrement controlPoint2 coordinates by same off set values. This creates
        * rotation effect of the line that defined by the two given points*/
        _rotatePoints: function (xOffSet, yOffSet, controlPoint1, controlPoint2) {
            var x,
                y,
                controlsPoints = [];

            x = controlPoint1.x + xOffSet;
            y = controlPoint1.y + yOffSet;
            controlsPoints.push(new Point(x,y));

            x = controlPoint2.x - xOffSet;
            y = controlPoint2.y - yOffSet;
            controlsPoints.push(new Point(x,y));

            return controlsPoints;
        },
        //curently not in use
        //_stretchCircle: function (controlPoint1, startPoint, xStretch) {
        //    if  (Math.abs(controlPoint1.x - startPoint.x) < 1) {
        //        return controlPoint1;
        //    }
        //    var m = -1 * (controlPoint1.y - startPoint.y) / (controlPoint1.x - startPoint.x),
        //        b = controlPoint1.y - m*controlPoint1.x,
        //        newX = controlPoint1.x + xStretch,
        //        newY = newX*m + b;
        //
        //    return new Point(newX, newY);
        //},
        /* return an array of four points. these points are points on the square circumference. Each point is on the middle between two corners of the square that blocks the circle
        * that defined by the given parameters
        * radius: the radius of the circle
        * center: the center point coordinates of the cirecle*/
        _getSquarePoints: function(radius,center){
            var squarePoints = [];
            squarePoints[0] = new Point(center.x + radius, center.y);
            squarePoints[1] = new Point(center.x, center.y - radius);
            squarePoints[2] = new Point(center.x - radius, center.y);
            squarePoints[3] = new Point(center.x,center.y + radius);
            return squarePoints;
        },

        /**
         * Returns a random integer between min (inclusive) and max (inclusive)
         * Using Math.round() will give you a non-uniform distribution!
         */
        _getRandomInt: function (min, max) {
            if (min == 0 && max == 1) {
                return Math.random();
            }
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        /* calculate bezierCurves of a circle with given radius
        * radius: the circle radius
        * squarePoints: the square tangent points that blocks the circle (which is the center of the edges)*/
        _calculatebezierCurves:function(radius, squarePoints){
            var bezierCurves = [];
            var controlPoint1;
            var controlPoint2;
            var endPoint,
                startPoint;

            //Each curve is defined by two control points, start point and and point. In order to create a circle we need to use four curves.
            //Each curve start point is on the circle circumference. Also, each curve endPoint is the next curve (counter clock wise) startPoint.
            //Each curve controlPoint1 is on the square circumference, and is on the middle between the startPoint and the closest square corner (counter clock wise)
            //Each curve controlPoint2 is on the square circumference, and is on the middle between the endPoint and the closest square corner (clock wise)

            startPoint = squarePoints[0];
            endPoint = squarePoints[1];
            controlPoint1 = new Point(startPoint.x,startPoint.y - radius / 2);
            controlPoint2 = new Point(startPoint.x - radius / 2,startPoint.y - radius);
            bezierCurves.push({startPoint: startPoint, endPoint: endPoint, controlPoint1: controlPoint1, controlPoint2:controlPoint2});

            startPoint = squarePoints[1];
            endPoint = squarePoints[2];
            controlPoint1 = new Point(startPoint.x - radius / 2, startPoint.y);
            controlPoint2 = new Point(startPoint.x - radius, startPoint.y + radius / 2);
            bezierCurves.push({startPoint: startPoint, endPoint: endPoint, controlPoint1: controlPoint1, controlPoint2:controlPoint2});

            startPoint = squarePoints[2];
            endPoint = squarePoints[3];
            controlPoint1 = new Point(startPoint.x,startPoint.y + radius / 2);
            controlPoint2 = new Point(startPoint.x + radius / 2, startPoint.y + radius);
            bezierCurves.push({startPoint: startPoint, endPoint: endPoint, controlPoint1: controlPoint1, controlPoint2:controlPoint2});

            startPoint = squarePoints[3];
            endPoint = squarePoints[0];
            controlPoint1 = new Point(startPoint.x + radius / 2,startPoint.y);
            controlPoint2 = new Point(startPoint.x + radius, startPoint.y - radius / 2);
            bezierCurves.push({startPoint: startPoint, endPoint: endPoint, controlPoint1: controlPoint1, controlPoint2:controlPoint2});

            return bezierCurves;
        } ,

        drawShapes: function () {
            var canvas = jQuery('#' + this.Id)[0],
                sBGColor = sap.ui.core.theming.Parameters.get("sapUshellShellBackgroundShapesColor");

            if (canvas && canvas.getContext) {
                var context = canvas.getContext('2d'),
                    startPoint,
                    endPoint,
                    controlPoint1,
                    controlPoint2;

                context.clearRect(0, 0, canvasWidth * 2, canvasHeight * 2);

                if (sBGColor) {
                    for (var j = 0; j < this.shapes.length; j++) {
                        context.beginPath();
                        startPoint = this.shapes[j].bezierCurves[0].startPoint;
                        context.moveTo(startPoint.x, startPoint.y);
                        for (var i = 0; i < this.shapes[j].bezierCurves.length; i++) {
                            endPoint = this.shapes[j].bezierCurves[i].endPoint;
                            controlPoint1 = this.shapes[j].bezierCurves[i].controlPoint1;
                            controlPoint2 = this.shapes[j].bezierCurves[i].controlPoint2;
                            context.bezierCurveTo(Math.floor(controlPoint1.x), Math.floor(controlPoint1.y), Math.floor(controlPoint2.x), Math.floor(controlPoint2.y), Math.floor(endPoint.x), Math.floor(endPoint.y));
                        }
                        context.closePath();
                        context.fillStyle = sBGColor;
                        context.fill();
                    }
                }
            }
        }
    };

    var CanvasShapesManager = new manager();

	return CanvasShapesManager;
}, /* bExport= */ true);
