var attackSkill = require("./attackSkill.js")
var model = function() {}
model.init = function(locator,formula) {
	this.locator = locator
	this.formula = formula
}
//创建技能
model.createSkill = function(otps,character) {
	switch(otps.type){
		case "attack":
			return new attackSkill(otps,character)
		case "heal":
			return false
		default:
			return false
	}
}
//使用技能
model.useSkill = function(skill) {
	switch(skill.type){
		case "attack":
			this.useAttackSkill(skill)
		case "heal":
			return false
		default:
			return false
	}
}
//伤害技能
model.useAttackSkill = function(skill) {
	//获取目标
	var targets = this.locator.getTargets(skill.character,skill)
	for(var i = 0;i < targets.length;i++){
		if(skill.character.died){
			break
		}
		let target = targets[i]
		//判断命中率
		let info = this.formula.calDamage(skill.character, target, skill)
		var str = skill.character.camp+skill.character.index+"使用"+skill.name+"攻击"+target.camp+target.index
		if(!info.miss){
			info = target.onHit(skill.character,info,skill)
			str += "  造成"+ info.value+"点伤害"
			if(info.crit){
				str +="(暴击)"
			}
			str += "   剩余"+target.hp+"/"+target.maxHP
			if(info.kill){
				str += "  击杀目标!"
			}
		}else{
			str += "  被闪避"
		}
		console.log(str)
	}
}
//恢复技能
model.useHealSkill = function(skill) {

}
module.exports = model