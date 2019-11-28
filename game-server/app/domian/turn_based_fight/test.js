var fightingFun = require("./fight/fighting.js")
var character = require("./entity/character.js")

var atkTeam = []
for(var i = 0;i < 6;i++){
	let info = {
		"maxHP" : Math.ceil(Math.random() * 1000),
		"atk" : Math.ceil(Math.random() * 300),
		"phyDef" : Math.ceil(Math.random() * 50),
		"magDef" : Math.ceil(Math.random() * 1000),
		"defaultSkill" : {type : "attack",name : "普攻",damageType : "phy",targetType : "enemy_horizontal_back"}
	}
	atkTeam.push(new character(info))
}
var defTeam = []
for(var i = 0;i < 6;i++){
	let info = {
		"maxHP" : Math.ceil(Math.random() * 1000),
		"atk" : 100,//Math.ceil(Math.random() * 300),
		"phyDef" : Math.ceil(Math.random() * 50),
		"magDef" : Math.ceil(Math.random() * 1000),
		"healRate" : 2000,
		"defaultSkill" : {type : "heal",name : "加血",healType : "atk",targetType : "team_minHp_1",mul : 0.1}
	}
	defTeam.push(new character(info))
}
var fighting = new fightingFun(atkTeam,defTeam,{seededNum : 1000})
fighting.nextRound()