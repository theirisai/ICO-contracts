pragma solidity ^0.4.21;

import "./ITestUserUpgradeability.sol";
import "./../../User/UserFactory/IUserFactory.sol";
import "./../../Upgradeability/SharedStorage.sol";
import "./../../../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";

contract TestUserUpgradeability is ITestUserUpgradeability, SharedStorage {
    using SafeMath for uint256;

    uint256 public generationRatio;
    uint256 public KYCStatus;
    uint256 public lastTransationTime;
    bool public isBlacklistedUser;
    bool public isBanned;

    enum Status {
        ANONIMNOUS,
        SEMI_VERIFIED,
        VERIFIED
    }

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

     // This variable's purpose is for upgradeability test
    uint256 public userAge;

    /**
        Modifiers
    */
    modifier onlyUserManagerContract() {
        require(userFactoryContract.getUserManagerContractAddres() == msg.sender);

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

    // Below method purpose is for upgradeability test
    function getAge() public view returns(uint256) {
        return userAge;
    }

    /**
        Main Functions
    */
    function initUser(uint256 _generationRatio, uint256 _KYCStatus, uint256 _lastTransationTime) external onlyNewUser { 
        require(_KYCStatus <= uint256(Status.VERIFIED));

        generationRatio = _generationRatio;
        KYCStatus = _KYCStatus;
        lastTransationTime = _lastTransationTime;
        isBlacklistedUser = false;
        isBanned = false;

        userPolicy.TermsAndConditions = true;
        userPolicy.AML = true;
        userPolicy.Constitution = true;
        userPolicy.CommonLicenseAgreement = true;

        userFactoryContract = IUserFactory(msg.sender);

        emit LogNewUserCreate(generationRatio, KYCStatus, lastTransationTime);
    }


    function getUserData() external view returns
    (
        uint256 _generationRatio, 
        uint256 _KYCStatus, 
        uint256 _lastTransationTime, 
        bool _isBlacklistedUser,
        bool _termsAndConditionsAcceptance,
        bool _AMLAcceptance,
        bool _constitutionSign,
        bool _commonLicenseAgreementSign
    ) 
    
    {
        return(
                generationRatio, 
                KYCStatus, 
                lastTransationTime, 
                isBlacklistedUser,
                userPolicy.TermsAndConditions,
                userPolicy.AML,
                userPolicy.Constitution,
                userPolicy.CommonLicenseAgreement
            );
    }

    function updateUserPolicy(bool termsAndConditions, bool AML, bool constitution, bool CLA) public onlyUserCreator {
        userPolicy.TermsAndConditions = termsAndConditions;
        userPolicy.AML = AML;
        userPolicy.Constitution = constitution;
        userPolicy.CommonLicenseAgreement = CLA;
    }

    function isUserPolicyCorrect() public view returns(bool) {
        return userPolicy.TermsAndConditions && userPolicy.AML && userPolicy.Constitution && userPolicy.CommonLicenseAgreement;
    }

    function updateGenerationRatio(uint256 _generationRatio) external onlyUserManagerContract {
        generationRatio = _generationRatio;

        emit LogSettedGenerationRatio(generationRatio);
    }
    
    // onlyKYCContract - add
    function updateKYCStatus(uint256 newKYCStatus) external onlyUserManagerContract {
        require(newKYCStatus <= uint256(Status.VERIFIED));

        KYCStatus = newKYCStatus;

        if (newKYCStatus != uint256(Status.ANONIMNOUS)) {
            isBlacklistedUser = false;
        }

        emit LogSettedKYCStatus(KYCStatus);
    }
    
    function updateLastTransactionTime(uint256 _lastTransationTime) external onlyUserManagerContract {
        lastTransationTime = _lastTransationTime;

        emit LogSettedLastTransactionTime(lastTransationTime);
    }

    /**
        Blacklisted - User
    */
    function setUserBlacklistedStatus(bool _shouldBeBlacklisted) public onlyKYCContract {
        isBlacklistedUser = _shouldBeBlacklisted;
    }

    function isUserBlacklisted() public view returns(bool _isBlacklisted) {
        return isBlacklistedUser;
    }

    /**
        Banned - User
    */
    function banUser() public onlyKYCContract {
        isBanned = true;
    }

    function isUserBanned() public view returns(bool _isBanned) {
        return isBanned;
    }

    /**
        Daily transaction volume
    */
    function increaseDailyTransactionVolumeSending(uint256 _transactionVolume) public onlyHookOperator {
        uint256 currentDay = now.div(86400); // 1 day

        uint256 currentDayTransactionVolume = dailyTransactionVolumeSending[currentDay];

        currentDayTransactionVolume = currentDayTransactionVolume.add(_transactionVolume);
        dailyTransactionVolumeSending[currentDay] = currentDayTransactionVolume;
    }

    function getDailyTransactionVolumeSending() public view returns(uint256 _dailyTransactionVolume) {
        uint256 currentDay = now.div(86400);

        return dailyTransactionVolumeSending[currentDay];
    }

    /**
        Daily transaction volume - Receiving
    */
    function increaseDailyTransactionVolumeReceiving(uint256 _transactionVolume) public onlyHookOperator {
        uint256 currentDay = now.div(86400); // 1 day

        uint256 currentDayTransactionVolume = dailyTransactionVolumeReceiving[currentDay];

        currentDayTransactionVolume = currentDayTransactionVolume.add(_transactionVolume);
        dailyTransactionVolumeReceiving[currentDay] = currentDayTransactionVolume;
    }

    function getDailyTransactionVolumeReceiving() public view returns(uint256 _dailyTransactionVolume) {
        uint256 currentDay = now.div(86400);

        return dailyTransactionVolumeReceiving[currentDay];
    }

    /**
        Weekly transaction volume
    */
    function increaseWeeklyTransactionVolumeSending(uint256 _transactionVolume) public onlyHookOperator {
        uint256 currentWeek = now.div(604800); // 1 week

        uint256 currentWeekTransactionVolume = weeklyTransactionVolumeSending[currentWeek];
        currentWeekTransactionVolume = currentWeekTransactionVolume.add(_transactionVolume);
        weeklyTransactionVolumeSending[currentWeek] = currentWeekTransactionVolume;     
    }

    function getWeeklyTransactionVolumeSending() public view returns(uint256 _weeklyTransactionVolume) {
        uint256 currentWeek = now.div(604800);

        return weeklyTransactionVolumeSending[currentWeek];
    }

    /**
        Weekly transaction volume - Receiving
    */
    function increaseWeeklyTransactionVolumeReceiving(uint256 _transactionVolume) public onlyHookOperator {
        uint256 currentWeek = now.div(604800); // 1 week

        uint256 currentWeekTransactionVolume = weeklyTransactionVolumeReceiving[currentWeek];

        currentWeekTransactionVolume = currentWeekTransactionVolume.add(_transactionVolume);
        weeklyTransactionVolumeReceiving[currentWeek] = currentWeekTransactionVolume;
    }

    function getWeeklyTransactionVolumeReceiving() public view returns(uint256 _weeklyTransactionVolume) {
        uint256 currentWeek = now.div(604800);

        return weeklyTransactionVolumeReceiving[currentWeek];
    }

    /**
        Monthly transaction volume
    */
    function increaseMonthlyTransactionVolumeSending(uint256 _transactionVolume) public onlyHookOperator {
        uint256 currentMonth = now.div(2629743); // 30 days

        uint256 currentMonthTransactionVolume = monthlyTransactionVolumeSending[currentMonth];
        currentMonthTransactionVolume = currentMonthTransactionVolume.add(_transactionVolume);
        monthlyTransactionVolumeSending[currentMonth] = currentMonthTransactionVolume;
    }

    function getMonthlyTransactionVolumeSending() public view returns(uint256 _monthlyTransactionVolume) {
        uint256 currentMonth = now / 2629743;

        return monthlyTransactionVolumeSending[currentMonth];
    }

    /**
        Monthly transaction volume - Receiving
    */
    function increaseMonthlyTransactionVolumeReceiving(uint256 _transactionVolume) public onlyHookOperator {
        uint256 currentMonth = now.div(2629743); // 30 days

        uint256 currentMonthTransactionVolume = monthlyTransactionVolumeReceiving[currentMonth];

        currentMonthTransactionVolume = currentMonthTransactionVolume.add(_transactionVolume);
        monthlyTransactionVolumeReceiving[currentMonth] = currentMonthTransactionVolume;
    }

    function getMonthlyTransactionVolumeReceiving() public view returns(uint256 _monthlyTransactionVolume) {
        uint256 currentMonth = now / 2629743;

        return monthlyTransactionVolumeReceiving[currentMonth];
    }
    
}