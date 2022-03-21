import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs';
import { Code, Function as LamdaFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { GenericTable } from './GenericTable';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
export class SpaceStack extends Stack {

    private api = new RestApi(this, 'SpaceApi');
    // private spacesTable = new GenericTable('SpacesTable', 'spaceId', this);

    private spacesTable = new GenericTable(this, {
        tableName: 'SpacesTable',
        primaryKey: 'spaceId',
        createLambdaPath: 'Create',
        readLambdaPath: 'Read',
        secondaryIndexes: ['location']
    })

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props)

        const helloLamda = new LamdaFunction(this, 'helloLamda', {
            runtime: Runtime.NODEJS_14_X,
            code: Code.fromAsset(join(__dirname, '..', 'services', 'hello')),
            handler: 'hello.main'
        })
        const helloLamdaNodeJs = new NodejsFunction(this, 'helloLamdaNodejs', {
            entry: join(__dirname, '..', 'services', 'node-lamda', 'hello.ts'),
            handler: 'handler'
        })
        const s3ListPolicy = new PolicyStatement();
        s3ListPolicy.addActions('s3:ListAllMyBuckets');
        s3ListPolicy.addResources('*')

        helloLamdaNodeJs.addToRolePolicy(s3ListPolicy);
        const helloLamdaIntegration = new LambdaIntegration(helloLamdaNodeJs)
        const helloLamdaResource = this.api.root.addResource('hello');
        helloLamdaResource.addMethod('GET', helloLamdaIntegration);

        //Spaces API integrations;
        const spaceResource = this.api.root.addResource('spaces');
        spaceResource.addMethod('POST', this.spacesTable.createLamdaIntegration);
        spaceResource.addMethod('GET', this.spacesTable.readLamdaIntegration);
    }
}