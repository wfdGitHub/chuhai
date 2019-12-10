var formula = function(seeded) {
	this.seeded = seeded
}
//伤害计算
formula.prototype.calDamage = function(attacker, target, skill,lessAmp) {
	var info = {type : "damage",value : 0}
	var tmpAmplify = 0
	var tmpCrit = 0
	if(target.buffs["burn"] && skill.burn_att_change){
		var attInfo = skill.burn_att_change
		tmpAmplify += attInfo["tmpAmplify"] || 0
		tmpCrit += attInfo["crit"] || 0
	}
	//命中判断
	var hitRate = 10000 + attacker.getTotalAtt("hitRate") - target.getTotalAtt("dodgeRate")
	if(this.seeded.random("闪避判断") * 10000  > hitRate){
		info.miss = true
		return info
	}
	//暴击判断
	var crit = attacker.getTotalAtt("crit") - target.getTotalAtt("critDef") + tmpCrit
	if(attacker.must_crit || this.seeded.random("暴击判断") * 10000  < crit){
		info.crit = true
	}
	//伤害计算
	var atk = attacker.getTotalAtt("atk")
	var def = target.getTotalAtt(skill.damageType+"Def")
	var mul = 1 + attacker.getTotalAtt("amplify") - target.getTotalAtt("reduction") + tmpAmplify + attacker.skill_attack_amp
	info.value = Math.round((atk - def) * skill.mul * mul)
	if(lessAmp){
		info.value = Math.round(info.value * (1+lessAmp))
	}
	if(info.crit){
		info.value = Math.round(info.value * (1.5 + attacker.getTotalAtt("slay") - target.getTotalAtt("slayDef")))
	}
	//最小伤害
	if (info.value <= 1) {
		info.value = 1
	}
    return info
}
//治疗计算
formula.prototype.calHeal = function(character,target,value){//attacker,target,skill) {
	var info = {type : "heal",value : 0}
	//暴击判断
	if(this.seeded.random("治疗暴击判断") * 10000  < character.getTotalAtt("healRate")){
		info.crit = true
	}
	info.value = Math.round(value * (1 + target.getTotalAtt("healAdd")))
	if(info.crit){
		info.value = Math.round(info.value * 1.5)
	}
	//最小治疗
	if (info.value <= 1) {
		info.value = 1
	}
	return info
}
module.exports = formula