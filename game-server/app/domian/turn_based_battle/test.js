'use strict';
var fightContorl = require("./fightContorl.js")
var buff1 = JSON.stringify({"buffId":"petrify","targetType":"skill_targets","duration":2,"rate":1})
var atkTeam = [0,0,0,{"id":106010,"s3_star":5,"s1_lv":1000,"skillTalents":{}},0]
var defTeam = [{"id":104010,"skillTalents":{"buff1":buff1}},0,{"id":204010},0,{"id":204010}]
console.log(fightContorl.beginFight(atkTeam,defTeam,{}))
// fightContorl.fighting.fightRecord.explain()