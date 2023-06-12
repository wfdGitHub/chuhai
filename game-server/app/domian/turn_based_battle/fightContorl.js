'use strict';
//战斗控制器
const fightingEntity = require("./fighting.js")
const buffManager = require("./buff/buffManager.js")
const fightCfg = require("./fightCfg.js")
var model = function(){
	fightCfg.init()
	this.heros = fightCfg.getCfg("heros")
	this.hero_talents = fightCfg.getCfg("hero_talents")
	this.managers = {}
	this.managers["buffManager"] = new buffManager()
}
//开始战斗
model.prototype.beginFight = function(atkTeam,defTeam,otps) {
	var fighting = new fightingEntity(atkTeam,defTeam,otps,this.managers)
	fighting.fightBegin()
	this.fighting = fighting
	return fighting.getNormalWin()
}
//手动战斗
//录像战斗
//获取校验数据
model.prototype.getVerifyInfo = function() {
	
}
//获取团队数据
model.prototype.getTeamData = function(atkTeam,defTeam,otps) {
	var fighting = new fightingEntity(atkTeam,defTeam,otps,this.managers)
	return fighting.getTeamData()
}
module.exports = new model()