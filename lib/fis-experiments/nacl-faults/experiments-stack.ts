import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { StackProps, Stack } from "aws-cdk-lib";
import { aws_fis as fis } from "aws-cdk-lib";

export class NaclExperiments extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Import FIS Role and Stop Condition
    const importedFISRoleArn = cdk.Fn.importValue("FISIamRoleArn");
    const importedStopConditionArn = cdk.Fn.importValue("StopConditionArn");
    const importedSSMANaclRoleArn = cdk.Fn.importValue("SSMANaclRoleArn");

    const importedNaclSSMADocName = cdk.Fn.importValue("NaclSSMADocName");

    // Variables you may want to change based on your environment
    // const vpcId = new cdk.CfnParameter(this, 'vpcId', {
    //   type: 'String',
    //   description: 'The vpcId in which to inject fault',
    //   default: 'vpc-01316e63b948d889d',
    // });

    // if vpcID parameter is in cdk.json us the below
    const vpcId = this.node.tryGetContext("vpc_id");
    const availabilityZones = Stack.of(this).availabilityZones;
    const randomAvailabilityZone =
      availabilityZones[Math.floor(Math.random() * availabilityZones.length)];
    // const randomAvailabilityZone = 'us-east-1a'

    // Targets - empty since SSMA defines its own targets

    // Actions
    const startAutomation = {
      actionId: "aws:ssm:start-automation-execution",
      description:
        "Calling SSMA document to inject faults in the NACLS of a particular AZ.",
      parameters: {
        documentArn: `arn:aws:ssm:${this.region}:${
          this.account
        }:document/${importedNaclSSMADocName.toString()}`,
        documentParameters: JSON.stringify({
          AvailabilityZone: randomAvailabilityZone.toString(),
          VPCId: vpcId.toString(),
          DurationMinutes: "PT1M",
          AutomationAssumeRole: importedSSMANaclRoleArn.toString(),
        }),
        maxDuration: "PT2M",
      },
    };

    // Experiments
    const templateNacl = new fis.CfnExperimentTemplate(
      this,
      "fis-template-inject-nacl-fault",
      {
        description:
          "Deny network traffic in subnets of a particular AZ. Rollback on Cancel or Failure.",
        roleArn: importedFISRoleArn.toString(),
        stopConditions: [
          {
            source: "aws:cloudwatch:alarm",
            value: importedStopConditionArn.toString(),
          },
        ],
        tags: {
          Name: "Deny network traffic in subnets of a particular AZ",
          Stackname: this.stackName,
        },
        actions: {
          ssmaAction: startAutomation,
        },
        targets: {},
      }
    );
  }
}
