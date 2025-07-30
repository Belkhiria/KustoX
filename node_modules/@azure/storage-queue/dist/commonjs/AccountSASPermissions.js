"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountSASPermissions = void 0;
/**
 * ONLY AVAILABLE IN NODE.JS RUNTIME.
 *
 * This is a helper class to construct a string representing the permissions granted by an AccountSAS. Setting a value
 * to true means that any SAS which uses these permissions will grant permissions for that operation. Once all the
 * values are set, this should be serialized with toString and set as the permissions field on an
 * {@link AccountSASSignatureValues} object. It is possible to construct the permissions string without this class, but
 * the order of the permissions is particular and this class guarantees correctness.
 */
class AccountSASPermissions {
    /**
     * Parse initializes the AccountSASPermissions fields from a string.
     *
     * @param permissions -
     */
    static parse(permissions) {
        const accountSASPermissions = new AccountSASPermissions();
        for (const c of permissions) {
            switch (c) {
                case "r":
                    accountSASPermissions.read = true;
                    break;
                case "w":
                    accountSASPermissions.write = true;
                    break;
                case "d":
                    accountSASPermissions.delete = true;
                    break;
                case "l":
                    accountSASPermissions.list = true;
                    break;
                case "a":
                    accountSASPermissions.add = true;
                    break;
                case "c":
                    accountSASPermissions.create = true;
                    break;
                case "u":
                    accountSASPermissions.update = true;
                    break;
                case "p":
                    accountSASPermissions.process = true;
                    break;
                default:
                    throw new RangeError(`Invalid permission character: ${c}`);
            }
        }
        return accountSASPermissions;
    }
    /**
     * Permission to read resources granted.
     */
    read = false;
    /**
     * Permission to write resources granted.
     */
    write = false;
    /**
     * Permission to delete queues and messages granted.
     */
    delete = false;
    /**
     * Permission to list queues granted.
     */
    list = false;
    /**
     * Permission to add messages, table entities, and append to blobs granted.
     */
    add = false;
    /**
     * Permission to create queues, blobs and files granted.
     */
    create = false;
    /**
     * Permissions to update messages and table entities granted.
     */
    update = false;
    /**
     * Permission to get and delete messages granted.
     */
    process = false;
    /**
     * Produces the SAS permissions string for an Azure Storage account.
     * Call this method to set AccountSASSignatureValues Permissions field.
     *
     * Using this method will guarantee the resource types are in
     * an order accepted by the service.
     *
     * @see https://learn.microsoft.com/rest/api/storageservices/constructing-an-account-sas
     *
     */
    toString() {
        // The order of the characters should be as specified here to ensure correctness:
        // https://learn.microsoft.com/rest/api/storageservices/constructing-an-account-sas
        // Use a string array instead of string concatenating += operator for performance
        const permissions = [];
        if (this.read) {
            permissions.push("r");
        }
        if (this.write) {
            permissions.push("w");
        }
        if (this.delete) {
            permissions.push("d");
        }
        if (this.list) {
            permissions.push("l");
        }
        if (this.add) {
            permissions.push("a");
        }
        if (this.create) {
            permissions.push("c");
        }
        if (this.update) {
            permissions.push("u");
        }
        if (this.process) {
            permissions.push("p");
        }
        return permissions.join("");
    }
}
exports.AccountSASPermissions = AccountSASPermissions;
//# sourceMappingURL=AccountSASPermissions.js.map