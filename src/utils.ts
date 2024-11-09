export function toSQLFriendly(identifier: string): string {
    identifier = identifier.replace(/([A-Z]+)/g, str => "_" + str).toLowerCase();
    if (identifier.startsWith("_")) {
        return identifier.replace(/^_+/gi, "");
    }
    return identifier;
}