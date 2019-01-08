/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/gantt/misc/Format", "sap/gantt/config/TimeHorizon"], function (Format, TimeHorizon) {
	"use strict";

	var Utility = {};

	/*
	 * This method will do necessary check when you assign parameters,
	 * the check includes:
	 * 1. type check - if type of inputParam does not match defaultParam,
	 * defaultParam will be returned;
	 * 2. value check - if inputParam is undefined,
	 * defaultParam will be returned.
	 */
	Utility.assign = function (inputParam, defaultParam) {
		if (typeof (inputParam) !== typeof (defaultParam)) {
			return defaultParam;
		} else if ((typeof inputParam === "undefined") || inputParam === null) {
			return defaultParam;
		} else {
			return inputParam;
		}
	};

	/*
	 * for JSON object
	 */
	Utility.assignDeep = function (inputObj, defaultObj) {
		if (!inputObj && !defaultObj) {
			return null;
		} else if (inputObj && !defaultObj) {
			return inputObj;
		} else if (!inputObj && defaultObj) {
			return defaultObj;
		} else if (typeof (inputObj) === "object" && typeof (defaultObj) === "object") {
			var retVal = inputObj;
			for (var attr in defaultObj) {
				if (typeof (retVal[attr]) !== "boolean" && !retVal[attr]) {
					retVal[attr] = defaultObj[attr];
				} else if (typeof (defaultObj[attr]) === "object" && typeof (retVal[attr]) === "object") {
					retVal[attr] = this.assignDeep(retVal[attr], defaultObj[attr]);
				}
			}
			return retVal;
		} else {
			return inputObj;
		}
	};

	/**
	 * This method is used to generate an UID for each row object or shapes.
	 * The UID structure will be like this PATH:objectId|DATA:objectType[id]|SCHEME:objectScheme,
	 * For Row object, the uid should contain PATH part and SCHEME part. for shape object,  the uid
	 * should contain PATH part and DATA part, usually shape object doesn't have SCHEME part and row
	 * object doesn't have DATA part.
	 *
	 * @param {array} [aDataArray] A data array to generate UID.
	 * @param {object} [oObjectTypesMap] A map for object configuration information.
	 * @param {array} [aShapeDataNames] An array stored the names of shape data.
	 * @param {string} [parentUid] The parent uid for children uid generation.
	 * @param {string} [sRowIdName] The attribute name that will serves as the row 'id' in user's data.
	 * @private
	 */
	Utility.generateRowUid = function (aDataArray, oObjectTypesMap, aShapeDataNames, parentUid, sRowIdName) {
		jQuery.each(aDataArray, function (k, v) {
			v.uid = v.id;
			if (parentUid) {
				v.uid = parentUid + "|" + v.uid;
			} else if (v.bindingObj && v.bindingObj.findNode) {
				var oNode = v.bindingObj.findNode(v.rowIndex);
				while (oNode.parent && oNode.level > 0) {
					oNode = oNode.parent;
					v.uid = oNode.context.getObject()[sRowIdName] + "|" + v.uid;
				}
			}
			// if v.index is not available, use -1 instead
			var index = (v.index === undefined) ? -1 : v.index;

			// if chartScheme is not available, use empty string
			var chartScheme = (v.chartScheme === undefined) ? "" : v.chartScheme;

			//generate row uid
			v.uid = "PATH:" + v.uid + "|SCHEME:" + chartScheme + "[" + index + "]";
			v.data.uid = v.uid;
			//generate uids for other arrays e.g order, activity
			for (var i = 0; i < aShapeDataNames.length; i++) {
				var sDataName, sDataIdName;
				if (typeof aShapeDataNames[i] === "string") {
					sDataName = aShapeDataNames[i];
					sDataIdName = "id";
				} else {
					sDataName = aShapeDataNames[i].name;
					sDataIdName = aShapeDataNames[i].idName ? aShapeDataNames[i].idName : "id";
				}
				if (sDataName in v.data) {
					for (var j = 0; j < v.data[sDataName].length; j++) {
						var obj = v.data[sDataName][j];
						//if user provided data doesn't have id, set jQuery.sap.uid as default
						if (obj[sDataIdName] === undefined) {
							obj[sDataIdName] = jQuery.sap.uid();
						}
						obj.uid = v.uid + "|DATA:" + sDataName + "[" + obj[sDataIdName] + "]";
						obj.__id__ = obj[sDataIdName]; // this is a reference to the really index attribute in user's data
					}
				}
			}

		});
	};

	/**
	 * This method is used to get ChartScheme for a row object by an UID of a shape in this row.
	 *
	 * @param {string} [sShapeUid] The parent uid for children uid generation.
	 * @return {string} chart scheme in the UID
	 */
	Utility.getChartSchemeByShapeUid = function (sShapeUid) {
		return Utility.parseUid(sShapeUid).chartScheme || "";
	};

	/**
	 * Generate UID for relationships. For the sake of UID definition, since relationship doesn't have chart scheme
	 * concept, here pre-append the dummy prefix to complete the UID.
	 *
	 * relationship dataset with UID changed by reference.
	 * @private
	 * @param {array} aDataArray relationship dataset
	 * @param {string} sRlsIdName configured relationship id
	 */
	Utility.generateUidForRelationship = function (aDataArray, sRlsIdName) {
		var sShapeDataName = "relationship";
		var sDummyPrefix = "PATH:DUMMY|SCHEME:DUMMY[0]";
		for (var i = 0; i < aDataArray.length; i++) {
			if (aDataArray[i][sRlsIdName] === undefined) {
				aDataArray[i][sRlsIdName] = jQuery.sap.uid();
			}
			aDataArray[i].uid = sDummyPrefix + "|DATA:" + sShapeDataName + "[" + aDataArray[i][sRlsIdName] + "]";
			aDataArray[i].__id__ = aDataArray[i][sRlsIdName];//this is a reference to the really index attribute in user's data
		}
	};

	/**
	 * This method iterates dataSet and save elements into the map, the key is 'id' of each element and the value is the element itself.
	 * When an element has children, traverse the children and use parent's 'id' plus "." plus child's 'id' as the key.
	 * For example, dataSet is like below which contains two elements and one of the elements has a child.
	 *        [
	 *            {
	 * 				id: 1
	 * 				children: [
	 * 					{
	 * 						id: 2
	 * 					}
	 * 				]
	 * 			},
	 *            {
	 * 				id: 3
	 * 			}
	 *        ]
	 * Then the map will be,
	 *        {
	 * 			"1" : {}
	 * 			"1.2": {}
	 * 			"3": {}
	 * 		}
	 * Notice that the key of children elements are path of ids which indicate both the children's id and their parent's id.
	 * @param {object} [dataSet]
	 *            The object array which contains all objects in the visible area including the hierarchy and chart.
	 * @param {object} [map]
	 *            The idPath map which is initially empty and is to be constructed by this method.
	 * @param {string} [parentId]
	 *            ID of parent element
	 * @returns {object} [relPath]
	 * 			  The returned object map
	 */
	Utility.generateObjectPathToObjectMap = function (dataSet, map, parentId) {
		var relPath;
		for (var i in dataSet) {
			var obj = dataSet[i], id, idx;
			if (obj.objectInfoRef) {
				id = obj.objectInfoRef.id;
				obj = obj.objectInfoRef;
			} else {
				id = obj.id;
			}

			if (parentId && parentId != "") {
				id = parentId.concat(".").concat(id);
			}

			idx = id.concat("-").concat(Utility.parseUid(obj.uid).rowIndex);
			map[idx] = obj;

			if (obj.children && obj.children.length > 0) {
				relPath = this.generateObjectPathToObjectMap(obj.children, map, id);
			}
		}
		return relPath;
	};

	/**
	 * This method is used to parse data type by the given uid.
	 * @param {string} [sShapeUid] uid
	 * @returns {string} [sShapeDataName] The date type if any match
	 */
	Utility.getShapeDataNameByUid = function (sShapeUid) {
		return Utility.parseUid(sShapeUid).shapeDataName;
	};

	/**
	 * Get shape ID or Row ID
	 *
	 * @private
	 * @param {string} sUid Shape UID or Row UID
	 * @param {boolean} bRow indicator to get row id
	 * @return {string} shape ID or Row ID
	 */
	Utility.getIdByUid = function(sUid, bRow) {
		return bRow ? Utility.parseUid(sUid).rowId : Utility.parseUid(sUid).shapeId;
	};

	/**
	 * Validate input string against defined UID regular expression.
	 * Get matched rowId, chartScheme, shapeDataName, shapeId if possible
	 *
	 * @private
	 * @param {string} sUid input string
	 * @return {object} matched
	 */
	Utility.parseUid = function(sUid) {
		var regex = /(PATH:(.+)\|SCHEME:(.*?\[-?\d+\]))(?:\|DATA:(.+)\[(.*)\])?$/g;
		var matches = regex.exec(sUid);
		var result = {};
		if (matches) {
			var chartScheme = matches[3];
			if (chartScheme) {
				var sRowIndex = chartScheme.match(/\[-?\d+\]/)[0].slice(1, -1);
				chartScheme = chartScheme.replace(/\[-?\d+\]/, "");
			}

			var sRowUid = matches[1],
				sRowPath = matches[2],
				aRowIds = sRowPath.split("|"),
				sRowId = aRowIds[aRowIds.length - 1];

			result = {
				rowId: sRowId,
				rowPath: sRowPath,
				rowUid: sRowUid,
				chartScheme: chartScheme,
				shapeDataName: matches[4],
				shapeId: matches[5],
				rowIndex: sRowIndex
			};
		}
		return result;
	};

	/**
	 * Scale size value according to current sapUiSize css setting.
	 *
	 * @param {string} sMode Sap ui size mode.
	 * @param {number} nCompactValue Number to be scaled.
	 * @return {number} Scaled value.
	 * @protected
	 */
	Utility.scaleBySapUiSize = function (sMode, nCompactValue) {
		switch (sMode){
		case "sapUiSizeCozy":
			return nCompactValue * 1.5;
		case "sapUiSizeCondensed":
			return nCompactValue * 0.78;
		default:
			return nCompactValue;
		}
	};

	/**
	 * Determine the active SAP UI size class.
	 *
	 * @return {string} SAP UI size class name.
	 */
	Utility.findSapUiSizeClass = function (oControl) {
		var $rootDiv, $sizeDef;
		if (oControl) {
			$rootDiv = oControl.$();
		} else {
			$rootDiv = jQuery("body");
		}

		if ($rootDiv) {
			$sizeDef = $rootDiv.closest(".sapUiSizeCompact,.sapUiSizeCondensed,.sapUiSizeCozy");
			if ($sizeDef.hasClass("sapUiSizeCondensed")) { // over-write Compact
				return "sapUiSizeCondensed";
			} else if ($sizeDef.hasClass("sapUiSizeCompact")) {
				return "sapUiSizeCompact";
			} else if ($sizeDef.hasClass("sapUiSizeCozy")) {
				return "sapUiSizeCozy";
			}
			//TODO What is default class?
		}
	};

	/**
	 * Compare two float values
	 *
	 * @return {boolean} true if the two values are equal.
	 */
	Utility.floatEqual = function (fVal1, fVal2) {
		return Math.abs(fVal1 - fVal2) < 0.0001;
	};

	/*
	 * Calculate string length
	 *
	 * @return {number} the length of the string
	 */
	Utility.calculateStringLength = function (sString) {
		var iLength = 0;
		if (sString.match("[\u4E00-\u9FFF]") === null) {
			iLength = sString.length;
		} else {
			iLength = sString.length + sString.match(/[\u4E00-\u9FFF]/g).length;
		}
		return iLength;
	};

	Utility.judgeTimeHorizonValidity = function (oVisibleHorizon, oTotalHorizon) {
		var oVisibleStartTime = Format.abapTimestampToDate(oVisibleHorizon.getStartTime()).getTime(),
			oVisibleEndTime = Format.abapTimestampToDate(oVisibleHorizon.getEndTime()).getTime(),
			oTotalStartTime = Format.abapTimestampToDate(oTotalHorizon.getStartTime()).getTime(),
			oTotalEndTime = Format.abapTimestampToDate(oTotalHorizon.getEndTime()).getTime();

		return (oVisibleStartTime - oTotalStartTime >= 0) && (oTotalEndTime - oVisibleEndTime >= 0);
	};

	/**
	 * Retrieve the binded D3 shape data of the found DOM elements.
	 *
	 * @param {array|string} vId document IDs
	 * @param {string} sContainer The container in which the vId resides
	 * @return {array} datum of found elements
	 * @private
	 */
	Utility.getShapeDatumById = function(vId, sContainer) {
		return Utility.getDatumById(vId, "sap-gantt-shape-id", sContainer);
	};

	/**
	 * Get the binded D3 row data of the found elements.
	 * The datum contains objectInfoRef and shapeData as property key
	 *
	 * @param {array|string} vId document IDs
	 * @param {string} sContainer The container in which the vId resides
	 * @return {array} datum of found elements
	 * @private
	 */
	Utility.getRowDatumById = function(vId, sContainer) {
		return Utility.getDatumById(vId, "sap-gantt-row-id", sContainer) || [];
	};

	/**
	 * Get the binded D3 row data of the found elements.
	 * Only get objectInfoRef property from @see getRowDatumById
	 *
	 * @param {array|string} vId document IDs
	 * @param {string} sContainer The container in which the vId resides
	 * @return {array} datum of found elements
	 * @private
	 */
	Utility.getRowDatumRefById = function(vId, sContainer) {
		return Utility.getRowDatumById(vId, sContainer).map(function(oItem) {
			return oItem.objectInfoRef;
		});
	};

	/**
	 * @private
	 */
	Utility.getRowDatumByShapeUid = function(sShapeUid, sContainer) {
		var oPart = this.parseUid(sShapeUid),
			sRowUid = oPart.rowUid,
			sRowId = oPart.rowId;

		var oDatum = null;

		var aRowDatum = this.getRowDatumById(sRowId, sContainer);
		var aFiltered = aRowDatum.filter(function(oDatum){
			return oDatum.objectInfoRef.uid.indexOf(sRowUid) >= 0;
		});
		if (aFiltered.length > 0) {
			oDatum = aFiltered[0].objectInfoRef;
		}
		return oDatum;
	};

	/**
	 * @private
	 */
	Utility.getShapeDatumByShapeUid = function(sShapeUid, sContainer) {
		var oPart = this.parseUid(sShapeUid),
			sShapeId = oPart.shapeId,
			sRowUid = oPart.rowUid;

		var aShapeDatum = this.getShapeDatumById(sShapeId, sContainer);
		var aFiltered = aShapeDatum.filter(function(oDatum){
			return oDatum.uid.indexOf(sRowUid) >= 0;
		});

		return aFiltered[0];
	};

	/**
	 * Get the binded D3 row data of the target DOM.
	 *
	 * @param {array|string} target event target
	 * @return {array} datum of found elements
	 * @private
	 */
	Utility.getRowDatumByEventTarget = function(target) {
		var datum = null;
		var $row = jQuery(target).closest("g[data-sap-gantt-row-id]");
		if ($row.length) {
			datum = d3.select($row.get(0)).datum();
		}
		return datum;
	};

	Utility.getDatumById = function(vId, sAttr, sContainer) {
		jQuery.sap.assert(typeof vId === "string" || vId instanceof Array, "vId must be string or array");
		jQuery.sap.assert(sContainer, "sContainer must specify");
		var param = vId ? vId : "";
		var aIds = param;
		if (typeof param === "string") {
			aIds = [param];
		}
		var datums = [];
		aIds.forEach(function(id) {
			var selector = ["[id='", sContainer, "']", " [data-", sAttr, "='", id, "']"].join("");
			$(selector).each(function(_, dom){
				var $dom = d3.select(dom),
					oNewDatum = $dom.datum();
				var bFound = datums.some(function(oOldDatum) {
					var sOldValue = oOldDatum.uid || oOldDatum.objectInfoRef.uid,
						sNewValue = oNewDatum.uid || oNewDatum.objectInfoRef.uid;
					if (sOldValue !== sNewValue) {
						return false;
					} else {
						var iShapeLength = oOldDatum.shapeData ? oOldDatum.shapeData.length : 0;
						var iNewShapeLength = oNewDatum.shapeData ? oNewDatum.shapeData.length : 0;
						// ensure that the UID is the same and shapeData
						return iShapeLength === iNewShapeLength;
					}
				});
				if (!bFound) {
					datums.push(oNewDatum);
				}
			});
		});
		return jQuery.sap.unique(datums);
	};

	/**
	 * wrap the selector to an Attribute Equal Selector, so that this selector can
	 * select elements that have the specified attribute with a value exactly equal to a certain value.
	 * @param {string} attributeName the specified attribute of the to-be-selected element
	 * @param {string} value the value which the specified attribute is expected to have and exactly equal to
	 * @return {string} The wrapped selector
	 */
	Utility.attributeEqualSelector = function(attributeName, value) {
		return "[" + attributeName + "=" + "'" + value + "'" + "]";
	};

	//This function calculate the time horizon by given width, and keep the zoom rate as orginal time horizon
	Utility.calculateHorizonByWidth = function(oOriginalHorizon, iOriginalWidth, iCurrentWidth, oCurrentStartTime) {
		var oOriginalStartTime = Format.abapTimestampToDate(oOriginalHorizon.getStartTime());
		var oOriginalEndTime = Format.abapTimestampToDate(oOriginalHorizon.getEndTime());
		var fRate = Math.abs(oOriginalStartTime.getTime() - oOriginalEndTime.getTime()) / iOriginalWidth;

		var oStartTime;
		if (oCurrentStartTime) {
			oStartTime = oCurrentStartTime;
		} else {
			oStartTime = oOriginalStartTime;
		}

		var oEndTime = new Date();
		oEndTime.setTime(oStartTime.getTime() + iCurrentWidth * fRate);

		var oCurrentVisibleHorizon = new TimeHorizon({
			startTime: oStartTime,
			endTime: oEndTime
		});

		return oCurrentVisibleHorizon;
	};

	return Utility;
}, /* bExport= */ true);
