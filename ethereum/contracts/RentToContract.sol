pragma solidity ^0.5.0;


contract RentToContract {
  
  bool public circuitBreakerStopped = false;
  address owner;
  uint contractExpired; // THE RENT EXPIRATION DATE 
  // 
  string landlord;
  string tenant;
  Rent rentSetup;
  RentPayment[] payments;
  // 
  mapping(address => bool) admins;
  mapping(string => Rent) rentSetupMap;
  // 
  event RentPaymentMade(string tenantEmail, uint paymentDate, int amount);
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
    int amount;
  }

  modifier validateTenant(string memory tenantEmail) { // CHECKS IF THE TENANT (tenantEmail) INDEED IN THE RENT PAYER
    string memory te = rentSetup.tenantEmail;
    string memory tn = rentSetupMap[tenantEmail].tenantName;
    string memory mainTn = tenant;
    require((keccak256(abi.encodePacked(tenantEmail)) == keccak256(abi.encodePacked(te))), "NOT THE RIGHT TENANT");
    require((keccak256(abi.encodePacked(mainTn)) == keccak256(abi.encodePacked(tn))), "NOT THE RIGHT TENANT");
    _;
  }

  modifier isNotDeprecated {
    if(!rentContractExpired()) _;
  }

  modifier isDeprecated {
    if(rentContractExpired()) _;
  }

  function rentContractExpired() public view returns (bool) {
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

  function addAdmin(address _a) public onlyAdmin returns (bool) {
    admins[_a] = true;
    return true;
  }

  modifier stopInEmergency { require(!circuitBreakerStopped, "..."); _; }
  modifier onlyInEmergency { require(circuitBreakerStopped, "..."); _; }
  
  /* SAMPLE FUNCTIONS TO TEST THE CIRCUIT BREAKER DESIGN PATTERN ..
  function deposit() public stopInEmergency {}
  function withdraw() public onlyInEmergency {} 
  */

  constructor(string memory tenantEmail, string memory tenantName, string memory landlordName, int amount, uint duration) public {
    contractExpired = now + duration; // SET THE RENT duration AS THE DATE THAT THIS CONTRACT TO EXPIRE (Auto Deprecate Design Pattern)
    owner = msg.sender; 
    // addAdmin(msg.sender);
    tenant = tenantName; landlord = landlordName;
    RentPayment memory payment = RentPayment({
      tenantEmail: tenantEmail,
      paymentDate: now,
      amount: amount
    }); // SETUP THE FIRST RENT PAYMENT OBJECT
    rentSetup = Rent({
      tenantEmail: tenantEmail,
      tenantName: tenantName,
      landlordName: landlordName,
      firstPayment: payment,
      firstPaymentDate: payment.paymentDate,
      rentExpirationDate: contractExpired
    }); // SETUP THE RENT OBJECT
    rentSetupMap[tenantEmail] = rentSetup; // DO THIS IN CASE IN FUTURE, YOU'LL WANT TO MANAGE MULTIPLE RENT SETUPS
    payments.push(payment); // LET'S NOT emit THE RentPaymentMade() EVENT ON THE 1ST PAYMENT
  }

  function receiveMonthlyRent(string memory tenantEmail, int amount) public 
    ownerOnly() 
    // onlyAdmin()
    isNotDeprecated() 
    validateTenant(tenantEmail) 
  {
    RentPayment memory payment = RentPayment({
      tenantEmail: tenantEmail,
      paymentDate: now,
      amount: amount
    }); // SETUP A RENT PAYMENT OBJECT
    payments.push(payment);
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
