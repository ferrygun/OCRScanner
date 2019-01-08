sap.ui.define([], function(
) {
	"use strict";
	var Palette = {};

	Palette.CRITICALITY = {
		Positive: [
		    'sapUiChartPaletteSemanticGoodLight3',
		    'sapUiChartPaletteSemanticGoodLight2',
		    'sapUiChartPaletteSemanticGoodLight1',
		    'sapUiChartPaletteSemanticGood',
		    'sapUiChartPaletteSemanticGoodDark1',
		    'sapUiChartPaletteSemanticGoodDark2'
		],
		Critical: [
			'sapUiChartPaletteSemanticCriticalLight3',
			'sapUiChartPaletteSemanticCriticalLight2',
			'sapUiChartPaletteSemanticCriticalLight1',
			'sapUiChartPaletteSemanticCritical',
			'sapUiChartPaletteSemanticCriticalDark1',
			'sapUiChartPaletteSemanticCriticalDark2'
		],
		Negative: [
			'sapUiChartPaletteSemanticBadLight3',
			'sapUiChartPaletteSemanticBadLight2',
			'sapUiChartPaletteSemanticBadLight1',
			'sapUiChartPaletteSemanticBad',
			'sapUiChartPaletteSemanticBadDark1',
			'sapUiChartPaletteSemanticBadDark2'
		],
		Neutral: [
			'sapUiChartPaletteSemanticNeutralLight3',
			'sapUiChartPaletteSemanticNeutralLight2',
			'sapUiChartPaletteSemanticNeutralLight1',
			'sapUiChartPaletteSemanticNeutral',
			'sapUiChartPaletteSemanticNeutralDark1',
			'sapUiChartPaletteSemanticNeutralDark2'
		]
	};

	Palette.EMPHASIS = {
		Highlight: "sapUiChartPaletteQualitativeHue2",
		Others: "sapUiChartPaletteQualitativeHue1"
	};

	return Palette;
});