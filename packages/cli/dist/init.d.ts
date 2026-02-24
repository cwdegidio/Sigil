export type InitResult = {
    created: string[];
    skipped: string[];
};
export declare function init(projectName: string, outputDir: string): InitResult;
export declare function printInitResult(projectName: string, result: InitResult): void;
export declare function printAgentResult(agentName: string, result: {
    created: string[];
    skipped: string[];
}): void;
export declare function initInteractive(outputDir: string): Promise<void>;
//# sourceMappingURL=init.d.ts.map