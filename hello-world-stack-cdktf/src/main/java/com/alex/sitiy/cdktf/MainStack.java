package com.alex.sitiy.cdktf;

import com.hashicorp.cdktf.AssetType;
import com.hashicorp.cdktf.TerraformAsset;
import com.hashicorp.cdktf.TerraformStack;
import com.hashicorp.cdktf.providers.aws.provider.AwsProvider;
import com.hashicorp.cdktf.providers.aws.s3_bucket.S3Bucket;
import com.hashicorp.cdktf.providers.aws.s3_object.S3Object;
import com.hashicorp.cdktf.providers.random_provider.pet.Pet;
import com.hashicorp.cdktf.providers.random_provider.provider.RandomProvider;
import org.jetbrains.annotations.NotNull;
import software.constructs.Construct;

public class MainStack extends TerraformStack {

    public MainStack(@NotNull Construct scope, @NotNull String id, String lambdaPath) {
        super(scope, id);

        AwsProvider.Builder.create(this, "AWS")
                .region("us-west-2")
                .build();

        RandomProvider.Builder.create(this, "random").build();

        TerraformAsset lambdaAsset = TerraformAsset.Builder.create(this, "lambda-asset")
                .path(lambdaPath)
                .type(AssetType.FILE)
                .build();

        S3 s3 = new S3(this, "s3", lambdaAsset);

        HelloWorldLambda lambda = new HelloWorldLambda(this, "lambda-construct", s3.getBucketName(), s3.getFunctionObjectKey(),lambdaAsset);

        new ApiGateway(this, "lambda-api", lambda.getLambdaFunction().getInvokeArn(), lambda.getLambdaFunction().getFunctionName());
    }
}
