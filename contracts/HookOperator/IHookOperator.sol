pragma solidity ^0.4.21;

import "./../Upgradeability/OwnableUpgradeableImplementation/IOwnableUpgradeableImplementation.sol";

contract IHookOperator is IOwnableUpgradeableImplementation {
    event LogOnTransfer(address from, address to, uint tokens);
    event LogOnTaxTransfer(address taxableUser, uint tokensAmount);
    event LogOnMint(address to, uint256 amount);
    event LogOnBurn(uint amount);

    /**
        Setters
    */
    function setBalancePercentageLimit(uint256 limit) public;
    function getBalancePercentageLimit() public view returns(uint256);
    
    function setOverBalanceLimitHolder(address holderAddress, bool isHolder) public;

    function setUserManager(address userManagerAddress) public;
    function getUserManager() public view returns(address userManagerAddress);
   
    function setICOToken(address icoTokenAddress) public;
    function getICOToken() public view returns(address icoTokenAddress);

    /**
        Main Functions
    */
    function onTransfer(address from, address to, uint256 tokensAmount) public;

    function onMint(address to, uint256 tokensAmount) public;

    function onBurn(uint256 amount) public;

    function onTaxTransfer(address taxableUser, uint256 tokensAmount) public;

    /**
        KYC Verification
    */
    function kycVerification(address from, address to, uint256 tokensAmount) public;

    function setKYCVerficationContract(address _kycVerificationContractAddress) public;
    

    function getKYCVerificationContractAddress() public view returns(address _kycVerificationContractAddress);
    /**
        Helper functions
    */
    function updateUserRatio(uint256 generationRatio, address userContractAddress) public;

    function isOverBalanceLimitHolder(address holderAddress) public view returns(bool);

    function isInBalanceLimit(address userAddress, uint256 tokensAmount) public view returns(bool);
}