sap.ui.define([
	"sap/ui/core/Element",
	"./Geometry"
], function (Element, Geometry) {

	/**
	 * Constructor for a new LayoutingAlgorithm.
	 *
	 * @class
	 * This is an abstract base class for Layout Algorithms.
	 * @abstract
	 *
	 * @extends sap.ui.core.Element
	 *
	 * @constructor
	 * @public
	 * @since 1.50
	 * @alias sap.suite.ui.commons.networkgraph.layout.LayoutAlgorithm
	 */
	var LayoutAlgorithm = Element.extend("sap.suite.ui.commons.networkgraph.layout.LayoutAlgorithm", {
		metadata: {
			"abstract": true,
			publicMethods: [
				"isLayered", "layout"
			]
		}
	});

	LayoutAlgorithm.NORMALIZED_LINES_MARGIN = 0.2;

	LayoutAlgorithm.prototype._normalizeLines = function () {
		var oGraph = this.getParent(),
			mPaths = {}, oKey, oPath, iIndex,
			oCentralVector, fNormSize, oShiftVector, fLineDistance,
			fLineShiftX, fLineShiftY;

		// First build a map of node combinations with all respective lines
		oGraph.getLines().forEach(function (oLine) {
			// We need to get lines going both ways between the same two nodes into one map slot
			oKey = oLine.getFrom() < oLine.getTo() ? oLine.getFrom() + "-" + oLine.getTo() : oLine.getTo() + "-" + oLine.getFrom();
			if (!mPaths[oKey]) {
				mPaths[oKey] = {
					from: oLine.getFromNode(),
					to: oLine.getToNode(),
					lines: []
				};
			}
			mPaths[oKey].lines.push(oLine);
		});

		Object.keys(mPaths).forEach(function (sKey) {
			oPath = mPaths[sKey];
			if (oPath.lines.length === 1) {
				oPath.lines[0]._normalizePath();
				return;
			}

			fNormSize = Math.min(oPath.from._getCircleSize(), oPath.to._getCircleSize()) / 2;
			fLineDistance = 2 * (1 - LayoutAlgorithm.NORMALIZED_LINES_MARGIN) / (oPath.lines.length - 1);
			iIndex = -1;

			oPath.lines.forEach(function (oLine) {
				iIndex++;
				oCentralVector = {center: oLine.getFromNode().getCenterPosition(), apex: oLine.getToNode().getCenterPosition()};
				oShiftVector = Geometry.getNormalizedVector(oCentralVector, fNormSize);
				oShiftVector = Geometry.getRotatedVector(oShiftVector, Math.PI / 2);
				fLineShiftX = ((LayoutAlgorithm.NORMALIZED_LINES_MARGIN - 1) + iIndex * fLineDistance) * oShiftVector.apex.x;
				fLineShiftY = ((LayoutAlgorithm.NORMALIZED_LINES_MARGIN - 1) + iIndex * fLineDistance) * oShiftVector.apex.y;
				oLine.setSource({
					x: oLine.getFromNode().getCenterPosition().x + fLineShiftX,
					y: oLine.getFromNode().getCenterPosition().y + fLineShiftY
				});
				oLine.setTarget({
					x: oLine.getToNode().getCenterPosition().x + fLineShiftX,
					y: oLine.getToNode().getCenterPosition().y + fLineShiftY
				});
			});
		});
	};

	/**
	 * Implement in inheriting classes.
	 * @abstract
	 *
	 * Specifies if this layouting algorithm distributes nodes into layers. Parent graph may change behaviour based
	 * on this option.
	 *
	 * @name sap.suite.ui.commons.networkgraph.LayoutAlgorithm.prototype.isLayered
	 * @function
	 * @public
	 */

	/**
	 * Implement in inheriting classes.
	 * @abstract
	 *
	 * Executes the layouting algorithm.
	 *
	 * @name sap.suite.ui.commons.networkgraph.LayoutAlgorithm.prototype.layout
	 * @function
	 * @returns {sap.suite.ui.commons.networkgraph.layout.LayoutTask}
	 * @public
	 */

	return LayoutAlgorithm;
});