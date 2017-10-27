/* global it, contract, artifacts, assert, web3 */
const WrapperLock = artifacts.require('./WrapperLock.sol')
const TestToken = artifacts.require('./TestToken.sol')

const {getTime, mineBlock, timeJump} = require('./utils.js')

contract('WrapperLock', function (accounts) {
  it('should be possible to lock up some test token', async function () {
    const test = await TestToken.new()
    const wrap = await WrapperLock.new(test.address, 'tst lock', 'lTST', 18)
    await test.approve(wrap.address, 100)
    await wrap.deposit(100, 10, {from: accounts[0]})
    const durationLocked = await wrap.depositLock.call(accounts[0])
    assert.equal(durationLocked.valueOf(), (await getTime()) + 10 * 60 * 60, 'Lock time incorrect')
    const balance = await wrap.balanceOf(accounts[0])
    assert.equal(balance.toNumber(), 100, 'Incorrect balance')
  })

  it('generates valid signatures', async function () {
    const wrap = await WrapperLock.deployed()
    let dataToSign = await wrap.keccak(accounts[0], 1, 1)
    let sig = web3.eth.sign(accounts[0], dataToSign)
    console.log(accounts[0])
    const r = sig.substr(0, 66)
    const s = '0x' + sig.substr(66, 64)
    const v = web3.toDecimal(sig.substr(130, 2)) + 27
    assert.equal(await wrap.isValidSignature(dataToSign, v, r, s), true, 'Incorrect signature')
    // assert.equal(await wrap.keccak(accounts[0], 1, 1), web3.sha3(accounts[0], 1, 1), 'web3.sha3 did not match keccak')
    // web3.sha3 and keccack256 aren't matching up
  })

  it('should be possible to withdraw the tokens', async function () {
    const test = await TestToken.new({from: accounts[0]})
    const wrap = await WrapperLock.new(test.address, 'tst lock', 'lTST', 18, {from: accounts[0]})
    await test.approve(wrap.address, 100, {from: accounts[0]})
    await wrap.deposit(100, 10, {from: accounts[0]})
    const startingToken = (await test.balanceOf(accounts[0])).toNumber()
    await timeJump(10 * 60 * 60 + 10)
    await mineBlock()
    await wrap.withdraw(0, 0, 0, 100, 0, {from: accounts[0]})
    assert.equal((await wrap.balanceOf(accounts[0])).valueOf(), 0, 'Token balance not updated')
    assert.equal((await test.balanceOf(accounts[0])).valueOf(), 100 + startingToken)
  })

  it('should be possible to unlock the tokens', async function () {
    const test = await TestToken.new({from: accounts[0]})
    const wrap = await WrapperLock.new(test.address, 'tst lock', 'lTST', 18, {from: accounts[0]})
    await test.approve(wrap.address, 100, {from: accounts[0]})
    await wrap.deposit(100, 10, {from: accounts[0]})
    const startingToken = (await test.balanceOf(accounts[0])).toNumber()
    const unlockUntilBlockNum = web3.eth.blockNumber + 100
    let dataToSign = await wrap.keccak(accounts[0], 100, unlockUntilBlockNum)
    let sig = web3.eth.sign(accounts[0], dataToSign)
    // console.log(sig)
    const r = sig.substr(0, 66)
    const s = '0x' + sig.substr(66, 64)
    const v = web3.toDecimal(sig.substr(130, 2)) + 27
    // console.log('r: ', r, 's: ', s, 'v: ', v)
    await wrap.withdraw(v, r, s, 100, unlockUntilBlockNum, {from: accounts[0]})
    assert.equal((await wrap.balanceOf(accounts[0])).valueOf(), 0, 'Token balance not updated')
    assert.equal((await test.balanceOf(accounts[0])).valueOf(), 100 + startingToken)
  })
})
