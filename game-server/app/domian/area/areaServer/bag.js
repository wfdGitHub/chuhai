//背包物品系统
var itemCfg = require("../../../../config/gameCfg/item.json")
var shopCfg = require("../../../../config/gameCfg/shop.json")
var chest_awards = require("../../../../config/gameCfg/chest_awards.json")
var chest_cfg = require("../../../../config/gameCfg/chest_cfg.json")
var equip_base = require("../../../../config/gameCfg/equip_base.json")
var ace_pack = require("../../../../config/gameCfg/ace_pack.json")
var heros = require("../../../../config/gameCfg/heros.json")
var util = require("../../../../util/util.js")
var async = require("async")
module.exports = function() {
	var self = this
	this.playerBags = {}
	//使用背包物品
	this.useItem = function(uid,otps,cb) {
		if(!itemCfg[otps.itemId] || !itemCfg[otps.itemId].useType){
			cb(false,"item not exist or can't use")
			return
		}
		if(!Number.isInteger(otps.value) || otps.value <= 0){
			cb(false,"value error " + otps.value)
			return
		}
		var value = Number(otps.value)
		switch(itemCfg[otps.itemId].useType){
			case "heroChip":
				var heroId = itemCfg[otps.itemId].arg
				var needValue = 30
				self.heroDao.getHeroAmount(uid,function(flag,info) {
				  	if(info.cur >= info.max){
				    	next(null,{flag : false,data : "英雄背包已满"})
				    	return
				  	}
					self.consumeItems(uid,otps.itemId+":"+needValue,value,function(flag,err) {
						if(!flag){
							cb(false,err)
						}else{
							var heroList = []
							for(var i = 0;i < value;i++){
								heroList.push(self.heroDao.gainHero(self.areaId,uid,{id : heroId}))
							}
							cb(true,heroList)
						}
					})
				})
			break
			case "randChip":
				var needValue = 30
				self.heroDao.getHeroAmount(uid,function(flag,info) {
				  	if(info.cur >= info.max){
				    	next(null,{flag : false,data : "英雄背包已满"})
				    	return
				  	}
					self.consumeItems(uid,otps.itemId+":"+needValue,value,function(flag,err) {
						if(!flag){
							cb(false,err)
						}else{
							var type = itemCfg[otps.itemId].arg
					        var heroInfos = self.heroDao.randHero(self.areaId,uid,type,value)
					        cb(true,heroInfos)
						}
					})
				})
			break
			case "chest":
				//宝箱
				self.consumeItems(uid,otps.itemId+":"+value,1,function(flag,err) {
					if(!flag){
						cb(false,err)
					}else{
						var awardList = []
						var chestId = itemCfg[otps.itemId].arg
						for(var i = 0;i < value;i++){
							awardList = awardList.concat(self.openChestAward(uid,chestId))
						}
						cb(true,awardList)
					}
				})
			break
			case "box":
				//宝盒
				self.consumeItems(uid,otps.itemId+":"+value,1,function(flag,err) {
					if(!flag){
						cb(false,err)
					}else{
						var awardList = self.addItemStr(uid,itemCfg[otps.itemId].arg,value)
						cb(true,awardList)
					}
				})
			break
			default:
				cb(false,"类型错误"+itemCfg[otps.itemId].useType)
		}
	}
	//增加背包物品
	this.addBagItem = function(uid,itemId,value,cb) {
		this.redisDao.db.hincrby("player:user:"+uid+":bag",itemId,value,function(err,data) {
			if(cb){
				data = Number(data) || 0
				cb(true,data)
			}
		})
	}
	//获取背包物品数量
	this.getBagItem = function(uid,itemId,cb) {
		this.redisDao.db.hget("player:user:"+uid+":bag",itemId,function(err,data) {
			if(cb){
				data = Number(data) || 0
				cb(data)
			}
		})
	}
	//获取背包
	this.getBagList = function(uid,cb) {
		this.redisDao.db.hgetall("player:user:"+uid+":bag",function(err,data) {
			if(cb){
				cb(data)
			}
		})
	}
	//获取指定物品数量
	this.getBagItemList = function(uid,items,cb) {
		var multiList = []
		for(var i = 0;i < items.length;i++){
			multiList.push(["hget","player:user:"+uid+":bag",items[i]])
		}
		this.redisDao.multi(multiList,function(err,list) {
			for(var i = 0;i < list.length;i++){
				list[i] = Number(list[i])
			}
			cb(list)
		})
	}
	//物品改变，不属于获得
	this.changeItem = function(otps,cb) {
		var uid = otps.uid
		var itemId = otps.itemId
		var value = otps.value
		var rate = otps.rate || 1
		if(itemCfg[itemId]){
			value = Math.floor(Number(value) * rate) || 1
			itemId = parseInt(itemId)
			if(!itemId){
				console.error("itemId error "+itemId)
				if(cb){
					cb(false,"itemId error "+itemId)
				}
				return
			}
			self.addItemCB(uid,itemId,value,function(flag,curValue) {
				if(flag){
					var notify = {
						"type" : "addItem",
						"itemId" : itemId,
						"value" : value,
						"curValue" : curValue
					}
					self.sendToUser(uid,notify)
				}
				if(cb)
					cb(flag,curValue)
			})
			return {type : "item",itemId : itemId,value : value}
		}else{
			console.error("item not exist : "+itemId)
			if(cb)
				cb(false,"item not exist")
		}
		return {type : "item",itemId : itemId,value : value}
	}
	//获得物品
	this.addItem = function(otps,cb) {
		var uid = otps.uid
		var itemId = otps.itemId
		var value = otps.value
		var rate = otps.rate || 1
		if(itemCfg[itemId]){
			value = Math.floor(Number(value) * rate) || 1
			itemId = parseInt(itemId)
			if(!itemId){
				console.error("itemId error "+itemId)
				if(cb){
					cb(false,"itemId error "+itemId)
				}
				return
			}
			self.addItemCB(uid,itemId,value,function(flag,curValue) {
				if(flag){
					if(value > 0){
						switch(itemCfg[itemId].type){
							case "equip":
								self.taskUpdate(uid,"equip",value,equip_base[itemId].lv)
							break
							case "ace":
								self.taskUpdate(uid,"ace",value,ace_pack[itemId].quality)
							break
							case "art":
								self.taskUpdate(uid,"artifact_gain",value)
							break
						}
					}
					switch(itemId){
						case 204:
							if(curValue > 20000){
								curValue = 20000
								self.redisDao.db.hset("player:user:"+uid+":bag",itemId,curValue)
							}
						break
						case 202:
							if(value < 0)
								self.incrbyPlayerData(uid,"gold_consume",Math.abs(value))
							self.cacheDao.saveCache({messagetype:"itemChange",areaId:self.areaId,uid:uid,itemId:itemId,value:value,curValue:curValue})
						break
					}
					var notify = {
						"type" : "addItem",
						"itemId" : itemId,
						"value" : value,
						"curValue" : curValue
					}
					self.sendToUser(uid,notify)
				}
				if(cb)
					cb(flag,curValue)
			})
			return {type : "item",itemId : itemId,value : value}
		}else{
			console.error("item not exist : "+itemId)
			if(cb)
				cb(false,"item not exist")
		}
	}
	//增加物品回调
	this.addItemCB = function(uid,itemId,value,cb) {
		switch(itemId){
			case 100:
				this.addLordExp(uid,value)
				cb(true)
			break
			case 109:
				this.addUserRMB(uid,value)
				cb(true)
			break
			default:
				if(itemCfg[itemId]){
					this.addBagItem(uid,itemId,value,cb)
				}else{
					console.error("addItem error : "+itemId)
					if(cb)
						cb(false,"itemId error : "+itemId)
				}
		}
	}
	//合并奖励str
	this.mergepcstr = function(strList) {
		var pcInfo = {}
		for(let i = 0;i < strList.length;i++){
		    let pc = strList[i].split("&")
		    pc.forEach(function(m_str) {
		        let m_list = m_str.split(":")
		        let itemId = Number(m_list[0])
		        let value = Number(m_list[1])
		        if(!pcInfo[itemId]){
		          pcInfo[itemId] = 0
		        }
		        pcInfo[itemId] += value
		    })
		}
	    var pcStr = ""
	    for(var i in pcInfo){
	      pcStr += i+":"+pcInfo[i]+"&"
	    }
	    pcStr = pcStr.slice(0,pcStr.length-1)
		return pcStr
	}
	//扣除道具
	this.consumeItems = function(uid,str,rate,cb) {
		var items = []
		var values = []
		var strList = str.split("&")
		if(!rate || parseFloat(rate) != rate || typeof(rate) != "number"){
			rate = 1
		}
		strList.forEach(function(m_str) {
			var m_list = m_str.split(":")
			var itemId = Number(m_list[0])
			var value = Math.floor(Number(m_list[1]) * rate)
			items.push(itemId)
			values.push(value)
		})
		//判断道具是否足够
		self.getBagItemList(uid,items,function(list) {
			for(var i = 0;i < values.length;i++){
				if(list[i] < values[i]){
					cb(false,"item not enough "+items[i]+" "+list[i]+" "+values[i])
					return
				}
			}
			//扣除道具
			for(var i = 0;i < values.length;i++){
				switch(items[i]){
					case 201:
						self.taskUpdate(uid,"use_coin",values[i])
					break
					case 202:
						self.taskUpdate(uid,"use_gold",values[i])
					break
				}
				self.addItem({uid : uid,itemId : items[i],value : -values[i]})
			}
			cb(true)
		})
	}
	//解析物品奖励
	this.addItemStr = function(uid,str,rate,cb) {
		var list = str.split("&")
		if(!rate || parseFloat(rate) != rate || typeof(rate) != "number"){
			rate = 1
		}
		var awardList = []
		list.forEach(function(m_str) {
			var m_list = m_str.split(":")
			var itemId = m_list[0]
			var value = m_list[1]
			awardList.push(self.addItem({uid : uid,itemId : itemId,value : value,rate : rate}))
		})
		if(cb)
			cb(true,awardList)
		return awardList
	}
	//直接购买物品
	this.buyItem = function(uid,itemId,count,cb) {
		if(!itemCfg[itemId] || !itemCfg[itemId]["buy"] || !Number.isInteger(itemCfg[itemId]["buyNum"])){
			cb(false,"item not exist or cfg error")
			return
		}
		if(!Number.isInteger(count) || count <= 0){
			cb(false,"count error "+count)
			return
		}
		self.consumeItems(uid,itemCfg[itemId]["buy"],count,function(flag,err) {
			if(!flag){
				cb(flag,err)
				return
			}
			var info = self.addItem({uid : uid,itemId : itemId,value : itemCfg[itemId]["buyNum"],rate : count})
			cb(true,info)
		})
	}
	//商城每日刷新
	this.shopRefresh = function(uid) {
		self.delObjAll(uid,"shop")
		self.getPlayerData(uid,"week_record",function(data) {
			var week_record = util.getWeek()
			if(data != week_record){
				// console.log("跨周刷新",data,week_record)
				self.setPlayerData(uid,"week_record",week_record)
				self.delObjAll(uid,"week_shop")
			}
		})
		self.getPlayerData(uid,"month_record",function(data) {
			var month_record = util.getMonth()
			if(data != month_record){
				// console.log("跨月刷新",data,month_record)
				self.setPlayerData(uid,"month_record",month_record)
				self.delObjAll(uid,"month_shop")
			}
		})
	}
	//商城购买物品
	this.buyShop = function(uid,shopId,count,cb) {
		if(!shopId || !Number.isInteger(count) || count <= 0){
			cb(false,"args type error")
			return
		}
		var shopInfo = shopCfg[shopId]
		if(!shopInfo){
			cb(false,"shopId error "+shopId)
			return
		}
		async.waterfall([
			function(next) {
				if(shopCfg[shopId]["day_count"]){
					self.getObj(uid,"shop",shopId,function(value) {
						value = Number(value) || 0
						if(shopCfg[shopId]["day_count"] >= count + value){
							next()
						}else{
							next("购买次数到达上限")
						}
					})
				}else{
					next()
				}
			},
			function(next) {
				self.consumeItems(uid,shopInfo.pc,count,function(flag,err) {
					if(!flag){
						cb(flag,err)
						return
					}
					if(shopCfg[shopId]["day_count"])
						self.incrbyObj(uid,"shop",shopId,count)
					if(shopCfg[shopId]["type"])
						self.taskUpdate(uid,"shop_buy",count)
					self.addItemStr(uid,shopInfo.pa,count)
					cb(true,shopInfo.pa)
				})
			}
		],function(err) {
			cb(false,err)
		})
	}
	//获得商城数据
	this.getShopData = function(uid,cb) {
		self.getObjAll(uid,"shop",function(data) {
			cb(true,data)
		})
	}
	//解析奖励池str
	this.openChestStr = function(uid,str) {
		if(!str || typeof(str) != "string"){
			return []
		}
		var awardList = []
		var list = str.split("&")
		list.forEach(function(m_str) {
			var m_list = m_str.split(":")
			var chestId = m_list[0]
			var value = parseInt(m_list[1]) || 1
			for(var i = 0;i < value;i++)
				awardList = awardList.concat(self.openChestAward(uid,chestId))
		})
		return awardList
	}
	//奖励池获取奖励
	this.openChestAward = function(uid,chestId) {
		if(!chest_cfg[chestId] || !chest_cfg[chestId]["randAward"]){
			return []
		}
		var awardMap = []
		var keyMap = []
		var chestStr = chest_cfg[chestId]["randAward"]
		var list = chestStr.split("&")
		var allValue = 0
		list.forEach(function(m_str) {
			var m_list = m_str.split(":")
			var itemId = m_list[0]
			allValue += parseInt(m_list[1])
			awardMap.push(allValue)
			keyMap.push(itemId)
		})
		var str = false
		var rand = Math.random() * allValue
		for(var i in awardMap){
			if(rand < awardMap[i]){
				if(!chest_awards[keyMap[i]]){
					console.error(chestId+"宝箱奖励未找到"+keyMap[i])
					return [{"err" : chestId+"宝箱奖励未找到"+keyMap[i]}]
				}else{
					str = chest_awards[keyMap[i]]["str"]
				}
				break
			}
		}
		if(str){
			return this.addItemStr(uid,str)
		}else{
			return []
		}
	}
}