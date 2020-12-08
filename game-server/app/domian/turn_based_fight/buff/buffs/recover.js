//恢复
var fightRecord = require("../../fight/fightRecord.js")
var buffBasic = require("../buffBasic.js")
var model = function(releaser,character,otps) {
	var buff = new buffBasic(releaser,character,otps)
	// console.log("角色"+buff.character.id+"被燃烧!!!!!!")
	buff.refreshType = "before"
	buff.intensify = true
	buff.name = "恢复"
	buff.value = Math.floor(buff.buffArg * releaser.getTotalAtt("atk"))
	buff.refresh = function() {
		var info = {type : "recoverHeal",value : buff.value}
		info = buff.character.onHeal(buff.releaser,info)
		fightRecord.push(info)
	}
	buff.clear = function() {
		if(!buff.character.died && buff.releaser.recover_maxHp && buff.releaser.realm == buff.character.realm){
			var recordInfo =  buff.character.onHeal(buff.releaser,{type : "heal",value : buff.character.getTotalAtt("maxHP") * buff.releaser.recover_maxHp})
			recordInfo.type = "self_heal"
			fightRecord.push(recordInfo)
		}
	}
	return buff
}
module.exports = model