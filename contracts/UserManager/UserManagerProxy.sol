pragma solidity ^0.4.21;

import "./../Upgradeability/UpgradeableProxy.sol";

contract UserManagerProxy is UpgradeableProxy {
    function UserManagerProxy(address initialImplementation) public UpgradeableProxy(initialImplementation) {}
}