pragma solidity ^0.4.21;

import "./../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./../../node_modules/zeppelin-solidity/contracts/lifecycle/Pausable.sol";

/**
 * @title ExchangeOracle
 * @dev Oracle for the AIUR exchange rate
 * Allows setting Wei to AIURwei rate
 */
contract ExchangeOracle is Ownable, Pausable {
    bool public isIrisOracle = true;

    uint public rate = 0;
    uint public minWeiAmount = 1000; 

    event LogRateChanged(uint oldRate, uint newRate, address changer);
    event LogMinWeiAmountChanged(uint oldMinWeiAmount, uint newMinWeiAmount, address changer);

    function ExchangeOracle(uint initialRate) public {
        require(initialRate > 0);
        rate = initialRate;
    }

    function rate() public constant whenNotPaused returns(uint) {
        return rate;
    }

    function setRate(uint newRate) public onlyOwner whenNotPaused returns(bool) {
        require(newRate > 0);
        
        uint oldRate = rate;
        rate = newRate;

        emit LogRateChanged(oldRate, newRate, msg.sender);

        return true;
    }

    function setMinWeiAmount(uint newMinWeiAmount) public onlyOwner whenNotPaused returns(bool) {
        require(newMinWeiAmount > 0);

        uint oldMinWeiAmount = minWeiAmount;
        minWeiAmount = newMinWeiAmount;

        emit LogMinWeiAmountChanged(minWeiAmount, oldMinWeiAmount, msg.sender);

        return true;
    }
}
