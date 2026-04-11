export interface ReportInput {
    imagesBase64: {
        img: string;
        mimeType: string;
    }[];
    latitude?: number;
    longitude?: number;
    description: string;
    language?: "en" | "fr";
}
export interface ReportMeta {
    responseId: string;
    plantName: string | null;
    healthStatus: "healthy" | "diseased" | "stressed" | "unknown";
    severity: "low" | "medium" | "high" | null;
    disease: string | null;
    diseaseDescription: string | null;
    confidence: number;
    causes: string[];
    symptoms: string[];
    immediateSolutions: string[];
    longTermSolutions: string[];
    preventionTips: string[];
    disclaimer: string;
}
export interface Report {
    metadata: ReportMeta;
    report: string;
}
export declare function generatePlantReport(input: ReportInput): Promise<Report>;
//# sourceMappingURL=report.service.d.ts.map