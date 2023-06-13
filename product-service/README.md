# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

## Routes:

1) Get all products list: [getProductsList](https://wvag8l0p53.execute-api.us-east-1.amazonaws.com/products)
2) Get one product by id: [getProductById](https://wvag8l0p53.execute-api.us-east-1.amazonaws.com/products/1)
3) Link to cloudfront deployment - [Cloudfront](https://d39kkywqk6rcg.cloudfront.net)