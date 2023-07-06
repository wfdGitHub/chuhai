var bearcat = require("bearcat")
var loginHandler = function(app) {
  this.app = app;
  this.areaDeploy = this.app.get('areaDeploy')
  this.sessionService = this.app.get('sessionService')
  this.connectorManager = this.app.get('connectorManager')
}
//获取服务器列表
loginHandler.prototype.getAreaList = function(msg, session, next) {
	next(null,{flag : true,areaList : this.areaDeploy.areaList,areaName:this.areaDeploy.areaName})
}
//选择服务器
// loginHandler.prototype.chooseArea = function(msg, session, next) {
// 	if(session.get("areaId")){
// 		next(null,{flag : false,err : "已登录游戏服务器"})
// 		return
// 	}
// 	var uid = session.uid
// 	if(!uid){
// 		next(null,{flag : false,err : "玩家未登录"})
// 		return
// 	}
// 	var areaId = msg.areaId
// 	var serverId = this.areaDeploy.getServer(areaId)
// 	if(serverId){
// 		session.set("serverId",serverId)
// 		session.push("serverId")
// 		next(null,{flag : true})
// 	}else{
// 		next(null,{flag : false,err : "服务器不存在"})
// 	}
// }
//获取当前所在服务器
loginHandler.prototype.getLocationAreaId = function(msg, session, next) {
	var areaId = session.get("areaId")
	if(areaId){
		next(null,{flag : true,msg : areaId})
	}else{
		next(null,{flag : false})
	}
}
//获取角色列表
loginHandler.prototype.getPlayerList = function(msg, session, next) {
	var accId = session.get("accId")
	if(!accId){
		next(null,{flag : false,err : "未登录账号"})
		return
	}
	this.playerDao.getPlayerList({accId : accId},function(flag,list) {
		next(null,{flag : flag,list : list})
	})
}
//获取角色数据
loginHandler.prototype.getPlayerInfo = function(msg, session, next) {
	var accId = session.get("accId")
	var areaId = msg.areaId
	if(!accId){
		next(null,{flag : false,err : "未登录账号"})
		return
	}
	if(!areaId){
		next(null,{flag : false,err : "areaId error"})
		return
	}
	var self = this
	self.playerDao.getUidByAreaId({accId : accId,areaId : areaId},function(flag,uid) {
		self.playerDao.getPlayerInfo({areaId : areaId,uid : uid},function(playerInfo) {
			if(playerInfo){
				next(null,{flag : true,msg : playerInfo})
			}else{
				next(null,{flag : false})
			}
		})
	})
}
//创建角色
loginHandler.prototype.register = function(msg, session, next) {
	if(this.connectorManager.runTime < 3000){
        next(null,{flag : false,err : "服务器准备中"})
		return
	}
	var oriId = msg.areaId
	var name = msg.name
	var sex = msg.sex
	if(!oriId){
		next(null,{flag : false,err : "oriId error"})
		return
	}
    var serverId = this.areaDeploy.getServer(oriId)
    if(!serverId){
        next(null,{flag : false,err : "服务器不存在"})
        return
    }
    if(oriId != Number(oriId) || typeof(name) !== "string"){
        next(null,{flag : false,err : "参数错误"})
        return
    }
    name = name.replace(/\s*/g,"");
    if(name.length < 2){
        next(null,{flag : false,err : "名称过短"})
        return
    }
    if(sex !== 1){
    	sex = 2
    }
    var areaId = this.areaDeploy.getFinalServer(oriId)
	var accId = session.get("accId")
	var otps = {areaId : areaId,oriId : oriId,accId : accId,name : name,sex : sex}
    this.app.rpc.area.areaRemote.register.toServer(serverId,otps,function(flag,data) {
		if(flag){
	        next(null,{flag : true,msg : data})
		}else{
			next(null,{flag : false,err : data})
		}
	})
}
//获取随机姓名
loginHandler.prototype.getRandomName = function(msg, session, next) {
	var sex = msg.sex
	var name = this.namespace.getName(sex)
	next(null,{flag : true,name : name})
}
//登录游戏
loginHandler.prototype.loginArea = function(msg, session, next) {
	if(this.connectorManager.runTime < 3000){
        next(null,{flag : false,err : "服务器准备中"})
		return
	}
	var oriId = msg.areaId
	var accId = session.get("accId")
	if(!accId){
		next(null,{flag : false,err : "未登录账号"})
		return
	}
	if(session.get("areaId")){
		next(null,{flag : false,err : "已登录服务器"})
		return
	}
	if(!oriId){
		next(null,{flag : false,err : "oriId error"})
		return
	}
    var areaId = this.areaDeploy.getFinalServer(oriId)
    var serverId = this.areaDeploy.getServer(areaId)
    if(!areaId || !serverId){
        next(null,{flag : false,err : "服务器不存在"})
        return
    }
    var self = this
    self.playerDao.getUidByAreaId({accId : accId,areaId : oriId},function(flag,uid) {
    	if(!flag){
    		next(null,{flag : false,err : "未注册角色"})
    		return
    	}
		//检查重复登录
		if( !! self.sessionService.getByUid(uid)) {
			self.connectorManager.sendByUid(uid,{type : "kick"})
			var uids = self.sessionService.getByUid(uid)
			if(uids){
				for(var i = 0;i < uids.length;i++){
					self.sessionService.kickBySessionId(uids[i].id)
				}
			}
		}
	    self.app.rpc.area.areaRemote.userLogin.toServer(serverId,uid,areaId,oriId,self.app.serverId,function(flag,playerInfo) {
			if(flag){
    			session.bind(playerInfo.uid)
    			session.on("closed",onUserLeave.bind(self))
		        session.set("areaId",areaId)
		        session.push("areaId")
		        session.set("oriId",oriId)
		        session.push("oriId")
		        session.set("serverId",serverId)
		        session.push("serverId")
				session.set("name",playerInfo.name)
				session.push("name")
				session.set("head",playerInfo.head)
				session.push("head")
				session.set("beginTime",Date.now())
				session.push("beginTime")
				// session.set("real_rmb",playerInfo.real_rmb)
				// session.push("real_rmb")
				playerInfo.areaId = areaId
				playerInfo.ip = session.__session__.__socket__.remoteAddress.ip
				self.cacheDao.saveCache(Object.assign({"messagetype":"login"},playerInfo))
				self.app.rpc.area.areaRemote.overdueCheck.toServer(serverId,areaId,uid,function(flag,info) {
					if(flag){
						playerInfo.title = info.title
						playerInfo.frame = info.frame
					}
					session.set("title",playerInfo.title)
					session.push("title")
					session.set("frame",playerInfo.frame)
					session.push("frame")
					next(null,{flag : flag,msg : playerInfo})
				})
			}else{
				next(null,{flag : flag,msg : playerInfo})
			}
		})
    })
}
var onUserLeave = function(session) {
	if(this.connectorManager.runTime < 10000)
		return
	var uid = session.uid
	if(uid){
		var dt = Date.now() - session.get("beginTime")
		session.unbind(uid)
		var accId = session.get("accId")
		var beginTime = session.get("beginTime")
		var serverId = session.get("serverId")
		if(accId)
			this.accountDao.updatePlaytime({accId : accId,beginTime : beginTime})
		this.cacheDao.saveCache({"messagetype":"leave",time:dt,uid:uid,accId:accId,name:session.get("name"),beginTime:beginTime,ip:session.__session__.__socket__.remoteAddress.ip})
		if(serverId)
			this.app.rpc.area.areaRemote.userLeave.toServer(serverId,uid,this.app.serverId,null)
		this.app.rpc.chat.chatRemote.userLeave(null,uid,this.app.serverId,null)
	}
}
module.exports = function(app) {
  return bearcat.getBean({
  	id : "loginHandler",
  	func : loginHandler,
	args : [{
		name : "app",
		value : app
	}],
	props : [{
		name : "playerDao",
		ref : "playerDao"
	},{
      	name : "accountDao",
      	ref : "accountDao"
    },{
      	name : "cacheDao",
      	ref : "cacheDao"
    },{
		name : "namespace",
		ref : "namespace"
	}]
  })
};