import { Stack } from "aws-cdk-lib";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { join } from "path";
export interface TableProps {
    tableName: string,
    primaryKey: string,
    createLambdaPath?: string,
    readLambdaPath?: string,
    updateLambdaPath?: string,
    deleteLambdaPath?: string,
    secondaryIndexes?: string[]
}
export class GenericTable {
    private stack: Stack;
    private props: TableProps;
    private table: Table;

    private createLambda: NodejsFunction | undefined;
    private readLambda: NodejsFunction | undefined;
    private updateLambda: NodejsFunction | undefined;
    private deleteLambda: NodejsFunction | undefined;

    public createLamdaIntegration: LambdaIntegration;
    public readLamdaIntegration: LambdaIntegration;
    public updateLamdaIntegration: LambdaIntegration;
    public deleteLamdaIntegration: LambdaIntegration;

    public constructor(stack: Stack, props: TableProps) {
        this.props = props;
        this.stack = stack;
        this.initialize();
    }
    private initialize() {
        this.createTable();
        this.addSecondaryIndexes();
        this.createLambdas();
        this.grantTableRights();
    }

    private createLambdas() {
        if (this.props.createLambdaPath) {
            this.createLambda = this.createSingleLamda(this.props.createLambdaPath);
            this.createLamdaIntegration = new LambdaIntegration(this.createLambda);
        }
        if (this.props.readLambdaPath) {
            this.readLambda = this.createSingleLamda(this.props.readLambdaPath);
            this.readLamdaIntegration = new LambdaIntegration(this.readLambda);
        }
        if (this.props.updateLambdaPath) {
            this.updateLambda = this.createSingleLamda(this.props.updateLambdaPath);
            this.updateLamdaIntegration = new LambdaIntegration(this.updateLambda);
        }
        if (this.props.deleteLambdaPath) {
            this.deleteLambda = this.createSingleLamda(this.props.deleteLambdaPath);
            this.deleteLamdaIntegration = new LambdaIntegration(this.deleteLambda);
        }
    }
    private createTable() {
        this.table = new Table(this.stack, this.props.tableName, {
            partitionKey:
            {
                name: this.props.primaryKey,
                type: AttributeType.STRING
            },
            tableName: this.props.tableName
        })
    }
    private addSecondaryIndexes() {
        if (this.props.secondaryIndexes) {
            for (const secondaryIndex of this.props.secondaryIndexes) {
                this.table.addGlobalSecondaryIndex({
                    indexName: secondaryIndex,
                    partitionKey: {
                        name: secondaryIndex,
                        type: AttributeType.STRING
                    }
                })
            }
        }
    }
    private createSingleLamda(lambdaName: string): NodejsFunction {
        const lambdaId = `${this.props.tableName}-${lambdaName}`;
        return new NodejsFunction(this.stack, lambdaId, {
            entry: (join(__dirname, '..', 'services', this.props.tableName, `${lambdaName}.ts`)),
            handler: 'handler',
            functionName: lambdaId,
            environment: {
                TABLE_NAME: this.props.tableName,
                PRIMARY_KEY: this.props.primaryKey
            }
        })
    }
    private grantTableRights() {
        if (this.createLambda) {
            this.table.grantWriteData(this.createLambda);
        }
        if (this.readLambda) {
            this.table.grantReadData(this.readLambda);
        }
        if (this.updateLambda) {
            this.table.grantWriteData(this.updateLambda);
        }
        if (this.deleteLambda) {
            this.table.grantWriteData(this.deleteLambda);
        }
    }
}