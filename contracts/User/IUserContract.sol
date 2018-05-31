pragma solidity ^0.4.21;

contract IUserContract {
    event LogNewUserCreate(uint256 _generationRatio, uint256 _KYCStatus, uint256 _lastTransationTime);
    event LogSettedGenerationRatio(uint256 generationRatio);
    event LogSettedKYCStatus(uint256 KYCStatus);
    event LogSettedLastTransactionTime(uint256 lastTransationTime);
    event LogUserPolicyUpdate(bool termsAndConditions, bool AML, bool constitution, bool CLA);
    event LogDailyTransactionVolumeSendingIncrease(uint256 currentDay, uint256 transactionVolume);
    event LogDailyTransactionVolumeReceivingIncrease(uint256 currentDay, uint256 transactionVolume);
    event LogWeeklyTransactionVolumeSendingIncrease(uint256 currentWeek, uint256 transactionVolume);
    event LogWeeklyTransactionVolumeReceivingIncrease(uint256 currentWeek, uint256 transactionVolume);
    event LogMonthlyTransactionVolumeSendingIncrease(uint256 currentMonth, uint256 transactionVolume);
    event LogMonthlyTransactionVolumeReceivingIncrease(uint256 currentMonth, uint256 transactionVolume);


    /**
        Main Functions
    */
    function initUser(uint256 _generationRatio, uint256 _KYCStatus, uint256 _lastTransationTime) external;

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
    ); 

    function updateUserPolicy(bool termsAndConditions, bool AML, bool constitution, bool CLA) public;

    function isUserPolicyCorrect() public view returns(bool);

    function updateGenerationRatio(uint256 _generationRatio) external;
    
    function updateKYCStatus(uint256 newKYCStatus) external;

    function updateLastTransactionTime(uint256 _lastTransationTime) external;

    /**
        Blacklisted - User
    */
    function setUserBlacklistedStatus(bool _shouldBeBlacklisted) public;

    function isUserBlacklisted() public view returns(bool _isBlacklisted);
    /**
        Banned - User
    */
    function banUser() public;

    function isUserBanned() public view returns(bool _isBanned);

    /**
        Daily transaction volume
    */
    function increaseDailyTransactionVolumeSending(uint256 _transactionVolume) public;

    function getDailyTransactionVolumeSending() public view returns(uint256 _dailyTransactionVolume);

    /**
        Daily transaction volume - Receiving
    */
    function increaseDailyTransactionVolumeReceiving(uint256 _transactionVolume) public;

    function getDailyTransactionVolumeReceiving() public view returns(uint256 _dailyTransactionVolume);

    /**
        Weekly transaction volume
    */
    function increaseWeeklyTransactionVolumeSending(uint256 _transactionVolume) public;

    function getWeeklyTransactionVolumeSending() public view returns(uint256 _weeklyTransactionVolume);

    /**
        Weekly transaction volume - Receiving
    */
    function increaseWeeklyTransactionVolumeReceiving(uint256 _transactionVolume) public;

    function getWeeklyTransactionVolumeReceiving() public view returns(uint256 _weeklyTransactionVolume);

    /**
        Monthly transaction volume
    */
    function increaseMonthlyTransactionVolumeSending(uint256 _transactionVolume) public;

    function getMonthlyTransactionVolumeSending() public view returns(uint256 _monthlyTransactionVolume);

    /**
        Monthly transaction volume - Receiving
    */
    function increaseMonthlyTransactionVolumeReceiving(uint256 _transactionVolume) public;

    function getMonthlyTransactionVolumeReceiving() public view returns(uint256 _monthlyTransactionVolume);
}