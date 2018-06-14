pragma solidity ^0.4.21;

import { LinkedList } from "./LinkedList.sol";
import "./ILinkedListContract.sol";
import "./../UserManager/IUserManager.sol";
import "./../../contracts/Ownership/NotInitedOwnable.sol";

contract LinkedListContract is ILinkedListContract, NotInitedOwnable {
    address public userManager;
    address public userFactory;

    using LinkedList for LinkedList.Data;
    LinkedList.Data linkedListData;

    modifier onlyUserManager() {
        require(userManager == msg.sender);
        
        _;
    }

    modifier onlyUserFactory() {
        require(userFactory == msg.sender);
        
        _;
    }

    function setUserManager(address userManagerAddress) external onlyOwner {
        require(userManagerAddress != address(0));

        userManager = userManagerAddress;
    }

    function getUserManager() external view returns(address) {
        return userManager;
    }

    function setUserFactory(address userFactoryAddress) external onlyOwner {
        require(userFactoryAddress != address(0));

        userFactory = userFactoryAddress;
    }

    function getUserFactory() external view returns(address) {
        return userFactory;
    }

    function isSingleNodeList() external view returns(bool) {
        return linkedListData.isSingleNodeList();
    }

    function add(address userAddress) external onlyUserFactory {
        linkedListData.add(userAddress);

        emit LogUserAdd(userAddress);
    }

    function moveToEnd(address userAddress) external onlyUserManager {
        linkedListData.moveToEnd(userAddress);

        emit LogUserMove(userAddress);
    }

    function peek(address userAddress) external view returns(address) {
        require(userAddress != address(0));
        
        return linkedListData.nodes[userAddress].nodeValue;
    }

    function getHead() external view returns(address) {
        return linkedListData.head;
    }

    function getTail() external view returns(address) {
        return linkedListData.tail; 
    }

    function getLinkedListLength() external view returns (uint256) {
        return linkedListData.linkedListLength;
    }

    function getNodeData(address nodeAddress) external view returns(address data, address previousNode, address nextNode) {
        require(nodeAddress != address(0));
        
        return (linkedListData.nodes[nodeAddress].nodeValue, linkedListData.nodes[nodeAddress].previousNode, linkedListData.nodes[nodeAddress].nextNode);
    }
}