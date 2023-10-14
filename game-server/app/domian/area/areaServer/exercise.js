//沙盘演武
const default_cfg = require("../../../../config/gameCfg/default_cfg.json")
const exercise_award = require("../../../../config/gameCfg/exercise_award.json")
const exercise_team = require("../../../../config/gameCfg/exercise_team.json")
const recruit_list = require("../../../../config/gameCfg/recruit_list.json")
const heros = require("../../../../config/gameCfg/heros.json")
const lord_lv = require("../../../../config/gameCfg/lord_lv.json")
const main_name = "exercise"
var async = require("async")
var exercise_list = []
for(var i in exercise_team){
	var tmpList = []
	for(var j = 0;j <= 4;j++){
		tmpList.push(JSON.parse(exercise_team[i]["team"+j]))
	}
	exercise_list.push(tmpList)
}
const assistList = recruit_list["hero_10"]["heroList"]
module.exports = function() {
	var self = this
	var teamId = -1
	var assistId = -1
	//每日更新
	this.exerciseDayUpdate = function() {
		var day = Math.ceil((new Date()-new Date(new Date().getFullYear().toString()))/86400000)
		teamId = day % exercise_list.length
		assistId = assistList[day % assistList.length]
	}
	//玩家每日更新
	this.exerciseUserUpdate = function(uid) {
		self.delObjAll(uid,main_name)
	}
	//获取演武数据
	this.getExerciseData = function(uid,cb) {
		self.getObjAll(uid,main_name,function(data) {
			if(!data){
				data = {
					"index" : -1
				}
			}else{
				for(var i in data){
					data[i] = Number(data[i])
				}
			}
			data.teamId = teamId
			data.assistId = assistId
			self.getObjAll(uid,"exercise_pass",function(pass_data) {
				Object.assign(data,pass_data)
				cb(true,data)
			})
		})
	}
	//选择难度
	this.exerciseChooseLevel = function(uid,level,cb) {
		if(teamId == -1){
			cb(false)
			return
		}
		if(level !== 1 && level !== 2 && level !== 3){
			cb(false,"level error "+level)
			return
		}
		self.getObj(uid,main_name,"level",function(data) {
			if(data){
				cb(false,"已选择难度")
			}else{
				self.setObj(uid,main_name,"level",level)
				cb(true)
			}
		})
	}
	//开始挑战
	this.exerciseChallenge = function(uid,team,index,cb) {
		if(!team || team.length != 6){
			cb(false,"team error "+team)
			return
		}
		if(!Number.isInteger(index) || index < 0 || index > 4){
			cb(false,"index error "+index)
			return
		}
		for(var i = 0;i < team.length;i++){
			if(team[i] && !heros[team[i]]){
				cb(false,"heroId error ",team[i])
				return
			}
		}
		var level = -1
		async.waterfall([
			function(next) {
				//检查挑战次数
				self.getObj(uid,main_name,"play",function(data) {
					play = Number(data) || 0
					if(play >= 2){
						next("挑战次数已用完")
						return
					}
					next()
				})
			},
			function(next) {
				//获取难度等级
				self.getObj(uid,main_name,"level",function(data) {
					if(!data){
						next("未选择难度")
						return
					}
					level = Number(data)
					next()
				})
			},
			function(next) {
				//检查前置关卡
				self.getObj(uid,main_name,"index",function(data) {
					if(!data){
						data = -1
					}
					data = Number(data)
					if(index != data + 1){
						next("当前第"+data+"关,不能挑战第"+index+"关")
						return
					}
					next()
				})
			},
			function(next) {
				//战斗
				var atkTeam = self.standardTeam(uid,team,"main",300)
				var defTeam = self.standardTeam(uid,exercise_list[teamId][index],"exercise_"+level,300)
				var seededNum = Date.now()
				var winFlag = self.fightContorl.beginFight(atkTeam,defTeam,{seededNum : seededNum})
				if(winFlag){
					self.setObj(uid,main_name,"index",index)
					self.delObj(uid,main_name,"play")
					if(index == 4){
						self.setObj(uid,"exercise_pass","pass_"+level,1)
						self.taskUpdate(uid,"exercise",1)
					}
				}else{
					self.incrbyObj(uid,main_name,"play",1)
				}
				cb(true,{winFlag:winFlag,atkTeam:atkTeam,defTeam:defTeam,seededNum:seededNum})
			}
		],function(err) {
			cb(false,err)
		})
	}
	//领取宝箱
	this.exerciseAward = function(uid,index,cb) {
		if(!Number.isInteger(index) || index < 0 || index > 4){
			cb(false,"index error "+index)
			return
		}
		var lv = self.getLordLv(uid)
		self.getHMObj(uid,main_name,["index","level","award_"+index],function(list) {
			var curIndex = -1
			if(list[0] !== undefined)
				curIndex = Number(list[0])
			var level = Number(list[1]) || 0
			var gain = Number(list[2]) || false
			if(!level){
				cb(false,"未选择难度")
				return
			}
			if(index > curIndex){
				cb(false,"未通关此关卡")
				return
			}
			if(gain){
				cb(false,"该宝箱已领取")
				return
			}
			self.setObj(uid,main_name,"award_"+index,1)
			var awardList = self.addItemStr(uid,"201:"+lord_lv[lv]["normal"],exercise_award["award_"+index]["lv_"+level],"演武宝箱"+index)
			cb(true,awardList)
		})
	}
	//复活
	this.exerciseResurgence = function(uid,cb) {
		self.consumeItems(uid,default_cfg["default_pc_1"]["value"],1,"演武复活",function(flag,err) {
			if(flag){
				self.incrbyObj(uid,main_name,"play",-1)
				cb(true)
			}
			else{
				cb(flag,err)
			}
		})
	}
}