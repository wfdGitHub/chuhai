//战力
var async = require("async")
var main_name = "CE"
module.exports = function() {
	var self = this
	var userTeams = {}
	var usersCes = {}
	var userTeamMaps = {}
	//加载角色阵容数据
	this.CELoad = function(uid) {
		self.heroDao.getFightTeam(self.areaId,uid,function(flag,data) {
			if(flag && data){
				userTeams[uid] = data
				userTeamMaps[uid] = {}
				for(var i = 0;i < data.length;i++){
					if(data[i])
						userTeamMaps[uid][data[i].hId] = i
				}
				usersCes[uid] = self.fightContorl.getTeamCE(data)
			}
		})
	}
	//移除角色阵容数据
	this.CEUnload = function(uid) {
		delete userTeams[uid]
		delete usersCes[uid]
		delete userTeamMaps[uid]
	}
	//修改英雄属性
	this.incrbyCEInfo = function(uid,hId,name,value) {
		if(userTeams[uid] && userTeamMaps[uid] && userTeamMaps[uid][hId]){
			let index = userTeamMaps[uid][hId]
			userTeams[uid][index][name] += value
			this.updateCE(uid)
		}
	}
	//设置英雄属性
	this.setCEInfo = function(uid,hId,name,value) {
		if(userTeams[uid] && userTeamMaps[uid] && userTeamMaps[uid][hId]){
			let index = userTeamMaps[uid][hId]
			userTeams[uid][index][name] = value
			this.updateCE(uid)
		}
	}
	//删除英雄属性
	this.delCEInfo = function(uid,hId,name) {
		if(userTeams[uid] && userTeamMaps[uid] && userTeamMaps[uid][hId]){
			let index = userTeamMaps[uid][hId]
			delete userTeams[uid][index][name]
			this.updateCE(uid)
		}
	}
	//更新战力
	this.updateCE = function(uid) {
		if(userTeams[uid]){
			let oldCE = usersCes[uid]
			let newCE = self.fightContorl.getTeamCE(userTeams[uid])
			usersCes[uid] = newCE
			if(oldCE != newCE){
				let notify = {
					type : "updateCE",
					oldCE : oldCE,
					newCE : newCE
				}
				this.sendToUser(uid,notify)
				self.taskUpdate(uid,"totalCe",newCE)
			}
		}
	}
	//获取战力
	this.getCE = function(uid) {
		return usersCes[uid]
	}
	//获取阵容
	this.getUserTeam = function(uid) {
		return userTeams[uid]
	}
}