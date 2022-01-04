import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { StackProps, Stack } from "aws-cdk-lib";
import { aws_fis as fis } from "aws-cdk-lib";

// FIS Experiment Templates for EC2 instances

export class Ec2InstancesExperiments extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Import FIS Role and Stop Condition
    const importedFISRoleArn = cdk.Fn.importValue("FISIamRoleArn");
    const importedStopConditionArn = cdk.Fn.importValue("StopConditionArn");

    // Variables you may want to change based on your environment
    // const vpcId = new cdk.CfnParameter(this, 'vpcId', {
    //   type: 'String',
    //   description: 'The vpcId in which to inject fault',
    //   default: 'vpc-01316e63b948d889d',
    // });

    // if vpc_id parameter is in cdk.json us the below
    const vpcId = this.node.tryGetContext("vpc_id");
    const availabilityZones = Stack.of(this).availabilityZones;
    const randomAvailabilityZone =
      availabilityZones[Math.floor(Math.random() * availabilityZones.length)];
    // const randomAvailabilityZone = 'us-east-1a'

    // Targets
    const TargetAllInstances: fis.CfnExperimentTemplate.ExperimentTemplateTargetProperty =
      {
        resourceType: "aws:ec2:instance",
        selectionMode: "ALL",
        resourceTags: {
          "FIS-Ready": "true",
        },
        filters: [
          {
            path: "Placement.AvailabilityZone",
            values: [randomAvailabilityZone],
          },
          {
            path: "State.Name",
            values: ["running"],
          },
          {
            path: "VpcId",
            values: [vpcId.toString()],
          },
        ],
      };

    const TargetRandomInstance: fis.CfnExperimentTemplate.ExperimentTemplateTargetProperty =
      {
        resourceType: "aws:ec2:instance",
        selectionMode: "COUNT(1)",
        resourceTags: {
          "FIS-Ready": "true",
        },
        filters: [
          {
            path: "State.Name",
            values: ["running"],
          },
          {
            path: "VpcId",
            values: [vpcId.toString()],
          },
        ],
      };

    // Actions
    const cpuStressAction = {
      actionId: "aws:ssm:send-command",
      description: "CPU stress via SSM",
      parameters: {
        documentArn: `arn:aws:ssm:${this.region}::document/AWSFIS-Run-CPU-Stress`,
        documentParameters: JSON.stringify({
          DurationSeconds: "120",
          InstallDependencies: "True",
          CPU: "0",
        }),
        duration: "PT2M",
      },
      targets: { Instances: "instanceTargets" },
    };

    const stopInstanceAction: fis.CfnExperimentTemplate.ExperimentTemplateActionProperty =
      {
        actionId: "aws:ec2:stop-instances",
        parameters: {
          startInstancesAfterDuration: "PT5M",
        },
        targets: {
          Instances: "instanceTargets",
        },
      };

    const latencySourceAction = {
      actionId: "aws:ssm:send-command",
      description: "Latency injection via SSM",
      parameters: {
        documentArn: `arn:aws:ssm:${this.region}::document/AWSFIS-Run-Network-Latency-Sources`,
        documentParameters: JSON.stringify({
          DurationSeconds: "120",
          Interface: "eth0",
          DelayMilliseconds: "200",
          JitterMilliseconds: "10",
          Sources: "www.amazon.com",
          InstallDependencies: "True",
        }),
        duration: "PT3M",
      },
      targets: { Instances: "instanceTargets" },
    };

    // Experiments
    const templateStopStartInstance = new fis.CfnExperimentTemplate(
      this,
      "fis-template-stop-instances-in-vpc-az",
      {
        description: "Stop and restart all tagged instances in AZ and VPC",
        roleArn: importedFISRoleArn.toString(),
        stopConditions: [
          {
            source: "aws:cloudwatch:alarm",
            value: importedStopConditionArn.toString(),
          },
        ],
        tags: {
          Name: "Stop and restart tagged instances in AZ and VPC",
          Stackname: this.stackName,
        },
        actions: {
          instanceActions: stopInstanceAction,
        },
        targets: {
          instanceTargets: TargetAllInstances,
        },
      }
    );

    const templateCPUStress = new fis.CfnExperimentTemplate(
      this,
      "fis-template-CPU-stress-random-instances-in-vpc",
      {
        description:
          "Runs CPU stress on random instance in VPC using the stress-ng tool. Uses the AWS FIS provided document - AWSFIS-Run-CPU-Stress",
        roleArn: importedFISRoleArn.toString(),
        stopConditions: [
          {
            source: "aws:cloudwatch:alarm",
            value: importedStopConditionArn.toString(),
          },
        ],
        tags: {
          Name: "Stress CPU on random instance in VPC",
          Stackname: this.stackName,
        },
        actions: {
          instanceActions: cpuStressAction,
        },
        targets: {
          instanceTargets: TargetRandomInstance,
        },
      }
    );

    const templateLatencySourceInjection = new fis.CfnExperimentTemplate(
      this,
      "fis-template-latency-injection-all-instances",
      {
        description:
          "Inject latency to particular domain (www.amazon.com) on all instances of VPC and random AZ using the tc tool. Uses the AWS FIS provided document - AWSFIS-Run-Network-Latency-Sources",
        roleArn: importedFISRoleArn.toString(),
        stopConditions: [
          {
            source: "aws:cloudwatch:alarm",
            value: importedStopConditionArn.toString(),
          },
        ],
        tags: {
          Name: "Inject latency on all instances in VPC and random AZ",
          Stackname: this.stackName,
        },
        actions: {
          instanceActions: latencySourceAction,
        },
        targets: {
          instanceTargets: TargetAllInstances,
        },
      }
    );
  }
}
