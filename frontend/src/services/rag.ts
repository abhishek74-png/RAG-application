import { supabase } from '../lib/supabase';
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
import * as mammoth from 'mammoth';

export interface RetrievalResult {
  id: string;
  document_id?: string;
  content: string;
  similarity?: number;
  metadata?: Record<string, unknown>;
}

export interface RetrievalResponse {
  success: boolean;
  context: string;
  results: RetrievalResult[];
}

export const ragService = {
    async processDocument(filePath: string, fileName: string, fileId: string, orgId?: string) {
        try {
            // 1. Download File from Supabase Storage
            const { data: blob, error } = await supabase.storage.from('documents').download(filePath);
            if (error || !blob) throw new Error("Failed to download file: " + (error?.message || ""));

            const ext = fileName.split('.').pop()?.toLowerCase();
            let text = "";

            // 2. Extract Text Client-Side (Saves backend memory)
            if (ext === "pdf") {
                const arrayBuffer = await blob.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(" ");
                    text += pageText + "\n";
                }
            } else if (ext === "docx") {
                const arrayBuffer = await blob.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                text = result.value;
            } else if (ext === "txt") {
                text = await blob.text();
            } else {
                throw new Error(`Unsupported file type: ${ext}`);
            }

            text = text.replace(/\s+/g, ' ').trim();

            if (text.length === 0) {
                throw new Error("Document is empty or text could not be extracted.");
            }

            // 3. Send extracted text to secure Edge Function for embedding
            const { data: { session } } = await supabase.auth.getSession();
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

            const response = await fetch(`${supabaseUrl}/functions/v1/embed`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                    text,
                    fileName,
                    fileId,
                    orgId
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to generate embeddings");
            }

            const result = await response.json();
            return { success: true, chunks: result.chunks };

        } catch (error: any) {
            console.error("RAG Processing Error:", error);
            throw new Error(`RAG Pipeline failed: ${error.message}`);
        }
    },

    async getRelevantContext(question: string, orgId?: string): Promise<RetrievalResponse> {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
            throw new Error("Your session has expired. Please sign in again.");
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        // Note: Using standard fetch instead of invoke here to explicitly control the anon key and preflight
        const response = await fetch(`${supabaseUrl}/functions/v1/retrieve`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`,
                "apikey": supabaseAnonKey
            },
            body: JSON.stringify({
                question,
                orgId
            }),
        });

        if (!response.ok) {
            console.error(`[Retrieval Error] Status: ${response.status}`);
            throw new Error("Document retrieval is temporarily unavailable. Please try again.");
        }

        const data = await response.json();

        if (!data || !data.success) {
            throw new Error("Document retrieval returned an invalid response.");
        }

        if (!data.results || data.results.length === 0) {
            return { success: true, context: "", results: [] };
        }

        // Deduplicate and compress
        const uniqueSources = new Map();
        for (const doc of data.results) {
            if (uniqueSources.size >= 5) break;
            
            const chunkId = doc.metadata?.chunk_id || doc.id;
            if (!uniqueSources.has(chunkId)) {
                let compressedContent = doc.content;
                if (compressedContent.length > 1500) {
                    compressedContent = compressedContent.substring(0, 1500) + '...';
                }
                uniqueSources.set(chunkId, {
                    page_content: compressedContent,
                    metadata: doc.metadata,
                    score: doc.similarity
                });
            }
        }

        const deduplicatedResults = Array.from(uniqueSources.values());

        // Source Citation Formatting for LLM
        const contextString = deduplicatedResults
            .map((r: any, idx: number) => `[Source ${idx + 1}: ${r.metadata?.source_name || "Unknown"} (Chunk ${r.metadata?.chunk_index || 0})]\n${r.page_content}`)
            .join("\n\n---\n\n");

        return {
            success: true,
            context: contextString,
            results: deduplicatedResults
        };
    }
};
