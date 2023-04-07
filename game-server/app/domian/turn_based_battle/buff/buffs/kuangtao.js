//狂涛BUFF
var buff_entity = require("../buff_entity.js")
var model = function(fighting,character,buffId,buffCfg) {
	//继承父类属性
	buff_entity.call(this,fighting,character,buffId,buffCfg)
}
//继承父类方法
model.prototype = Object.create(buff_entity.prototype) //继承父类方法
//获取加成属性
model.prototype.getAttInfo = function(name) {
	if(this.attKeys[name] !== undefined){
		var hpRate = this.character.attInfo.hp / this.character.attInfo.maxHP
		switch(name){
			case "amp":
				return this.list[0].buff.mul * hpRate
			break
			case "hit":
				return this.list[0].buff.mul * hpRate
			break
			case "crit":
				if(hpRate < 0.3)
					return 0.5
			break
		}
	}
	return 0
}
module.exports = model