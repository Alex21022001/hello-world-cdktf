package com.alex.sitiy.cdktf;

import com.hashicorp.cdktf.TerraformOutput;
import com.hashicorp.cdktf.providers.aws.api_gateway_stage.ApiGatewayStage;
import com.hashicorp.cdktf.providers.aws.apigatewayv2_api.Apigatewayv2Api;
import com.hashicorp.cdktf.providers.aws.apigatewayv2_integration.Apigatewayv2Integration;
import com.hashicorp.cdktf.providers.aws.apigatewayv2_route.Apigatewayv2Route;
import com.hashicorp.cdktf.providers.aws.apigatewayv2_stage.Apigatewayv2Stage;
import com.hashicorp.cdktf.providers.aws.apigatewayv2_stage.Apigatewayv2StageAccessLogSettings;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_group.CloudwatchLogGroup;
import com.hashicorp.cdktf.providers.aws.lambda_permission.LambdaPermission;
import org.jetbrains.annotations.NotNull;
import org.json.JSONObject;
import software.constructs.Construct;

public class ApiGateway extends Construct {
    public ApiGateway(@NotNull Construct scope, @NotNull String id, String lambdaInvokeArn, String lambdaFunctionName) {
        super(scope, id);

        Apigatewayv2Api api = Apigatewayv2Api.Builder.create(this, "api")
                .name("hello-world-api")
                .protocolType("HTTP")
                .build();

        CloudwatchLogGroup apiCwGroup = CloudwatchLogGroup.Builder.create(this, "api_cw_group")
                .name("/aws/api_gw/".concat(api.getName()))
                .retentionInDays(30)
                .build();

        Apigatewayv2Stage stage = Apigatewayv2Stage.Builder.create(this, "api_stage")
                .name("dev")
                .apiId(api.getId())
                .autoDeploy(true)
                .accessLogSettings(Apigatewayv2StageAccessLogSettings.builder()
                        .destinationArn(apiCwGroup.getArn())
                        .format(getLogSettingFormat())
                        .build())
                .build();

        Apigatewayv2Integration integration = Apigatewayv2Integration.Builder.create(this, "api_lambda_integration")
                .apiId(api.getId())
                .integrationUri(lambdaInvokeArn)
                .integrationType("AWS_PROXY")
                .integrationMethod("POST")
                .build();

        Apigatewayv2Route.Builder.create(this, "api_hello_route")
                .apiId(api.getId())
                .routeKey("GET /hello")
                .target("integrations/".concat(integration.getId()))
                .build();

        LambdaPermission.Builder.create(this, "api_lambda_permission")
                .statementId("AllowExecutionFromAPIGateway")
                .action("lambda:InvokeFunction")
                .functionName(lambdaFunctionName)
                .principal("apigateway.amazonaws.com")
                .sourceArn(api.getExecutionArn().concat("/*/*"))
                .build();

        TerraformOutput.Builder.create(this, "base_url")
                .value(stage.getInvokeUrl())
                .build();
    }

    private String getLogSettingFormat() {
        return new JSONObject()
                .put("requestId", "$context.requestId")
                .put("sourceIp", "$context.identity.sourceIp")
                .put("requestTime", "$context.requestTime")
                .put("protocol", "$context.protocol")
                .put("httpMethod", "$context.httpMethod")
                .put("resourcePath", "$context.resourcePath")
                .put("routeKey", "$context.routeKey")
                .put("status", "$context.status")
                .put("responseLength", "$context.responseLength")
                .put("integrationErrorMessage", "$context.integrationErrorMessage").toString();
    }
}
