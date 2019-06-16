pragma solidity >=0.4.21 <0.6.0;

contract EnlistmentToContract {

    address owner;
    string landlord;
    bool public locked = false;
    Enlistment enlistment;
    mapping(string => Offer) tenantOfferMap;
    mapping(string => AgreementDraft) tenantAgreementMap;

    constructor(string memory landlordEmail, string memory streetName, int floorNr, int apartmentNr, int houseNr, int postalCode) public
    {
        enlistment = Enlistment(streetName, floorNr, apartmentNr, houseNr, postalCode);
        landlord = landlordEmail;
        owner = msg.sender;
    }

    function getOwner() public view ownerOnly() returns (address) {
        return owner;
    }

    function getLandlord() public view ownerOnly() returns (string memory) {
        return landlord;
    }

    function getEnlistment() public view ownerOnly() returns (string memory, int, int, int, int) {
        return (enlistment.streetName, enlistment.floorNr, enlistment.apartmentNr, enlistment.houseNr, enlistment.postalCode);
    }

    enum OfferStatus {
        PENDING,
        REJECTED,
        CANCELLED,
        ACCEPTED
    }

    enum AgreementStatus {
        UNINITIALIZED, // internal
        PENDING,
        REJECTED,
        CONFIRMED,
        CANCELLED,
        LANDLORD_SIGNED,
        TENANT_SIGNED,
        COMPLETED
    }

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
        string hash;
        string landlordSignedHash;
        string tenantSignedHash;
        AgreementStatus status;
    }

    modifier noActiveOffer(string memory tenantEmail) {
        require(tenantOfferMap[tenantEmail].initialized == false || tenantOfferMap[tenantEmail].status == OfferStatus.REJECTED || tenantOfferMap[tenantEmail].status == OfferStatus.CANCELLED);
        _;
    }

    modifier offerExists(string memory tenantEmail) {
        require(tenantOfferMap[tenantEmail].initialized == true);
        _;
    }

    modifier offerInStatus(OfferStatus status, string memory tenantEmail) {
        require(tenantOfferMap[tenantEmail].status == status);
        _;
    }

    modifier offerCancellable(string memory tenantEmail) {
        OfferStatus offerStatus = tenantOfferMap[tenantEmail].status;
        require(offerStatus == OfferStatus.PENDING || offerStatus == OfferStatus.ACCEPTED);
        AgreementStatus agreementStatus = tenantAgreementMap[tenantEmail].status;
        require(!(agreementStatus == AgreementStatus.CANCELLED || agreementStatus == AgreementStatus.TENANT_SIGNED || agreementStatus == AgreementStatus.COMPLETED));
        _;
    }

    modifier agreementCanBeSubmitted(string memory tenantEmail) {
        require(tenantAgreementMap[tenantEmail].status == AgreementStatus.UNINITIALIZED ||
        tenantAgreementMap[tenantEmail].status == AgreementStatus.REJECTED || tenantAgreementMap[tenantEmail].status == AgreementStatus.CANCELLED);
        _;
    }

    modifier agreementInStatus(AgreementStatus status, string memory tenantEmail) {
        require(tenantAgreementMap[tenantEmail].status == status);
        _;
    }

    modifier agreementCancellable(string memory tenantEmail) {
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
    function sendOffer(int amount, string memory tenantName, string memory tenantEmail) public payable
        ownerOnly()
        noActiveOffer(tenantEmail)
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

    function getOffer(string memory tenantEmail) public view ownerOnly() returns (bool, int, string memory, string memory, OfferStatus) {
        Offer storage o = tenantOfferMap[tenantEmail];
        return (o.initialized, o.amount, o.tenantName, o.tenantEmail, o.status);
    }

    function reviewOffer(bool result, string memory tenantEmail) public payable
        ownerOnly()
        offerExists(tenantEmail)
        offerInStatus(OfferStatus.PENDING, tenantEmail)
    {
        tenantOfferMap[tenantEmail].status = result ? OfferStatus.ACCEPTED : OfferStatus.REJECTED;
    }

    function submitDraft(string memory tenantEmail, string memory landlordName, 
    string memory agreementTenantName, string memory agreementTenantEmail, uint leaseStart, uint handoverDate, 
    uint leasePeriod, string memory otherTerms, string memory hash) public payable
        ownerOnly()
        offerExists(tenantEmail)
        offerInStatus(OfferStatus.ACCEPTED, tenantEmail)
        agreementCanBeSubmitted(tenantEmail)
    {
        int256 amount = tenantOfferMap[tenantEmail].amount;
        tenantAgreementMap[tenantEmail] = AgreementDraft(landlordName,
            agreementTenantName, agreementTenantEmail,
            amount, leaseStart,
            handoverDate, leasePeriod,
            otherTerms, hash, "", "", AgreementStatus.PENDING);
    }

    // getAgreement functions:
    // can only return tuple of max 7 elements, otherwise throws "Stack too geep"
    // solution: splitted into multiple functions

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
        return (a.hash, a.landlordSignedHash, a.tenantSignedHash);
    }

    function getAgreementStatus(string memory tenantEmail) public view ownerOnly() returns (AgreementStatus) {
        AgreementDraft storage a = tenantAgreementMap[tenantEmail];
        return (a.status);
    }

    function reviewAgreement(string memory tenantEmail, bool result) public payable
        ownerOnly()
        offerExists(tenantEmail)
        offerInStatus(OfferStatus.ACCEPTED, tenantEmail)
        agreementInStatus(AgreementStatus.PENDING, tenantEmail)
    {
        tenantAgreementMap[tenantEmail].status = result ? AgreementStatus.CONFIRMED : AgreementStatus.REJECTED;
    }

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

    function tenantSignAgreement(string memory tenantEmail, string memory tenantSignedHash) public payable
        ownerOnly()
        offerExists(tenantEmail)
        offerInStatus(OfferStatus.ACCEPTED, tenantEmail)
        agreementInStatus(AgreementStatus.LANDLORD_SIGNED, tenantEmail)
    {
        tenantAgreementMap[tenantEmail].tenantSignedHash = tenantSignedHash;
        tenantAgreementMap[tenantEmail].status = AgreementStatus.TENANT_SIGNED;
    }

    function cancelAgreement(string memory tenantEmail) public payable
        ownerOnly()
        agreementCancellable(tenantEmail)
    {
        tenantAgreementMap[tenantEmail].status = AgreementStatus.CANCELLED;
        locked = false;
    }

    function receiveFirstMonthRent(string memory tenantEmail) public payable
        ownerOnly()
        offerExists(tenantEmail)
        offerInStatus(OfferStatus.ACCEPTED, tenantEmail)
        agreementInStatus(AgreementStatus.TENANT_SIGNED, tenantEmail)
    {
        tenantAgreementMap[tenantEmail].status = AgreementStatus.COMPLETED;
    }
}
