const WrapperLockEth = artifacts.require("./WrapperLockEth.sol")
const moment = require('moment')
const keccak256 = require('js-sha3').keccak256

contract('WrapperLockEth', function (accounts) {

  it('should be possible to lock up some eth', function () {
    return WrapperLockEth.deployed().then(function(instance) {
      wrap = instance
      return wrap.deposit(100, 10, {from: accounts[0], value: web3.toWei(1, 'ether')})
    }).then(function(response) {
      return wrap.depositLock.call(accounts[0])
    }).then(function(response) {
      assert.equal(response.valueOf(), moment().unix() + 10*60*60, "Lock time incorrect")
      return wrap.balanceOf(accounts[0])
    }).then(function(balance) {
      assert.equal(balance.valueOf(), web3.toWei(1,'ether'), "Incorrect balance")
    })
  })

  it('should be possible to unlock the eth', function () {
    const starting_eth = web3.eth.getBalance(accounts[0]).valueOf()

    return WrapperLockEth.deployed().then(function(instance) {
      wrap = instance
    }).then(function(response) {
      // We generate a signature in order to unlock
      let unlockUntilBlockNum = web3.eth.blockNumber + 10;
      let dataToSign = web3.sha3(accounts[0], web3.toWei(1,'ether'), unlockUntilBlockNum)
      let sig = web3.eth.sign(accounts[0], dataToSign)
      console.log(sig)
      r = sig.substr(0, 66)
      s = '0x' + sig.substr(66, 64)
      v = web3.toDecimal(sig.substr(130, 2)) + 27
      console.log("r: ", r, "s: ", s, "v: ", v);

      // return wrap.withdraw(v, r, s, web3.toWei(1, 'ether'), unlockUntilBlockNum, {from: accounts[0]})
      return wrap.isValidSignature(dataToSign, v, r, s)
    }).then(function(response) {
      assert.equal(response, true, 'Incorrect signature')
      // assert.equal(web3.eth.getBalance(accounts[0]).valueOf(), parseInt(starting_eth) + parseInt(web3.toWei(1, 'ether')), 'Withdrawal failed')
      return wrap.balanceOf(accounts[0])
    }).then(function(balance) {
      assert.equal(balance.valueOf(), 0, "Token balance not updated")
    })
  })

})
