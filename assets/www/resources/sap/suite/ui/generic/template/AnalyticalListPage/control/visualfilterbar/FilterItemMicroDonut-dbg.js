sap.ui.define(["sap/suite/ui/microchart/InteractiveDonutChart",
	"sap/suite/ui/microchart/InteractiveDonutChartSegment",
	"sap/ui/model/json/JSONModel",
	"sap/suite/ui/generic/template/AnalyticalListPage/control/visualfilterbar/FilterItemMicroChart",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/CriticalityUtil",
	"sap/suite/ui/generic/template/AnalyticalListPage/util/FilterUtil"],
	function(InteractiveDonutChart, InteractiveDonutChartSegment, JSONModel, FilterItemMicroChart, CriticalityUtil, FilterUtil) {
	"use strict";


	var IS_OTHERS = "__IS_OTHER__";
	/* all visual filters should extend this class */
	var FilterItemMicroDonut = FilterItemMicroChart.extend("sap.suite.ui.generic.template.AnalyticalListPage.control.visualfilterbar.FilterItemMicroDonut", {
		metadata: {
			properties: {
				labelWidthPercent: { type: "float", group: "Misc", defaultValue: 1 / 2 }
			},
			aggregations: {
				control: {type: "sap.suite.ui.microchart.InteractiveDonutChart", multiple: false}
			}
		},
		renderer:{}
	});

	FilterItemMicroDonut.prototype.init = function() {
		this._chart = new sap.suite.ui.microchart.InteractiveDonutChart({
			selectionEnabled : true,
			segments : []
		});
		this.setControl(this._chart);
		this.setModel(new JSONModel(), '__alp_chartJSONModel');
		this._otherField = "__IS_OTHER__"; // may need to replace if the data contains this
		this._sorters = [];
		FilterItemMicroChart.prototype.init.apply(this, arguments);
	};

	/**
	* Function to apply selections on the Donut
	* @param{object} custom data which has the dimension of the current segment
	* @param{object} Filters already present in this property
	* @return{object} Filters to be applied for this proeprty
	*
	*/
	FilterItemMicroDonut.prototype._applyDonutChartSelections = function (oCustomData, oDimensionFilter) {
		var aSegments = this._chart.getSegments(),
		sParentProperty = this.getParentProperty(),
		aSelectedItems = [],
		sSegmentCustomValue,
		oRange;
		// if others is selected
		if (oCustomData.dimValue === IS_OTHERS) {
			aSegments.forEach(function(oSegment) {
				sSegmentCustomValue = oSegment.getCustomData()[0].getValue();
				// get values of other segments that are selected
				if (sSegmentCustomValue !== IS_OTHERS) {
					if (oSegment.getSelected()) {
						aSelectedItems.push(sSegmentCustomValue);
						// remove selection
						//oSegment.setSelected(false);
					}
					oRange = {"exclude":true,"operation":"EQ"};
					oRange.keyField = sParentProperty;
					oRange.value1 = sSegmentCustomValue;
					oDimensionFilter.ranges.push(oRange);
				}
			});
			// if any segment other than others is selected
			// remove the selection from filter Data
			if (aSelectedItems.length > 0) {
				// remove from filter items
				oDimensionFilter.items = oDimensionFilter.items.filter(function (oItem) {
					return aSelectedItems.indexOf(oItem.key) === -1;
				});

				// remove from ranges
				oDimensionFilter.ranges = oDimensionFilter.ranges.filter(function (oRange) {
					return !(oRange.exclude === false
						&& oRange.operation === "EQ"
						&& oRange.keyField === sParentProperty
						&& aSelectedItems.indexOf(oRange.value1) > -1);
				});
			}
		} else {
			// if segment A or B is selected
			oDimensionFilter.items.push({
				key: oCustomData.dimValue,
				text: oCustomData.dimValueDisplay // oData.dimValueDisplay comes with TextArrangement from custome data so applying directly.
			});

			var bIsOthersSelected = false;
			// go through all segments, to check if others is selected
			aSegments.forEach(function(oSegment) {
				sSegmentCustomValue = oSegment.getCustomData()[0].getValue();
				if (sSegmentCustomValue === IS_OTHERS && oSegment.getSelected()) {
					// if others is selected
					bIsOthersSelected = true;
				}
				// get values of other segments that are selected
				if (sSegmentCustomValue !== IS_OTHERS) {
					aSelectedItems.push(sSegmentCustomValue);
				}
			});
			// if others is  already selected
			// remove all filters related to others selection from Dimension Filter
			// which will trigger the binding to remove the highlight
			if (bIsOthersSelected) {
				oDimensionFilter.ranges = oDimensionFilter.ranges.filter(function (oRange) {
					return !(oRange.exclude === true
						&& oRange.operation === "EQ"
						&& oRange.keyField === sParentProperty
						&& aSelectedItems.indexOf(oRange.value1) > -1);
				});
			}
		}
		return oDimensionFilter;
	};

	FilterItemMicroDonut.prototype._updateBinding = function() {
		this.applyOverlay();
		//To show the Busy Indicator immediately,
		//so that blank screen/chart is not shown
		this._chart.setBusyIndicatorDelay(0);
		// Set Chart to busy before rebinding
		this._chart.setBusy(true);
		this._chart.unbindSegments();
		// Make sure all binding are available
		var entityName = this.getEntitySet(),
		dimField = this.getDimensionField(),
		dimFieldDisplay = this.getDimensionFieldDisplay(),
		measureField = this.getMeasureField(),
		unitField = this.getUnitField(),
		filter = this.getDimensionFilterExternal(),
		aSortOrder = [], aSortFields = [],
		aSortOrder = this.getSortOrder(),
		oSortObject = FilterItemMicroChart._getSorter(aSortOrder);
		this._sorters = oSortObject.sorter;
		aSortFields = oSortObject.sortFields;

		if (!entityName || !measureField || !dimField || !dimFieldDisplay) {// All fields must be present
			return;
		}

		// Collect the select fields, so that duplicates can be removed
		var selectFields = [measureField, dimField, aSortFields];

		if (dimField != dimFieldDisplay) {
			selectFields.push(dimFieldDisplay);
		}

		if (unitField) {
			selectFields.push(unitField);
		}

		var filterList = [];
		if (filter && filter.aFilters && filter.aFilters.length) {
			filterList = [filter];
		}

		var me = this;
		var oModel = this.getModel();
		var sBindingPath = "/" + entityName;
		// odata call to get top 4 data
		if (oModel) {
			var oDatapoint = CriticalityUtil.getDataPoint(oModel, this);
			if (oDatapoint) {
				(oDatapoint.ValueFormat && oDatapoint.ValueFormat.ScaleFactor) ? this.setScaleFactor(FilterUtil.getPrimitiveValue(oDatapoint.ValueFormat.ScaleFactor)) : this.setScaleFactor(null);
				(oDatapoint.ValueFormat && oDatapoint.ValueFormat.NumberOfFractionalDigits) ? this.setNumberOfFractionalDigits(FilterUtil.getPrimitiveValue(oDatapoint.ValueFormat.NumberOfFractionalDigits)) : this.setNumberOfFractionalDigits(null);
				var aRelativeToProperties = CriticalityUtil.getCriticalityRefProperties(oDatapoint);
			}
			if (this.getSmartFilterId()) {//If it has reference to SmartFilterBar
				var oSmartFilterBar = sap.ui.getCore().byId(this.getSmartFilterId());
				if (oSmartFilterBar && oSmartFilterBar.getEntitySet() === entityName) {
					var oTemplatePrivate = this.getModel("_templPriv"),
					bIsSearchable = oTemplatePrivate.getProperty('/alp/searchable');
					if (bIsSearchable) {
						sBindingPath = this.considerAnalyticBinding(sBindingPath,oSmartFilterBar);
					} else {
						this.applyOverlay(this.requiredFilterMessage);
						return;
					}
				}
			}

			//To abort the previous read requests before calling read() again
			if (this._oTop4ReadObject) {
			    //jQuery.sap.log.info("abort() called in Donut chart");
			    this._oTop4ReadObject.abort();
			}

			if (this._oTotalReadObject) {
			    //jQuery.sap.log.info("abort() called in Donut chart");
			    this._oTotalReadObject.abort();
			}

			//Here count replaced with true or false to it's corresponding function parameter bToFetchTotalData in fetchData() method.
			//It's recommended to keep false in the last parameter than leaving it blank which also serves the purpose.
			var oTop4DataPromise = this._fetchData(oModel, sBindingPath, filterList, selectFields, false, aRelativeToProperties, oDatapoint),
			oTotalDataPromise = this._fetchData(oModel, sBindingPath, filterList, [measureField], true);
			// jQuery.when either waits for all promises to be resolved before executing handler, or
			// it executes the handler as soon as any promise is rejected,i.e., results in an error
			// For the sake of performance and code simplicity, even if one query fails we show technical issue overlay, and
			// we are not covering the scenario where total query might fail and top4 query will result in <=3 data
			jQuery.when(oTop4DataPromise, oTotalDataPromise).then(function(aTop4Data, aTotalData) {
				// all promsises are resolved
				// promise resolution is received as an array, index 0 is data and 1 is length
				if (!aTop4Data[1]) {
					// No Data overlay should show if top4data length === 0
					me.applyOverlay(me.noDataIssueMessage);
				} else if (aTop4Data[1] <= 3) {
					// chart should show if top4 data length <3
					me._onDataReceived(aTop4Data[0]);
				} else if (aTop4Data[1] > 3) {
					// chart should show if top4 data length > 3 and total data length > 0
					if (aTotalData[1]) {
						// show chart
						me._onDataReceived(aTop4Data[0], aTotalData[0]);
					} else {
						// show no data overlay
						me.applyOverlay(me.noDataIssueMessage);
					}
				}
			}, function(oError, bToFetchTotalData) {
				if (!oError || (oError.statusCode !== 0 && oError.statusText !== "abort")) {
					if (bToFetchTotalData === true) {
					    me._oTotalReadObject = null;
					} else {
					    me._oTop4ReadObject = null;
					}
					// any one promise is rejected
					// show technical overlay in case of failure
					me.applyOverlay(me.technicalIssueMessage);
				}
			});
		}
	};

	//Count is replaced with bToFetchTotalData to determing wheter this fuction is going to make call to fetch top4 results or the total records.
	FilterItemMicroDonut.prototype._fetchData = function (oModel, sBindingPath, filterList, selectFields, bToFetchTotalData, aRelativeToProperties, oDatapoint) {
		var me  = this;
		var oDeferred = new jQuery.Deferred();
		if (!oModel && !sBindingPath) {
			// set rejected
			oDeferred.reject(null, bToFetchTotalData);
		} else {
			var oDataBindingInfo = {
				async: true,
				filters: filterList,
				urlParameters: {
					"$select": aRelativeToProperties ? [aRelativeToProperties].concat(selectFields).join(",") : selectFields.join(","),
					"$top": (bToFetchTotalData) ? 1 : 4
				},
				success: function(data, response) {
					if (bToFetchTotalData === true) {
					    me._oTotalReadObject = null;
					} else {
					    me._oTop4ReadObject = null;
					}
					//set resolved
					data = oDatapoint ? CriticalityUtil.CalculateCriticality(oDatapoint, data, me.getMeasureField()) : data;
					var iDataLength = (data && data.results && data.results.length) ? data.results.length : 0;
					oDeferred.resolve(data, iDataLength);
				},
				error: function(error, bToFetchTotalData) {
					// set rejected
					oDeferred.reject(error, bToFetchTotalData);
				}
				};
				//Used bToFetchTotalData instead of bToFetchTop4Data for better readability
				if (!bToFetchTotalData) {
					//Only set if its a top4Data call
					oDataBindingInfo.sorters = this._sorters;
				}

			if (bToFetchTotalData) {
				this._oTotalReadObject = oModel.read(sBindingPath, oDataBindingInfo);
			} else {
				this._oTop4ReadObject = oModel.read(sBindingPath, oDataBindingInfo);
			}
		}
		return oDeferred.promise();
	};

	FilterItemMicroDonut.prototype._onDataReceived = function(oTop4Data, oTotalData) {
		var results = [],
		sDimensionFieldDisplay = this.getDimensionFieldDisplay(),
		sMeasureField = this.getMeasureField(),
		sDimensionField = this.getDimensionField();
		if (!oTotalData) {
			oTop4Data.results.forEach(function(data, index) {
				data['dimensionValue'] = data[sDimensionField];
				results.push(data);
			});
		} else {
			var fTotalTwo = 0,
			fOthers = 0;

			oTop4Data.results.forEach(function(data, index) {
				if (index < 2) {
					data['dimensionValue'] = data[sDimensionField];
					results.push(data);
					fTotalTwo += parseFloat(data[sMeasureField]);
				}
			});

			if (oTotalData) {
				oTotalData.results.forEach(function (data) {
					var i18nModel = this.getModel("i18n"),
					oDataObject	= jQuery.extend(true, {}, data);
					// if dimensionField and dimension field display are the same property
					// then '__IS_OTHER__' becomes 'Other' and there is no proper way to find out
					// which whether other section was clicked or not. Hence storing __IS_OTHER__
					// as dimensionValue
					oDataObject['dimensionValue'] = this._otherField;
					oDataObject[sDimensionField] = this._otherField;
					oDataObject[sDimensionFieldDisplay] = i18nModel ? i18nModel.getResourceBundle().getText("VIS_FILTER_DONUT_OTHER") : "";

					if (fTotalTwo < 0) {
						fOthers = parseFloat(data[sMeasureField]) + fTotalTwo;
					} else {
						fOthers = parseFloat(data[sMeasureField]) - fTotalTwo;
					}
					oDataObject[sMeasureField] = fOthers;
					results.push(oDataObject);
				}.bind(this));
			}
		}

		FilterItemMicroChart.prototype._onDataReceived.call(this, results);
		this.getModel('__alp_chartJSONModel').setData(results);
		this._chart.setModel(this.getModel('__alp_chartJSONModel'));

		var count = 3,
			dataBinding = {
			path: '/',
			template: new InteractiveDonutChartSegment(this._getChartAggregationSettings(true)),
			startIndex: 0,
			length: count
		};

		this._chart.bindSegments(dataBinding);
		this._chart.setBusy(false);
	};

	return FilterItemMicroDonut;

}, /* bExport= */ true);