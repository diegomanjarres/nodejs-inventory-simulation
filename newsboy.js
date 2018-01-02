const gaussian = require('gaussian')
const factory = require('./factory')

function check(transaction, params) {
  const { cycleDays } = params
  const { item, date } = transaction

  var timeDiff = Math.abs(date.getTime() - global.startDate.getTime());
  var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

  if (diffDays % cycleDays == 0) {
    this.Inventory.inventory
      .getItemStockLevel({ item, date })
      .then(stockLevel => {
        if(stockLevel!==getOrderSize(params)){          
        console.log(diffDays,cycleDays,-stockLevel);
        let dropStockTransaction = factory.createTransaction(item, -stockLevel, date)
        this.Inventory.transactions.saveTransaction(dropStockTransaction)
      }
      })
    let restockTransaction = factory.createTransaction(item, getOrderSize(params), date)
    this.Inventory.transactions.saveTransaction(restockTransaction)
  }
}

function getOrderSize(params) {
  const {
    overageCost,
    underageCost,
    demandMean,
    demandDeviation,
    cycleDays
  } = params

  const z = underageCost / (underageCost + overageCost)
  let distribution = gaussian(0, 1)
  const Z = distribution.pdf(z)
  let orderSize = cycleDays * (demandMean / cycleDays + Z * demandDeviation)
  return Math.floor(orderSize)
}

module.exports = { check, getOrderSize }
