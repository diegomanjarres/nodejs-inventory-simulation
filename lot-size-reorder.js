const factory = require('./factory')
const lotSizeReorder = require('./lotSizeReorder')
const Promise = require('bluebird')


function check(transaction, params) {

  const { Qn, Rn } = lotSizeReorder(params)
  // console.log(Qn,Rn);
  const { item, date } = transaction
  const millisInDay = 1000 * 60 * 60 * 24
  this.Inventory.orders
    .getItemsActiveOrders(null, [item], date)
    .then(orders => {
      let makeOrdersEffectivePromises = orders.map(order => {
        if (order.transaction.date.getTime() === date.getTime())
          return this.Inventory.orders.makeOrderEffective(null, order._id)
      })
      return Promise.all(makeOrdersEffectivePromises)
    })
    .then(() => {
      return this.Inventory.inventory
        .getItemStockPosition({ item, date })
    })
    .then(stockPosition => {
      if (stockPosition <= Rn) {
        // console.log(date,' ',stockPosition);
        const expectedDate = new Date(date.getTime() + millisInDay * params.leadTime)
        let restockTransaction = factory.createTransaction(item, Math.floor(Qn), expectedDate)
        let order = {
          orderCost: params.setupCost,
          issueDate: date,
          transaction: restockTransaction
        }
        this.Inventory.orders.saveOrder(order)
      }
    })
}

function getOrderSize(params) {
  const { Qn, Rn } = lotSizeReorder(params)

  return Math.floor(Rn)
}

module.exports = { check, getOrderSize }
