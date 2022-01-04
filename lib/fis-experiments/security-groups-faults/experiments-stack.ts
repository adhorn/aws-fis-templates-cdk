import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { StackProps, Stack } from "aws-cdk-lib"; // core constructs
import { aws_fis as fis } from "aws-cdk-lib";

export class SecGroupExperiments extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Import FIS Role and Stop Condition
    const importedFISRoleArn = cdk.Fn.importValue("FISIamRoleArn");
    const importedSSMASecGroupRoleArn = cdk.Fn.importValue(
      "SSMASecGroupRoleArn"
    );
    const importedStopConditionArn = cdk.Fn.importValue("StopConditionArn");
    const importedSecGroupSSMADocName = cdk.Fn.importValue(
      "SecGroupSSMADocName"
    );

    const securityGroupId = this.node.tryGetContext("security_group_id");

    // Targets - empty since SSMA defines its own targets

    // Actions
    const startAutomation = {
      actionId: "aws:ssm:start-automation-execution",
      description:
        "Calling SSMA document to inject faults in a particular security group (open SSH to 0.0.0.0/0)",
      parameters: {
        documentArn: `arn:aws:ssm:${this.region}:${
          this.account
        }:document/${importedSecGroupSSMADocName.toString()}`,
        documentParameters: JSON.stringify({
          DurationMinutes: "PT1M",
          SecurityGroupId: securityGroupId.toString(),
          AutomationAssumeRole: importedSSMASecGroupRoleArn.toString(),
        }),
        maxDuration: "PT5M",
      },
    };

    // Experiments
    const templateSecGroup = new fis.CfnExperimentTemplate(
      this,
      "fis-template-inject-secgroup-fault",
      {
        description:
          "Experiment to test response to a change in security group ingress rule (open SSH to 0.0.0.0/0)",
        roleArn: importedFISRoleArn.toString(),
        stopConditions: [
          {
            source: "aws:cloudwatch:alarm",
            value: importedStopConditionArn.toString(),
          },
        ],
        tags: {
          Name: "Security Group ingress open SSH to all",
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
