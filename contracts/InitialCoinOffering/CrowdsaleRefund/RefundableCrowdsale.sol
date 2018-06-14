pragma solidity ^0.4.21;

import "./RefundVault.sol";
import "./../../../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";
import "./../../../node_modules/zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol";

contract RefundableCrowdsale is FinalizableCrowdsale {
    using SafeMath for uint256;

    uint256 public goal;

    RefundVault public vault;

    constructor(uint256 _goal) public {
        require(_goal > 0);
        vault = new RefundVault(wallet);
        goal = _goal;
    }

    function forwardFunds() internal {
        vault.deposit.value(msg.value)(msg.sender);
    }

    function claimRefund() external {
        require(isFinalized);
        require(!goalReached());

        vault.refund(msg.sender);
    }

    function finalization() internal {
        if (goalReached()) {
            vault.close();
        } else {
            vault.enableRefunds();
        }

        super.finalization();
    }

    function goalReached() public view returns (bool) {
        return weiRaised >= goal;
    }
}

