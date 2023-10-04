package com.alex.sitiy.cdktf;

import com.hashicorp.cdktf.TerraformAsset;
import com.hashicorp.cdktf.TerraformOutput;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_group.CloudwatchLogGroup;
import com.hashicorp.cdktf.providers.aws.iam_policy_attachment.IamPolicyAttachment;
import com.hashicorp.cdktf.providers.aws.iam_role.IamRole;
import com.hashicorp.cdktf.providers.aws.lambda_function.LambdaFunction;
import com.hashicorp.cdktf.providers.aws.s3_bucket.S3Bucket;
import com.hashicorp.cdktf.providers.aws.s3_object.S3Object;
import org.jetbrains.annotations.NotNull;
import org.json.JSONObject;
import software.constructs.Construct;

import java.util.HashMap;
import java.util.List;

public class HelloWorldLambda extends Construct {

    private final LambdaFunction lambdaFunction;

    public HelloWorldLambda(@NotNull Construct scope, @NotNull String id, String bucket, String lambdaObject, TerraformAsset asset) {
        super(scope, id);

        IamRole role = IamRole.Builder.create(this, "lambda-exec-role")
                .name("lambda-exec-role")
                .assumeRolePolicy((new JSONObject()
                        .put("Version", "2012-10-17")
                        .put("Statement", new HashMap<String, Object>() {{
                            put("Action", "sts:AssumeRole");
                            put("Principal", new HashMap<String, Object>() {{
                                put("Service", "lambda.amazonaws.com");
                            }});
                            put("Effect", "Allow");
                            put("Sid", "");
                        }})).toString())
                .build();

        IamPolicyAttachment.Builder.create(this, "lambda-exec-role-policy-attachment")
                .name(role.getName())
                .roles(List.of(role.getName()))
                .policyArn("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole")
                .build();

        LambdaFunction lambda = LambdaFunction.Builder.create(this, "lambda-function")
                .functionName("hello-world")
                .s3Bucket(bucket)
                .s3Key(lambdaObject)
                .sourceCodeHash(asset.getAssetHash())
                .runtime("java17")
                .handler("io.quarkus.amazon.lambda.runtime.QuarkusStreamHandler::handleRequest")
                .role(role.getArn())
                .build();

        CloudwatchLogGroup.Builder.create(this, "lambda-cw-group")
                .name("/aws/lambda/".concat(lambda.getFunctionName()))
                .retentionInDays(30)
                .build();

        TerraformOutput.Builder.create(this, "function_name")
                .value(lambda.getFunctionName())
                .build();

        this.lambdaFunction = lambda;
    }

    public LambdaFunction getLambdaFunction() {
        return lambdaFunction;
    }
}
