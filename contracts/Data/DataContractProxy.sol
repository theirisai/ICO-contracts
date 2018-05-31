pragma solidity ^0.4.21;

import "./../Upgradeability/UpgradeableProxy.sol";

contract DataContractProxy is UpgradeableProxy {
    function DataContractProxy(address initialImplementation) public UpgradeableProxy(initialImplementation) {}
}