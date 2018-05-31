pragma solidity ^0.4.21;

contract INotInitedOwnable {
    
    function init() public;
    
    function transferOwnership(address newOwner) public;
}