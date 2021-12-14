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
    let nacl_file = path.join(
      __dirname,
      'documents/ssma-nacl-faults.yml'
    );

    const nacl_content = fs.readFileSync(nacl_file).toString()

    const nacl_cfnDocument = new ssm.CfnDocument(this, `Nacl-SSM-Document`, {
      content: yaml.load(nacl_content),
      documentType: 'Automation',
      documentFormat: 'YAML',
      // name: 'NACL-FIS-Automation',
    });

    // Deploy the SSMA document to inject the security group faults
    let secgroup_file = path.join(
      __dirname,
      'documents/security-groups-faults.yml'
    );

    const content = fs.readFileSync(secgroup_file).toString()

    const secgroup_cfnDocument = new ssm.CfnDocument(this, `SecGroup-SSM-Document`, {
      content: yaml.load(content),
      documentType: 'Automation',
      documentFormat: 'YAML',
      // name: 'SecurityGroup-FIS-Automation',
    });

    new cdk.CfnOutput(this, 'NaclSSMADocName', {
      value: nacl_cfnDocument.ref!,
      description: 'The name of the SSM Doc',
      exportName: 'NaclSSMADocName',
    });

    new cdk.CfnOutput(this, 'SecGroupSSMADocName', {
      value: secgroup_cfnDocument.ref!,
      description: 'The name of the SSM Doc',
      exportName: 'SecGroupSSMADocName',
    });

  }
}
