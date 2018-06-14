pragma solidity ^0.4.21;

import "./../LinkedList/ILinkedListContract.sol";
import "./../Upgradeability/OwnableUpgradeableImplementation/IOwnableUpgradeableImplementation.sol";
import "./../User/UserFactory/IUserFactory.sol";

contract IDataContract is IOwnableUpgradeableImplementation, ILinkedListContract {

    event LogTaxPercentageSet(uint256 _taxPercentage);
    event LogTaxationPeriodInSecondsSet(uint256 _taxationPeriodInSeconds);

    function getTaxPercentage() external view returns(uint256 _taxPercentage);

    function setTaxPercentage(uint256 _taxPercentage) external;

    function getTaxationPeriodInSeconds() external view returns(uint256 _taxationPeriodInSeconds);

    function setTaxationPeriodInSeconds(uint256 _taxationPeriodInSeconds) external;
}