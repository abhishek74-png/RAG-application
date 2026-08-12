from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.rag_service import DocumentService

router = APIRouter()

class ProcessRequest(BaseModel):
    file_path: str
    source_name: str
    file_id: str

@router.post("/process")
async def process_document(request: ProcessRequest):
    try:
        result = await DocumentService.process_supabase_document(
            file_path=request.file_path, 
            source_name=request.source_name, 
            file_id=request.file_id
        )
        return {"message": "Document embedded successfully", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

