import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { StackProps, Stack } from "aws-cdk-lib";
import { aws_fis as fis } from "aws-cdk-lib";
import { aws_iam as iam } from "aws-cdk-lib";

export class IamAccessExperiments extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Import FIS Role, Stop Condition, and other required parameters
    const importedFISRoleArn = cdk.Fn.importValue("FISIamRoleArn");
    const importedStopConditionArn = cdk.Fn.importValue("StopConditionArn");
    const importedSSMAIamAccessRoleArn = cdk.Fn.importValue(
      "SSMAIamAccessRoleArn"
    );
    const importedIamAccessSSMADocName = cdk.Fn.importValue(
      "IamAccessSSMADocName"
    );
    const importedTargetRoleName = this.node.tryGetContext("target_role_name");
    const importedS3BucketToDeny = this.node.tryGetContext("s3-bucket-to-deny");

    const s3FaultPolicy = new iam.ManagedPolicy(this, "s3-deny", {
      statements: [
        new iam.PolicyStatement({
          sid: "DenyAccessToS3Resources",
          resources: [`arn:aws:s3:::${importedS3BucketToDeny.toString()}`],
          actions: ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
          effect: iam.Effect.DENY,
        }),
      ],
    });

    // Targets - empty since SSMA defines its own targets

    // Actions
    const startAutomation = {
      actionId: "aws:ssm:start-automation-execution",
      description: "Deny Access to a S3 Resoure Type for a Role.",
      parameters: {
        documentArn: `arn:aws:ssm:${this.region}:${
          this.account
        }:document/${importedIamAccessSSMADocName.toString()}`,
        documentParameters: JSON.stringify({
          DurationMinutes: "PT1M",
          AutomationAssumeRole: importedSSMAIamAccessRoleArn.toString(),
          AccessDenyPolicyArn: `arn:aws:iam::${this.account}:policy/${s3FaultPolicy.managedPolicyName}`,
          TargetRoleName: importedTargetRoleName.toString(),
        }),
        maxDuration: "PT5M",
      },
    };

    // Experiments
    const templateInjectS3AccessDenied = new fis.CfnExperimentTemplate(
      this,
      "fis-template-inject-s3-access-denied",
      {
        description: "Deny Access to an S3 bucket via an IAM role",
        roleArn: importedFISRoleArn.toString(),
        stopConditions: [
          {
            source: "aws:cloudwatch:alarm",
            value: importedStopConditionArn.toString(),
          },
        ],
        tags: {
          Name: "Deny Access to an S3 bucket",
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
