const NodejsInventory = require('nodejs-inventory')
const gaussian = require('gaussian')
const Q = require('q')
const Promise = require('bluebird')

const factory = require('./factory')
const Monitor = require('./monitor')
const itemsMonitorConfig = require('./items-monitor-config')
const simulationId = 'simulation one'
const mongoConnectionString = process.env.DB || 'localhost:27017/' + new Date().getTime()

const Inventory = new NodejsInventory()
Inventory.connect(mongoConnectionString)
const monitor = new Monitor(Inventory.inventory)
monitor.connect(mongoConnectionString)

const simulationDays = 2
const millisInDay = 1000 * 60 * 60 * 24
let fakeDate = new Date('2018-01-01T00:00:00.000Z')


createDummyItems()
  .then(createItemsConfig)
  .then(insertTransactions)
// .catch((e)=>{
//   console.log('err ',e);
// })

function insertTransactions() {
  let funcs = [...[...Array(simulationDays).keys()].map(createDailyTransactions)]
  console.log(funcs);
  return funcs.reduce(Q.when, Q());
  //return Promise.each(funcs)
}


function createDummyItems() {
  const dummyItems = factory.getDummyItems(simulationId, 3)
  let insertItemsPromises = dummyItems.map(item => (Inventory.items.upsertItem(item)))
  return Promise.all(insertItemsPromises)
}

function createItemsConfig() {
  return Inventory.items.getItems()
    .then(items => {
      let insertConfigsPromises = items.map((item, index) => {
        monitor.saveItemMonitorConfig({ item: item.id, ...itemsMonitorConfig[index] })
      })
      return Promise.all(insertConfigsPromises)
    })
}


function createDailyTransactions() {
  return function() {
    return Inventory.items.getItems()
      .then(items => {
        let getConfigPromises = items.map(({ _id }) => (monitor.getItemMonitorConfig({ item: _id.toString() })))
        return Promise.all(getConfigPromises)
      })
      .then(itemsConfig => {
        let saveTransactionsPromises = itemsConfig.map(itemConfig => {
          let { demandMean, demandDeviation } = itemConfig.params[itemConfig.policy]
          let quantity = gaussian(demandMean, demandDeviation)
          let transaction = factory.getDummyTransaction(itemConfig.item, quantity, fakeDate)
          return Inventory.transactions.saveTransaction(transaction)
        })
        return Promise.all(saveTransactionsPromises)
      })
      .then(() => {
        fakeDate = new Date(fakeDate.getTime() + millisInDay)
        console.log(fakeDate);
        return fakeDate;
      })
  }

}
