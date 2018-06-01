pragma solidity ^0.4.21;

import "./../Upgradeability/OwnableUpgradeableImplementation/IOwnableUpgradeableImplementation.sol";
import "./../User/IUserContract.sol";

contract IUserManager is IOwnableUpgradeableImplementation {

    /**
        Data Contract
    */
    function setDataContract(address _dataContractAddress) public;

    function getDataContractAddress() public view returns(address _dataContractAddress);

    function setTaxPercentage(uint256 _taxPercentage) public;

    function setTaxationPeriod(uint256 _taxationPeriod) public;

    /**
        User Factory
    */
    function setUserFactoryContract(address _userFactoryContract) public;

    function getUserFactoryContractAddress() public view returns(address _userFactoryContractAddress);
    /**
        Hook Operator
    */
    function setHookOperatorContract(address _HookOperatorContract) public;

    function getHookOperatorContractAddress() public view returns(address _HookOperatorContractAddress);
    
    /**
        Users Functions
    */

    function isUserKYCVerified(address _userAddress) public view returns(uint256 KYCStatus);

    function isBlacklisted(address _userAddress) public view returns(bool _isBlacklisted);

    function isBannedUser(address userAddress) public view returns(bool _isBannedUser);

    function updateGenerationRatio(uint256 _generationRatio, address userContractAddress) public;

    function updateLastTransactionTime(address _userAddress) public;

    function getUserContractAddress(address _userAddress) public view returns(IUserContract _userContract);

    function isUserPolicyCorrect(address userAddress) public view returns(bool);
}