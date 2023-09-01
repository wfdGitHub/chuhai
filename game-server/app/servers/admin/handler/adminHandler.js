var bearcat = require("bearcat")
var uuid = require("uuid")
var pay_cfg = require("../../../../config/gameCfg/pay_cfg.json")
var adminHandler = function(app) {
	this.app = app
	this.areaDeploy = this.app.get("areaDeploy")
	this.serverManager = this.app.get("serverManager")
}
//创建新服务器
adminHandler.prototype.openArea = function(msg, session, next) {
	console.log("openArea")
	this.areaDeploy.openArea(function() {})
	next(null)
}
//暂停服务器
adminHandler.prototype.pauseArea = function(msg, session, next) {
	console.log("pauseArea")
	this.areaDeploy.pauseArea(msg.areaId,function(flag,data) {
		next(null,{flag:flag,data:data})
	})
}
//恢复服务器
adminHandler.prototype.resumeArea = function(msg, session, next) {
	console.log("resumeArea")
	this.areaDeploy.resumeArea(msg.areaId,function(flag,data) {
		next(null,{flag:flag,data:data})
	})
}
//获取服务器信息
adminHandler.prototype.getAreaServerInfos = function(msg, session, next) {
	var count = 0
	var servrList = this.app.getServersByType('area')
	var list = {}
	for(var i = 0;i < servrList.length;i++){
	    this.app.rpc.area.areaRemote.getAreaServerInfos.toServer(servrList[i].id,function(infos) {
	    	count++
	    	list = Object.assign(list,infos)
	    	if(count == servrList.length){
	    		next(null,{flag : true,list : list})
	    	}
		})
	}
}
//获取服务器内玩家信息
adminHandler.prototype.getAreaPlayers = function(msg, session, next) {
	var areaId = msg.areaId
	var serverId = this.areaDeploy.getServer(areaId)
    if(!serverId){
        next(null,{flag : false,err : "服务器不存在"})
        return
    }
    this.app.rpc.area.areaRemote.getAreaPlayers.toServer(serverId,areaId,function(flag,list) {
    	next(null,{flag : true,list : list})
	})
}
//添加开服计划
adminHandler.prototype.setOpenPlan = function(msg, session, next) {
	this.serverManager.setOpenPlan(msg.time,function(flag,data) {
		next(null,{flag : flag,data : data})
	})
}
//删除开服计划
adminHandler.prototype.delOpenPlan = function(msg, session, next) {
	this.serverManager.delOpenPlan(msg.time,function(flag,data) {
		next(null,{flag : flag,data : data})
	})
}
//获取开服计划表
adminHandler.prototype.getOpenPlan = function(msg, session, next) {
	this.serverManager.getOpenPlan(function(flag,data) {
		next(null,{flag : flag,data : data})
	})
}
//添加合服计划
adminHandler.prototype.setMergePlan = function(msg, session, next) {
	this.serverManager.setMergePlan(msg.areaList,msg.time,function(flag,data) {
		next(null,{flag : flag,data : data})
	})
}
//删除合服计划
adminHandler.prototype.delMergePlan = function(msg, session, next) {
	this.serverManager.delMergePlan(msg.time,function(flag,data) {
		next(null,{flag : flag,data : data})
	})
}
//获取合服计划表
adminHandler.prototype.getMergePlan = function(msg, session, next) {
	this.serverManager.getMergePlan(function(flag,data) {
		next(null,{flag : flag,data : data})
	})
}
//获取服务器列表
adminHandler.prototype.getServerList = function(msg, session, next) {
	next(null,{flag : true,data : this.areaDeploy.getServerList()})
}
//设置全服邮件
adminHandler.prototype.setAreaMail = function(msg, session, next) {
	next(null,{flag : false})
}
//获取全服邮件
adminHandler.prototype.getAreaMailList = function(msg, session, next) {
	next(null,{flag : false})
}
//删除全服邮件
adminHandler.prototype.deleteAreaMailList = function(msg, session, next) {
	next(null,{flag : false})
}
//查询玩家信息
adminHandler.prototype.getPlayerInfo = function(msg, session, next) {
	console.log("getPlayerInfo",msg)
	var uid = msg.uid
	this.playerDao.getPlayerInfo({uid : uid},function(playerInfo) {
		console.log(playerInfo,playerInfo)
		if(playerInfo){
			next(null,{flag : true,msg : playerInfo})
		}else{
			next(null,{flag : false})
		}
	})
}
//模糊查找玩家信息
adminHandler.prototype.nameMatching = function(msg, session, next) {
	var name = msg.name
	var cursor = msg.cursor
	if(!cursor)
		cursor = 0
	this.hscan(name,cursor,function(flag,data) {
		next(null,{flag : flag,msg : data})
	})
}
adminHandler.prototype.hscan = function(name,cursor,cb) {
	var self = this
	self.redisDao.db.hscan('game:nameMap',cursor,"MATCH","*"+name+"*","count",500,function(err,data) {
		if(err){
			cb(false,err)
		}else if(data[1].length){
			cb(true,data)
		}else if(data[0] == 0){
			cb(false,"没有更多的数据了")
		}else{
			self.hscan(name,data[0],cb)
		}
	})
}
//冻结解封角色
adminHandler.prototype.freezeUid = function(msg, session, next) {
	var uid = msg.uid
	var value = msg.value
	var self = this
	self.playerDao.getPlayerInfo({uid : uid},function(playerInfo) {
		if(playerInfo){
			self.playerDao.setPlayerInfo({uid : uid,key:"freeze",value:value},function(flag,err) {
				next(null,{flag : flag,err : err})
			})
			if(value != 0){
				self.kickUser(uid)
			}
		}else{
			next(null,{flag : false,err:"角色不存在"})
		}
	})
}
//冻结解封账号
adminHandler.prototype.freezeAcc = function(msg, session, next) {
	var uid = msg.uid
	var value = msg.value
	var self = this
	self.playerDao.getPlayerInfo({uid : uid},function(playerInfo) {
		if(playerInfo){
			self.accountDao.setAccountData({accId : playerInfo.accId,name:"freeze",value:value},function(flag,err) {
				next(null,{flag : flag,err : err})
			})
			if(value != 0){
				self.kickUser(uid)
			}
		}else{
			next(null,{flag : false,err:"账号不存在"})
		}
	})
}
//踢出玩家
adminHandler.prototype.kickUser = function(uid) {
	var self = this
	self.playerDao.getPlayerAreaId(uid,function(flag,data) {
		if(flag){
			var areaId = self.areaDeploy.getFinalServer(data)
			var serverId = self.areaDeploy.getServer(areaId)
			if(serverId){
				self.app.rpc.area.areaRemote.kickUser.toServer(serverId,uid,null)
			}
		}
	})
}
//发送个人邮件
adminHandler.prototype.adminSendMail = function(msg, session, next) {
	var adminAccId = session.get("accId")
	var uid = msg.uid
	var title = msg.title
	var text = msg.text
	var atts = msg.atts
	var self = this
	self.playerDao.getPlayerAreaId(uid,function(flag,data) {
		if(!flag){
			next(null,{flag : false,err : data})
			return
		}
		var areaId = self.areaDeploy.getFinalServer(data)
		var serverId = self.areaDeploy.getServer(areaId)
	    if(!serverId){
	        next(null,{flag : false,err : "服务器不存在"})
	        return
	    }
	    self.app.rpc.area.areaRemote.sendMail.toServer(serverId,uid,areaId,title,text,atts,function(flag,list) {
	    	self.cacheDao.saveCache({"messagetype":"adminSendMail",adminAccId:adminAccId,uid:uid,areaId:areaId,title:title,text:text,atts:atts})
	    	next(null,{flag : true,list : list})
		})
	})
}
//设置公告
adminHandler.prototype.setNotify = function(msg,session,next) {
	var notify = msg.notify
	this.redisDao.db.set("game:notify",notify)
	next(null,{flag : true})
}
//获取聊天记录总页数
adminHandler.prototype.getChatRecordPage = function(msg,session,next) {
	this.mysqlDao.getChatRecordPage(function(flag,data) {
		next(null,{flag:flag,data:data})
	})
}
//获取聊天记录一页数据
adminHandler.prototype.getChatRecordList = function(msg,session,next) {
	var dataNum = msg.dataNum
	if(typeof(dataNum) != "number"){
		next(null,{"err":"参数错误"})
		return
	}
	this.mysqlDao.getChatRecordList(dataNum,function(flag,data) {
		next(null,{flag:flag,data:data})
	})
}
//直接充值
adminHandler.prototype.rechargeToUser = function(msg,session,next) {
	var uid = msg.uid
	var pay_id = msg.pay_id
	if(!pay_cfg[pay_id]){
		next(null,{"err":"pay_id error "+pay_id})
		return
	}
	var self = this
	self.playerDao.getPlayerAreaId(uid,function(flag,data) {
		if(flag){
			var areaId = self.areaDeploy.getFinalServer(data)
			var serverId = self.areaDeploy.getServer(areaId)
			if(serverId){
				self.app.rpc.area.areaRemote.real_recharge.toServer(serverId,areaId,uid,Math.floor(Number(pay_cfg[pay_id]["rmb"]) * 100),function(){})
				self.app.rpc.area.areaRemote.finish_recharge.toServer(serverId,areaId,uid,pay_id,function(flag,data) {
					next(null,{flag:flag,data:data})
				})
			}else{
				next(null,{"err":"参数错误"})
			}
		}else{
			next(null,{"err":"参数错误"})
		}
	})
}
//获取unionId
adminHandler.prototype.getUnionIdByUid = function(msg,session,next) {
	var uid = msg.uid
	var self = this
	self.playerDao.getPlayerInfo({uid:uid},function(playerInfo) {
		if(!playerInfo){
			next(null,{flag:false})
			return
		}
		self.accountDao.getAccountData({accId:playerInfo.accId,name:"unionid"},function(flag,data) {
			next(null,{flag:flag,data:data})
		})
	})
}
module.exports = function(app) {
	return bearcat.getBean({
		id : "adminHandler",
		func : adminHandler,
		args : [{
			name : "app",
			value : app
		}],
		props : [{
			name : "redisDao",
			ref : "redisDao"
		},{
			name : "cacheDao",
			ref : "cacheDao"
		},{
			name : "accountDao",
			ref : "accountDao"
		},{
			name : "playerDao",
			ref : "playerDao"
		},{
			name : "mysqlDao",
			ref : "mysqlDao"
		}]
	})
}