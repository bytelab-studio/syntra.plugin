declare function parseFloat(x: number): number;

export function isInt(value: number): boolean {
    let x;
    return isNaN(value) ? !1 : (x = parseFloat(value), (0 | x) === x);
}

export function inRange(value: number, min: number, max: number, onlyInteger: boolean = true): boolean {
    return value >= min && value <= max && (onlyInteger && isInt(value) || !onlyInteger);
}