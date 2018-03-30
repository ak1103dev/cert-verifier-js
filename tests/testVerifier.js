'use strict';

import 'babel-polyfill';
import { assert, expect } from 'chai';
import { Status } from '../config/default';
import { CertificateVerifier } from '../lib/index';
import { readFileAsync } from '../lib/promisifiedRequests';

describe('Certificate verifier should', async () => {
  it('verify a v1 certificate', async () => {
    var data = await readFileAsync(
      'tests/data/sample_cert-valid-1.2.0.json',
    );
    var certVerifier = new CertificateVerifier(data, (stepCode, message, status) => {
      //console.log('update status:', stepCode, message, status);
    });
    await certVerifier.verify((finalStep, message, status) => {
      assert.equal(status, Status.success);
    });
  });

  it('verify a v2 certificate', async () => {
    var data = await readFileAsync('tests/data/sample_cert-valid-2.0.json');
    var certVerifier = new CertificateVerifier(data);
    await certVerifier.verify((finalStep, message, status) => {
      assert.equal(status, Status.success);
    });
  });

  it('verify v2 alpha certificate', async () => {
    var data = await readFileAsync(
      'tests/data/sample_cert-valid-2.0-alpha.json',
    );
    var certVerifier = new CertificateVerifier(data);
    await certVerifier.verify((finalStep, message, status) => {
      assert.equal(status, Status.success);
    });  
  });

  it('ensure a tampered v2 certificate fails', async () => {
    var data = await readFileAsync(
      'tests/data/sample_cert-unmapped-2.0.json',
    );
    
    var certVerifier = new CertificateVerifier(data, (stepCode, statusMessage, status) => {
      if (stepCode === 'computingLocalHash' && status !== Status.starting) {
        assert.equal(status, Status.failure);
      }
    });
    
    await certVerifier.verify((stepCode, message, status) => {
      assert.equal(status, Status.failure);
    });
  });

  it('ensure a revoked v2 certificate fails', async () => {
    var data = await readFileAsync(
      'tests/data/sample_cert-revoked-2.0.json',
    );

    var certVerifier = new CertificateVerifier(data, (stepCode, statusMessage, status) => {
      if (stepCode === 'checkingRevokedStatus' && status !== Status.starting) {
        assert.equal(status, Status.failure);
      }
    });

    await certVerifier.verify((stepCode, message, status) => {
      assert.equal(status, Status.failure);
    });
  });

  it('ensure a v2 certificate with a revoked issuing key fails', async () => {
    // In other words, transaction happened after issuing key was revoked
    var data = await readFileAsync(
      //'tests/data/sample_cert-with-revoked-key-2.0.json',
      'tests/data/certificate-revoked.json',
    );

    var certVerifier = new CertificateVerifier(data, (stepCode, message, status) => {
      console.log(stepCode, message, status);
      if (stepCode === 'checkingAuthenticity' && status !== Status.starting) {
        assert.strictEqual(status, 'failure');
      }
    });

    await certVerifier.verify((stepCode, message, status) => {
      assert.equal(status, Status.failure);
    });
  });

  it('ensure a v2 certificate with a v1 issuer passes', async () => {
    var data = await readFileAsync(
      'tests/data/sample_cert-with_v1_issuer-2.0.json',
    );
    var certVerifier = new CertificateVerifier(data);
    await certVerifier.verify((stepCode, message, status) => {
      assert.equal(status, Status.success);
    });
  });

  it('ensure a v2 mocknet passes', async () => {
    var data = await readFileAsync('tests/data/mocknet-2.0.json');
    var certVerifier = new CertificateVerifier(data);
    await certVerifier.verify((stepCode, message, status) => {
      assert.equal(status, Status.mockSuccess);
    });
  });

  it('ensure a v2 regtest passes', async () => {
    var data = await readFileAsync('tests/data/regtest-2.0.json');
    var certVerifier = new CertificateVerifier(data);
    await certVerifier.verify((stepCode, message, status) => {
      assert.equal(status, Status.mockSuccess);
    });
  });

  it('ensure a v2 testnet passes', async () => {
    var data = await readFileAsync('tests/data/testnet-2.0.json');
    var certVerifier = new CertificateVerifier(data);
    await certVerifier.verify((stepCode, message, status) => {
      assert.equal(status, Status.success);
    });
  });
});
