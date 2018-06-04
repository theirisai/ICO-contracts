pragma solidity ^0.4.21;

import "./../../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";
import "./../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./../../contracts/InitialCoinOffering/ICOTokenExtended.sol";
import "./../../contracts/HookOperator/IHookOperator.sol";

contract Vesting is Ownable {

    using SafeMath for uint256;

    address public overDepositTokensRecipient;

    ICOTokenExtended public tokenInstance;
    IHookOperator public hookOperator;

    bool public isTwentyFivePercentageClaimed;
    uint256 public constant TWENTY_FIVE_PERCENTAGE_DELIMITER = 4; // total balance / 4 => 25%
    address public twentyFivePercentageClaimer; // Can claim 25% of the contract's ethers
    uint256 public twentyFivePercentageClaimStartDate;
    
    uint256 public constant SEVENTY_FIVE_PERCENTAGE_MULTIPLIER = 3; // (total balance / 4) * 3 => 25% * 3 = 75%
    address public seventyFivePercentageClaimer; // Can claim 75% of the contract's ethers
    uint256 public seventyFivePercentageClaimStartDate;

    uint256 public constant SEVENTY_FIVE_PERCENTAGE_NOTCLAIM_DURATION = 8 weeks; // Two months after which we can claim 75%

    event LogTwentyFivePercantageWithdrawing(address withdrawer);
    event LogSeventyFivePercantageWithdrawing(address withdrawer);
    event LogOverDepositsRefund(
        address investorAddress, 
        uint overDepositedTokens, 
        uint ethersToRefund, 
        uint rate, 
        address overDepositTokensRecipientAddress
    );

    modifier nonZeroAddress(address addressForValidation) {
        require(addressForValidation != address(0));

        _;
    }

    modifier onlyRightfulWithdrawer(address claimer) {
        require(msg.sender == claimer || msg.sender == owner);

        _;
    }

    constructor(address claimerAddress, uint256 startTime) public nonZeroAddress(claimerAddress) {
        require(startTime >= now);

        twentyFivePercentageClaimer = claimerAddress;
        seventyFivePercentageClaimer = claimerAddress;
        isTwentyFivePercentageClaimed = false;

        twentyFivePercentageClaimStartDate = startTime;

        // We can claim 75% two months after the beginning
        seventyFivePercentageClaimStartDate = startTime.add(SEVENTY_FIVE_PERCENTAGE_NOTCLAIM_DURATION); 
    }

    function setTokenInstance(address tokenInstanceAddress) public onlyOwner nonZeroAddress(tokenInstanceAddress) {
        tokenInstance = ICOTokenExtended(tokenInstanceAddress);
    }

    function setHookOperator(address hookOperatorAddress) public onlyOwner nonZeroAddress(hookOperatorAddress) {
        hookOperator = IHookOperator(hookOperatorAddress);
    }

    function setSeventyFivePercantageClaimer(address newClaimer) public onlyOwner nonZeroAddress(newClaimer) {
        seventyFivePercentageClaimer = newClaimer;
    }

    function withdrawTwentyFivePercantage() public onlyRightfulWithdrawer(twentyFivePercentageClaimer) {

        require(twentyFivePercentageClaimStartDate <= now);
        require(!isTwentyFivePercentageClaimed);

        isTwentyFivePercentageClaimed = true;

        uint ethToSend = address(this).balance.div(TWENTY_FIVE_PERCENTAGE_DELIMITER); // 25% of the ethers

        twentyFivePercentageClaimer.transfer(ethToSend);

        emit LogTwentyFivePercantageWithdrawing(msg.sender);
    } 

    /*
        This function is used for withdrawing 75% of the contract ethers.
        It can be called 2 months after the crowdsale end date
    */
    function withdrawSeventyFivePercantage() public onlyRightfulWithdrawer(seventyFivePercentageClaimer) {
        require(seventyFivePercentageClaimStartDate <= now);

        if(isTwentyFivePercentageClaimed){
            seventyFivePercentageClaimer.transfer(address(this).balance);
        }else{
            uint ethToSend = address(this).balance.div(TWENTY_FIVE_PERCENTAGE_DELIMITER).mul(SEVENTY_FIVE_PERCENTAGE_MULTIPLIER); // 75% of the ethers
            seventyFivePercentageClaimer.transfer(ethToSend);
        }

        emit LogSeventyFivePercantageWithdrawing(msg.sender);
    }

    function setOverDepositTokensRecipient(address newRecipient) public onlyOwner nonZeroAddress(newRecipient) {
        overDepositTokensRecipient = newRecipient;
    } 

    function refundOverDeposits(address investor, uint rate) public onlyOwner nonZeroAddress(investor) {
        uint256 oracleRate = tokenInstance.aiurExchangeOracle().rate();
        require(rate > oracleRate.div(tokenInstance.MIN_REFUND_RATE_DELIMITIER())); // rate has to be minimum 50% of the oracle rate

        uint256 investorBalance = tokenInstance.balanceOf(investor);
        
        // Calculate percentage limit in tokens
        uint256 maxTokensBalance = tokenInstance.totalSupply().mul(hookOperator.getBalancePercentageLimit()).div(100);

        require(investorBalance > maxTokensBalance);

        uint256 overDepositedTokens = investorBalance.sub(maxTokensBalance);
        uint256 ethersToRefund = overDepositedTokens.div(rate);

        tokenInstance.transferOverBalanceFunds.value(ethersToRefund)(investor, overDepositTokensRecipient, rate);

        emit LogOverDepositsRefund(investor, overDepositedTokens, ethersToRefund, rate, overDepositTokensRecipient);
    }

    function() public payable { }
}