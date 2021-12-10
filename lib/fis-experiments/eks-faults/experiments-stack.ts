import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StackProps, Stack } from 'aws-cdk-lib';
import { aws_fis as fis } from 'aws-cdk-lib';

export class EksExperiments extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Import FIS Role and Stop Condition
    const importedFISRoleArn = cdk.Fn.importValue('FISIamRoleArn');
    const importedStopConditionArn = cdk.Fn.importValue('StopConditionArn');

    // Variables you may want to change based on your environment
    // const asgName = new cdk.CfnParameter(this, 'asgName', {
    //   type: 'String',
    //   description: 'The auto scaling group name in which to inject fault',
    //   default: 'Test-FIS-ASG',
    // });
    //console.log('asgName: ', asgName.valueAsString);

    // if asg_name parameter is in cdk.json us the below
    const eksClusterName = this.node.tryGetContext('eks_cluster_name');



    // Targets
    const targetEKSCluster: fis.CfnExperimentTemplate.ExperimentTemplateTargetProperty = {
      resourceType: 'aws:eks:nodegroup',
      selectionMode: 'ALL',
      resourceTags: {
        'eksctl.cluster.k8s.io/v1alpha1/cluster-name': eksClusterName.toString()
      }
    }

    // Actions
    const terminateNodeGroupInstance: fis.CfnExperimentTemplate.ExperimentTemplateActionProperty = {
      actionId: 'aws:eks:terminate-nodegroup-instances',
      parameters: {
        instanceTerminationPercentage: "50"
      },
      targets: {
        Nodegroups: 'nodeGroupTarget'
      }
    }


    // Experiments
    const templateEksTerminateNodeGroup = new fis.CfnExperimentTemplate(this, 'fis-template-CPU-stress-random-instances-in-vpc',
      {
        description: 'Runs the EC2 API action TerminateInstances on the target node group.',
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
          'nodeGroupActions': terminateNodeGroupInstance
        },
        targets: {
          'nodeGroupTarget': targetEKSCluster
        }
      }
    );
  }
}
