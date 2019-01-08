function TestObject() {
	this.name = "TestObject";
};

TestObject.prototype.getName = function() {
	return this.name;
};

TestObject.prototype.setName = function(iName) {
	this.name = iName;
};
