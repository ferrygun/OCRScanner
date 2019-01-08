/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	"./library",
	'sap/ui/mdc/XMLComposite',
	'sap/ui/base/ManagedObject',
	'sap/ui/Device',
	"sap/ui/mdc/internal/common/Helper",
	"sap/ui/mdc/FilterField",
	"sap/m/SearchField",
	'sap/ui/mdc/base/ConditionModel'
], function (Library, XMLComposite, ManagedObject, Device, CommonHelper, FilterField, SearchField, ConditionModel) {
	"use strict";
	var FilterBar = XMLComposite.extend("sap.ui.mdc.FilterBar", {
		metadata: {
			designTime: true,
			specialSettings: {
				metadataContexts: {
					defaultValue: "{ model: 'entitySet', path:'',  name: 'entitySet'},{model: 'sap.fe.deviceModel', path: '/', name: 'sap.fe.deviceModel'}"
				}
			},
			properties: {
				liveUpdate: {
					type: "boolean",
					defaultValue: !Device.system.phone, // filtering should be via Go button on phone by default
					invalidate: "template"
				},
				searchOnStart: {
					type: "boolean",
					defaultValue: true,
					invalidate: "template"
				},
				filterSummary: {
					type: "string",
					defaultValue: "",
					invalidate: false
				},
				enabled: {
					type: "boolean",
					defaultValue: true,
					invalidate: false
				},
				conditionModelName: {
					type: "string",
					defaultValue: "sap.fe.cm",
					invalidate: false
				},
				// comma separated list of named binding ids, currently only one is supported
				listBindingNames: {
					type: "string[]",
					invalidate: false
				}
			},
			events: {
				search: {},
				change: {}
			},
			aggregations: {},
			publicMethods: []
		},
		fragment: "sap.ui.mdc.internal.filterbar.FilterBar"
	});


	var fnSearch = function(oEvent){
		var oConditionModel = this._getConditionModel(),
			oModel = this.getModel(),
			aListBindingNames, sSearchString, bFilterWithoutErrors;

		bFilterWithoutErrors = oConditionModel.applyFilters();

		if (bFilterWithoutErrors && oModel.getBindingForReference){
			var oSearchControl = this._getSearchControl();
			if (oSearchControl){
				sSearchString = oSearchControl.getValue() || undefined;
				aListBindingNames = this.getListBindingNames();

				aListBindingNames.forEach(function(sListBindingName){
					oModel.getBindingForReference(sListBindingName).then(function(oListBinding){
						oListBinding.changeParameters({
							$search : sSearchString
						});
					});
				});
			}
		}
	};

	FilterBar.prototype.init = function () {
		XMLComposite.prototype.init.call(this);

		var that = this;
		this._bIsReady = false;
		this.attachSearch(fnSearch);

		this._requestConditionModel().then(function(oConditionModel){
			if (!that.bInitialized) {
				that.bInitialized = true;

				var oConditionChangeBinding = oConditionModel.bindProperty("/", oConditionModel.getContext("/"));
				oConditionChangeBinding.attachChange(that.handleChange.bind(that));

				if (that.getSearchOnStart() && that.getEnabled()) {
					that._bIsReady = true;
					that.fireSearch();
				}

				if (!that.getEnabled()) {
					that._getInnerFilterBar().setBusy(true);
				}
			}
		});

	};

	FilterBar.prototype.onBeforeRendering = function () {
		this._setFilterSummary();
	};

	FilterBar.prototype.setEnabled = function (bEnabled) {
		this._getInnerFilterBar().setBusy(!bEnabled);
		this.setProperty("enabled", bEnabled);

		if (bEnabled) {
			if (this.bInitialized && this.getSearchOnStart()) {
				this._bIsReady = true;
				this.fireSearch();
			}
		}
	};

	FilterBar.prototype.isReady = function () {
		/* tells the connected controls if the filter bar is ready
		 ready = table is set to immediately search / user clicked on GO
		 = the control and all filter items are instanced
		 = the app state is applied if existing
		 = the (default) variant is loaded if existing
		 better name for method is welcome :-)
		 */
		return this._bIsReady;
	};

	FilterBar.prototype.getAppState = function () {
		// TODO: this only works if the condition model is created
		//       we should think about using request condition model as well and convert this into async
		var oConditionModel = this._getConditionModel(),
			oDraftEditState = this._getDraftEditStateControl(),
			oSearch = this._getSearchControl(),
			oAppState = {};

		if (oConditionModel) {
			oAppState.conditionModel = oConditionModel.serialize();
		}

		if (oDraftEditState) {
			oAppState.draftEditState = oDraftEditState.getSelectedKey();
		}

		if (oSearch) {
			oAppState.search = oSearch.getValue();
		}

		return oAppState;
	};

	FilterBar.prototype.setAppState = function (oAppState) {
		var that = this;

		return this._requestConditionModel().then(function(oConditionModel){
			var oDraftEditState = that._getDraftEditStateControl(),
				oSearch = that._getSearchControl();

			if (oAppState.conditionModel) {
				if (oConditionModel) {
					oConditionModel.parse(oAppState.conditionModel);
				} else {
					throw ("app state contains condition model state but condition model not yet set");
				}
			}

			if (oAppState.draftEditState && oDraftEditState) {
				oDraftEditState.setSelectedKey(oAppState.draftEditState);
			}

			if (oAppState.search && oSearch) {
				oSearch.setValue(oAppState.search);
			}

			if (!that.getLiveUpdate()) {
				that.handleGo();
			}
		});
	};

	/********** EVENT HANDLER ***************************************/

	FilterBar.prototype.handleChange = function () {
		// this event is fired once the user changed any filter and the live update is set
		// also it's only fired if it's enabled - in case it's disabled changes can not be done by the user - for
		// example via setting the app state - and no event is expected
		if (this.getLiveUpdate() && this.getEnabled()) {
			this.fireSearch();
			this._setFilterSummary();
			this.fireChange();
		} else {
			this._bIsReady = false;
			this.fireChange();
		}
	};

	FilterBar.prototype.handleSearch = function (oEvent) {
		// this event is fired when the user clicks enter in the search field or on the search icon
		this.fireSearch();
		this._setFilterSummary();
		this.fireChange();
	};

	FilterBar.prototype.handleSearchChange = function (oEvent) {
		// the live search is triggered but only if the user didn't type for a given time frame (400ms)
		var that = this,
			iSearchCounter;

		if (that._iSearchCounter){
			that._iSearchCounter++;
		} else {
			that._iSearchCounter = 1;
		}

		iSearchCounter = that._iSearchCounter;

		if (this.getLiveUpdate()) {
			setTimeout(function(){
				if (iSearchCounter === that._iSearchCounter){
					that.fireSearch();
					that._setFilterSummary();
					that.fireChange();
					delete that._iSearchCounter;
				}
			}, 400);
		} else {
			this._bIsReady = false;
			this.fireChange();
		}
	};

	FilterBar.prototype.handleGo = function () {
		this._bIsReady = true;
		this.fireSearch();
		this._setFilterSummary();
		this.fireChange();
	};

	/********** PRIVATE METHODS *************************/

	FilterBar.prototype._getInnerFilterBar = function () {
		return this.get_content();
	};

	FilterBar.prototype._setFilterSummary = function () {
		var oSearch = this._getSearchControl(),
			oDraftEditState = this._getDraftEditStateControl(),
			sSearch, sFilterSummary = "", aFilter = [], i;

		if (oSearch) {
			sSearch = oSearch.getValue();
		}

		if (sSearch) {
			sFilterSummary = Library.getText("filterbar.SEARCHBY") + ": " + sSearch + ((aFilter.length > 0) ? " | " : "");
		}

		if (oDraftEditState && oDraftEditState.getSelectedKey() !== '0') {
			aFilter.push(Library.getText("filterbar.EDITING_STATUS"));
		}

		var aFilterFields = this._getFilterFieldControls();

		for (i = 0; i < aFilterFields.length; i++) {
			if (aFilterFields[i].getConditions().length > 0) {
				// we park the title of the filter in the custom data - this will be changed with the next release
				aFilter.push(aFilterFields[i].getCustomData()[0].getValue());
			}
		}

		if (aFilter.length > 0) {
			sFilterSummary += Library.getText("filterbar.FILTERBY") + " (" + aFilter.length + "): ";
			for (i = 0; i < aFilter.length; i++) {
				sFilterSummary += ((i > 0) ? ', ' : '') + aFilter[i];
			}
		}

		if (!sFilterSummary) {
			sFilterSummary = Library.getText("filterbar.FILTERBYNONE");
		}

		this.setFilterSummary(sFilterSummary);

	};

	FilterBar.prototype._requestConditionModel = function () {
		var oConditionModel = this._getConditionModel(),
			that = this;

		if (oConditionModel) {
			return Promise.resolve(oConditionModel);
		} else {
			return new Promise(function (fnResolve) {
				var oModel = that.getModel();

				var fnCreateConditionModel = function(){
					var oModel, oConditionModel, aNamedBindings;

					that.detachModelContextChange(fnCreateConditionModel);


					oConditionModel = that.getModel(that.getConditionModelName());
					if (oConditionModel){
						// possible that another thread already created the condition model
						return Promise.resolve(oConditionModel);
					} else {
						oModel = oModel || that.getModel();
						aNamedBindings = that.getListBindingNames();

						//create the condition model only if named bindings are available
						if (aNamedBindings && oModel.getBindingForReference) {
							aNamedBindings.forEach(function(sNamedListBinding) {
								oModel.getBindingForReference(sNamedListBinding).then(function(oListBinding){
									oConditionModel = ConditionModel.getFor(oListBinding);
									this.setModel(oConditionModel, this.getConditionModelName());
									fnResolve(oConditionModel);
								}.bind(this));
							}.bind(that));
						}
					}
				};

				if (oModel){
					fnCreateConditionModel();
				} else {
					that.attachModelContextChange(fnCreateConditionModel);
				}
			});
		}
	};

	FilterBar.prototype._getConditionModel = function () {
		return this.getModel(this.getConditionModelName());
	};

	FilterBar.prototype._getDraftEditStateControl = function () {
		var aContent = this._getInnerFilterBar().getContent();
		var oFilterItem;

		for (var i = 0; i < aContent.length; i++) {
			if (!(aContent[i] instanceof FilterField) && aContent[i].getItems) {
				oFilterItem = aContent[i].getItems()[1];
				if (oFilterItem.getBinding("items") && oFilterItem.getBinding("items").getPath() === "/editStates" && oFilterItem.getBinding("items").getModel() === oFilterItem.getModel("$draft")) {
					return oFilterItem;
				}
			}
		}
	};

	FilterBar.prototype._getSearchControl = function () {
		var aContent = this._getInnerFilterBar().getContent();
		var oFilterItem;

		for (var i = 0; i < aContent.length; i++) {
			oFilterItem = aContent[i].getItems()[1];
			if (oFilterItem instanceof SearchField) {
				return oFilterItem;
			}
		}
	};

	FilterBar.prototype._getFilterFieldControls = function () {
		// FIXME: this returns the MDC Filter Fields, this is required by some methods
		// TODO: check if this is needed at all
		// we should return the sap.fe.filterFields and provide the needed methods here so no other method is accessing
		// the mdc field directly
		var aContent = this._getInnerFilterBar().getContent();
		var oFilterField,
			aFilterFields = [];

		for (var i = 0; i < aContent.length; i++) {
			oFilterField = aContent[i];
			if (oFilterField instanceof FilterField) {
				aFilterFields.push(oFilterField.get_content().getItems()[1]);
			}
		}

		return aFilterFields;
	};

	/********** STATIC HELPER FOR CONTROL TEMPLATE *************************/

	FilterBar._helper = {
		isPropertyFilterable: function (oContext, property) {
			var sEntitySetPath,
				sProperty,
				bIsNotFilterable = false,
				oModel = oContext.getModel(),
				sPropertyPath = oContext.getPath();

			if (oModel.getObject(sPropertyPath + "@com.sap.vocabularies.UI.v1.Hidden")) {
				return false;
			}
			if (oModel.getObject(sPropertyPath + "@com.sap.vocabularies.UI.v1.HiddenFilter")) {
				return false;
			}

			sEntitySetPath = CommonHelper._getEntitySetPath(oModel, sPropertyPath);
			if (typeof (property) === "string") {
				sProperty = property;
			} else {
				sProperty = oModel.getObject(sPropertyPath + "@sapui.name");
			}
			if (sProperty.indexOf("/") < 0) {
				bIsNotFilterable = FilterBar._helper._isInNonFilterableProperties(oModel, sEntitySetPath, sProperty);
			} else {
				bIsNotFilterable = FilterBar._helper._isContextPathFilterable(oModel, sEntitySetPath, sProperty);
			}

			return !bIsNotFilterable;
		},

		isNavPropertyFilterable: function (oContext, navProperty) {
			var sEntitySetPath,
				sContext,
				bIsNotFilterable = false,
				sPropertyPath = oContext.getPath(),
				oModel = oContext.getModel();

			sEntitySetPath = CommonHelper._getEntitySetPath(oModel, sPropertyPath);
			sContext = sPropertyPath.slice(sEntitySetPath.length + 1);
			if (sContext.indexOf("/") < 0) {
				bIsNotFilterable = FilterBar._helper._isInNonFilterableProperties(oModel, sEntitySetPath, sContext);
			} else {
				bIsNotFilterable = FilterBar._helper._isContextPathFilterable(oModel, sEntitySetPath, sContext);
			}
			return !bIsNotFilterable;
		},

		_isInNonFilterableProperties: function (oModel, sEntitySetPath, sContextPath) {
			var bIsNotFilterable = false;
			var oAnnotation = oModel.getObject(sEntitySetPath + "@Org.OData.Capabilities.V1.FilterRestrictions");
			if (oAnnotation && oAnnotation.NonFilterableProperties) {
				bIsNotFilterable = oAnnotation.NonFilterableProperties.some(function(property) {
					return property.$NavigationPropertyPath === sContextPath || property.$PropertyPath === sContextPath;
				});
			}
			return bIsNotFilterable;
		},

		_isContextPathFilterable: function (oModel, sEntitySetPath, sContexPath) {
			var aContext = sContexPath.split("/"),
				bIsNotFilterable = false,
				sContext = "";

			aContext.some(function(item, index, array) {
				if (sContext.length > 0) {
					sContext += "/" + item;
				} else {
					sContext = item;
				}
				if (index === array.length - 1) {
					//last path segment
					bIsNotFilterable = FilterBar._helper._isInNonFilterableProperties(oModel, sEntitySetPath, sContext);
				} else if (oModel.getObject(sEntitySetPath + "/$NavigationPropertyBinding/" + item)) {
					//check existing context path and initialize it
					bIsNotFilterable = FilterBar._helper._isInNonFilterableProperties(oModel, sEntitySetPath, sContext);
					sContext = "";
					//set the new EntitySet
					sEntitySetPath = "/" + oModel.getObject(sEntitySetPath + "/$NavigationPropertyBinding/" + item);
				}
				return bIsNotFilterable === true;
			});
			return bIsNotFilterable;
		},
		replaceSpecialCharsInId : function(sId){
			return CommonHelper.replaceSpecialCharsInId(sId);
		}
	};

	FilterBar._helper.isNavPropertyFilterable.requiresIContext = true;
	FilterBar._helper.isPropertyFilterable.requiresIContext = true;

	return FilterBar;

}, /* bExport= */true);
