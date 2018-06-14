pragma solidity ^0.4.21;

import "./IDataContract.sol";
import "./../User/UserFactory/IUserFactory.sol";
import "./../LinkedList/LinkedListContract.sol";
import "./../Upgradeability/OwnableUpgradeableImplementation/OwnableUpgradeableImplementation.sol";

contract DataContract is IDataContract, OwnableUpgradeableImplementation, LinkedListContract  {

    uint256 public taxPercentage;
    uint256 public taxationPeriodInSeconds;

    function getTaxPercentage() external view returns(uint256 _taxPercentage) {
        return taxPercentage;
    }

    function setTaxPercentage(uint256 _taxPercentage) external onlyUserManager {
        taxPercentage = _taxPercentage;

        emit LogTaxPercentageSet(taxPercentage);
    }

    function getTaxationPeriodInSeconds() external view returns(uint256 _taxationPeriodInSeconds) {
        return taxationPeriodInSeconds;
    }

    function setTaxationPeriodInSeconds(uint256 _taxationPeriodInSeconds) external onlyUserManager {
        taxationPeriodInSeconds = _taxationPeriodInSeconds;
        
        emit LogTaxationPeriodInSecondsSet(taxationPeriodInSeconds);
    }
}