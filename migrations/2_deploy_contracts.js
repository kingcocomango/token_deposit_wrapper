var WrapperLockEth = artifacts.require('./WrapperLockEth.sol')
var WrapperLock = artifacts.require('./WrapperLock.sol')
var TestToken = artifacts.require('./TestToken.sol')

module.exports = function (deployer) {
  deployer.deploy(WrapperLockEth, 'eth lock', 'lETH', 18)
  deployer.deploy(TestToken)
  .then(function () {
    return deployer.deploy(WrapperLock, TestToken.address, 'tst lock', 'lTST', 18)
  })
}
