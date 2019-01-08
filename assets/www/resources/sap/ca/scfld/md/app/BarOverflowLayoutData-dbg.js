/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define(['sap/ui/core/LayoutData'],
	function(fnLayoutData) {
		"use strict";

		var BarOverflowLayoutData = fnLayoutData.extend("sap.ca.scfld.md.app.BarOverflowLayoutData", {

			metadata : {
				properties : {
					moveToOverflow : {
						type: "boolean",
						defaultValue: true
					},
					stayInOverflow : {
						type: "boolean",
						defaultValue: false
					},
					overflowButton: {
						type: "boolean",
						defaultValue: false
					}
				}
			}

		});


		return BarOverflowLayoutData;

}, /* bExport= */ true);
