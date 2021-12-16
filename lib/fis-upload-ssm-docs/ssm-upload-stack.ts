import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StackProps, Stack } from 'aws-cdk-lib';                 // core constructs
import { aws_fis as fis } from 'aws-cdk-lib';
import { aws_ssm as ssm } from 'aws-cdk-lib';
import fs = require('fs');
import path = require('path');
import yaml = require('js-yaml');

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
    });

    // Deploy the SSMA document to inject the security group faults
    let secgroup_file = path.join(
      __dirname,
      'documents/security-groups-faults.yml'
    );

    const secgroup_content = fs.readFileSync(secgroup_file).toString()

    const secgroup_cfnDocument = new ssm.CfnDocument(this, `SecGroup-SSM-Document`, {
      content: yaml.load(secgroup_content),
      documentType: 'Automation',
      documentFormat: 'YAML',
    });

    // Deploy the SSMA document to inject the Iam Access faults
    let iamaccess_file = path.join(
      __dirname,
      'documents/iam-access-faults.yml'
    );

    const iamaccess_content = fs.readFileSync(iamaccess_file).toString()

    const iamaccess_cfnDocument = new ssm.CfnDocument(this, `IamAccess-SSM-Document`, {
      content: yaml.load(iamaccess_content),
      documentType: 'Automation',
      documentFormat: 'YAML',
    });


  // Outputs


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

    new cdk.CfnOutput(this, 'IamAccessSSMADocName', {
      value: iamaccess_cfnDocument.ref!,
      description: 'The name of the SSM Doc',
      exportName: 'IamAccessSSMADocName',
    });

  }
}
