import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { StackProps, Stack } from "aws-cdk-lib";
import { aws_cloudwatch as cw } from "aws-cdk-lib";

export class StopCondition extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // FIS Stop Condition
    const alarm = new cw.Alarm(this, "cw-alarm", {
      alarmName: "NetworkInAbnormal",
      metric: new cw.Metric({
        metricName: "NetworkIn",
        namespace: "AWS/EC2",
      }).with({
        period: cdk.Duration.seconds(60),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
      comparisonOperator: cw.ComparisonOperator.LESS_THAN_THRESHOLD,
      datapointsToAlarm: 1,
    });

    new cdk.CfnOutput(this, "StopConditionArn", {
      value: alarm.alarmArn,
      description: "The Arn of the Stop-Conditioin CloudWatch Alarm",
      exportName: "StopConditionArn",
    });
  }
}
