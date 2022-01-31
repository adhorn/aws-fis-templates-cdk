import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { StackProps, Stack } from "aws-cdk-lib";
import { aws_fis as fis } from "aws-cdk-lib";
import { aws_iam as iam } from "aws-cdk-lib";

export class LambdaChaosExperiments extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Import FIS Role, Stop Condition, and other required parameters
    const importedFISRoleArn = cdk.Fn.importValue("FISIamRoleArn");
    const importedStopConditionArn = cdk.Fn.importValue("StopConditionArn");
    const importedSSMAPutParameterStoreRoleArn = cdk.Fn.importValue(
      "SSMAPutParameterStoreRoleArn"
    );
    const importedPutParameterStoreSSMADocName = cdk.Fn.importValue(
      "PutParameterStoreSSMADocName"
    );

    const importedParameterName = this.node.tryGetContext("ssm_parameter_name");

    // Targets - empty since SSMA defines its own targets

    // Actions
    const startAutomation = {
      actionId: "aws:ssm:start-automation-execution",
      description: "Put config into parameter store to enable Lambda Chaos.",
      parameters: {
        documentArn: `arn:aws:ssm:${this.region}:${
          this.account
        }:document/${importedPutParameterStoreSSMADocName.toString()}`,
        documentParameters: JSON.stringify({
          DurationMinutes: "PT1M",
          AutomationAssumeRole: importedSSMAPutParameterStoreRoleArn.toString(),
          ParameterName: importedParameterName.toString(),
          ParameterValue: '{ "delay": 1000, "is_enabled": true, "error_code": 404, "exception_msg": "This is chaos", "rate": 1, "fault_type": "exception"}',
          RollbackValue: '{ "delay": 1000, "is_enabled": false, "error_code": 404, "exception_msg": "This is chaos", "rate": 1, "fault_type": "exception"}'
        }),
        maxDuration: "PT5M",
      },
    };

    const putParameter = {
      actionId: "aws:ssm:put-parameter",
      description: "Put config into parameter store to enable Lambda Chaos.",
      parameters: {
          duration: "PT10M",
          name: importedParameterName.toString(),
          value: '{ "delay": 1000, "is_enabled": true, "error_code": 404, "exception_msg": "This is chaos", "rate": 1, "fault_type": "exception"}',
          rollbackValue: '{ "delay": 1000, "is_enabled": false, "error_code": 404, "exception_msg": "This is chaos", "rate": 1, "fault_type": "exception"}'
        }
    };

    // Experiments
    const templateInjectS3AccessDenied = new fis.CfnExperimentTemplate(
      this,
      "fis-template-inject-lambda-fault",
      {
        description: "Inject faults into Lambda function using chaos-lambda library",
        roleArn: importedFISRoleArn.toString(),
        stopConditions: [
          {
            source: "aws:cloudwatch:alarm",
            value: importedStopConditionArn.toString(),
          },
        ],
        tags: {
          Name: "Inject fault to Lambda functions",
          Stackname: this.stackName,
        },
        actions: {
          ssmaAction: putParameter,
        },
        targets: {},
      }
    );
  }
}
