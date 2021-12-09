import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StackProps, Stack } from 'aws-cdk-lib';
import { aws_logs as logs } from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';

export class FisLogs extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Cloudwatch logGroup
    const fisLogGroup = new logs.LogGroup(this, 'fisLogGroup', {
    });

    // S3 bucket for FIS logs
    const fisS3Bucket = new s3.Bucket(this, 'fisS3Bucket')

    new cdk.CfnOutput(this, 'fisLogGroupArn', {
      value: fisLogGroup.logGroupArn,
      description: 'The Arn of the logGroup',
      exportName: 'fisLogGroupArn',
    });

    new cdk.CfnOutput(this, 'fisS3BucketArn', {
      value: fisS3Bucket.bucketArn,
      description: 'The Arn of the S3 bucket',
      exportName: 'fisS3BucketArn',
    });

    new cdk.CfnOutput(this, 'fisS3BucketName', {
      value: fisS3Bucket.bucketName,
      description: 'The name of the S3 bucket',
      exportName: 'fisS3BucketName',
    });
  }
}