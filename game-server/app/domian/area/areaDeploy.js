//服务器调配器,开服管理器
var areaDeploy = function() {
	this.name = "areaDeploy"
	this.index = 0
	this.areaList = []
	this.serverMap = {}
}
//初始化
areaDeploy.prototype.init = function(app) {
	this.app = app
	var self = this
	self.areaDao.getAreaLastId(function(data) {
		var lastId = parseInt(data)
		if(data && lastId){
			self.index = lastId
		}
	})
	self.areaDao.getAreaList(function(data) {
		if(data){
			for(var i = 0;i < data.length;i++){
				self.areaList.push(JSON.parse(data[i]))
				console.log("areaDeploy",self.app.serverId,self.areaList)
			}
		}
	})
	self.areaDao.getAreaServerMap(function(data) {
		if(data){
			self.serverMap = data
			console.log("areaDeploy",self.app.serverId,self.serverMap)
		}
	})
}
//开启游戏新服务器
areaDeploy.prototype.openArea = function(otps) {
	var self = this
	self.areaDao.createArea(otps,function(areaInfo) {
		if(areaInfo){
			var serverId = self.deploy(areaInfo)
			//通知所有的connector，更新服务器配置
			self.app.rpc.connector.connectorRemote.updateArea.toServer("*",areaInfo,serverId,null)
			//通知area服务器加载
			self.app.rpc.area.areaRemote.loadArea.toServer(serverId,areaInfo.areaId,null)
		}
	})
}
//关闭游戏服务器
areaDeploy.prototype.closeArea = function() {

}
//获取游戏服对应服务器
areaDeploy.prototype.getServer = function(areaId) {
	return this.serverMap[areaId]
}
//获取游戏服列表
areaDeploy.prototype.getServerList = function() {
	return this.areaList.concat()
}
//为新建的游戏服分配服务器
areaDeploy.prototype.deploy = function(areaInfo) {
	var areaServers = this.app.getServersByType('area');
	if(!areaServers){
		return false
	}
	this.index++;
	if(this.index >= areaServers.length){
		this.index = 0
	}
	var serverId = areaServers[this.index % areaServers.length].id
	this.areaDao.setAreaServer(areaInfo.areaId,serverId)
	this.updateArea(areaInfo,serverId)
	return this.serverMap[areaInfo.areaId]
}
//同步更新游戏服务器
areaDeploy.prototype.updateArea = function(areaInfo,serverId) {
	this.serverMap[areaInfo.areaId] = serverId
	this.areaList.push(areaInfo)
}
module.exports = {
	id : "areaDeploy",
	func : areaDeploy,
	props : [{
		name : "redisDao",
		ref : "redisDao"
	},{
		name : "areaDao",
		ref : "areaDao"
	}]
}