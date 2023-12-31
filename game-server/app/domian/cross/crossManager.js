//跨服服务器
var fightContorlFun = require("../turn_based_fight/fight/fightContorl.js")
var boyCfg = require("../../../config/sysCfg/boy.json")
var uuid = require("uuid")
var crossServers = ["grading","escort"]
var crossManager = function(app) {
	this.app = app
	this.channelService = this.app.get("channelService")
	this.fightContorl = fightContorlFun
}
//初始化
crossManager.prototype.init = function() {
	this.onlineNum = 0
	this.players = {}
	this.oriIds = {}
	this.dayStr = ""
	for(var i = 0;i < crossServers.length;i++){
		var fun = require("./crossServers/"+crossServers[i]+".js")
		fun.call(this)
	}
	setInterval(this.update.bind(this),1000)
}
//每日定时器
crossManager.prototype.dayUpdate = function(curDayStr) {
	console.log("跨服服务器每日刷新")
	this.dayStr = curDayStr
	this.gradingDayUpdate()
}
crossManager.prototype.update = function() {
	var date = new Date()
	this.escortUpdate(date)
	var curDayStr = (new Date()).toDateString()
	if(this.dayStr !== curDayStr){
		this.dayUpdate(curDayStr)
	}
}
//玩家连入跨服服务器
crossManager.prototype.userLogin = function(uid,areaId,oriId,serverId,cid,playerInfo,cb) {
	var self = this
	self.heroDao.getFightTeam(uid,function(flag,fightTeam) {
		if(flag){
			var userInfo = {
				uid : uid,
				areaId : areaId,
				oriId : oriId,
				serverId : serverId,
				cid : cid,
				playerInfo : playerInfo,
				fightTeam : fightTeam
			}
			var crossUid = oriId+"|"+uid+"|"+serverId
			if(!self.players[crossUid])
				self.onlineNum++
			self.players[crossUid] = userInfo
			self.oriIds[crossUid] = oriId
			cb(true,crossUid)
		}else{
			cb(false,"获取玩家战斗阵容失败")
		}
	})
}
//玩家离线
crossManager.prototype.userLeave = function(crossUid) {
	if(this.players[crossUid]){
		delete this.players[crossUid]
		delete this.oriIds[crossUid]
		this.onlineNum--
	}
	this.unSubscribeCarMessage(crossUid)
}
//获取玩家简易信息
crossManager.prototype.getSimpleUser = function(crossUid) {
	if(!this.players[crossUid]){
		return false
	}
	var info = {
		name : this.players[crossUid]["playerInfo"]["name"],
		areaId : this.players[crossUid]["playerInfo"]["areaId"],
		oriId : this.oriIds[crossUid]
	}
	return info
}
//获取玩家战斗阵容
crossManager.prototype.userTeam = function(crossUid) {
	if(!this.players[crossUid]){
		return false
	}
	return this.players[crossUid]["fightTeam"]
}
//获取玩家防御阵容配置(被攻击阵容)
crossManager.prototype.getDefendTeam = function(areaId,uid,cb) {
	this.heroDao.getFightTeam(uid,function(flag,data) {
		if(flag){
			cb(data)
		}else{
			cb(false)
		}
	})
}
//发送消息给玩家
crossManager.prototype.sendToUser = function(type,crossUid,notify) {
	if(!this.players[crossUid])
		return
	this.channelService.pushMessageByUids(type, notify,[{
	      uid: this.players[crossUid]["uid"],
	      sid: this.players[crossUid]["cid"]
	}])
}
//发送指定路由的消息给玩家
crossManager.prototype.sendByTypeToUser = function(type,uids,notify) {
	this.channelService.pushMessageByUids(type, notify,uids)
}
//消耗道具
crossManager.prototype.consumeItems = function(crossUid,str,rate,cb) {
	if(!this.players[crossUid]){
		cb(false)
		return
	}
	var areaId = this.players[crossUid]["areaId"]
	var serverId = this.players[crossUid]["serverId"]
	var uid = this.players[crossUid]["uid"]
	this.app.rpc.area.areaRemote.consumeItems.toServer(serverId,uid,areaId,str,rate,cb)
}
//物品奖励
crossManager.prototype.addItemStr = function(crossUid,str,rate,cb) {
	if(!this.players[crossUid]){
		cb(false)
		return
	}
	var areaId = this.players[crossUid]["areaId"]
	var serverId = this.players[crossUid]["serverId"]
	var uid = this.players[crossUid]["uid"]
	this.app.rpc.area.areaRemote.addItemStr.toServer(serverId,uid,areaId,str,rate,cb)
}
//发放邮件
crossManager.prototype.sendMail = function(crossUid,title,text,atts,cb) {
	var list = crossUid.split("|")
	var areaId = parseInt(list[0])
	var uid = parseInt(list[1])
	var serverId = list[2]
	this.app.rpc.area.areaRemote.sendMail.toServer(serverId,uid,areaId,title,text,atts,cb)
}
//直接发放邮件
crossManager.prototype.sendMailByUid = function(areaId,uid,title,text,atts,cb) {
	var mailInfo = {
		title : title,
		text : text,
		id : uuid.v1(),
		time : Date.now()
	}
	if(atts){
		mailInfo.atts = atts
	}
	mailInfo = JSON.stringify(mailInfo)
	this.redisDao.db.rpush("player:user:"+uid+":mail",mailInfo)
}
//发放奖励,若玩家不在线则发邮件
crossManager.prototype.sendAward = function(crossUid,title,text,str,cb) {
	if(this.players[crossUid]){
		this.addItemStr(crossUid,str,1,cb)
	}else{
		this.sendMail(crossUid,title,text,str,cb)
	}
}
//宝箱奖励
crossManager.prototype.openChestStr = function(crossUid,chestId,rate,cb) {
	if(!this.players[crossUid]){
		cb(false)
		return
	}
	var areaId = this.players[crossUid]["areaId"]
	var serverId = this.players[crossUid]["serverId"]
	var uid = this.players[crossUid]["uid"]
	this.app.rpc.area.areaRemote.openChestStr.toServer(serverId,uid,areaId,chestId,rate,cb)
}
//获取玩家基本数据
crossManager.prototype.getPlayerInfoByUid = function(areaId,uid,cb) {
	this.redisDao.db.hmget("player:user:"+uid+":playerInfo",["name","head"],function(err,data) {
		let info = {
			uid :uid,
			name : data[0],
			head : data[1]
		}
		cb(info)
	})
}
//批量获取玩家基本数据
crossManager.prototype.getPlayerInfoByUids = function(areaIds,uids,cb) {
	var multiList = []
	for(var i = 0;i < uids.length;i++){
		multiList.push(["hmget","player:user:"+uids[i]+":playerInfo",["name","head"]])
	}
	var self = this
	self.redisDao.multi(multiList,function(err,list) {
		var userInfos = []
		for(var i = 0;i < uids.length;i++){
			let info = {}
			if(uids[i] < 10000){
				info = {
					uid : uids[i],
					name : boyCfg[Math.floor(Math.random() * boyCfg.length)],
					head : ""
				}
			}else{
				info = {
					uid : uids[i],
					name : list[i][0],
					head : list[i][1],
					areaId : areaIds[i]
				}
			}
			userInfos.push(info)
		}
		cb(userInfos)
	})
}
module.exports = {
	id : "crossManager",
	func : crossManager,
	scope : "prototype",
	init : "init",
	args : [{
		name : "app",
		type : "Object"
	}],
	props : [{
		name : "playerDao",
		ref : "playerDao"
	},{
		name : "heroDao",
		ref : "heroDao"
	},{
		name : "redisDao",
		ref : "redisDao"
	}]
}