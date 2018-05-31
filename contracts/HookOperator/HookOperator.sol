pragma solidity ^0.4.21;

import "./IHookOperator.sol";
import "../InitialCoinOffering/ICOTokenExtended.sol";
import "./../User/IUserContract.sol";
import "./../KYC/IKYCVerification.sol";
import "../UserManager/IUserManager.sol";
import "../Upgradeability/OwnableUpgradeableImplementation/OwnableUpgradeableImplementation.sol";

import "./../../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";

contract HookOperator is IHookOperator, OwnableUpgradeableImplementation {
    using SafeMath for uint256;

    IUserManager public userManager;
    IKYCVerification public kycVerificationContract;
    ICOTokenExtended public icoToken;
    
    address public offChainService;
    uint256 public balancePercentageLimit;

    mapping(address => bool) public overBalanceLimitHolders;

    /**
        Modifiers
    */
    modifier onlyICOToken() {
        require(msg.sender == address(icoToken));
        
        _;
    }

    modifier onlyOffChainService() {
        require(msg.sender == offChainService);

        _;
    }

    modifier nonZeroAddress(address _address) {
        require(_address != address(0));
        
        _;
    } 

    /**
        Setters
    */

    /**
        Balance Percentage Limit - Get & Set
    */
    function setBalancePercentageLimit(uint256 limit) public onlyOwner {
        require(limit > 0);
        require(limit < 100);

        balancePercentageLimit = limit;
    }

    function getBalancePercentageLimit() public view returns(uint256) {
        return balancePercentageLimit;
    }

    /**
        Over Balance Limit Holder - Set
    */
    function setOverBalanceLimitHolder(address holderAddress, bool isHolder) public onlyOwner nonZeroAddress(holderAddress) {
        overBalanceLimitHolders[holderAddress] = isHolder;
    }

    /**
        User Manager - Get & Set
    */
    function setUserManager(address userManagerAddress) public onlyOwner nonZeroAddress(userManagerAddress) {

        userManager = IUserManager(userManagerAddress);
    }

    function getUserManager() public view returns(address userManagerAddress) {
        return userManager;
    }

     /**
        ICO Token - Get & Set
    */
    function setICOToken(address icoTokenAddress) public onlyOwner nonZeroAddress(icoTokenAddress) {
        require(icoTokenAddress != address(0));

        icoToken = ICOTokenExtended(icoTokenAddress);
    }

    function getICOToken() public view returns(address icoTokenAddress) {
        return icoToken;
    }


    /**
        Main Functions
    */
    function onTransfer(address from, address to, uint tokensAmount) public onlyICOToken nonZeroAddress(from) nonZeroAddress(to) {
        require(userManager.isUserPolicyCorrect(to));
        require(userManager.isUserPolicyCorrect(from));
        require(isInBalanceLimit(to, tokensAmount));

        kycVerification(from, to, tokensAmount);

        userManager.updateLastTransactionTime(from);

        emit LogOnTransfer(from, to, tokensAmount);
    }

    function onMint(address to, uint256 tokensAmount) public onlyICOToken nonZeroAddress(to) {
        require(userManager.isUserPolicyCorrect(to));

        uint256 kycStatusTo = userManager.isUserKYCVerified(to);
        
        if (kycStatusTo < 2) {
            kycVerificationContract.verifyMaxBalanceKYC(tokensAmount, icoToken.balanceOf(to), kycStatusTo);
        }

        emit LogOnMint(to, tokensAmount);
    }

    // Ask for burning?
    function onBurn(uint256 amount) public onlyICOToken {
        emit LogOnBurn(amount);        
    }

    function onTaxTransfer(address taxableUser, uint256 tokensAmount) public onlyICOToken nonZeroAddress(taxableUser) {
        // We're not taxing the users at the moment
        emit LogOnTaxTransfer(address(0), 0);
    }

    /**
        KYC Verification
    */
    function kycVerification(address from, address to, uint256 tokensAmount) public nonZeroAddress(from) nonZeroAddress(to) {
        address userContractAddressFrom = userManager.getUserContractAddress(from);
        address userContractAddressTo = userManager.getUserContractAddress(to);

        // "from" - KYC Verification
        uint256 kycStatusFrom = userManager.isUserKYCVerified(from);
        if (kycStatusFrom < 2) {
            kycVerificationContract.verifyMaxBalanceKYC(tokensAmount, icoToken.balanceOf(from), kycStatusFrom);
            kycVerificationContract.isValidKYCUserSender(userContractAddressFrom, tokensAmount, kycStatusFrom);
        }

        // "to" - KYC Verification
        uint256 kycStatusTo = userManager.isUserKYCVerified(to);
        if (kycStatusTo == 2) {
            return;
        }

        kycVerificationContract.isValidKYCUserReceiver(userContractAddressTo, tokensAmount, icoToken.balanceOf(to), kycStatusTo);

        IUserContract userSender = IUserContract(userContractAddressFrom);
        IUserContract userReceiver = IUserContract(userContractAddressTo);

        // Update daily volume
        userSender.increaseDailyTransactionVolumeSending(tokensAmount);
        userReceiver.increaseDailyTransactionVolumeReceiving(tokensAmount);

        // Update weekly volume
        userSender.increaseWeeklyTransactionVolumeSending(tokensAmount);
        userReceiver.increaseWeeklyTransactionVolumeReceiving(tokensAmount);

        // Update montly volume
        userSender.increaseMonthlyTransactionVolumeSending(tokensAmount);
        userReceiver.increaseMonthlyTransactionVolumeReceiving(tokensAmount);
    }

    /**
        KYC Verification Contract - Get & Set
    */
    function setKYCVerficationContract(address _kycVerificationContractAddress) public onlyOwner nonZeroAddress(_kycVerificationContractAddress) {
        require(_kycVerificationContractAddress != address(0));

        kycVerificationContract = IKYCVerification(_kycVerificationContractAddress);
    }

    function getKYCVerificationContractAddress() public view returns(address _kycVerificationContractAddress) {
        return address(kycVerificationContract);
    }

    /**
        Temporary helper functions
    */
    function updateUserRatio(uint256 generationRatio, address userContractAddress) public onlyOwner {
        require(userContractAddress != address(0));
        
        userManager.updateGenerationRatio(generationRatio, userContractAddress);
    }

    function isOverBalanceLimitHolder(address holderAddress) public view nonZeroAddress(holderAddress) returns(bool){
        return overBalanceLimitHolders[holderAddress];
    }

    function isInBalanceLimit(address userAddress, uint256 tokensAmount) public view returns(bool) {
        if(overBalanceLimitHolders[userAddress]) {
            return true;
        }

        uint256 userBalance = icoToken.balanceOf(userAddress);

        // Compare user balance with calculated percentage limit in tokens
        return userBalance.add(tokensAmount) <= icoToken.totalSupply().mul(balancePercentageLimit).div(100);
    }
}