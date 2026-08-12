declare module 'mammoth' {
    export interface ExtractRawTextOptions {
        arrayBuffer: ArrayBuffer;
    }
    export interface Result {
        value: string;
        messages: any[];
    }
    export function extractRawText(options: ExtractRawTextOptions): Promise<Result>;
}
