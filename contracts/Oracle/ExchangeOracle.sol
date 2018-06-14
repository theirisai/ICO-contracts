pragma solidity ^0.4.21;

import "./../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./../../node_modules/zeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "./../../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title ExchangeOracle
 * @dev Oracle for the AIUR exchange rate
 * Allows setting Wei to AIUR Wei rate
 */
contract ExchangeOracle is Ownable, Pausable {

    using SafeMath for uint;

    bool public isIrisOracle = true;

    uint public rate = 0;
    uint public minWeiAmount = 1000; 

    event LogRateChanged(uint oldRate, uint newRate, address changer);
    event LogMinWeiAmountChanged(uint oldMinWeiAmount, uint newMinWeiAmount, address changer);

    constructor(uint initialRate) public {
        require(initialRate > 0);
        rate = initialRate;
    }

    function rate() external view whenNotPaused returns(uint) {
        return rate;
    }

    /*
        The new rate has to be passed in format:
            100 rate = 100 000 passed rate ( 1 ether = 100 tokens )
            1 rate = 1 000 passed rate ( 1 ether = 1 token )
            0.01 rate = 10 passed rate ( 100 ethers = 1 token )
    **/
    function setRate(uint newRate) external onlyOwner whenNotPaused returns(bool) {
        require(newRate > 0);
        
        uint oldRate = rate;
        rate = newRate;

        emit LogRateChanged(oldRate, newRate, msg.sender);

        return true;
    }

    /*
        By default minWeiAmount = 1000
        With min wei amount we can set the rate to be a float number

        We use it as a multiplier because we can not pass float numbers in ethereum
        If the token price becomes bigger than ether one, for example -> 1 token = 10 ethers
        We will pass 100 as rate and this will be relevant to 0.1 token = 1 ether
    **/
    function setMinWeiAmount(uint newMinWeiAmount) external onlyOwner whenNotPaused returns(bool) {
        require(newMinWeiAmount > 0);
        require(newMinWeiAmount % 10 == 0); 

        uint oldMinWeiAmount = minWeiAmount;
        minWeiAmount = newMinWeiAmount;

        emit LogMinWeiAmountChanged(oldMinWeiAmount, minWeiAmount, msg.sender);

        return true;
    }

    function convertTokensAmountInWeiAtRate(uint tokensAmount, uint convertRate) external whenNotPaused view returns(uint) {

        uint weiAmount = tokensAmount.mul(minWeiAmount);
        weiAmount = weiAmount.div(convertRate);

        if ((tokensAmount % convertRate) != 0) {
            weiAmount++;
        } 

        return weiAmount;
    }

    function calcWeiForTokensAmount(uint tokensAmount) external view whenNotPaused returns(uint) {
        
        uint weiAmount = tokensAmount.mul(minWeiAmount);
        weiAmount = weiAmount.div(rate);

        if ((tokensAmount % rate) != 0) {
            weiAmount++;
        } 

        return weiAmount;
    }
}
