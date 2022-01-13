import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { StackProps, Stack } from "aws-cdk-lib";
import { FisSsmDocs } from "./fis-upload-ssm-docs/ssm-upload-stack";
import { FisRole } from "./fis-role/iam-role-stack";
import { FisLogs } from "./fis-logs/logs-stack";
import { StopCondition } from "./fis-stop-condition/stop-condition-stack";
import { Ec2InstancesExperiments } from "./fis-experiments/ec2-instance-faults/experiments-stack";
import { Ec2ControlPlaneExperiments } from "./fis-experiments/ec2-control-plane-faults/experiments-stack";
import { NaclExperiments } from "./fis-experiments/nacl-faults/experiments-stack";
import { AsgExperiments } from "./fis-experiments/asg-faults/experiments-stack";
import { EksExperiments } from "./fis-experiments/eks-faults/experiments-stack";
import { SecGroupExperiments } from "./fis-experiments/security-groups-faults/experiments-stack";
import { IamAccessExperiments } from "./fis-experiments/iam-access-faults/experiments-stack";
import { LambdaChaosExperiments } from "./fis-experiments/lambda-faults/experiments-stack";

export class FIS extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    // Mandatory stacks (Do not comment out)
    const SSMDocStack = new FisSsmDocs(this, "FisSsmDocs");
    const LogsStack = new FisLogs(this, "FisLogs");
    const IamRoleStack = new FisRole(this, "FisRole");
    const StopConditionStack = new StopCondition(this, "StopCond");

    SSMDocStack.node.addDependency(IamRoleStack);
    IamRoleStack.node.addDependency(LogsStack);

    // Experiment Group stacks (Comment out experiments you are not interested in)
    const Ec2InstancesExperimentStack = new Ec2InstancesExperiments(
      this,
      "Ec2InstExp"
    );
    const Ec2ControlPlaneExperimentsStack = new Ec2ControlPlaneExperiments(
      this,
      "Ec2APIExp"
    );
    const NaclExperimentsStack = new NaclExperiments(this, "NaclExp");
    const AsgExperimentsStack = new AsgExperiments(this, "AsgExp");
    const EksExperimentsStack = new EksExperiments(this, "EksExp");
    const SecGroupExperimentsStack = new SecGroupExperiments(
      this,
      "SecGroupExp"
    );
    const IamAccessExperimentsStack = new IamAccessExperiments(
      this,
      "IamAccExp"
    );
    const LambdaFaultExperimentStack = new LambdaChaosExperiments(
      this,
      'LambdaExp'
    )


    Ec2InstancesExperimentStack.node.addDependency(IamRoleStack);
    Ec2InstancesExperimentStack.node.addDependency(StopConditionStack);
    Ec2ControlPlaneExperimentsStack.node.addDependency(IamRoleStack);
    Ec2ControlPlaneExperimentsStack.node.addDependency(StopConditionStack);
    NaclExperimentsStack.node.addDependency(IamRoleStack);
    NaclExperimentsStack.node.addDependency(StopConditionStack);
    AsgExperimentsStack.node.addDependency(IamRoleStack);
    AsgExperimentsStack.node.addDependency(StopConditionStack);
    EksExperimentsStack.node.addDependency(IamRoleStack);
    EksExperimentsStack.node.addDependency(StopConditionStack);
    SecGroupExperimentsStack.node.addDependency(IamRoleStack);
    SecGroupExperimentsStack.node.addDependency(StopConditionStack);
    IamAccessExperimentsStack.node.addDependency(IamRoleStack);
    IamAccessExperimentsStack.node.addDependency(StopConditionStack);
    LambdaFaultExperimentStack.addDependency(IamRoleStack);
    LambdaFaultExperimentStack.addDependency(StopConditionStack);    
  }
}
