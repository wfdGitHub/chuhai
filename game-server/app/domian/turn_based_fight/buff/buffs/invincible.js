//无敌BUFF低配版  可清除
var buffBasic = require("../buffBasic.js")
var model = function(releaser,character,otps) {
	var buff = new buffBasic(releaser,character,otps)
	buff.name = "无敌"
	buff.overlay = function(releaser,otps) {
		buff.releaser = releaser
		buff.duration = otps.duration
	}
	return buff
}
module.exports = model