const checkpointsCfg = require("../../../../config/gameCfg/checkpoints.json")
const checkpoints_task = require("../../../../config/gameCfg/checkpoints_task.json")
const equip_base = require("../../../../config/gameCfg/equip_base.json")
const VIP = require("../../../../config/gameCfg/VIP.json")
const activity_cfg = require("../../../../config/gameCfg/activity_cfg.json")
const chapter = require("../../../../config/gameCfg/chapter.json")
var async = require("async")
module.exports = function() {
	var equip_list = {}
	for(var i in equip_base){
		if(!equip_list[equip_base[i]["lv"]]){
			equip_list[equip_base[i]["lv"]] = []
		}
		equip_list[equip_base[i]["lv"]].push(i)
	}
	var self = this
	var userCheckpoints = {}
	//加载角色关卡数据
	this.checkpointsLoad = function(uid,cb) {
		this.getPlayerData(uid,"boss",function(data) {
			userCheckpoints[uid] = Number(data) || 0
			cb()
		})
	}
	//移除主公关卡数据
	this.checkpointsUnload = function(uid) {
		delete userCheckpoints[uid]
	}
	//获取当前关卡
	this.getCheckpointsInfo = function(uid) {
		return userCheckpoints[uid] || 0
	}
	//挑战BOSS成功
	this.checkpointsSuccess = function(uid,level) {
		this.incrbyPlayerData(uid,"boss",1)
		userCheckpoints[uid]++
		var awardStr = checkpointsCfg[level].award
		if(awardStr){
			return this.addItemStr(uid,awardStr)
		}
		return []
	}
	//挑战BOSS失败
	this.checkpointsFail = function(uid,level,cb) {
	}
	//开始挑战关卡
	this.challengeCheckpoints = function(uid,verify,cb) {
		var level = 0
		async.waterfall([
			function(next) {
				//获取当前关卡
				level = self.getCheckpointsInfo(uid) + 1
				if(!checkpointsCfg[level])
					next("checkpointsCfg error "+level)
				else
					next()
			},
			function(next) {
				// 判断主角等级
				let lv = self.getLordLv(uid)
				if(lv < checkpointsCfg[level].lev_limit){
					next("等级限制")
				}else{
					next()
				}
			},
			function(next) {
				let fightInfo = self.getFightInfo(uid)
				if(!fightInfo){
					next("未准备")
					return
				}
			    let atkTeam = fightInfo.team
			    let seededNum = fightInfo.seededNum
			    let defTeam = []
			    let mon_list = JSON.parse(checkpointsCfg[level].mon_list)
			    for(let i = 0;i < 6;i++){
			    	if(mon_list[i]){
				    	let enemy = {id : mon_list[i],lv : checkpointsCfg[level].mobLevel,ad : checkpointsCfg[level].mobAd,star : checkpointsCfg[level].star}
				    	if(checkpointsCfg[level].equip){
				    		enemy["equip_1"] = checkpointsCfg[level].equip
				    		enemy["equip_2"] = checkpointsCfg[level].equip
				    		enemy["equip_3"] = checkpointsCfg[level].equip
				    		enemy["equip_4"] = checkpointsCfg[level].equip
				    	}
				    	defTeam.push(enemy)
			    	}else{
			    		defTeam.push(0)
			    	}
			    }
			    var winFlag = self.fightContorl.beginFight(atkTeam,defTeam,{seededNum : seededNum})
			    if(verify !== JSON.stringify(self.fightContorl.getFightRecord()[0])){
			    	self.verifyFaild(uid,verify,JSON.stringify(self.fightContorl.getFightRecord()[0]))
			    	next({"text":"战斗验证错误","fightRecord":self.fightContorl.getFightRecord()})
			    	return
			    }
			    if(winFlag){
			    	var awardList = self.checkpointsSuccess(uid,level)
			    	cb(true,{winFlag : winFlag,atkTeam:atkTeam,defTeam:defTeam,seededNum:seededNum,awardList:awardList})
			    	self.taskUpdate(uid,"checkpoints",1,level)
			    	self.updateSprintRank("checkpoint_rank",uid,1)
			    }else{
			    	cb(false,{winFlag : winFlag})
			    }
			}
		],function(err) {
			cb(false,err)
		})
	}
	//获取挂机奖励
	this.getOnhookAward = function(uid,power,cb) {
		self.getPlayerData(uid,"onhookLastTime",function(onhookLastTime) {
			var curTime = Date.now()
			var tmpTime = Math.floor((curTime - onhookLastTime) / 1000)
			// console.log("tmpTime ",tmpTime)
			if(tmpTime < 5){
				cb(false,"time is too short "+tmpTime)
			  	return
			}
			let level = self.getCheckpointsInfo(uid)
			if(!checkpointsCfg[level]){
				cb(false,"level config error "+level)
				return
			}
		  	self.incrbyPlayerData(uid,"onhookLastTime",tmpTime * 1000)
		  	var awardTime = tmpTime
		  	var maxTime = 43200 + VIP[self.players[uid]["vip"]]["onhookTime"]
		  	if(awardTime > maxTime){
		  		awardTime = maxTime
		  	}
		  	var on_hook_award = checkpointsCfg[level].on_hook_award
		  	// console.log("on_hook_award ",on_hook_award)
		  	var rate = (1+VIP[self.players[uid]["vip"]]["onhookAward"])
		  	if(self.players[uid]["highCard"])
		  		rate += activity_cfg["high_card_onhook"]["value"]
		  	rate = (awardTime * rate) / 60 
		  	// console.log("rate ",rate,"awardTime ",awardTime)
		  	self.taskUpdate(uid,"on_hook",1)
		  	var awardList = self.addItemStr(uid,on_hook_award,rate)
		  	var awardStr = self.gainOnhookItem(level,awardTime/60)
		  	if(awardStr)
		  		awardList = awardList.concat(self.addItemStr(uid,awardStr))
		  	cb(true,{allTime : tmpTime,awardTime : awardTime,awardList : awardList})
		})
	}
	//快速挂机奖励
	this.getQuickOnhookAward = function(uid,cb) {
		var level = 0
		var count = 0
		var maxCount = 4 + VIP[self.players[uid]["vip"]]["quick"]
		if(self.players[uid]["highCard"])
			maxCount += activity_cfg["high_card_quik"]["value"]
		async.waterfall([
			function(next) {
				//获取今日快速挂机次数
				self.getPlayerData(uid,"quick",function(curCount) {
					count  = Number(curCount) || 0
					if(count < maxCount)
						next()
					else
						next("快速挂机次数已满")
				})
			},
			function(next) {
				//获取挂机等级
				level = self.getCheckpointsInfo(uid)
				if(checkpointsCfg[level])
					next()
				else
					next("level config error "+level)
			},
			function(next) {
				//消耗元宝
				var needGold = count * 50
				if(needGold > 200)
					needGold = 200
				if(needGold){
					self.consumeItems(uid,"202:"+needGold,1,function(flag,err) {
						if(flag)
							next()
						else
							next(err)
					})
				}else{
					next()
				}
			},
			function(next) {
				self.incrbyPlayerData(uid,"quick",1)
			  	var on_hook_award = checkpointsCfg[level].on_hook_award
			  	var rate = (1+VIP[self.players[uid]["vip"]]["onhookAward"])
			  	if(self.players[uid]["highCard"])
			  		rate += activity_cfg["high_card_onhook"]["value"]
			  	rate = 120 * rate
			  	var awardList = self.addItemStr(uid,on_hook_award,rate)
			  	var awardStr = self.gainOnhookItem(level,120)
			  	if(awardStr)
			  		awardList = awardList.concat(self.addItemStr(uid,awardStr))
			  	self.taskUpdate(uid,"quick",1)
			  	cb(true,{awardList : awardList})
			}
		],function(err) {
			cb(false,err)
		})
	}
	//获取挂机道具
	this.gainOnhookItem = function(level,time) {
		var equipLv = checkpointsCfg[level]["equip"] || 0
		equipLv -= 2
		if(equipLv <= 1)
			equipLv = 1
		var count = Math.floor(time / 60)
		if(time % 60 / 60 > Math.random())
			count++
		if(count > 10)
			count = 10
		var list = []
		while(count > 0){
			if((count > 4) || (count > 3 && list.length == 0)){
				list.push(1)
				count -= 3
			}else{
				list.push(0)
				count -= 1
			}
		}
		var awardStr = ""
		for(var i = 0;i < list.length;i++){
			var lv = equipLv + list[i]
			if(i != 0)
				awardStr += "&"
			awardStr += equip_list[lv][Math.floor(equip_list[lv].length * Math.random())] + ":1"
		}
		return awardStr
	}
	//获取关卡任务数据
	this.getCTaskInfo = function(uid,cb) {
		self.getObjAll(uid,"ctask",function(data) {
			if(!data)
				cb(true,{})
			else
				cb(true,data)
		})
	}
	//获取关卡任务奖励
	this.getCTaskAward = function(uid,taskId,cb) {
		var lv = 0
		async.waterfall([function(next) {
			//获取当前关卡
			lv = self.getCheckpointsInfo(uid)
			if(!checkpoints_task[taskId] || checkpoints_task[taskId]["lv"] > lv)
				next("未完成领取条件")
			else
				next()
		},function(next) {
			self.getObj(uid,"ctask",taskId,function(data) {
				if(data){
					next("奖励已领取")
				}else{
					self.setObj(uid,"ctask",taskId,1)
					next()
				}
			})
		},function(next) {
			let award = checkpoints_task[taskId]["award"]
			var awardList = self.addItemStr(uid,award)
			cb(true,{awardList : awardList})
		}],function(err) {
			cb(false,err)
		})
	}
	//领取章节宝箱
	this.gainChapterAwardBox = function(uid,chapterId,cb) {
		if(!chapter[chapterId]){
			cb(false,"章节不存在")
			return
		}
		var level = self.getCheckpointsInfo(uid)
		if(level < chapter[chapterId]["level"]){
			cb(false,"未完成领取条件")
			return
		}
		self.getPlayerData(uid,"chapterBox_"+chapterId,function(data) {
			if(data){
				cb(false,"已领取")
				return
			}
			self.incrbyPlayerData(uid,"chapterBox_"+chapterId,1)
	    	var awardList = self.addItemStr(uid,chapter[chapterId]["awardBox"])
	    	cb(true,awardList)
		})
	}
}