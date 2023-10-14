var express = require('express');
var xmlparser = require('express-xml-bodyparser')
var serverDB = require('./serverDB.js')
var adminManager = require('./adminManager.js')
var parseString = require('xml2js').parseString;
var util = require("../../../util/util.js")
var local = {}
var serverManager = function(app) {
	this.app = app
	this.areaDeploy = this.app.get("areaDeploy")
	this.openPlans = {}
	this.mergePlans = {}
	this.areaLock = {}
}
serverManager.prototype.init = function() {
	var self = this
	self.redisDao.db.hgetall("serverManager:openPlans",function(err,data) {
		for(var i in data){
			self.openPlans[i] = Number(data[i])
		}
	})
	self.redisDao.db.hgetall("serverManager:mergePlans",function(err,data) {
		for(var i in data){
			self.mergePlans[i] = JSON.parse(data[i])
		}
	})
	setInterval(self.update.bind(self),1000)
	var server = express()
	server.use(express.json());
	server.use(express.urlencoded());
	server.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*')
	res.header('Access-Control-Allow-Headers', 'Authorization,X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method' )
	res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PATCH, PUT, DELETE')
	res.header('Allow', 'GET, POST, PATCH, OPTIONS, PUT, DELETE')
		next();
	});
	server.use(xmlparser());
	server.post("/pay_order",function(req,res) {
		var data = req.body
		self.sdkPay.pay_order(req.body,self.finish_callback.bind(self),req,res)
	})
	self.sdkQuery.init(server,self)
	server.listen(80);
	var server2 = express()
	server2.use(express.json());
	server2.use(express.urlencoded());
	server2.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*')
	res.header('Access-Control-Allow-Headers', 'Authorization,X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method' )
	res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PATCH, PUT, DELETE')
	res.header('Allow', 'GET, POST, PATCH, OPTIONS, PUT, DELETE')
	next();
	});
	server2.use(xmlparser());
	serverDB.init(server2,self)
	adminManager.init(server2,self)
	server2.listen(5081);
}
serverManager.prototype.finish_callback = function(areaId,uid,amount,pay_id) {
	//支付成功发货
	var serverId = this.areaDeploy.getServer(this.areaDeploy.getFinalServer(areaId))
    this.app.rpc.area.areaRemote.finish_recharge.toServer(serverId,areaId,uid,pay_id,function(){})
    this.app.rpc.area.areaRemote.real_recharge.toServer(serverId,areaId,uid,Math.floor(Number(amount) * 100),function(){})
}
//update
serverManager.prototype.update = function() {
	let curTime = Date.now()
	for(var time in this.openPlans){
		if(curTime > Number(time)){
			delete this.openPlans[time]
			this.redisDao.db.hdel("serverManager:openPlans",time)
			this.areaDeploy.openArea()
			return
		}
	}
	for(var time in this.mergePlans){
		if(curTime > Number(time)){
			var areaList = this.mergePlans[time]
			for(var i = 0;i < areaList.length;i++){
				delete this.areaLock[areaList[i]]
			}
			delete this.mergePlans[time]
			this.redisDao.db.hdel("serverManager:mergePlans",time)
			this.areaDeploy.mergeArea(areaList)
			return
		}
	}
}
//添加合服计划
serverManager.prototype.setMergePlan = function(areaList,time,cb) {
	if(!Number.isInteger(time) || time < Date.now() || !Array.isArray(areaList) || areaList.length <= 1){
		cb(false,"参数错误")
		return
	}
	for(var i = 0;i < areaList.length;i++){
		if(!this.areaDeploy.serverMap[areaList[i]] || this.areaLock[areaList[i]]){
			cb(false,areaList[i]+"不存在或已在合服计划")
			return
		}
	}
	for(var i = 0;i < areaList.length;i++){
		this.areaLock[areaList[i]] = true
	}
	if(this.mergePlans[time]){
		for(var i = 1;i < 1000;i++){
			if(!this.mergePlans[time+i]){
				time = time+i
				break
			}
		}
	}
	this.mergePlans[time] = areaList
	this.redisDao.db.hset("serverManager:mergePlans",time,JSON.stringify(areaList))
	cb(true)
}
//删除合服计划
serverManager.prototype.delMergePlan = function(time,cb) {
	if(!this.mergePlans[time]){
		cb(false,"不存在该合服计划")
		return
	}
	var areaList = this.mergePlans[time]
	for(var i = 0;i < areaList.length;i++){
		delete this.areaLock[areaList[i]]
	}
	delete this.mergePlans[time]
	this.redisDao.db.hdel("serverManager:mergePlans",time)
	cb(true)
}
//获取合服计划表
serverManager.prototype.getMergePlan = function(cb) {
	cb(true,this.mergePlans,this.areaLock)
}
//添加开服计划
serverManager.prototype.setOpenPlan = function(time,cb) {
	if(!Number.isInteger(time) || time < Date.now()){
		cb(false,"参数错误")
		return
	}
	if(this.openPlans[time]){
		cb(false,"该时间已设置")
		return
	}
	this.openPlans[time] = 1
	this.redisDao.db.hset("serverManager:openPlans",time,1)
	cb(true)
}
//删除开服计划
serverManager.prototype.delOpenPlan = function(time,cb) {
	if(!this.openPlans[time]){
		cb(false,"不存在该服务器开服计划")
		return
	}
	delete this.openPlans[time]
	this.redisDao.db.hdel("serverManager:openPlans",time)
	cb(true)
}
//获取开服计划表
serverManager.prototype.getOpenPlan = function(cb) {
	var self = this
	self.redisDao.db.get("area:lastid",function(err,data) {
			cb(true,{openPlans : self.openPlans,areaLock : self.areaLock,lastArea : data})
	})
}
module.exports = {
	id : "serverManager",
	func : serverManager,
	scope : "prototype",
	init : "init",
	args : [{
		name : "app",
		type : "Object"
	}],
	props : [{
		name : "redisDao",
		ref : "redisDao"
	},{
		name : "payDao",
		ref : "payDao"
	},{
		name : "mysqlDao",
		ref : "mysqlDao"
	},{
		name : "playerDao",
		ref : "playerDao"
	},{
		name : "accountDao",
		ref : "accountDao"
	},{
		name : "sdkEntry",
		ref : "sdkEntry"
	},{
		name : "sdkPay",
		ref : "sdkPay"
	},{
		name : "sdkQuery",
		ref : "sdkQuery"
	}]
}