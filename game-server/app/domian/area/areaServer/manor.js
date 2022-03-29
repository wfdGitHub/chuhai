//家园系统
const manor_builds = require("../../../../config/gameCfg/manor_builds.json")
const async = require("async")
const builds = {}
for(var i in manor_builds){
	if(!builds[manor_builds[i]["basic"]])
		builds[manor_builds[i]["basic"]] = require("../../../../config/gameCfg/manor_"+manor_builds[i]["basic"]+".json")
}
for(var i in builds["xmc"]){
	builds["xmc"][i]["allWeight"] = 0
	for(var j = 1; j <= 4;j++)
		if(builds["xmc"][i]["quality_"+j])
			builds["xmc"][i]["allWeight"] +=builds["xmc"][i]["quality_"+j]
}
for(var i in builds["qjf"]){
	builds["qjf"][i]["allWeight"] = 0
	for(var j = 1; j <= 4;j++)
		if(builds["qjf"][i]["quality_"+j])
			builds["qjf"][i]["allWeight"] +=builds["qjf"][i]["quality_"+j]
}
const hourTime = 3600000
const build_time = 3000
const main_name = "manor"
module.exports = function() {
	var self = this
	//获取家园数据
	this.manor_data = function(uid,cb) {
		self.getObjAll(uid,main_name,function(data) {
			if(!data){
				self.manor_init(uid,cb)
			}else{
				cb(true,data)
			}
		})
	}
	//初始化家园
	this.manor_init = function(uid,cb) {
		self.setObj(uid,main_name,"main",1)
		cb(true,{"main":1})
	}
	//建设升级建筑
	this.manor_build = function(uid,bId,land,cb) {
		if(!manor_builds[bId]){
			cb(false,"bId error "+bId)
			return
		}
		if(!Number.isInteger(land)){
			cb(false,"land error "+land)
			return
		}
		var mainLv = 0
		var basic = manor_builds[bId]["basic"]
		async.waterfall([
			function(next) {
				//获取主建筑等级
				self.getObj(uid,main_name,"main",function(data) {
					mainLv = Number(data) || 0
					if(manor_builds[bId]["main_lv"] > mainLv){
						next("主建筑等级不足")
						return
					}
					next()
				})
			},
			function(next) {
				//判断格子
				self.getObj(uid,main_name,"land_"+land,function(data) {
					if(data && data != bId)
						next("地块已被占用")
					else
						next()
				})
			},
			function(next) {
				//获取建筑等级并消耗资源
				self.getObj(uid,main_name,bId,function(buildLv) {
					buildLv = Number(buildLv) || 0
					buildLv++
					if(!builds[basic][buildLv]){
						next("建筑等级已满")
						return
					}
					if(bId != "main" && buildLv > mainLv){
						next("主建筑等级不足")
						return
					}
					if(builds[basic][buildLv]["upgrade"]){
						self.consumeItems(uid,builds[basic][buildLv]["upgrade"],1,"升级建筑:"+bId+":"+buildLv,function(flag,err) {
							if(flag)
								next(null,buildLv)
							else
								next(err)
						})
					}else{
						next()
					}
				})
			},
			function(buildLv,next) {
				if(buildLv == 1){
					//设置地块
					self.setObj(uid,main_name,"land_"+land,bId)
					if(manor_builds[bId]["type"] == "res")
						self.setObj(uid,main_name,bId+"_time",Date.now())
				}
				//升级建筑
				self.setObj(uid,main_name,bId,buildLv)
				cb(true,buildLv)
			}
		],function(err) {
			// body...
			cb(false,err)
		})
	}
	//交换建筑
	this.manor_swap = function(uid,land1,land2,cb) {
		if(!Number.isInteger(land1) || !Number.isInteger(land2)){
			cb(false,"land error "+land1+" "+land2)
			return
		}
		var bId1 = ""
		var bId2 = ""
		self.getObj(uid,main_name,"land_"+land1,function(data) {
			bId1 = data
			self.getObj(uid,main_name,"land_"+land2,function(data) {
				bId2 = data
				self.setObj(uid,main_name,"land_"+land1,bId2)
				self.setObj(uid,main_name,"land_"+land2,bId1)
				cb(true)
			})
		})
	}
	//获取收益
	this.manor_reap = function(uid,bId,cb) {
		if(!manor_builds[bId]){
			cb(false,"bId error "+bId)
			return
		}
		if(manor_builds[bId]["type"] != "res"){
			cb(false,"非资源建筑")
			return
		}
		var basic = manor_builds[bId]["basic"]
		var item = manor_builds[bId]["award"]
		var curTime = Date.now()
		self.getHMObj(uid,main_name,[bId,bId+"_time"],function(data) {
			var buildLv = Number(data[0]) || 0
			var time = Number(data[1]) || 0
			if(!buildLv){
				cb(false,"建筑不存在")
				return
			}
			var awardTime = curTime - time
			console.log("awardTime",awardTime)
			var value = Math.floor(awardTime / hourTime * builds[basic][buildLv]["output"])
			if(awardTime < 10000 || value < 1){
				cb(false,"资源正在生产中")
				return
			}
			if(value > builds[basic][buildLv]["capacity"])
				value = builds[basic][buildLv]["capacity"]
			var awardList = self.addItemStr(uid,item+":"+value,1,"收获"+bId)
			self.setObj(uid,main_name,bId+"_time",curTime)
			cb(true,{awardList:awardList,time:curTime})
		})
	}
	//驯养马匹
	this.manorStartHorse = function(uid,cb) {
		var bId = "xmc"
		var basic = "xmc"
		self.getHMObj(uid,main_name,[bId,bId+"_time"],function(data) {
			var buildLv = Number(data[0]) || 0
			if(!buildLv){
				cb(false,"建筑不存在")
				return
			}
			if(data[1]){
				cb(false,"正在生产中")
				return
			}
			var time = Number(data[1]) || 0
			self.consumeItems(uid,"810:"+builds[basic][buildLv]["pc"],1,"驯养马匹:"+buildLv,function(flag,err) {
				if(flag){
					var curTime = Date.now() + build_time
					self.setObj(uid,main_name,bId+"_time",curTime)
					cb(true,curTime)
				}else{
					cb(false,err)
				}
			})
		})
	}
	//收取马匹
	this.manorGainHorse = function(uid,cb) {
		var bId = "xmc"
		var basic = "xmc"
		self.getHMObj(uid,main_name,[bId,bId+"_time"],function(data) {
			var buildLv = Number(data[0]) || 0
			if(!buildLv){
				cb(false,"建筑不存在")
				return
			}
			if(!data[1]){
				cb(false,"不在生产中")
				return
			}
			var time = Number(data[1]) || 0
			if(Date.now() > time){
				//获得马匹
				var rand = Math.random() * builds[bId][buildLv]["allWeight"]
				var lv = 1
				for(var i = 1; i <= 4;i++){
					if(rand < builds[bId][buildLv]["quality_"+i]){
						lv = i
						break
					}else{
						rand -= builds[bId][buildLv]["quality_"+i]
					}
				}
				var horseInfo = self.gainRandHorse(uid,lv)
				self.delObj(uid,main_name,bId+"_time")
				cb(true,horseInfo)
			}else{
				cb(false,"未到收取时间")
			}
		})
	}
	//打造护符
	this.manorStartHufu = function(uid,cb) {
		var bId = "qjf"
		var basic = "qjf"
		self.getHMObj(uid,main_name,[bId,bId+"_time"],function(data) {
			var buildLv = Number(data[0]) || 0
			if(!buildLv){
				cb(false,"建筑不存在")
				return
			}
			if(data[1]){
				cb(false,"正在生产中")
				return
			}
			var time = Number(data[1]) || 0
			self.consumeItems(uid,"810:"+builds[basic][buildLv]["pc"],1,"打造护符:"+buildLv,function(flag,err) {
				if(flag){
					var curTime = Date.now() + build_time
					self.setObj(uid,main_name,bId+"_time",curTime)
					cb(true,curTime)
				}else{
					cb(false,err)
				}
			})
		})
	}
	//收取护符
	this.manorGainHufu = function(uid,cb) {
		var bId = "qjf"
		var basic = "qjf"
		self.getHMObj(uid,main_name,[bId,bId+"_time"],function(data) {
			var buildLv = Number(data[0]) || 0
			if(!buildLv){
				cb(false,"建筑不存在")
				return
			}
			if(!data[1]){
				cb(false,"不在生产中")
				return
			}
			var time = Number(data[1]) || 0
			if(Date.now() > time){
				//收取护符
				var rand = Math.random() * builds[bId][buildLv]["allWeight"]
				var lv = 1
				for(var i = 1; i <= 4;i++){
					if(rand < builds[bId][buildLv]["quality_"+i]){
						lv = i
						break
					}else{
						rand -= builds[bId][buildLv]["quality_"+i]
					}
				}
				var hufuInfo = self.gainRandHufu(uid,lv)
				self.delObj(uid,main_name,bId+"_time")
				cb(true,hufuInfo)
			}else{
				cb(false,"未到收取时间")
			}
		})
	}
}