import * as cdk from '@aws-cdk/core';
import { Construct, Stack, StackProps } from '@aws-cdk/core';
import * as fis from '@aws-cdk/aws-fis';
import fs = require('fs');
import path = require('path');

import { Document } from 'cdk-ssm-document';

export class NaclExperiments extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Deploy the SSMA document to inject the Nacl faults
    let file = path.join(
      __dirname,
      '../../../documents/ssma-nacl-faults.yml'
    );
    const doc = new Document(this, `SSM-Document-Automation`, {
      documentType: 'Automation',
      name: 'NACL-FIS-Automation',
      content: fs.readFileSync(file).toString(),
    });

    // Import FIS Role and Stop Condition
    const importedFISRoleArn = cdk.Fn.importValue('FISIamRoleArn');
    const importedSSMANaclRoleArn = cdk.Fn.importValue('SSMANaclRoleArn');
    const importedStopConditionArn = cdk.Fn.importValue('StopConditionArn');

    // Variables you may want to change based on your environment
    const vpcId = new cdk.CfnParameter(this, 'vpcId', {
      type: 'String',
      description: 'The vpcId in which to inject fault',
      default: 'vpc-01316e63b948d889d',
    });


    // if vpcID parameter is in cdk.json us the below
    // const vpcId = this.node.tryGetContext('vpc_id');
    console.log('vpcId: ', vpcId.valueAsString);
    
    const availabilityZones = Stack.of(this).availabilityZones;

    console.log('availability zones: ', Stack.of(this).availabilityZones);

    const randomAvailabilityZone = availabilityZones[Math.floor(Math.random() * availabilityZones.length)];
    console.log('random availability zone: ', randomAvailabilityZone);
    // const randomAvailabilityZone = 'us-east-1a'

    // Targets - empty since SSMA defines its own targets

    // Actions
    const startAutomation = {
      actionId: 'aws:ssm:start-automation-execution',
      description: 'Calling SSMA document to inject faults in the NACLS of a particular AZ.',
      parameters: {
        documentArn: `arn:aws:ssm:${this.region}:${this.account}:document/NACL-FIS-Automation`,
        documentParameters: JSON.stringify(
          { 
            Region: this.region,
            AvailabilityZone: randomAvailabilityZone.toString(),
            VPCId: vpcId.valueAsString,
            Duration: 'PT1M',
            AutomationAssumeRole: importedSSMANaclRoleArn.toString()
          } 
        ),
        maxDuration: 'PT2M'
      }
    }

    // Experiments
    const templateNacl = new fis.CfnExperimentTemplate(this, 'fis-template-inject-nacl-fault',
      {
        description: 'Modify Subnets to deny traffic in a particular AZ. Rollback on Cancel or Failure. Uses SSMA inline',
        roleArn: importedFISRoleArn.toString(),
        stopConditions: [{
          source: 'aws:cloudwatch:alarm',
          value: importedStopConditionArn.toString()
        }],
        tags: { 
          Name: 'FIS Experiment',
          Stackname: this.stackName
        },
        actions: {
          'ssmaAction' : startAutomation
        },
        targets: {
        }
      }
    );  



  }
}
