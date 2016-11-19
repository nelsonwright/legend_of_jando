// thanks to Patrick Hunlock: http://www.hunlock.com/blogs/Ten_Javascript_Tools_Everyone_Should_Have

String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g,"");
};

String.prototype.ltrim = function() {
	return this.replace(/^\s+/g,"");
};

String.prototype.rtrim = function() {
	return this.replace(/\s+$/g,"");
};
