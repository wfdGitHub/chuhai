var fightContorl = require("./fight/fightContorl.js")
var atkTeam = [{id:305120,"single_less_anger":10}]
var defTeam = [{id:305120},{id:305120},{id:305120}]

// // for(var i = 0;i < 6;i++){
// // 	// atkTeam[i].self_adds = {atk : 1}
// // 	// atkTeam[i].normal_later_buff = JSON.stringify({buffId : "invincibleSuper",buffArg : 0.2,duration : 10,buffRate : 1})
// // 	// atkTeam[i].skill_later_skill = JSON.stringify({type : "attack",mul : 1,damageType: "phy",targetType: "enemy_1",rate : 1})
// // 	// atkTeam[i].resurgence_team = 0.1
// // 	// atkTeam[i].died_use_skill = true
// // 	atkTeam[i] = fightContorl.getCharacterInfo(atkTeam[i])

// // 	// atkTeam[i].angerSkill.buffArg = 0.5
// // 	// atkTeam[i].angerSkill.duration = 1
// // 	// atkTeam[i].angerSkill.buffRate = 1
// // 	// defTeam[i].self_adds = {atk : 2}
// // 	// defTeam[i].skill_heal_amp = 1
// // 	defTeam[i] = fightContorl.getCharacterInfo(defTeam[i])
// // 	// defTeam[i].angerSkill.kill_amp = 2
// // }
// var list = fightContorl.beginFight(atkTeam,defTeam,{})
// console.log(fightContorl.getFightRecord())
// console.log(fightContorl.getTeamShowData(atkTeam)[0].getSimpleInfo())
// console.log(fightContorl.getTeamShowData([{id:105050,"equip_1" : 1,"team_atk_add" : 0.1}])[0].getSimpleInfo())