pragma solidity ^0.4.21;

import "./../Upgradeability/UpgradeableProxy.sol";

contract UserManagerProxy is UpgradeableProxy {
    constructor(address initialImplementation) public UpgradeableProxy(initialImplementation) {}
}