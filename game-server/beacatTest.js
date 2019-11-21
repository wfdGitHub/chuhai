var fightContorlFun = require("./app/domian/fight/fightContorl.js")
var mobFun = require("./app/domian/entity/mob.js")
var heroFun = require("./app/domian/entity/hero.js")
var characters = require("./config/gameCfg/characters.json")
var atkTeamInfo = [{"d_e7":"{\"eId\":\"e7\",\"samsara\":0,\"quality\":1,\"wId\":\"017766f0-0b6b-11ea-bd36-27871161db7b\"}","exp":17971159,"d_e5":"{\"eId\":\"e5\",\"samsara\":0,\"quality\":1,\"wId\":\"0176cab0-0b6b-11ea-bd36-27871161db7b\"}","d_e6":"{\"eId\":\"e6\",\"samsara\":0,\"quality\":1,\"wId\":\"017718d0-0b6b-11ea-bd36-27871161db7b\"}","d_e9":"{\"eId\":\"e9\",\"samsara\":0,\"quality\":1,\"wId\":\"01782a40-0b6b-11ea-bd36-27871161db7b\"}","artifac_101":1,"artifact_atk":"artifac_101","d_e10":"{\"eId\":\"e10\",\"samsara\":0,\"quality\":1,\"wId\":\"01754410-0b6b-11ea-bd36-27871161db7b\"}","level":100,"d_e4":"{\"eId\":\"e4\",\"samsara\":0,\"quality\":1,\"wId\":\"01765580-0b6b-11ea-bd36-27871161db7b\"}","d_e8":"{\"eId\":\"e8\",\"samsara\":0,\"quality\":1,\"wId\":\"0177b510-0b6b-11ea-bd36-27871161db7b\"}","d_e1":"{\"eId\":\"e1\",\"samsara\":0,\"quality\":3,\"wId\":\"3eca4130-0b6b-11ea-bd36-27871161db7b\"}","characterId":10001,"d_e2":"{\"eId\":\"e2\",\"samsara\":0,\"quality\":1,\"wId\":\"0175b940-0b6b-11ea-bd36-27871161db7b\"}","d_e3":"{\"eId\":\"e3\",\"samsara\":0,\"quality\":1,\"wId\":\"01760760-0b6b-11ea-bd36-27871161db7b\"}"},{"characterId":10002,"level":8,"exp":340},{"characterId":10003,"level":1,"exp":0},{"characterId":10004,"level":1,"exp":0},{"characterId":10005,"level":1,"exp":0},{"characterId":12101,"strAp":1380,"agiAp":1280,"vitAp":1380,"phyAp":1380,"growth":1,"passives":"[30003]","id":"fca879c0-0b6a-11ea-bd36-27871161db7b","level":8,"exp":340,"birthday":1574236472156}]
var defTeamInfo = [{"characterId":13023,"level":60},{"characterId":13006,"level":80},{"characterId":13007,"level":80},{"characterId":13008,"level":80},{"characterId":13009,"level":80}]
var seed = 1574317442039
var list = [{"t":5050,"c":4,"s":10002},{"t":5200,"c":2,"s":10002},{"t":5500,"c":3,"s":10002},{"t":5800,"c":0,"s":10002},{"t":10200,"c":2,"s":10002},{"t":10800,"c":0,"s":10002},{"t":15800,"c":0,"s":10002},{"t":20800,"c":0,"s":10002},{"t":25800,"c":0,"s":10002}]
fightContorl = fightContorlFun()
var result = fightContorl.fighting(atkTeamInfo,defTeamInfo,seed,list)
console.log(result)


// var atkTeamInfo = [{"d_e7":"{\"eId\":\"e7\",\"samsara\":0,\"quality\":1,\"wId\":\"017766f0-0b6b-11ea-bd36-27871161db7b\"}","exp":17971159,"d_e5":"{\"eId\":\"e5\",\"samsara\":0,\"quality\":1,\"wId\":\"0176cab0-0b6b-11ea-bd36-27871161db7b\"}","d_e6":"{\"eId\":\"e6\",\"samsara\":0,\"quality\":1,\"wId\":\"017718d0-0b6b-11ea-bd36-27871161db7b\"}","d_e9":"{\"eId\":\"e9\",\"samsara\":0,\"quality\":1,\"wId\":\"01782a40-0b6b-11ea-bd36-27871161db7b\"}","artifac_101":1,"artifact_atk":"artifac_101","d_e10":"{\"eId\":\"e10\",\"samsara\":0,\"quality\":1,\"wId\":\"01754410-0b6b-11ea-bd36-27871161db7b\"}","level":100,"d_e4":"{\"eId\":\"e4\",\"samsara\":0,\"quality\":1,\"wId\":\"01765580-0b6b-11ea-bd36-27871161db7b\"}","d_e8":"{\"eId\":\"e8\",\"samsara\":0,\"quality\":1,\"wId\":\"0177b510-0b6b-11ea-bd36-27871161db7b\"}","d_e1":"{\"eId\":\"e1\",\"samsara\":0,\"quality\":3,\"wId\":\"3eca4130-0b6b-11ea-bd36-27871161db7b\"}","characterId":10001,"d_e2":"{\"eId\":\"e2\",\"samsara\":0,\"quality\":1,\"wId\":\"0175b940-0b6b-11ea-bd36-27871161db7b\"}","d_e3":"{\"eId\":\"e3\",\"samsara\":0,\"quality\":1,\"wId\":\"01760760-0b6b-11ea-bd36-27871161db7b\"}"},{"characterId":10002,"level":8,"exp":340},{"characterId":10003,"level":1,"exp":0},{"characterId":10004,"level":1,"exp":0},{"characterId":10005,"level":1,"exp":0},{"characterId":12101,"strAp":1380,"agiAp":1280,"vitAp":1380,"phyAp":1380,"growth":1,"passives":"[30003]","id":"fca879c0-0b6a-11ea-bd36-27871161db7b","level":8,"exp":340,"birthday":1574236472156}]
// var defTeamInfo = [{"characterId":13023,"level":60},{"characterId":13006,"level":80},{"characterId":13007,"level":80},{"characterId":13008,"level":80},{"characterId":13009,"level":80}]
// var seed = 1574317442039
// var list = [{"t":5050,"c":4,"s":10002},{"t":5200,"c":2,"s":10002},{"t":5500,"c":3,"s":10002},{"t":5800,"c":0,"s":10002},{"t":10200,"c":2,"s":10002},{"t":10800,"c":0,"s":10002},{"t":15800,"c":0,"s":10002},{"t":20800,"c":0,"s":10002},{"t":25800,"c":0,"s":10002}]

// var fightInfo = {};
// fightInfo["type"] = "replay";
// fightInfo["atkTeam"] = atkTeamInfo;
// fightInfo["defTeam"] = defTeamInfo;
// fightInfo["seededNum"] = seed;
// fightInfo["readList"] = list;
// gameTools.replayFight(fightInfo);