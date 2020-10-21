//牧野之战 3V3
const muye_cfg = require("../../../../config/gameCfg/muye_cfg.json")
const muye_rank = require("../../../../config/gameCfg/muye_rank.json")
const async = require("async")
var util = require("../../../../util/util.js")
module.exports = function() {
	var self = this
	var challenge_time = {}
	var honorList = []			//荣誉榜
	var likeUsers = {}			//点赞记录
	var likeMap = {}			//点赞榜
	var winCounts = {}			//挑战次数
	var monthStr = ""			//月份记录
	//初始化
	this.muyeInit = function() {
		self.redisDao.db.hgetall("cross:muye",function(err,data) {
			monthStr = data.month
			if(data.honorList)
				honorList = JSON.parse(data.honorList)
			if(monthStr != util.getMonth())
				self.settleMuye()
		})
		self.redisDao.db.hgetall("cross:muye:likeMap",function(err,data) {
			if(data){
				for(var i in data){
					data[i] = Number(data[i])
				}
				likeMap = data
			}
			next()
		})
		self.redisDao.db.hgetall("cross:muye:winCounts",function(err,data) {
			if(data){
				for(var i in data){
					data[i] = Number(data[i])
				}
				winCounts = data
			}
			next()
		})
	}
	//每日刷新
	this.muyeDayUpdate = function() {
		likeUsers = {}
		winCounts = {}
		self.redisDao.db.del("cross:muye:winCounts")
		self.redisDao.db.del("cross:muye:boxs")
		challenge_time = {}
		if(monthStr != util.getMonth())
			self.settleMuye()
	}
	//旧赛季结算
	this.settleMuye = function() {
		console.log("牧野新赛季开启")
		async.waterfall([
			function(next) {
				self.redisDao.db.zrevrange(["cross:muye:rank",0,-1,"WITHSCORES"],function(err,list) {
					var strList,sid,uid,score,glv
					var areaIds = []
					var uids = []
					var newRankList = ["cross:muye:rank"]
					var rankIndex = 0
					for(var i = 0;i < list.length;i+=2){
						strList = list[i].split("|")
						sid = Number(strList[0])
						uid = Number(strList[1])
						score = Number(list[i+1])
						if(uid > 10000){
							if(i > muye_rank[rankIndex]["count"])
								rankIndex++
							newRankList.push(0,list[i])
							self.sendMailByUid(uid,muye_rank[rankIndex]["title"],muye_rank[rankIndex]["text"],muye_rank[rankIndex]["award"])
							if(uids.length < 3){
								areaIds.push(sid)
								uids.push(uid)
							}
						}
					}
					self.redisDao.db.zadd(newRankList)
					self.getPlayerInfoByUids(areaIds,uids,function(userInfos) {
						honorList = userInfos
						self.redisDao.db.hset("cross:muye","honorList",JSON.stringify(userInfos))
						next()
					})
				})
			},
			function(next) {
				self.newMuye()
			}
		],function(err) {
			console.error(err)
			self.newMuye()
		})
	}
	//新赛季开始
	this.newMuye = function() {
		likeUsers = {}
		winCounts = {}
		self.redisDao.db.del("cross:muye:winCounts")
		self.redisDao.db.del("cross:muye:boxs")
		console.log("新赛季开始")
		self.redisDao.db.hset("cross:muye","month",util.getMonth())
	}
	//获取数据
	this.getMuyeData = function(crossUid,cb) {
		crossUid = crossUid.split("|area")[0]
		var info = {}
		info.winCount = winCounts[crossUid] || 0
		info.honorList = honorList
		info.likeList = []
		for(var i = 0;i < honorList.length;i++){
			info.likeList.push(likeMap[honorList[i]["crossUid"]] || 0)
		}
		info.likeInfo = likeUsers[crossUid] || {}
		var multiList = []
		for(var i = 1;i <= 3;i++){
			multiList.push(["hget","cross:muye:boxs",crossUid+"_"+i])
		}
		self.redisDao.multi(multiList,function(err,list) {
			info.boxs = list
			self.redisDao.db.hget("cross:muye:fightTeam",crossUid,function(err,data) {
				info.hIds = data
				cb(true,info)
			})
		})
	}
	//设置阵容
	this.muyeSetFightTeams = function(crossUid,hIds,cb) {
		crossUid = crossUid.split("|area")[0]
		if(hIds.length != 18){
			cb(false,"hids error")
			return
		}
		var hIdMap = {}
		for(var i = 0;i < hIds.length;i++){
			if(hIds[i] && hIdMap[hIds[i]]){
				cb(false,"hid重复 " +hIds[i])
				return
			}
			hIdMap[hIds[i]] = 1
		}
		var uid = crossUid.split("|")[1]
    	self.heroDao.getHeroList(uid,hIds,function(flag,list) {
			var heroMap = {}
			for(var i = 0;i < list.length;i++){
				if(list[i]){
					if(heroMap[list[i].id]){
						cb(false,"英雄重复 " +list[i].id)
						return
					}
					heroMap[list[i].id] = 1
				}
			}
			self.redisDao.db.hset("cross:muye:fightTeam",crossUid,JSON.stringify(hIds))
    		cb(true)
    	})
	}
	//匹配战斗
	this.matchMuye = function(crossUid,cb) {
		var uid = self.players[crossUid]["uid"]
		var sid = self.players[crossUid]["areaId"]
		crossUid = crossUid.split("|area")[0]
		if(!challenge_time[crossUid]){
			challenge_time[crossUid] = 0
		}
		// if((new Date()).getHours() < 18){
		// 	cb(false,"18:00之后可挑战")
		// 	return
		// }
		// if(Date.now() - challenge_time[crossUid] < 3600000){
		// 	cb(false,"挑战冷却中")
		// 	return
		// }
		var atkTeams = []
		var defTeams = []
		var wins = []
		var seededNums = []
		var targetcrossUid,targetInfo,targetSid,targetUid,targetScore
		async.waterfall([
			function(next) {
				//获取攻方阵容
				console.log(1111)
				self.heroDao.getFightBook(uid,function(flag,bookInfo) {
					self.redisDao.db.hget("cross:muye:fightTeam",crossUid,function(err,data) {
						if(err || !data){
							cb(false,"未设置阵容")
							return
						}
						var hIds = JSON.parse(data)
				    	self.heroDao.getHeroList(uid,hIds,function(flag,heros) {
				    		console.log(flag,heros)
				    		atkTeams[0] = heros.splice(0,6)
				    		atkTeams[0][6] = bookInfo
				    		atkTeams[1] = heros.splice(0,6)
				    		atkTeams[1][6] = bookInfo
				    		atkTeams[2] = heros.splice(0,6)
				    		atkTeams[2][6] = bookInfo
				    		next()
				    	})
					})
				})
			},
			function(next) {
				console.log(2222)
				self.redisDao.db.zrank(["cross:muye:rank",crossUid],function(err,rank) {
					if(rank === null){
						rank = 0
					}
					var begin = rank -3
					var end = rank + 3
					if(begin < 0)
						begin = 0
					self.redisDao.db.zrange(["cross:muye:rank",begin,end,"WITHSCORES"],function(err,list) {
						for(var i = 0;i < list.length;i++){
							if(list[i] == crossUid){
								list.splice(i,2)
								break
							}
						}
						if(!list.length){
							//初始机器人
							defTeams = [].concat(muye_cfg["default_team1"]["value"],muye_cfg["default_team2"]["value"],muye_cfg["default_team3"]["value"])
							next()
						}else{
							var index = Math.floor(Math.random() * list.length / 2)
							if(!list[index*2]){
								next("匹配失败")
								return
							}
							targetcrossUid = list[index*2]
							var strList = targetcrossUid.split("|")
							targetSid = Number(strList[0])
							targetUid = Number(strList[1])
							targetScore = Number(list[index*2 + 1])
							self.heroDao.getFightBook(targetUid,function(flag,bookInfo) {
								self.redisDao.db.hget("cross:muye:fightTeam",targetcrossUid,function(err,data) {
									var hIds = JSON.parse(data)
							    	self.heroDao.getHeroList(uid,hIds,function(flag,heros) {
							    		console.log(flag,heros)
							    		defTeams[0] = heros.splice(0,6)
							    		defTeams[0][6] = bookInfo
							    		defTeams[1] = heros.splice(0,6)
							    		defTeams[1][6] = bookInfo
							    		defTeams[2] = heros.splice(0,6)
							    		defTeams[2][6] = bookInfo
										self.getPlayerInfoByUid(targetUid,function(info) {
											targetInfo = info
											next()
										})
							    	})
								})
							})
						}
					})
				})
			},
			function(next) {
				console.log(3333)
				//开始战斗
				console.log("开始战斗",atkTeams,defTeams)
				for(var i = 0;i < 3;i++){
					seededNums[i] = Date.now()
					wins[i] = self.fightContorl.beginFight(atkTeams[i],defTeams[i],{seededNum : seededNums[i]})
				}
				next()
			},
			function(next) {
				console.log(4444)
				var change = 0
				for(var i = 0;i < 3;i++){
					if(wins[i])
						change += 10
					else
						change -= 10
				}
				if(change < -10)
					change = -10
				else{
					if(!winCounts[crossUid])
						winCounts[crossUid] = 0
					winCounts[crossUid]++
					self.redisDao.db.hincrby("cross:muye:winCounts",crossUid,1)	
				}
				self.addItemStr(crossUid,"201:100",1,"牧野之战",function(flag,awardList) {
					self.redisDao.db.zincrby(["cross:muye:rank",change,crossUid],function(err,curScore) {
						var info = {
							atkTeams : atkTeams,
							defTeams : defTeams,
							seededNums : seededNums,
							wins : wins,
							change : change,
							curScore : curScore,
							awardList : awardList,
							targetScore : targetScore,
							targetInfo : targetInfo,
							time : Date.now()
						}
						self.redisDao.db.rpush("cross:muye:record:"+crossUid,JSON.stringify(info),function(err,num) {
							if(num > 3){
								self.redisDao.db.ltrim("cross:muye:record:"+crossUid,-3,-1)
							}
						})
						cb(true,info)
					})
				})
			}
		],function(err) {
			cb(false,err)
		})
	}
	//获取历史挑战记录
	this.getMuyeRecord = function(crossUid,cb) {
		crossUid = crossUid.split("|area")[0]
		self.redisDao.db.lrange("cross:muye:record:"+crossUid,0,-1,function(err,list) {
			cb(true,list)
		})
	}
	//点赞
	this.muyeLike = function(crossUid,index,cb) {
		var newCrossUid = crossUid.split("|area")[0]
		if(!likeUsers[newCrossUid])
			likeUsers[newCrossUid] = {}
		if(!honorList[index]){
			cb(false,"目标不存在")
			return
		}
		if(likeUsers[newCrossUid][index]){
			cb(false,"今日已点赞")
			return
		}
		likeUsers[newCrossUid][index] = 1
		var target = honorList[index]["crossUid"]
		if(!likeMap[target])
			likeMap[target] = 0
		likeMap[target]++
		self.redisDao.db.hincrby("cross:peak:likeMap",target,1)
		self.addItemStr(crossUid,"201:20000",1,"牧野点赞",function(flag,data) {
			cb(flag,data)
		})
	}
	//领取宝箱
	this.gainMuyeBox = function(crossUid,index,cb) {
		var newCrossUid = crossUid.split("|area")[0]
		if(!Number.isInteger(index) || index <= 0 || !muye_cfg["box_"+index]){
			cb(false,"宝箱不存在")
			return
		}
		if(!winCounts[crossUid] || winCounts[crossUid] < index){
			cb(false,"条件不足")
			return
		}
		self.redisDao.db.hget("cross:muye:boxs",newCrossUid+"_"+index,function(err,data) {
			if(data){
				cb(false,"今日已领取")
				return
			}
			self.redisDao.db.hset("cross:muye:boxs",newCrossUid+"_"+index,1)
			self.addItemStr(crossUid,muye_cfg["box_"+index]["value"],1,"牧野宝箱"+index,function(flag,awardList) {
				cb(true,awardList)
			})
		})
	}
}