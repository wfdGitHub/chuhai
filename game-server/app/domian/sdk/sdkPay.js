//SKD支付模块
const util = require("../../../util/util.js")
const parseString = require('xml2js').parseString;
const crypto = require("crypto")
const querystring = require("querystring")
var model = function() {}
var local = {}
//初始化获取配置
model.prototype.init = function(cb) {
	// console.log("SKD支付模块 初始化SDK配置")
	delete require.cache[require.resolve('../../../config/sysCfg/sdkConfig.json')]; 
	this.sdkConfig = require("../../../config/sysCfg/sdkConfig.json")
}
//收到支付回调
model.prototype.pay_order = function(data,finish_callback,req,res) {
	switch(this.sdkConfig.sdk_type){
		case "quick":
			this.quick_order(data,finish_callback,req,res)
		break
		case "jianwan":
			this.jianwan_order(data,finish_callback,req,res)
		break
		case "277":
			this.game277_order(data,finish_callback,req,res)
		break
		case "x7sy":
			this.x7sy_order(data,finish_callback,req,res)
		break
	}
}
//quick订单
model.prototype.quick_order = function(data,finish_callback,req,res) {
	var v_sign = util.md5(data.nt_data+data.sign+this.sdkConfig["Md5_Key"]["value"])
	if(v_sign != data.md5Sign){
		console.error("签名验证失败")
		return
	}
	res.send("SUCCESS")
	var self = this
	var xmlStr = local.decode(data.nt_data,this.sdkConfig["Callback_Key"])
	parseString(xmlStr,function(err,result) {
		var message = result.quicksdk_message.message[0]
		var info = {
			is_test : message["is_test"]? message["is_test"][0] : 0,
			channel : message["channel"]? message["channel"][0] : 0,
			channel_name : message["channel_name"]? message["channel_name"][0] : 0,
			channel_uid : message["channel_uid"]? message["channel_uid"][0] : 0,
			channel_order : message["channel_order"]? message["channel_order"][0] : 0,
			game_order : message["game_order"]? message["game_order"][0] : 0,
			order_no : message["order_no"]? message["order_no"][0] : 0,
			pay_time : message["pay_time"]? message["pay_time"][0] : 0,
			amount : message["amount"]? message["amount"][0] : 0,
			status : message["status"]? message["status"][0] : 0,
			extras_params : message["extras_params"]? message["extras_params"][0] : 0,
		}
		self.payDao.finishGameOrder(info,function(flag,err,data) {
			if(err)
				console.error(err)
			if(flag){
				//订单发货
				finish_callback(data.areaId,data.uid,data.amount,data.pay_id)
			}
		})
	});
}
//简玩订单
model.prototype.jianwan_order = function(data,finish_callback,req,res) {
	var v_sign = util.md5(data.nt_data+data.sign+Md5_Key)
	if(v_sign != data.md5Sign){
		console.error("签名验证失败")
		cb(false,"签名验证失败")
		return
	}
	var self = this
	data.nt_data_json = JSON.parse(data.nt_data_json)
	var info = {
		is_test : data.nt_data_json["is_test"] || 0,
		channel : data.nt_data_json["channel"] || 0,
		channel_name : data.nt_data_json["channel_name"] || 0,
		channel_uid : data.nt_data_json["channel_uid"] || 0,
		channel_order : data.nt_data_json["channel_order"] || 0,
		game_order : data.nt_data_json["game_order"] || 0,
		order_no : data.nt_data_json["order_no"] || 0,
		pay_time : data.nt_data_json["pay_time"] || 0,
		amount : data.nt_data_json["amount"] || 0,
		status : data.nt_data_json["status"] || 0,
		extras_params : data.nt_data_json["extras_params"] || 0
	}
	self.payDao.finishGameOrderJianwan(info,function(flag,err,data) {
			if(err)
				console.error(err)
			if(flag){
				//订单发货
				finish_callback(data.areaId,data.uid,data.amount,data.pay_id)
			}
	})
}
//277订单
model.prototype.game277_order = function(data,finish_callback,req,res) {
	res.send("succ")
	for(var i = 0;i < ip_white_list.length;i++){
		if(req.ip.indexOf(ip_white_list[i]) != -1){
			res.send({
				'error_code' : 299,
				'message' : "ip error"
			})
			return
		}
	}
	var v_sign = util.md5(encodeURI("amount="+data.amount+"&extendsinfo="+data.extendsinfo+"&gameid="+data.gameid+"&orderid="+data.orderid+"&out_trade_no="+data.out_trade_no+"&servername="+data.servername+"&time="+data.time+"&username="+data.username+sdkConfig["secretkey"]))
	if(v_sign != data.sign){
		console.error("签名验证失败")
		return
	}
	var self = this
	var info = {
		is_test : 0,
		channel : 0,
		channel_name : 0,
		channel_uid : 0,
		channel_order : 0,
		game_order : data.out_trade_no || 0,
		order_no : data.orderid || 0,
		pay_time : data.time || 0,
		amount : data.amount || 0,
		status : 0,
		extras_params : 0
	}
	self.payDao.finishGameOrder(info,function(flag,err,data) {
			if(err)
				console.error(err)
			if(flag){
				//订单发货
				finish_callback(data.areaId,data.uid,data.amount,data.pay_id)
			}
	})
}
//小七手游订单
model.prototype.x7sy_order = function(data,finish_callback,req,res) {
	var publicKey = ""
	if(data.extends_info_data == 1){
		publicKey = "-----BEGIN PUBLIC KEY-----\n"+this.sdkConfig["iosRSA"]["value"]+"\n-----END PUBLIC KEY-----"
	}else{
		publicKey = "-----BEGIN PUBLIC KEY-----\n"+this.sdkConfig["RSA"]["value"]+"\n-----END PUBLIC KEY-----"
	}
	var raw_sign_data = Buffer.from(data.sign_data, 'base64')
	delete data.sign_data
	var source_str = local.ksort(data)
	if(!local.verifySignSHA1(source_str,raw_sign_data,publicKey)){
		res.send("签名验证失败")
		console.error("签名验证失败")
		return
	}
	res.send("success")
	var raw_encryp_data = Buffer.from(data.encryp_data, 'base64')
	var decodedata = crypto.publicDecrypt(publicKey,raw_encryp_data);
	var encryp_data = querystring.parse(decodedata.toString())
	var self = this
	var info = {
		is_test : 0,
		channel : 0,
		channel_name : 0,
		channel_uid : 0,
		channel_order : 0,
		game_order : encryp_data.game_orderid || 0,
		order_no : data.xiao7_goid || 0,
		pay_time : Date.now(),
		amount : encryp_data.pay_price || 0,
		status : 0,
		extras_params : 0
	}
	self.payDao.finishGameOrder(info,function(flag,err,data) {
			if(err)
				console.error(err)
			if(flag){
				//订单发货
				finish_callback(data.areaId,data.uid,data.amount,data.pay_id)
			}
	})
}
//小七订单sign
model.prototype.x7syGameSign = function(str) {
	str += this.sdkConfig["RSA"]
	var md5 = util.md5(str)
	return md5
}
local.decode = function(str,key){
	if(str.length <= 0){
		return '';
	}
	var list = new Array();
	var resultMatch = str.match(/\d+/g);
	for(var i= 0;i<resultMatch.length;i++){
		list.push(resultMatch[i]);
	}
	if(list.length <= 0){
		return '';
	}
	var keysByte = local.stringToBytes(key);
	var dataByte = new Array();
	for(var i = 0 ; i < list.length ; i++){
		dataByte[i] = parseInt(list[i]) - (0xff & parseInt(keysByte[i % keysByte.length]));
	}
	if(dataByte.length <= 0){
		return '';
	}
	var parseStr = local.bytesToString(dataByte);
	return parseStr;
}
local.stringToBytes = function(str) {
	var ch, st, re = [];  
  	for (var i = 0; i < str.length; i++ ) {  
    	ch = str.charCodeAt(i);
    	st = []; 
    	do {  
      		st.push( ch & 0xFF );
      		ch = ch >> 8;
    	}while ( ch );  
    	re = re.concat( st.reverse() );  
	}  
  	return re;  
} 
local.bytesToString = function(array) {
  return String.fromCharCode.apply(String, array);
}
local.ksort = function(obj){
  let sortStr = "",
  keys = Object.keys(obj);
  keys.sort();
  for(var i = 0;i < keys.length;i++){
    if(i > 0){
        sortStr += "&"
    }
    sortStr += keys[i]+"="+obj[keys[i]]
  }
  return sortStr;
}
local.verifySignSHA1 = function(data, sign, publicKey) {
    const verify = crypto.createVerify('RSA-SHA1');
    verify.update(data);
    verify.end();
    return verify.verify(publicKey, Buffer.from(sign, 'base64'));
}
module.exports = {
	id : "sdkPay",
	func : model,
	init : "init",
	scope : "prototype",
	props : [{
		name : "redisDao",
		ref : "redisDao"
	},{
		name : "payDao",
		ref : "payDao"
	}]
}