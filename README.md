# @test-ui/mocha

[![Build Status](https://travis-ci.org/mike-north/test-ui-mocha.svg?branch=master)](https://travis-ci.org/mike-north/test-ui-mocha)
[![Version](https://img.shields.io/npm/v/@test-ui/mocha.svg)](https://www.npmjs.com/package/@test-ui/mocha)

[Test-UI](https://github.com/mike-north/test-ui-core) support for Mocha. 

## Setup

```sh
npm install @test-ui/mocha
```

## Use

### Client-Side
```ts
import { IFrameConnectionClient } from '@test-ui/core';
import { MochaTestClient } from '@test-ui/mocha';

// Set the client up
const client = new MochaTestClient({
  // Make sure to disable the client when it running in a test environment
  enabled: config.environment === 'development',
  connection: new IFrameConnectionClient({
    baseUrl: '/tests',
    frame: myIframe // a HTMLIFrameElement
  })
});

// Run some tests
client.runModules({ name: /purple/ });
```

### Server-Side
```ts
import { IFrameConnectionServer } from '@test-ui/core';
import { MochaTestServer } from '@test-ui/mocha';
import mocha from 'mocha';

// Set the server up
let srv = new MochaTestServer(mocha, {
  connection: new IFrameConnectionServer()
});

// Start it
srv.start();
```

## Legal
(c) 2018 LinkedIn