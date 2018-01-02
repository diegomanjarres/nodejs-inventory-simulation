const gaussian = require('gaussian')
const distribution = gaussian(0, 1)

function lotSizeReorder(params) {
  const {
    demandMean,
    cycleDays,
    demandDeviation,
    leadTime,
    setupCost,
    holdingCost,
    proportionalCost,
    shortageCost,
  } = params

  const leadTimeExpextedDemmand = demandMean * leadTime / cycleDays
  const leadTimeDeviation = Math.sqrt(demandDeviation * demandDeviation * leadTime / cycleDays)
  const Q0 = Math.sqrt(2 * setupCost * demandMean / holdingCost)


  let Rn = leadTimeExpextedDemmand + getZ(Q0, params) * leadTimeDeviation
  while (true) {
    let Qn = getQn(leadTimeDeviation, leadTimeExpextedDemmand, Rn, params)
    let RnPlusOne= leadTimeExpextedDemmand + getZ(Qn, params) * leadTimeDeviation
    if(Math.abs(RnPlusOne-Rn) < 1)return {Rn,Qn}
    Rn = RnPlusOne
  }

}

function getZ(Q, { holdingCost, shortageCost, demandMean }) {
  return distribution.ppf(1 - Q * holdingCost / (shortageCost * demandMean))
}

function getQn(leadTimeDeviation, leadTimeExpextedDemmand, Rn, { demandMean, setupCost, shortageCost, holdingCost }) {
  let z = (Rn - leadTimeExpextedDemmand) / leadTimeDeviation
  let Lz = distribution.pdf(z) - z * (1 - distribution.cdf(z))

  const nR = leadTimeDeviation * Lz
  return Math.sqrt(2 * demandMean * (setupCost + shortageCost * nR) / holdingCost)
}

module.exports= lotSizeReorder
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
// lotSizeReorder(params)
