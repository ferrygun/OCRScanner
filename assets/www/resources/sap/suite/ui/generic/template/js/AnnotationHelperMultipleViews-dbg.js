sap.ui.define(["sap/suite/ui/generic/template/js/AnnotationHelper"],
	function(AnnotationHelper) {
		"use strict";
		
		// formatter called at templating time to decide whether the 'Multiple views in Single Table' feature should be realized via a SegmentedButton or a Select.
		function useSegmentedButton(oManifestPart) {
			var iCount = 0;
			for (var i in oManifestPart) {
				if (oManifestPart.hasOwnProperty(i)) {
					++iCount;
					if (iCount > 3) {
						return false;
					}
				}
			}
			return true;
		}
		
		// Formatter called at templating time to create the runtime binding for the text on the items
		function getTextForItem(oInterface, oQuickVariantSelection, oItemDef) {
			if (oQuickVariantSelection.showCounts){
				return "{path: '_templPriv>/listReport/multipleViews/items/" + oItemDef.key + "', formatter: '._templateFormatters.formatItemTextForMultipleView'}";
			}
			return sap.suite.ui.generic.template.js.AnnotationHelper.getIconTabFilterText(oInterface.getInterface(0), oItemDef);
		}

		function getVisibleForTableTabs(oTabItem) {
			
			return "{= ${_templPriv>/listReport/multipleViews/mode} !== 'multi' || ${_templPriv>/listReport/multipleViews/selectedKey} === '" + oTabItem.key + "' }";
		}
		getTextForItem.requiresIContext = true;
		
		sap.suite.ui.generic.template.js.AnnotationHelperMultipleViews = {
			useSegmentedButton: useSegmentedButton,
			getTextForItem: getTextForItem,
			getVisibleForTableTabs: getVisibleForTableTabs
		};
		
		return sap.suite.ui.generic.template.js.AnnotationHelperMultipleViews;
	});