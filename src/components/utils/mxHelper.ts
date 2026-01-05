/** Mendix 내부 attribute 추출 */
export default function getMxAttributes(item: any): Record<string, { value: any }> {
    const symbol = Object.getOwnPropertySymbols(item).find(sym => sym.toString().includes("mxObject"));

    return symbol ? item[symbol]?._jsonData?.attributes ?? {} : {};
}