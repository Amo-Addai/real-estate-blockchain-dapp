pragma solidity ^0.5.0;


// import "github.com/oraclize/ethereum-api/oraclizeAPI.sol"; // ORACLIZE LIBRARY TO BE INTEGRATED SOON ..
import "./SafeMath.sol"; // LIBRARY TO MAKE SAFE MATHEMATICAL CALCULATIONS IN THIS CONTRACT


// contract RentToContract is usingOraclize {
contract RentToContract {
   
  /* // ALL THE STUFF YOU'LL NEED TO INTEGRATE WITH ORACLIZE, USING Provable
  uint public balance;

  event Log(string text);
  

  function __callback(bytes32 _myid, string memory _result) {
      require (msg.sender == oraclize_cbAddress());
      Log(_result);
      price = parseInt(_result, 2); // let's save it as $ cents
  }
  
  function updatePrice() public payable {
    emit Log("Oraclize query was sent, waiting for the answer..");
    oraclize_query("URL","json(https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD).USD");
    
    if (oraclize_getPrice("URL") > balance) {
      emit Log("Oraclize query was NOT sent, please add some ETH to cover for the query fee");
    } else {
      emit Log("Oraclize query was sent, standing by for the answer..");
      oraclize_query("URL", "json(https://api.pro.coinbase.com/products/ETH-USD/ticker).price");
    }
  }
  */

  using SafeMath for uint;
  
  bool public circuitBreakerStopped = false;
  address owner;
  uint contractExpired; // THE RENT EXPIRATION DATE 
  // 
  string landlord;
  string tenant;
  uint totalRentPaid;
  Rent rentSetup;
  RentPayment[] payments;
  // 
  mapping(address => bool) admins;
  mapping(string => Rent) rentSetupMap;

  // GETTER FUNCTIONS 

  function getOwner() public view ownerOnly() returns (address) {
    return owner;
  }

  function getLandlord() public view ownerOnly() returns (string memory) {
    return landlord;
  }

  function getTenant() public view ownerOnly() returns (string memory) {
    return tenant;
  }

  function getTotalRentPaid() public view ownerOnly() returns (uint) {
    return totalRentPaid;
  }

  function getNumberOfPayments() public view ownerOnly() returns (uint) {
    return payments.length;
  }

  function getRent() public view ownerOnly() returns (string memory, string memory, uint, uint) {
    return (rentSetup.landlordName, rentSetup.tenantName, rentSetup.firstPaymentDate, rentSetup.rentExpirationDate);
  }
  // 
  event RentPaymentMade(string tenantEmail, uint paymentDate, uint amount);
  // 
  struct Rent {
    string landlordName;
    string tenantName;
    string tenantEmail;
    RentPayment firstPayment;
    uint firstPaymentDate;
    uint rentExpirationDate;
  }

  struct RentPayment {
    string tenantEmail;
    uint paymentDate;
    uint amount;
  }

  modifier validateTenant(string memory tenantEmail) { // CHECKS IF THE TENANT (tenantEmail) INDEED IN THE RENT PAYER
    string memory te = rentSetup.tenantEmail;
    string memory tn = rentSetupMap[tenantEmail].tenantName;
    string memory mainTn = tenant;
    require((keccak256(abi.encodePacked(tenantEmail)) == keccak256(abi.encodePacked(te))), "NOT THE RIGHT TENANT");
    require((keccak256(abi.encodePacked(mainTn)) == keccak256(abi.encodePacked(tn))), "NOT THE RIGHT TENANT");
    _;
  }
  
  modifier validateAmount(uint amount) { // CHECKS IF THE AMOUNT IS HIGHER THAN 0
    throwsErrorIfZero(amount); // NO NEED TO WORK WITH THE RETURN VALUE FOR NOW ..
    _;
  }

  function throwsErrorIfZero(uint num) private pure returns (uint) {
    require(num != 0);
    return num;
  }

  modifier isNotDeprecated {
    if(!rentContractExpired()) _;
  }

  modifier isDeprecated {
    if(rentContractExpired()) _;
  }

  function rentContractExpired() private view returns (bool) {
    return now > contractExpired;
  }

  modifier ownerOnly() {
    require(msg.sender == owner);
    _;
  }

  modifier onlyAdmin {
    require(admins[msg.sender] == true, "NOT AN ADMIN");
    _;
  }

  function addAdmin(address _a) private onlyAdmin returns (bool) {
    admins[_a] = true;
    return true;
  }

  modifier stopInEmergency { require(!circuitBreakerStopped, "..."); _; }
  modifier onlyInEmergency { require(circuitBreakerStopped, "..."); _; }
  
  /* SAMPLE FUNCTIONS TO TEST THE CIRCUIT BREAKER DESIGN PATTERN ..
  function deposit() public stopInEmergency {}
  function withdraw() public onlyInEmergency {} 
  */


  constructor(string memory tenantEmail, string memory tenantName, string memory landlordName, uint amount, uint duration) public {
    contractExpired = now + duration; // SET THE RENT duration AS THE DATE THAT THIS CONTRACT TO EXPIRE (Auto Deprecate Design Pattern)
    owner = msg.sender; 
    // addAdmin(msg.sender);
    tenant = tenantName; landlord = landlordName;
    RentPayment memory payment1 = RentPayment({
      tenantEmail: tenantEmail,
      paymentDate: now,
      amount: amount
    }); // SETUP THE FIRST RENT PAYMENT OBJECT
    rentSetup = Rent({
      tenantEmail: tenantEmail,
      tenantName: tenantName,
      landlordName: landlordName,
      firstPayment: payment1,
      firstPaymentDate: payment1.paymentDate,
      rentExpirationDate: contractExpired
    }); // SETUP THE RENT OBJECT
    rentSetupMap[tenantEmail] = rentSetup; // DO THIS IN CASE IN FUTURE, YOU'LL WANT TO MANAGE MULTIPLE RENT SETUPS
    payments.push(payment1); // LET'S NOT emit THE RentPaymentMade EVENT ON THE 1ST PAYMENT
    totalRentPaid = totalRentPaid.add(payment1.amount);
  }

  function receiveMonthlyRent(string memory tenantEmail, uint amount) public payable
    ownerOnly() 
    // onlyAdmin()
    isNotDeprecated() 
    validateAmount(amount)
    validateTenant(tenantEmail) 
  { // WHEN EXPANDING THE PLATFORM, THIS FUNCTION SHOULD BE ABLE TO RECEIVE RENT IN ETHER TOO ..
    RentPayment memory payment = RentPayment({
      tenantEmail: tenantEmail,
      paymentDate: now,
      amount: amount
    }); // SETUP A RENT PAYMENT OBJECT
    payments.push(payment); // ADD RENT payment, THEN EMIT THE RentPaymentMade EVENT
    totalRentPaid = totalRentPaid.add(payment.amount);
    emit RentPaymentMade(payment.tenantEmail, payment.paymentDate, payment.amount);
  }

  function killContract() public ownerOnly() {
    selfdestruct(address(uint160(owner))); // TAKES AN ADDRESS OF CONTRACT TO KILL
  }

  // FALLBACK FUNCTION TO RUN WHENEVER THERE'S SOME KINDA ISSUE ..
  function () external payable { // NO function name, params, or return values ..
      /* THIS FALLBACK FUNCTION WILL EXECUTE IF THE CLIENT CALLS A FUNCTION
        THAT DOESN'T EXIST IN THIS CONTRACT (i.e. funct's identifier isn't defined)
        CONTRACTS CAN HAVE ONLY 1 FALLBACK FUNCTION
        AUTOMATICALLY HAS A GAS LIMIT OF 2300, 
        MAKE FALLBACK FUNCTIONS AS CHEAP AS POSSIBLE
      */
  }

}
