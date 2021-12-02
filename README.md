# Chaos Engineering with AWS Fault Injection Simulator (FIS) 


![Issues](https://img.shields.io/github/issues/adhorn/aws-fis-templates-cdk)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://gitHub.com/adhorn/aws-fis-templates-cdk/graphs/commit-activity)
[![Twitter](https://img.shields.io/twitter/url/https/github.com/adhorn/aws-fis-experiment-templates?style=social)](https://twitter.com/intent/tweet?text=Wow:&url=https%3A%2F%2Fgithub.com%2Fadhorn%2Faws-fis-templates-cdk)


# Collection of [FIS Experiment Templates](https://docs.aws.amazon.com/fis/latest/userguide/experiment-templates.html)

These templates let you perform fault injection experiments on resources (applications, network, and infrastructure) in the [AWS Cloud](https://aws.amazon.com).

## Prerequisites:

-   [What is AWS Fault Injection Simulator?](https://docs.aws.amazon.com/fis/latest/userguide/what-is.html)
-   [Experiment templates for AWS FIS](https://docs.aws.amazon.com/fis/latest/userguide/experiment-templates.html)
-   [How AWS Fault Injection Simulator works with IAM](https://docs.aws.amazon.com/fis/latest/userguide/security_iam_service-with-iam.html)


## Deploy via CDK:

```bash
npm install
cdk deploy
```

## Cancel experiment using CloudWatch alarm
All templates have the same synthetic CloudWatch Alarm to get you started using the `stop-condition`. To use this alarm to test canceling experiments, do the following:

```bash
aws cloudwatch set-alarm-state --alarm-name "NetworkInAbnormal" --state-value "ALARM" --state-reason "testing FIS"
```

Once familiar with the `stop-condition`, update the CloudWatch alarms with more appropriate ones.


### Other useful CDK commands:

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template

The `cdk.json` file tells the CDK Toolkit how to execute your app.
