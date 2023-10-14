var bearcat = require("bearcat")
var uuid = require("uuid")
var areaRemote = function(app) {
	this.app = app
	this.areaManager = this.app.get("areaManager")
}
//充值回调
areaRemote.prototype.finish_recharge = function(areaId,uid,pay_id,cb) {
	var self = this
	if(self.areaManager.areaMap[areaId]){
		self.areaManager.areaMap[areaId].finish_recharge(uid,pay_id,function(flag,err) {
			if(!flag){
				console.error("finish_recharge "+err)
				var info = {
					err : err,
					areaId : areaId,
					uid : uid,
					pay_id : pay_id,
					time : (new Date()).toDateString()
				}
				self.redisDao.db.rpush("finish_recharge_faild",JSON.stringify(info))
				cb(false,err)
			}else{
				cb(true)
			}
		})
	}else{
		console.error("finish_recharge "+err)
		var info = {
			err : "服务器不存在",
			uid : uid,
			areaId : areaId,
			pay_id : pay_id,
			pay_id : pay_id,
			time : (new Date()).toDateString()
		}
		self.redisDao.db.rpush("finish_recharge_faild",JSON.stringify(info))
		cb(false,"服务器不存在")
	}
}
//真实充值
areaRemote.prototype.real_recharge = function(areaId,uid,value,cb) {
	this.areaManager.areaMap[areaId].real_recharge(uid,value)
	// this.app.rpc.connector.connectorRemote.syncRealrmb.toServer(this.areaManager.connectorMap[uid],uid,value,null)
	cb()
}
//创建新服务器
areaRemote.prototype.loadArea = function(areaId,cb) {
	this.areaManager.loadArea(areaId)
	cb()
}
//关闭服务器
areaRemote.prototype.removeArea = function(areaId,cb) {
	this.areaManager.removeArea(areaId)
	cb()
}
//注册账号
areaRemote.prototype.register = function(otps,cb) {
	this.areaManager.areaMap[otps.areaId].register(otps,cb)
}
//玩家加入
areaRemote.prototype.userLogin = function(uid,areaId,oriId,cid,cb) {
	this.areaManager.userLogin(uid,areaId,oriId,cid,cb)
}
//玩家离开
areaRemote.prototype.userLeave = function(uid,cid,cb) {
	this.areaManager.userLeave(uid,cid)
	cb()
}
//踢出玩家
areaRemote.prototype.kickUser = function(uid,cb) {
	if(this.areaManager.connectorMap[uid]){
		this.app.rpc.connector.connectorRemote.kickUser.toServer(this.areaManager.connectorMap[uid],uid,null)
	}
	if(cb)
		cb()
}
//获取服务器信息
areaRemote.prototype.getAreaServerInfos = function(cb) {
	var list = this.areaManager.getAreaServerInfos()
	cb(list)
}
//获取服务器内玩家信息
areaRemote.prototype.getAreaPlayers = function(areaId,cb) {
	if(this.areaManager.areaMap[areaId]){
		var list = this.areaManager.areaMap[areaId].getAreaPlayers()
		cb(true,list)
	}else{
		cb(false)
	}
}
//消耗道具
areaRemote.prototype.consumeItems = function(uid,areaId,str,rate,reason,cb) {
	if(this.areaManager.areaMap[areaId]){
		this.areaManager.areaMap[areaId].consumeItems(uid,str,rate,reason,cb)
	}else{
		cb(false)
	}
}
//物品奖励
areaRemote.prototype.addItemStr = function(uid,areaId,str,rate,reason,cb) {
	if(this.areaManager.areaMap[areaId]){
		var awardList = this.areaManager.areaMap[areaId].addItemStr(uid,str,rate,reason)
		cb(true,awardList)
	}else{
		cb(false)
	}
}
//宝箱奖励
areaRemote.prototype.openChestAward = function(uid,areaId,chestId,rate,cb) {
	if(this.areaManager.areaMap[areaId]){
		var awardList = this.areaManager.areaMap[areaId].openChestAward(uid,chestId,rate)
		cb(true,awardList)
	}else{
		cb(false)
	}
}
//发送邮件
areaRemote.prototype.sendMail = function(uid,areaId,title,text,atts,cb) {
	if(this.areaManager.areaMap[areaId]){
		this.areaManager.areaMap[areaId].sendMail(uid,title,text,atts,cb)
	}else{
		cb(false)
	}
}
//更新全服邮件
areaRemote.prototype.updateAreaMail = function(cb) {
	for(var areaId in this.areaManager.areaMap){
		this.areaManager.areaMap[areaId].updateAreaMail()
	}
	cb(true)
}
//过期检查 头像框 称号
areaRemote.prototype.overdueCheck  = function(areaId,uid,cb) {
	if(this.areaManager.areaMap[areaId]){
		this.areaManager.areaMap[areaId].overdueCheck(uid,cb)
	}else{
		cb(false)
	}
}
//任务更新
areaRemote.prototype.taskUpdate  = function(areaId,uid,type,value,arg,cb) {
	if(this.areaManager.areaMap[areaId]){
		this.areaManager.areaMap[areaId].taskUpdate(uid,type,value,arg)
		cb(true)
	}else{
		cb(false)
	}
}
//更新SDK配置
areaRemote.prototype.updateSDKCFG = function(cb) {
	if(this.sdkEntry)
		this.sdkEntry.init()
	if(this.sdkPay)
		this.sdkPay.init()
	cb()
}
//更新返利
areaRemote.prototype.updateRebate = function(cb) {
	for(var areaId in this.areaManager.areaMap){
		this.areaManager.areaMap[areaId].rebateInit()
	}
	cb(true)
}
//更新节日活动
areaRemote.prototype.updateFestivalInfo = function(cb) {
	for(var areaId in this.areaManager.areaMap){
		this.areaManager.areaMap[areaId].updateFestivalInfo()
	}
	cb(true)
}
module.exports = function(app) {
	return bearcat.getBean({
		id : "areaRemote",
		func : areaRemote,
		args : [{
			name : "app",
			value : app
		}],
		props : [{
			name : "playerDao",
			ref : "playerDao"
		},{
			name : "sdkEntry",
			ref : "sdkEntry"
		},{
			name : "sdkPay",
			ref : "sdkPay"
		}]
	})
}