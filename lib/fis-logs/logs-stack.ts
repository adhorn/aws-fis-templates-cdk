import * as cdk from '@aws-cdk/core';
import { Construct, Stack, StackProps } from '@aws-cdk/core';
import * as logs from '@aws-cdk/aws-logs';
import * as s3 from '@aws-cdk/aws-s3';


export class FisLogs extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
      super(scope, id, props);

    // Cloudwatch loggroup
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