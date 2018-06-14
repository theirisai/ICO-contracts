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
    address public userManagerAddress;
    address public kycVerificationAddress;
    address public userCreator;
    address public hookOperatorAddress;

    IDataContract public dataContract;

    address[] public users;
    mapping (address => IUserContract) public usersContracts;

    /**
        Modifiers
    */
    modifier onlyNotInitedUser(address _userAddress) {
        require(usersContracts[_userAddress] == address(0));

        _;
    }

    modifier onlyUserManager() {
        require(userManagerAddress == msg.sender);

        _;
    }

    modifier onlyExistingUser(address _userAddress) {
        require(usersContracts[_userAddress] != address(0));

        _;
    }

    modifier onlyUserCreator() {
        require(userCreator == msg.sender);

        _;
    }

    /**
        User Functions
    */
    function createExchangeUser(address _exchangeUserAddress, uint256 _KYCStatus) external onlyUserCreator returns(bool _success) {
        IUserContract userContract = createUserContract(_exchangeUserAddress);

        userContract.initExchangeUser(_KYCStatus);

        emit LogExchangeUserCreation(_exchangeUserAddress, _KYCStatus);

        return true; 
    }

    function createNewUser(address _userAddress, uint256 _KYCStatus) external onlyUserCreator returns(bool _success) {
        IUserContract userContract = createUserContract(_userAddress);

        userContract.initKYCUser(_KYCStatus);

        emit LogUserContractCreation(_userAddress, _KYCStatus);

        return true; 
    }

    function createUserContract(address _newUserAddress) internal onlyNotInitedUser(_newUserAddress) returns(IUserContract) {
        require(_newUserAddress != address(0));

        UserContractProxy proxy = new UserContractProxy(this);
        IUserContract userContract = IUserContract(proxy);

        usersContracts[_newUserAddress] = userContract;
        
        users.push(_newUserAddress);
        dataContract.add(_newUserAddress);

        return userContract;
    }

    function isUserExisting(address _userAddress) external view returns(bool _isExisting) {
        require(_userAddress != address(0));

        return usersContracts[_userAddress] != address(0);
    }

    function getUserById(uint _userId) external view returns(address _userAddress) {
        return users[_userId];
    }

    function getUserContract(address _userAddress) external view onlyExistingUser(_userAddress) returns(IUserContract _userContract) {
        require(_userAddress != address(0));

        return usersContracts[_userAddress];
    }

    /**
        User Creator
    */
    function setUserCreator(address _newUserCreator) external onlyOwner {
        require(_newUserCreator != address(0));

        userCreator = _newUserCreator;
    }

    function getUserCreator() external view returns(address) {
        return userCreator;
    }

    /**
        Hook Operator    
    */
    function setHookOperatorAddress(address _hookOperatorContractAddress) external onlyOwner {
        require(_hookOperatorContractAddress != address(0));

        hookOperatorAddress = _hookOperatorContractAddress;
    }

    function getHookOperatorAddress() external view returns(address _hookOperatorContractAddress) {
        return hookOperatorAddress;
    }

    /**
        User Managers
    */
    function setUserManagerAddress(address _userManagerContractAddress) external onlyOwner {
        require(_userManagerContractAddress != address(0));

        userManagerAddress = _userManagerContractAddress;
    }

    function getUserManagerContractAddress() external view returns(address _userManagerContractAddress) {
        return userManagerAddress;
    }

    /**
        User Factory Upgradeability
    */
    function setImplAddress(address _implAddress) external onlyOwner {
        require(_implAddress != address(0));

        implContract = _implAddress;
    }

    function getImplAddress() external view returns(address _implAddress) {
        return implContract;
    }

    /**
        KYC Verification - Get & Set
    */

    function setKYCVerificationInstance(address _kycVerification) external onlyOwner {
        require(_kycVerification != address(0));

        kycVerificationAddress = _kycVerification;
    }

    function getKYCVerificationInstance() external view returns(address) {
        return kycVerificationAddress;
    }

    /**
        Data Contract
    */
    function setDataContract(address _dataContractAddress) external onlyOwner {
        require(_dataContractAddress != address(0));
        
        dataContract = IDataContract(_dataContractAddress);
    }

    function getDataContract() external view returns(IDataContract _dataContractInstance) {
        return dataContract;
    }
}