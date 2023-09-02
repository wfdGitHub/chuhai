var bearcat = require("bearcat")
var boyNames = require("../../../../config/sysCfg/boy.json")
var async = require("async")
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
//登陆
connectorRemote.prototype.playerLogin = function(unionid,cb) {
	console.log("playerLogin",unionid)
	var self = this
  	var msg = {unionid:unionid}
  	var areaId = 1
  	var oriId = 1
  	var serverId = self.areaDeploy.getServer(1)
  	var accId = ""
  	async.waterfall([
  		function(next) {
  			//登陆账号
			self.accountDao.getAccountInfo(msg,function(flag,userInfo) {
					if(!flag || !userInfo){
						//创建账号
						self.accountDao.createAccount(msg,function(flag,userInfo) {
							if(!flag || !userInfo){
								next("创建账号失败")
								return
							}
							next(null,userInfo)
						})
					}else{
						next(null,userInfo)
					}
				})
  		},
  		function(userInfo,next) {
  			//创建角色
  			accId = userInfo.accId
			var otps = {areaId : 1,oriId : 1,accId : accId,name : boyNames[Math.floor(Math.random() * boyNames.length)],sex : 1}
		    self.app.rpc.area.areaRemote.register.toServer(serverId,otps,function(flag,data) {
				next()
			})
  		},
  		function(next) {
  			//登陆账号
			self.playerDao.getUidByAreaId({accId : accId,areaId : oriId},function(flag,uid) {
			    self.app.rpc.area.areaRemote.userLogin.toServer(serverId,uid,areaId,oriId,self.app.serverId,function(flag,playerInfo) {
					if(flag){
						playerInfo.areaId = areaId
						self.cacheDao.saveCache(Object.assign({"messagetype":"login"},playerInfo))
						self.app.rpc.area.areaRemote.overdueCheck.toServer(serverId,areaId,uid,function(flag,info) {
							if(flag){
								playerInfo.title = info.title
								playerInfo.frame = info.frame
							}
							cb(true,playerInfo)
						})
					}else{
						next("登陆失败")
					}
				})
	    	})
  		}
  	],function(err) {
  		cb(false,err)
  	})
	
}
//离线
connectorRemote.prototype.playerLeave = function(accId,uid,name,ip,cb) {
	console.log(accId,uid,name,ip)
	var dt = Math.floor((1 + Math.random() * 15)*60000)
	var beginTime = Date.now() - dt
	var serverId = this.areaDeploy.getServer(1)
	if(accId)
		this.accountDao.updatePlaytime({accId : accId,beginTime : beginTime})
	this.cacheDao.saveCache({"messagetype":"leave",time:dt,uid:uid,accId:accId,name:name,beginTime:beginTime,ip:ip})
	if(serverId)
		this.app.rpc.area.areaRemote.userLeave.toServer(serverId,uid,this.app.serverId,null)
	this.app.rpc.chat.chatRemote.userLeave(null,uid,this.app.serverId,null)
	cb(true)
}
module.exports = function(app) {
	return bearcat.getBean({
		id : "connectorRemote",
		func : connectorRemote,
		args : [{
			name : "app",
			value : app
		}],
		props : [{
	  		name : "accountDao",
	  		ref : "accountDao"
  		},{
	  		name : "cacheDao",
	  		ref : "cacheDao"
  		},{
			name : "sdkEntry",
			ref : "sdkEntry"
		},{
			name : "sdkPay",
			ref : "sdkPay"
		},{
			name : "playerDao",
			ref : "playerDao"
		}]
	})
}