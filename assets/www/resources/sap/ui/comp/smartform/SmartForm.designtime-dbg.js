/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides the Design Time Metadata for the sap.ui.comp.smartform.Group control
sap.ui.define([], function() {
	"use strict";

	return {
		aggregations: {
			groups: {
				propagateRelevantContainer: true,

				childNames: {
					singular: "GROUP_CONTROL_NAME",
					plural: "GROUP_CONTROL_NAME_PLURAL"
				},
				actions: {
					move: "moveGroups",
					createContainer: {
						changeType: "addGroup",
						isEnabled: true,
						getCreatedContainerId: function(sNewControlID) {
							return sNewControlID;
						}
					}
				}
			}
		},
		name: "{name}",
		description: "{description}",
		properties: {
			title: {
				ignore: false
			},
			useHorizontalLayout: {
				ignore: false
			},
			horizontalLayoutGroupElementMinWidth: {
				ignore: true
			},
			checkButton: {
				ignore: false
			},
			entityType: {
				ignore: true
			},
			expandable: {
				ignore: false
			},
			expanded: {
				ignore: false
			},
			editTogglable: {
				ignore: false
			},
			editable: {
				ignore: false
			},
			ignoredFields: {
				ignore: true
			},
			flexEnabled: {
				ignore: true
			}
		}
	};

}, /* bExport= */true);
