const grading_cfg = require("../../../../config/gameCfg/grading_cfg.json")
const grading_lv = require("../../../../config/gameCfg/grading_lv.json")
const grading_robot = require("../../../../config/gameCfg/grading_robot.json")
var boyCfg = require("../../../../config/sysCfg/boy.json")
var util = require("../../../../util/util.js")
const async = require("async")
for(var i in grading_robot){
	grading_robot[i]["team"] = JSON.parse(grading_robot[i]["team"])
}
var grading_lv_list = []
for(var i in grading_lv){
	grading_lv_list.push(grading_lv[i]["socre"])
}
//跨服段位赛
module.exports = function() {
	var self = this
	//每日刷新
	this.gradingDayUpdate = function() {
		self.redisDao.db.del("cross:grading:count")
		self.redisDao.db.hget("cross:grading","month",function(err,data) {
			// if(data != util.getMonth())
				self.newGrading()
		})
	}
	//新赛季开始
	this.newGrading = function() {
		console.log("新赛季开始")
		self.redisDao.db.hset("cross:grading","month",util.getMonth())
		self.redisDao.db.del("cross:grading:rank")
		self.redisDao.db.del("cross:grading:award")
		self.redisDao.db.get("area:lastid",function(err,lastid) {
			var rankList = ["cross:grading:rank"]
			for(var i in grading_robot){
				rankList.push(grading_robot[i].score,(Math.floor(Math.random()*lastid) + 1)+"."+i)
			}
			self.redisDao.db.zadd(rankList)
		})
	}
	//获取跨服段位赛数据
	this.getGradingData = function(crossUid,cb) {
		let uid = self.players[crossUid]["uid"]
		let sid = self.players[crossUid]["areaId"]
		let key = sid+"."+uid
		let info = {
			score : 0,
			grading_award_list : [],
			count : 0,
			recordList : []
		}
		async.waterfall([
			function(next) {
				self.redisDao.db.zscore(["cross:grading:rank",key],function(err,score) {
					if(score)
						info.score = Number(score)
					next()
				})
			},
			function(next) {
				self.redisDao.db.hget("cross:grading:count",key,function(err,count) {
					if(count)
						info.count = Number(count)
					next()
				})
			},
			function(next) {
				let list = []
				for(let glv in grading_lv)
					list.push(key+"_"+glv)
				self.redisDao.db.hmget("cross:grading:award",list,function(err,data) {
					info.grading_award_list = data
					next()
				})
			},
			function(next) {
				self.redisDao.db.lrange("cross:grading:record:"+key,0,-1,function(err,list) {
					info.recordList = list
					cb(true,info)
				})
			}
		],function(err) {
			cb(false,err)
		})
	}
	//使用挑战券
	this.useGradingItem = function(crossUid,cb) {
		let uid = self.players[crossUid]["uid"]
		let sid = self.players[crossUid]["areaId"]
		let key = sid+"."+uid
		this.consumeItems(crossUid,grading_cfg["item"]["value"]+":"+1,1,function(flag,err) {
			if(flag){
				self.redisDao.db.hincrby("cross:grading:count",key,-1,function(err,value) {
					cb(true,value)
				})
			}else{
				cb(false,err)
			}
		})
	}
	//匹配战斗
	this.matchGrading = function(crossUid,cb) {
		let uid = self.players[crossUid]["uid"]
		let sid = self.players[crossUid]["areaId"]
		let key = sid+"."+uid
		let glv,targetSid,targetUid,targetScore,targetInfo,atkTeam,defTeam,curScore,change,seededNum,winFlag
		async.waterfall([
			function(next) {
				self.redisDao.db.hget("cross:grading:count",key,function(err,count) {
					if(count && count >= grading_cfg["free_count"]["value"])
						next("次数不足")
					else{
						self.redisDao.db.hincrby("cross:grading:count",key,1)
						next()
					}
				})
			},
			function(next) {
				self.redisDao.db.zrevrank(["cross:grading:rank",key],function(err,rank) {
					if(rank === null){
						rank = 0
					}
					let begin = rank > 5 ? rank - 5 : 0
					let end = rank + 5
					self.redisDao.db.zrevrange(["cross:grading:rank",begin,end,"WITHSCORES"],function(err,list) {
						for(let i = 0;i < list.length;i++){
							if(list[i] == key){
								list.splice(i,2)
								break
							}
						}
						let index = Math.floor(Math.random() * list.length / 2)
						let strList = list[index*2].split(".")
						targetSid = Number(strList[0])
						targetUid = Number(strList[1])
						targetScore = Number(list[index*2 + 1])
						atkTeam = self.userTeam(crossUid)
						if(targetUid < 10000){
							//机器人
							defTeam = grading_robot[targetUid]["team"]
							targetInfo = {
								uid : targetUid,
								name : boyCfg[Math.floor(Math.random() * boyCfg.length)],
								head : ""
							}
							next()
						}else{
							//玩家
							self.getDefendTeam(targetSid,targetUid,function(team) {
								defTeam = team
								self.getPlayerInfoByUid(targetSid,targetUid,function(info) {
									targetInfo = info
									next()
								})
							})
						}
					})
				})
			},
			function(next) {
				seededNum = Date.now()
				winFlag = self.fightContorl.beginFight(atkTeam,defTeam,{seededNum : seededNum})
				if(winFlag || true){
					change = grading_cfg["win_score"]["value"]
					self.redisDao.db.zincrby(["cross:grading:rank",grading_cfg["win_score"]["value"],key],function(err,value) {
						curScore = value
						next()
					})
				}else{
					change = grading_cfg["lose_score"]["value"]
					self.redisDao.db.zincrby(["cross:grading:rank",grading_cfg["lose_score"]["value"],key],function(err,value) {
						curScore = value
						if(value < 0){
							curScore = 0
							self.redisDao.db.zadd(["cross:grading:rank",0,key])
						}
						next()
					})
				}
			},
			function(next) {
				glv = util.binarySearchIndex(grading_lv_list,curScore)
				let awardList = self.addItemStr(crossUid,grading_lv[glv]["challenge_award"],1)
				let info = {
					winFlag : winFlag,
					atkTeam : atkTeam,
					defTeam : defTeam,
					seededNum : seededNum,
					awardList : awardList,
					targetSid : targetSid,
					targetScore : targetScore,
					targetInfo : targetInfo,
					curScore : curScore,
					time : Date.now(),
					change : change
				}
				self.redisDao.db.rpush("cross:grading:record:"+key,JSON.stringify(info),function(err,num) {
					if(num > 10){
						self.redisDao.db.ltrim("cross:grading:record:"+key,-10,-1)
					}
				})
				cb(true,info)
			}
		],function(err) {
			cb(false,err)
		})
	}
	//领取段位奖励
	this.gainGradingAward = function(crossUid,glv,cb) {
		let uid = self.players[crossUid]["uid"]
		let sid = self.players[crossUid]["areaId"]
		let key = sid+"."+uid
		if(!grading_lv[glv] || !grading_lv[glv]["grading_award"]){
			cb(false,"段位不存在")
			return
		}
		self.redisDao.db.hget("cross:grading:award",key+"_"+glv,function(err,data) {
			if(data){
				cb(false,"已领取")
				return
			}
			self.redisDao.db.hset("cross:grading:award",key+"_"+glv,1)
			let awardList = self.addItemStr(crossUid,grading_lv[glv]["grading_award"],1)
			cb(true,awardList)
		})
	}
}