pragma solidity ^0.4.21;

contract ILinkedListContract {

    function setUserFactory(address userFactoryAddress) public;
    function getUserFactory() public view returns(address);

    function setUserManager(address userManagerAddress) public;
    function getUserManager() public view returns(address);    

    function isSingleNodeList() public view returns(bool);
    
    function add(address userAddress) public;

    function moveToEnd(address userAddress) public;

    function peek(address userAddress) public view returns(address);

    function getHead() public view returns(address);

    function getTail() public view returns(address);

    function getLinkedListLength() public view returns (uint256);

    function getNodeData(address nodeAddress) public view returns(address data, address previousNode, address nextNode);
}