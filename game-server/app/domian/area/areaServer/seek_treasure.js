//寻宝系统
const treasure_cfg = require("../../../../config/gameCfg/treasure_cfg.json")
const treasure_awards = require("../../../../config/gameCfg/treasure_awards.json")
const oh_turntable = require("../../../../config/gameCfg/oh_turntable.json")
const bf_turntable = require("../../../../config/gameCfg/bf_turntable.json")
const default_cfg = require("../../../../config/gameCfg/default_cfg.json")
const GM_CFG = require("../../../../config/gameCfg/GM_CFG.json")
const main_name = "ST"
var normal_grid = {}
var high_grid = {}
var oh_grid = []
var oh_allWeight = 0
var bf_grid = []
var bf_allWeight = 0
for(var i = 0;i < 8;i++){
	normal_grid[i] = {}
	normal_grid[i].list = JSON.parse(treasure_cfg["normal_grid_"+i]["value"])
	normal_grid[i].allWeight = 0
	for(var j = 0;j < normal_grid[i].list.length;j++){
		normal_grid[i].allWeight += treasure_awards[normal_grid[i].list[j]]["show"]
	}
	high_grid[i] = {}
	high_grid[i].list = JSON.parse(treasure_cfg["high_grid_"+i]["value"])
	high_grid[i].allWeight = 0
	for(var j = 0;j < high_grid[i].list.length;j++){
		high_grid[i].allWeight += treasure_awards[high_grid[i].list[j]]["show"]
	}
	oh_allWeight += oh_turntable[i]["weight"]
	oh_grid.push(oh_allWeight)
	bf_allWeight += bf_turntable[i]["weight"]
	bf_grid.push(bf_allWeight)
}
module.exports = function() {
	var self = this
	var local = {}
	var highRecord = []
	var normalRecord = []
	var ohRecord = []
	var bfRecord = []
	//寻宝每日刷新
	this.STDayRefresh = function(uid) {
		self.setObj(uid,main_name,"normal_free",0)
		self.setObj(uid,main_name,"high_free",0)
		self.delObj(uid,main_name,"normal_grid")
		self.delObj(uid,main_name,"high_grid")
	}
	//获得寻宝数据
	this.getSTData = function(uid,cb) {
		self.getObjAll(uid,main_name,function(data) {
			if(!data.normal_grid || !data.high_grid){
				data.normal_grid = JSON.stringify(local.normalSTRefresh(uid))
				data.high_grid = JSON.stringify(local.highSTRefresh(uid))
			}else{
				var normal_grid = JSON.parse(data.normal_grid)
				var high_grid = JSON.parse(data.high_grid)
				for(var i = 0;i < 8;i++){
					if(!normal_grid[i] || !treasure_awards[normal_grid[i]["id"]] || !high_grid[i] || !treasure_awards[high_grid[i]["id"]]){
						data.normal_grid = JSON.stringify(local.normalSTRefresh(uid))
						data.high_grid = JSON.stringify(local.highSTRefresh(uid))
					}
				}
				data.normal_score = Number(data.normal_score) || 0
				data.high_score = Number(data.high_score) || 0
				if(data["normal_luck_1"] && data["normal_luck_2"] && data["normal_luck_3"] && data["normal_luck_4"] && data["normal_luck_5"]){
					for(var i = 1;i <= 5;i++){
						self.delObj(uid,main_name,"normal_luck_"+i)
						delete data["normal_luck_"+i]
					}
					data.normal_score -= 1000
					self.incrbyObj(uid,main_name,"normal_score",-1000)
				}
				if(data["high_luck_1"] && data["high_luck_2"] && data["high_luck_3"] && data["high_luck_4"] && data["high_luck_5"]){
					for(var i = 1;i <= 5;i++){
						self.delObj(uid,main_name,"high_luck_"+i)
						delete data["high_luck_"+i]
					}
					data.high_score -= 1000
					self.incrbyObj(uid,main_name,"high_score",-1000)
				}
			}
			cb(true,data)
		})
	}
	//获得寻宝记录
	this.getSTRecord = function(cb) {
		cb(true,{highRecord:highRecord,normalRecord:normalRecord,ohRecord:ohRecord,bfRecord:bfRecord})
	}
	//保存寻宝记录
	local.saveSTRecord = function(name,type,award) {
		switch(type){
			case "high":
				highRecord.push({name : name,award:award})
				if(highRecord.length > 5)
					highRecord.shift()
			break
			case "normal":
				normalRecord.push({name : name,award:award})
				if(normalRecord.length > 5)
					normalRecord.shift()
			break
			case "oh":
				ohRecord.push({name : name,award:award})
				if(ohRecord.length > 5)
					ohRecord.shift()
			break
			case "bf":
				bfRecord.push({name : name,award:award})
				if(bfRecord.length > 5)
					bfRecord.shift()
			break
		}
	}
	//普通寻宝单次
	this.normalSTSeek = function(uid,cb) {
		var name = self.players[uid]["name"]
		self.getObj(uid,main_name,"normal_grid",function(data) {
			if(!data){
				cb(false)
			}else{
				data = JSON.parse(data)
				self.consumeItems(uid,"1000090:1",1,"普通寻宝",function(flag,err) {
					if(!flag){
						cb(false,err)
					}else{
						var score = treasure_cfg["normal_luck"]["value"]
						self.incrbyObj(uid,main_name,"normal_score",score)
						var index = local.getTreasure(data)
						if(index != -1 && data[index] && treasure_cfg["normal_grid_"+index]){
							if(treasure_cfg["normal_grid_"+index].arg){
								local.saveSTRecord(name,"normal",treasure_awards[data[index]["id"]]["award"])
								data[index].finish = true
								self.setObj(uid,main_name,"normal_grid",JSON.stringify(data))
							}
							var awardList = self.addItemStr(uid,treasure_awards[data[index]["id"]]["award"],1,"普通寻宝")
							cb(true,{awardList:awardList,data:data,index : index,score:score})
						}else{
							console.error("奖励找不到"+curWeight+"/"+allWeight+"  "+index)
							console.error(list)
							cb(false,"sys error")
						}
					}
				})
			}
		})
	}
	//普通寻宝十五次
	this.normalSTMultiple = function(uid,cb) {
		var name = self.players[uid]["name"]
		self.getObj(uid,main_name,"normal_grid",function(oriData) {
			if(!oriData){
				cb(false)
			}else{
				data = JSON.parse(oriData)
				self.consumeItems(uid,"1000090:12",1,"普通寻宝",function(flag,err) {
					if(!flag){
						cb(false,err)
					}else{
						var id = false
						var score = treasure_cfg["normal_luck"]["value"]*15
						self.incrbyObj(uid,main_name,"normal_score",score)
						var awardList = []
						for(var i = 0;i < 15;i++){
							var index = local.getTreasure(data)
							if(index != -1 && data[index] && treasure_cfg["normal_grid_"+index]){
								if(treasure_cfg["normal_grid_"+index].arg){
									local.saveSTRecord(name,"normal",treasure_awards[data[index]["id"]]["award"])
									data[index].finish = true
								}
								if(i == 0)
									id = data[index]["id"]
								awardList = awardList.concat(self.addItemStr(uid,treasure_awards[data[index]["id"]]["award"],1,"普通寻宝"))
							}
						}
						var dataStr = JSON.stringify(data)
						if(dataStr != oriData)
							self.setObj(uid,main_name,"normal_grid",dataStr)
						cb(true,{awardList:awardList,data:data,score:score,id:id})
					}
				})
			}
		})
	}
	//免费刷新普通寻宝
	this.normalSTFreeRefresh = function(uid,cb) {
		self.getObj(uid,main_name,"normal_free",function(time) {
			time = Number(time) || 0
			if(Date.now() - time > 9000000){
				var data = local.normalSTRefresh(uid)
				self.setObj(uid,main_name,"normal_free",Date.now())
				cb(true,data)
			}else{
				cb(false,"冷却中")
			}
		})
	}
	//付费刷新普通寻宝
	this.normalSTBuyRefresh = function(uid,cb) {
		self.consumeItems(uid,treasure_cfg["normal_refresh"]["value"],1,"普通寻宝刷新",function(flag,err) {
			if(!flag){
				cb(false,err)
			}else{
				var data = local.normalSTRefresh(uid)
				cb(true,data)
			}
		})
	}
	local.normalSTRefresh = function(uid) {
		var data = []
		for(var i = 0;i < 8;i++){
			data[i] = {
				id : local.getShowGrid(normal_grid[i])
			}
		}
		self.setObj(uid,main_name,"normal_grid",JSON.stringify(data))
		return data
	}
	//领取普通寻宝幸运宝箱
	this.gainSTNormalBox = function(uid,boxId,cb) {
		if(!treasure_cfg["normal_luck_"+boxId]){
			cb(false)
			return
		}
		self.getHMObj(uid,main_name,["normal_score","normal_luck_1","normal_luck_2","normal_luck_3","normal_luck_4","normal_luck_5"],function(list) {
			var score = Number(list[0]) || 0
			if(score >= treasure_cfg["normal_luck_"+boxId].arg && !list[boxId]){
				self.incrbyObj(uid,main_name,"normal_luck_"+boxId,1,function(data) {
					if(data != 1){
						cb(false,"积分不足或已领取")
						return
					}
					var info = {}
					info.awardList = self.addItemStr(uid,treasure_cfg["normal_luck_"+boxId]["value"],1,"普通寻宝幸运宝箱"+boxId)
					list[boxId] = 1
					if(list[1] && list[2] && list[3] && list[4] && list[5]){
						info.refresh = true
						info.score = score - 1000
						for(var i = 1;i <= 5;i++){
							if(i != boxId)
								self.delObj(uid,main_name,"normal_luck_"+i)
						}
						self.incrbyObj(uid,main_name,"normal_score",-1000)
					}
					cb(true,info)
				})
			}else{
				cb(false,"积分不足或已领取")
			}
		})
	}
	//高级寻宝单次
	this.highSTSeek = function(uid,cb) {
		var name = self.players[uid]["name"]
		self.getObj(uid,main_name,"high_grid",function(data) {
			if(!data){
				cb(false)
			}else{
				var score = treasure_cfg["high_luck"]["value"]
				self.incrbyObj(uid,main_name,"high_score",score)
				data = JSON.parse(data)
				self.consumeItems(uid,"1000100:1",1,"高级寻宝",function(flag,err) {
					if(!flag){
						cb(false,err)
					}else{
						var index = local.getTreasure(data)
						if(index != -1 && data[index] && treasure_cfg["high_grid_"+index]){
							if(treasure_cfg["high_grid_"+index].arg){
								local.saveSTRecord(name,"high",treasure_awards[data[index]["id"]]["award"])
								data[index].finish = true
								self.setObj(uid,main_name,"high_grid",JSON.stringify(data))
							}
							var awardList = self.addItemStr(uid,treasure_awards[data[index]["id"]]["award"],1,"高级寻宝")
							cb(true,{awardList:awardList,data:data,index : index,score:score})
						}else{
							console.error("奖励找不到"+curWeight+"/"+allWeight+"  "+index)
							console.error(list)
							cb(false,"sys error")
						}
					}
				})
			}
		})
	}
	//高级寻宝十次
	this.highSTMultiple = function(uid,cb) {
		var name = self.players[uid]["name"]
		self.getObj(uid,main_name,"high_grid",function(oriData) {
			if(!oriData){
				cb(false)
			}else{
				data = JSON.parse(oriData)
				self.consumeItems(uid,"1000100:10",1,"高级寻宝",function(flag,err) {
					if(!flag){
						cb(false,err)
					}else{
						var id = false
						var score = treasure_cfg["high_luck"]["value"]*10
						self.incrbyObj(uid,main_name,"high_score",score)
						var awardList = []
						for(var i = 0;i < 10;i++){
							var index = local.getTreasure(data)
							if(index != -1 && data[index] && treasure_cfg["high_grid_"+index]){
								if(treasure_cfg["high_grid_"+index].arg){
									local.saveSTRecord(name,"high",treasure_awards[data[index]["id"]]["award"])
									data[index].finish = true
								}
								if(i == 0)
									id = data[index]["id"]
								awardList = awardList.concat(self.addItemStr(uid,treasure_awards[data[index]["id"]]["award"],1,"高级寻宝"))	
							}
						}
						var dataStr = JSON.stringify(data)
						if(dataStr != oriData)
							self.setObj(uid,main_name,"high_grid",dataStr)
						cb(true,{awardList:awardList,data:data,score:score,id:id})
					}
				})
			}
		})
	}
	//免费刷新高级寻宝
	this.highSTFreeRefresh = function(uid,cb) {
		self.getObj(uid,main_name,"high_free",function(time) {
			time = Number(time) || 0
			if(Date.now() - time > 9000000){
				self.setObj(uid,main_name,"high_free",Date.now())
				var data = local.highSTRefresh(uid)
				cb(true,data)
			}else{
				cb(false,"冷却中")
			}
		})
	}
	//付费刷新高级寻宝
	this.highSTBuyRefresh = function(uid,cb) {
		self.consumeItems(uid,treasure_cfg["high_refresh"]["value"],1,"高级寻宝刷新",function(flag,err) {
			if(!flag){
				cb(false,err)
			}else{
				var data = local.highSTRefresh(uid)
				cb(true,data)
			}
		})
	}
	local.highSTRefresh = function(uid) {
		var data = []
		for(var i = 0;i < 8;i++){
			data[i] = {
				id : local.getShowGrid(high_grid[i])
			}
		}
		self.setObj(uid,main_name,"high_grid",JSON.stringify(data))
		return data
	}
	//领取高级寻宝幸运宝箱
	this.gainSTHighBox = function(uid,boxId,cb) {
		if(!treasure_cfg["high_luck_"+boxId]){
			cb(false)
			return
		}
		self.getHMObj(uid,main_name,["high_score","high_luck_1","high_luck_2","high_luck_3","high_luck_4","high_luck_5"],function(list) {
			var score = Number(list[0]) || 0
			if(score >= treasure_cfg["high_luck_"+boxId].arg && !list[boxId]){
				self.incrbyObj(uid,main_name,"high_luck_"+boxId,1,function(data) {
					if(data != 1){
						cb(false,"积分不足或已领取")
						return
					}
					var info = {}
					info.awardList = self.addItemStr(uid,treasure_cfg["high_luck_"+boxId]["value"],1,"高级寻宝幸运宝箱"+boxId)
					list[boxId] = 1
					if(list[1] && list[2] && list[3] && list[4] && list[5]){
						info.refresh = true
						info.score = score - 1000
						for(var i = 1;i <= 5;i++){
							if(i != boxId)
								self.delObj(uid,main_name,"high_luck_"+i)
						}
						self.incrbyObj(uid,main_name,"high_score",-1000)
					}
					cb(true,info)
				})
			}else{
				cb(false,"积分不足或已领取")
			}
		})
	}
	local.getShowGrid = function(grids) {
		var rand = Math.random() * grids.allWeight
		var curWeight = 0
		for(var i = 0;i < grids.list.length;i++){
			if(rand < (curWeight + treasure_awards[grids.list[i]]["show"])){
				return grids.list[i]
			}
			curWeight += treasure_awards[grids.list[i]]["show"]
		}
		return false
	}
	local.getTreasure = function(data) {
		var allWeight = 0
		var list = []
		var weights = []
		for(var i = 0;i < data.length;i++){
			var id = data[i]["id"]
			list.push(id)
			if(!data[i].finish)
				allWeight += treasure_awards[id]["weight"]
			weights.push(allWeight)
		}
		var rand = Math.random() * allWeight
		for(var i = 0;i < list.length;i++){
			if(rand < weights[i]){
				return i
			}
		}
		return -1
	}
	//欧皇转盘
	this.ohLotto = function(uid,count,cb) {
		self.consumeItems(uid,default_cfg["oh_lotto"]["value"],count,"欧皇转盘",function(flag,err) {
			if(!flag){
				cb(false,err)
			}else{
				var name = self.players[uid]["name"]
				var awardList = []
				var index = -1
				var awards = {}
				var awardList = []
				for(var i = 0;i < count;i++){
					var rand = Math.random() * oh_allWeight
					for(var j = 0;j < oh_grid.length;j++){
						if(rand < oh_grid[j]){
							index = j
							if(!awards[oh_turntable[j]["award"]])
								awards[oh_turntable[j]["award"]] = 0
							awards[oh_turntable[j]["award"]]++
							if(oh_turntable[j]["rare"]){
								local.saveSTRecord(name,"oh",oh_turntable[j]["award"])
							}
							break
						}
					}
				}
				for(var awardStr in awards){
					awardList = awardList.concat(self.addItemStr(uid,awardStr,awards[awardStr],"欧皇转盘"))
				}
				cb(true,{awardList:awardList,index:index})
			}
		})
	}
	//兵法转盘
	this.bfLotto = function(uid,count,cb) {
		var gmLv = self.getLordAtt(uid,"gmLv")
		self.getObj(uid,"playerData","bf_lotto_count",function(data) {
			data = Number(data) || 0
			if((data + count) > (default_cfg["bf_lotto_count"]["value"] + GM_CFG[gmLv]["lotto"])){
				cb(false,"可用次数不足")
			}else{
				self.incrbyObj(uid,"playerData","bf_lotto_count",count)
				self.consumeItems(uid,default_cfg["bf_lotto"]["value"],count,"欧皇转盘",function(flag,err) {
					if(!flag){
						cb(false,err)
					}else{
						var name = self.players[uid]["name"]
						var awardList = []
						var index = -1
						for(var i = 0;i < count;i++){
							var rand = Math.random() * bf_allWeight
							for(var j = 0;j < bf_grid.length;j++){
								if(rand < bf_grid[j]){
									index = j
									awardList = awardList.concat(self.addItemStr(uid,bf_turntable[j]["award"],1,"欧皇转盘"))
									if(bf_turntable[j]["rare"]){
										local.saveSTRecord(name,"bf",bf_turntable[j]["award"])
									}
									break
								}
							}
						}
						cb(true,{awardList:awardList,index:index})
					}
				})
			}
		})
	}
}