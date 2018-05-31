pragma solidity ^0.4.21;

import "./../../Upgradeability/UpgradeableProxy.sol";

contract UserFactoryProxy is UpgradeableProxy {
    function UserFactoryProxy(address initialImplementation) public UpgradeableProxy(initialImplementation) {}
}