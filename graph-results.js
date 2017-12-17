const Promise = require('bluebird')

const millisInDay = 1000 * 60 * 60 * 24
module.exports = function(Inventory, simulationDates) {
  return Inventory.items.getItems()
    .then(items => {
      return Promise.mapSeries(items, (item) => {
        return Promise.mapSeries(simulationDates, (date) => {
          return Inventory.inventory.getItemStockLevel({ item: item._id, date })
        })
      })
    })
}
