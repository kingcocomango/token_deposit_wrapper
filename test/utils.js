/* global web3 */
const mineBlock = function () {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method: 'evm_mine'
    }, (err, result) => {
      if (err) { return reject(err) }
      return resolve(result)
    })
  })
}

const timeJump = function (time) {
  return new Promise((resolve, reject) => {
    // const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:9545')) // Hardcoded development port
    // console.log(web3.currentProvider)
    web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      params: [time], // 86400 is num seconds in day
      id: new Date().getTime()
    }, (err, result) => {
      if (err) { return reject(err) }
      return resolve(result)
    })
  })
}

const getTime = function () {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method: 'eth_getBlockByHash',
      params: ['latest', true] // 86400 is num seconds in day
    }, (err, result) => {
      if (err) { return reject(err) }
      return resolve(parseInt(result.result.timestamp, 16))
    })
  })
}

module.exports = {getTime, timeJump, mineBlock}
