pragma solidity ^0.4.21;

import "../../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";

contract WhitelistedCrowdsale is Ownable {

    /*
        We need a count limit for the users array, 
        which is passed to setMultiplePreSalesSpecialUsers function

        Without the limit, the set could be so big that the transaction required gas is over the block maximum gas
        The count is calculated on:
            How much gas it costs to process one user
            The maximum gas is 5 000 000
    */
    uint public constant MAX_INPUT_USERS_COUNT = 200;

    mapping(address => uint) public preSalesSpecialUsers;

    mapping(address => bool) public publicSalesSpecialUsers;

    address public lister;

    event LogPresalesSpecialUserSet(address userAddress, uint userRate);
    event LogPresalesSpecialUsersSet(address[] userAddresses, uint userRate);
    event LogPublicsalesSpecialUserAdd(address addedUser);
    event LogPublicsalesSpecialUserRemove(address removedUser);

    modifier onlyLister() {
        require(msg.sender == lister);
        
        _;
    }

    modifier notZeroAddress(address addressForValidation) {
        require(addressForValidation != address(0));

        _;
    }

    function setPreSalesSpecialUser(address user, uint userRate) external onlyLister notZeroAddress(user) {
        preSalesSpecialUsers[user] = userRate;

        emit LogPresalesSpecialUserSet(user, userRate);
    }

    function setMultiplePreSalesSpecialUsers(address[] users, uint userRate) external onlyLister {
        require(users.length <= MAX_INPUT_USERS_COUNT);

        for(uint i = 0; i < users.length; i++) { 
            preSalesSpecialUsers[users[i]] = userRate;
        }

        emit LogPresalesSpecialUsersSet(users, userRate);
    }

    function addPublicSalesSpecialUser(address user) external onlyLister notZeroAddress(user) {
        publicSalesSpecialUsers[user] = true;

        emit LogPublicsalesSpecialUserAdd(user);
    }

    function removePublicSalesSpecialUser(address user) external onlyLister notZeroAddress(user) {
        publicSalesSpecialUsers[user] = false;

        emit LogPublicsalesSpecialUserRemove(user);
    }

    function setLister(address newLister) public onlyOwner notZeroAddress(newLister) {
        lister = newLister;
    }
}