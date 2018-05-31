pragma solidity ^0.4.21;

import "./../../../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";
import "./../../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";

contract RefundVault is Ownable {
    using SafeMath for uint256;

    /* 
        To cover the costs for paying investor related functions by ourselfs as: 
            "add investor in the whitelist" and etc.

        We are getting 3% of the investor's deposit only if the soft cap
        is not reached and the investor refund his contribution
    */
    uint256 public constant DEDUCTION = 3;
    uint256 public totalDeductedValue;

    enum State { Active, Refunding, Closed }

    mapping (address => uint256) public deposited;
    address public wallet;
    State public state;

    event Closed();
    event RefundsEnabled();
    event Refunded(address indexed beneficiary, uint256 weiAmount);

    function RefundVault(address _wallet) public {
        require(_wallet != address(0));
        
        wallet = _wallet;
        state = State.Active;
    }

    function deposit(address investor) onlyOwner public payable {
        require(state == State.Active);

        deposited[investor] = deposited[investor].add(msg.value);
    }

    function close() onlyOwner public {
        require(state == State.Active);
        
        state = State.Closed;
        Closed();
        wallet.transfer(this.balance);
    }

    function enableRefunds() onlyOwner public {
        require(state == State.Active);

        state = State.Refunding;
        RefundsEnabled();
    }

    function refund(address investor) public {
        require(state == State.Refunding);

        uint256 depositedValue = deposited[investor];
        uint256 deductedValue = depositedValue.mul(DEDUCTION).div(100);
        
        deposited[investor] = 0;

        investor.transfer(depositedValue.sub(deductedValue));
        wallet.transfer(deductedValue);
        
        totalDeductedValue = totalDeductedValue.add(deductedValue);

        Refunded(investor, depositedValue);
    }
}