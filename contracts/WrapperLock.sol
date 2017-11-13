pragma solidity ^0.4.11;

import "./zeppelin/token/ERC20Basic.sol";
import "./zeppelin/token/ERC20Interface.sol";
import "./zeppelin/math/SafeMath.sol";

/*

Copyright Will Harborne (Ethfinex) 2017

*/

contract WrapperLock is ERC20Basic {
    using SafeMath for uint256;


    address private constant ZEROEX_PROXY = 0x8da0D80f5007ef1e431DD2127178d224E32C2eF4;
    mapping (address => bool) private isSigner;

    string public name;
    string public symbol;
    uint public decimals;
    address public originalToken;

    mapping (address => uint256) public depositLock;
    mapping (address => uint256) public balances;

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
        return true;
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
            require(isValidSignature(keccak256(msg.sender, address(this), signatureValidUntilBlock), v, r, s));
            balances[msg.sender] = balances[msg.sender].sub(_value);
            success = ERC20Interface(originalToken).transfer(msg.sender, _value);
        }
        require(success);
    }

    function transfer(address _to, uint256 _value) public returns (bool) {
        return false;
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

    function balanceOf(address _owner) public constant returns (uint256) {
        return balances[_owner];
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
