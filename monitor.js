var mongoose = require('mongoose')
var Schema = mongoose.Schema
const connect = mongoose.connect.bind(mongoose)
const NEWSBOY = require('./newsboy')
const EOQ = require('./economic-order-quantity')
const policies = { NEWSBOY,EOQ }


module.exports = function(Inventory) {
  this.Inventory = Inventory

  return {
    check: check.bind(this),
    connect,
    getItemMonitorConfig,
    saveItemMonitorConfig
  }
}

function check(transaction) {
  const { item, date } = transaction
  getItemMonitorConfig({item})
  .then((monitorConfig) => {
    const policy=monitorConfig.policy
    if (policies[policy])
      return policies[policy].call(this,transaction,monitorConfig.params[policy])
    return this.Inventory.inventory
      .getItemStockLevel({item, date})
  })
}

const itemMonitorConfigSchema = new Schema({
  item: Object,
  policy: String,
  params: {
    EOQ: {
      demandMean: Number,
      demandDeviation: Number,
      leadTime: Number,
      setupCost: Number,
      proportionalCost: Number,
      holdingCost: Number
    },
    NEWSBOY: {
      overageCost: Number,
      underageCost: Number,
      demandMean: Number,
      demandDeviation: Number,
      cycleDays: Number
    },
    QR: {
      demandMean: Number,
      demandDeviation: Number,
      leadTime: Number,
      setupCost: Number,
      holdingCost: Number,
      proportionalCost: Number,
      shortageCost: Number
    }
  }
})

const ItemMonitorConfigModel = mongoose.model('ItemMonitorConfig', itemMonitorConfigSchema)
let getItemMonitorConfig = (query) => (ItemMonitorConfigModel.findOne(query))

let saveItemMonitorConfig = (itemConfig) => {
  return new ItemMonitorConfigModel(itemConfig).save()
}
