const factory = require('./factory')

module.exports = function(transaction, params) {
  const {
    demandMean,
    demandDeviation,
    leadTime,
    setupCost,
    proportionalCost,
    holdingCost,
  } = params

  const { item, date } = transaction

  this.Inventory.inventory
    .getItemStockLevel({item, date})
    .then(stockLevel=>{
      if(stockLevel<=0){
        console.log('stockLevelEOQ ',date, ' ',stockLevel);
        let orderSize = Math.sqrt(2*setupCost*demandMean/holdingCost)
        orderSize = Math.floor(orderSize)
        let restockTransaction = factory.createTransaction(item, orderSize, date)
        this.Inventory.transactions.saveTransaction(restockTransaction)
      }
    })
}
