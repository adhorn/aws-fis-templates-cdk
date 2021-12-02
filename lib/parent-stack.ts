import * as cdk from '@aws-cdk/core';
import { Construct, Stack, StackProps } from '@aws-cdk/core';
import { FisRole } from './fis-role/iam-role-stack';
import { StopCondition } from './fis-stop-condition/stop-condition-stack';
import { Ec2InstancesExperiments } from './fis-experiments/ec2-instance-faults/experiments-stack';
import { Ec2ControlPlaneExperiments } from './fis-experiments/ec2-control-plane-faults/experiments-stack';
import { NaclExperiments } from './fis-experiments/nacl-faults/experiments-stack';
import { AsgExperiments } from './fis-experiments/asg-faults/experiments-stack';


export class FIS extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const IamRoleStack = new FisRole(this, 'FisRole');
    const StopConditionStack = new StopCondition(this, 'StopCond');
    const Ec2InstancesExperimentStack = new Ec2InstancesExperiments(this, 'Ec2InstExp');
    const Ec2ControlPlaneExperimentsStack = new Ec2ControlPlaneExperiments(this, 'Ec2APIExp');
    const NaclExperimentsStack = new NaclExperiments(this, 'NaclExp');
    const AsgExperimentsStack = new AsgExperiments(this, 'AsgExp');
  
    Ec2InstancesExperimentStack.node.addDependency(IamRoleStack)
    Ec2InstancesExperimentStack.node.addDependency(StopConditionStack)
   
    Ec2ControlPlaneExperimentsStack.node.addDependency(IamRoleStack)
    Ec2ControlPlaneExperimentsStack.node.addDependency(StopConditionStack)

    NaclExperimentsStack.node.addDependency(IamRoleStack)
    NaclExperimentsStack.node.addDependency(StopConditionStack)

    AsgExperimentsStack.node.addDependency(IamRoleStack)
    AsgExperimentsStack.node.addDependency(StopConditionStack)
  }
}
