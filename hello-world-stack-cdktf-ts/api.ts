import {Construct} from "constructs";
import {Apigatewayv2Api} from "@cdktf/provider-aws/lib/apigatewayv2-api";
import {Apigatewayv2Stage} from "@cdktf/provider-aws/lib/apigatewayv2-stage";
import {CloudwatchLogGroup} from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import {TerraformOutput} from "cdktf";
import {Apigatewayv2Route} from "@cdktf/provider-aws/lib/apigatewayv2-route";
import {Lambda} from "./lambda";
import {Apigatewayv2Integration} from "@cdktf/provider-aws/lib/apigatewayv2-integration";
import {LambdaPermission} from "@cdktf/provider-aws/lib/lambda-permission";

export type HttpApiStageProps = {
    stage: string,
    retentionInDays?: number
    loggingLevel?: string
}

export class HttpApiGateway extends Construct {

    readonly api: Apigatewayv2Api;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.api = new Apigatewayv2Api(this, "http-api", {
            name: id,
            protocolType: "HTTP"
        });
    }

    addStage(props: Readonly<HttpApiStageProps>) {
        return new HttpApiStage(this, `${props.stage}-stage`, props);
    }

}

class HttpApiStage extends Construct {

    readonly stage: Apigatewayv2Stage
    readonly api: Apigatewayv2Api

    constructor(scope: HttpApiGateway, id: string, props: HttpApiStageProps) {
        super(scope, id);
        this.api = scope.api;

        const {stage, retentionInDays = 7, loggingLevel = "INFO"} = {...props};

        const logGroup = new CloudwatchLogGroup(this, `api-logs`, {
            name: `/aws/apigateway/${this.api.name}`,
            retentionInDays
        });

        this.stage = new Apigatewayv2Stage(this, "stage", {
            apiId: this.api.id,
            name: stage,
            autoDeploy: true,
            accessLogSettings: {
                destinationArn: logGroup.arn,
                format: JSON.stringify({
                    requestId: "$context.requestId",
                    requestTime: "$context.requestTime",
                    httpMethod: "$context.httpMethod",
                    path: "$context.path",
                    routeKey: "$context.routeKey",
                    status: "$context.status",
                    responseLatency: "$context.responseLatency",
                    integrationRequestId: "$context.integration.requestId",
                    functionResponseStatus: "$context.integration.status",
                    integrationLatency: "$context.integration.latency",
                    integrationServiceStatus: "$context.integration.integrationStatus",
                    ip: "$context.identity.sourceIp",
                    userAgent: "$context.identity.userAgent",
                    principalId: "$context.authorizer.principalId",
                })
            },
            defaultRouteSettings: {
                dataTraceEnabled: true,
                loggingLevel,
                detailedMetricsEnabled: false,
                throttlingRateLimit: 10,
                throttlingBurstLimit: 5,
            },
        });

        new TerraformOutput(this, "base_url", {
            value: this.stage.invokeUrl
        });
    }

    addRoute(props: Readonly<HttpApiRouteProps>) {
        const routeName = "route".concat(props.route.replace(/\/+/gi, "-")
            .concat(`-${props.method}`).toLowerCase());

        new HttpApiRoute(this, routeName, props);

        return this;
    }

    done() {
        return this.api;
    }
}

export type HttpApiRouteProps = {
    route: string,
    method: string,
    lambda: Lambda
}

class HttpApiRoute extends Construct {

    constructor(scope: HttpApiStage, id: string, props: Readonly<HttpApiRouteProps>,) {
        super(scope, id);

        const {route, method, lambda} = {...props};
        const routeKey = `${method} ${route}`;

        const integration = new Apigatewayv2Integration(this, "lambda_integration", {
            apiId: scope.api.id,
            integrationUri: lambda.lambdaInvokeArn,
            integrationType: "AWS_PROXY",
            payloadFormatVersion: "2.0"
        });

        new Apigatewayv2Route(this, id, {
            apiId: scope.api.id,
            routeKey,
            target: `integrations/${integration.id}`
        });

        new LambdaPermission(this, "afafaf", {
            statementId: "AllowExecutionFromAPIGateway",
            action: "lambda:InvokeFunction",
            functionName: lambda.lambdaFunctionName,
            principal: "apigateway.amazonaws.com",
            sourceArn: `${scope.api.executionArn}/*/*`
        });
    }


}