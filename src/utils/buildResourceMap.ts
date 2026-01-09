// utils/menu/buildResourceMap.ts
import { ValueStatus } from "mendix";
import getMxAttributes from "./mxHelper";

export function buildResourceMap(Resource?: {
    status?: ValueStatus;
    items?: any[];
}): Map<string, Record<string, { value: any }>> {
    const map = new Map<string, Record<string, { value: any }>>();

    if (!Resource || Resource.status !== ValueStatus.Available || !Array.isArray(Resource.items)) {
        return map;
    }

    Resource.items.forEach(resource => {
        if (!resource?.id) return;

        try {
            map.set(String(resource.id), getMxAttributes(resource));
        } catch (e) {
            console.warn("[ResourceMap] Failed:", resource?.id, e);
        }
    });

    return map;
}
