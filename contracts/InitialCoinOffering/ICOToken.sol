pragma solidity ^0.4.21;

import "./../../node_modules/zeppelin-solidity/contracts/token/BurnableToken.sol";
import "./../../node_modules/zeppelin-solidity/contracts/token/MintableToken.sol";
import "./../../node_modules/zeppelin-solidity/contracts/token/PausableToken.sol";

contract ICOToken is BurnableToken, MintableToken, PausableToken {

    string public constant name = "IRIS AI Token";
    string public constant symbol = "AIUR";
    uint8 public constant decimals = 18;

    function ICOToken() public {
    }
}