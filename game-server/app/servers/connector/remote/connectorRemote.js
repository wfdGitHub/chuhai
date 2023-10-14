var bearcat = require("bearcat")
var connectorRemote = function(app) {
	this.app = app
	this.areaDeploy = this.app.get('areaDeploy')
	this.sessionService = this.app.get('sessionService')
	this.connectorManager = this.app.get('connectorManager')
}
//更新
connectorRemote.prototype.updateArea = function(areaId,serverId,cb) {
	this.areaDeploy.updateArea(areaId,serverId)
	if(cb)
		cb()
}
//更新
connectorRemote.prototype.removeArea = function(areaId,cb) {
	this.areaDeploy.removeArea(areaId)
	if(cb)
		cb()
}
connectorRemote.prototype.changeFinalServerMap = function(areaId,finalId,cb) {
	this.areaDeploy.changeFinalServerMap(areaId,finalId)
	if(cb)
		cb()
}
//同步充值数据
connectorRemote.prototype.syncRealrmb = function(uid,value,cb) {
	// console.log("syncRealrmb",uid,value)
	// var uids = this.sessionService.getByUid(uid)
	// if(uids) {
	// 	for(var i = 0;i < uids.length;i++){
	// 		if(uids[i]){
	// 			uids[i].set("real_rmb",uids[i].get("real_rmb") + value)
	// 		}
	// 	}
	// }
	// if(cb){
	// 	cb()
	// }
}
//更新SDK配置
connectorRemote.prototype.updateSDKCFG = function(cb) {
	if(this.sdkEntry)
		this.sdkEntry.init()
	if(this.sdkPay)
		this.sdkPay.init()
	cb()
}
connectorRemote.prototype.updateAreaName = function() {
	var areaDeploy = this.app.get("areaDeploy")
	areaDeploy.updateAreaName()
}
connectorRemote.prototype.kickUser = function(uid,cb) {
	this.connectorManager.sendByUid(uid,{type : "kick"})
	var uids = this.sessionService.getByUid(uid)
	if(uids) {
		for(var i = 0;i < uids.length;i++){
			this.sessionService.kickBySessionId(uids[i].id)
		}
	}
	if(cb){
		cb()
	}
}
module.exports = function(app) {
	return bearcat.getBean({
		id : "connectorRemote",
		func : connectorRemote,
		args : [{
			name : "app",
			value : app
		},{
			name : "sdkEntry",
			ref : "sdkEntry"
		},{
			name : "sdkPay",
			ref : "sdkPay"
		}]
	})
}