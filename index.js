const NodejsInventory = require('nodejs-inventory')
const gaussian = require('gaussian')
const Q = require('q')
const Promise = require('bluebird')

const factory = require('./factory')
const Monitor = require('./monitor')
const graphResults = require('./graph-results')
const itemsMonitorConfig = require('./items-monitor-config')
const simulationId = 'simulation one'
const mongoConnectionString = process.env.DB || 'localhost:27017/' + new Date().getTime()

const Inventory = new NodejsInventory()
Inventory.connect(mongoConnectionString)
const monitor = new Monitor(Inventory)
monitor.connect(mongoConnectionString)
Inventory.startMonitor(monitor)





global.simulationDays = 20
global.startDate = new Date('2018-01-01T00:00:00.000Z')
let fakeDate = global.startDate
const millisInDay = 1000 * 60 * 60 * 24
let simulationDates = [...Array(global.simulationDays)]
  .map(() => (fakeDate = new Date(fakeDate.getTime() + millisInDay)))

createDummyItems()
  .then(createItemsConfig)
  .then(insertTransactions)
  .then(function() { return graphResults(Inventory,simulationDates) })
  .then(console.log)
//.then(process.exit)

function insertTransactions() {
  return Promise.mapSeries(simulationDates,createDailyTransactions)
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


function createDailyTransactions(date) {
  return Inventory.items.getItems()
    .then(items => {
      let getConfigPromises = items.map(({ _id }) => (monitor.getItemMonitorConfig({ item: _id.toString() })))
      return Promise.all(getConfigPromises)
    })
    .then(itemsConfig => {
      let saveTransactionsPromises = itemsConfig.map(itemConfig => {
        let { demandMean, demandDeviation } = itemConfig.params[itemConfig.policy]
        let distribution = gaussian(demandMean, demandDeviation)
        let quantity = -Math.floor(distribution.ppf(Math.random()))
        let transaction = factory.createTransaction(itemConfig.item, quantity, date)
        return Inventory.transactions.saveTransaction(transaction)
      })
      return Promise.all(saveTransactionsPromises)
    })
}
