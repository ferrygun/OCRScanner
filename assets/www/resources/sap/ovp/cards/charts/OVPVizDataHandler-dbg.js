sap.ui.define(["sap/ui/core/Control"], function(Control) {
	"use strict";
	return Control.extend("sap.ovp.cards.charts.OVPVizDataHandler", {
		metadata : {
			aggregations : {
				data : {
					type : "sap.ui.core.Element"
				},
				aggregateData : {
					type : "sap.ui.core.Element"
				},
				content : {
					multiple : false
				}
			},
			properties : {
				chartType : { defaultValue : false },
				dependentDataReceived : { defaultValue : false },
				scale : { defaultValue : "" },
				entitySet:{}
			}
		},
		renderer : function(renderer, control) {
			renderer.write("<div");
			renderer.writeElementData(control);
			renderer.write(">");
			if (control.getContent()) {
				renderer.renderControl(control.getContent());
			}
			renderer.write("</div>");
		},
		
		mergeDatasets : function (binding, oDataClone, content) {
			var that = this;
			var model = this.getModel();
			var parameters = binding.mParameters;
			var bData = jQuery.extend(true, {}, this.dataSet );
			var selectedProperties = parameters.select.split(",");
			var entitySetPath = binding.getPath().substring(1);
			var pos = -1;
			
			if ( entitySetPath ) {
				pos = entitySetPath.indexOf('Parameters');
			}
			if ( pos >= 0 ) {
				entitySetPath = entitySetPath.substr(0, entitySetPath.indexOf('Parameters'));
			}
			var metaModel = model.getMetaModel();
//			var entityset = this.getEntitySet();
			var entitySetName = this.getEntitySet();
			var entitySet = metaModel.getODataEntitySet(entitySetName);
			var entityType = metaModel.getODataEntityType(entitySet.entityType); 
			var finalMeasures = [];
			var finalDimensions = [];
			for ( var i = 0; i < entityType.property.length; i++ ) { //as part of supporting V4 annotation
                if (entityType.property[i]["com.sap.vocabularies.Analytics.v1.Measure"] || (entityType.property[i].hasOwnProperty("sap:aggregation-role") && entityType.property[i]["sap:aggregation-role"] === "measure")) {
					if ( selectedProperties.indexOf(entityType.property[i].name) !== -1 ) {
						finalMeasures.push(entityType.property[i].name);
					}
				} else {
					if ( selectedProperties.indexOf(entityType.property[i].name) !== -1 ) {
						finalDimensions.push(entityType.property[i].name);
					}
				}
			}
			
			if (bData && bData.results) {
				for (var i = 0;i < bData.results.length - 2;i++) {
					for (var j = 0;j < finalMeasures.length;j++) {
						bData.results[0][finalMeasures[j]] = Number(bData.results[0][finalMeasures[j]]) + Number(bData.results[i + 1][finalMeasures[j]]);
					}
				}
				var count = bData.__count - bData.results.length;
				var object = {};
				object.results = [];
				object.results[0] = bData.results[0];
				var result;
				
				if ( bData.__count > bData.results.length ) {
					var aggregateObject = jQuery.extend(true, {}, this.aggregateSet);
					if (aggregateObject && aggregateObject.results && bData.results.length < bData.__count ) {
						jQuery.each(finalMeasures,function(i){
								aggregateObject.results[0][finalMeasures[i]] = String(Number(that.aggregateSet.results[0][finalMeasures[i]]) - Number(object.results[0][finalMeasures[i]]));
						});
						jQuery.each(finalDimensions,function(i){
								aggregateObject.results[0][finalDimensions[i]] = sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("OTHERS_DONUT",[count + 1]);
						});
						aggregateObject.results[0].$isOthers = true;
						result = aggregateObject.results[0];
						
						if (result) {
							oDataClone.results.splice(-1,1);
						}
					}
				}
				if (result) {
					oDataClone.results.push(result);
				}
			}
			
			var oModel = new sap.ui.model.json.JSONModel();
			oModel.setData(oDataClone.results);
			content.setModel(oModel, "analyticalmodel");
		},
		
		updateBindingContext : function() {
			var binding = this.getBinding("data");
			var aggrDataBinding = this.getBinding("aggregateData");
			var that = this;
			if (this.chartBinding == binding) {
				return;
			} else {
				this.chartBinding = binding;
				if (binding) {
					var that = this;
					binding.attachEvent("dataReceived", function(oEvent) {
						that.dataSet = oEvent && oEvent.getParameter("data");
						that.oDataClone = jQuery.extend(true, {}, that.dataSet);
						if (that.getChartType() == "donut" ) {
							if ( that.getDependentDataReceived() === true || that.getDependentDataReceived() === "true" ) {
								
								that.mergeDatasets(binding,that.oDataClone,that.getContent());
								that.setDependentDataReceived(false);
							} else {
								that.setDependentDataReceived(true);
								//store data local
							}
						} else {
							var oModel = new sap.ui.model.json.JSONModel();
							if (that.dataSet) {
								oModel.setData(that.dataSet.results);
							}
							that.getContent().setModel(oModel, "analyticalmodel");
						}
						
					});
				}
				Control.prototype.updateBindingContext.apply(this, arguments);
			}
			if (this.chartAggrBinding == aggrDataBinding) {
				return;
			} else {
				this.chartAggrBinding = aggrDataBinding;
				if (aggrDataBinding) {
					var that = this;
					aggrDataBinding.attachEvent("dataReceived", function(oEvent) {
						that.aggregateSet = oEvent && oEvent.getParameter("data");
						if (that.getChartType() == "donut" ) {
							if ( that.getDependentDataReceived() === true || that.getDependentDataReceived() === "true" ) {
								that.oDataClone = jQuery.extend(true, {}, that.dataSet);
								that.mergeDatasets(binding,that.oDataClone,that.getContent());
								that.setDependentDataReceived(false);
							} else {
								that.setDependentDataReceived(true);
								//store data local
							}
						} else {
							var oModel = new sap.ui.model.json.JSONModel();
							oModel.setData(that.aggregateSet.results);
							that.getContent().setModel(oModel, "analyticalmodel");
						}
					});
				}
				Control.prototype.updateBindingContext.apply(this, arguments);
			}
		}

	});
}, true);
