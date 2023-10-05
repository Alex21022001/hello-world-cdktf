import {TerraformStack, TerraformVariable} from "cdktf";
import {Construct} from "constructs";
import {Asset} from "./asset";
import {Role} from "./role";
import {Lambda, LAMBDA_SERVICE_PRINCIPAL, LAMBDA_EXECUTION_POLICY} from "./lambda";
import {AwsProvider} from "@cdktf/provider-aws/lib/provider";

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

        const role = new Role(this, "lambda-exec-role", LAMBDA_SERVICE_PRINCIPAL);
        role.attachPolicy(LAMBDA_EXECUTION_POLICY);

        new Lambda(this, "hello-world", {
            asset,
            role
        });
    }
}