import * as cdk from 'aws-cdk-lib';
import { CfnOutput } from 'aws-cdk-lib';
import { CloudFrontWebDistribution, OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'InfrastructureQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
    //Declared S3
    const myBucket =  new Bucket(this, 'static-website-bucket', {
      bucketName: 'static-web-angular-s3',
      versioned: true,
      encryption: BucketEncryption.S3_MANAGED,
      websiteIndexDocument: "index.html"
    });
    //Declared OAI
    const oia = new OriginAccessIdentity(this, 'OIA', {
      comment: "Created by CDK"
    });

    //Declared Policy S3
    const policyStatment = new PolicyStatement();
    policyStatment.addActions('s3:GetObject');
    policyStatment.addResources(`${myBucket.bucketArn}/*`)
    policyStatment.addCanonicalUserPrincipal(oia.cloudFrontOriginAccessIdentityS3CanonicalUserId);
    myBucket.addToResourcePolicy(policyStatment);

    //Declared CloudFront
    const cloudFront = new CloudFrontWebDistribution(this, 'static-website-cloudFront', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: myBucket,
            originAccessIdentity: oia
          },
          behaviors: [
            { isDefaultBehavior: true }
          ]
        }
      ]
    });

    //Ouput value DNS of CloudFront
    new CfnOutput(this, 'CloudFrontDNS', {
      value: cloudFront.distributionDomainName
    });
    new BucketDeployment(this, 'deployStaticWebsite', {
      sources: [Source.asset('../demo-app/dist')],
      destinationBucket: myBucket
    });
  }
}
