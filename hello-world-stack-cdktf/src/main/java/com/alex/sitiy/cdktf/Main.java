package com.alex.sitiy.cdktf;

import com.hashicorp.cdktf.App;
import com.hashicorp.cdktf.CloudBackend;
import com.hashicorp.cdktf.CloudBackendConfig;
import com.hashicorp.cdktf.NamedCloudWorkspace;

public class Main {

    public static void main(String[] args) {
        App app = new App();

        MainStack stack = new MainStack(app, "hello-world-cdktf","../hello-world-lambda/target/function.zip");

        new CloudBackend(stack, CloudBackendConfig.builder()
                .hostname("app.terraform.io")
                .organization("alex-sitiy-organization")
                .workspaces(new NamedCloudWorkspace("hello-world-cdktf"))
                .build());

        app.synth();
    }
}
