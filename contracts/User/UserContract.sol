pragma solidity ^0.4.21;

import "./IUserContract.sol";
import "./UserFactory/IUserFactory.sol";
import "./../Upgradeability/SharedStorage.sol";
import "./../../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";

contract UserContract is IUserContract, SharedStorage {
    using SafeMath for uint256;

    uint256 public generationRatio;
    uint256 public lastTransactionTime;
    bool public isBlacklistedUser;
    bool public isBanned;

    bool public isExchangeKYCUser;

    /* 
        KYC statuses Anonymous = 0 / Semi-Verified = 1 / Verified = 2
        Statuses range - 0 to 2
    */
    uint256 public KYCStatus;

    bool public isFounder;
    
    struct Policy {
        bool TermsAndConditions;
        bool AML;
        bool Constitution;
        bool CommonLicenseAgreement;
    }

    Policy public userPolicy;

    IUserFactory public userFactoryContract;

    /**
        Transaction Volume - Sending
    */
    mapping (uint256 => uint256) public dailyTransactionVolumeSending;
    mapping (uint256 => uint256) public weeklyTransactionVolumeSending;
    mapping (uint256 => uint256) public monthlyTransactionVolumeSending;

    /**
        Transaction Volume - Receiving
    */
    mapping (uint256 => uint256) public dailyTransactionVolumeReceiving;
    mapping (uint256 => uint256) public weeklyTransactionVolumeReceiving;
    mapping (uint256 => uint256) public monthlyTransactionVolumeReceiving;

    /**
        Modifiers
    */
    modifier onlyUserManagerContract() {
        require(userFactoryContract.getUserManagerContractAddress() == msg.sender);

        _;
    }

    modifier onlyNewUser() {
        require(address(userFactoryContract) == address(0));
        
        _;
    }

    modifier onlyKYCContract() {
        require(userFactoryContract.getKYCVerificationInstance() == msg.sender);

        _;
    }

    modifier onlyUserCreator() {
        require(userFactoryContract.getUserCreator() == msg.sender);

        _;
    }

    modifier onlyHookOperator() {
        require(userFactoryContract.getHookOperatorAddress() == msg.sender);

        _;
    }

    /**
        Main Functions
    */

    function initExchangeUser(uint256 _KYCStatus) external {
        initUser(_KYCStatus);
        isExchangeKYCUser = true;

        emit LogNewExchangeUserCreate(_KYCStatus);
    }

    function initKYCUser(uint256 _KYCStatus) external { 
        initUser(_KYCStatus);

        userPolicy.TermsAndConditions = true;
        userPolicy.AML = true;
        userPolicy.Constitution = true;
        userPolicy.CommonLicenseAgreement = true;

        emit LogNewUserCreate(_KYCStatus);
    }
    
    function initUser(uint256 _KYCStatus) internal onlyNewUser {
        require(_KYCStatus <= 2); // Verified status (2) is the last one in the statuses range

        KYCStatus = _KYCStatus;
        userFactoryContract = IUserFactory(msg.sender);
    }

    function isValidUser() external view returns(bool) {
        return isUserPolicyAccepted() || isExchangeUser();
    }

    function getUserData() external view returns
    (
        uint256 _generationRatio, 
        uint256 _KYCStatus, 
        uint256 _lastTransactionTime, 
        bool _isBlacklistedUser,
        bool _termsAndConditionsAcceptance,
        bool _AMLAcceptance,
        bool _constitutionSign,
        bool _commonLicenseAgreementSign,
        bool _isFounder
    ) 
    
    {
        return(
                generationRatio, 
                KYCStatus, 
                lastTransactionTime, 
                isBlacklistedUser,
                userPolicy.TermsAndConditions,
                userPolicy.AML,
                userPolicy.Constitution,
                userPolicy.CommonLicenseAgreement,
                isFounder
            );
    }

    function isExchangeUser() public view returns(bool) {
        return isExchangeKYCUser;
    }

    function updateUserPolicy(bool _termsAndConditions, bool _AML, bool _constitution, bool _CLA) external onlyUserCreator {
        userPolicy.TermsAndConditions = _termsAndConditions;
        userPolicy.AML = _AML;
        userPolicy.Constitution = _constitution;
        userPolicy.CommonLicenseAgreement = _CLA;

        emit LogUserPolicyUpdate(_termsAndConditions, _AML, _constitution, _CLA);
    }

    function isUserPolicyAccepted() public view returns(bool) {
        return userPolicy.TermsAndConditions && userPolicy.AML && userPolicy.Constitution && userPolicy.CommonLicenseAgreement;
    }

    function updateGenerationRatio(uint256 _generationRatio) external onlyUserManagerContract {
        generationRatio = _generationRatio;

        emit LogGenerationRatioUpdate(generationRatio);
    }
    
    function updateKYCStatus(uint256 _newKYCStatus) external onlyKYCContract {
        require(_newKYCStatus <= 2); // Verified status (2) is the last one in the statuses range

        KYCStatus = _newKYCStatus;

        if (_newKYCStatus != uint256(0)) {  // Check for Anonymous status
            isBlacklistedUser = false;
        }

        emit LogKYCStatusUpdate(KYCStatus);
    }
    
    function updateLastTransactionTime(uint256 _lastTransactionTime) external onlyUserManagerContract {
        lastTransactionTime = _lastTransactionTime;

        emit LogLastTransactionTimeUpdate(lastTransactionTime);
    }

    /**
        Founder - User
     */
    function markAsFounder() external onlyUserManagerContract {
        isFounder = true;

        emit LogAsFounderMark();
    }

    function isFounderUser() external view returns(bool) {
        return isFounder;
    }

    /**
        Blacklisted - User
    */
    function setUserBlacklistedStatus(bool _shouldBeBlacklisted) external onlyKYCContract {
        isBlacklistedUser = _shouldBeBlacklisted;

        emit LogUserBlacklistedStatusSet(_shouldBeBlacklisted);
    }

    function isUserBlacklisted() external view returns(bool _isBlacklisted) {
        return isBlacklistedUser;
    }

    /**
        Banned - User
    */
    function banUser() external onlyKYCContract {
        isBanned = true;

        emit LogUserBan();
    }

    function isUserBanned() external view returns(bool _isBanned) {
        return isBanned;
    }

    /**
        Daily transaction volume
    */
    function increaseDailyTransactionVolumeSending(uint256 _transactionVolume) external onlyHookOperator {
        uint256 currentDay = now.div(86400); // 1 day

        uint256 currentDayTransactionVolume = dailyTransactionVolumeSending[currentDay];

        currentDayTransactionVolume = currentDayTransactionVolume.add(_transactionVolume);
        dailyTransactionVolumeSending[currentDay] = currentDayTransactionVolume;

        emit LogDailyTransactionVolumeSendingIncrease(currentDay, _transactionVolume);
    }

    function getDailyTransactionVolumeSending() external view returns(uint256 _dailyTransactionVolume) {
        uint256 currentDay = now.div(86400);

        return dailyTransactionVolumeSending[currentDay];
    }

    /**
        Daily transaction volume - Receiving
    */
    function increaseDailyTransactionVolumeReceiving(uint256 _transactionVolume) external onlyHookOperator {
        uint256 currentDay = now.div(86400); // 1 day

        uint256 currentDayTransactionVolume = dailyTransactionVolumeReceiving[currentDay];

        currentDayTransactionVolume = currentDayTransactionVolume.add(_transactionVolume);
        dailyTransactionVolumeReceiving[currentDay] = currentDayTransactionVolume;

        emit LogDailyTransactionVolumeReceivingIncrease(currentDay, _transactionVolume);
    }

    function getDailyTransactionVolumeReceiving() external view returns(uint256 _dailyTransactionVolume) {
        uint256 currentDay = now.div(86400);

        return dailyTransactionVolumeReceiving[currentDay];
    }

    /**
        Weekly transaction volume
    */
    function increaseWeeklyTransactionVolumeSending(uint256 _transactionVolume) external onlyHookOperator {
        uint256 currentWeek = now.div(604800); // 1 week

        uint256 currentWeekTransactionVolume = weeklyTransactionVolumeSending[currentWeek];
        currentWeekTransactionVolume = currentWeekTransactionVolume.add(_transactionVolume);
        weeklyTransactionVolumeSending[currentWeek] = currentWeekTransactionVolume;     

        emit LogWeeklyTransactionVolumeSendingIncrease(currentWeek, _transactionVolume);
    }

    function getWeeklyTransactionVolumeSending() external view returns(uint256 _weeklyTransactionVolume) {
        uint256 currentWeek = now.div(604800);

        return weeklyTransactionVolumeSending[currentWeek];
    }

    /**
        Weekly transaction volume - Receiving
    */
    function increaseWeeklyTransactionVolumeReceiving(uint256 _transactionVolume) external onlyHookOperator {
        uint256 currentWeek = now.div(604800); // 1 week

        uint256 currentWeekTransactionVolume = weeklyTransactionVolumeReceiving[currentWeek];

        currentWeekTransactionVolume = currentWeekTransactionVolume.add(_transactionVolume);
        weeklyTransactionVolumeReceiving[currentWeek] = currentWeekTransactionVolume;

        emit LogWeeklyTransactionVolumeReceivingIncrease(currentWeek, _transactionVolume);
    }

    function getWeeklyTransactionVolumeReceiving() external view returns(uint256 _weeklyTransactionVolume) {
        uint256 currentWeek = now.div(604800);

        return weeklyTransactionVolumeReceiving[currentWeek];
    }

    /**
        Monthly transaction volume
    */
    function increaseMonthlyTransactionVolumeSending(uint256 _transactionVolume) external onlyHookOperator {
        uint256 currentMonth = now.div(2629743); // 30 days

        uint256 currentMonthTransactionVolume = monthlyTransactionVolumeSending[currentMonth];
        currentMonthTransactionVolume = currentMonthTransactionVolume.add(_transactionVolume);
        monthlyTransactionVolumeSending[currentMonth] = currentMonthTransactionVolume;

        emit LogMonthlyTransactionVolumeSendingIncrease(currentMonth, _transactionVolume);
    }

    function getMonthlyTransactionVolumeSending() external view returns(uint256 _monthlyTransactionVolume) {
        uint256 currentMonth = now.div(2629743);

        return monthlyTransactionVolumeSending[currentMonth];
    }

    /**
        Monthly transaction volume - Receiving
    */
    function increaseMonthlyTransactionVolumeReceiving(uint256 _transactionVolume) external onlyHookOperator {
        uint256 currentMonth = now.div(2629743); // 30 days

        uint256 currentMonthTransactionVolume = monthlyTransactionVolumeReceiving[currentMonth];

        currentMonthTransactionVolume = currentMonthTransactionVolume.add(_transactionVolume);
        monthlyTransactionVolumeReceiving[currentMonth] = currentMonthTransactionVolume;

        emit LogMonthlyTransactionVolumeReceivingIncrease(currentMonth, _transactionVolume);
    }

    function getMonthlyTransactionVolumeReceiving() external view returns(uint256 _monthlyTransactionVolume) {
        uint256 currentMonth = now.div(2629743);

        return monthlyTransactionVolumeReceiving[currentMonth];
    }
}