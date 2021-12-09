# Chaos Engineering Templates for AWS Fault Injection Simulator (FIS) 


![Issues](https://img.shields.io/github/issues/adhorn/aws-fis-templates-cdk)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://gitHub.com/adhorn/aws-fis-templates-cdk/graphs/commit-activity)
[![Twitter](https://img.shields.io/twitter/url/https/github.com/adhorn/aws-fis-experiment-templates?style=social)](https://twitter.com/intent/tweet?text=Wow:&url=https%3A%2F%2Fgithub.com%2Fadhorn%2Faws-fis-templates-cdk)


# Collection of ready-made [FIS Experiment Templates](https://docs.aws.amazon.com/fis/latest/userguide/experiment-templates.html) defined using the CDK.

These templates let you perform fault injection experiments on resources (applications, network, and infrastructure) in the [AWS Cloud](https://aws.amazon.com).


# What does this package deploy?

## 1 - The [IAM roles](https://github.com/adhorn/aws-fis-templates-cdk/tree/main/lib/fis-role) required to run the experiments:
- The AWS FIS role with all necessary policies as described [here](https://docs.aws.amazon.com/fis/latest/userguide/getting-started-iam-service-role.html)
- SSM Automation document role for [faults using SSMA](https://github.com/adhorn/aws-fis-templates-cdk/tree/main/documents).

## 2 - A set of [AWS FIS experiments](https://github.com/adhorn/aws-fis-templates-cdk/tree/main/lib/fis-experiments) to get you started: 

###  [EC2 Instance faults](https://github.com/adhorn/aws-fis-templates-cdk/tree/main/lib/fis-experiments/ec2-instance-faults)
- Including:
    - Stopping and restarting (after duration) all EC2 instances in a VPC, an AZ, and with particular tags.
    - Injecting CPU stress on random EC2 instances in a VPC
    - Injecting latency on random EC2 instances all EC2 instances in a VPC, an AZ, and with particular tags.

### [EC2 Control Plane faults](https://github.com/adhorn/aws-fis-templates-cdk/tree/main/lib/fis-experiments/ec2-control-plane-faults)
- Including:
    - Injecting EC2 API Internal Error on the target IAM role
    - Injecting EC2 API Throttle Error on the target IAM role
    - Injecting EC2 API Unavailable Error on the target IAM role

### [Auto Scaling Group faults](https://github.com/adhorn/aws-fis-templates-cdk/tree/main/lib/fis-experiments/asg-faults)
- Including:
    - Stopping and restarting (after duration) all EC2 instances of a random AZ in a particular auto scaling group.
    - Injecting CPU stress on All EC2 instances of a particular auto scaling group.

### [Network Access Control List faults](https://github.com/adhorn/aws-fis-templates-cdk/tree/main/lib/fis-experiments/nacl-faults)
- Including:
    - Modifying Nacls associated with subnets that belong to a particular AZ to deny traffic in that AZ.

### Configuration:
These sample experiments uses default values for some of the parameters, such as a `vpc_id` and `asg_name`. 
Modify these in the file `cdk.json` before deploying to reflect your own AWS environment.
You can also specify your own tags for filtering EC2 instances. The currently used ones are defined as:
```
resourceTags: {
        'FIS-Ready': 'true'
      }
```


## 3 - An example [stop-condition](https://github.com/adhorn/aws-fis-templates-cdk/tree/main/lib/fis-stop-condition) using CloudWatch alarm

All templates use the same CloudWatch Alarm to get you started using the `stop-condition`. You can use this alarm to get familiar with canceling experiments. For example, you can trigger that alarm, for 1 minutes, using the following command:

```bash
aws cloudwatch set-alarm-state --alarm-name "NetworkInAbnormal" --state-value "ALARM" --state-reason "testing FIS"
```

Once you are familiar with the `stop-condition`, you should of course update the CloudWatch alarms with ones specific to your application and architecture.

## Prerequisites:

-   [What is AWS Fault Injection Simulator?](https://docs.aws.amazon.com/fis/latest/userguide/what-is.html)
-   [Experiment templates for AWS FIS](https://docs.aws.amazon.com/fis/latest/userguide/experiment-templates.html)
-   [How AWS Fault Injection Simulator works with IAM](https://docs.aws.amazon.com/fis/latest/userguide/security_iam_service-with-iam.html)



## Deploy via CDK:

```bash
npm install
cdk deploy
```




### Other useful CDK commands:

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template

The `cdk.json` file tells the CDK Toolkit how to execute your app.
