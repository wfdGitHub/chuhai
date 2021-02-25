//攻击力增加BUFF
var buffBasic = require("../buffBasic.js")
var model = function(releaser,character,otps) {
	var buff = new buffBasic(releaser,character,otps)
	buff.name = "攻击加成"
	buff.intensify = true
	// console.log("角色"+buff.character.id+"增加伤害加成BUFF")
	buff.refreshType = "after"
	var id = 0
	var list = {}
	buff.clear = function() {
		// console.log("伤害加成BUFF消失")
	}
	buff.refresh = function() {
		for(var i in list){
			list[i].duration--
			if(list[i].duration <= 0){
				delete list[i]
			}
		}
	}
	buff.overlay = function(releaser,otps) {
		this.releaser = releaser
		if(otps.duration > this.duration)
			this.duration = otps.duration
		var value = otps.buffArg
		if(otps.buffArg < 1)
			value = Math.ceil(this.character.attInfo.atk * value)
		list[id++] = {duration : otps.duration,value : value}
		console.log("list",list)
	}
	buff.getValue = function() {
		var value = 0
		for(var i in list){
			value += list[i].value
		}
		return value
	}
	buff.overlay(releaser,otps)
	return buff
}
module.exports = model