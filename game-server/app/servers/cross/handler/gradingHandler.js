var bearcat = require("bearcat")
//日志模块
var gradingHandler = function(app) {
  this.app = app;
	this.crossManager = this.app.get("crossManager")
};
//匹配战斗
gradingHandler.prototype.matchGrading = function(msg, session, next) {
  var crossUid = session.get("crossUid")
  this.crossManager.matchGrading(crossUid,function(flag,data) {
    next(null,{flag : flag,data : data})
  })
}

module.exports = function(app) {
  return bearcat.getBean({
  	id : "gradingHandler",
  	func : gradingHandler,
  	args : [{
  		name : "app",
  		value : app
  	}]
  })
};