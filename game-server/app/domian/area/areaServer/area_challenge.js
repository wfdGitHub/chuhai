//挑战山海
const area_challenge = require("../../../../config/gameCfg/area_challenge.json")
const main_name = "area_challenge"
for(var i = 1;i <= 3;i++)
	for(var j = 1;j <= 3;j++)
		area_challenge[i]["team"+j] = JSON.parse(area_challenge[i]["team"+j])
module.exports = function() {
	var self = this
	const baseInfo = {
		"bossId" : 0,
		"cur_chapter" : 1,
		"time" : 0
	}
	//获取挑战山海数据
	this.getAreaChallengeData = function(uid,cb) {
		self.getObjAll(uid,main_name,function(data) {
			for(var i in data)
				data[i] = Number(data[i])
			data = Object.assign({},baseInfo,data)
			if(!data.time){
				data.time = Date.now() + 172800000
				self.setObj(uid,main_name,"time",data.time)
			}else if(data.time < Date.now()){
				//挑战时间到
				data.cur_chapter++
				data.time = Date.now() + 172800000
				data.bossId = 0
				self.setObj(uid,main_name,"cur_chapter",data.cur_chapter)
				self.setObj(uid,main_name,"time",data.time)
				self.setObj(uid,main_name,"bossId",data.bossId)
			}
			cb(true,data)
		})
	}
	//挑战山海BOSS
	this.areaChallenge = function(uid,verify,cb) {
		self.getObjAll(uid,main_name,function(data) {
			for(var i in data)
				data[i] = Number(data[i])
			var bossId = Number(data["bossId"]) || 0
			bossId++
			var cur_chapter = data["cur_chapter"] || 1
			var time = data["time"]
			if(!area_challenge[cur_chapter]){
				cb(false,"已通关")
			}else if(!area_challenge[cur_chapter]["team"+bossId]){
				cb(false,"boss错误")
			}else{
			    var fightInfo = self.getFightInfo(uid)
			    if(!fightInfo){
			    	cb(false,"未准备")
			    	return
			    }
			    if(verify !== JSON.stringify(self.fightContorl.getFightRecord()[0])){
			    	next("战斗验证错误")
			    	return
			    }
			   	var atkTeam = fightInfo.team
			   	var seededNum = fightInfo.seededNum
			   	var defTeam = area_challenge[cur_chapter]["team"+bossId]
			    var winFlag = self.fightContorl.beginFight(atkTeam,defTeam,{seededNum : seededNum})
			    if(winFlag){
		    		var info = {}
		    		info.awardList = self.addItemStr(uid,area_challenge[cur_chapter]["award"+bossId])
		    		if(bossId >= 3){
		    			cur_chapter++
		    			bossId = 0
		    			time += 172800000
		    			self.setObj(uid,main_name,"cur_chapter",cur_chapter)
		    			self.setObj(uid,main_name,"time",time)
		    		}
		    		self.setObj(uid,main_name,"bossId",bossId)
	    			info.winFlag = winFlag
	    			info.bossId = bossId
	    			info.cur_chapter = cur_chapter
	    			info.time = time
		    		cb(true,info)
			    }else{
			    	cb(false,self.fightContorl.getFightRecord())
			    }
			}
		})
	}
}