//buff管理器
const fightCfg = require("../fightCfg.js")
const buff_entity = require("./buff_entity.js")
const normal_buff = require("./buffs/normal_buff.js")
var model = function() {
	this.buffCfg = fightCfg.getCfg("buffs")
	this.buffList = {}
	for(var buffId in this.buffCfg){
		if(this.buffCfg[buffId].normal)
			this.buffList[buffId] = normal_buff
		else
			this.buffList[buffId] = require("./buffs/"+buffId+".js")
	}
}
//创建BUFF判断概率
model.prototype.createBuffWithRate = function(skill,character,buff) {
	buff = Object.assign({},buff)
	var rate = buff.rate
	//存在指定BUFF概率增加
	if(skill.target_buff_key && character.buffs[skill.target_buff_key])
		rate += Number(skill.target_buff_rate) || 0
	//控制状态下回合数增加
	if(skill.control_dur && character.checkControl())
		buff.duration += skill.control_dur
	if(rate > 1 || character.fighting.random(buff.buffId) < rate)
		this.createBuff(skill.character,character,buff)
	else if(buff.elseBuff){
		this.createBuff(skill.character,character,buff.elseBuff)
	}
}
//创建BUFF
model.prototype.createBuff = function(attacker,character,buff) {
	var buffId = buff.buffId
	if(!this.buffList[buffId]){
		console.error("!!!!!!!!!!buffId not find")
		this.buffList[buffId] = normal_buff
		this.buffCfg[buffId] = {}
	}
	//控制BUFF在行动后回合数加1
	if(this.buffCfg[buffId].control){
		if(character.buffs["totem_friend_amp"])
			return
		//控制BUFF已行动则回合数加一
		if(character.isAction)
			buff.duration++
	}
	if(!character.buffs[buffId])
		character.createBuff(new this.buffList[buffId](character.fighting,character,buffId,this.buffCfg[buffId]))
	character.addBuff(attacker,buff)
}
module.exports = model