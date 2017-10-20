pragma solidity ^0.4.11;

import './zeppelin/token/StandardToken.sol';

contract TestToken is StandardToken {

    /*
    *  Token meta data
    */
    string constant public name = "Test Token";
    string constant public symbol = "TEST";
    uint8 constant public decimals = 18;
    uint public totalSupply = 10**27; // 1 billion tokens, 18 decimal places

    function TestToken() {
        balances[msg.sender] = totalSupply;
    }
}
