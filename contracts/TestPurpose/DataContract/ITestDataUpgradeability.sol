pragma solidity ^0.4.21;

import "./../../LinkedList/ILinkedListContract.sol";
import "./../../Upgradeability/OwnableUpgradeableImplementation/IOwnableUpgradeableImplementation.sol";
import "./../../User/UserFactory/IUserFactory.sol";

contract ITestDataUpgradeability is IOwnableUpgradeableImplementation, ILinkedListContract {

    event LogSettedTaxPercentage(uint256 _taxPercentage);
    event LogSeetedTaxationPeriodInSecond(uint256 _taxationPeriodInSeconds);

    function getTaxPercentage() public view returns(uint256 _taxPercentage);

    function setTaxPercentage(uint256 _taxPercentage) public;

    function getTaxationPeriodInSeconds() public view returns(uint256 _taxationPeriodInSeconds);

    function setTaxationPeriodInSeconds(uint256 _taxationPeriodInSeconds) public;
    
    function setUserManager(address _HookOperatorServiceContractAddress) public;
}