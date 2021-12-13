import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StackProps, Stack } from 'aws-cdk-lib';                 // core constructs
import { aws_fis as fis } from 'aws-cdk-lib';
import { aws_ssm as ssm } from 'aws-cdk-lib';
import fs = require('fs');
import path = require('path');
import yaml = require('js-yaml');
import { CfnDocument } from 'aws-cdk-lib/aws-ssm';

export class FisSsmDocs extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Deploy the SSMA document to inject the Nacl faults
    let file = path.join(
      __dirname,
      'documents/ssma-nacl-faults.yml'
    );

    const content = fs.readFileSync(file).toString()

    const cfnDocument = new ssm.CfnDocument(this, `SSM-Document-Automation`, {
      content: yaml.load(content),
      documentType: 'Automation',
      documentFormat: 'YAML',
      name: 'NACL-FIS-Automation',
    });

    new cdk.CfnOutput(this, 'NaclSSMADocName', {
      value: cfnDocument.name!,
      description: 'The Arn of the SSM Doc',
      exportName: 'NaclSSMADocName',
    });

  }
}
