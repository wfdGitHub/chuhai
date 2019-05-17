var logger = require('pomelo-logger').getLogger(__filename);
var formula = function() {}
//计算伤害
formula.prototype.calDamage = function(attacker, target, skill) {
	var atk = attacker.getTotalAttack();
	var def = target.getTotalDefence();
	var mul = Math.sqrt(Math.abs(atk-def))/5 + 1;
	
	//暴击计算
	var critFlag = false
	var crit = 0.05 + (Math.pow(attacker.critDef,2) / (attacker.critDef + target.critDef)) / 100
	if(Math.random() < crit){
		critFlag = true
	}
	var damage = Math.ceil(atk*skill.mul + skill.fixed)
	if (damage <= 0) {
		damage = 1;
	}
	if (damage > target.hp) {
		damage = target.hp;
		if(damage == 0){
			logger.error('attack a died character!!! %j', target);
		}
	}
	return {damage : Math.round(damage),crit : critFlag}
};
//获取攻击目标
formula.prototype.getAttackTarget = function(attacker,team,skill) {
	switch(skill.targetType){
		case 1:
			return this.getTargetNormal(attacker,team)
		break
		case 2:
			return this.getTargetMinHP(attacker,team)
		break
		case 3:
			return this.getTargetMaxHP(attacker,team)
		break
		default:
			return false
		break
	}
}
//获取普通目标
formula.prototype.getTargetNormal = function(attacker,team) {
	if(attacker.target && !attacker.target.died){
		return attacker.target
	}
	attacker.target = false
	var target = false
	var arr = []
	var allRand = 0
	for(var i = 0;i < team.length;i++){
		var rand = team[i].hp / team[i].maxHP
		allRand += rand
		arr.push(rand)
	}
	var rand = Math.random() * allRand
	var curRand = 0
	for(var i = 0;i < arr.length;i++){
		if(rand <= arr[i] + curRand){
			attacker.target = team[i]
		}
	}
	return attacker.target
}
//获取血量最少目标
formula.prototype.getTargetMinHP = function(attacker,team) {
	return false
}
//获取血量最多目标
formula.prototype.getTargetMaxHP = function(attacker,team) {
	return false
}
module.exports = {
	id : "formula",
	func : formula
}