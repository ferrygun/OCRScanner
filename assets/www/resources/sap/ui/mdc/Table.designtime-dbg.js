/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([], function () {
	"use strict";

	return {
		aggregations: {
			columns: {
				//childNames: {
				//	singular: "COLUMN_NAME",
				//	plural: "COLUMN_NAME_PLURAL"
				//},
				actions: {
					addODataProperty : "addColumn",
					move: "moveColumns",
					remove : "removeColumn"
				}
			},
			actions: {
			},
			_content : {
				ignore : true
			}
		},
		name: "{name}",
		description: "{description}",
		properties: {
			context: {
				ignore: true
			},
			tableBindingPath : {
				ignore : true
			},
			type : {
				ignore : false
			},
			interactionType : {
				ignore : false
			},
			filterBarId : {
				ignore : true
			},
			enabled : {
				ignore : true
			}
		}
	};

}, /* bExport= */ false);
