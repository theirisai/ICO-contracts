pragma solidity ^0.4.21;

import "./../Upgradeability/OwnableUpgradeableImplementation/IOwnableUpgradeableImplementation.sol";
import "./../Oracle/ExchangeOracle.sol";

contract IKYCVerification is IOwnableUpgradeableImplementation {
    event LogSetDailyLimitForAnonymousUsers(uint256 _transactionDailyMaxVolume);
    event LogSetDailyLimitForSemiVerifiedUsers(uint256 _transactionDailyMaxVolume);

    event LogSetWeeklyLimitForAnonymousUsers(uint256 _transactionWeeklyMaxVolume);
    event LogSetWeeklyLimitForSemiVerifiedUsers(uint256 _transactionWeeklyMaxVolume);

    event LogSetMonthlyLimitForAnonymousUsers(uint256 _transactionMonthlyMaxVolume);
    event LogSetMonthlyLimitForSemiVerifiedUsers(uint256 _transactionMonthlyMaxVolume);

    event LogSetMaxBalanceLimitForAnonymousUsers(uint256 _maxBalance);
    event LogSetMaxBalanceLimitForSemiVerifiedUsers(uint256 _maxBalance);

    event LogSetExchangeOracle(address _oracleContractAddress);
    event LogSetKYCUserOwner(address userOwner);

    event LogSetUserBlacklistedStatus(address _userAddress, bool _shouldBeBlacklisted);
    event LogBanUser(address _userAddress);
    event LogSetUserFactory(address _userFactoryContractAddress);

    event LogUpdateUserKYCStatus(address userAddress, uint256 kycStatus);

    /**
        Daily limit - Anonymous
    */
    function setDailyLimitForAnonymousUsers(uint256 _transactionDailyMaxVolume) public;

    function getDailyLimitForAnonymousUsers() public view returns(uint256 _transactionDailyMaxVolume);

    /**
        Daily limit - Semi Verified
    */
    function setDailyLimitForSemiVerifiedUsers(uint256 _transactionDailyMaxVolume) public;

    function getDailyLimitForSemiVerifiedUsers() public view returns(uint256 _transactionDailyMaxVolume);

    /**
        Weekly limit - Anonymous
    */
    function setWeeklyLimitForAnonymousUsers(uint256 _transactionWeeklyMaxVolume) public;

    function getWeeklyLimitForAnonymousUsers() public view returns(uint256 _transactionWeeklyMaxVolume);

    /**
        Weekly limit - Semi Verified
    */
    function setWeeklyLimitForSemiVerifiedUsers(uint256 _transactionWeeklyMaxVolume) public;

    function getWeeklyLimitForSemiVerifiedUsers() public view returns(uint256 _transactionWeeklyMaxVolume);

    /**
        Monthly limit - Anonymous
    */
    function setMonthlyLimitForAnonymousUsers(uint256 _transactionMonthlyMaxVolume) public;

    function getMonthlyLimitForAnonymousUsers() public view returns(uint256 _transactionMonthlyMaxVolume);

    /**
        Monthly limit - Semi Verified
    */
    function setMonthlyLimitForSemiVerifiedUsers(uint256 _transactionMonthlyMaxVolume) public;

    function getMonthlyLimitForSemiVerifiedUsers() public view returns(uint256 _transactionMonthlyMaxVolume);

    /**
        Max balance limit - Anonymous
    */
    function setMaxBalanceLimitForAnonymousUsers(uint256 _maxBalance) public;

    function getMaxBalanceLimitForAnonymousUsers() public view returns(uint256 _maxBalance);

    /**
        Max balance limit - Semi Verified
    */
    function setMaxBalanceLimitForSemiVerifiedUsers(uint256 _maxBalance) public;

    function getMaxBalanceLimitForSemiVerifiedUsers() public view returns(uint256 _maxBalance);

    /**
        Oracle - Get & Set
    */
    function setExchangeOracle(address _oracleContractAddress) public;

    function getExchangeOracle() public view returns(ExchangeOracle _exchangeOracle);

    /**
        KYC Settings:
        The owner set a user who will be responsible for the KYC Verification
    */
    function setKYCUserOwner(address userOwner) public;

    function getKYCUserOwner() public view returns(address kycOwner);

    /**
        Validation for KYC User Sender:

        1. User cannot make tx bigger than X amount
    */
    function isValidKYCUserSender(address _userContractAddress, uint256 tokensToSend, uint256 kycStatus) public view;

    /**
        Validation for KYC User Receiver:

        1. User cannot have a tx volume bigger than Y amount per day
        2. User cannot have a tx volume bigger than Z amount per month
        3. User cannot hold in their accounts more than T amounts of tokens at any given time
    */
    function isValidKYCUserReceiver(address _userContractAddress, uint256 tokensToSend, uint256 userBalance, uint256 kycStatus) public view;

    /**
        KYC Verifications
    */
    function verifyDailyLimitKYC(uint256 tokensToSend, uint256 dailyAmount, uint256 kycStatus) public view;

    function verifyWeeklyLimitKYC(uint256 tokensToSend, uint256 weeklyAmount, uint256 kycStatus) public view;

    function verifyMonthlyLimitKYC(uint256 tokensToSend, uint256 monthlyAmount, uint256 kycStatus) public view;

    function verifyMaxBalanceKYC(uint256 tokensToSend, uint256 userBalance, uint256 kycStatus) public view;

    /**
        Blacklisted & Banned user
    */

    function setUserBlacklistedStatus(address _userAddress, bool _shouldBeBlacklisted) public;

    function banUser(address _userAddress) public;

    /**
        User Factory - Get & Set
    */
    function setUserFactory(address _userFactoryContractAddress) public;

    function getUserFactoryContractAddress() public view returns(address _userFactoryContractAddress);

    /**
        Update user KYC status
    */
    function updateUserKYCStatus(address userAddress, uint256 kycStatus) public;
}