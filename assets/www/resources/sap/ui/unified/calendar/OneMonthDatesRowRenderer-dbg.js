/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2017 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define(['sap/ui/core/Renderer', './MonthRenderer', './DatesRowRenderer'],
	function(Renderer, MonthRenderer, DatesRowRenderer) {
		"use strict";

		/**
		 * OneMonthDatesRowRenderer renderer.
		 * @namespace
		 */
		var OneMonthDatesRowRenderer = Renderer.extend(DatesRowRenderer);

		OneMonthDatesRowRenderer.getClass = function(oDatesRow){
			if (oDatesRow.iMode < 2) {
				return MonthRenderer.getClass(oDatesRow);
			} else {
				return DatesRowRenderer.getClass(oDatesRow);
			}
		};

		OneMonthDatesRowRenderer.renderMonth = function(oRm, oDatesRow, oDate) {
			if (oDatesRow.iMode < 2) {
				MonthRenderer.renderMonth.apply(this, arguments);
			} else {
				DatesRowRenderer.renderMonth.apply(this, arguments);
			}
		};

		/**
		 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer
		 * @param {sap.ui.unified.calendar.DatesRow} oDatesRow The DatesRow to be rendered
		 * @param {sap.ui.unified.calendar.CalendarDate} oDate The start date
		 */
		OneMonthDatesRowRenderer.renderDays = function(oRm, oDatesRow, oDate) {
			if (oDatesRow.iMode < 2) {
				MonthRenderer.renderDays(oRm, oDatesRow, oDate);
			} else {
				DatesRowRenderer.renderDays(oRm, oDatesRow, oDate);
			}
		};

		return OneMonthDatesRowRenderer;

	}, /* bExport=  */ true);
