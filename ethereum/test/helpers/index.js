const web3utils = require('web3-utils');

//  HELPER FUNCTIONS TO HELP ALL THE TESTING FUNCTIONS ..

const structToArray = (structArr) => {
    return new Promise ((resolve, reject) => {
        var arr = [], k = null;
        structArr = JSON.parse(JSON.stringify(structArr));
        for(k in structArr) arr.push(structArr[k]);
        // console.log(JSON.stringify(arr));
        resolve(JSON.parse(JSON.stringify(arr)));
    });
};

const structEqual = (structArr1, structArr2) => {
    if (structArr1.length != structArr2.length) {
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
    return (web3utils.isBN(nr) /* DEPRECATED -> isBigNumber(nr)*/ ? nr.toNumber() : nr);
};

module.exports = {
    structToArray,
    structEqual,
    bigNumberEqual,
    expectThrowMessage
};
