//新服冲榜
const sprint_rank = require("../../../../config/gameCfg/sprint_rank.json")
const main_name = "sprint_rank"
const rankTime = 86400000
var rankCount = 0
var rank_type_day = {}
for(var i in sprint_rank){
	rankCount++
	rank_type_day[sprint_rank[i]["rank_type"]] = rankCount
}
module.exports = function() {
	var self = this
	var timer = 0
	var curRankIndex = -1
	var curTime = 0
	//初始化
	this.initSprintRank = function() {
		if(!self.newArea){
			return
		}
		self.getAreaObjAll(main_name,function(data) {
			if(!data){
				data = {
					index : 1,
					time : Date.now() + rankTime
				}
				self.setAreaHMObj(main_name,data)
				curRankIndex = data.index
				curTime = data.time
				timer = setTimeout(self.settleSprintRank.bind(this),rankTime)
			}else{
				curRankIndex = Number(data.index)
				curTime = Number(data.time)
				if(curRankIndex != -1){
					var dt = Number(data.time) - Date.now()
					timer = setTimeout(self.settleSprintRank.bind(this),dt)
				}
			}
		})
	}
	//结算排行榜
	this.settleSprintRank = function() {
		clearTimeout(timer)
		if(sprint_rank[curRankIndex]){
			self.zrangewithscore(sprint_rank[curRankIndex]["rank_type"],0,-1,function(list) {
				var rank = 0
				for(var i = list.length - 2;i >= 0;i -= 2){
					rank++
					var score = Math.floor(list[i+1])
					var text = "亲爱的玩家您好，恭喜您在"+sprint_rank[curRankIndex]["name"]+"活动中获得"+rank+"名，获得排名奖励，祝您游戏愉快！"
					if(rank >= 11){
						rank = 11
						text = "亲爱的玩家您好，恭喜您在"+sprint_rank[curRankIndex]["name"]+"活动中获得参与奖励，祝您游戏愉快！"
					}
	                var award = ""
	                award = sprint_rank[curRankIndex]["rank_"+rank]
	                if(score >= sprint_rank[curRankIndex]["extra_premise"]){
	                    award += "&"+sprint_rank[curRankIndex]["extra_award"]
	                }
					self.sendMail(list[i],sprint_rank[curRankIndex]["name"]+"奖励",text,award)
				}
				curRankIndex++
				var data = {}
				if(sprint_rank[curRankIndex]){
					data = {
						index : curRankIndex,
						time : Date.now() + rankTime
					}
					curRankIndex = data.index
					curTime = data.time
					self.setAreaHMObj(main_name,data)
					timer = setTimeout(self.settleSprintRank.bind(this),rankTime)
				}else{
					data = {
						index : -1,
						time : 0
					}
					curRankIndex = data.index
					curTime = data.time
					self.setAreaHMObj(main_name,data)
				}
				var notify = {
					type : "settleSprintRank",
					curRankIndex : data.index,
					time : data.time
				}
				self.sendAllUser(notify)
			})
		}
	}
	//获取当前排行榜
	this.getSprintRank = function(cb) {
		if(sprint_rank[curRankIndex]){
			self.zrangewithscore(sprint_rank[curRankIndex]["rank_type"],-10,-1,function(list) {
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
					info.curRankIndex = curRankIndex
					info.time = curTime
					cb(true,info)
				})
			})
		}else{
			cb(false,"已结束")
			return
		}
	}
	//更新排行榜
	this.updateSprintRank = function(type,uid,value) {
		if(curRankIndex != -1 && rank_type_day[type] >= rank_type_day[sprint_rank[curRankIndex]["rank_type"]]){
			self.incrbyZset(type,uid,value)
		}
	}
}