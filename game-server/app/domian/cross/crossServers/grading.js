const grading_cfg = require("../../../../config/gameCfg/grading_cfg.json")
const grading_lv = require("../../../../config/gameCfg/grading_lv.json")
const grading_robot = require("../../../../config/gameCfg/grading_robot.json")
const boyCfg = require("../../../../config/sysCfg/boy.json")
const recruit_list = require("../../../../config/gameCfg/recruit_list.json")
const hero_list = recruit_list["hero_10"]["heroList"]
var util = require("../../../../util/util.js")
const async = require("async")
for(var i in grading_robot){
	grading_robot[i]["team"] = JSON.parse(grading_robot[i]["team"])
}
var grading_lv_list = []
for(var i in grading_lv){
	grading_lv_list.push(grading_lv[i]["score"])
}
//跨服段位赛
module.exports = function() {
	var self = this
	var curSeasonId = 0
	//每日刷新
	this.gradingDayUpdate = function() {
		self.redisDao.db.hget("cross:grading","dayStr",function(err,data) {
			if(!data || self.dayStr != data){
				self.redisDao.db.hset("cross:grading","dayStr",self.dayStr)
				self.redisDao.db.del("cross:grading:count")
				self.redisDao.db.hgetall("cross:grading",function(err,data) {
					if(!data){
						curSeasonId = 1
						self.newGrading()
					}else{
						curSeasonId = Number(data.seasonId)
						if(data["month"] != util.getMonth())
							self.settleGrading()
					}
				})
			}else{
				self.redisDao.db.hget("cross:grading","seasonId",function(err,data) {
					if(data){
						curSeasonId = Number(data)
					}
				})
			}
		})
	}
	//旧赛季结算
	this.settleGrading = function() {
		var newRankList = []
		async.waterfall([
			function(next) {
				self.redisDao.db.zrevrange(["cross:grading:realRank",0,-1,"WITHSCORES"],function(err,list) {
					var strList,sid,uid,score,glv
					var areaIds = []
					var uids = []
					for(var i = 0;i < list.length;i+=2){
						strList = list[i].split("|")
						sid = Number(strList[0])
						uid = Number(strList[1])
						score = Number(list[i+1])
						glv = util.binarySearchIndex(grading_lv_list,score)
						if(grading_lv[glv]["next_id"])
							newRankList.push(grading_lv[grading_lv[glv]["next_id"]]["score"],list[i])
						self.sendMailByUid(uid,"第"+curSeasonId+"赛季段位奖励","恭喜您在本赛季晋升到【"+grading_lv[glv]["name"]+"】段位，祝您新的赛季愈战愈勇!",grading_lv[glv]["season_award"])
						if(uids.length < 6){
							areaIds.push(sid)
							uids.push(uid)
							self.sendMailByUid(uid,"第"+curSeasonId+"赛季封神台奖励","亲爱的玩家，恭喜您历经磨难，通过考验，立命封神！您已进入第"+curSeasonId+"赛季封神台，供天下万民敬仰！",grading_cfg["award_"+uids.length]["value"])
						}
					}
					self.getPlayerInfoByUids(areaIds,uids,function(userInfos) {
						self.redisDao.db.hset("cross:grading:honor",curSeasonId,JSON.stringify(userInfos))
						next()
					})
				})
			},
			function(next) {
				//更新排名
				self.redisDao.db.del("cross:grading:realRank")
				var rankList = ["cross:grading:realRank"]
				rankList = rankList.concat(newRankList)
				self.redisDao.db.zadd(rankList)
				self.newGrading(newRankList)
			}
		],function(err) {
			console.error(err)
			self.newGrading()
		})
	}
	//新赛季开始
	this.newGrading = function(newRankList) {
		console.log("新赛季开始")
		self.redisDao.db.hset("cross:grading","month",util.getMonth())
		self.redisDao.db.hincrby("cross:grading","seasonId",1)
		curSeasonId++
		self.redisDao.db.del("cross:grading:rank")
		self.redisDao.db.del("cross:grading:award")
		self.redisDao.db.get("area:lastid",function(err,lastid) {
			var rankList = ["cross:grading:rank"]
			for(var i in grading_robot){
				for(var j = 0;j < 10;j++){
					rankList.push(Math.floor(grading_robot[i].score * (1 + j * 0.1)),(Math.floor(Math.random()*lastid) + 1)+"|"+i+"|"+j)
				}
			}
			if(newRankList)
				rankList = rankList.concat(newRankList)
			self.redisDao.db.zadd(rankList)
		})
	}
	//获取跨服段位赛数据
	this.getGradingData = function(crossUid,cb) {
		let uid = self.players[crossUid]["uid"]
		let sid = self.players[crossUid]["oriId"]
		let key = sid+"|"+uid
		let info = {
			score : 0,
			grading_award_list : [],
			count : 0,
			recordList : [],
			seasonId : curSeasonId,
			rank : -1
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
				self.redisDao.db.zrevrank(["cross:grading:realRank",key],function(err,rank) {
					if(rank != null)
						info.rank = Number(rank) + 1
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
		let sid = self.players[crossUid]["oriId"]
		let key = sid+"|"+uid
		this.consumeItems(crossUid,grading_cfg["item"]["value"]+":"+1,1,"使用挑战券",function(flag,err) {
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
		let sid = self.players[crossUid]["oriId"]
		let key = sid+"|"+uid
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
				self.redisDao.db.zrank(["cross:grading:rank",key],function(err,rank) {
					if(rank === null){
						rank = 0
					}
					let begin = rank + 1
					let end = rank + 5
					self.redisDao.db.zrange(["cross:grading:rank",begin,end,"WITHSCORES"],function(err,list) {
						for(let i = 0;i < list.length;i++){
							if(list[i] == key){
								list.splice(i,2)
								break
							}
						}
						let index = Math.floor(Math.random() * list.length / 2)
						if(!list[index*2]){
							next("匹配失败")
							self.redisDao.db.hincrby("cross:grading:count",key,-1)
							return
						}
						let strList = list[index*2].split("|")
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
								head : hero_list[Math.floor(Math.random() * hero_list.length)]
							}
							next()
						}else{
							//玩家
							self.getDefendTeam(targetUid,function(team) {
								defTeam = team
								self.getPlayerInfoByUid(targetUid,function(info) {
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
				if(winFlag){
					change = Math.floor(Math.random() * 15) + 20
					self.redisDao.db.zincrby(["cross:grading:rank",change,key],function(err,value) {
						curScore = value
						self.redisDao.db.zadd(["cross:grading:realRank",curScore,key])
						next()
					})
				}else{
					change = -Math.floor(Math.random() * 15) - 15
					self.redisDao.db.zincrby(["cross:grading:rank",change,key],function(err,value) {
						curScore = value
						if(value < 0){
							curScore = 0
							self.redisDao.db.zadd(["cross:grading:rank",0,key])
						}
						self.redisDao.db.zadd(["cross:grading:realRank",curScore,key])
						next()
					})
				}
			},
			function(next) {
				glv = util.binarySearchIndex(grading_lv_list,curScore)
				self.addItemStr(crossUid,grading_lv[glv]["challenge_award"],1,"跨服匹配",function(flag,awardList) {
					var info = {
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
					self.redisDao.db.zrevrank(["cross:grading:realRank",key],function(err,rank) {
						if(rank != null)
							info.rank = Number(rank) + 1
						cb(true,info)
					})
				})
			}
		],function(err) {
			cb(false,err)
		})
	}
	//领取段位奖励
	this.gainGradingAward = function(crossUid,glv,cb) {
		let uid = self.players[crossUid]["uid"]
		let sid = self.players[crossUid]["oriId"]
		let key = sid+"|"+uid
		if(!grading_lv[glv] || !grading_lv[glv]["grading_award"]){
			cb(false,"段位不存在")
			return
		}
		self.redisDao.db.zscore(["cross:grading:rank",key],function(err,score) {
			if(!score)
				score = 0
			if(score < grading_lv[glv]["score"]){
				cb(false,"未达到指定段位")
				return
			}
			self.redisDao.db.hget("cross:grading:award",key+"_"+glv,function(err,data) {
				if(data){
					cb(false,"已领取")
					return
				}
				self.redisDao.db.hset("cross:grading:award",key+"_"+glv,1)
				let awardList = self.addItemStr(crossUid,grading_lv[glv]["grading_award"],1,"段位奖励"+glv)
				cb(true,awardList)
			})
		})
	}
	//获取赛季荣誉榜
	this.getGradingHonor = function(seasonId,cb) {
		self.redisDao.db.hget("cross:grading:honor",seasonId,function(err,data) {
			cb(true,data)
		})
	}
}