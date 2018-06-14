pragma solidity ^0.4.21;

import "./ITestKYCValidationUpgradeability.sol";
import "./../../User/IUserContract.sol";
import "./../../HookOperator/IHookOperator.sol";
import "./../../User/UserFactory/IUserFactory.sol";
import "./../../Upgradeability/OwnableUpgradeableImplementation/OwnableUpgradeableImplementation.sol";

import "./../../Oracle/ExchangeOracle.sol";
import "./../../../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";

contract TestKYCValidationUpgradeability is ITestKYCValidationUpgradeability, OwnableUpgradeableImplementation {
    using SafeMath for uint256;

    /**
        Anonymous Users
    */
    uint256 public transactionsDailyLimitAnonymous;
    uint256 public transactionWeeklyLimitAnonymous;
    uint256 public transactionMonthlyLimitAnonymous;
    uint256 public maxBalanceAnonymousUser;

    /**
        Semi Verified Users
    */
    uint256 public transactionsDailyLimitSemiVerified;
    uint256 public transactionWeeklyLimitSemiVerified;
    uint256 public transactionMonthlyLimitSemiVerified;
    uint256 public maxBalanceSemiVerifiedUser;

    ExchangeOracle public exchangeOracle;
    IUserFactory public userFactory;

    address public kycVerificationOwner;

    // Added for testing upgradeability purpose
    uint256 public maxBalanceVerifiedUser;


    modifier onlyKYCAdmin() {
        require(kycVerificationOwner == msg.sender);

        _;
    }

    // Below two functions are added for testing upgradeability purpose
    function getMaxBalanceVerifiedUser() public view returns(uint256) {
        return maxBalanceVerifiedUser;
    }

    function setMaxBalanceVerifiedUser(uint256 maxBalance) public {
        maxBalanceVerifiedUser = maxBalance;
    }

    /**
        Daily limit - Anonymous
    */
    function setDailyLimitForAnonymousUsers(uint256 _transactionDailyMaxVolume) public onlyKYCAdmin {
        transactionsDailyLimitAnonymous = _transactionDailyMaxVolume;
    }

    function getDailyLimitForAnonymousUsers() public view returns(uint256 _transactionDailyMaxVolume) {
        return transactionsDailyLimitAnonymous;
    }

    /**
        Daily limit - Semi Verified
    */
    function setDailyLimitForSemiVerifiedUsers(uint256 _transactionDailyMaxVolume) public onlyKYCAdmin {
        transactionsDailyLimitSemiVerified = _transactionDailyMaxVolume;
    }

    function getDailyLimitForSemiVerifiedUsers() public view returns(uint256 _transactionDailyMaxVolume) {
        return transactionsDailyLimitSemiVerified;
    }

    /**
        Weekly limit - Anonymous
    */
    function setWeeklyLimitForAnonymousUsers(uint256 _transactionWeeklyMaxVolume) public onlyKYCAdmin {
        transactionWeeklyLimitAnonymous = _transactionWeeklyMaxVolume;
    }

    function getWeeklyLimitForAnonymousUsers() public view returns(uint256 _transactionWeeklyMaxVolume) {
        return transactionWeeklyLimitAnonymous;
    }

    /**
        Weekly limit - Semi Verified
    */
    function setWeeklyLimitForSemiVerifiedUsers(uint256 _transactionWeeklyMaxVolume) public onlyKYCAdmin {
        transactionWeeklyLimitSemiVerified = _transactionWeeklyMaxVolume;
    }

    function getWeeklyLimitForSemiVerifiedUsers() public view returns(uint256 _transactionWeeklyMaxVolume) {
        return transactionWeeklyLimitSemiVerified;
    }

    /**
        Monthly limit - Anonymous
    */
    function setMonthlyLimitForAnonymousUsers(uint256 _transactionMonthlyMaxVolume) public onlyKYCAdmin {
        transactionMonthlyLimitAnonymous = _transactionMonthlyMaxVolume;
    }

    function getMonthlyLimitForAnonymousUsers() public view returns(uint256 _transactionMonthlyMaxVolume) {
        return transactionMonthlyLimitAnonymous;
    }

    /**
        Monthly limit - Semi Verified
    */
    function setMonthlyLimitForSemiVerifiedUsers(uint256 _transactionMonthlyMaxVolume) public onlyKYCAdmin {
        transactionMonthlyLimitSemiVerified = _transactionMonthlyMaxVolume;
    }

    function getMonthlyLimitForSemiVerifiedUsers() public view returns(uint256 _transactionMonthlyMaxVolume) {
        return transactionMonthlyLimitSemiVerified;
    }

    /**
        Max balance limit - Anonymous
    */
    function setMaxBalanceLimitForAnonymousUsers(uint256 _maxBalance) public onlyKYCAdmin {
        maxBalanceAnonymousUser = _maxBalance;
    }

    function getMaxBalanceLimitForAnonymousUsers() public view returns(uint256 _maxBalance) {
        return maxBalanceAnonymousUser;
    }

    /**
        Max balance limit - Semi Verified
    */
    function setMaxBalanceLimitForSemiVerifiedUsers(uint256 _maxBalance) public onlyKYCAdmin {
        maxBalanceSemiVerifiedUser = _maxBalance;
    }

    function getMaxBalanceLimitForSemiVerifiedUsers() public view returns(uint256 _maxBalance) {
        return maxBalanceSemiVerifiedUser;
    }

    /**
        Oracle - Get & Set
    */
    function setExchangeOracle(address _oracleContractAddress) public onlyKYCAdmin {
        require(_oracleContractAddress != address(0));

        exchangeOracle = ExchangeOracle(_oracleContractAddress);

        require(exchangeOracle.isIrisOracle());
    }

    function getExchangeOracle() public view returns(ExchangeOracle _exchangeOracle) {
        return exchangeOracle;
    }

    /**
        KYC Settings:
        The owner set a user who will be responsible for the KYC Verification
    */
    function setKYCUserOwner(address userOwner) public onlyOwner {
        require(userOwner != address(0));

        kycVerificationOwner = userOwner;
    }

    function getKYCUserOwner() public view returns(address kycOwner) {
        return kycVerificationOwner;
    }

    /**
        Validation for KYC User Sender:

        1. User cannot make tx bigger than X amount
    */
    function isValidKYCUserSender(address _userContractAddress, uint256 tokensToSend, uint256 kycStatus) public view {
        require(_userContractAddress != address(0));
        require(tokensToSend > 0);
        
        IUserContract userContract = IUserContract(_userContractAddress);
        
        // Daily Validation 
        uint256 dailyAmount = userContract.getDailyTransactionVolumeSending();
        verifyDailyLimitKYC(tokensToSend, dailyAmount, kycStatus);

        // Weekly Validation
        uint256 weeklyAmount = userContract.getWeeklyTransactionVolumeSending();
        verifyWeeklyLimitKYC(tokensToSend, weeklyAmount, kycStatus);

        // Monthly Validation
        uint256 monthlyAmount = userContract.getMonthlyTransactionVolumeSending();
        verifyMonthlyLimitKYC(tokensToSend, monthlyAmount, kycStatus);
    }

    /**
        Validation for KYC User Receiver:

        1. User cannot have a tx volume bigger than Y amount per day
        2. User cannot have a tx volume bigger than Z amount per month
        3. User cannot hold in their accounts more than T amounts of tokens at any given time
    */
    function isValidKYCUserReceiver(address _userContractAddress, uint256 tokensToSend, uint256 userBalance, uint256 kycStatus) public view {
        require(_userContractAddress != address(0));
        require(tokensToSend > 0);

        IUserContract userContract = IUserContract(_userContractAddress);
        
        // Daily Validation 
        uint256 dailyAmount = userContract.getDailyTransactionVolumeReceiving();
        verifyDailyLimitKYC(tokensToSend, dailyAmount, kycStatus);

        // Weekly Validation
        uint256 weeklyAmount = userContract.getWeeklyTransactionVolumeReceiving();
        verifyWeeklyLimitKYC(tokensToSend, weeklyAmount, kycStatus);

        // Monthly Validation
        uint256 monthlyAmount = userContract.getMonthlyTransactionVolumeReceiving();
        verifyMonthlyLimitKYC(tokensToSend, monthlyAmount, kycStatus);

        // Max Balance Validation
        verifyMaxBalanceKYC(tokensToSend, userBalance, kycStatus);
    }

    /**
        KYC Verifications
    */
    function verifyDailyLimitKYC(uint256 tokensToSend, uint256 dailyAmount, uint256 kycStatus) public view {
        uint256 convertedTokens = exchangeOracle.calcWeiForTokensAmount(tokensToSend);

        uint256 dailyAmountConverted = exchangeOracle.calcWeiForTokensAmount(dailyAmount);

        if (kycStatus == 0) {
            require(dailyAmountConverted <= transactionsDailyLimitAnonymous);
            require(dailyAmountConverted.add(convertedTokens) <= transactionsDailyLimitAnonymous);
        }

        if (kycStatus == 1) {
            require(dailyAmountConverted <= transactionsDailyLimitSemiVerified);
            require(dailyAmountConverted.add(convertedTokens) <= transactionsDailyLimitSemiVerified);
        }
    }

    function verifyWeeklyLimitKYC(uint256 tokensToSend, uint256 weeklyAmount, uint256 kycStatus) public view {
        uint256 convertedTokens = exchangeOracle.calcWeiForTokensAmount(tokensToSend);

        uint256 weeklyLimitAmountConverted = exchangeOracle.calcWeiForTokensAmount(weeklyAmount);

        if (kycStatus == 0) {
            require(weeklyLimitAmountConverted <= transactionWeeklyLimitAnonymous);
            require(weeklyLimitAmountConverted.add(convertedTokens) <= transactionWeeklyLimitAnonymous);
        }

        if (kycStatus == 1) {
            require(weeklyLimitAmountConverted <= transactionWeeklyLimitSemiVerified);
            require(weeklyLimitAmountConverted.add(convertedTokens) <= transactionWeeklyLimitSemiVerified);
        }
    }

    function verifyMonthlyLimitKYC(uint256 tokensToSend, uint256 monthlyAmount, uint256 kycStatus) public view {
        uint256 convertedTokens = exchangeOracle.calcWeiForTokensAmount(tokensToSend);

        uint256 monthlyLimitAmountConverted = exchangeOracle.calcWeiForTokensAmount(monthlyAmount);

        if (kycStatus == 0) {
            require(monthlyLimitAmountConverted <= transactionMonthlyLimitAnonymous);
            require(monthlyLimitAmountConverted.add(convertedTokens) <= transactionMonthlyLimitAnonymous);
        }

        if (kycStatus == 1) {
            require(monthlyLimitAmountConverted <= transactionMonthlyLimitSemiVerified);
            require(monthlyLimitAmountConverted.add(convertedTokens) <= transactionMonthlyLimitSemiVerified);
        }
    }

    function verifyMaxBalanceKYC(uint256 tokensToSend, uint256 userBalance, uint256 kycStatus) public view {
        require(tokensToSend > 0);

        // Convert AIUR to ETH
        uint256 convertedTokens = exchangeOracle.calcWeiForTokensAmount(tokensToSend);
        uint256 convertedUserBalance = exchangeOracle.calcWeiForTokensAmount(userBalance);

        // Verify Max Balance
        if (kycStatus == 0) {
            require(convertedUserBalance.add(convertedTokens) <= maxBalanceAnonymousUser);
        } 

        if (kycStatus == 1) {
            require(convertedUserBalance.add(convertedTokens) <= maxBalanceSemiVerifiedUser);
        }
    }

    /**
        Blacklisted & Banned user
    */

    function setUserBlacklistedStatus(address _userAddress, bool _shouldBeBlacklisted) public onlyKYCAdmin {
        address userContractAddress = userFactory.getUserContract(_userAddress);
        IUserContract user = IUserContract(userContractAddress);

        user.setUserBlacklistedStatus(_shouldBeBlacklisted);
    }

    function banUser(address _userAddress) public onlyKYCAdmin {        
        address userContractAddress = userFactory.getUserContract(_userAddress);
        IUserContract user = IUserContract(userContractAddress);

        user.banUser();
    }

    /**
        User Factory - Get & Set
    */
    function setUserFactory(address _userFactoryContractAddress) public onlyKYCAdmin {
        require(_userFactoryContractAddress != address(0));

        userFactory = IUserFactory(_userFactoryContractAddress);
    }

    function getUserFactoryContractAddress() public view returns(address _userFactoryContractAddress) {
        return address(userFactory);
    }
}