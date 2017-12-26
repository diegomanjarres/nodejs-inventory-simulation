module.exports = [{
    policy: 'EOQ',
    params: {
      EOQ: {
        demandMean: 100,
        demandDeviation: 10,
        leadTime: 2,
        setupCost: 800,
        proportionalCost: 4,
        holdingCost: 1
      }
    }
  },
  {
    policy: 'NEWSBOY',
    params: {
      NEWSBOY: {
        demandMean: 100,
        demandDeviation: 10,
        overageCost: 20,
        underageCost: 50,
        cycleDays: 7
      }
    }
  },
  {
    policy: 'QR',
    params: {
      QR: {
        demandMean: 100,
        cycleDays:7,
        demandDeviation: 10,
        leadTime: 2,
        setupCost: 3,
        holdingCost: 1,
        proportionalCost: 4,
        shortageCost: 1
      }
    }
  },
]
