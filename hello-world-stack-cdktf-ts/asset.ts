import {Construct} from "constructs";
import {AssetType, TerraformAsset} from "cdktf";
import * as fs from "fs";
import path = require("node:path");
import assert = require("node:assert");

export type AssetProps = {
    relativePath: string,
    assetType?: AssetType,
    objectPath?: string
}

const DEFAULT_PROPS: Partial<AssetProps> = {
    assetType: AssetType.FILE,
    objectPath: "target/function.zip"
}

export class Asset extends Construct {

    readonly asset: TerraformAsset;

    constructor(scope: Construct, id: string, props: Readonly<AssetProps>) {
        super(scope, id);

        const {relativePath, assetType, objectPath = ""} = Object.assign({}, DEFAULT_PROPS, props);

        const absolutePath = path.resolve(__dirname, relativePath, objectPath);
        assert(fs.existsSync(absolutePath), `The given path in file's path ${absolutePath} is not valid.`)

        this.asset = new TerraformAsset(this, id, {
            path: absolutePath,
            type: assetType
        });
    }

    get path() {
        return this.asset.path;
    }

    get assetHash() {
        return this.asset.assetHash;
    }
}