import { App, CloudBackend, NamedCloudWorkspace } from "cdktf";
import {MyStack} from "./mystack";

const app = new App();

const stack = new MyStack(app, "hello-world-stack-cdktf-ts");

new CloudBackend(stack, {
  hostname: "app.terraform.io",
  organization: "alex-sitiy-organization",
  workspaces: new NamedCloudWorkspace("hello-world-stack-cdktf-ts")
});

app.synth();
