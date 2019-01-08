sap.ui.define([
	"sap/suite/ui/generic/template/AnalyticalListPage/control/visualfilterbar/FilterItem",
	"sap/ui/model/Sorter",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/FilterUtil"
],
function(FilterItem, Sorter, FilterUtil) {
	"use strict";

	var CHART_TYPE_DONUT = "Donut";
	var CHART_TYPE_LINE = "Line";
	var CHART_TYPE_BAR = "Bar";
	var IS_OTHERS = "__IS_OTHER__";

	var FilterItemChart = FilterItem.extend("sap.suite.ui.generic.template.AnalyticalListPage.control.visualfilterbar.FilterItemMicroChart", {
		metadata: {
			properties: {
				smartFilterId: { type: "string", group: "Misc", defaultValue: null}
			},
			aggregations: {
				control: {type: "sap.ui5.controls.microchart", multiple: false}
			}
		},

		renderer: function(oRm, oControl) {
			oRm.write("<div");
			oRm.writeControlData(oControl);
			oRm.writeClasses();
			oRm.addStyle("width", "100%");
			jQuery(document.body).hasClass("sapUiSizeCozy") ? oRm.addStyle("height", "9.9rem") : oRm.addStyle("height", "7.9rem");// Increasing the height of the visual filter chart to make it interactive in cozy formfactor
			oRm.writeStyles();
			oRm.write(">");
			oRm.renderControl(oControl.getAggregation("control"));
			oRm.write("</div>");
		}
	});

	FilterItemChart.prototype._formattingId = "__UI5__ShortIntegerMaxFraction2";
	FilterItemChart.prototype._maxFractionalDigits = 2;
	FilterItemChart.prototype._maxFractionalDigitsValsLessThanZero = 7; // limit to 7 decimal places, e.g. if scale is B and value is 700 will show 0.0000007, if value is 70, the shortened value will be 0.
	FilterItemChart.prototype._minFractionalDigits = 0;
	FilterItemChart.prototype._shortRefNumber;
	FilterItemChart.prototype._isTriggeredBySync = false;
	FilterItemChart.prototype._multiUnit = false;
	FilterItemChart.prototype.technicalIssueMessage = "TECHNICAL_ISSUES_OVERLAY_MESSAGE";
	FilterItemChart.prototype.noDataIssueMessage = "NO_DATA_FOUND_OVERLAY_MESSAGE";
	FilterItemChart.prototype.requiredFilterMessage = "REQUIRED_FIELDS_OVERLAY_MESSAGE";
	FilterItemChart.prototype.multipleCurrencyMessage = "MULTIPLE_CURRENCY_OVERLAY_MESSAGE";
	FilterItemChart.prototype.multipleUnitMessage = "MULTIPLE_UNIT_OVERLAY_MESSAGE";
	FilterItemChart.prototype.init = function() {
		this._bAllowBindingUpdateOnPropertyChange = false;
		this._attachChartEvents();
	};

	FilterItemChart.prototype._attachChartEvents = function() {
		var me = this;
		this._chart.addEventDelegate({
			onAfterRendering : function () {
				if (me._getChartAggregations().length) {
					// if multi unit show overlay
					if (me._multiUnit) {
						me.applyOverlay(me.getIsCurrency() ? me.multipleCurrencyMessage : me.multipleUnitMessage);
					}
				}
			}
		});

		this._chart.attachSelectionChanged(this._onSelectionChanged, this);
	};

	FilterItemChart.prototype._getCurrentSelectedChart = function(bReturnChartType) {
		if (this._chart.getPoints) {
			return bReturnChartType ? CHART_TYPE_LINE : "point";
		} else if (this._chart.getSegments) {
			return bReturnChartType ? CHART_TYPE_DONUT : "segment";
		} else if (this._chart.getBars) {
			return bReturnChartType ? CHART_TYPE_BAR : "bar";
		}
	};

	FilterItemChart.prototype._getCustomData = function(ev) {
		var sCurrentSelectedChartType = this._getCurrentSelectedChart();
		var aCurrentItem = (sCurrentSelectedChartType) ? ev.getParameter(sCurrentSelectedChartType) : undefined;
		if (sCurrentSelectedChartType && aCurrentItem) {
			var aCustomData = aCurrentItem.getCustomData();
			var data = {
				dimValue: aCustomData[0].getValue(),
				dimValueDisplay: aCurrentItem.getLabel()
			};
			return data;
		}
	};

	FilterItemChart.prototype._onSelectionChanged = function(ev) {
		var sFilterRestriction = this.getFilterRestriction(),
		oCustomData = this._getCustomData(ev),
		bSelected = ev.getParameter("selected"),
		bClearOtherSelection = (sFilterRestriction === "single" && oCustomData.dimValue === IS_OTHERS && bSelected);
		if (oCustomData.dimValue === IS_OTHERS && bSelected && this.getIsDropDown()) {
			ev.getParameter("segment").setSelected(false);
			return;
		}
		if (bClearOtherSelection) {
			ev.getParameter("segment").setSelected(false);
		}
		if (bSelected && oCustomData.dimValue === IS_OTHERS && sFilterRestriction === "multiple" || (bSelected && oCustomData.dimValue !== IS_OTHERS )) {
			this._onChartSelectData(ev);
		} else if (!bSelected) {
			this._onChartDeselectData(ev);
		}
	};

	/**
	 * Triggered on selection of chart data point also triggers change to content area on chart selection
	 *
	 * @param {event} ev - event triggered by selecting data point
	 * @returns {void}
	 *
	 * @private
	 */
	FilterItemChart.prototype._onChartSelectData = function(ev) {
		var oDimensionFilter,
		sFilterRestriction = this.getFilterRestriction();

		if (sFilterRestriction === "multiple") {
			oDimensionFilter = jQuery.extend(true, {items: [], ranges: [], value: null}, this.getDimensionFilter());
			var oData = this._getCustomData(ev),
			sChartType = this._getCurrentSelectedChart(true);
			// if chart type is donut
			if (sChartType === CHART_TYPE_DONUT) {
				oDimensionFilter = this._applyDonutChartSelections(oData, oDimensionFilter);
			} else {
				oDimensionFilter.items.push({
					key: oData.dimValue,
					text: oData.dimValueDisplay // oData.dimValueDisplay comes with TextArrangement from custome data so applying directly.
				});
			}
		} else {
			oDimensionFilter = this.getDimensionFilter();
			// single-value
			if (oDimensionFilter) {
				// if there is a filter, remove it and add the new filter for filter restriction single value
				oDimensionFilter = null;

				var aSelectedChartAggregation = ev.getParameter("bar") || ev.getParameter("point") || ev.getParameter("segment");
				this._setSelectedAggregation(aSelectedChartAggregation);
				aSelectedChartAggregation.setSelected(true);
			}
			//var oData = aDataList[0].data;
			var oData = this._getCustomData(ev);
			oDimensionFilter = oData.dimValue;
		}

		this.setProperty("dimensionFilter", oDimensionFilter); // set without calling setDimensionFilter so that the selected points don't get reapplied
		// Fire filter change of filter item
		// handle in _onFilterChange in SmartVisualFilterBar.js
		this.fireFilterChange();
	};

	FilterItemChart.prototype._setSelectedAggregation = function (aSelectedChartAggregation) {
		var setSelectedAggregation = this._chart.setSelectedBars || this._chart.setSelectedPoints || this._chart.setSelectedSegments;
		setSelectedAggregation.call(this._chart, aSelectedChartAggregation);
	};

	FilterItemChart.prototype._getChartAggregations = function () {
		// determine aggregation function and call it to get all chart aggregations
		var getChartAggregations = this._chart.getPoints || this._chart.getSegments || this._chart.getBars;
		return getChartAggregations.call(this._chart);
	};

	FilterItemChart.prototype._onChartDeselectData = function(ev) {
		//var sDimensionFieldDisplay = this.getDimensionFieldDisplay(),
		var oDimensionFilter,
		sFilterRestriction = this.getFilterRestriction(),
		//aDataList = ev.getParameter('data'),
		//oData = aDataList[0].data,
		oData = this._getCustomData(ev),
		aUpdatedDimensionFilterItems = [],
		aUpdatedDimensionFilterRanges = [];
		if (sFilterRestriction === "single") {
			// set to null
			oDimensionFilter = null;
		} else {
			oDimensionFilter = jQuery.extend(true, {}, this.getDimensionFilter());
			var aDimensionFilterItems = (oDimensionFilter && oDimensionFilter.items) ? oDimensionFilter.items : undefined,
			aDimensionFilterRanges = (oDimensionFilter && oDimensionFilter.ranges) ? oDimensionFilter.ranges : undefined,
			sDimensionFilterValue = (oDimensionFilter && oDimensionFilter.value) ? oDimensionFilter.value : null;
			// consider items
			if (aDimensionFilterItems) {
				aDimensionFilterItems.forEach(function(element) {
					if (element.key !== oData.dimValue) {
						aUpdatedDimensionFilterItems.push(element);
					}
				});
			}
			oDimensionFilter.items = aUpdatedDimensionFilterItems;
			// consider value
			if (sDimensionFilterValue) {
				if (oData.dimValue === sDimensionFilterValue) {
					oDimensionFilter.value = null;
				}
			}
			// consider ranges EQ
			if (aDimensionFilterRanges) {
				aDimensionFilterRanges.forEach(function(element) {
					if (element.operation === "EQ" && oData.dimValue !== IS_OTHERS && element.exclude) {
						aUpdatedDimensionFilterRanges.push(element);
					} else if (element.operation === "EQ" && !element.exclude) {
						//To-Do : Suggestion, @jitin we could try to make a another util to compare two Dates.
						//More general which take the med or large as parameter.
						//we could remove this if provided its handled with undefined case. Hence, keeping it time being
						//Please recheck if this change works properly for you BLI.
						//Had to do it and your changes were breaking Donut deselection scenario.
						if (element.value1 instanceof Date && oData.dimValue instanceof Date) {
							if (FilterUtil.getDateInMedium(element.value1) !== FilterUtil.getDateInMedium(oData.dimValue)) {
								aUpdatedDimensionFilterRanges.push(element);
							}
						} else if (element.value1 !== oData.dimValue) {
							aUpdatedDimensionFilterRanges.push(element);
						}
					} else if (element.operation !== "EQ" && !element.exclude && element.value1 !== oData.dimValue) {
							aUpdatedDimensionFilterRanges.push(element);
					}

				});
			}
			oDimensionFilter.ranges = aUpdatedDimensionFilterRanges;
		}
		this.setProperty("dimensionFilter", oDimensionFilter); // set without calling setDimensionFilter so that the selected points don't get reapplied
		// Fire filter change of filter item
		// handle in _onFilterChange in SmartVisualFilterBar.js
		this.fireFilterChange();
	};

	/**
	*Function returns two arrays, an array of contructors for sorting and an array of sort order properties
	*params {[objects]} aSortOrder array of sortOrder property from annotations
	*return {object} oSorters Object that consists of array of construcotrs for sortig and array of sort order properties
	*/
	FilterItemChart._getSorter = function(aSortOrder) {
		var aSortFields = [], aSortDescending = [], aSorters = [];
		//For each type of sortOrder, we save the sortOrder Type and Ascending/descending values into  two arrays. Elements of these arrays are then passed into Sorter()
		for (var i = 0; i < aSortOrder.length; i++) {
			aSortFields[i] = aSortOrder[i].Field.String;
			aSortDescending[i] = aSortOrder[i].Descending.Boolean;
			aSorters.push(new Sorter(aSortFields[i], aSortDescending[i]));
		}
		var oSorter = {sorter : aSorters, sortFields: aSortFields};
		return oSorter;
	};

	FilterItemChart.prototype._getNumberFormatter = function(iShortRefNumber) {
		var fixedInteger = sap.ui.core.format.NumberFormat.getIntegerInstance({
			style: "short",
			showScale: false,
			shortRefNumber: iShortRefNumber
		});

		return fixedInteger;
	};

	FilterItemChart.prototype.setWidth = function(width) {
		this.setProperty("width", width);
	};

	FilterItemChart.prototype.setHeight = function(height) {
		this.setProperty("height", height);
	};

	FilterItemChart.prototype.setEntitySet = function(sEntitySetName) {
		this.setProperty("entitySet", sEntitySetName);
	};

	FilterItemChart.prototype.setDimensionField = function(dimensionField) {
		this.setProperty("dimensionField", dimensionField);
	};

	FilterItemChart.prototype.setDimensionFieldIsDateTime = function(dimensionFieldIsDateTime) {
		this.setProperty("dimensionFieldIsDateTime", dimensionFieldIsDateTime);
	};

	FilterItemChart.prototype.setDimensionFieldDisplay = function(dimensionFieldDisplay) {
		this.setProperty("dimensionFieldDisplay", dimensionFieldDisplay);
	};

	FilterItemChart.prototype.setMeasureField = function(measureField) {
		if (measureField && measureField.constructor === Object) {
			if (measureField.value) {
				this.setProperty("measureField", measureField.value);
			}
			if (measureField.bUpdateBinding) {
				this._updateBinding();
			}
		} else if (measureField && measureField.constructor === Array) {
			this.setProperty("measureField", measureField);
		} else {
			this.setProperty("measureField", measureField);
		}
	};

	FilterItemChart.prototype.setUnitField = function(unitField) {
		this.setProperty("unitField", unitField);
	};
	/**
	*Set Sortorder property so that chart data can be sorted
	*@param{array} sortOrder - Array of sortOrder Property objects from annotations
	*@return{void}
	*/
	FilterItemChart.prototype.setSortOrder = function(sortOrder) {
		if (sortOrder && sortOrder.constructor === Object) {
			if (sortOrder.value) {
				this.setProperty("sortOrder", sortOrder.value);
			}
			if (sortOrder.bUpdateBinding) {
				this._updateBinding();
			}
		} else if (sortOrder && sortOrder.constructor === Array) {
			this.setProperty("sortOrder", sortOrder);
		} else {
			this.setProperty("sortOrder", sortOrder);
		}
	};
	/**
	 * Set external dimension Filters so that the filter item can be rendered
	 *
	 * @param {array} filter - array of filters
	 * @param {boolean} bIsTriggeredBySync - whether filter was triggered by sync or not
	 * @returns {void}
	 */
	FilterItemChart.prototype.setDimensionFilterExternal = function(filter) {
		this.setProperty("dimensionFilterExternal", filter);
		if (this._bAllowBindingUpdateOnPropertyChange) {
			this._updateBinding();
		}
	};

	/**
	*Function returns config object with all the below mentioned properties.
	*return {object} Config object is returned by the object.
	*/
	FilterItemChart.prototype.getP13NConfig = function() {
		var aPropList = [
			"width", "height","filterRestriction", "isDropDown","sortOrder", "measureField", "scaleFactor", "numberOfFractionalDigits", "chartQualifier",
			"entitySet", "dimensionField", "dimensionFieldDisplay", "dimensionFieldIsDateTime", "dimensionFilter", "unitField", "isCurrency", "isMandatory", "outParameter", "inParameters", "parentProperty"
		];

		// simple properties
		var oConfig = {};
		for (var i = 0; i < aPropList.length; i++) {
			var name = aPropList[i];
			oConfig[name] = this.getProperty(name);
			if ((name == "outParameter" || name == "inParameters") && oConfig[name] == "") {
				oConfig[name] = undefined;
			}
		}

		return oConfig;
	};

	FilterItemChart.prototype.setDimensionFilter = function(dimFilter, bIsChartInteraction) {
		this.setProperty("dimensionFilter", dimFilter);
	};

	FilterItemChart.prototype._onDataReceived = function(data) {
		if (!data) {
			return;
		}
		this._determineUnit(data);
		this._getShortRefNumber(data.slice(0));
	};

	/**
	* @private
	* This function determine unit and set it.
	*	@param{array} data list from which unit determination to be done
	* @return{void}
	*/
	FilterItemChart.prototype._determineUnit = function (data){
		var unitField = this.getUnitField();
		if (unitField) {
			var prevUnit = data[0][unitField];
			this._multiUnit = false;
			for (var i = 1; i < data.length; i++) {
				//Others category in donut chart is not considered for unit determination
				if (data[i].dimensionValue !== IS_OTHERS){
					var unit = data[i][unitField];
				}
				if (unit != prevUnit) {
					if (data.length > 1){
						this._multiUnit = true;
					}
					break;
				}
				prevUnit = unit;
			}
			this._applyUnitValue(this._multiUnit ? "" : prevUnit);
			} else {
				// no unit field, so no unit displayed in title
				this._applyUnitValue("");
			}
	};
	FilterItemChart.prototype._applyUnitValue = function(val) {
		if (this._lastUnitValue != val) {
			this._lastUnitValue = val;
			this.fireTitleChange();
		}
	};

	/**
	 * Determines the scale factor and the scale to be used for the visual filter item
	 * Initially checks for scale factor from the annotation. If annotation does not have
	 * any scale factor then it is calculated on the basis of median deduced from the data received from the backend.
	 *
	 * @param {object} oData - Data received from the backend call
	 * @returns {void}
	 *
	 * @private
	 */
	FilterItemChart.prototype._getShortRefNumber = function(oData) {
		this._scaleValue = "";
		this._shortRefNumber = undefined; // reset
		// Determine the scale, to get scaleFactor from annotations or from locally defined values
		var iShortRefNumber = this.getScaleFactor(),
		scale;
		if (!iShortRefNumber) {
			// if annotation does not have scale factor
			var scaleFactor = this._getScaleFactorFromMedian(oData);
			iShortRefNumber = scaleFactor.iShortRefNumber;
			scale = scaleFactor.scale;
		} else {
			// if annotation has scale factor
			var fixedInteger = this._getNumberFormatter(iShortRefNumber);
			scale = fixedInteger.getScale() ? fixedInteger.getScale() : "";
		}

		this._shortRefNumber = iShortRefNumber;
		this._scaleValue = scale;
		this.fireTitleChange();
	};

	/**
	 * Determines the scale factor and the scale to be used for the Visual Filter Item
	 * on the basis of median deduced from the data received from the backend 
	 *
	 * @param {event} ev - event triggered by selecting data point
	 * @returns {void}
	 *
	 * @private
	 */
	FilterItemChart.prototype._getScaleFactorFromMedian = function(oData) {
		var sMeasureField = this.getMeasureField();
		// sort data
		oData.sort(function(a,b) {
			if (Number(a[sMeasureField]) < Number(b[sMeasureField])) {
				return -1;
			}
			if (Number(a[sMeasureField]) > Number(b[sMeasureField])) {
				return 1;
			}
			return 0;
		});
		// get median index
		var iMid = oData.length / 2, // get mid of array
		// if iMid is whole number, array length is even, calculate median
		// if iMid is not whole number, array length is odd, take median as iMid - 1
		iMedian = iMid % 1 === 0 ? (parseFloat(oData[iMid - 1][sMeasureField]) + parseFloat(oData[iMid][sMeasureField])) / 2 : parseFloat(oData[Math.floor(iMid)][sMeasureField]),
		// get scale factor on median
		val = iMedian,
		scaleFactor;
		for (var i = 0; i < 14; i++) {
			scaleFactor = Math.pow(10, i);
			if (Math.round(Math.abs(val) / scaleFactor) < 10) {
				break;
			}
		}

		var fixedInteger = this._getNumberFormatter(scaleFactor);

		// apply scale factor to other values and check
		for (var i = 0; i < oData.length; i++) {
			var aData = oData[i],
			sScaledValue = fixedInteger.format(aData[sMeasureField]),
			aScaledValueParts = sScaledValue.split(".");
			// if scaled value has only 0 before decimal or 0 after decimal (example: 0.02)
			// then ignore this scale factor else proceed with this scale factor
			// if scaled value divided by 1000 is >= 1000 then also ignore scale factor
			if ((!aScaledValueParts[1] && parseInt(aScaledValueParts[0], 10) === 0) || (aScaledValueParts[1] && parseInt(aScaledValueParts[0], 10) === 0 && aScaledValueParts[1].indexOf('0') === 0) || (sScaledValue / 1000) >= 1000) {
				scaleFactor = undefined;
				break;
			}
		}
		return {
			iShortRefNumber: scaleFactor,
			scale: scaleFactor ? fixedInteger.getScale() : ""
		};
	};
	FilterItemChart.prototype._getScaleFactor = function(val) {
		var val = parseFloat(val);
		var precision = this._minFractionalDigits;
		for (var i = 0; i < 14; i++) {
			var scaleFactor = Math.pow(10, i);
			if (Math.round(Math.abs(val) / scaleFactor, precision - 1) < 10) {
				return scaleFactor;
			}
		}

		return undefined;
	};
	FilterItemChart.prototype.getTitle = function() {
		var model = this.getModel();

		if (!model) {
			return "";
		}
		var measureLabel = FilterUtil.getPropertyNameDisplay(model, this.getEntitySet(), this.getMeasureField());
		var dimLabel = FilterUtil.getPropertyNameDisplay(model, this.getEntitySet(), this.getDimensionField());

		// Get the Unit
		var unitValue = this._lastUnitValue ? this._lastUnitValue : "";

		// Get the Scale factor
		var scaleValue = this._scaleValue ? this._scaleValue : "";

		var i18nModel = this.getModel("i18n");
		if (!i18nModel) {
			return "";
		}

		var rb = i18nModel.getResourceBundle();

		var title = "";
		if (scaleValue && unitValue) {
			title = rb.getText("VIS_FILTER_TITLE_MD_UNIT_CURR", [measureLabel, dimLabel, scaleValue, unitValue]);
		} else if (unitValue) {
			title = rb.getText("VIS_FILTER_TITLE_MD_UNIT", [measureLabel, dimLabel, unitValue]);
		} else if (scaleValue) {
			title = rb.getText("VIS_FILTER_TITLE_MD_UNIT", [measureLabel, dimLabel, scaleValue]);
		} else {
			title = rb.getText("VIS_FILTER_TITLE_MD", [measureLabel, dimLabel]);
		}
		return title;
	};

	FilterItemChart.prototype.getFormattedNumber = function(value, bShouldShowScale) {

		var numberOfFractionalDigits = this.getNumberOfFractionalDigits();
		if (numberOfFractionalDigits === "" || numberOfFractionalDigits === undefined) {
			numberOfFractionalDigits = "1";
		} else {
			if (Number(numberOfFractionalDigits) > 1) {
				numberOfFractionalDigits = "1";
			}
		}

		var fixedInteger = sap.ui.core.format.NumberFormat.getFloatInstance({
			style: "short",
			decimals: Number(numberOfFractionalDigits),
			showScale: bShouldShowScale,
			shortRefNumber: this._shortRefNumber,
			minFractionDigits: this._minFractionalDigits,
			maxFractionDigits: this._maxFractionalDigits
		});
		// parseFloat(value) is required otherwise -ve value are worngly rounded off
		// Example: "-1.9" rounds off to -1 instead of -2. however -1.9 rounds off to -2
		return fixedInteger.format(parseFloat(value));
	};

	FilterItemChart.prototype._getFormattedNumberWithUoM = function(value, UoM) {
		UoM = (UoM) ? UoM : "";
		//As per the documentation default locale is taken.
		var oLocale = sap.ui.getCore().getConfiguration().getFormatSettings().getFormatLocale();
		var formattedValue = sap.ui.core.format.NumberFormat.getFloatInstance({
			maxFractionDigits: 2,
			groupingEnabled: true
		},
		oLocale
		).format(value);

		return (UoM === "%") ? formattedValue + "%" : formattedValue + " " + UoM;
	};

	FilterItemChart.prototype._getDisplayedValue =  function(value, sUnitFieldValue) {
		var bShouldShowScale = (this._scaleValue === ""),
		nScaledValue = this.getFormattedNumber(value, bShouldShowScale),
		bIsPercentage = (sUnitFieldValue === "%");
		return (bIsPercentage) ? nScaledValue + "%" : "" + nScaledValue;
	};

	FilterItemChart.prototype._getToolTip = function(dimLabel, dimValue, unitField) {
		var nFormattedNumberWithUoM = this._getFormattedNumberWithUoM(dimValue, unitField);
		return dimLabel + "\n" + nFormattedNumberWithUoM;
	};

	FilterItemChart.prototype._getSelected =  function(oContext, sDimFieldValue) {
		//TO DO : This function can be optimized; we don't have to iterate through all the data if we find a selection (true value).
		var bIsSelected = false,
			sFilterRestriction = this.getFilterRestriction(),
			aExcludeFilterValue = [];
		if (oContext) {
			if (sFilterRestriction === 'multiple') {
				if (oContext.items) {
					oContext.items.forEach(function(item) {
						if (item.key ===  sDimFieldValue) {
							bIsSelected = true;
						}
					});
				}
				if (oContext.value && oContext.value === sDimFieldValue) {
					bIsSelected = true;
				}
				// consider ranges EQ
				if (oContext.ranges) {
					for (var i = 0; i < oContext.ranges.length; i++) {
						var oRange = oContext.ranges[i];
						// in ranges only EQ can match to a data point on the chart
						if (oRange.operation ===  "EQ" && oRange.value1 && !oRange.exclude) {
							if (oRange.value1 instanceof Date && sDimFieldValue instanceof Date){
								if ( FilterUtil.getDateInMedium(oRange.value1) === FilterUtil.getDateInMedium(sDimFieldValue)) {
									bIsSelected = true;
									break;
								}
							} else if (oRange.value1 === sDimFieldValue) {
								bIsSelected = true;
								break;
							}
						} else if (oRange.exclude && oRange.operation === 'EQ') { // _IS_OTHER
							aExcludeFilterValue.push(oRange.value1);
						}
					}

					if (aExcludeFilterValue.length === 2 && sDimFieldValue === IS_OTHERS) {
						// if exclude filter count is 2 the may be other's should be selected
						var iValueMatchedCount = 0,
						aDonutSegments = this._chart.getSegments();
						aDonutSegments.forEach(function (oSegment) {
							var sValue = oSegment.getCustomData()[0].getValue();
							if (aExcludeFilterValue.indexOf(sValue) > -1) {
								iValueMatchedCount++;
							}
						});

						if (iValueMatchedCount === 2) {
							bIsSelected = true;
						}
					}
				}
			} else {
				if (oContext && oContext === sDimFieldValue) {
					bIsSelected = true;
				}
			}
		}
		return bIsSelected;
	};

	FilterItemChart.prototype._getChartAggregationSettings =  function(bIsDonut) {

		var sDimField = bIsDonut ? 'dimensionValue' : this.getDimensionField(),
			sDimFieldDisplay = this.getDimensionFieldDisplay(),
			sMeasureField = this.getMeasureField(),
			sUnitField = this.getUnitField(),
			aLabelParts = ( sDimField === sDimFieldDisplay ) ? [sDimFieldDisplay] : [sDimFieldDisplay, sDimField],
			aToolTipParts = ( sDimField === sDimFieldDisplay ) ? [sDimFieldDisplay, sMeasureField, ""] : [sDimFieldDisplay, sMeasureField, sDimField],
			aUnitFieldToolTipParts = sUnitField ? aToolTipParts.push(sUnitField) : aToolTipParts,
			me = this,
			oSettings = {
				label : {
					parts: aLabelParts,
					formatter: function(oDimFieldDisplay, sDimField) {
						var sTextArrangement = me.getTextArrangement();
						return ( oDimFieldDisplay instanceof Date ) ? FilterUtil.getDateInMedium(oDimFieldDisplay) : FilterUtil.getTextArrangement(oDimFieldDisplay, sDimField, sTextArrangement);
					}
				},
				value: {
					path: sMeasureField,
					formatter: function(value) {
						return parseFloat(value);
					}
				},
				displayedValue: {
					parts: [sMeasureField, sUnitField],
					formatter: function(value, sUnitFieldValue) {
						return me._getDisplayedValue(value, sUnitFieldValue);
					}
				},
				tooltip: {
					parts: aUnitFieldToolTipParts.constructor === Array ? aUnitFieldToolTipParts : aToolTipParts,
					formatter: function(dimLabel, dimValue, sDimField, unitField) {
						var sTextArrangement = me.getTextArrangement();
						sDimField = sDimField.constructor === Object ? undefined : sDimField;
						dimLabel = ( dimLabel instanceof Date ) ? FilterUtil.getDateInMedium(dimLabel) : FilterUtil.getTextArrangement(dimLabel, sDimField, sTextArrangement);
						return me._getToolTip(dimLabel, dimValue, unitField);
					}
				},
				selected: {
					parts: ["_filter>/" + me.getParentProperty(), sDimField],
					formatter: function(oContext, sDimFieldValue) {
						return me._getSelected(oContext, sDimFieldValue);
					}
				},
				customData: {
					Type:"sap.ui.core.CustomData",
				    key:sDimField,
				    value:"{" + sDimField + "}" // bind custom data
				},
				color: "{color}"
		};
		return oSettings;
	};
	/**
	 * This function enables or disables overlay
	 * @param  {string} sI18n  i18n string for overlay message
	 * @return {void}
	**/
	FilterItemChart.prototype.applyOverlay = function(sI18n) {
		var sPath = this.data("sPath");
		if (sPath) {
			var sShowOverlay =  sPath + "/showChartOverlay";
			var conFigModel = this.getModel('_visualFilterConfigModel');
			conFigModel.setProperty(sShowOverlay, (sI18n ? true : false));
			if (sI18n) {
				var sOverlayMessage =  sPath + "/overlayMessage";
				conFigModel.setProperty(sOverlayMessage, sI18n);
			}
		}
	};

	/**
	* This function checks if the smartFilterBar has parameters , if then the pattern is updated to parameterSet(params)/resultNavProp
	*@param {string} sBindingPath binding path of the control
	*@param {object} oSmartFilterBar smartFilterBar object
	*@return {string} sBindingPath updated binding path
	**/
	FilterItemChart.prototype.considerAnalyticBinding = function(sBindingPath, oSmartFilterBar) {
		if (oSmartFilterBar && oSmartFilterBar.getAnalyticBindingPath && oSmartFilterBar.getConsiderAnalyticalParameters()) {
			try {
				var sAnalyticalPath = oSmartFilterBar.getAnalyticBindingPath();
				if (sAnalyticalPath) {
					return sAnalyticalPath;
					}
			} catch (e) {
					jQuery.sap.log.warning("Mandatory parameters have no values", "", "AnalyticalListPage");
			}
		}
		return sBindingPath;
	};


	return FilterItemChart;
}, /* bExport= */true);
