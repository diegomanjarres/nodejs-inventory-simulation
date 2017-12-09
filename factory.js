function newItem(testId, counter) {
  return {
    name: 'testItem ' + testId + ' ' + counter,
    description: 'description',
    minStockReq: 0,
    optStock: 10,
    extIDs: [],
    units: 'kg',
    unitsType: 'mass',
    category: 'category',
    lossCost: 0
  }
}

function newTransaction(itemId, testId, counter, quantity, date ) {
  //quantity = quantity || counter % 2 ? 100 * (1 + counter) : -100 * (1 + counter)
  return {
    item: itemId,
    date,
    quantity,
    description: 'transaction for test: ' + testId + ' number ' + counter,
    type: 'test',
    unitPrice: 100,
    invoiceNumber: testId + ' ' + counter
  }
}

function getDummyTransactions(itemId, testId, n) {
  return [...Array(n)
    .keys()
  ].map(k => (newTransaction(itemId, testId, k)))
}

function createTransaction(itemId, quantity, fakeDate) {
  return newTransaction(itemId, 'any', 0, quantity, fakeDate)
}

function getDummyItems(testId, n) {
  return [...Array(n)
    .keys()
  ].map(k => (newItem(testId, k)))
}

module.exports = { getDummyItems, getDummyTransactions, createTransaction }
