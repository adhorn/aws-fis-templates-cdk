import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { StackProps, Stack } from "aws-cdk-lib";
import { aws_fis as fis } from "aws-cdk-lib";

export class EksExperiments extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Import FIS Role and Stop Condition
    const importedFISRoleArn = cdk.Fn.importValue("FISIamRoleArn");
    const importedStopConditionArn = cdk.Fn.importValue("StopConditionArn");

    const eksClusterName = this.node.tryGetContext("eks_cluster_name");

    // Targets
    const targetEKSCluster: fis.CfnExperimentTemplate.ExperimentTemplateTargetProperty =
      {
        resourceType: "aws:eks:nodegroup",
        selectionMode: "ALL",
        resourceTags: {
          "eksctl.cluster.k8s.io/v1alpha1/cluster-name":
            eksClusterName.toString(),
        },
      };

    // Actions
    const terminateNodeGroupInstance: fis.CfnExperimentTemplate.ExperimentTemplateActionProperty =
      {
        actionId: "aws:eks:terminate-nodegroup-instances",
        parameters: {
          instanceTerminationPercentage: "50",
        },
        targets: {
          Nodegroups: "nodeGroupTarget",
        },
      };

    // Experiments
    const templateEksTerminateNodeGroup = new fis.CfnExperimentTemplate(
      this,
      "fis-eks-terminate-node-group",
      {
        description:
          "Terminate 50 per cent instances on the EKS target node group.",
        roleArn: importedFISRoleArn.toString(),
        stopConditions: [
          {
            source: "aws:cloudwatch:alarm",
            value: importedStopConditionArn.toString(),
          },
        ],
        tags: {
          Name: "Terminate 50 per cent instances on the EKS target node group",
          Stackname: this.stackName,
        },
        actions: {
          nodeGroupActions: terminateNodeGroupInstance,
        },
        targets: {
          nodeGroupTarget: targetEKSCluster,
        },
      }
    );
  }
}
