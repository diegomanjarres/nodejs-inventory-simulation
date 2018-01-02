const factory = require('./factory')

function check(transaction, params) {
  const { item, date } = transaction

  this.Inventory.inventory
    .getItemStockLevel({ item, date })
    .then(stockLevel => {
      if (stockLevel <= 0) {
        let restockTransaction = factory.createTransaction(item, getOrderSize(params), date)
        this.Inventory.transactions.saveTransaction(restockTransaction)
      }
    })
}

function getOrderSize(params) {
  const {
    demandMean,
    setupCost,
    holdingCost,
  } = params
  let orderSize = Math.sqrt(2 * setupCost * demandMean / holdingCost)
  
  return Math.floor(orderSize)
}

module.exports = { check, getOrderSize }
