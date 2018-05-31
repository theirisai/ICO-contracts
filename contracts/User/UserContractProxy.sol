pragma solidity ^0.4.21;

import "./../Upgradeability/Forwardable.sol";
import "./UserFactory/IUserFactory.sol";

contract UserContractProxy is Forwardable {
    IUserFactory userFactoryContract;

    function UserContractProxy(address _userFactoryAddress) public {
        require(_userFactoryAddress != address(0));
    
        userFactoryContract = IUserFactory(_userFactoryAddress);
    }

    /**
    * @dev All calls made to the proxy are forwarded to the contract implementation via a delegatecall
    * @return Any bytes32 value the implementation returns
    */
    function () payable public {
        address userImplAddress = userFactoryContract.getImplAddress();
        delegatedFwd(userImplAddress, msg.data);
    }
}