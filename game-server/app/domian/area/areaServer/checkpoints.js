var checkpointsCfg = require("../../../../config/gameCfg/checkpoints.json")
var async = require("async")
module.exports = function() {
	//获取BOSS挑战信息
	this.getCheckpointsInfo = function(uid,cb) {
		this.getPlayerData(uid,"boss",function(data) {
			data = Number(data)
			if(!data){
				data = 0
			}
			cb(data)
		})
	}
	//挑战BOSS成功
	this.checkpointsSuccess = function(uid,level) {
		console.log("checkpointsSuccess")
		this.incrbyPlayerData(uid,"boss",1)
		var awardStr = checkpointsCfg[level].award
		if(awardStr){
			return this.addItemStr(uid,awardStr)
		}
		return []
	}
	//挑战BOSS失败
	this.checkpointsFail = function(uid,level,cb) {
		console.log("checkpointsFail")
	}
	//开始挑战关卡
	this.challengeCheckpoints = function(uid,cb) {
		var level = 0
		var self = this
		async.waterfall([
			function(next) {
				//获取当前关卡
				self.getCheckpointsInfo(uid,function(curLevel) {
					level = curLevel + 1
					if(!checkpointsCfg[level])
						next("checkpointsCfg error "+level)
					else
						next()
				})
			},
			function(next) {
				//todo 判断主角等级
				self.getLordLv(uid,function(lv) {
					if(lv < checkpointsCfg[level].lev_limit){
						next("等级限制")
					}else{
						next()
					}
				})
				
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
			    	defTeam.push({id : mon_list[i],lv : checkpointsCfg[level].mobLevel,ad : checkpointsCfg[level].mobAd,star : checkpointsCfg[level].star})
			    }
			    var winFlag = self.fightContorl.beginFight(atkTeam,defTeam,{seededNum : seededNum})
			    if(winFlag){
			    	var awardList = self.checkpointsSuccess(uid,level)
			    	cb(true,{atkTeam:atkTeam,defTeam:defTeam,seededNum:seededNum,awardList:awardList})
			    }else{
			    	cb(false,self.fightContorl.getFightRecord())
			    }
			}
		],function(err) {
			cb(false,err)
		})
	}
	//获取挂机奖励
	this.getOnhookAward = function(uid,power,cb) {
		var self = this
		self.getPlayerData(uid,"onhookLastTime",function(onhookLastTime) {
			var curTime = Date.now()
			var tmpTime = Math.floor((curTime - onhookLastTime) / 1000)
			// console.log("tmpTime ",tmpTime)
			if(tmpTime < 5){
				cb(false,"time is too short "+tmpTime)
			  	return
			}
			self.getCheckpointsInfo(uid,function(level) {
				if(!checkpointsCfg[level]){
					cb(false,"level config error "+level)
					return
				}
			  	self.incrbyPlayerData(uid,"onhookLastTime",tmpTime * 1000)
			  	var awardTime = tmpTime
			  	if(awardTime > 43200){
			  		awardTime = 43200
			  	}
			  	var on_hook_award = checkpointsCfg[level].on_hook_award
			  	// console.log("on_hook_award ",on_hook_award)
			  	var rate = (awardTime * power) / 60 
			  	// console.log("rate ",rate,"awardTime ",awardTime)
			  	self.addItemStr(uid,on_hook_award,rate)
			  	cb(true,{allTime : tmpTime,awardTime : awardTime})
			})
		})
	}
}