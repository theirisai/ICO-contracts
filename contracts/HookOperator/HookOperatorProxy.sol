pragma solidity ^0.4.21;

import "./../Upgradeability/UpgradeableProxy.sol";

contract HookOperatorProxy is UpgradeableProxy {
    function HookOperatorProxy(address initialImplementation) public UpgradeableProxy(initialImplementation) {}
}