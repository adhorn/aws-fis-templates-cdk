import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { StackProps, Stack } from "aws-cdk-lib";
import { aws_iam as iam } from "aws-cdk-lib";

export class FisRole extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const importedFISS3BucketArn = cdk.Fn.importValue("fisS3BucketArn");

    // FIS Role
    const fisrole = new iam.Role(this, "fis-role", {
      assumedBy: new iam.ServicePrincipal("fis.amazonaws.com", {
        conditions: {
          StringEquals: {
            "aws:SourceAccount": this.account,
          },
          ArnLike: {
            "aws:SourceArn": `arn:aws:fis:${this.region}:${this.account}:experiment/*`,
          },
        },
      }),
    });

    // AllowFISExperimentRoleCloudWatchActions
    fisrole.addToPolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: ["cloudwatch:DescribeAlarms"],
      })
    );

    // AllowFISExperimentRoleEC2ReadOnly
    fisrole.addToPolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: ["ec2:DescribeInstances"],
      })
    );

    // AllowFISExperimentRoleEC2Actions
    fisrole.addToPolicy(
      new iam.PolicyStatement({
        resources: [`arn:aws:ec2:*:*:instance/*`],
        actions: [
          "ec2:RebootInstances",
          "ec2:StopInstances",
          "ec2:StartInstances",
          "ec2:TerminateInstances",
        ],
        conditions: {
          StringEquals: {
            "aws:ResourceTag/FIS-Ready": "true",
          },
        },
      })
    );

    // AllowFISExperimentRoleSpotInstanceActions
    fisrole.addToPolicy(
      new iam.PolicyStatement({
        resources: [`arn:aws:ec2:*:*:instance/*`],
        actions: ["ec2:SendSpotInstanceInterruptions"],
        conditions: {
          StringEquals: {
            "aws:ResourceTag/FIS-Ready": "true",
          },
        },
      })
    );

    // AllowFISExperimentRoleECSReadOnly
    fisrole.addToPolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: ["ecs:ListContainerInstances", "ecs:DescribeClusters"],
      })
    );

    // AllowFISExperimentRoleECSUpdateState
    fisrole.addToPolicy(
      new iam.PolicyStatement({
        resources: [`arn:aws:ecs:*:*:container-instance/*`],
        actions: ["ecs:UpdateContainerInstancesState"],
      })
    );

    // AllowFISExperimentRoleEKSReadOnly
    fisrole.addToPolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: ["ec2:DescribeInstances", "eks:DescribeNodegroup"],
      })
    );

    // AllowFISExperimentRoleEKSActions
    fisrole.addToPolicy(
      new iam.PolicyStatement({
        resources: [`arn:aws:ec2:*:*:instance/*`],
        actions: ["ec2:TerminateInstances"],
        conditions: {
          StringEquals: {
            "aws:ResourceTag/FIS-Ready": "true",
          },
        },
      })
    );

    // AllowFISExperimentRoleRDSReadOnly
    fisrole.addToPolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: ["rds:DescribeDBInstances", "rds:DescribeDbClusters"],
      })
    );

    // AllowFISExperimentRoleRDSReboot
    fisrole.addToPolicy(
      new iam.PolicyStatement({
        resources: [`arn:aws:rds:*:*:db:*`],
        actions: ["rds:RebootDBInstance"],
      })
    );

    // AllowFISExperimentRoleRDSFailOver
    fisrole.addToPolicy(
      new iam.PolicyStatement({
        resources: [`arn:aws:rds:*:*:cluster:*`],
        actions: ["rds:FailoverDBCluster"],
      })
    );

    //AllowFISExperimentRoleSSMReadOnly
    fisrole.addToPolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: [
          "ec2:DescribeInstances",
          "ssm:ListCommands",
          "ssm:CancelCommand",
          "ssm:PutParameter"
        ],
      })
    );

    //AllowFISExperimentRoleSSMAAction
    fisrole.addToPolicy(
      new iam.PolicyStatement({
        resources: [`*`],
        actions: ["ssm:StopAutomationExecution", "ssm:GetAutomationExecution"],
      })
    );

    //AllowFISExperimentRoleSSMAAction
    fisrole.addToPolicy(
      new iam.PolicyStatement({
        resources: [`*`],
        actions: ["ssm:StartAutomationExecution"],
      })
    );

    //AllowFISExperimentRoleSSMSendCommand
    fisrole.addToPolicy(
      new iam.PolicyStatement({
        resources: [`arn:aws:ec2:*:*:instance/*`, `arn:aws:ssm:*:*:document/*`],
        actions: ["ssm:SendCommand"],
      })
    );

    //AllowFISExperimentRoleSSMAutomationPassRole
    fisrole.addToPolicy(
      new iam.PolicyStatement({
        resources: [`arn:aws:iam::*:role/*`],
        actions: ["iam:PassRole"],
      })
    );

    //AllowFISExperimentRoleEC2ControlPlaneReadOnly
    fisrole.addToPolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: ["iam:ListRoles"],
      })
    );

    //AllowFISExperimentRoleEC2ControlPlaneActions
    fisrole.addToPolicy(
      new iam.PolicyStatement({
        resources: ["arn:aws:fis:*:*:experiment/*"],
        actions: [
          "fis:InjectApiInternalError",
          "fis:InjectApiThrottleError",
          "fis:InjectApiUnavailableError",
        ],
      })
    );

    //AllowLogsRoleAllLogdelivery
    fisrole.addToPolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: ["logs:CreateLogDelivery"],
      })
    );

    //AllowLogsRoleS3
    fisrole.addToPolicy(
      new iam.PolicyStatement({
        resources: [importedFISS3BucketArn.toString()],
        actions: ["s3:GetBucketPolicy", "s3:PutBucketPolicy"],
      })
    );

    //AllowLogsRoleCloudWatch
    fisrole.addToPolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: [
          "logs:PutResourcePolicy",
          "logs:DescribeResourcePolicies",
          "logs:DescribeLogGroups",
        ],
      })
    );

    //AllowLogsRoleKinesis
    fisrole.addToPolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: ["firehose:TagDeliveryStream", "iam:CreateServiceLinkedRole"],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, "FISIamRoleArn", {
      value: fisrole.roleArn,
      description: "The Arn of the IAM role",
      exportName: "FISIamRoleArn",
    });
  }
}
