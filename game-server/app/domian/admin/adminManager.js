var url = require('url');
//后台功能
var model = function() {
	var self = {}
	var gets = {}
	var local = {}
	this.init = function (server,serverManager) {
		self = serverManager
		for(var key in gets){
			console.log("注册",key)
			server.get(key,gets[key])
		}
	}
	//清聊天记录
	gets["/clearChatRecord"] = function(req,res) {
		self.app.rpc.chat.chatRemote.clearChatRecord(null,function(){})
		res.send("SUCCESS")
	}
	//封账号
	gets["/freezeAcc"] = function(req,res) {
		var data = req.body
		var args = url.parse(req.url, true).query
		var uid = args.uid
		var value = args.value == 1 ? 1 : 0
		self.playerDao.getPlayerInfo({uid : uid},function(playerInfo) {
			if(playerInfo){
				self.accountDao.setAccountData({accId : playerInfo.accId,name:"freeze",value:value},function(flag,err) {})
				if(value != 0){
					local.kickUser(uid)
				}
			}else{
				next(null,{flag : false,err:"账号不存在"})
			}
		})
		res.send("SUCCESS")
	}
	//更新服务器名称
	gets["/updateAreaName"] = function(req,res) {
		var areaDeploy = self.app.get("areaDeploy")
		areaDeploy.updateAreaName()
		self.app.rpc.connector.connectorRemote.updateAreaName.toServer("*",null)
		res.send("SUCCESS")
	}
	//更新返利
	gets["/updateRebate"] = function(req,res) {
		self.app.rpc.area.areaRemote.updateRebate.toServer("*",null)
		res.send("SUCCESS")
	}
	//踢出玩家
	local.kickUser = function(uid) {
		self.playerDao.getPlayerAreaId(uid,function(flag,data) {
			if(flag){
				var areaId = self.areaDeploy.getFinalServer(data)
				var serverId = self.areaDeploy.getServer(areaId)
				if(serverId){
					self.app.rpc.area.areaRemote.kickUser.toServer(serverId,uid,null)
				}
			}
		})
	}
}
module.exports = new model()