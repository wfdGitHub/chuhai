let buffIds = ["invincibleSuck","disarm","dizzy","forbidden","silence","burn","poison","amplify","reduction","reduction_mag","recover","invincibleSuper","invincible","shield","banish","banAnger","immune","zhenshe","suoding","atkAdd","atkLess","chaofeng","armor","amplify_mag","amplify_phy","crit"]
let controlBuff = {"disarm" : true,"dizzy" : true,"silence" : true}
let damageBuff = {"burn" : true,"poison" : true}
let deBuffs = {"atkLess" : true,"banAnger" : true,"banish" : true,"chaofeng" : true,"disarm" : true,"dizzy" : true,"silence" : true,"burn" : true,"poison" : true,"forbidden" : true,"suoding" : true,"zhenshe" : true}
var buffList = {}
var fightRecord = require("../fight/fightRecord.js")
var buffFactory = function() {}
buffFactory.init = function(seeded,fighting) {
	for(var i = 0;i < buffIds.length;i++){
		buffList[buffIds[i]] = require("./buffs/"+buffIds[i]+".js")
	}
	this.seeded = seeded
	this.fighting = fighting
}
//创建BUFF
buffFactory.createBuff = function(releaser,character,otps) {
	var buffId = otps.buffId
	//判断控制buff抗性
	if(controlBuff[buffId]){
		if(character.control_buff_lowrate && this.seeded.random("控制buff抗性") < character.control_buff_lowrate)
			return
		if(character.buffs["invincibleSuper"])
			return
		if(character.buffs["immune"])
			return
		if(character.always_immune)
			return
		if(character.defcontrol && this.seeded.random("免控饰品") < character.defcontrol)
			return
	}
	//判断灼烧、中毒buff抗性
	if(damageBuff[buffId] && character.damage_buff_lowrate && this.seeded.random("伤害buff抗性") < character.damage_buff_lowrate)
		return
	if((buffId == "invincible" || buffId == "invincibleSuck") && character.buffs["burn"] && character.buffs["burn"].releaser.burn_not_invincible)
		return
	if(deBuffs[buffId] && character.loss_hp_debuff){
		if((character.attInfo.hp / character.attInfo.maxHP) > character.loss_hp_debuff){
			fightRecord.push({type:"show_tag",id:character.id,tag:"loss_hp_debuff"})
			var info = {type : "other_damage",value : Math.floor(character.attInfo.maxHP *  character.loss_hp_debuff),id : character.id,d_type:"phy"}
			info = character.onHit(character,info)
			fightRecord.push(info)
			return
		}
	}
	//判断伤害buff伤害降低
	if(damageBuff[buffId] && character.damage_buff_lowArg){
		otps.buffArg = otps.buffArg * (1 - character.damage_buff_lowArg)
	}
	if(buffList[buffId]){
		var buff
		if(character.buffs[buffId]){
			buff = character.buffs[buffId]
			buff.overlay(releaser,otps)
		}else{
			buff = new buffList[buffId](releaser,character,otps)
			character.addBuff(releaser,buff)
		}
		fightRecord.push({type : "createBuff",releaser : releaser.id,character : character.id,buffId : buffId,name : buff.name})
		if(buffId == "poison" && releaser.poison_add_forbidden){
			otps.duration = 1
			this.createBuff(releaser,character,Object.assign({},otps,{buffId : "forbidden"}))
		}
		if(buffId == "banAnger" && releaser.banAnger_add_forbidden){
			otps.duration = 1
			this.createBuff(releaser,character,Object.assign({},otps,{buffId : "forbidden"}))
		}
		if(buffId == "dizzy" && releaser.dizzy_clear_anger){
			fightRecord.push({type:"show_tag",id:character.id,tag:"dizzy_clear_anger"})
			character.lessAnger(character.curAnger)
		}
	}else{
		console.error("buffId 不存在",buffId)
		return false
	}
}
module.exports = buffFactory