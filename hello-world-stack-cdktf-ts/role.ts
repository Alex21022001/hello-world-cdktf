import {Construct} from "constructs";
import {IamRole} from "@cdktf/provider-aws/lib/iam-role";
import {IamPolicyAttachment} from "@cdktf/provider-aws/lib/iam-policy-attachment";

export class Role extends Construct {

    readonly role: IamRole

    constructor(scope: Construct, id: string, service: string) {
        super(scope, id);

        this.role = new IamRole(this, id, {
            name: id,
            assumeRolePolicy: Role.getPolicy(service)
        });
    }

    attachPolicy(policyArn: string) {
        const policyName = policyArn.split("/").pop();

        new IamPolicyAttachment(this, `${this.node.id}_policy_attachment`, {
            name: `${this.node.id}_${policyName}_attachment`,
            policyArn: policyArn,
            roles: [this.role.name]
        })
    }

    get arn() {
        return this.role.arn;
    }

    private static getPolicy(service: string) {
        const assumePolicy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": service
                    },
                    "Effect": "Allow",
                    "Sid": ""
                }
            ]
        };

        return JSON.stringify(assumePolicy);
    }
}