//跨服押镖玩法
const escort_base = require("../../../../config/gameCfg/escort_base.json")
const escort_cfg = require("../../../../config/gameCfg/escort_cfg.json")
const escort_samsara = require("../../../../config/gameCfg/escort_samsara.json")
const runTime = 30000
var carWeight = {}
for(var i in escort_base){
	if(escort_base[i]["u_weight"]){
		var list = escort_base[i]["u_weight"].split("&")
		var weightList = []
		var allRand = 0
		list.forEach(function(m_str) {
			var m_list = m_str.split(":")
			var name = m_list[0]
			var value = parseInt(m_list[1])
			allRand += value
			weightList.push({name : name,value : allRand})
		})
		carWeight[i] = {allRand : allRand,weightList : weightList}
	}
}
module.exports = function() {
	var self = this
	var local = {}
	this.state = false		//活动状态  false  未开启  true  开启
	local.userInfos = {}
	local.carList = []
	//刷新
	this.escortUpdate = function(date) {
		var hours = date.getHours() + (date.getMinutes() / 60)
		if(this.state){
			//判断关闭
			if(!((hours >= escort_cfg["openTime1"]["value"] && hours < escort_cfg["closeTime1"]["value"]) || (hours >= escort_cfg["openTime2"]["value"] && hours < escort_cfg["closeTime2"]["value"]))){
				this.state = false
				local.close()
			}else{
				local.update(date)
			}
		}else{
			//判断开启
			if((hours >= escort_cfg["openTime1"]["value"] && hours < escort_cfg["closeTime1"]["value"]) || (hours >= escort_cfg["openTime2"]["value"] && hours < escort_cfg["closeTime2"]["value"])){
				this.state = true
				local.open()
			}
		}
	}
	//押镖玩法开始
	local.open = function() {
		console.log("押镖玩法开始")
		local.userInfos = {}
	}
	//押镖玩法结束
	local.close = function() {
		console.log("押镖玩法结束")
	}
	//刷新
	local.update = function(date) {
		var endTime = date.getTime() - runTime
		var finishList = []
		for(var i = 0;i < local.carList.length;i++){
			if(local.carList[i]["time"] < endTime){
				finishList = local.carList.splice(i,arr.length)
			}
		}
		for(var i = 0;i < finishList.length;i++){
			local.escortFinish(finishList[i]["uid"])
		}
	}
	//押镖完成
	local.escortFinish = function(uid) {
		var carInfo = local.userInfos[uid]["carInfo"]
		if(carInfo){
			//计算收益
			console.log("uid "+uid+" 押镖完成",carInfo)
			//镖车刷新
			local.userInfos[uid]["quality"] = 0
			local.updateEscortCar(uid)
		}else{
			console.error("escortFinish error"+uid)
		}
	}
	//初始化玩家信息
	local.userInit = function(uid) {
		var info = {
			"escortNum" : 0,
			"robNum" : 0,
			"quality" : "car0",
			"carInfo" : false
		}
		local.userInfos[uid] = info
		local.updateEscortCar(uid)
		return local.userInfos[uid]
	}
	//获取我的押镖信息
	this.getEscortInfo = function(uid,cb) {
		if(!this.state){
			cb(false,"玩法未开启")
			return
		}
		if(local.userInfos[uid]){
			cb(true,local.userInfos[uid])
		}else{
			cb(true,local.userInit(uid))
		}
	}
	//获取镖车列表
	this.getEscortCars = function() {

	}
	//镖车刷新
	this.updateEscortCar = function(uid,cb) {
		if(!this.state){
			cb(false,"玩法未开启")
			return
		}
		if(!local.userInfos[uid]){
			cb(false,"未参与玩法")
			return
		}
		if(local.userInfos[uid]["carInfo"]){
			cb(false,"正在押镖中")
			return
		}
		var quality = local.userInfos[uid]["quality"]
		if(!carWeight[quality]){
			cb(false,"镖车已不能刷新")
			return
		}
		console.log(escort_cfg["refresh"]["value"])
		this.consumeItems(uid,escort_cfg["refresh"]["value"],1,function(flag,err) {
			if(!flag){
				cb(false,err)
			}else{
				cb(true,local.updateEscortCar(uid))
			}
		})
	}
	//镖车刷新
	local.updateEscortCar = function(uid) {
		var quality = local.userInfos[uid]["quality"]
		var rand = Math.random() * carWeight[quality]["allRand"]
		for(var i = 0;i < carWeight[quality]["weightList"].length;i++){
			if(rand < carWeight[quality]["weightList"][i]["value"]){
				quality = carWeight[quality]["weightList"][i]["name"]
				local.userInfos[uid]["quality"] = quality
				break
			}
		}
		return quality
	}
	//开始押镖
	this.beginEscort = function(uid,cb) {
		if(!this.state){
			cb(false,"玩法未开启")
			return
		}
		if(!local.userInfos[uid]){
			cb(false,"未参与玩法")
			return
		}
		if(local.userInfos[uid]["carInfo"]){
			cb(false,"正在押镖中")
			return
		}
		var team = this.userTeam(uid)
		if(!team){
			cb(false,"跨服数据未同步")
			return
		}
		var carInfo = {
			"uid" : uid,
			"user" : self.getSimpleUser(uid),
			"time" : Date.now(),
			"quality" : local.userInfos[uid]["quality"] || 0,
			"team" : team,
			"robCount" : 0
		}
		local.userInfos[uid]["carInfo"] = carInfo
		local.carList.push(carInfo)
	}
	//劫镖
	this.robEscort = function() {

	}
}