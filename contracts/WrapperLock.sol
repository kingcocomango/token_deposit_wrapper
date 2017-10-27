pragma solidity ^0.4.11;

import "./zeppelin/token/BasicToken.sol";
import "./zeppelin/token/ERC20Interface.sol";

/*

Copyright Will Harborne (Ethfinex) 2017

*/

contract WrapperLock is BasicToken {

    address private constant ZEROEX_PROXY = 0x8da0d80f5007ef1e431dd2127178d224e32c2ef4;
    mapping (address => bool) private isSigner;

    string public name;
    string public symbol;
    uint public decimals;
    address public originalToken;

    mapping (address => uint) public depositLock;

    function WrapperLock(address _originalToken, string _name, string _symbol, uint _decimals) {
        originalToken = _originalToken;
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        isSigner[msg.sender] = true;
    }

    function deposit(uint _value, uint _forTime) public returns (bool success) {
        require(_forTime >= 1);
        require(now + _forTime * 1 hours >= depositLock[msg.sender]);
        require(ERC20Interface(originalToken).transferFrom(msg.sender, this, _value));
        balances[msg.sender] = balances[msg.sender].add(_value);
        depositLock[msg.sender] = now + _forTime * 1 hours;
    }

    function withdraw(
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint _value,
        uint signatureValidUntilBlock
    )
        public
        returns
        (bool success)
    {
        require(balanceOf(msg.sender) >= _value);
        if (now > depositLock[msg.sender]) {
            balances[msg.sender] = balances[msg.sender].sub(_value);
            success = ERC20Interface(originalToken).transfer(msg.sender, _value);
        } else {
            require(block.number < signatureValidUntilBlock);
            require(isValidSignature(keccak256(msg.sender, _value, signatureValidUntilBlock), v, r, s));
            balances[msg.sender] = balances[msg.sender].sub(_value);
            success = ERC20Interface(originalToken).transfer(msg.sender, _value);
        }
        require(success);
    }

    function transferFrom(address _from, address _to, uint _value) public {
        assert(msg.sender == ZEROEX_PROXY);
        balances[_to] = balances[_to].add(_value);
        balances[_from] = balances[_from].sub(_value);
        Transfer(_from, _to, _value);
    }

    function allowance(address _owner, address _spender) public constant returns (uint) {
        if (_spender == ZEROEX_PROXY) {
            return 2**256 - 1;
        }
    }

    function isValidSignature(
        bytes32 hash,
        uint8 v,
        bytes32 r,
        bytes32 s
    )
        public
        constant
        returns (bool)
    {
        return isSigner[ecrecover(
            keccak256("\x19Ethereum Signed Message:\n32", hash),
            v,
            r,
            s
        )];
    }

    function addSigner(address _newSigner) public {
        require(isSigner[msg.sender]);
        isSigner[_newSigner] = true;
    }

    function keccak(address _sender, uint _value, uint _validTill) public constant returns(bytes32) {
        return keccak256(_sender, _value, _validTill);
    }

}
