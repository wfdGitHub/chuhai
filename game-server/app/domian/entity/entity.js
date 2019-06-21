var heroFun = require("./hero.js")
var mobFun = require("./mob.js")
var partnerFun = require("./partner.js")
module.exports = function(otps) {
	switch(otps.characterType){
		case "hero":
			return new heroFun(otps)
		break
		case "partner":
			return new partnerFun(otps)
		break
		case "mob":
			return new mobFun(otps)
		break
		default:
			return new mobFun(otps)
	}
}