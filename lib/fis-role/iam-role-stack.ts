import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StackProps, Stack } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';

export class FisRole extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const importedFISLogGroupArn = cdk.Fn.importValue('fisLogGroupArn');
        const importedFISS3BucketArn = cdk.Fn.importValue('fisS3BucketArn');

        // FIS Role
        const fisrole = new iam.Role(this, 'fis-role', {
            assumedBy: new iam.ServicePrincipal('fis.amazonaws.com'),
        });

        // AllowFISExperimentRoleCloudWatchActions
        fisrole.addToPolicy(new iam.PolicyStatement({
            resources: ['*'],
            actions: ['cloudwatch:DescribeAlarms'],
        }))

        // AllowFISExperimentRoleEC2ReadOnly
        fisrole.addToPolicy(new iam.PolicyStatement({
            resources: ['*'],
            actions: ['ec2:DescribeInstances'],
        }))

        // AllowFISExperimentRoleEC2Actions
        fisrole.addToPolicy(new iam.PolicyStatement({
            resources: [
                `arn:aws:ec2:*:*:instance/*`
            ],
            actions: [
                'ec2:RebootInstances',
                'ec2:StopInstances',
                'ec2:StartInstances',
                'ec2:TerminateInstances'
            ],
            conditions: {
                StringEquals:
                {
                    'aws:ResourceTag/FIS-Ready': 'true',
                }
            }
        }))

        // AllowFISExperimentRoleSpotInstanceActions
        fisrole.addToPolicy(new iam.PolicyStatement({
            resources: [`arn:aws:ec2:*:*:instance/*`],
            actions: [
                'ec2:SendSpotInstanceInterruptions'
            ],
            conditions: {
                StringEquals:
                {
                    'aws:ResourceTag/FIS-Ready': 'true',
                }
            }
        }))

        // AllowFISExperimentRoleECSReadOnly
        fisrole.addToPolicy(new iam.PolicyStatement({
            resources: ['*'],
            actions: [
                'ecs:ListContainerInstances',
                'ecs:DescribeClusters'
            ],
        }))

        // AllowFISExperimentRoleECSUpdateState
        fisrole.addToPolicy(new iam.PolicyStatement({
            resources: [`arn:aws:ecs:*:*:container-instance/*`],
            actions: [
                'ecs:UpdateContainerInstancesState'
            ],
        }))

        // AllowFISExperimentRoleEKSReadOnly
        fisrole.addToPolicy(new iam.PolicyStatement({
            resources: ['*'],
            actions: [
                'ec2:DescribeInstances',
                'eks:DescribeNodegroup'
            ],
        }))

        // AllowFISExperimentRoleEKSActions
        fisrole.addToPolicy(new iam.PolicyStatement({
            resources: [`arn:aws:ec2:*:*:instance/*`],
            actions: [
                'ec2:TerminateInstances'
            ],
            conditions: {
                StringEquals:
                {
                    'aws:ResourceTag/FIS-Ready': 'true',
                }
            }
        }))

        // AllowFISExperimentRoleRDSReadOnly
        fisrole.addToPolicy(new iam.PolicyStatement({
            resources: ['*'],
            actions: [
                'rds:DescribeDBInstance',
                'rds:DescribeDbClusters'
            ],
        }))

        // AllowFISExperimentRoleRDSReboot
        fisrole.addToPolicy(new iam.PolicyStatement({
            resources: [`arn:aws:rds:*:*:db:*`],
            actions: [
                'rds:RebootDBInstance'
            ],
        }))

        // AllowFISExperimentRoleRDSFailOver
        fisrole.addToPolicy(new iam.PolicyStatement({
            resources: [`arn:aws:rds:*:*:cluster:*`],
            actions: [
                'rds:FailoverDBCluster'
            ],
        }))

        //AllowFISExperimentRoleSSMReadOnly
        fisrole.addToPolicy(new iam.PolicyStatement({
            resources: ['*'],
            actions: [
                'ec2:DescribeInstances',
                'ssm:ListCommands',
                'ssm:CancelCommand'
            ],
        }))

        //AllowFISExperimentRoleSSMAAction
        fisrole.addToPolicy(new iam.PolicyStatement({
            resources: [
                `*`
            ],
            actions: [
                'ssm:StartAutomationExecution',
                'ssm:StopAutomationExecution',
                'ssm:GetAutomationExecution'
            ],
        }))

        //AllowFISExperimentRoleSSMSendCommand
        fisrole.addToPolicy(new iam.PolicyStatement({
            resources: [
                `arn:aws:ec2:*:*:instance/*`,
                `arn:aws:ssm:*:*:document/*`
            ],
            actions: [
                'ssm:SendCommand'
            ],
        }))

        //AllowFISExperimentRoleSSMAutomationPassRole
        fisrole.addToPolicy(new iam.PolicyStatement({
            resources: [
                `arn:aws:iam::*:role/*`
            ],
            actions: [
                'iam:PassRole'
            ],
        }))

        //AllowFISExperimentRoleEC2ControlPlaneReadOnly
        fisrole.addToPolicy(new iam.PolicyStatement({
            resources: [
                '*'
            ],
            actions: [
                'iam:ListRoles'
            ],
        }))

        //AllowFISExperimentRoleEC2ControlPlaneActions
        fisrole.addToPolicy(new iam.PolicyStatement({
            resources: [
                'arn:aws:fis:*:*:experiment/*'
            ],
            actions: [
                'fis:InjectApiInternalError',
                'fis:InjectApiThrottleError',
                'fis:InjectApiUnavailableError'
            ],
        }))

        //AllowLogsRoleAllLogdelivery
        fisrole.addToPolicy(new iam.PolicyStatement({
            resources: [
                '*'
            ],
            actions: [
                "logs:CreateLogDelivery"
            ]
        }))

        //AllowLogsRoleS3
        fisrole.addToPolicy(new iam.PolicyStatement({
            resources: [
                importedFISS3BucketArn.toString()
            ],
            actions: [
                's3:GetBucketPolicy',
                's3:PutBucketPolicy'
            ]
        }))

        //AllowLogsRoleCloudWatch
        fisrole.addToPolicy(new iam.PolicyStatement({
            resources: [
                '*'
            ],
            actions: [
                "logs:PutResourcePolicy",
                "logs:DescribeResourcePolicies",
                "logs:DescribeLogGroups",
            ]
        }))

        //AllowLogsRoleKinesis
        fisrole.addToPolicy(new iam.PolicyStatement({
            resources: [
                '*'
            ],
            actions: [
                "firehose:TagDeliveryStream",
                "iam:CreateServiceLinkedRole"
            ]
        }))

        // SSMA Role for SSMA Documents fault
        // NACL faults 'ssma-nacl-faults.yml'
        const ssmaNaclRole = new iam.Role(this, 'ssma-nacl-role', {
            assumedBy: new iam.CompositePrincipal(
                new iam.ServicePrincipal('iam.amazonaws.com'),
                new iam.ServicePrincipal('ssm.amazonaws.com')
            )
        });

        const ssmaroleAsCfn = ssmaNaclRole.node.defaultChild as iam.CfnRole;
        ssmaroleAsCfn.addOverride(
            'Properties.AssumeRolePolicyDocument.Statement.0.Principal.Service', [
            'ssm.amazonaws.com', 'iam.amazonaws.com'
        ]);

        // AllowSSMARoleNaclFaults
        ssmaNaclRole.addToPolicy(new iam.PolicyStatement({
            resources: ['*'],
            actions: [
                'ec2:DescribeInstances',
                'ec2:CreateNetworkAcl',
                'ec2:CreateTags',
                'ec2:CreateNetworkAclEntry',
                'ec2:DescribeSubnets',
                'ec2:DescribeNetworkAcls',
                'ec2:ReplaceNetworkAclAssociation',
                'ec2:DeleteNetworkAcl'
            ],
        })
        )

        //AllowSSMAListRoles
        ssmaNaclRole.addToPolicy(new iam.PolicyStatement({
            resources: [
                '*'
            ],
            actions: [
                'iam:ListRoles'
            ],
        }))

        // SSMA Role for SSMA Documents fault
        // ASG faults 'ssma-asg-faults.yml'
        const ssmaAsgRole = new iam.Role(this, 'ssma-asg-role', {
            assumedBy: new iam.CompositePrincipal(
                new iam.ServicePrincipal('iam.amazonaws.com'),
                new iam.ServicePrincipal('ssm.amazonaws.com')
            )
        });
        const ssmaAsgRoleAsCfn = ssmaAsgRole.node.defaultChild as iam.CfnRole;
        ssmaAsgRoleAsCfn.addOverride(
            'Properties.AssumeRolePolicyDocument.Statement.0.Principal.Service', [
            'ssm.amazonaws.com', 'iam.amazonaws.com'
        ]);

        // AllowSSMARoleNaclFaults
        ssmaAsgRole.addToPolicy(new iam.PolicyStatement({
            resources: ['*'],
            actions: [
                'ec2:DescribeInstances',
                'ec2:DescribeInstanceStatus',
                'autoscaling:DescribeAutoScalingGroups'
            ],
        }))

        ssmaAsgRole.addToPolicy(new iam.PolicyStatement({
            resources: [
                'arn:aws:ec2:*:*:instance/*'
            ],
            actions: [
                'ec2:TerminateInstances',
            ],
            conditions: {
                StringEquals:
                {
                    'aws:ResourceTag/FIS-Ready': 'true',
                }
            }
        }))

        // Outputs
        new cdk.CfnOutput(this, 'FISIamRoleArn', {
            value: fisrole.roleArn,
            description: 'The Arn of the IAM role',
            exportName: 'FISIamRoleArn',
        });

        new cdk.CfnOutput(this, 'SSMANaclRoleArn', {
            value: ssmaNaclRole.roleArn,
            description: 'The Arn of the IAM role',
            exportName: 'SSMANaclRoleArn',
        });

        new cdk.CfnOutput(this, 'SSMAAsgRoleArn', {
            value: ssmaAsgRole.roleArn,
            description: 'The Arn of the IAM role',
            exportName: 'SSMAAsgRoleArn',
        });
    }
}