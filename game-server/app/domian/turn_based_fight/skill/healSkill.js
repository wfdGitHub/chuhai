//主动治疗技能
var model = function(otps,character) {
	this.type = "heal"
	this.character = character
	this.skillId = otps.skillId						//技能ID
	this.name = otps.name							//技能名称
	this.healType = otps.healType || "atk" 			//恢复类型（基数） atk  施法者攻击力   hp 被治疗者最大生命值
	this.targetType = otps.targetType || "team_1"	//目标类型  normal
	this.mul = otps.mul || 0						//技能系数
	this.anger_s = otps.anger_s || 0					//自身怒气恢复值
	this.anger_a = otps.anger_a || 0					//全队怒气恢复值
}

module.exports = model