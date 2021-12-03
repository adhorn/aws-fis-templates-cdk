import * as cdk from '@aws-cdk/core';
import { Construct, Stack, StackProps } from '@aws-cdk/core';
import * as fis from '@aws-cdk/aws-fis';

// FIS Experiment Templates for EC2 control plane

export class Ec2ControlPlaneExperiments extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
        
    // Import FIS Role and Stop Condition
    const importedFISRoleArn = cdk.Fn.importValue('FISIamRoleArn');
    const importedStopConditionArn = cdk.Fn.importValue('StopConditionArn');
    
    // Targets
    const TargetIAMRole: fis.CfnExperimentTemplate.ExperimentTemplateTargetProperty = {
      resourceType: 'aws:iam:role',
      selectionMode: 'ALL',
      resourceArns: [
        `arn:aws:iam::${this.account}:role/Chaos-Ready`
      ]
    }


    // Actions
    const internalError = {
      actionId: 'aws:fis:inject-api-internal-error',
      description: 'Defining the API operations and percentage of requets to fail',
      parameters: {
        service: 'ec2',
        operations: 'DescribeInstances,DescribeVolumes',
        percentage: '100',
        duration: 'PT2M'
      },
      targets: { Roles: 'roleTargets' }
    }

    const throttleError = {
      actionId: 'aws:fis:inject-api-throttle-error',
      description: 'Defining the API operations and percentage of requets to throttle',
      parameters: {
        service: 'ec2',
        operations: 'DescribeInstances,DescribeVolumes',
        percentage: '100',
        duration: 'PT2M'
      },
      targets: { Roles: 'roleTargets' }
    }

    const unavailableError = {
      actionId: 'aws:fis:inject-api-unavailable-error',
      description: 'Defining the API operations and percentage of requets to throttle',
      parameters: {
        service: 'ec2',
        operations: 'DescribeInstances,DescribeVolumes',
        percentage: '100',
        duration: 'PT2M'
      },
      targets: { Roles: 'roleTargets' }
    }

    // Experiments
    const templateInternalError = new fis.CfnExperimentTemplate(this, 'fis-template-inject-internal-error',
      {
        description: 'Inject EC2 API Internal Error on the target IAM role (e.g.; Chaos-Ready).',
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
          'instanceActions' : internalError
        },
        targets: {
          'roleTargets': TargetIAMRole
        }
      }
    );  

    const templateUnavailableError = new fis.CfnExperimentTemplate(this, 'fis-template-inject-unavailable-error',
    {
      description: 'Inject EC2 API Internal Error on the target IAM role (e.g.; Chaos-Ready).',
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
        'instanceActions' : unavailableError
      },
      targets: {
        'roleTargets': TargetIAMRole
      }
    }
  );  

  const templateThrottleError = new fis.CfnExperimentTemplate(this, 'fis-template-inject-throttle-error',
  {
    description: 'Inject EC2 API Internal Error on the target IAM role (e.g.; Chaos-Ready).',
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
      'instanceActions' : throttleError
    },
    targets: {
      'roleTargets': TargetIAMRole
    }
  }
);  

  }
}
