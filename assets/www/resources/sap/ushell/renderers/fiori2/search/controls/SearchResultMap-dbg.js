/* global console, $, sap, window */
sap.ui.define([
    'sap/ushell/renderers/fiori2/search/SearchConfiguration'
], function(SearchConfig) {
    "use strict";

    return sap.ui.core.Control.extend('sap.ushell.renderers.fiori2.search.controls.SearchResultMap', {
        minLat: 0,
        minLon: 0,
        maxLat: 0,
        maxLon: 0,
        centerLat: 0,
        centerLon: 0,
        iNrLocations: 0,
        metadata: {
            aggregations: {
                "_map": {
                    type: "sap.ui.core.Control",
                    multiple: false,
                    visibility: "hidden"
                }
            }
        },
        urlMapClient: "/sap/hana/spatial/mapClient/map.xsjs?col={X}&row={Y}&level={LOD}",
        init: function() {

            var oMapConfig = {
                "MapProvider": [{
                    "name": "HEREMAPS",
                    "type": "terrain",
                    "description": "",
                    "tileX": "256",
                    "tileY": "256",
                    "maxLOD": "20",
                    "copyright": "Tiles Courtesy of HERE Maps",
                    "Source": [{
                        "id": "s1",
                        "url": this.urlMapClient
                    }, {
                        "id": "s2",
                        "url": this.urlMapClient
                    }]
                }],
                "MapLayerStacks": [{
                    "name": "DEFAULT",
                    "MapLayer": {
                        "name": "layer1",
                        "refMapProvider": "HEREMAPS",
                        "opacity": "0.9",
                        "colBkgnd": "RGB(255,255,255)"
                    }
                }]
            };

            var geoMap = new sap.ui.vbm.GeoMap({
                legendVisible: false,
                scaleVisible: false,
                refMapLayerStack: 'DEFAULT',
                mapConfiguration: oMapConfig,
                width: '100%',
                height: '100%',
                zoomlevel: 6,
                zoomChanged: this.zoomChanged.bind(this),
                centerChanged: this.centerChanged.bind(this)
            });

            this.setAggregation('_map', geoMap);

        },

        splitCoordinates: function(coordinates) {
            var coords = coordinates.split(';');
            return [parseFloat(coords[0]), parseFloat(coords[1])];
        },

        deg2rad: function(deg) {
            return Math.PI * deg / 180;
        },

        rad2deg: function(rad) {
            return 180 * rad / Math.PI;
        },
        getDistanceFromLatLonInKm: function(lat1, lon1, lat2, lon2) {
            var R = 6371; // Radius of the earth in km
            var dLat = this.deg2rad(lat2 - lat1);
            var dLon = this.deg2rad(lon2 - lon1);
            var a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            var d = R * c; // Distance in km
            return d;
        },
        getLatLonDiff: function(viewport) {
            var ar1, ar2, lat1, lat2, lon1, lon2, msg, medLat;
            var latDiff, lonDiff, latDiffKm, lonDiffKm;
            ar1 = viewport.upperLeft.split(";");
            ar2 = viewport.lowerRight.split(";");
            lat1 = parseFloat(ar1[1], 10);
            lat2 = parseFloat(ar2[1], 10);
            medLat = (lat1 + lat2) / 2;
            latDiff = lat1 - lat2;
            latDiffKm = latDiff * 111;
            latDiffKm = Math.floor(latDiffKm); //roughly how high in km is the window

            lon1 = parseFloat(ar1[0], 10);
            lon2 = parseFloat(ar2[0], 10);
            if ((lon1 < 0 && lon2 > 0) | (lon1 > 0 && lon2 < 0)) {
                lonDiff = Math.abs(lon1) + Math.abs(lon2);
            } else {
                lonDiff = Math.abs(lon2 - lon1);
            }
            lonDiffKm = this.getDistanceFromLatLonInKm(medLat, lon1, medLat, lon2); //roughly how wide in km is the window
            lonDiffKm = Math.floor(lonDiffKm);

            msg = "lat= " + latDiff + " (" + latDiffKm + " km); lon= " + lonDiff + " (" + lonDiffKm + " km)";
            return msg;

        },
        calculateZoomLevel: function(iScreenWidth, iKm) {
            var equatorLength = 40075004; // in meters
            var widthInPixels = iScreenWidth;
            var metersPerPixel = equatorLength / 256;
            var zoomLevel = 0;
            while ((metersPerPixel * widthInPixels) > (iKm * 1000)) {
                metersPerPixel = metersPerPixel / 2.2;
                zoomLevel = zoomLevel + 1;
                //var n = 2;
            }
            console.log('zoomLevel calc: ' + zoomLevel);
            return zoomLevel;
        },
        loadObjects: function(oControl) {
            var that = this;
            //var oResults = that.getModel().oData.results;
            var oResults = that.getModel().oData.origBoResults.elements
            var oResultItem, oLoc4326, sTitle, aCoordinates, lon, lat, spot;
            //var sAddress, iAddress;
            var spotList = new sap.ui.vbm.Containers();
            var iNrLocations = 0;
            var minLon, maxLon, minLat, maxLat;


            //find index locations of data in listing tree

            var cnt = 0;
            for (var key in oResults) {
                if (!oResults.hasOwnProperty(key)) continue;

                oResultItem = oResults[key];
                if (!oResultItem.LOC_4326) continue;
                oLoc4326 = oResultItem.LOC_4326;

                for (var key2 in oResultItem) {
                    if (!oResultItem.hasOwnProperty(key2)) continue;
                    var oAttribute = oResultItem[key2];
                    sTitle = "";
                    var titleFound = false;
                    if (oAttribute.$$MetaData$$) {
                        var arPresentationusage = oAttribute.$$MetaData$$.presentationUsage;
                        for (var j = 0; j < arPresentationusage.length; ++j) {
                            if (arPresentationusage[j] == "Title") {
                                sTitle = oAttribute.value;
                                sTitle = sTitle.replace(/<[^>]*>/g, ""); //remove html
                                titleFound = true;
                                break;
                            }
                        }
                    }
                    if (titleFound) {
                        break;
                    }
                }


                aCoordinates = null;
                try {
                    aCoordinates = JSON.parse(oLoc4326.value).coordinates;
                } catch (e) {
                    //do nothing
                }
                if (!aCoordinates || aCoordinates.length === 0) {
                    continue;
                }
                iNrLocations++;
                lon = aCoordinates[0];
                lat = aCoordinates[1];
                if (!lat || !lon) {
                    continue;
                }

                cnt++;
                if (cnt === 1) {
                    minLon = lon;
                    maxLon = lon;
                    minLat = lat;
                    maxLat = lat;
                } else {
                    if (lon < minLon) {
                        minLon = lon;
                    }
                    if (lon > maxLon) {
                        maxLon = lon;
                    }
                    if (lat < minLat) {
                        minLat = lat;
                    }
                    if (lat > maxLat) {
                        maxLat = lat;
                    }
                }



                that.minLon = minLon;
                that.maxLon = maxLon;
                that.minLat = minLat;
                that.maxLat = maxLat;

                var oText = new sap.m.Button({
                    text: sTitle //,
                    //tooltip: sAddress
                });
                var oButton0 = new sap.m.Button({
                    icon: "sap-icon://map",
                    type: sap.m.ButtonType.Emphasized
                });

                var oSpot = new sap.ui.layout.HorizontalLayout({
                    content: [oButton0, oText]
                });


                spot = new sap.ui.vbm.Container({
                    position: lon + ';' + lat + ';0',
                    item: oSpot,
                    alignment: 6
                });
                spotList.addItem(spot);

            }
            that.iNrLocations = iNrLocations;
            console.log("++++++");
            console.log("number of locations: " + that.iNrLocations);

            that.getAggregation('_map').removeAllVos();
            that.getAggregation('_map').addVo(spotList);

            //that.setVisualFrame();

            that.centerMap();
            var parameters = SearchConfig.prototype.parseUrlParameters();
            for (var parameter in parameters) {
                if (parameter === 'box' && parameters[parameter] !== "false") {
                    that.showBoundariesAndCenter();
                }
            }


        },
        centerMap: function() {
            var that = this;
            that.centerLon = that.minLon + (that.maxLon - that.minLon) / 2;
            that.centerLat = that.minLat + (that.maxLat - that.minLat) / 2;

            //that.centerLat = that.centerLat - (that.centerLat * 0.0006); //correction cause center of map is too high by a bit


            console.log("centerLat, centerLon: " + that.centerLat + ";" + that.centerLon);
            console.log("NB center of Germany: 51.126586;10.472796");
            that.getAggregation('_map').setCenterPosition(that.centerLon + ";" + that.centerLat);

        },
        setVisualFrame: function() {
            var that = this;
            var oVisFrame = {};

            oVisFrame.minLon = that.minLon * 0.5;
            oVisFrame.maxLon = that.maxLon * 1.2;
            oVisFrame.minLat = that.minLat * 0.8;
            oVisFrame.maxLat = that.maxLat * 1.2;
            //oVisFrame.minLOD = 1.0;
            //oVisFrame.maxLOD = 20.0;


            that.getAggregation('_map').setVisualFrame(oVisFrame);
        },
        showBoundariesAndCenter: function() {
            var that = this;
            var center = new sap.ui.vbm.Spots({
                items: [
                    new sap.ui.vbm.Spot({
                        type: "Error",
                        text: "center",
                        position: (that.centerLon + " ;  " + that.centerLat + ";0") //,
                        //click: onClick
                    }),
                    new sap.ui.vbm.Spot({
                        type: "Error",
                        text: "TLeft",
                        position: (that.minLon + " ;  " + that.maxLat + ";0") //,
                        //click: onClick
                    }),
                    new sap.ui.vbm.Spot({
                        type: "Error",
                        text: "TRight",
                        position: (that.maxLon + " ;  " + that.maxLat + ";0") //,
                        //click: onClick
                    }),
                    new sap.ui.vbm.Spot({
                        type: "Error",
                        text: "BLeft",
                        position: (that.minLon + " ;  " + that.minLat + ";0") //,
                        //click: onClick
                    }),
                    new sap.ui.vbm.Spot({
                        type: "Error",
                        text: "BRight",
                        position: (that.maxLon + " ;  " + that.minLat + ";0") //,
                        //click: onClick
                    })
                ]
            });

            that.getAggregation('_map').addVo(center);
        },
        renderer: function(oRm, oControl) {
            oControl.loadObjects(oControl);
            oRm.write('<div ');
            oRm.writeControlData(oControl);
            oRm.addClass('sapUshellSearchResultMap');
            oRm.writeClasses();
            oRm.write('>');

            if (oControl.iNrLocations === 0) {
                var oErrorText = new sap.m.Label({
                    text: "No coordinates available to display on a map."
                });
                oRm.renderControl(oErrorText);
            } else {
                oRm.renderControl(oControl.getAggregation('_map'));
            }

            oRm.write('</div>');
        },
        zoomChanged: function(event) {
            var viewport = event.getParameter('viewportBB');
            //var centerPoint = event.getParameter('centerPoint');
            var zoomLevel = event.getParameter('zoomLevel');
            console.log("-----");
            //console.log('zoomLevel: ' + zoomLevel);

            //console.log('zoomChanged viewport', JSON.stringify(viewport), ", zoomLevel: " + zoomLevel);
            console.log('zoomLevel ', zoomLevel, 'LatLonDiff:', this.getLatLonDiff(viewport));
            //console.log("number of locations: " + event.getSource().getModel().oData.results.length);
            //this.loadObjects(filter);
            //var oControl = event.getSource();
            //this.loadObjects(oControl);
        },

        centerChanged: function(event) {
            //var viewport = event.getParameter('viewportBB');
            var centerPoint = event.getParameter('centerPoint');
            //var zoomLevel = event.getParameter('zoomLevel');
            console.log("-----");
            console.log('centerPoint: ' + centerPoint);

            //console.log('centerChanged viewport', JSON.stringify(viewport), ", centerPoint: " + centerPoint, ", zoomLevel: " + //zoomLevel);
            //console.log('centerChanged LatLonDiff:', this.getLatLonDiff(viewport));
            //console.log("number of locations: " + event.getSource().getModel().oData.results.length);
            //var filter = this.createPolygonFromViewport(viewport);
            //this.loadObjects(filter);
            //var oControl = event.getSource();
            //this.loadObjects(oControl);
        },
        setZoomLevelAfterRendering: function(iScreenWidth) {
            var that = this;

            var iKm = this.getDistanceFromLatLonInKm(this.minLat, this.minLon, this.maxLat, this.maxLon);
            iKm = Math.floor(iKm);
            console.log("BOX minLat, minLon, maxLat, maxLon: ", this.minLat, this.minLon, this.maxLat, this.maxLon);
            console.log('iKm for zoomLevel calc: ' + iKm);
            console.log('iScreenWidth for zoomLevel calc: ' + iScreenWidth);
            var zoomLevelCalc = this.calculateZoomLevel(iScreenWidth, iKm);
            zoomLevelCalc = zoomLevelCalc - 1;

            if (iKm > 599 && iKm < 701) {
                zoomLevelCalc = 6;
            }

            if (this.iNrLocations === 1) {
                zoomLevelCalc = 9;
            }
            window.setTimeout(function() {
                that.getAggregation('_map').setZoomlevel(zoomLevelCalc);
            }, 200);
        },
        setZoomLevelAfterRenderingOld: function(iScreenWidth) {
            var that = this;

            var iKm = this.getDistanceFromLatLonInKm(this.minLat, this.minLon, this.maxLat, this.maxLon);
            iKm = Math.floor(iKm);
            console.log("BOX minLat, minLon, maxLat, maxLon: ", this.minLat, this.minLon, this.maxLat, this.maxLon);
            console.log('iKm for zoomLevel calc: ' + iKm);
            console.log('iScreenWidth for zoomLevel calc: ' + iScreenWidth);
            var zoomLevelCalc = this.calculateZoomLevel(iScreenWidth, iKm);
            if (zoomLevelCalc > 7) {
                //zoomLevelCalc = zoomLevelCalc - 2;
            }

            if (this.iNrLocations === 1) {
                this.getAggregation('_map').setZoomlevel(9);
            } else {
                window.setTimeout(function() {
                    that.getAggregation('_map').setZoomlevel(zoomLevelCalc);
                }, 200);
            }
        },
        resizeMap: function(oEvent) {
            var h = $(".sapUshellSearchResultMap").parent().parent().parent().css("height");
            h = parseInt(h, 10);
            h = 0.85 * h;
            h = "" + h + "px";
            $(".sapUshellSearchResultMap").css("height", h);
            $(".sapUshellSearchResultMap").css("vertical-align", "middle");

            $(".sapUshellResultListMoreFooter").hide();

        },
        onAfterRendering: function(oEvent) {
            var that = this;
            //ensure that the containing object has a senisble height (not 0!)
            that.resizeMap();
            that.centerMap();

            window.onresize = that.resizeMap;

            //set zoom level;
            var id = $(".sapUshellSearchResultMap")[0].id;
            var iScreenWidth = $("#" + id).width();
            iScreenWidth = iScreenWidth * 0.8;
            that.setZoomLevelAfterRendering(iScreenWidth);
        }
    });
});
