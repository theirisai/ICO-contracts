pragma solidity ^0.4.21;

import "./../User/UserContractProxy.sol";
import "./../User/IUserContract.sol";
import "./../User/UserFactory/IUserFactory.sol";
import "./../Data/IDataContract.sol";
import "./IUserManager.sol";
import "./../Upgradeability/OwnableUpgradeableImplementation/OwnableUpgradeableImplementation.sol";
import "./../../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";
import "./../HookOperator/IHookOperator.sol";

contract UserManager is IUserManager, OwnableUpgradeableImplementation {
    using SafeMath for uint256;

    IDataContract public dataContract;
    IUserFactory public userFactoryContract;
    address public hookOperatorContract;
    address public crowdsaleContract;

    /**
        Modifiers
    */
    modifier onlyHookOperator() {
        require(hookOperatorContract == msg.sender);
        _;
    }

    modifier onlyCrowdsale() {
        require(crowdsaleContract == msg.sender);
        _;
    }

    /**
        Data Contract
    */
    function setDataContract(address _dataContractAddress) public onlyOwner {
        require(_dataContractAddress != address(0));
        
        dataContract = IDataContract(_dataContractAddress);

        emit LogSetDataContract(_dataContractAddress);
    }

    function getDataContractAddress() public view returns(address _dataContractAddress) {
        return address(dataContract);
    }

    function setTaxPercentage(uint256 _taxPercentage) public onlyOwner {
        dataContract.setTaxPercentage(_taxPercentage);

        emit LogSetTaxPercentage(_taxPercentage);
    }

    function setTaxationPeriod(uint256 _taxationPeriod) public onlyOwner {
        dataContract.setTaxationPeriodInSeconds(_taxationPeriod);

        emit LogSetTaxationPeriod(_taxationPeriod);
    }

    /**
        User Factory
    */
    function setUserFactoryContract(address _userFactoryContract) public onlyOwner {
        require(_userFactoryContract != address(0));

        userFactoryContract = IUserFactory(_userFactoryContract);

        emit LogSetUserFactoryContract(_userFactoryContract);
    }

    function getUserFactoryContractAddress() public view returns(address _userFactoryContractAddress) {
        return address(userFactoryContract);
    }

    /**
        Hook Operator
    */
    function setHookOperatorContract(address _hookOperatorContract) public onlyOwner {
        require(_hookOperatorContract != address(0));

        hookOperatorContract = _hookOperatorContract;

        emit LogSetHookOperatorContract(_hookOperatorContract);
    }

    function getHookOperatorContractAddress() public view returns(address _HookOperatorContractAddress) {
        return hookOperatorContract;
    }
    
    function isUserKYCVerified(address _userAddress) public view returns(uint256 KYCStatus) {
        require(_userAddress != address(0));

        IUserContract userContract = userFactoryContract.getUserContract(_userAddress);
        uint256 kycStatus;
        (, kycStatus,,,,,,,) = userContract.getUserData();
                    
        return kycStatus;
    }

    function isBlacklisted(address _userAddress) public view returns(bool _isBlacklisted) {
        require(_userAddress != address(0));

        IUserContract userContract = userFactoryContract.getUserContract(_userAddress);

        bool isBlacklistedUser;
        (,,,isBlacklistedUser,,,,,) = userContract.getUserData();

        return isBlacklistedUser;
    }

    function isBannedUser(address userAddress) public view returns(bool _isBannedUser) {
        require(userAddress != address(0));

        IUserContract userContract = userFactoryContract.getUserContract(userAddress);
        bool isBanned = userContract.isUserBanned();

        return isBanned;
    }

    function updateGenerationRatio(uint256 _generationRatio, address userContractAddress) public onlyHookOperator {
        require(userContractAddress != address(0));

        IUserContract userContract = userFactoryContract.getUserContract(userContractAddress);
        userContract.updateGenerationRatio(_generationRatio);

        emit LogUpdateGenerationRatio(_generationRatio, userContractAddress);
    }

    function updateLastTransactionTime(address _userAddress) public onlyHookOperator {
        require(_userAddress != address(0));

        IUserContract userContract = userFactoryContract.getUserContract(_userAddress);

        userContract.updateLastTransactionTime(now);

        if (!dataContract.isSingleNodeList()){
            dataContract.moveToEnd(_userAddress);
        }

        emit LogUpdateLastTransactionTime(_userAddress);
    }

    function getUserContractAddress(address _userAddress) public view returns(IUserContract _userContract) {
        require(_userAddress != address(0));

        return userFactoryContract.getUserContract(_userAddress);
    }

    function isValidUser(address userAddress) public view returns(bool) {
        IUserContract userContract = userFactoryContract.getUserContract(userAddress);

        return userContract.isValidUser();
    }

    function setCrowdsaleContract(address crowdsaleInstance) external onlyOwner {
        require(crowdsaleInstance != address(0));
        require(crowdsaleContract == address(0)); // Crowdsale contract can be set only once

        crowdsaleContract = crowdsaleInstance;
    }

    function getCrowdsaleContract() external view returns(address){
        return crowdsaleContract;
    }

    function markUserAsFounder(address userAddress) external onlyCrowdsale {
        require(userAddress != address(0));

        IUserContract userContract = userFactoryContract.getUserContract(userAddress);
        userContract.markAsFounder();

        emit LogUserAsFounderMark(userAddress);
    }
}
