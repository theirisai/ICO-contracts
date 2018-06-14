pragma solidity ^0.4.21;

contract ILinkedListContract {

    event LogUserAdd(address userAddress);
    event LogUserMove(address userAddress);

    function setUserFactory(address userFactoryAddress) external;
    function getUserFactory() external view returns(address);

    function setUserManager(address userManagerAddress) external;
    function getUserManager() external view returns(address);    

    function isSingleNodeList() external view returns(bool);
    
    function add(address userAddress) external;

    function moveToEnd(address userAddress) external;

    function peek(address userAddress) external view returns(address);

    function getHead() external view returns(address);

    function getTail() external view returns(address);

    function getLinkedListLength() external view returns (uint256);

    function getNodeData(address nodeAddress) external view returns(address data, address previousNode, address nextNode);
}