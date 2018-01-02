const NodejsInventory = require('nodejs-inventory')
const gaussian = require('gaussian')
const Q = require('q')
const Promise = require('bluebird')
const express = require('express')
const mongoose = require('mongoose')

const factory = require('./factory')
const Monitor = require('./monitor')
const graphResults = require('./graph-results')
const itemsMonitorConfig = require('./items-monitor-config')

const NEWSBOY = require('./newsboy')
const EOQ = require('./economic-order-quantity')
const QR = require('./lot-size-reorder')
const policies = { NEWSBOY,EOQ,QR }

let simulationId = 0
var Inventory, monitor
const mongoHost = 'localhost:27017/'
let databaseName = ('' + new Date().getTime()).substring(6) + '_'




global.simulationDays = 20
global.startDate = new Date('2018-01-01T00:00:00.000Z')
const millisInDay = 1000 * 60 * 60 * 24

const app = express()
app.use(express.static('public'))
app.get('/simulate/:days', runSimulation)

app.listen(process.env.PORT || 8000)

function runSimulation(req, res, next) {

  simulationId++
  let fakeDate = global.startDate
  let simulationDates = [...Array(parseInt(req.params.days))]
    .map(() => (fakeDate = new Date(fakeDate.getTime() + millisInDay)))
  Inventory = new NodejsInventory()
  monitor = new Monitor(Inventory)
  setUpNewConnection()
  createDummyItems()
    .then(createItemsConfig)
    .then(insertInitialTransactions)
    .then(() => insertTransactions(simulationDates))
    .then(() => graphResults(Inventory, simulationDates))
    .then((result) => res.send(result))

}

function setUpNewConnection() {
  try{
    if (simulationId>1)
      mongoose.connect(mongoHost + databaseName + (simulationId -1)).connection.db.dropDatabase()
  } catch (e){
    console.log(e)
  }
  console.log(databaseName + simulationId);
  Inventory.connect(mongoHost + databaseName + simulationId)
  monitor.connect(mongoHost + databaseName + simulationId)
  Inventory.startMonitor(monitor)
}

function insertTransactions(simulationDates) {
  return Promise.mapSeries(simulationDates, createDailyTransactions)
}


function createDummyItems() {
  const dummyItems = factory.getDummyItems('simulation number ' + simulationId, 3)
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

function insertInitialTransactions(){
  return Inventory.items.getItems()
    .then(items => {
      let getConfigPromises = items.map(({ _id }) => (monitor.getItemMonitorConfig({ item: _id.toString() })))
      return Promise.all(getConfigPromises)
    })
    .then(itemsConfig => {
      let saveTransactionsPromises = itemsConfig.map(itemConfig => {
        let params = itemConfig.params[itemConfig.policy]
        let quantity =policies[itemConfig.policy].getOrderSize(params);
        let transaction = factory.createTransaction(itemConfig.item, quantity, global.startDate)
        return Inventory.transactions.saveTransaction(transaction)
      })
      return Promise.all(saveTransactionsPromises)
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
        let { demandMean, demandDeviation, cycleDays } = itemConfig.params[itemConfig.policy]
        let distribution = gaussian(demandMean, demandDeviation)
        let quantity = -Math.floor(distribution.ppf(Math.random()))
        let dailyDemand = cycleDays?quantity/cycleDays:quantity;
        let transaction = factory.createTransaction(itemConfig.item, dailyDemand, date)
        return Inventory.transactions.saveTransaction(transaction)
      })
      return Promise.all(saveTransactionsPromises)
    })
}
