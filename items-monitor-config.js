module.exports = [{
    policy: 'EOQ',
    params: {
      EOQ: {
        demandMean: 10,
        demandDeviation: 1,
        leadTime: 2,
        setupCost: 300,
        proportionalCost: 4,
        holdingCost: 1
      }
    }
  },
  {
    policy: 'NEWSBOY',
    params: {
      NEWSBOY: {
        demandMean: 50,
        demandDeviation: 5,
        overageCost: 20,
        underageCost: 35,
        cycleDays: 7
      }
    }
  },
  {
    policy: 'QR',
    params: {
      QR: {
        demandMean: 100,
        cycleDays:10,
        demandDeviation: 10,
        leadTime: 3,
        setupCost: 5,
        holdingCost: 1,
        proportionalCost: 3,
        shortageCost: 3
      }
    }
  },
]

// const params = {
//   demandMean: 336,
//   cycleDays: 365,
//   demandDeviation: 27.712812921102035,
//   leadTime: 98,
//   setupCost: 15,
//   holdingCost: 1.8,
//   proportionalCost: 6,
//   shortageCost: 10
// }
