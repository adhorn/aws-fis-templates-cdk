import * as cdk from "aws-cdk-lib";
import {Stack, StackProps} from 'aws-cdk-lib';
import {Cluster, KubernetesVersion} from 'aws-cdk-lib/aws-eks';
import {Construct} from 'constructs';
import {InstanceClass, InstanceSize, InstanceType} from 'aws-cdk-lib/aws-ec2';
import {Role, IRole} from "aws-cdk-lib/aws-iam";


export class ChaosMeshDemoStack extends Stack {
  private readonly DEFAULT_NAMESPACE = 'default';
  private readonly FIS_KUBERNETES_ROLE = 'fis-experiment-role';


  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const cluster = new Cluster(this, 'fis-eks-demo', {
      version: KubernetesVersion.V1_21,
      clusterName: "fis-demo-cluster-chaosmesh",
      defaultCapacity: 1,
      defaultCapacityInstance: InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM)
    });

    // apply a kubernetes manifest to the cluster
    cluster.addManifest('NginxDeployment', {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: 'nginx',
        labels: {app: 'nginx'}
      },
      spec: {
        selector: {
          matchLabels: {
            app: 'nginx'
          }
        },
        replicas: 2,
        template: {
          metadata: {
            labels: {
              app: 'nginx'
            }
          },
          spec: {
            containers: [
              {
                name: 'nginx',
                image: 'nginx',
                ports: [{containerPort: 80}],
                resources: {
                  limits: {
                    cpu: '500m'
                  },
                  requests: {
                    cpu: '200m'
                  }
                }
              },
            ],
          }
        },
      },
    });

    cluster.addManifest('NginxService', {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: 'nginx',
        labels: {
          app: 'nginx'
        },
      },
      spec: {
        ports: [{port: 80}],
        selector: {
          app: 'nginx'
        }
      }
    });

    cluster.addHelmChart('ChaosMesh', {
          chart: 'chaos-mesh',
          repository: 'https://charts.chaos-mesh.org',
          namespace: 'chaos-testing',
        }
    );

    const importedFISRoleArn = cdk.Fn.importValue("FISIamRoleArn");
    const experimentRole = Role.fromRoleArn(
        this,
        "FISIamRoleArn",
        importedFISRoleArn,
        {mutable: false}
    )
    this.configureKubernetesRBAC(cluster, experimentRole)
  }

  private configureKubernetesRBAC(cluster: Cluster, experimentRole: IRole) {
    const verbsForCustomResources = [
      'get', 'list', 'watch', 'describe', 'create', 'edit', 'delete', 'deletecollection', 'annotate', 'patch', 'label'
    ]

    const role = cluster.addManifest('fis-rbac', {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'Role',
      metadata: {name: this.FIS_KUBERNETES_ROLE, namespace: 'default'},
      rules: [
        {
          apiGroups: [''],
          resources: ['events', 'pods', 'pods/log', 'namespaces'],
          verbs: ['get', 'list', 'watch', 'describe']
        },
        {
          apiGroups: ['chaos-mesh.org'],
          resources: ['*'],
          verbs: verbsForCustomResources
        }
      ]
    });

    // Bind the Kubernetes Role to the IAM role
    const roleBinding = cluster.addManifest('fis-role-binding', {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'RoleBinding',
      metadata: {name: 'experiment-role-binding', namespace: this.DEFAULT_NAMESPACE},
      subjects: [{name: experimentRole.roleArn, kind: 'User', apiGroup: 'rbac.authorization.k8s.io'}],
      roleRef: {kind: 'Role', name: this.FIS_KUBERNETES_ROLE, apiGroup: 'rbac.authorization.k8s.io'}
    });

    roleBinding.node.addDependency(role);

    // Bind the Kubernetes user to the IAM role, "groups" here is symbolic, what's important is that experimentRole
    // is bound to a Kubernetes username equals to the IAM role ARN
    cluster.awsAuth.addRoleMapping(experimentRole, {groups: ["ExperimentGroup"]})
  }
}
