declare function checkFeedbackAllowed(userId: number): Promise<{
    allowed: boolean;
    reason: string;
    weightFactor?: undefined;
} | {
    allowed: boolean;
    weightFactor: number;
    reason?: undefined;
}>;
declare const _default: {
    checkFeedbackAllowed: typeof checkFeedbackAllowed;
};
export default _default;
//# sourceMappingURL=antifraud.service.d.ts.map