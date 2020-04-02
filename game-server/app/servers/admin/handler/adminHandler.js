var bearcat = require("bearcat")
var adminHandler = function(app) {
	this.app = app
	this.areaDeploy = this.app.get("areaDeploy")
	this.serverManager = this.app.get("serverManager")
}
//激活管理员模式
adminHandler.prototype.activatePrivileges = function(msg, session, next) {
	var accId = session.get("accId")
	this.accountDao.getAccountData({accId : accId,name : "limit"},function(flag,limit) {
		limit = parseInt(limit)
		if(limit >= 10){
			session.set("limit",limit)
			session.push("limit")
			next(null,{flag : true,limit : limit})
		}else{
			next(null,{flag : false})
		}
	})
}
//创建新服务器
adminHandler.prototype.openArea = function(msg, session, next) {
	var limit = session.get("limit")
	if(!limit || limit < 10){
		next(null,{flag : false})
		return
	}
	console.log("openArea")
	this.areaDeploy.openArea(function() {})
	next(null)
}
//暂停服务器
adminHandler.prototype.pauseArea = function(msg, session, next) {
	var limit = session.get("limit")
	if(!limit || limit < 10){
		next(null,{flag : false})
		return
	}
	console.log("pauseArea")
	this.areaDeploy.pauseArea(msg.areaId,function(flag,data) {
		next(null,{flag:flag,data:data})
	})
}
//恢复服务器
adminHandler.prototype.resumeArea = function(msg, session, next) {
	var limit = session.get("limit")
	if(!limit || limit < 10){
		next(null,{flag : false})
		return
	}
	console.log("resumeArea")
	this.areaDeploy.resumeArea(msg.areaId,function(flag,data) {
		next(null,{flag:flag,data:data})
	})
}
//获取服务器信息
adminHandler.prototype.getAreaServerInfos = function(msg, session, next) {
	var count = 0
	var servrList = this.app.getServersByType('area')
	for(var i = 0;i < servrList.length;i++){
	    this.app.rpc.area.areaRemote.getAreaServerInfos.toServer(servrList[i].id,function(infos) {
	    	count++
	    	var list = Object.assign({},infos)
	    	if(count == servrList.length){
	    		next(null,{flag : true,list : list})
	    	}
		})
	}
}
//获取服务器内玩家信息
adminHandler.prototype.getAreaPlayers = function(msg, session, next) {
	var limit = session.get("limit")
	if(!limit || limit < 10){
		next(null,{flag : false})
		return
	}
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
	let limit = session.get("limit")
	if(!limit || limit < 10){
		next(null,{flag : false})
		return
	}
	this.serverManager.setOpenPlan(msg.time,function(flag,data) {
		next(null,{flag : flag,data : data})
	})
}
//删除开服计划
adminHandler.prototype.delOpenPlan = function(msg, session, next) {
	let limit = session.get("limit")
	if(!limit || limit < 10){
		next(null,{flag : false})
		return
	}
	this.serverManager.delOpenPlan(msg.time,function(flag,data) {
		next(null,{flag : flag,data : data})
	})
}
//获取开服计划表
adminHandler.prototype.getOpenPlan = function(msg, session, next) {
	let limit = session.get("limit")
	if(!limit || limit < 10){
		next(null,{flag : false})
		return
	}
	this.serverManager.getOpenPlan(function(flag,data) {
		next(null,{flag : flag,data : data})
	})
}
//添加合服计划
adminHandler.prototype.setMergePlan = function(msg, session, next) {
	let limit = session.get("limit")
	if(!limit || limit < 10){
		next(null,{flag : false})
		return
	}
	this.serverManager.setMergePlan(msg.areaList,msg.time,function(flag,data) {
		next(null,{flag : flag,data : data})
	})
}
//删除合服计划
adminHandler.prototype.delMergePlan = function(msg, session, next) {
	let limit = session.get("limit")
	if(!limit || limit < 10){
		next(null,{flag : false})
		return
	}
	this.serverManager.delMergePlan(msg.time,function(flag,data) {
		next(null,{flag : flag,data : data})
	})
}
//获取合服计划表
adminHandler.prototype.getMergePlan = function(msg, session, next) {
	let limit = session.get("limit")
	if(!limit || limit < 10){
		next(null,{flag : false})
		return
	}
	this.serverManager.getMergePlan(function(flag,data) {
		next(null,{flag : flag,data : data})
	})
}
//获取服务器列表
adminHandler.prototype.getServerList = function(msg, session, next) {
	let limit = session.get("limit")
	if(!limit || limit < 10){
		next(null,{flag : false})
		return
	}
	next(null,{flag : true,data : this.areaDeploy.getServerList()})
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
			name : "accountDao",
			ref : "accountDao"
		}]
	})
}