var express = require('express');
var xmlparser = require('express-xml-bodyparser')
var parseString = require('xml2js').parseString;
var sdkConfig = require("../../../config/sysCfg/sdkConfig.json")
var util = require("../../../util/util.js")
var Md5_Key = sdkConfig["Md5_Key"]
var Callback_Key = sdkConfig["Callback_Key"]
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
	server.use(xmlparser());
	switch(sdkConfig.sdk_type){
		case "quick":
			self.pay_order = self.quick_order
		break
		case "jianwan":
			self.pay_order = self.jianwan_order
		break
		default:
			console.error("sdktype error")
	}
	server.post(sdkConfig["pay_callback"],function(req,res) {
		var data = req.body
		self.pay_order(data,function(flag,err) {
			if(!flag)
				res.send(err)
			else
				res.send("SUCCESS")
		})
	})
	server.listen(80);
}
serverManager.prototype.quick_order = function(data,cb) {
	var v_sign = util.md5(data.nt_data+data.sign+Md5_Key)
	if(v_sign != data.md5Sign){
		console.error("签名验证失败")
		cb(false,"签名验证失败")
		return
	}
	var self = this
	var xmlStr = local.decode(data.nt_data,Callback_Key)
	parseString(xmlStr,function(err,result) {
		var message = result.quicksdk_message.message[0]
		var info = {
			is_test : message["is_test"]? message["is_test"][0] : 0,
			channel : message["channel"]? message["channel"][0] : 0,
			channel_name : message["channel_name"]? message["channel_name"][0] : 0,
			channel_uid : message["channel_uid"]? message["channel_uid"][0] : 0,
			channel_order : message["channel_order"]? message["channel_order"][0] : 0,
			game_order : message["game_order"]? message["game_order"][0] : 0,
			order_no : message["order_no"]? message["order_no"][0] : 0,
			pay_time : message["pay_time"]? message["pay_time"][0] : 0,
			amount : message["amount"]? message["amount"][0] : 0,
			status : message["status"]? message["status"][0] : 0,
			extras_params : message["extras_params"]? message["extras_params"][0] : 0,
		}
		self.payDao.finishGameOrder(info,function(flag,err,data) {
			if(flag){
				//发货
				var areaId = self.areaDeploy.getFinalServer(data.areaId)
				var serverId = self.areaDeploy.getServer(areaId)
			    self.app.rpc.area.areaRemote.finish_recharge.toServer(serverId,areaId,data.uid,data.pay_id,function(){})
			}
			if(err)
				cb(false,err)
			else
				cb(true)
		})
	});
}
serverManager.prototype.jianwan_order = function(data,cb) {
	console.log("jianwan_order",data,data.nt_data_json)
	var v_sign = util.md5(data.nt_data+data.sign+Md5_Key)
	if(v_sign != data.md5Sign){
		console.error("签名验证失败")
		cb(false,"签名验证失败")
		return
	}
	var self = this
	// var info = {
	// 	is_test : message["is_test"]? message["is_test"][0] : 0,
	// 	channel : message["channel"]? message["channel"][0] : 0,
	// 	channel_name : message["channel_name"]? message["channel_name"][0] : 0,
	// 	channel_uid : message["channel_uid"]? message["channel_uid"][0] : 0,
	// 	channel_order : message["channel_order"]? message["channel_order"][0] : 0,
	// 	game_order : message["game_order"]? message["game_order"][0] : 0,
	// 	order_no : message["order_no"]? message["order_no"][0] : 0,
	// 	pay_time : message["pay_time"]? message["pay_time"][0] : 0,
	// 	amount : message["amount"]? message["amount"][0] : 0,
	// 	status : message["status"]? message["status"][0] : 0,
	// 	extras_params : message["extras_params"]? message["extras_params"][0] : 0,
	// }
	// self.payDao.finishGameOrder(info,function(flag,err,data) {
	// 	if(flag){
	// 		//发货
	// 		var areaId = self.areaDeploy.getFinalServer(data.areaId)
	// 		var serverId = self.areaDeploy.getServer(areaId)
	// 	    self.app.rpc.area.areaRemote.finish_recharge.toServer(serverId,areaId,data.uid,data.pay_id,function(){})
	// 	}
	// 	if(err)
	// 		cb(false,err)
	// 	else
	// 		cb(true)
	// })
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
	if(!Number.isInteger(time) || time < Date.now() || !Array.isArray(areaList)){
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
	cb(true,this.mergePlans)
}
//添加开服计划
serverManager.prototype.setOpenPlan = function(time,cb) {
	if(!Number.isInteger(time) || time < Date.now()){
		cb(false,"参数错误")
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
	cb(true,{openPlans : this.openPlans,areaLock : this.areaLock})
}
local.decode = function(str,key){
	if(str.length <= 0){
		return '';
	}
	var list = new Array();
	var resultMatch = str.match(/\d+/g);
	for(var i= 0;i<resultMatch.length;i++){
		list.push(resultMatch[i]);
	}
	if(list.length <= 0){
		return '';
	}
	var keysByte = local.stringToBytes(key);
	var dataByte = new Array();
	for(var i = 0 ; i < list.length ; i++){
		dataByte[i] = parseInt(list[i]) - (0xff & parseInt(keysByte[i % keysByte.length]));
	}
	if(dataByte.length <= 0){
		return '';
	}
	var parseStr = local.bytesToString(dataByte);
	return parseStr;
}
local.stringToBytes = function(str) {  
	var ch, st, re = [];  
  	for (var i = 0; i < str.length; i++ ) {  
    	ch = str.charCodeAt(i);
    	st = []; 
    	do {  
      		st.push( ch & 0xFF );
      		ch = ch >> 8;
    	}while ( ch );  
    	re = re.concat( st.reverse() );  
	}  
  	return re;  
} 
local.bytesToString = function(array) {
  return String.fromCharCode.apply(String, array);
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
	}]
}