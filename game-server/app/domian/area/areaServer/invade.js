//魔物入侵
const util = require("../../../../util/util.js")
const invade = require("../../../../config/gameCfg/invade.json")
const oneDayTime = 86400000
const oneHourTime = 3600000
const main_name = "invade"
module.exports = function() {
	var self = this
	var local = {}
	var state = -1 				//当前阶段
	var timeList = []			//时间列表
	var mon_values = {}			//魔物剩余数量
	//玩法初始化
	this.invadeInit = function() {
		local.resetTime()
		self.getAreaObj(main_name,"state",function(data) {
			state = Number(data) || 0
		})
	}
	//刷新
	this.invadeUpdate = function() {
		if(state == -1)
			return
		if(Date.now() > timeList[state])
			local.nextState()
	}
	//重置时间
	local.resetTime = function() {
		timeList = []
		timeList[0] = util.getZeroTime() + invade["begin"]["value"] * oneHourTime
		timeList[1] = timeList[0] + invade["duration"]["value"] * oneHourTime
		timeList[2] = util.getZeroTime() + oneDayTime
		for(var i = 1; i <= 5;i++)
			mon_values[i] = invade["max_value"]["level_"+i]
	}
	//状态改变
	local.nextState = function() {
		state = (state+1) % 3
		self.setAreaObj(main_name,"state",state)
		switch(state){
			case 0:
				//进入初始状态
				local.invadeReset()
			break
			case 1:
				//开始挑战
				local.invadeChallengeStage()
			break
		}
	}
	//进入初始状态
	local.invadeReset = function() {
		self.delAreaObjAll(main_name)
		self.setAreaObj(main_name,"state",0)
		local.resetTime()
	}
	//进入挑战状态
	local.invadeChallengeStage = function(argument) {
		var notify = {
			type : "invadeChallengeStage",
			state : state,
			time : timeList[state]
		}
		self.sendAllUser(notify)
	}
	//进入结束阶段
	local.invadeEnd = function() {
		var notify = {
			type : "invadeEnd",
			state : state,
			time : timeList[state]
		}
		self.sendAllUser(notify)
	}
	//更新怪物列表
	local.lessMonValue = function(level,count) {
		if(mon_values[level] !== undefined){
			mon_values[level] -= count
			mon_values[level] = Math.max(mon_values[level],0)
		}
	}
	//获取魔物列表
	local.getMonList = function(uid) {
		var tmpMap = {"1":0,"2":0,"3":0,"4":0,"5":0}
		var list = []
		for(var count = 0; count < 3;count++){
			var rand = Math.random() * 10000
			var lv = 1
			for(var i = 5;i >= 1;i--){
				if((mon_values[i] - tmpMap[i]) > 0 && rand > invade["weight"]["level_"+i]){
					lv = i
					break
				}
			}
			tmpMap[lv]++
			list.push(lv)
		}
		for(var i = 0;i < 3;i++)
			list[i] = {team : invade["mon_team"]["level_"+list[i]],lv : list[i]}
		self.setAreaObj(main_name,"mon_"+uid,JSON.stringify(list))
		return list
	}
	//获取数据
	this.getInvadeData = function(uid,cb) {
		var info = {
			state : state,
			time : timeList[state],
			mon_values : mon_values
		}
		self.getAreaHMObj(main_name,["count_"+uid,"ref_"+uid,"mon_"+uid],function(list) {
			info.count = Number(list[0]) || 0
			info.ref = Number(list[1]) || 0
			if(list[2])
				info.monList = JSON.parse(list[2])
			else
				info.monList = local.getMonList(uid)
			cb(true,info)
		})
	}
	//刷新入侵怪
	this.refreshInvade = function(uid,cb) {
		if(state !== 1){
			cb(false,"当前不在挑战阶段")
			return
		}
		self.getAreaObj(main_name,"ref_"+uid,function(ref) {
			ref  = Number(ref) || 0
			if(ref >= invade["ref_count"]["value"]){
				cb(false,"刷新次数已满")
				return
			}
			self.consumeItems(uid,invade["ref_pc"]["value"],1,"入侵刷新",function(flag,err) {
				if(!flag){
					cb(flag,err)
					return
				}
				self.incrbyAreaObj(main_name,"ref_"+uid,1)
				var monList = local.getMonList(uid)
				cb(true,{monList:monList,mon_values:mon_values})
			})
		})
	}
	//挑战入侵怪
	this.challengeInvade = function(uid,index,cb) {
		if(state !== 1){
			cb(false,"当前不在挑战阶段")
			return
		}
		if(!Number.isInteger(index) || index > 2 || index < 0){
			cb(false,"index error "+index)
			return
		}
		var fightInfo = self.getFightInfo(uid,"invade")
		if(!fightInfo){
			cb(false,"未准备")
			return
		}
		self.getAreaHMObj(main_name,["count_"+uid,"mon_"+uid],function(list) {
			var count = Number(list[0]) || 0
			if(count >= invade["count"]["value"]){
				cb(false,"挑战次数已满")
				return
			}
			if(!list[1]){
				cb(false,"未获取怪物列表")
				return
			}
			self.incrbyAreaObj(main_name,"count_"+uid,1)
			list[1] = JSON.parse(list[1])
			var monLv = list[1][index]["lv"]
			var defTeam = JSON.parse(list[1][index]["team"])
		    var atkTeam = fightInfo.team
		    var seededNum = fightInfo.seededNum
		    defTeam = self.standardTeam(uid,defTeam,"invade_"+monLv)
	    	var winFlag = self.fightContorl.beginFight(atkTeam,defTeam,{seededNum : seededNum})
	    	if(winFlag){
	    		local.lessMonValue(monLv,1)
	    		var awardList = self.addItemStr(uid,invade["base_award"]["level_"+monLv],1,"魔物入侵")
	    		awardList = awardList.concat(self.openChestStr(uid,invade["chest"]["level_"+monLv]))
	    		var monList = local.getMonList(uid)
	    		cb(true,{winFlag:winFlag,awardList:awardList,monList:monList,mon_values:mon_values})
	    	}else{
	    		var awardList = self.addItemStr(uid,invade["faild_award"]["level_"+monLv],1,"魔物入侵")
	    		cb(true,{winFlag:winFlag,awardList:awardList})
	    	}
		})
	}
}