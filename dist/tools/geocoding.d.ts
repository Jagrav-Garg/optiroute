export interface Coordinates {
    lat: number;
    lng: number;
}
export declare function validCoordinates(value: any): boolean;
export declare function geocodeLocation(name: string, destination?: string, address?: string): Promise<Coordinates | null>;
//# sourceMappingURL=geocoding.d.ts.map