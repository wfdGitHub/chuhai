//燃烧
var fightRecord = require("../../fight/fightRecord.js")
var buffBasic = require("../buffBasic.js")
var model = function(releaser,character,otps) {
	var buff = new buffBasic(releaser,character,otps)
	buff.debuff = true
	// console.log("角色"+buff.character.id+"被燃烧!!!!!!")
	buff.refreshType = "before"
	buff.name = "燃烧"
	buff.damage = Math.floor(buff.buffArg * (releaser.getTotalAtt("atk") - character.getTotalAtt("magDef")))
	if(releaser.burn_duration)
		buff.duration += releaser.burn_duration
	buff.refresh = function() {
		if(buff.character.died)
			return
		let info = {type : "burnDamage",value : buff.damage ,id : buff.character.id,d_type:"mag"}
		info = buff.character.onHit(buff.releaser,info)
		fightRecord.push(info)
	}
	buff.clear = function() {
		// console.log(buff.character.id+"燃烧结束")
	}
	return buff
}
module.exports = model