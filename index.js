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

let simulationId = 0
var Inventory, monitor
const mongoHost = 'localhost:27017/'




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
    .then(() => insertTransactions(simulationDates))
    .then(() => graphResults(Inventory, simulationDates))
    .then((result) => res.send(result))

}

function setUpNewConnection() {
  let databaseName = ('' + new Date().getTime()).substring(6) + '_' + simulationId
  try{
    mongoose.connect(mongoHost + databaseName).connection.db.dropDatabase()
  } catch (e){
    console.log(e)
  }
  Inventory.connect(mongoHost + databaseName)
  monitor.connect(mongoHost + databaseName)
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
