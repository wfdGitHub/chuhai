var bearcat = require("bearcat")
var areaManager = function() {
	this.name = "areaManager"
	this.areaMap = {}
}
//初始化
areaManager.prototype.init = function(app) {
	this.app = app
	var self = this
	self.areaDao.getAreaServerMap(function(data) {
		if(data){
			for(var areaId in data){
				if(data[areaId] == self.app.serverId){
					self.loadArea(areaId)
				}
			}
		}
	})
}
//加载游戏服务器
areaManager.prototype.loadArea = function(areaId) {
	var self = this
	self.areaDao.getAreaInfo(areaId,function(areaInfo) {
		if(areaInfo){
			self.areaMap[areaId] = bearcat.getBean("area",areaInfo)
		}
	})
}
//关闭游戏服务器
areaManager.prototype.closeArea = function() {

}

module.exports = {
	id : "areaManager",
	func : areaManager,
	props : [{
		name : "redisDao",
		ref : "redisDao"
	},{
		name : "areaDao",
		ref : "areaDao"
	}]
}