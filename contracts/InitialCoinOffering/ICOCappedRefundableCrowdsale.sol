pragma solidity ^0.4.21;

import "./ICOCrowdsale.sol";
import "./CrowdsaleRefund/RefundableCrowdsale.sol";
import "./../../node_modules/zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol";

contract ICOCappedRefundableCrowdsale is CappedCrowdsale, ICOCrowdsale, RefundableCrowdsale {

    function ICOCappedRefundableCrowdsale(uint256 startTime, uint256 endTime, uint256 hardCap, uint256 softCap, address wallet, address HookOperatorContractAddress) public
        FinalizableCrowdsale()
        ICOCrowdsale(startTime, endTime, wallet, HookOperatorContractAddress)
        CappedCrowdsale(hardCap)
        RefundableCrowdsale(softCap)
    {
        require(softCap <= hardCap);
    }
} 