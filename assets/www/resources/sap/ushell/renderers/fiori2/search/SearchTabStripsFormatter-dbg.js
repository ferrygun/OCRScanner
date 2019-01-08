/* global jQuery, sap */

sap.ui.define([], function() {
    "use strict";

    var module = sap.ushell.renderers.fiori2.search.SearchTabStripsFormatter = {};

    // =======================================================================
    // tree node
    // =======================================================================

    module.Node = function() {
        this.init.apply(this, arguments);
    };

    module.Node.prototype = {

        init: function(dataSource, count) {
            this.dataSource = dataSource;
            this.children = [];
            this.parent = null;
            this.count = count;
        },

        equals: function(other) {
            return this === other;
        },

        setCount: function(count) {
            this.count = count;
        },

        getAncestors: function() {
            /* eslint consistent-this: 0 */
            var ancestors = [],
                currentNode = this;
            while (currentNode.parent) {
                ancestors.push(currentNode.parent);
                currentNode = currentNode.parent;
            }
            return ancestors;
        },

        getChildren: function() {
            // collect children, ignore children with unsure path information
            var children = [];
            for (var i = 0; i < this.children.length; ++i) {
                var child = this.children[i];
                if (child.unsureWhetherNodeisBelowRoot) {
                    continue;
                }
                children.push(child);
            }
            return children;
        },

        getChildrenSortedByCount: function() {
            // collect children, ignore children with unsure path information
            var children = this.getChildren();
            // sort by count
            children.sort(function(c1, c2) {
                return c2.count - c1.count;
            });
            return children;
        },

        clearChildren: function() {
            for (var i = 0; i < this.children.length; ++i) {
                var child = this.children[i];
                child.parent = null;
            }
            this.children = [];
        },

        appendNode: function(node) {
            node.parent = this;
            this.children.push(node);
        },

        appendNodeAtIndex: function(node, index) {
            node.parent = this;
            this.children.splice(index, 0, node);
        },

        removeChildNode: function(node) {

            // remove from children
            var index = this.children.indexOf(node);
            if (index < 0) {
                return;
            }
            this.children.splice(index, 1);

            // node now has no parent
            node.parent = null;

        },

        hasChild: function(node) {
            return this.children.indexOf(node) > -1;
        },

        hasSibling: function(node) {
            if (this.equals(node)) {
                return false;
            }
            var parent = this.parent;
            if (!parent) {
                return false;
            }
            if (parent.hasChild(node)) {
                return true;
            }
            return false;
        },

        _findNode: function(dataSource, result) {
            if (this.dataSource.equals(dataSource)) {
                result.push(this);
                return;
            }
            for (var i = 0; i < this.children.length; ++i) {
                var child = this.children[i];
                child._findNode(dataSource, result);
                if (result.length > 0) {
                    return;
                }
            }
        }

    };

    // =======================================================================
    // tree
    // =======================================================================
    module.Tree = function() {
        this.init.apply(this, arguments);
    };

    module.Tree.prototype = {

        init: function(rootDataSource) {
            this.rootNode = new module.Node(rootDataSource, null);
        },

        reset: function() {
            this.rootNode = null;
        },

        invalidate: function(dataSource) {
            var node = this.findNode(dataSource);
            if (!node) {
                this.rootNode.children = [];
                this.rootNode.count = 0;
                return;
            }
            var childNode = null;
            while (node) {
                node.children = childNode ? [childNode] : [];
                node.count = null;
                if (childNode) {
                    childNode.count = null;
                }
                childNode = node;
                node = node.parent;
            }
        },

        findNode: function(dataSource) {
            if (!this.rootNode) {
                return null;
            }
            var result = [];
            this.rootNode._findNode(dataSource, result);
            return result.length > 0 ? result[0] : null;
        },

        hasChild: function(ds1, ds2) {
            if (ds2.equals(this.rootNode.dataSource)) {
                return false;
            }
            var node1 = this.findNode(ds1);
            if (!node1) {
                //throw 'No node for datasource ' + ds1.toString();
                return false;
            }
            var node2 = this.findNode(ds2);
            if (!node2) {
                //throw 'No node for datasource ' + ds2.toString();
                return false;
            }
            return node1.hasChild(node2);
        },

        hasSibling: function(ds1, ds2) {
            if (ds2.equals(this.rootNode.dataSource)) {
                return false;
            }
            var node1 = this.findNode(ds1);
            if (!node1) {
                //throw 'No node for datasource ' + ds1.toString();
                return false;
            }
            var node2 = this.findNode(ds2);
            if (!node2) {
                //throw 'No node for datasource ' + ds2.toString();
                return false;
            }
            return node1.hasSibling(node2);
        },

        updateFromPerspective: function(dataSource, perspective, model) {

            // update current tree node
            var currentCount = null;
            try {
                currentCount = perspective.getSearchFacet().getQuery().getResultSetSync().totalcount;
            } catch (e) {
                // do nothing
            }
            var currentNode = this.findNode(dataSource);
            if (!currentNode) {
                // node not found -> create new node and append temporary below root node
                // we do not really now that this node is directly below root -> set flag unsureWhetherNodeisBelowRoot
                // flag is evaluated later in order to correct location of node
                currentNode = new module.Node(dataSource, currentCount);
                currentNode.unsureWhetherNodeisBelowRoot = true;
                this.rootNode.appendNode(currentNode);
            }
            currentNode.setCount(currentCount);

            // for root node: add apps to count
            if (dataSource.equals(model.allDataSource)) {
                currentNode.setCount(currentNode.count + model.getProperty('/appCount'));
            }

            // update child nodes
            this.updateFromPerspectiveChildDataSources(currentNode, perspective, model);

            // update app tree node
            this.updateAppTreeNode(dataSource, model);

        },

        updateAppTreeNode: function(dataSource, model) {

            // update only if datasource is all or apps
            if (!dataSource.equals(model.allDataSource) && !dataSource.equals(model.appDataSource)) {
                return;
            }

            // remove old appNode
            var appNode = this.findNode(model.appDataSource);
            if (appNode) {
                this.rootNode.removeChildNode(appNode);
            }

            // no apps and datasource!=apps -> return
            var appCount = model.getProperty('/appCount');
            if (appCount === 0 && !dataSource.equals(model.appDataSource)) {
                return;
            }

            // insert new app node
            appNode = new module.Node(model.appDataSource, appCount);
            this.rootNode.appendNodeAtIndex(appNode, 0); //App node should always be right after All

        },

        updateFromPerspectiveChildDataSources: function(currentNode, perspective, model) {

            // extract child datasources from perspective
            if (!perspective || currentNode.dataSource.equals(model.appDataSource)) {
                return;
            }
            var facets = perspective.getChartFacets();
            if (facets.length === 0) {
                return;
            }
            var dataSourceFacet = facets[0];
            if (dataSourceFacet.facetType !== 'datasource') {
                return;
            }
            var childDataSourceElements = dataSourceFacet.getQuery().getResultSetSync().getElements();

            // append children to tree node
            currentNode.clearChildren();
            for (var i = 0; i < childDataSourceElements.length; ++i) {
                var childDataSourceElement = childDataSourceElements[i];
                var childDataSource = childDataSourceElement.dataSource;
                var childNode = this.findNode(childDataSource);
                if (!childNode) {
                    childNode = new module.Node(childDataSource, childDataSourceElement.valueRaw);
                }
                if (childNode.unsureWhetherNodeisBelowRoot) {
                    childNode.unsureWhetherNodeisBelowRoot = false;
                    this.rootNode.removeChildNode(childNode);
                }
                if (childNode.parent) {
                    childNode.parent.removeChildNode(childNode);
                }
                childNode.setCount(childDataSourceElement.valueRaw);
                currentNode.appendNode(childNode);
            }

        }
    };

    // =======================================================================
    // formatter
    // =======================================================================
    module.Formatter = function() {
        this.init.apply(this, arguments);
    };

    module.Formatter.prototype = {

        init: function(rootDataSource) {
            this.tree = new module.Tree(rootDataSource);
        },

        format: function(dataSource, perspective, model) {
            this.tree.updateFromPerspective(dataSource, perspective, model);
            var tabStrips = this.generateTabStrips(dataSource, model);
            return tabStrips;
        },

        invalidate: function(dataSource) {
            if (this.tree) {
                this.tree.invalidate(dataSource);
            }
        },

        generateTabStrips: function(dataSource, model) {
            /* eslint no-lonely-if:0 */

            // init
            var tabStripLimit = 9999;
            var i, child, children;
            var tabStrips = {
                strips: [],
                selected: null
            };
            var node = this.tree.findNode(dataSource);

            // 1) no node in tree -> show ALL+ current datasource (should never happen)
            if (!node) {
                if (!dataSource.equals(model.allDataSource)) {
                    tabStrips.strips.push(model.allDataSource);
                }
                tabStrips.strips.push(dataSource);
                tabStrips.selected = dataSource;
                return tabStrips;
            }

            // 2) node is $$ALL$$ -> show $$ALL$$ + children of $$ALL$$
            if (node.dataSource.equals(model.allDataSource)) {
                tabStrips.strips.push(model.allDataSource);
                children = node.getChildrenSortedByCount();
                for (i = 0; i < children.length && tabStrips.strips.length < tabStripLimit; ++i) {
                    child = children[i];
                    tabStrips.strips.push(child.dataSource);
                }
                tabStrips.selected = model.allDataSource;
                return tabStrips;
            }

            // 3) node is direct child of $$ALL$$ -> show $$ALL$$ + children of $$ALL$$
            if (node.parent === this.tree.rootNode && !node.unsureWhetherNodeisBelowRoot) {
                tabStrips.strips.push(model.allDataSource);

                // limit number of tabstrips but ensure that selected
                // node is included
                var includesNode = false;
                children = this.tree.rootNode.getChildrenSortedByCount();
                for (i = 0; i < children.length; ++i) {
                    child = children[i];
                    if (includesNode) {
                        if (tabStrips.strips.length >= tabStripLimit) {
                            break;
                        }
                        tabStrips.strips.push(child.dataSource);
                    } else {
                        if (tabStrips.strips.length < tabStripLimit - 1 || node === child) {
                            tabStrips.strips.push(child.dataSource);
                            if (node === child) {
                                includesNode = true;
                            }
                        }
                    }
                }
                if (children.length === 0) {
                    tabStrips.strips.push(node.dataSource);
                }

                // To be verified: move current datasource to second position
                //                var indexOfMyDatasource = tabStrips.strips.indexOf(node.dataSource);
                //                tabStrips.strips.splice(indexOfMyDatasource, 1);
                //                tabStrips.strips.splice(1, 0, node.dataSource);

                tabStrips.selected = node.dataSource;
                return tabStrips;
            }

            // 4) node not direct child of $$ALL$$ or unknown whether node is direct child of $$ALL$$
            // -> show $$ALL$$ + node
            tabStrips.strips.push(model.allDataSource);
            tabStrips.strips.push(node.dataSource);
            tabStrips.selected = node.dataSource;
            return tabStrips;
        }
    };
    return module;
});
