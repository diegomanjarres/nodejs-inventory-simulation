var mongoose = require('mongoose')
var Schema = mongoose.Schema
const connect = mongoose.connect.bind(mongoose)

module.exports = function(InventoryLogic) {
  function check(itemID) {
    getItemMonitorConfig({
      item: itemID
    }).then((monitorConfig) => {
      return InventoryLogic.getItemStockLevel({
        item: itemID
      })
    })
  }
  return {
    check,
    connect,
    getItemMonitorConfig,
    saveItemMonitorConfig
  }
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
