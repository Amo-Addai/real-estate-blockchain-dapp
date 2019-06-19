pragma solidity ^0.5.0;

import "./RentToContract.sol";


contract EnlistmentToContract {

    // MAIN VARIABLES THE CONTRACT WILL BE WORKING WITH

    address owner;
    string landlord;
    bool public locked = false;
    Enlistment enlistment;
    // 
    mapping(string => Offer) tenantOfferMap;
    mapping(string => AgreementDraft) tenantAgreementMap;
    // 
    uint private rentAmount;
    address private rentToContractAddress;
    RentToContract private rentToContract;

    constructor(string memory landlordEmail, string memory streetName, int floorNr, int apartmentNr, int houseNr, int postalCode) public
    {   // CREATE A NEW ENLISTMENT STRUCT OBJECT FROM THE PASSED IN ARGUMENTS 
        enlistment = Enlistment(streetName, floorNr, apartmentNr, houseNr, postalCode);
        landlord = landlordEmail;
        owner = msg.sender;
    }

    // GETTER FUNCTIONS 

    function getOwner() public view ownerOnly() returns (address) {
        return owner;
    }

    function getLandlord() public view ownerOnly() returns (string memory) {
        return landlord;
    }

    function getEnlistment() public view ownerOnly() returns (string memory, int, int, int, int) {
        return (enlistment.streetName, enlistment.floorNr, enlistment.apartmentNr, enlistment.houseNr, enlistment.postalCode);
    }

    // MAIN ENUMERATIONS THE CONTRACT WILL BE WORKING WITH

    enum OfferStatus { // CURRENT STATE OF ANY OFFER SUBMITTED FOR A PROPERTY
        PENDING,
        REJECTED,
        CANCELLED,
        ACCEPTED
    }

    enum AgreementStatus { // CURRENT STATE OF ANY AGREEMENT REGARDING AN OFFER
        UNINITIALIZED, // internal
        PENDING,
        REJECTED,
        CONFIRMED,
        CANCELLED,
        LANDLORD_SIGNED,
        TENANT_SIGNED,
        COMPLETED
    }

    // MAIN STRUCTS (Enlistment, Offer, AgreementDraft) THE CONTRACT WILL BE WORKING WITH
    // NOTE: These could've been made separate Smart Contracts instead (would probably work better that way)

    struct Enlistment {
        string streetName;
        int floorNr;
        int apartmentNr;
        int houseNr;
        int postalCode;
    }

    struct Offer {
        bool initialized;
        int amount;
        string tenantName;
        string tenantEmail;
        OfferStatus status;
    }

    struct AgreementDraft {
        string landlordName; // for simplicity, there is only one landlord
        string tenantName; // for simplicity, there is only one tenant and occupants are omitted
        string tenantEmail;
        int amount;
        uint leaseStart;
        uint handoverDate;
        uint leasePeriod;
        string otherTerms;
        string agreementHash;
        string landlordSignedHash;
        string tenantSignedHash;
        AgreementStatus status;
    }

    // MAIN MODIFIERS THE CONTRACT WILL BE WORKING WITH

    modifier noActiveOffer(string memory tenantEmail) { // CHECKS IF THE TENANT (tenantEmail) INDEED HAS NO ACTIVE OFFER
        require(tenantOfferMap[tenantEmail].initialized == false || tenantOfferMap[tenantEmail].status == OfferStatus.REJECTED || tenantOfferMap[tenantEmail].status == OfferStatus.CANCELLED);
        _;
    }

    modifier offerExists(string memory tenantEmail) { // CHECKS IF THE TENANT (tenantEmail) HAS INDEED MADE AN OFFER
        require(tenantOfferMap[tenantEmail].initialized == true);
        _;
    }

    modifier offerInStatus(OfferStatus status, string memory tenantEmail) { // CONFIRMS STATUS OF THE OFFER IN QUESTION
        require(tenantOfferMap[tenantEmail].status == status);
        _;
    }

    modifier offerCancellable(string memory tenantEmail) { // CONFIRMS IF AN OFFER ISN'T ALREADY A DONE DEAL
        OfferStatus offerStatus = tenantOfferMap[tenantEmail].status;
        require(offerStatus == OfferStatus.PENDING || offerStatus == OfferStatus.ACCEPTED);
        AgreementStatus agreementStatus = tenantAgreementMap[tenantEmail].status;
        require(!(agreementStatus == AgreementStatus.CANCELLED || agreementStatus == AgreementStatus.TENANT_SIGNED || agreementStatus == AgreementStatus.COMPLETED));
        _;
    }

    modifier agreementCanBeSubmitted(string memory tenantEmail) { // CONFIRMS IF THERE'S NO ACTIVE AGREEMENT AWAITING SIGNATURE CONSUMATION
        require(tenantAgreementMap[tenantEmail].status == AgreementStatus.UNINITIALIZED || tenantAgreementMap[tenantEmail].status == AgreementStatus.REJECTED || tenantAgreementMap[tenantEmail].status == AgreementStatus.CANCELLED);
        _;
    }

    modifier agreementInStatus(AgreementStatus status, string memory tenantEmail) {
        require(tenantAgreementMap[tenantEmail].status == status); // VALIDATES THE AGREEMENT'S STATUS
        _;
    }

    modifier agreementCancellable(string memory tenantEmail) { // CONFIRMS IF AN AGREEMENT ISN'T ALREADY A DONE DEAL (OR HASN'T BEEN REJECTED)
        AgreementStatus agreementStatus = tenantAgreementMap[tenantEmail].status;
        require(!(agreementStatus == AgreementStatus.CANCELLED || agreementStatus == AgreementStatus.TENANT_SIGNED || agreementStatus == AgreementStatus.COMPLETED || agreementStatus == AgreementStatus.REJECTED));
        _;
    }

    modifier notLocked() {
        require(!locked);
        _;
    }

    modifier ownerOnly() {
        require(msg.sender == owner);
        _;
    }

    // what if the offer is in status PENDING and the tenant wants to send a new one?
    // in a case like that, find a way to handle multiple pending offers simultaneously

    function sendOffer(int amount, string memory tenantName, string memory tenantEmail) public payable
        ownerOnly()
        noActiveOffer(tenantEmail) // coz this modifier ensures that there's no active offer ..
        notLocked()
    {
        Offer memory offer = Offer({
            initialized: true,
            amount: amount,
            tenantName: tenantName,
            tenantEmail: tenantEmail,
            status: OfferStatus.PENDING
        });
        tenantOfferMap[tenantEmail] = offer;
    }

    // cancel an offer that has been submitted (and is cancellable)

    function cancelOffer(string memory tenantEmail) public payable
        ownerOnly()
        offerExists(tenantEmail)
        offerCancellable(tenantEmail)
    {
        tenantOfferMap[tenantEmail].status = OfferStatus.CANCELLED;
        if (tenantAgreementMap[tenantEmail].status != AgreementStatus.UNINITIALIZED) {
            tenantAgreementMap[tenantEmail].status = AgreementStatus.CANCELLED;
        }
        locked = false;
    }

    // get an offer that has been submitted (and is hasn't been cancelled yet)
    
    function getOffer(string memory tenantEmail) public view ownerOnly() returns (bool, int, string memory, string memory, OfferStatus) {
        Offer storage o = tenantOfferMap[tenantEmail];
        return (o.initialized, o.amount, o.tenantName, o.tenantEmail, o.status);
    }

    // review (accept / reject) an offer that has been submitted (and is pending)
    
    function reviewOffer(bool result, string memory tenantEmail) public payable
        ownerOnly()
        offerExists(tenantEmail)
        offerInStatus(OfferStatus.PENDING, tenantEmail)
    {
        tenantOfferMap[tenantEmail].status = result ? OfferStatus.ACCEPTED : OfferStatus.REJECTED;
    }

    // submit the draft of an agreement (only if: the offer still exists & has been accepted, and an agreement can be submitted)
    // a new draft agreement can submitted only if there isn't already 1 in place that has been signed, or awaiting confirmation
    
    function submitDraft(string memory tenantEmail, string memory landlordName, string memory agreementTenantName, string memory agreementTenantEmail, uint leaseStart, uint handoverDate, uint leasePeriod, string memory otherTerms, string memory hashStr) public payable
        ownerOnly()
        offerExists(tenantEmail)
        offerInStatus(OfferStatus.ACCEPTED, tenantEmail)
        agreementCanBeSubmitted(tenantEmail)
    {
        int256 amount = tenantOfferMap[tenantEmail].amount;
        tenantAgreementMap[tenantEmail] = AgreementDraft(landlordName, agreementTenantName, agreementTenantEmail, amount, leaseStart, handoverDate, leasePeriod, otherTerms, hashStr, "", "", AgreementStatus.PENDING);
    }

    // getAgreement functions:
    // can only return tuple of max 7 elements, otherwise throws "Stack too deep" 
    // solution: splitted into multiple functions - getAgreement + (Participants/Details/Hashes/Status)

    function getAgreementParticipants(string memory tenantEmail) public view ownerOnly() returns (string memory, string memory, string memory) {
        AgreementDraft storage a = tenantAgreementMap[tenantEmail];
        return (a.landlordName, a.tenantName, a.tenantEmail);
    }

    function getAgreementDetails(string memory tenantEmail) public view ownerOnly() returns (int, uint, uint, uint, string memory) {
        AgreementDraft storage a = tenantAgreementMap[tenantEmail];
        return (a.amount, a.leaseStart, a.handoverDate, a.leasePeriod, a.otherTerms);
    }

    function getAgreementHashes(string memory tenantEmail) public view ownerOnly() returns (string memory, string memory, string memory) {
        AgreementDraft storage a = tenantAgreementMap[tenantEmail];
        return (a.agreementHash, a.landlordSignedHash, a.tenantSignedHash);
    }

    function getAgreementStatus(string memory tenantEmail) public view ownerOnly() returns (AgreementStatus) {
        AgreementDraft storage a = tenantAgreementMap[tenantEmail];
        return (a.status);
    }

    // review an agreement draft (only if: the offer still exists & has been accepted, and an agreement exists & is pending)
    
    function reviewAgreement(string memory tenantEmail, bool result) public payable
        ownerOnly()
        offerExists(tenantEmail)
        offerInStatus(OfferStatus.ACCEPTED, tenantEmail)
        agreementInStatus(AgreementStatus.PENDING, tenantEmail)
    {
        tenantAgreementMap[tenantEmail].status = result ? AgreementStatus.CONFIRMED : AgreementStatus.REJECTED;
    }

    // signing of an agreement draft by the landlord (only if: the offer still exists & has been accepted, and an agreement exists & is confirmed)
    
    function landlordSignAgreement(string memory tenantEmail, string memory landlordSignedHash) public payable
        ownerOnly()
        notLocked()
        offerExists(tenantEmail)
        offerInStatus(OfferStatus.ACCEPTED, tenantEmail)
        agreementInStatus(AgreementStatus.CONFIRMED, tenantEmail)
    {
        tenantAgreementMap[tenantEmail].landlordSignedHash = landlordSignedHash;
        tenantAgreementMap[tenantEmail].status = AgreementStatus.LANDLORD_SIGNED;
        locked = true;
    }

    // signing of an agreement draft by the tenant (only if: the offer still exists & has been accepted, and an agreement exists & the landlord has signed already)

    function tenantSignAgreement(string memory tenantEmail, string memory tenantSignedHash) public payable
        ownerOnly()
        offerExists(tenantEmail)
        offerInStatus(OfferStatus.ACCEPTED, tenantEmail)
        agreementInStatus(AgreementStatus.LANDLORD_SIGNED, tenantEmail)
    {
        tenantAgreementMap[tenantEmail].tenantSignedHash = tenantSignedHash;
        tenantAgreementMap[tenantEmail].status = AgreementStatus.TENANT_SIGNED;
    }

    // cancelling of an agreement draft by the tenant (only if the agreement is cancellable ie. it exists, but the landlord hasn't already signed it)

    function cancelAgreement(string memory tenantEmail) public payable
        ownerOnly()
        agreementCancellable(tenantEmail)
    {
        tenantAgreementMap[tenantEmail].status = AgreementStatus.CANCELLED;
        locked = false;
    }

    // receiving the 1st month rent from the tenant (only if the agreement has been signed by both parties ie. the landlord and the tenant)

    function receiveFirstMonthRent(string memory tenantEmail) public payable
        ownerOnly()
        offerExists(tenantEmail)
        offerInStatus(OfferStatus.ACCEPTED, tenantEmail)
        agreementInStatus(AgreementStatus.TENANT_SIGNED, tenantEmail)
    {
        tenantAgreementMap[tenantEmail].status = AgreementStatus.COMPLETED;
        
        // EITHER TRY THIS TO INSTANTIATE THE RentToContract.sol SMART CONTRACT ..
        // rentToContractAddress = new RentToContract(tenantEmail, tenantAgreementMap[tenantEmail].tenantName, 
        // tenantAgreementMap[tenantEmail].landlordName, 100, 1000000000000); 
        // rentToContract = RentToContract(rentToContractAddress);
        // 
        // OR, JUST TRY THIS INSTEAD .. ..
        // rentToContract = new RentToContract(tenantEmail, tenantAgreementMap[tenantEmail].tenantName, 
        // tenantAgreementMap[tenantEmail].landlordName, 100, 1000000000000); 

        // EVENTUALLY, THE RENT AMOUNT & THE CONTRACT'S DURATION MUST BOTH BE MADE DYNAMIC 
    }
    
    function receiveMonthlyRent(string memory tenantEmail, uint amount) public payable
        ownerOnly()
        offerExists(tenantEmail)
        offerInStatus(OfferStatus.ACCEPTED, tenantEmail)
        agreementInStatus(AgreementStatus.COMPLETED, tenantEmail)
    {
        rentAmount = amount; // WORK WITH RENT amount
        // rentToContract.receiveMonthlyRent(tenantEmail, amount);
    }

}

