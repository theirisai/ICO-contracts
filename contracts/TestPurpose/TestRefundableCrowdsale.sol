pragma solidity ^0.4.18;


import "./../InitialCoinOffering/CrowdsaleRefund/RefundableCrowdsale.sol";


contract TestRefundableCrowdsale is RefundableCrowdsale {

    function TestRefundableCrowdsale (
        uint256 startTime,
        uint256 endTime,
        uint256 rate,
        address wallet,
        uint256 goal
    ) public
        Crowdsale(startTime, endTime, rate, wallet)
        RefundableCrowdsale(goal)
    {
    }
}