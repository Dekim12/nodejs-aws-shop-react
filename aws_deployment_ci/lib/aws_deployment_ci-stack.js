const { Stack, Duration} = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const iam = require('aws-cdk-lib/aws-iam');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const s3deployment = require('aws-cdk-lib/aws-s3-deployment');

class AwsDeploymentCiStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const cloudFrontOAI = new cloudfront.OriginAccessIdentity(this, 'my-automated-oai-rss')

    const rss_bucket = new s3.Bucket(this, 'my-automated-with-cdk-rss-bucket', {
      bucketName: 'my-automated-with-cdk-rss-bucket',
      versioned: false,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument:  'index.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS, 
    });

  rss_bucket.addToResourcePolicy(new iam.PolicyStatement({
    actions: ['S3:GetObject'],
    resources: [rss_bucket.arnForObjects('*')],
    principals: [new iam.CanonicalUserPrincipal(cloudFrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
  }))

  const cloudFrontDistribution = new cloudfront.CloudFrontWebDistribution(this, 'my-automated-distribution-rss', {
    originConfigs: [{
      s3OriginSource: {
        s3BucketSource: rss_bucket,
        originAccessIdentity: cloudFrontOAI
      },
      behaviors: [{isDefaultBehavior: true}]
    }]
  })

  new s3deployment.BucketDeployment(this, 'my-automated-rss-bucket-deployment', {
    sources: [s3deployment.Source.asset('../dist')],
    destinationBucket: rss_bucket,
    distribution: cloudFrontDistribution,
    distributionPaths: ['/*']
  })
  }
}

module.exports = { AwsDeploymentCiStack }
