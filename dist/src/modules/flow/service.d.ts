export function start(userId: any, data: any): Promise<{
    userId: number;
    id: number;
    createdAt: Date;
    platform: import(".prisma/client").$Enums.Platform;
    zone: import(".prisma/client").$Enums.Zone;
    startedAt: Date;
    finishedAt: Date | null;
    durationMinutes: number | null;
    value: number | null;
    km: number | null;
}>;
export function finish(userId: any, data: any): Promise<{
    userId: number;
    id: number;
    createdAt: Date;
    platform: import(".prisma/client").$Enums.Platform;
    zone: import(".prisma/client").$Enums.Zone;
    startedAt: Date;
    finishedAt: Date | null;
    durationMinutes: number | null;
    value: number | null;
    km: number | null;
}>;
export function list(userId: any): Promise<{
    userId: number;
    id: number;
    createdAt: Date;
    platform: import(".prisma/client").$Enums.Platform;
    zone: import(".prisma/client").$Enums.Zone;
    startedAt: Date;
    finishedAt: Date | null;
    durationMinutes: number | null;
    value: number | null;
    km: number | null;
}[]>;
//# sourceMappingURL=service.d.ts.map