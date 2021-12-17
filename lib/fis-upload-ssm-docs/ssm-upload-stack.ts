import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StackProps, Stack } from 'aws-cdk-lib';
import { aws_ssm as ssm } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';

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


    // SSMA Role for SSMA Documents fault

    const iamAccessFaultRole = this.node.tryGetContext('target_role_name');

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

    // Additional Permissions for logging
    ssmaNaclRole.addToPolicy(new iam.PolicyStatement({
      resources: [
        '*'
      ],
      actions: [
        'logs:CreateLogStream',
        'logs:CreateLogGroup',
        'logs:PutLogEvents',
        'logs:DescribeLogGroups',
        'logs:DescribeLogStreams'
      ]
    }))

    // Security Group faults 'security-groups-faults.yml'
    const ssmaSecGroupRole = new iam.Role(this, 'ssma-secgroup-role', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('iam.amazonaws.com'),
        new iam.ServicePrincipal('ssm.amazonaws.com')
      )
    });
    const ssmaSecGroupRoleAsCfn = ssmaSecGroupRole.node.defaultChild as iam.CfnRole;
    ssmaSecGroupRoleAsCfn.addOverride(
      'Properties.AssumeRolePolicyDocument.Statement.0.Principal.Service', [
      'ssm.amazonaws.com', 'iam.amazonaws.com'
    ]);

    // AllowSSMARoleNaclFaults
    ssmaSecGroupRole.addToPolicy(new iam.PolicyStatement({
      resources: ['*'],
      actions: [
        'ec2:RevokeSecurityGroupIngress',
        'ec2:AuthorizeSecurityGroupIngress',
        'ec2:DescribeSecurityGroups'
      ],
    }))

    // Additional Permissions for logging
    ssmaSecGroupRole.addToPolicy(new iam.PolicyStatement({
      resources: [
        '*'
      ],
      actions: [
        'logs:CreateLogStream',
        'logs:CreateLogGroup',
        'logs:PutLogEvents',
        'logs:DescribeLogGroups',
        'logs:DescribeLogStreams'
      ]
    }))

    // IAM role access faults 'ssma-iam-access-faults.yml'
    const ssmaIamAccessRole = new iam.Role(this, 'ssma-iam-access-role', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('iam.amazonaws.com'),
        new iam.ServicePrincipal('ssm.amazonaws.com')
      )
    });

    const ssmaIamAccessRoleAsCfn = ssmaIamAccessRole.node.defaultChild as iam.CfnRole;
    ssmaIamAccessRoleAsCfn.addOverride(
      'Properties.AssumeRolePolicyDocument.Statement.0.Principal.Service', [
      'ssm.amazonaws.com', 'iam.amazonaws.com'
    ]);

    // GetRoleandPolicyDetails
    ssmaIamAccessRole.addToPolicy(new iam.PolicyStatement({
      resources: [
        `arn:aws:iam::${this.account}:role/${iamAccessFaultRole}`,
        `arn:aws:iam::${this.account}:policy/*`
      ],
      actions: [
        'iam:GetRole',
        'iam:GetPolicy',
        'iam:ListAttachedRolePolicies',
        'iam:ListRoles'
      ],
    })
    )

    //AllowOnlyTargetResourcePolicies
    ssmaIamAccessRole.addToPolicy(new iam.PolicyStatement({
      resources: [
        '*'
      ],
      actions: [
        'iam:DetachRolePolicy',
        'iam:AttachRolePolicy'
      ],
      conditions: {
        ArnEquals:
        {
          'iam:PolicyARN': [
            `arn:aws:iam::${this.account}:policy/*`
          ]
        }
      }
    }))

    // DenyAttachDetachAllRolesExceptApplicationRole
    ssmaIamAccessRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.DENY,
      actions: [
        'iam:DetachRolePolicy',
        'iam:AttachRolePolicy'
      ],
      notResources: [
        `arn:aws:iam::${this.account}:role/${iamAccessFaultRole}`
      ]
    }))

    // Additional Permissions for logging
    ssmaIamAccessRole.addToPolicy(new iam.PolicyStatement({
      resources: [
        '*'
      ],
      actions: [
        'logs:CreateLogStream',
        'logs:CreateLogGroup',
        'logs:PutLogEvents',
        'logs:DescribeLogGroups',
        'logs:DescribeLogStreams'
      ]
    }))


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

    new cdk.CfnOutput(this, 'SSMANaclRoleArn', {
      value: ssmaNaclRole.roleArn,
      description: 'The Arn of the IAM role',
      exportName: 'SSMANaclRoleArn',
    });

    new cdk.CfnOutput(this, 'SSMASecGroupRoleArn', {
      value: ssmaSecGroupRole.roleArn,
      description: 'The Arn of the IAM role',
      exportName: 'SSMASecGroupRoleArn',
    });

    new cdk.CfnOutput(this, 'ssmaIamAccessRoleArn', {
      value: ssmaIamAccessRole.roleArn,
      description: 'The Arn of the IAM role',
      exportName: 'SSMAIamAccessRoleArn',
    });


  }
}
