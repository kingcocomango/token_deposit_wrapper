pragma solidity ^0.4.11;

import './zeppelin/token/BasicToken.sol';
import './zeppelin/token/ERC20Interface.sol';

/*

Copyright Will Harborne (Ethfinex) 2017

*/

contract WrapperLockEth is BasicToken {

  address ZEROEX_PROXY = 0x8da0d80f5007ef1e431dd2127178d224e32c2ef4;
  address ETHFINEX;

  string public name;
  string public symbol;
  uint public decimals;
  address public originalToken = 0x00;

  mapping (address => uint) public depositLock;

  function WrapperLockEth(string _name, string _symbol, uint _decimals) {
    name = _name;
    symbol = _symbol;
    decimals = _decimals;
    ETHFINEX = msg.sender;
  }

  function deposit(uint _value, uint _forTime) payable returns (bool success) {
    require (_forTime >= 1);
    require (now + _forTime * 1 hours >= depositLock[msg.sender]);
    balances[msg.sender] = balances[msg.sender].add(msg.value);
    depositLock[msg.sender] = now + _forTime * 1 hours;
    return true;
  }

  function withdraw(uint8 v, bytes32 r, bytes32 s, uint _value, uint signatureValidUntilBlock) returns (bool success) {
    require(balanceOf(msg.sender) >= _value);
    if (now > depositLock[msg.sender]){
      balances[msg.sender] = balances[msg.sender].sub(_value);
      msg.sender.transfer(_value);
    }
    else {
      require(block.number < signatureValidUntilBlock);
      require(isValidSignature(ETHFINEX, keccak256(msg.sender, _value, signatureValidUntilBlock), v, r, s));
      balances[msg.sender] = balances[msg.sender].sub(_value);
      msg.sender.transfer(_value);
    }
  }

  function transferFrom(address _from, address _to, uint _value) {
    assert(msg.sender == ZEROEX_PROXY);
    balances[_to] = balances[_to].add(_value);
    balances[_from] = balances[_from].sub(_value);
    Transfer(_from, _to, _value);
  }

  function allowance(address owner, address spender) returns (uint) {
    if(spender == ZEROEX_PROXY) {
      return 2**256 - 1;
    }
  }

  function isValidSignature(
        address signer,
        bytes32 hash,
        uint8 v,
        bytes32 r,
        bytes32 s)
        public
        constant
        returns (bool)
    {
        return signer == ecrecover(
            keccak256("\x19Ethereum Signed Message:\n32", hash),
            v,
            r,
            s
        );
    }

}
