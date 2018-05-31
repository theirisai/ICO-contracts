pragma solidity ^0.4.21;

import "./ITestDataUpgradeability.sol";
import "./../../LinkedList/LinkedListContract.sol";
import "./../../Upgradeability/OwnableUpgradeableImplementation/OwnableUpgradeableImplementation.sol";

contract TestDataUpgradeability is ITestDataUpgradeability, OwnableUpgradeableImplementation, LinkedListContract  {

    uint256 public taxPercentage;
    uint256 public taxationPeriodInSeconds;

    uint256 public defaultPercentage = 10;

    /*
        The differences between the original data contract and test purposes one is only in the getTaxPercentage function
    */
    function getTaxPercentage() public view returns(uint256 _taxPercentage) {
        return defaultPercentage;
    }

    function setTaxPercentage(uint256 _taxPercentage) public onlyUserManager {
        taxPercentage = _taxPercentage;

        emit LogSettedTaxPercentage(taxPercentage);
    }

    function getTaxationPeriodInSeconds() public view returns(uint256 _taxationPeriodInSeconds) {
        return taxationPeriodInSeconds;
    }

    function setTaxationPeriodInSeconds(uint256 _taxationPeriodInSeconds) public onlyUserManager {
        taxationPeriodInSeconds = _taxationPeriodInSeconds;
        
        emit LogSeetedTaxationPeriodInSecond(taxationPeriodInSeconds);
    }    
}