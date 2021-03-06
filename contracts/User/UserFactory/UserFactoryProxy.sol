pragma solidity ^0.4.21;

import "./../../Upgradeability/UpgradeableProxy.sol";

contract UserFactoryProxy is UpgradeableProxy {
    constructor(address initialImplementation) public UpgradeableProxy(initialImplementation) {}
}