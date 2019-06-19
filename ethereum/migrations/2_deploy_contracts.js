const EnlistmentToContract = artifacts.require("EnlistmentToContract");
const RentToContract = artifacts.require("RentToContract");

module.exports = function(deployer) {
    // MAKE SURE YOU DEPLOY THE SMART CONTRACT WITH INITIAL ARGUMENTS FOR ITS CONSTRUCTOR ..
    // string memory landlordEmail, string memory streetName, int floorNr, int apartmentNr, int houseNr, int postalCode
    deployer.deploy(EnlistmentToContract, "", "", 1, 1, 1, 1);
    deployer.deploy(RentToContract);
};