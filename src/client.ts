import { Client, SuitePredicate } from '@test-ui/core';

// tslint:disable-next-line:no-namespace
namespace MochaTestClient {
  export interface Options extends Client.Options { }
}

class MochaTestClient extends Client {
  constructor(opts: MochaTestClient.Options) {
    super(opts);
    this.log.pushPrefix('☕️');
  }
  // tslint:disable-next-line:no-empty
  protected async prepareServerFrame(_moduleFilter?: SuitePredicate): Promise<any> {}
}
export default MochaTestClient;
