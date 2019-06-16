module.exports = {
  'POST /enlistments': {
    controller: 'PropertyEnlistmentController',
    action: 'createEnlistment'
  },

  'GET /enlistments': {
    controller: 'PropertyEnlistmentController',
    action: 'findInArea'
  },

  'POST /enlistments/:id/approve': {
    controller: 'PropertyEnlistmentController',
    action: 'approveEnlistment'
  },

  'POST /enlistments/:id/reject': {
    controller: 'PropertyEnlistmentController',
    action: 'rejectEnlistment'
  },

  'POST /enlistments/:id/offers': {
    controller: 'OfferController',
    action: 'sendOffer'
  },

  'GET /enlistments/:id/offers': {
    controller: 'OfferController',
    action: 'getOffer'
  },

  'POST /enlistments/:id/offers/cancel': {
    controller: 'OfferController',
    action: 'cancelOffer'
  },

  'POST /enlistments/:id/offers/review': {
    controller: 'OfferController',
    action: 'reviewOffer'
  },

  'POST /enlistments/:id/agreements': {
    controller: 'AgreementContractController',
    action: 'submitAgreementDraft'
  },

  'GET /enlistments/:id/agreements': {
    controller: 'AgreementContractController',
    action: 'getAgreement'
  },

  'POST /enlistments/:id/agreements/review': {
    controller: 'AgreementContractController',
    action: 'reviewAgreement'
  },

  'POST /enlistments/:id/agreements/sign': {
    controller: 'AgreementContractController',
    action: 'signAgreement'
  },

  'POST /enlistments/:id/agreements/cancel': {
    controller: 'AgreementContractController',
    action: 'cancelAgreement'
  },

  'POST /enlistments/:id/payments': {
    controller: 'AgreementContractController',
    action: 'receiveFirstMonthRent'
  },
};
