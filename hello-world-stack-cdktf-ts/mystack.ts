import {TerraformStack, TerraformVariable} from "cdktf";
import {Construct} from "constructs";
import {Asset} from "./asset";
import {Role} from "./role";
import {Lambda, LAMBDA_SERVICE_PRINCIPAL, LAMBDA_EXECUTION_POLICY} from "./lambda";
import {AwsProvider} from "@cdktf/provider-aws/lib/provider";
import {HttpApiGateway} from "./api";


export class MyStack extends TerraformStack {
    constructor(scope: Construct, id: string) {
        super(scope, id);

        const awsRegion = new TerraformVariable(this, "aws_region", {
            default: "us-west-2",
            description: "The region where AWS should up the services"
        });

        new AwsProvider(this, "AWS", {
            region: awsRegion.value
        });

        const asset = new Asset(this, "lambda-asset", {
            relativePath: "../hello-world-lambda"
        });

        const role = new Role(this, "lambda-exec-role", LAMBDA_SERVICE_PRINCIPAL)
            .attachPolicy(LAMBDA_EXECUTION_POLICY);

        const lambda = new Lambda(this, "hello-world", {
            asset,
            role,
            environment: {
                QUARKUS_LAMBDA_HANDLER: "hello"
            }
        });

        const lambda2 = new Lambda(this, "hello-post", {
            environment: {
                QUARKUS_LAMBDA_HANDLER: "hello-post"
            },
            asset: asset,
            role: role
        });


        new HttpApiGateway(this, "hello-world-api")
            .addStage({stage: "prod", loggingLevel: "INFO"})
            .addRoute({method: "GET", route: "/hello", lambda})
            .addRoute({method: "POST", route: "/hello", lambda: lambda2})
            .done();

    }
}