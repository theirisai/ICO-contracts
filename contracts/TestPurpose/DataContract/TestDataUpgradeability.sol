pragma solidity ^0.4.21;

import "./ITestDataUpgradeability.sol";
import "./../../LinkedList/LinkedListContract.sol";
import "./../../../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";
import "./../../Upgradeability/OwnableUpgradeableImplementation/OwnableUpgradeableImplementation.sol";

contract TestDataUpgradeability is ITestDataUpgradeability, OwnableUpgradeableImplementation, LinkedListContract {

    uint256 public taxPercentage;
    uint256 public taxationPeriodInSeconds;

    // Added for testing upgradeability purpose
    using SafeMath for uint256;
    uint256 public percentage_delimiter;

    function setPercentageDelimiter(uint newPercentageDelimiter) public {
        percentage_delimiter = newPercentageDelimiter;
    }

    // The logic is changed for testing upgradeability purpose
    function getTaxPercentage() public view returns(uint256 _taxPercentage) {
        return taxPercentage.div(percentage_delimiter);
    }

    function setTaxPercentage(uint256 _taxPercentage) public {
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