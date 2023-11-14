//通天塔模块
const ttttower_level = require("../../../../config/gameCfg/ttttower_level.json")
const ttttower_realm = require("../../../../config/gameCfg/ttttower_realm.json")
const ttttower_cfg = require("../../../../config/gameCfg/ttttower_cfg.json")
const heros_cfg = require("../../../../config/gameCfg/heros.json")
const VIP = require("../../../../config/gameCfg/VIP.json")
var async = require("async")
var main_name = "ttt"
for(var i in ttttower_level){
	ttttower_level[i]["defTeam"] = JSON.parse(ttttower_level[i]["defTeam"])
}
for(var i in ttttower_realm){
	ttttower_realm[i]["defTeam"] = JSON.parse(ttttower_realm[i]["defTeam"])
}
var realm_day = {
	"0" : {"1":true,"2":true,"3":true,"4":true},
	"1" : {"1":true},
	"2" : {"2":true},
	"3" : {"3":true},
	"4" : {"4":true},
	"5" : {"1":true,"2":true},
	"6" : {"3":true,"4":true}
}
module.exports = function() {
	var self = this
	const TTTInfo = {
		"level" : 0,	//最高等级
		"mopup" : 0		//扫荡次数
	}
	//玩家每日刷新
	this.TTTdayUpdate = function(uid) {
		self.setObj(uid,main_name,"mopup",0)
		self.setObj(uid,main_name,"realm_count_1",0)
		self.setObj(uid,main_name,"realm_count_2",0)
		self.setObj(uid,main_name,"realm_count_3",0)
		self.setObj(uid,main_name,"realm_count_4",0)
		self.setObj(uid,main_name,"realm_mopup_1",0)
		self.setObj(uid,main_name,"realm_mopup_2",0)
		self.setObj(uid,main_name,"realm_mopup_3",0)
		self.setObj(uid,main_name,"realm_mopup_4",0)
	}
	//获取通天塔数据
	this.getTTTInfo = function(uid,cb) {
		self.getObjAll(uid,main_name,function(obj) {
			for(var i in obj){
				obj[i] = Number(obj[i])
			}
			cb(Object.assign({},TTTInfo,obj))
		})
	}
	//挑战通天塔
	this.challengeTTTBoss = function(uid,verify,cb) {
		var level = 0
		async.waterfall([
			function(next) {
				//获取通天塔数据
				self.getObj(uid,main_name,"level",function(data) {
					level = Number(data) + 1
					if(ttttower_level[level])
						next()
					else
						next("关卡不存在"+level)
				})
			},
			function(next) {
			    var fightInfo = self.getFightInfo(uid)
			    if(!fightInfo){
			    	next("未准备")
			    	return
			    }
			   	var atkTeam = fightInfo.team
			   	var seededNum = fightInfo.seededNum
			    var mon_list = ttttower_level[level]["defTeam"]
			    var defTeam = self.standardTeam(uid,mon_list,"ttt_main",ttttower_level[level]["lv"])
			   	var winFlag = self.fightContorl.beginFight(atkTeam,defTeam,{seededNum : seededNum})
			    self.taskUpdate(uid,"ttt",1)
		   		self.incrbyObj(uid,main_name,"level",1)
		   		self.taskUpdate(uid,"tttLv",1)
		   		self.updateSprintRank("ttt_rank",uid,1)
		   		self.chageLordData(uid,"ttt_lv",level)
		   		var awardList = []
		   		if(ttttower_level[level]["awards"])
					awardList = awardList.concat(self.addItemStr(uid,ttttower_level[level]["awards"],1,"通天塔"+level))
				awardList = awardList.concat(self.addItemStr(uid,ttttower_level[level]["mopupAward"],1,"通天塔"+level))
				cb(true,awardList)
			}
		],function(err) {
				cb(false,err)
		})
	}
	//扫荡奖励
	this.TTTmopup = function(uid,level,cb) {
		if(!ttttower_level[level]){
			cb(false,"通天塔等级错误"+level)
			return
		}
		async.waterfall([
			function(next) {
				//通天塔数据
				self.getHMObj(uid,main_name,["level","mopup"],function(list) {
					var maxLv = Number(list[0]) || 0
					var mopup = Number(list[1]) || 0
					if(level > maxLv){
						next("只能扫荡已通关")
						return
					}
					if(mopup < ttttower_cfg["freeCount"]["value"]){
						//免费扫荡
						self.incrbyObj(uid,main_name,"mopup",1)
						next()
					}else if(mopup < ttttower_cfg["freeCount"]["value"] + ttttower_cfg["buyCount"]["value"]){
						//付费扫荡
						self.consumeItems(uid,ttttower_cfg["mopup"]["value"],1,"通天塔扫荡",function(flag,err) {
							if(flag){
								self.incrbyObj(uid,main_name,"mopup",1)
								next()
							}
							else
								next(err)
						})
					}else{
						next("扫荡次数已满")
					}
				})
			},
			function(next) {
				//扫荡奖励
				self.taskUpdate(uid,"ttt",1)
				var rate = 1
				if(self.checkLimitedTime("saodang"))
					rate = 2
				var awardList = self.addItemStr(uid,ttttower_level[level]["mopupAward"],rate,"通天塔扫荡"+level)
				cb(true,awardList)
			}
		],function(err) {
			cb(false,err)
		})
	}
	//挑战阵营塔
	this.challengeRealmBoss = function(uid,realm,heros,seededNum,verify,cb) {
		if(!realm_day[self.weekDay][realm]){
			cb(false,"今日未开放该阵营")
			return
		}
		var level = 0
		async.waterfall([
			function(next) {
				//获取通天塔数据
				self.getHMObj(uid,main_name,["realm_level_"+realm,"realm_count_"+realm],function(list) {
					level = Number(list[0]) + 1
					if(list[1] >= ttttower_cfg["max_count"]["value"]){
						next("今日挑战次数已满")
					}else if(ttttower_realm[level])
						next()
					else
						next("关卡不存在"+level)
				})
			},
			function(next) {
				self.heroDao.getHeroList(uid,heros,function(flag,list) {
					if(!flag){
						next(list)
						return
					}
					var heroNum = 0
					for(var i = 0;i < list.length;i++){
						if(list[i]){
							heroNum++
							if(heros_cfg[list[i]["id"]]["realm"] != realm){
								next("必须上阵该阵营的英雄")
								return
							}
						}
					}
					if(heroNum == 0){
						next("必须上阵英雄")
						return
					}
					next(null,list)
				})
			},
			function(atkTeam,next) {
				var team = self.getUserTeam(uid)
				if(team && team[6])
					atkTeam[6] = team[6]
				next(null,atkTeam)
			},
			function(atkTeam,next) {
			    var mon_list = ttttower_realm[level]["defTeam"]
			    var defTeam = self.standardTeam(uid,mon_list,"ttt_realm",ttttower_realm[level]["lv"])
			   	var winFlag = self.fightContorl.beginFight(atkTeam,defTeam,{seededNum : seededNum})
		   		self.incrbyObj(uid,main_name,"realm_level_"+realm,1)
		   		self.incrbyObj(uid,main_name,"realm_count_"+realm,1)
		   		self.addZset("ttt_realm"+realm,uid,level)
		   		self.taskUpdate(uid,"tttRealmLv",1,realm)
		   		var awardList = []
		   		if(ttttower_realm[level]["awards_"+realm])
					awardList = awardList.concat(self.addItemStr(uid,ttttower_realm[level]["awards_"+realm],1,"阵营塔"+level))
				awardList = awardList.concat(self.addItemStr(uid,ttttower_realm[level]["mopupAward_"+realm],1,"阵营塔"+level))
				cb(true,awardList)
			}
		],function(err) {
				cb(false,err)
		})
	}
	//扫荡阵营塔
	this.realmMopup = function(uid,realm,cb) {
		if(!realm_day[self.weekDay][realm]){
			cb(false,"今日未开放该阵营")
			return
		}
		var level = 0
		async.waterfall([
			function(next) {
				//通天塔数据
				self.getHMObj(uid,main_name,["realm_level_"+realm,"realm_mopup_"+realm],function(list) {
					level = Number(list[0]) || 0
					var mopup = Number(list[1]) || 0
					if(!level){
						cb(false,"level=0")
						return
					}
					if(mopup < ttttower_cfg["freeCount"]["value"]){
						//免费扫荡
						self.incrbyObj(uid,main_name,"realm_mopup_"+realm,1)
						next()
					}else if(mopup < ttttower_cfg["freeCount"]["value"] + ttttower_cfg["buyCount"]["value"]){
						//付费扫荡
						self.consumeItems(uid,ttttower_cfg["mopup"]["value"],1,"阵营塔扫荡",function(flag,err) {
							if(flag){
								self.incrbyObj(uid,main_name,"realm_mopup_"+realm,1)
								next()
							}
							else
								next(err)
						})
					}else{
						next("扫荡次数已满")
					}
				})
			},
			function(next) {
				//扫荡奖励
				var rate = 1
				if(self.checkLimitedTime("saodang"))
					rate = 2
				var awardList = self.addItemStr(uid,ttttower_realm[level]["mopupAward_"+realm],rate,"阵营塔扫荡"+level)
				cb(true,awardList)
			}
		],function(err) {
			cb(false,err)
		})
	}
}