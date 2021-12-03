import * as cdk from '@aws-cdk/core';
import { Construct, Stack, StackProps } from '@aws-cdk/core';
import * as fis from '@aws-cdk/aws-fis';

// FIS Experiment Templates for EC2 instances

export class Ec2InstancesExperiments extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
        
    // Import FIS Role and Stop Condition
    const importedFISRoleArn = cdk.Fn.importValue('FISIamRoleArn');
    const importedStopConditionArn = cdk.Fn.importValue('StopConditionArn');

    // Variables you may want to change based on your environment
    // const vpcId = new cdk.CfnParameter(this, 'vpcId', {
    //   type: 'String',
    //   description: 'The vpcId in which to inject fault',
    //   default: 'vpc-01316e63b948d889d',
    // });

    // if vpc_id parameter is in cdk.json us the below
    const vpcId = this.node.tryGetContext('vpc_id');
    console.log('vpcId: ', vpcId.toString());
    
    const availabilityZones = Stack.of(this).availabilityZones;
    console.log('availability zones: ', Stack.of(this).availabilityZones);

    const randomAvailabilityZone = availabilityZones[Math.floor(Math.random() * availabilityZones.length)];
    console.log('random availability zone: ', randomAvailabilityZone);
    // const randomAvailabilityZone = 'us-east-1a'

    // Targets
    const TargetAllInstances: fis.CfnExperimentTemplate.ExperimentTemplateTargetProperty = {
      resourceType: 'aws:ec2:instance',
      selectionMode: 'ALL',
      resourceTags: {
        'FIS-Ready': 'true'
      },
      filters:  [
          {
            path:'Placement.AvailabilityZone',
            values: [ randomAvailabilityZone ]
          },
          {
            path:'State.Name',
            values: [ 'running' ]
          },
          {
            path: "VpcId",
            "values": [ vpcId.toString() ]
          }
        ]
    }

    const TargetRandomInstance: fis.CfnExperimentTemplate.ExperimentTemplateTargetProperty = {
      resourceType: 'aws:ec2:instance',
      selectionMode: 'COUNT(1)',
      resourceTags: {
        'FIS-Ready': 'true'
      },
      filters:  [
          {
            path:'State.Name',
            values: [ 'running' ]
          },
          {
            path: "VpcId",
            "values": [ vpcId.toString() ]
          }
        ]
    }

    // Actions
    const cpuStressAction = {
      actionId: 'aws:ssm:send-command',
      description: 'CPU stress via SSM',
      parameters: {
        documentArn: `arn:aws:ssm:${this.region}::document/AWSFIS-Run-CPU-Stress`,
        documentParameters: JSON.stringify(
          { 
            DurationSeconds: '120',
            InstallDependencies: 'True',
            CPU: '0'
          } 
        ),
        duration: 'PT2M'
      },
      targets: { Instances: 'instanceTargets' }
    }

    const stopInstanceAction: fis.CfnExperimentTemplate.ExperimentTemplateActionProperty = {
      actionId: 'aws:ec2:stop-instances',
      parameters: { 
        startInstancesAfterDuration: 'PT5M' 
      },
      targets: { 
        Instances: 'instanceTargets'
      }
    }

    const latencySourceAction = {
      actionId: 'aws:ssm:send-command',
      description: 'Latency injection via SSM',
      parameters: {
        documentArn: `arn:aws:ssm:${this.region}::document/AWSFIS-Run-Network-Latency-Sources`,
        documentParameters: JSON.stringify(
          { 
            DurationSeconds: '120',
            Interface: 'eth0',
            DelayMilliseconds: '200',
            JitterMilliseconds: '10',
            Sources: 'www.amazon.com',
            InstallDependencies: 'True'
          } 
        ),
        duration: 'PT3M'
      },
      targets: { Instances: 'instanceTargets' }
    }



    // Experiments
    const templateStopStartInstance = new fis.CfnExperimentTemplate(this, 'fis-template-stop-instances-in-vpc-az',
      {
        description: 'Stop and restart all tagged instances',
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
          'instanceActions' : stopInstanceAction
        },
        targets: {
          'instanceTargets': TargetAllInstances
        }
      }
    );  

    const templateCPUStress = new fis.CfnExperimentTemplate(this, 'fis-template-CPU-stress-random-instances-in-vpc',
      {
        description: 'Runs CPU stress on random instances using the stress-ng tool. Uses the AWS FIS provided document - AWSFIS-Run-CPU-Stress',
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
          'instanceActions' : cpuStressAction
        },
        targets: {
          'instanceTargets': TargetRandomInstance
        }
      }
    );

    const templateLatencyInjection = new fis.CfnExperimentTemplate(this, 'fis-template-latency-injection-all-instances',
      {
        description: 'Runs Latency injection on all instances of a particular AZ using the stress-ng tool. Uses the AWS FIS provided document - AWSFIS-Run-CPU-Stress',
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
          'instanceActions' : latencySourceAction
        },
        targets: {
          'instanceTargets': TargetAllInstances
        }
      }
    );


  }
}
