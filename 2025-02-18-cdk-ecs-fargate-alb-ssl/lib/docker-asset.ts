import { DockerImageAsset, Platform } from "aws-cdk-lib/aws-ecr-assets";
import type { Construct } from "constructs";

export function createDockerImageAsset(scope: Construct, id: string, directory: string): DockerImageAsset {
  return new DockerImageAsset(scope, id, {
    directory,
    platform: Platform.LINUX_AMD64,
  });
}
