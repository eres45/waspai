import os
import sys
import uuid
import base64
import mimetypes
import tempfile
import subprocess
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="WaspAI Universal Execution Sandbox")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_TOKEN = os.getenv("SECRET_TOKEN")

class ExecuteRequest(BaseModel):
    code: str
    timeout: Optional[int] = 180

class GeneratedFile(BaseModel):
    name: str
    size: int
    mime_type: str
    base64_data: str

class ExecuteResponse(BaseModel):
    success: bool
    stdout: str
    stderr: str
    exit_code: int
    files: List[GeneratedFile]

@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "waspai-sandbox",
        "version": "1.0.0"
    }

@app.post("/execute", response_model=ExecuteResponse)
def execute_code(
    payload: ExecuteRequest,
    authorization: Optional[str] = Header(None)
):
    if SECRET_TOKEN:
        expected = f"Bearer {SECRET_TOKEN}"
        if authorization != expected:
            raise HTTPException(status_code=401, detail="Unauthorized")

    temp_dir = Path(tempfile.mkdtemp(prefix="wasp_run_"))
    script_path = temp_dir / "script.py"

    try:
        script_path.write_text(payload.code, encoding="utf-8")

        result = subprocess.run(
            [sys.executable, "-u", str(script_path)],
            cwd=str(temp_dir),
            capture_output=True,
            text=True,
            timeout=payload.timeout
        )

        generated_files = []
        for file_path in temp_dir.iterdir():
            if file_path.name == "script.py" or not file_path.is_file():
                continue

            file_bytes = file_path.read_bytes()
            mime, _ = mimetypes.guess_type(file_path.name)
            mime_type = mime or "application/octet-stream"

            generated_files.append(
                GeneratedFile(
                    name=file_path.name,
                    size=len(file_bytes),
                    mime_type=mime_type,
                    base64_data=base64.b64encode(file_bytes).decode("utf-8")
                )
            )

        return ExecuteResponse(
            success=(result.returncode == 0),
            stdout=result.stdout,
            stderr=result.stderr,
            exit_code=result.returncode,
            files=generated_files
        )

    except subprocess.TimeoutExpired:
        return ExecuteResponse(
            success=False,
            stdout="",
            stderr=f"Execution timed out after {payload.timeout} seconds",
            exit_code=-1,
            files=[]
        )
    except Exception as e:
        return ExecuteResponse(
            success=False,
            stdout="",
            stderr=str(e),
            exit_code=-1,
            files=[]
        )
    finally:
        try:
            for item in temp_dir.iterdir():
                item.unlink(missing_ok=True)
            temp_dir.rmdir()
        except Exception:
            pass

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
