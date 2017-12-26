const gaussian = require('gaussian')
const factory = require('./factory')

module.exports = function(transaction, params) {
  const {
    overageCost,
    underageCost,
    demandMean,
    demandDeviation,
    cycleDays
  } = params

  const { item, date } = transaction

  var timeDiff = Math.abs(date.getTime() - global.startDate.getTime());
  var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
  if (diffDays % cycleDays == 1) {
    const z = underageCost / (underageCost + overageCost)
    let distribution = gaussian(0, 1)
    const Z = distribution.pdf(z)
    orderSize = cycleDays*(demandMean + Z * demandDeviation)
    let restockTransaction = factory.createTransaction(item, orderSize, date)
    this.Inventory.transactions.saveTransaction(restockTransaction)
  }




}
