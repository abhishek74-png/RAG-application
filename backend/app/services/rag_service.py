import os
import tempfile
from pathlib import Path
from typing import Dict, Any
from app.core.config import settings
# pyrefly: ignore [missing-import]
from supabase import create_client, Client

# LangChain and RAG imports
# pyrefly: ignore [missing-import]
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
# pyrefly: ignore [missing-import]
from langchain_text_splitters import RecursiveCharacterTextSplitter
# pyrefly: ignore [missing-import]
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
# pyrefly: ignore [missing-import]
from langchain_community.vectorstores import SupabaseVectorStore
# pyrefly: ignore [missing-import]
from langchain.chains import create_retrieval_chain
# pyrefly: ignore [missing-import]
from langchain.chains.combine_documents import create_stuff_documents_chain
# pyrefly: ignore [missing-import]
from langchain_core.prompts import ChatPromptTemplate

# Initialize Supabase Client
supabase_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

# Initialize Gemini Embeddings
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/embedding-001",
    google_api_key=settings.GOOGLE_API_KEY
)

# Initialize pgvector via Supabase
vector_store = SupabaseVectorStore(
    embedding=embeddings,
    client=supabase_client,
    table_name="documents_embeddings",
    query_name="match_documents_embeddings",
)

# Initialize Gemini LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-pro",
    google_api_key=settings.GOOGLE_API_KEY,
    temperature=0.3
)

system_prompt = (
    "You are an assistant for question-answering tasks. "
    "Use the following pieces of retrieved context to answer the question. "
    "If you don't know the answer, say that you don't know. "
    "Use three sentences maximum and keep the answer concise."
    "\n\n"
    "{context}"
)

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{input}"),
])

question_answer_chain = create_stuff_documents_chain(llm, prompt)
rag_chain = create_retrieval_chain(vector_store.as_retriever(search_kwargs={"k": 5}), question_answer_chain)

class DocumentService:
    @staticmethod
    async def process_supabase_document(file_path: str, source_name: str, file_id: str) -> Dict[str, Any]:
        """
        Downloads a document from Supabase Storage, chunks it, and stores embeddings in pgvector.
        """
        # Download file from Supabase Storage
        res = supabase_client.storage.from_("documents").download(file_path)
        
        ext = Path(source_name).suffix.lower()
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp_file:
            tmp_file.write(res)
            tmp_file_path = tmp_file.name
            
        try:
            if ext == '.pdf':
                loader = PyPDFLoader(tmp_file_path)
            elif ext == '.docx':
                loader = Docx2txtLoader(tmp_file_path)
            elif ext == '.txt':
                loader = TextLoader(tmp_file_path)
            else:
                raise ValueError("Unsupported file type")
                
            docs = loader.load()
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            splits = text_splitter.split_documents(docs)
            
            for split in splits:
                split.metadata['file_id'] = file_id
                split.metadata['source_name'] = source_name
                split.metadata['file_path'] = file_path
                
            # Add to Supabase pgvector
            vector_store.add_documents(documents=splits)
            
            return {"status": "success", "chunks_processed": len(splits)}
        finally:
            os.remove(tmp_file_path)

class RAGService:
    @staticmethod
    def query(question: str) -> Dict[str, Any]:
        response = rag_chain.invoke({"input": question})
        
        sources = []
        for doc in response.get("context", []):
            sources.append({
                "page_content": doc.page_content,
                "metadata": doc.metadata
            })
            
        return {
            "answer": response["answer"],
            "sources": sources
        }
