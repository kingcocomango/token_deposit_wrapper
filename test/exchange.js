/* global it, contract, artifacts, assert, web3 */
const TokenTransferProxy = artifacts.require('./TokenTransferProxy.sol')
const Exchange = artifacts.require('./Exchange.sol')
const WrapperLock = artifacts.require('./WrapperLock.sol')
const TestToken = artifacts.require('./TestToken.sol')

// const {getTime, mineBlock, timeJump, solSha3} = require('./utils.js')

contract('Exchange', function (accounts) {
  it('set up the modified 0x exchange and proxy', async function () {
    const proxy = await TokenTransferProxy.new()
    const exchange = await Exchange.new(0x0000000000000000000000000000000000000000, proxy.address)
    await proxy.initTokenTransferProxy(exchange.address)
    const test = await TestToken.new()
    const wrap = await WrapperLock.new(test.address, 'tst lock', 'lTST', 18, proxy.address)
    await test.approve(wrap.address, 100)
    await wrap.deposit(100, 100, {from: accounts[0]})
    const balance = await wrap.balanceOf(accounts[0])
    assert.equal(balance.toNumber(), 100, 'Incorrect balance')
    const proxyAllowance = await wrap.allowance(accounts[0], proxy.address)
    assert.equal(proxyAllowance, 2 ** 256 - 1, 'Proxy not approved')
    const otherAllowance = await wrap.allowance(accounts[0], accounts[5])
    assert.equal(otherAllowance, 0, 'Other account can transfer!')
  })
})
