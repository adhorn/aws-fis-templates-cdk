import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as FISParentStack from '../lib/parent-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new FISParentStack.FISParentStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
