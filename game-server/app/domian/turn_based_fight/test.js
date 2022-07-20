var fightContorl = require("./fight/fightContorl.js")
var fightRecord = require("./fight/fightRecord.js")
var mysterious_realm = require("../../../config/gameCfg/mysterious_realm.json")
var area_challenge = require("../../../config/gameCfg/area_challenge.json")
var arena_rank = require("../../../config/gameCfg/arena_rank.json")
var checkpoints = require("../../../config/gameCfg/checkpoints.json")
var ttttower_level = require("../../../config/gameCfg/ttttower_level.json")
// var list = fightContorl.beginFight(atkTeam,defTeam,{})
// fightRecord.explain()
// console.log(fightContorl.getFightRecord())
// console.log(fightContorl.getTeamShowData(atkTeam)[0].getSimpleInfo())
// console.log(fightContorl.getTeamShowData([{id:105050,"equip_1" : 1,"team_atk_add" : 0.1}])[0].getSimpleInfo())
// 封神战力
// var ce
// for(var i in area_challenge){
// 	ce = fightContorl.getTeamCE(JSON.parse(area_challenge[i]["team1"]))
// 	console.log(ce)
// 	ce = fightContorl.getTeamCE(JSON.parse(area_challenge[i]["team2"]))
// 	console.log(ce)
// 	ce = fightContorl.getTeamCE(JSON.parse(area_challenge[i]["team3"]))
// 	console.log(ce)
// }
//竞技场战力
// for(var i in arena_rank){
// 	var ce = fightContorl.getTeamCE(JSON.parse(arena_rank[i]["team"]))
// 	console.log(ce)
// }
//通天塔战力
// for(var i in ttttower_level){
// 	var ce = fightContorl.getTeamCE(JSON.parse(ttttower_level[i]["defTeam"]))
// 	console.log(ce)
// }
// var atkTeam = [{id:305010,star:10,artifact:25,kill_clear_buff:1},{id:305010,star:9,artifact:25,kill_clear_buff:1},{id:305010,star:9,artifact:25,kill_clear_buff:1}]
// var defTeam = [{id:305020,star:10,artifact:25},{id:305020,star:10,artifact:25},{id:305020,star:10,artifact:25},{id:305020,star:10,artifact:25}]
// var atkTeam = [{id:305010,star:10},{id:305010,star:10}]
// var defTeam = [{id:205020,star:5,died_buff_s:"{\"buffId\":\"invincible\",\"duration\":1,\"buffRate\":0.5,\"buff_tg\":\"friend_minHp_1\"}"},{id:205020,star:5,died_buff_s:"{\"buffId\":\"invincible\",\"duration\":1,\"buff_tg\":\"friend_minHp_1\",\"buffRate\":0.5}"}]
// var atkTeam = [{"id":"405080"},0,0,0,0,0]
// var defTeam = [{"id":"405080","first_buff":JSON.stringify({"buffId":"banish","duration":1})},0,0,0,0,0]
// var list = fightContorl.beginFight(atkTeam,defTeam,{})
// fightRecord.explain()
// var winFlag = fightContorl.beginFight(atkTeam,defTeam,{seededNum : Date.now()})
// console.log(atkTeam)
// var list = fightContorl.getFightRecord()
// var overInfo = list[list.length - 1]
// for(var i = 0;i<atkTeam.length;i++){
// 	if(atkTeam[i] && overInfo.atkTeam[i]){
// 		atkTeam[i]["surplus_health"] = overInfo.atkTeam[i].hp/overInfo.atkTeam[i].maxHP
// 	}
// }
// console.log(atkTeam)
// fightContorl.beginFight(atkTeam,defTeam,{seededNum : Date.now()})
// list = fightContorl.getFightRecord()
// overInfo = list[list.length - 1]
// for(var i = 0;i<atkTeam.length;i++){
// 	if(atkTeam[i] && overInfo.atkTeam[i]){
// 		atkTeam[i]["surplus_health"] = overInfo.atkTeam[i].hp/overInfo.atkTeam[i].maxHP
// 	}
// }
// console.log(atkTeam)
// fightContorl.beginFight(atkTeam,defTeam,{seededNum : Date.now()})
// list = fightContorl.getFightRecord()
// overInfo = list[list.length - 1]
// for(var i = 0;i<atkTeam.length;i++){
// 	if(atkTeam[i] && overInfo.atkTeam[i]){
// 		atkTeam[i]["surplus_health"] = overInfo.atkTeam[i].hp/overInfo.atkTeam[i].maxHP
// 	}
// }
// console.log(atkTeam)
// var buff = {"buffId":"ghost","buff_tg":"team_self","buffArg":5,"duration":3,"buffRate":1}
var seededNum = Date.now()
var atkTeam = [{"id":405040},0,0,0,0,0,{"power1":{"id":500100,"star":1,"lv":1,"ad":1},"power2":{"id":500800,"star":1,"lv":1,"ad":1},"manualModel":1}]
var defTeam = [{"id":405040,"self_maxHP_add":10},0,0,0,0,0,{"power1":{"id":500800,"star":1,"lv":1,"ad":1}}]
var fighting = fightContorl.beginFight(atkTeam,defTeam,{"video":false,"seededNum":seededNum})

// // var fighting = fightContorl.manualFight(atkTeam,defTeam,{})
// // console.log(fighting.keepRun())
// for(var i = 0;i < 8;i++){
// 	fighting.keepRun()
// }
// console.log(fighting.atkMasterSkill(0))
// var data = fighting.keepRun()
// while(data){
// 	data = fighting.keepRun()
// // }
// var list1 = fightRecord.getList()
// var overInfo1 = list1[list1.length-1]
// fightRecord.explain()
// [
//   { belong: 'atk', runCount: 8, index: 0 },
//   { belong: 'atk', runCount: 17, index: 0 }
// ]
// var fighting = fightContorl.beginFight(atkTeam,defTeam,{"video":true,"masterSkills":overInfo1.masterSkills,"seededNum":seededNum})
// var list2 = fightRecord.getList()
// var overInfo2 = list2[list2.length-1]
// // console.log(overInfo2)
// fightRecord.explain()

// var d1 = JSON.stringify(list1)
// var d2 = JSON.stringify(list2)
// if(d1 != d2){
// 	console.log("校验错误",d1.length,d2.length)
// 	console.log(d1)
// 	console.log(d2)
// 	for(var i = 0;i < list1.length;i++){
// 		var l1 = JSON.stringify(list1[i])
// 		var l2 = JSON.stringify(list2[i])
// 		if(l1 != l2){
// 			console.log("错误发生在第"+i+"项")
// 			console.log(l1)
// 			console.log(l2)
// 			var str = ""
// 			for(var j = 0;j < l1.length;j++){
// 				if(l1[j] != l2[j]){
// 					console.log("详细信息:第"+j+"行",str)
// 					return
// 				}else{
// 					str += l1[j]
// 				}
// 			}
// 			break
// 		}
// 	}
// }else{
// 	console.log("校验成功")
// }