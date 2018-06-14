pragma solidity ^0.4.21;

import "./../../../Data/IDataContract.sol";
import "./../../../User/IUserContract.sol";
import "./../../../Upgradeability/OwnableUpgradeableImplementation/IOwnableUpgradeableImplementation.sol";

contract ITestUserFactoryUpgradeabiliy is IOwnableUpgradeableImplementation {

    event LogExchangeUserCreation(address _exchangeUserAddress, uint256 _KYCStatus);
    event LogUserContractCreation(address _userAddress, uint256 _KYCStatus);
    event LogUserCreatorSet(address _newUserCreator);

     // This function is used in upgradeability test
    function deleteUser(address _userAddress) external;

    /**
        User Functions
    */
    function createExchangeUser(address _exchangeUserAddress, uint256 _KYCStatus) external returns(bool _success);
 
    function createNewUser(address _userAddress, uint256 _KYCStatus) external returns(bool _success);
    
    function createUserContract(address _newUserAddress) internal returns(IUserContract);



    function isUserExisting(address _userAddress) external view returns(bool _isExisting);

    function getUserById(uint _userId) external view returns(address _userAddress);

    function getUserContract(address _userAddress) external view returns(IUserContract _userContract);

    /**
        User Creator
    */
    function setUserCreator(address _newUserCreator) external;

    function getUserCreator() external view returns(address);

    /**
        Hook Operator    
    */
    function setHookOperatorAddress(address _hookOperatorContractAddress) external;

    function getHookOperatorAddress() external view returns(address _hookOperatorContractAddress);

    /**
        User Managers
    */
    function setUserManagerAddress(address _userManagerContractAddress) external;

    function getUserManagerContractAddress() external view returns(address _userManagerContractAddress);

    /**
        User Factory Upgradeability
    */
    function setImplAddress(address _implAddress) external;

    function getImplAddress() external view returns(address _implAddress);

    /**
        KYC Verification Contract
    */
    function setKYCVerificationInstance(address _kycVerification) external;

    function getKYCVerificationInstance() external view returns(address);

    /**
        Data Contract
    */
    function setDataContract(address _dataContractAddress) external;

    function getDataContract() external view returns(IDataContract _dataContractInstance);

   
   
}