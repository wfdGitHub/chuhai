var daoConfig = require("../../config/daoConfig.json")
var redis = require("redis")
var RDS_PORT = daoConfig.redis.port
var RDS_HOST = daoConfig.redis.host
var RDS_PWD = daoConfig.redis.pwd
var RDS_OPTS = {auth_pass : RDS_PWD}
var redisDao = function() {
	this.db = false
}
redisDao.prototype.init = function(cb) {
	console.log("redisDao init")
	this.db = redis.createClient(RDS_PORT,RDS_HOST,RDS_OPTS)
	var self = this
	self.db.on("ready",function(res) {
		self.db.del("onlineNums")
		self.db.get("acc:lastid",function(err,data) {
			if(data === null){
		        console.log("\033[33m[INFO] DataBase check - acc:lastid\033[0m");
		        self.db.set("acc:lastid",10000);
		        self.db.set("user:lastid",101200);
		        self.db.set("guild:lastid",1000);
		        self.db.set("merge:lastid",10000);
    		}
		})
		cb()
	})
}
redisDao.prototype.multi = function(list,cb) {
 	multi = this.db.multi(list).exec(function (err, replies) {
 		cb(err,replies)
 	})
}
module.exports = {
	id : "redisDao",
	func : redisDao,
	init : "init",
	async : true,
	order : 0
}