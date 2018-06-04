pragma solidity ^0.4.21;

import "./../Upgradeability/UpgradeableProxy.sol";

contract KYCVerificationProxy is UpgradeableProxy {
    constructor(address initialImplementation) public UpgradeableProxy(initialImplementation) {}
}