/* global it, contract, artifacts, assert, web3 */
const WrapperLockEth = artifacts.require('./WrapperLockEth.sol')

const {getTime, mineBlock, timeJump} = require('./utils.js')

contract('WrapperLockEth', function (accounts) {
  it('should be possible to lock up some eth', async function () {
    const wrap = await WrapperLockEth.new({from: accounts[0]})
    await wrap.deposit(100, 10, {from: accounts[0], value: web3.toWei(1, 'ether')})
    const durationLocked = await wrap.depositLock.call(accounts[0])
    assert.equal(durationLocked.valueOf(), (await getTime()) + 10 * 60 * 60, 'Lock time incorrect')
    const balance = await wrap.balanceOf(accounts[0])
    assert.equal(balance.valueOf(), web3.toWei(1, 'ether'), 'Incorrect balance')
  })

  it('should be possible to withdraw the ether', async function () {
    const wrap = await WrapperLockEth.new({from: accounts[0]})
    const startimgEth = (await web3.eth.getBalance(accounts[0])).toNumber()
    await wrap.deposit(0, 10, {from: accounts[0], value: web3.toWei(1, 'ether')})
    await timeJump(10 * 60 * 60 + 10)
    await mineBlock()
    await wrap.withdraw(0, 0, 0, web3.toWei(1, 'ether'), 0, {from: accounts[0]})
    const endingEth = (await web3.eth.getBalance(accounts[0])).toNumber()
    assert.equal((await wrap.balanceOf(accounts[0])).valueOf(), 0, 'Wrapper balance not updated')
    assert.approximately(endingEth, startimgEth, startimgEth * 0.001, web3.fromWei(startimgEth - endingEth, 'ether') + 'Ether not returned')
  })

  it('should be possible to unlock the eth', async function () {
    const wrap = await WrapperLockEth.new({from: accounts[0]})
    await wrap.deposit(0, 10, {from: accounts[0], value: web3.toWei(1, 'ether')})
    const starting_eth = (await web3.eth.getBalance(accounts[0])).valueOf()
    let unlockUntilBlockNum = web3.eth.blockNumber + 10
    let dataToSign = await wrap.keccak(accounts[0], parseInt(web3.toWei(1, 'ether')), unlockUntilBlockNum)
    let sig = web3.eth.sign(accounts[0], dataToSign)
    // console.log(sig)
    const r = sig.substr(0, 66)
    const s = '0x' + sig.substr(66, 64)
    const v = web3.toDecimal(sig.substr(130, 2)) + 27
    // console.log('r: ', r, 's: ', s, 'v: ', v)
    await wrap.withdraw(v, r, s, parseInt(web3.toWei(1, 'ether')), unlockUntilBlockNum, {from: accounts[0]})
    assert.equal(await wrap.isValidSignature(dataToSign, v, r, s), true, 'Incorrect signature')
    assert.equal((await wrap.balanceOf(accounts[0])).valueOf(), 0, 'Token balance not updated')
  })
})
