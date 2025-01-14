export function toSQLFriendly(identifier: string): string {
    identifier = identifier.replace(/([A-Z]+)/g, str => "_" + str).toLowerCase();
    if (identifier.startsWith("_")) {
        return identifier.replace(/^_+/gi, "");
    }
    return identifier;
}

export function toUpperCase(identifier: string): string {
	return identifier.replace(/(^[a-z]|_+[a-z])/g, (m) => m[m.length > 1 ? 1 : 0].toUpperCase());
}	
