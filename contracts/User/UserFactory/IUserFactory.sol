pragma solidity ^0.4.21;

import "./../IUserContract.sol";
import "./../../Data/IDataContract.sol";
import "./../../Upgradeability/OwnableUpgradeableImplementation/IOwnableUpgradeableImplementation.sol";

contract IUserFactory is IOwnableUpgradeableImplementation {
    event LogCreateUserContract(uint256 generationRatio, uint256 KYCStatus, uint256 lastTransationTime);

    /**
        User Functions
    */
    function createNewUser(address _userAddress, uint256 KYCStatus) public returns(bool success);

    function isUserExisting(address _userAddress) public view returns(bool _isExisting);

    function getUser(address _userAddress) public view returns(IUserContract _userContract);

    /**
        User Creator
    */
    function setUserCreator(address newUserCreator) public;

    function getUserCreator() public view returns(address);

    /**
        Hook Operator    
    */
    function setHookOperatorAddress(address HookOperatorContractAddress) public;

    function getHookOperatorAddress() public view returns(address HookOperatorContractAddress);

    /**
        User Managers
    */
    function setUserManagerAddress(address _HookOperatorServicesAddress) public;

    function getUserManagerContractAddres() public view returns(address userManagerContractAddress);

    /**
        User Factory Upgradability
    */
    function setImplAddress(address _implAddress) public;

    function getImplAddress() public view returns(address _implAddress);

    /**
        KYC Verification Contract
    */
    function setKYCVerificationInstance(address kycVerification) public;

    function getKYCVerificationInstance() public view returns(address);

    /**
        Data Contract
    */
    function setDataContract(address dataContractAddress) public;

    function getDataContract() public view returns(IDataContract dataContractInstance);
}