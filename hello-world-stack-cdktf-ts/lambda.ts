import {Construct} from "constructs";
import {LambdaFunction} from "@cdktf/provider-aws/lib/lambda-function";
import {Asset} from "./asset";
import {Role} from "./role";
import {CloudwatchLogGroup} from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import {TerraformOutput} from "cdktf";


export const LAMBDA_SERVICE_PRINCIPAL = "lambda.amazonaws.com";
export const LAMBDA_EXECUTION_POLICY = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole";

export type Runtime = "java11" | "java17";

export type LambdaProps = {
    asset: Asset,
    environment?: { [key: string]: string },
    handler?: string,
    runtime?: Runtime
    memorySize?: number,
    role: Role
}

const DEFAULT_PROPS: Partial<LambdaProps> = {
    handler: "io.quarkus.amazon.lambda.runtime.QuarkusStreamHandler::handleRequest",
    runtime: "java17",
    memorySize: 256
}


export class Lambda extends Construct {

    readonly environment: { [key: string]: string };
    private lambda: LambdaFunction;

    constructor(scope: Construct, id: string, props: Readonly<LambdaProps>) {
        super(scope, id);

        const {asset, environment, handler, memorySize, runtime, role} = {...props, ...DEFAULT_PROPS}
        this.environment = environment ?? {};

        this.lambda = new LambdaFunction(this, "lambda_function", {
            functionName: id,
            filename: asset.path,
            environment: {
                variables: environment
            },
            handler,
            runtime,
            memorySize,
            role: role.arn
        });

        new CloudwatchLogGroup(this, "lambda_logs", {
            name: `/aws/lambda/${id}`,
            retentionInDays: 7
        });

        new TerraformOutput(this, "lambda_archive_path", {
            value: asset.path
        })
    }

    get lambdaInvokeArn() {
        return this.lambda.invokeArn
    }

    get lambdaFunctionName() {
        return this.lambda.functionName;
    }
}