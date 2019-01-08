sap.ui.define(["sap/ui/mdc/base/ConditionModel"], function (ConditionModel) {
	"use strict";

	function fnAddColumn(sMetaContextPath, iIndex, sLabel, oTable, oModifier, oModel){
		var oMetaModel = oModel.getMetaModel(),
			oMetadataRequest = oMetaModel.requestObject(sMetaContextPath);

		return oMetadataRequest.then(function () {
				var oInnerTable = oTable.getInnerTable(), // TODO does not work with modifier
					oPropertyContext = oMetaModel.createBindingContext(sMetaContextPath),
					sTableType = oModifier.getProperty(oTable, "type"),
					sFragmentName,
					oViewProcessor;

			if (sTableType === 'ResponsiveTable') {
				sFragmentName = "sap.ui.mdc.internal.table.responsivetable.AddColumnChange";
			} else if (sTableType === 'GridTable') {
				sFragmentName = "sap.ui.mdc.internal.table.gridtable.AddGridTableColumnChange";
			}

			try {

				var oViewProcessor = sap.ui.view({
					viewContent: '<core:View xmlns:core="sap.ui.core"><core:Fragment fragmentName="' + sFragmentName + '" type="XML"/></core:View>',
					type: "XML",
					async: true,
					preprocessors: {
						xml: {
							bindingContexts: {
								dataField: oPropertyContext
							},
							models: {
								dataField: oMetaModel
							}
						}
					}
				});
			} catch (e) {
				jQuery.sap.log.error(e);
			}

			return oViewProcessor.loaded().then(function () {
				var oColumn = oViewProcessor.getContent()[0].getColumns()[0],
					oCell, oListBindingTemplate, oColumnLabel, oListBindingInfo, oListBinding, oConditionModel;


				// FIXME: get rid of this workaround
				// the controls created through changes shall have the same prefix ID than the ones creates during the
				// initial template processing. If we set the same ID to the temp view which is created above the view
				// creation aborts due to duplicate IDs (although the view is never put into the DOM)
				// for a first test we directly update the generated ID and put the table's ID prefix to it
				oColumn.sId = oTable.getId() + '--' + oColumn.getId().split('--')[1];


				if (sLabel){
					// overwrite the label on the column - as the column exists as JS object we don't need to use
					// the modifier for this
					if (sTableType === 'ResponsiveTable') {
						oColumnLabel = oColumn.getHeader();
					} else if (sTableType === 'GridTable') {
						var oColumnLabel = oColumn.getLabel();
					}
					oColumnLabel.setText(sLabel);
				}

				oModifier.insertAggregation(oInnerTable, "columns", oColumn, iIndex);

				if (sTableType === 'ResponsiveTable') {
					// Responsive Table is special as the column and item is separated
					oCell = oViewProcessor.getContent()[1];
					oListBindingTemplate = oModifier.getBindingTemplate(oInnerTable, "items");
					oModifier.insertAggregation(oListBindingTemplate, "cells", oCell, iIndex);
				}

				// Destroy and create the list binding again
				oListBinding = oTable.getListBinding();
				oConditionModel = ConditionModel.getFor(oListBinding);
				oListBindingInfo = oTable.getListBindingInfo();
				oListBinding.getModel().unregisterNamedBinding(oListBinding);

				oTable.getInnerTable().bindItems({
					path: oListBindingInfo.path,
					template: oListBindingInfo.template,
					parameters: oListBindingInfo.parameters
				});

				if (oConditionModel) {
					oConditionModel.setFor(oTable.getListBinding());

					// this is questionable - depends on the fact if the already set filters will survive a variant
					// change - most likely not but for now apply the filters immediately
					oConditionModel.applyFilters();
					}

				return oColumn;
			});
		});
	}

	function fnRemoveColumn(sElementId, oTable, oModifier){
		var oInnerTable = oTable.getInnerTable(),
			sTableType = oModifier.getProperty(oTable, "type"),
			oListBindingTemplate,
			aColumns = oModifier.getAggregation(oInnerTable, "columns"),
			aCells,
			mRevertData = {},
			oColumnLabel,
			oColumn,
			aCustomData;

		for (var i = 0; i < aColumns.length; i++) {
			if (oModifier.getId(aColumns[i]) === sElementId) {
				oColumn = aColumns[i];
				aCustomData = oModifier.getAggregation(oColumn, "customData");
				for (var c = 0; c < aCustomData.length; c++){
					if (oModifier.getProperty(aCustomData[c], "key") === "metaContextPath"){
						mRevertData.metaContextPath = oModifier.getProperty(aCustomData[c], "value");
					}
				}

				mRevertData.index = i;
				//mRevertData.id = oModifier.getId(oColumn);

				if (sTableType === 'ResponsiveTable') {
					oColumnLabel = oModifier.getAggregation(oColumn, "header");
				} else if (sTableType === 'GridTable') {
					oColumnLabel = oModifier.getAggregation(oColumn, "label");
				}
				mRevertData.label = oModifier.getProperty(oColumnLabel, "text");

				oModifier.removeAggregation(oInnerTable, "columns", oColumn);

				if (sTableType === 'ResponsiveTable') {
					oListBindingTemplate = oModifier.getBindingTemplate(oInnerTable, "items");
					aCells = oModifier.getAggregation(oListBindingTemplate, "cells");
					oModifier.removeAggregation(oListBindingTemplate, "cells", aCells[i]);
				}

				return mRevertData;
			}
		}
	}

	function fnMoveColumn(sElementId, sTargetIndex, oTable, oModifier){
		var oInnerTable = oTable.getInnerTable(),
			aColumns = oModifier.getAggregation(oInnerTable, "columns"),
			sTableType = oModifier.getProperty(oTable, "type"),
			oListBindingTemplate, aCells;


		for (var i = 0; i < aColumns.length; i++) {
			if (oModifier.getId(aColumns[i]) === sElementId){
				oModifier.removeAggregation(oInnerTable, "columns", aColumns[i]);
				oModifier.insertAggregation(oInnerTable, "columns", aColumns[i], sTargetIndex);

				if (sTableType === 'ResponsiveTable') {
					oListBindingTemplate = oModifier.getBindingTemplate(oInnerTable, "items");
					aCells = oModifier.getAggregation(oListBindingTemplate, "cells");
					oModifier.removeAggregation(oListBindingTemplate, "cells", aCells[i]);
					oModifier.insertAggregation(oListBindingTemplate, "cells", aCells[i], sTargetIndex);
				}
			}
		}
	}

	return {
		"addColumn": {
			applyChange: function (oChange, oTable, mPropertyBag) {
				var oChangeDefinition = oChange.getDefinition(),
					sMetaContextPath  = oChangeDefinition.content.bindingString,
					sLabel = oChangeDefinition.content.label,
					iIndex = oChangeDefinition.content.index,
					oModifier = mPropertyBag.modifier,
					oModelContainer = mPropertyBag.appComponent || mPropertyBag.view,
					oModel = oModelContainer ? oModelContainer.getModel() : undefined;

				if (!oModel instanceof sap.ui.model.odata.v4.ODataModel){
					jQuery.sap.log.error("Change can't be applied without a container having a Odata v4 model assigned");
					return false;
				}

				return fnAddColumn(sMetaContextPath, iIndex, sLabel, oTable, oModifier, oModel).then(function(oColumn){
					oChange.setRevertData({
						elementId: oModifier.getId(oColumn)
					});
				});
			},

			revertChange: function (oChange, oTable, mPropertyBag) {
				var mRevertData = oChange.getRevertData();

				if (mRevertData) {
					fnRemoveColumn(mRevertData.elementId, oTable, mPropertyBag.modifier);
					oChange.resetRevertData();
				} else {
					jQuery.sap.log.error("Attempt to revert an unapplied change.");
					return false;
				}

				return true;
			}
		},

		"moveColumns": {
			applyChange: function (oChange, oTable, mPropertyBag) {
				var oChangeDefinition = oChange.getDefinition(),
					aMovedElements = oChangeDefinition.content.movedElements;

				for (var x = 0; x < aMovedElements.length; x++) {
					fnMoveColumn(aMovedElements[x].element, aMovedElements[x].targetIndex, oTable, mPropertyBag.modifier);
				}

				return true;
			},

			revertChange: function (oChange, oTable, mPropertyBag) {
				var oChangeDefinition = oChange.getDefinition(),
					aMovedElements = oChangeDefinition.content.movedElements;

				for (var x = 0; x < aMovedElements.length; x++) {
					fnMoveColumn(aMovedElements[x].element, aMovedElements[x].sourceIndex, oTable, mPropertyBag.modifier);
				}

				return true;
			}
		},

		"removeColumn": {
			applyChange: function (oChange, oTable, mPropertyBag) {
				var oChangeDefinition = oChange.getDefinition(),
					mRevertData;

				mRevertData = fnRemoveColumn(oChangeDefinition.content.removedElement, oTable, mPropertyBag.modifier);

				oChange.setRevertData(mRevertData);

				return true;
			},

			revertChange: function (oChange, oTable, mPropertyBag) {
				var mRevertData = oChange.getRevertData(),
					oModelContainer = mPropertyBag.appComponent || mPropertyBag.view,
					oModel = oModelContainer ? oModelContainer.getModel() : undefined;

				if (mRevertData) {
					return fnAddColumn(mRevertData.metaContextPath, mRevertData.index, mRevertData.label, oTable, mPropertyBag.modifier, oModel).then(function(){
						oChange.resetRevertData();
					});
				} else {
					jQuery.sap.log.error("Attempt to revert an unapplied change.");
					return false;
				}
			}
		},

		"setTableType": {
			// This change is only experimental
			applyChange: function (oChange, oTable, mPropertyBag) {
				var oChangeDefinition = oChange.getDefinition(),
					sCurrentTableType = oTable.getType(),
					oModifier = mPropertyBag.modifier;

				// TODO changing the table type needs a re-templating, this is not yet working
				oModifier.setProperty(oTable, "type", oChangeDefinition.content.tableType);

				oChange.setRevertData({
					originalTableType : sCurrentTableType
				});

				return true;
			},

			revertChange: function (oChange, oTable, mPropertyBag) {
				var mRevertData = oChange.getRevertData(),
					oModifier = mPropertyBag.modifier;

				if (mRevertData) {
					// TODO changing the table type needs a re-templating, this is not yet working
					oModifier.setProperty(oTable, "type", mRevertData.originalTableType);
				} else {
					jQuery.sap.log.error("Attempt to revert an unapplied change.");
					return false;
				}
			}
		}
	};
}, /* bExport= */false);
