/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

sap.ui.define([
	'jquery.sap.global',
	'sap/ui/core/XMLComposite',
	'sap/ui/base/ManagedObject',
	'sap/ui/Device',
	'sap/fe/core/AnnotationHelper',
	'sap/ui/model/odata/v4/AnnotationHelper'
], function (jQuery, XMLComposite, ManagedObject, Device) {
	"use strict";
	var Form = XMLComposite.extend("sap.fe.Form", {
		metadata: {
			designTime: true,
			specialSettings: {
				metadataContexts: {
					defaultValue: "{ model: 'dataFieldCollectionModel', path:'',  name: 'dataFieldCollection'}"
				}
			},
			properties: {
				formElementsContextPath: {
					type: "any",
					invalidate: "template"
				},
				formTitle: {
					type: "string",
					invalidate: "template"
				}
			},
			events: {},
			aggregations: {},
			publicMethods: []
		},
		alias: "this",
		fragment: "sap.fe.controls._Form.Form"
	});

	Form.prototype.init = function () {};

	return Form;

}, /* bExport= */true);
