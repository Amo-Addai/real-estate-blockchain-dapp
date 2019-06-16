const web3utils = require('web3-utils');

// helper assert fn to avoid BigNumber declarations in tests which involve data structures returned by Solidity. move to separate file
const structEqual = (structArr1, structArr2) => {
    if (structArr1.length !== structArr2.length) {
        assert.fail(structArr1.length, structArr2.length, 'struct size mismatch');
    }
    structArr1.forEach((prop, idx) => {
        assert.equal(toNumber(prop), toNumber(structArr2[idx]));
    });
};

const bigNumberEqual = (nr1, nr2) => {
    assert.equal(toNumber(nr1), toNumber(nr2));
};

async function expectThrowMessage(promise, msg) {
    try {
        await promise;
    } catch (error) {
        const hasRevert = error.message.search(msg) >= 0;
        assert(hasRevert,
            'Expected error message: "' + msg + '". Instead, got: instead, got: "' + error.message + '"'
        );
        return;
    }
    assert.fail('Expected throw not received');
}

const toNumber = (nr) => {
    return (web3utils.isBigNumber(nr) ? nr.toNumber() : nr);
};

module.exports = {
    structEqual,
    bigNumberEqual,
    expectThrowMessage
};
