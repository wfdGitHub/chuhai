//法免盾BUFF
var buffBasic = require("../buffBasic.js")
var model = function(releaser,character,otps) {
	var buff = new buffBasic(releaser,character,otps)
	buff.name = "法免盾"
	buff.value = otps.buffArg
	buff.intensify = true
	buff.refreshType = "before_2"
	// console.log("角色"+buff.character.id+"增加护盾BUFF")
	buff.overlay = function(releaser,otps) {
		buff.releaser = releaser
		buff.duration = otps.duration
		buff.value = otps.buffArg
	}
	buff.getValue = function() {
		return 0
	}
	return buff
}
module.exports = model