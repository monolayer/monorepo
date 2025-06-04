# Next.js Lambda Adapter

AWS Lambda adapter for Next.js applications (App Router).

This adapter replicates the behaviour (*has feature parity*) of a self-hosted Next.js (App Router) application in a serverless environment (AWS Lambda).

Caching and revalidation of pages (with Incremental Static Regeneration) is managed with a custom cache handler that  ensures consistency across all function invocations. (based on S3 and DynamoDB).

For production environments, you should configure a CloudFront distribution to serve static and public assets from an S3 Bucket. By default, **ALL** application traffic will be handled by the Lambda function.

## Prerequisites

- Next.js application built with `standalone` mode. (v15 *tested*, v14 *untested*)
- AWS Account

## Usage

After building your application, run:

```bash
npx --yes @monolayer/nextjs-lambda-adapter
```

This will install the Lambda adapter in the standalone folder of your build.

## Deployment

You can now package your application as a Lambda function.

### Packaging Notes

- You should copy the `.next/static` folder to the `.next/standalone/.next` directory.
- You should copy the `public` folder to the `.next/standalone` directory.

Here's an example packaging script:

```bash
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
npx --yes @monolayer/nextjs-lambda-adapter@latest
```

The Lambda function must be configured as follows:

- Handler: `adapter/index.handler`.
- Environment Variables:
  - NEXTJS_ADAPTER_CACHE_BUCKET_NAME (**required**): name of the bucket for the cache items.
  - NEXTJS_ADAPTER_DYNAMODB_TAGS_TABLE (**required**): name of the DynamoDB table for the cache tags.
  - NEXTJS_ADAPTER_CLOUDFRONT_DOMAIN (*optional*): CloudFront distribution domain name. To allow server actions to be called from a CloudFront distribution.
  - NEXTJS_ADAPTER_CACHE_DEBUG (*optional*): Set to `true` to print cache operations.
- Permissions: read/write permissions to the S3 Bucket and DynamoDB table.

The ImageOptimizationCache will write to the ephemeral storage at /tmp/cache. By default lambda functions have 512MB of ephimeral storage.

### Example

Here's a sample AWS SAM template `template.yaml` to deploy a barebones application:

```yaml
AWSTemplateFormatVersion: 2010-09-09
Transform: AWS::Serverless-2016-10-31

Parameters:
  CacheBucketName:
    Type: String
  DynamoDBTableName:
    Type: String

Resources:
  CacheBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName: !Ref CacheBucketName
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
  DynamoDbTagsTable:
    Type: AWS::DynamoDB::Table
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      TableName: !Ref DynamoDBTableName
      AttributeDefinitions:
        - AttributeName: PK
          AttributeType: S
      KeySchema:
        - AttributeName: PK
          KeyType: HASH
      BillingMode: PAY_PER_REQUEST
      TableClass: STANDARD
  AppFn:
    Type: AWS::Serverless::Function
    DependsOn: DynamoDbTagsTable
    Properties:
      CodeUri: ./.next/standalone
      Handler: adapter/index.handler
      PackageType: Zip
      MemorySize: 1536
      Runtime: nodejs22.x
      Timeout: 20
      Architectures:
        - arm64
      FunctionUrlConfig:
        AuthType: NONE
        InvokeMode: RESPONSE_STREAM
      Environment:
        Variables:
          NODE_ENV: production
          NEXTJS_ADAPTER_CACHE_BUCKET_NAME: !Ref CacheBucket
          NEXTJS_ADAPTER_DYNAMODB_TAGS_TABLE: !Ref DynamoDBTableName
      Policies:
        - S3CrudPolicy:
            BucketName: !Ref CacheBucket
        - DynamoDBCrudPolicy:
            TableName: !Ref DynamoDBTableName
    Metadata:
      SkipBuild: True
```
