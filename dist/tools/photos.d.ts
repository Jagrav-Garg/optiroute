import type { ServerResponse } from "node:http";
export declare function allowedPhotoUrl(value: unknown): URL | null;
type Photo = {
    bytes: Buffer;
    type: string;
    expires: number;
};
export declare function loadPhoto(source: string): Promise<Photo>;
export declare function servePhoto(source: string, res: ServerResponse): Promise<void>;
export declare function photoUrls(images: unknown[], thumbnail?: unknown): string[];
export {};
//# sourceMappingURL=photos.d.ts.map