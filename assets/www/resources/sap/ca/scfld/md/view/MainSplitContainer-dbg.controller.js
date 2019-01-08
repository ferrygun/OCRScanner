/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.controller("sap.ca.scfld.md.view.MainSplitContainer", {

	onInit : function() {
		sap.ca.scfld.md.app.Application.getImpl().setSplitContainer(this.byId("MainSplitContainer"));
	}

});