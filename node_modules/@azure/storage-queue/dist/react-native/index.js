// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { RestError } from "@azure/core-rest-pipeline";
export * from "./AccountSASPermissions.js";
export * from "./AccountSASResourceTypes.js";
export * from "./AccountSASServices.js";
export { generateAccountSASQueryParameters, } from "./AccountSASSignatureValues.js";
export { AnonymousCredential, Credential, StorageSharedKeyCredential, BaseRequestPolicy, AnonymousCredentialPolicy, CredentialPolicy, StorageRetryPolicyType, StorageRetryPolicy, StorageRetryPolicyFactory, StorageSharedKeyCredentialPolicy, StorageBrowserPolicyFactory, } from "@azure/storage-common";
export { Pipeline, isPipelineLike, newPipeline, StorageOAuthScopes, } from "./Pipeline.js";
export { StorageQueueAudience, getQueueServiceAccountAudience } from "./models.js";
export * from "./QueueClient.js";
export * from "./QueueSASPermissions.js";
export { generateQueueSASQueryParameters, } from "./QueueSASSignatureValues.js";
export * from "./QueueServiceClient.js";
export * from "./SASQueryParameters.js";
export * from "./generatedModels.js";
export { RestError };
export { logger } from "./log.js";
//# sourceMappingURL=index.js.map