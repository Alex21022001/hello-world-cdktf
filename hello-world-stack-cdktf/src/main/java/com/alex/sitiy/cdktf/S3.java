package com.alex.sitiy.cdktf;

import com.hashicorp.cdktf.AssetType;
import com.hashicorp.cdktf.TerraformAsset;
import com.hashicorp.cdktf.providers.aws.s3_bucket.S3Bucket;
import com.hashicorp.cdktf.providers.aws.s3_object.S3Object;
import com.hashicorp.cdktf.providers.random_provider.pet.Pet;
import org.jetbrains.annotations.NotNull;
import software.constructs.Construct;

public class S3 extends Construct {

    private final String bucketName;
    private final String functionObjectKey;

    public S3(@NotNull Construct scope, @NotNull String id, TerraformAsset asset) {
        super(scope, id);

        Pet pet = Pet.Builder.create(this, "random_name")
                .length(4)
                .build();

        S3Bucket s3Bucket = S3Bucket.Builder.create(this, "s3_bucket")
                .bucket(pet.getId())
                .build();

        S3Object s3Object = S3Object.Builder.create(this, "lambda_archive")
                .bucket(s3Bucket.getBucket())
                .key(asset.getFileName())
                .source(asset.getPath())
                .build();

        this.bucketName = s3Bucket.getBucket();
        this.functionObjectKey = s3Object.getKey();
    }

    public String getBucketName() {
        return bucketName;
    }

    public String getFunctionObjectKey() {
        return functionObjectKey;
    }
}
