pragma solidity ^0.4.11;

import './zeppelin/token/BasicToken.sol'
import './zeppelin/token/ERC20Interface.sol'

/*

Copyright Will Harborne (Ethfinex) 2017

*/

contract WrapperLock is BasicToken {

  address ZEROEX_PROXY;
  address ETHFINEX;

  string public name;
  string public symbol;
  uint public decimals;
  address public originalToken;

  mapping (address => uint) depositLock;

  function WrapperLock(address _originalToken, string _name, string _symbol, uint _decimals) {
    originalToken = _originalToken;
    name = _name;
    symbol = _symbol;
    decimals = _decimals;
  }

  function deposit(uint _value) returns (bool success) {
    success = ERC20Interface(originalToken).transferFrom(msg.sender, this, _value);
    if(success) {
      balances[msg.sender] = balances[msg.sender].add(_value);
      depositLock[msg.sender] = now + 3 hours;
    }
  }

  function withdraw(uint8 v, bytes32 r, bytes32 s, uint _value, uint signatureValidUntilBlock) returns (bool success) {
    require(balanceOf(msg.sender) >= _value);
    if (now > depositLock[msg.sender]){
      balances[msg.sender] = balances[msg.sender].sub(_value);
      success = ERC20Interface(originalToken).transfer(msg.sender, _value);
    }
    else {
      require(block.number < signatureValidUntilBlock);
      require(isValidSignature(ETHFINEX, keccak256(msg.sender, _value, signatureValidUntilBlock), v, r, s));
      balances[msg.sender] = balances[msg.sender].sub(_value);
      success = ERC20Interface(originalToken).transfer(msg.sender, _value);
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
      return 2**256 - 1
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
