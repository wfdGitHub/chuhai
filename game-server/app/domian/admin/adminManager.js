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
	gets["/test"] = function(req,res) {
	    var ipAddress;
	    var forwardedIpsStr = req.headers['X-Forwarded-For'];//判断是否有反向代理头信息
	    console.log("forwardedIpsStr",forwardedIpsStr)
	    if (forwardedIpsStr) {//如果有，则将头信息中第一个地址拿出，该地址就是真实的客户端IP；
	        var forwardedIps = forwardedIpsStr.split(',');
	        ipAddress = forwardedIps[0];
	    }
	    if (!ipAddress) {//如果没有直接获取IP；
	        ipAddress = req.connection.remoteAddress;
	    }
	    res.send("SUCCESS")
	}
	gets["/playerLogin"] = function(req,res) {
		var data = req.body
		var args = url.parse(req.url, true).query
		var unionid = args.unionid
		var serverId = self.areaDeploy.getServer(1)
		self.app.rpc.connector.connectorRemote.playerLogin.toServer(serverId,unionid,function(flag,data) {
			res.send({flag:flag,data:data})
		})
	}
	gets["/playerLeave"] = function(req,res) {
		var data = req.body
		var args = url.parse(req.url, true).query
		var accId = args.accId
		var uid = args.uid
		var name = args.name
		var ip = local.getClientIp(req)
		var serverId = self.areaDeploy.getServer(1)
		self.app.rpc.connector.connectorRemote.playerLeave.toServer(serverId,accId,uid,name,ip,function(flag,data) {
			res.send({flag:flag,data:data})
		})
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
	//获取IP
	local.getClientIp = function(req) {
	    var ipAddress;
	    var forwardedIpsStr = req.headers['X-Forwarded-For'];//判断是否有反向代理头信息
	    if (forwardedIpsStr) {//如果有，则将头信息中第一个地址拿出，该地址就是真实的客户端IP；
	        var forwardedIps = forwardedIpsStr.split(',');
	        ipAddress = forwardedIps[0];
	    }
	    if (!ipAddress) {//如果没有直接获取IP；
	        ipAddress = req.connection.remoteAddress;
	    }
	    return ipAddress;
	}
}
module.exports = new model()