/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2017 SAP SE. All rights reserved
 */

/* -----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying
 * source files only (*.type, *.js) or they will be lost after the next generation.
 * ----------------------------------------------------------------------------------- */

/**
 * Initialization Code and shared classes of library sap.collaboration (1.52.0)
 */
jQuery.sap.declare("sap.collaboration.library");
jQuery.sap.require("sap.ui.core.Core");
/**
 * SAP UI library: SAP Collaboration for Social Media Integration.
 *
 * @namespace
 * @name sap.collaboration
 * @public
 */


// library dependencies
jQuery.sap.require("sap.ui.core.library");
jQuery.sap.require("sap.suite.ui.commons.library");

// delegate further initialization of this library to the Core
sap.ui.getCore().initLibrary({
	name : "sap.collaboration",
	dependencies : ["sap.ui.core","sap.suite.ui.commons"],
	types: [
		"sap.collaboration.AppType",
		"sap.collaboration.DisplayFeedType",
		"sap.collaboration.FeedType"
	],
	interfaces: [],
	controls: [],
	elements: [],
	version: "1.52.0"
});

/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2017 SAP SE. All rights reserved
 */

/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.type, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides enumeration sap.collaboration.AppType.
jQuery.sap.declare("sap.collaboration.AppType");
/**
 * @class Application Type (Mode)
 *
 * @version 1.52.0
 * @static
 * @public
 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
 */
sap.collaboration.AppType = {

	/**
	 * Fiori Split App
	 * @public
	 */
	split : "split",

	/**
	 * SAP Jam Feed Widget Wrapper
	 * @public
	 */
	widget : "widget"

};
/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2017 SAP SE. All rights reserved
 */

/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.type, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides enumeration sap.collaboration.DisplayFeedType.
jQuery.sap.declare("sap.collaboration.DisplayFeedType");
/**
 * @class Feed Types to be displayed by the Social Timeline
 *
 * @version 1.52.0
 * @static
 * @public
 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
 */
sap.collaboration.DisplayFeedType = {

	/**
	 * The main feed for the Business Record Feed
	 * @public
	 */
	BusinessRecordFeed : "BusinessRecordFeed",

	/**
	 * Group feeds where the business record is primary or featured
	 * @public
	 */
	GroupFeedsWhereBusinessRecordIsLinked : "GroupFeedsWhereBusinessRecordIsLinked"

};
/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2017 SAP SE. All rights reserved
 */

/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.type, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides enumeration sap.collaboration.FeedType.
jQuery.sap.declare("sap.collaboration.FeedType");
/**
 * @class Feed Types
 *
 * @version 1.52.0
 * @static
 * @public
 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
 */
sap.collaboration.FeedType = {

	/**
	 * Follows feed type
	 * @public
	 * @deprecated Since version 1.30.0. 
	 * The feed type was deprecated because the original feed dialog component does not use it anymore.
	 * It also does not conform to naming conventions.
	 */
	follows : "follows",

	/**
	 * Company feed type
	 * @public
	 * @deprecated Since version 1.30.0. 
	 * The feed type was deprecated because the original feed dialog component does not use it anymore.
	 * It also does not conform to naming conventions.
	 */
	company : "company",

	/**
	 * Group feed type
	 * @public
	 * @deprecated Since version 1.30.0. 
	 * The feed type was deprecated because the original feed dialog component does not use it anymore.
	 * It also does not conform to naming conventions.
	 */
	group : "group",

	/**
	 * Object group feed type
	 * @public
	 * @deprecated Since version 1.30.0. 
	 * The feed type was deprecated because the original feed dialog component does not use it anymore.
	 * It also does not conform to naming conventions.
	 */
	objectGroup : "objectGroup",

	/**
	 * Oject feed type
	 * @public
	 * @deprecated Since version 1.30.0. 
	 * The feed type was deprecated because the original feed dialog component does not use it anymore.
	 * It also does not conform to naming conventions.
	 */
	object : "object",

	/**
	 * The mode type that accepts an array of group IDs. Users will be able to select these groups from a selector. The list will have the groups' names.
	 * @public
	 */
	GroupIds : "GroupIds",

	/**
	 * The mode type that accepts the OData details of a business object. Users will be able to select groups where the business object is featured or primary.
	 * @public
	 */
	BusinessObjectGroups : "BusinessObjectGroups",

	/**
	 * Users of this mode type will be able to select from groups where they are members. This mode is used by the feed component. In the feed component, the list of groups displayed in the pop up will be the current user's personal groups.
	 * @public
	 */
	UserGroups : "UserGroups"

};
