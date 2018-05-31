pragma solidity ^0.4.21;

import "./../IUserContract.sol";
import "./../UserContract.sol";
import "./../UserContractProxy.sol";
import "./IUserFactory.sol";
import "./../../Data/IDataContract.sol";

import "./../../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./../../Upgradeability/OwnableUpgradeableImplementation/OwnableUpgradeableImplementation.sol";

contract UserFactory is IUserFactory, OwnableUpgradeableImplementation {
    address public implContract;
    address public userManagerServicesAddress;
    address public kycVerificationAddress;
    address public userCreator;
    address public hookOperatorAddress;

    IDataContract public dataContract;

    mapping (address => IUserContract) public users;

    /**
        Modifiers
    */
    modifier onlyNotInitiedUser(address _userAddress) {
        require(users[_userAddress] == address(0));

        _;
    }

    modifier onlyUserManager() {
        require(userManagerServicesAddress == msg.sender);

        _;
    }

    modifier onlyExistingUser(address _userAddress) {
        require(users[_userAddress] != address(0));

        _;
    }

    modifier onlyUserCreator() {
        require(userCreator == msg.sender);

        _;
    }

    /**
        User Functions
    */
    function createNewUser(address _userAddress, uint256 KYCStatus) public onlyUserCreator onlyNotInitiedUser(_userAddress) returns(bool success) {
        require(_userAddress != address(0));

        UserContractProxy proxy = new UserContractProxy(this);
        IUserContract userContract = IUserContract(proxy);

        // Default values when creating new user
        userContract.initUser(0, KYCStatus, 0);
        
        users[_userAddress] = userContract;

        dataContract.add(_userAddress);

        emit LogCreateUserContract(0, KYCStatus, 0);

        return true; 
    }

    function isUserExisting(address _userAddress) public view returns(bool _isExisting) {
        require(_userAddress != address(0));

        return users[_userAddress] != address(0);
    }

    function getUser(address _userAddress) public view onlyExistingUser(_userAddress) returns(IUserContract _userContract) {
        require(_userAddress != address(0));

        return users[_userAddress];
    }

    /**
        User Creator
    */
    function setUserCreator(address newUserCreator) public onlyOwner {
        require(newUserCreator != address(0));

        userCreator = newUserCreator;
    }

    function getUserCreator() public view returns(address) {
        return userCreator;
    }

    /**
        Hook Operator    
    */
    function setHookOperatorAddress(address hookOperatorContractAddress) public onlyOwner {
        require(hookOperatorContractAddress != address(0));

        hookOperatorAddress = hookOperatorContractAddress;
    }

    function getHookOperatorAddress() public view returns(address HookOperatorContractAddress) {
        return hookOperatorAddress;
    }

    /**
        User Managers
    */
    function setUserManagerAddress(address _hookOperatorServicesAddress) public onlyOwner {
        require(_hookOperatorServicesAddress != address(0));

        userManagerServicesAddress = _hookOperatorServicesAddress;
    }

    function getUserManagerContractAddres() public view returns(address userManagerContractAddress) {
        return userManagerServicesAddress;
    }

    /**
        User Factory Upgradability
    */
    function setImplAddress(address _implAddress) public onlyOwner {
        require(_implAddress != address(0));

        implContract = _implAddress;
    }

    function getImplAddress() public view returns(address _implAddress) {
        return implContract;
    }

    /**
        KYC Verification - Get & Set
    */

    function setKYCVerificationInstance(address kycVerification) public onlyOwner {
        require(kycVerification != address(0));

        kycVerificationAddress = kycVerification;
    }

    function getKYCVerificationInstance() public view returns(address) {
        return kycVerificationAddress;
    }

    /**
        Data Contract
    */
    function setDataContract(address dataContractAddress) public onlyOwner {
        require(dataContractAddress != address(0));
        
        dataContract = IDataContract(dataContractAddress);
    }

    function getDataContract() public view returns(IDataContract dataContractInstance) {
        return dataContract;
    }
}