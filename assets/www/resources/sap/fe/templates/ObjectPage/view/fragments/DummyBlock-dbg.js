sap.ui.define(['sap/uxap/BlockBase'],
	function (BlockBase) {
		"use strict";

		var DummyBlock = BlockBase.extend("sap.fe.templates.ObjectPage.view.fragments.DummyBlock", {
			metadata: {
				views: {
					Collapsed: {
						viewName: "sap.fe.templates.ObjectPage.view.fragments.DummyBlock",
						type: "XML"
					},
					Expanded: {
						viewName: "sap.fe.templates.ObjectPage.view.fragments.DummyBlock",
						type: "XML"
					}
				}
			}.fragments
		});

		return DummyBlock;

	});
