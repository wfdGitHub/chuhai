//山海经
const mysterious_realm = require("../../../../config/gameCfg/mysterious_realm.json")
const mysterious_chapter = require("../../../../config/gameCfg/mysterious_chapter.json")
const mysterious_cfg = require("../../../../config/gameCfg/mysterious_cfg.json")
const VIP = require("../../../../config/gameCfg/VIP.json")
const async = require("async")
const main_name = "mysterious"
for(var i in mysterious_realm){
	mysterious_realm[i]["team"] = JSON.parse(mysterious_realm[i]["team"])
	mysterious_realm[i].chapter = Math.ceil(i / 10)
}
module.exports = function() {
	var self = this
	const mysteriousInfo = {
		"allStar" : 0,	//总星数
		"max" : 0,		//最高关卡
		"count" : 0,	//挑战次数
		"buy" : 0		//购买次数
	}
	//玩家每日刷新
	this.mysteriousDayUpdate = function(uid) {
		self.setObj(uid,main_name,"count",0)
		self.setObj(uid,main_name,"buy",0)
	}
	//获取关卡数据
	this.getMysteriousData = function(uid,cb) {
		self.getObjAll(uid,main_name,function(obj) {
			for(var i in obj){
				obj[i] = Number(obj[i])
			}
			cb(true,Object.assign({},mysteriousInfo,obj))
		})
	}
	//挑战关卡
	this.challengeMysterious = function(uid,lv,verify,cb) {
		if(!mysterious_realm[lv]){
			cb(false,"关卡不存在")
			return
		}
	    var fightInfo = self.getFightInfo(uid)
	    if(!fightInfo){
	    	cb(false,"未准备")
	    	return
	    }
	    var max,star,awardList
		async.waterfall([
			function(next) {
				self.getHMObj(uid,main_name,["count","buy"],function(list) {
					var count = Number(list[0]) || 0
					var buy = Number(list[1]) || 0
					if(count >= mysterious_cfg["free_count"]["value"] + buy){
						next("次数不足")
					}else{
						next()
					}
				})
			},
			function(next) {
				self.getHMObj(uid,main_name,["max","lv_"+lv],function(list) {
					max = Number(list[0]) || 0
					star = Number(list[1]) || 0
					if(lv > max + 1){
						next("关卡未解锁")
					}else if(star >= 3){
						next("已满星")
					}else{
						next()
					}
				})
			},
			function(next) {
			   	var atkTeam = fightInfo.team
			   	var seededNum = fightInfo.seededNum
			   	var defTeam = mysterious_realm[lv]["team"]
			    var winFlag = self.fightContorl.beginFight(atkTeam,defTeam,{seededNum : seededNum})
			    var info = {}
			    info.winFlag = winFlag
			    if(winFlag){
			    	var record = self.fightContorl.getFightRecord()
			    	var overInfo = record[record.length - 1]
			    	var starState = [1,0,0]
			    	//计算星数
			    	var curStar = 1
			    	if(overInfo.round <= 5){
			    		curStar++
			    		starState[1] = 1
			    	}
			    	var dieFlag = false
			    	for(var i = 0;i < overInfo.atkTeam.length;i++){
			    		if(overInfo.atkTeam[i] && overInfo.atkTeam[i]["hp"] <= 0){
			    			dieFlag = true
			    			break
			    		}
			    	}
			    	if(!dieFlag){
			    		curStar++
			    		starState[2] = 1
			    	}
			    	info.star = curStar
			    	info.starState = starState
			    	if(star == 0){
			    		//首通
			    		info.awardList = self.addItemStr(uid,mysterious_realm[lv]["pass_award"],1,"山海经首通"+lv)
						self.chageLordData(uid,"maxSS",lv)
			    	}else{
			    		//次通
			    		info.awardList = self.addItemStr(uid,mysterious_realm[lv]["mopup_award"],1,"山海经通关"+lv)
			    	}
			    	if(curStar > star){
			    		info.addStar = curStar - star
			    		self.incrbyObj(uid,main_name,"chapter_"+mysterious_realm[lv]["chapter"],info.addStar)
			    		self.incrbyObj(uid,main_name,"allStar",info.addStar,function(allStar) {
			    			self.addZset("seas_rank",uid,allStar)
			    		})
			    		self.setObj(uid,main_name,"lv_"+lv,curStar)
			    	}
			    	if(lv > max){
			    		self.setObj(uid,main_name,"max",lv)
			    	}
			    	self.incrbyObj(uid,main_name,"count",1)
			    	self.taskUpdate(uid,"ss_pass",1,lv)
			    	self.taskUpdate(uid,"ss_play",1)
			    }
			    cb(true,info)
			}
		],function(err) {
			cb(false,err)
		})
	}
	//扫荡关卡
	this.mopupMysterious = function(uid,lv,cb) {
		async.waterfall([
			function(next) {
				self.getHMObj(uid,main_name,["count","buy"],function(list) {
					var count = Number(list[0]) || 0
					var buy = Number(list[1]) || 0
					if(count >= mysterious_cfg["free_count"]["value"] + buy){
						next("次数不足")
					}else{
						next()
					}
				})
			},
			function(next) {
				self.getObj(uid,main_name,"lv_"+lv,function(star) {
					if(star == 3){
						self.incrbyObj(uid,main_name,"count",1)
						var rate = 1
						if(self.checkLimitedTime("saodang"))
							rate = 2
						var awardList = self.addItemStr(uid,mysterious_realm[lv]["mopup_award"],rate)
						self.taskUpdate(uid,"ss_play",1)
						cb(true,awardList)
					}else{
						next("未满星")
					}
				})
			}
			],function(err) {
				cb(false,err)
			}
		)
	}
	//购买次数
	this.buyMysteriousCount = function(uid,cb) {
		var buyCount = VIP[self.players[uid]["vip"]]["mysterious"]
		self.getObj(uid,main_name,"buy",function(buy) {
			buy = Number(buy) || 0
			if(buy >= buyCount + mysterious_cfg["buy_count"]["value"]){
				cb(false,"已达到购买限制")
			}else{
				self.consumeItems(uid,mysterious_cfg["buy_pc"]["value"],1,"山海经次数",function(flag,err) {
					if(flag){
						self.incrbyObj(uid,main_name,"buy",1)
						cb(true,buy+1)
					}else{
						cb(false,"元宝不足")
					}
				})
			}
		})
	}
	//领取章节宝箱
	this.gaintMysteriousBox = function(uid,chapter,index,cb) {
		if(!mysterious_chapter[chapter] || !mysterious_chapter[chapter]["star_"+index]){
			cb(false,"章节或宝箱不存在")
			return
		}
		self.getHMObj(uid,main_name,["chapter_"+chapter,"chapter_"+chapter+"_"+index],function(list) {
			if(list[1]){
				cb(false,"已领取")
			}else{
				var star = Number(list[0]) || 0
				if(star >= index * 10){
					var awardList = self.addItemStr(uid,mysterious_chapter[chapter]["star_"+index],1,"山海经章节宝箱_"+chapter+"_"+index)
					self.setObj(uid,main_name,"chapter_"+chapter+"_"+index,1)
					cb(true,awardList)
				}else{
					cb(false,"星数不足 "+star+"/"+index * 10)
				}
			}
		})
	}
	//获取排行榜
	this.getMysteriousRank = function(uid,cb) {
		self.zrangewithscore("seas_rank",-10,-1,function(list) {
			var uids = []
			var scores = []
			for(var i = 0;i < list.length;i += 2){
				uids.push(list[i])
				scores.push(list[i+1])
			}
			self.getPlayerInfoByUids(uids,function(userInfos) {
				var info = {}
				info.userInfos = userInfos
				info.scores = scores
				cb(true,info)
			})
		})
	}
}