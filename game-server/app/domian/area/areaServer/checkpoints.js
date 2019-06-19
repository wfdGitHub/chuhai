var checkpointsCfg = require("../../../../config/gameCfg/checkpoints.json")
module.exports = function() {
	//获取BOSS挑战信息
	this.getCheckpointsInfo = function(uid,cb) {
		this.getString(uid,"boss",function(data) {
			data = Number(data)
			if(!data){
				data = 0
			}
			cb(data)
		})
	}
	//挑战BOSS成功
	this.checkpointsSuccess = function(uid,level,cb) {
		console.log("checkpointsSuccess")
		this.stringinc(uid,"boss")
		var awardStr = checkpointsCfg[level].award
		console.log("award",awardStr)
		if(awardStr){
			this.addItemStr({uid : uid},awardStr)
		}
	}
	//挑战BOSS失败
	this.checkpointsFail = function(uid,level,cb) {
		console.log("checkpointsFail")
	}
	//挑战BOSS结果
	this.checkpointsResult = function(uid,result,level,cb) {
		if(result.result == "win"){
			this.checkpointsSuccess(uid,level,cb)
		}else{
			this.checkpointsFail(uid,level,cb)
		}
	}
	//开始挑战关卡
	this.challengeCheckpoints = function(uid,otps,cb) {
		var self = this
		self.getCheckpointsInfo(uid,function(level) {
			level += 1
		    if(!checkpointsCfg[level]){
		    	console.log("challengeCheckpoints level error : ",level)
		      	cb(false)
		      	return
		    }
		    if(!self.players[uid]){
		    	cb(false,"userInfo error")
		    	return
		    }
		    var atkTeam = self.players[uid].characters.concat()
		    var defTeam = [{characterId : checkpointsCfg[level].bossId,level : checkpointsCfg[level].bossLevel}]
		    if(checkpointsCfg[level].mon_list){
		      var monList = JSON.parse(checkpointsCfg[level].mon_list)
		      monList.forEach(function(characterId) {
		        defTeam.push({characterId,characterId,level : checkpointsCfg[level].mobLevel})
		      })
		    }
		    for(var i = 0;i < atkTeam.length;i++){
		    	atkTeam[i] = self.characterDeploy(atkTeam[i])
		    	if(!atkTeam[i]){
			    	cb(false,"characterInfo error")
			    	return
		    	}
		    }
		    for(var i = 0;i < defTeam.length;i++){
		    	defTeam[i] = self.characterDeploy(defTeam[i])
		    }
		    console.log(atkTeam,defTeam)
		    var result = self.fightContorl.fighting(atkTeam,defTeam,otps.seededNum,otps.readList)
		    if(result.verify === otps.verify || true){
		    	self.checkpointsResult(uid,result,level)
		    	cb(true,result)
		    }else{
		    	console.log(otps.verify,result.verify)
		    	cb(false,"verify fail")
		    }
		})
	}
}