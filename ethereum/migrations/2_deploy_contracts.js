const EnlistmentToContract = artifacts.require("EnlistmentToContract");
const RentToContract = artifacts.require("RentToContract");
const SafeMathLibrary = artifacts.require("SafeMath");

module.exports = function(deployer) {
    // MAKE SURE YOU DEPLOY THE SMART CONTRACT WITH INITIAL ARGUMENTS FOR ITS CONSTRUCTOR ..
    
    // string memory landlordEmail, string memory streetName, int floorNr, int apartmentNr, int houseNr, int postalCode
    deployer.deploy(EnlistmentToContract, 'landlord@email.xd', 'Waker', 3, 2, 1, 15000);
    deployer.deploy(SafeMathLibrary);
    deployer.link(SafeMathLibrary, RentToContract);
    // string memory tenantEmail, string memory tenantName, string memory landlordName, uint amount, uint duration
    deployer.deploy(RentToContract, 'cassian@reply', 'Cassian', 'Waker', 100, 1000000000000);
};