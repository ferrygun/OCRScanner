jQuery.sap.declare("sap.rules.ui.parser.ruleBody.lib.dependenciesHandler");


sap.rules.ui.parser.ruleBody.lib.dependenciesHandler = sap.rules.ui.parser.ruleBody.lib.dependenciesHandler|| {}; 
sap.rules.ui.parser.ruleBody.lib.dependenciesHandler.lib = (function() {


	function DependeciesHandler() {
		this.depMap ={};
	}

	
	
	DependeciesHandler.prototype.getDependencies = function(){
		return this.depMap;
	};
	
	
	
	DependeciesHandler.prototype.addDependencies = function(dependeciesList){
		var key = null;
		for ( key in dependeciesList) {
			if (dependeciesList.hasOwnProperty(key)) {
				if (!this.depMap.hasOwnProperty(key)) {
					this.depMap[key] = dependeciesList[key];
				}
			}
		}
	};
	
	

	return {
		DependeciesHandler: DependeciesHandler
	};

}());
