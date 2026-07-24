from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from models import Project, Lecture
from schemas import (
    ProjectCreate, ProjectResponse, LectureResponse,
    LectureResultResponse, ProcessOptions, SummaryResponse,
)
from services.llm import read_docx, read_pptx, create_docx, process_text
from auth import verify_token
from fastapi import Header
import os
from config import get_settings

router = APIRouter(prefix="/api")
settings = get_settings()


def auth(x_token: str = Header(None)):
    if not x_token or not verify_token(x_token):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return x_token


@router.post("/projects", response_model=ProjectResponse)
def create_project(data: ProjectCreate, db: Session = Depends(get_db), _=Depends(auth)):
    project = Project(name=data.name, description=data.description)
    db.add(project)
    db.commit()
    db.refresh(project)
    return {**project.__dict__, "lecture_count": 0}


@router.get("/projects", response_model=list[ProjectResponse])
def list_projects(db: Session = Depends(get_db), _=Depends(auth)):
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    result = []
    for p in projects:
        count = db.query(Lecture).filter(Lecture.project_id == p.id).count()
        result.append({**p.__dict__, "lecture_count": count})
    return result


@router.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db), _=Depends(auth)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    count = db.query(Lecture).filter(Lecture.project_id == project.id).count()
    return {**project.__dict__, "lecture_count": count}


@router.delete("/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), _=Depends(auth)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"detail": "Project deleted"}


@router.post("/projects/{project_id}/upload", response_model=list[LectureResponse])
async def upload_lectures(
    project_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    _=Depends(auth),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    upload_dir = os.path.join(settings.UPLOAD_DIR, str(project_id))
    os.makedirs(upload_dir, exist_ok=True)

    lectures = []
    for file in files:
        content = await file.read()
        file_path = os.path.join(upload_dir, file.filename)
        with open(file_path, "wb") as f:
            f.write(content)

        if file.filename.lower().endswith('.pptx'):
            original_text = read_pptx(content)
        else:
            original_text = read_docx(content)
        lecture = Lecture(
            project_id=project_id,
            filename=file.filename,
            original_text=original_text,
        )
        db.add(lecture)
        db.flush()
        lectures.append(lecture)

    db.commit()
    for l in lectures:
        db.refresh(l)
    return lectures


@router.get("/projects/{project_id}/lectures", response_model=list[LectureResponse])
def list_lectures(project_id: int, db: Session = Depends(get_db), _=Depends(auth)):
    lectures = db.query(Lecture).filter(Lecture.project_id == project_id).order_by(Lecture.created_at.desc()).all()
    return lectures


@router.post("/lectures/{lecture_id}/process", response_model=LectureResultResponse)
def process_lecture(
    lecture_id: int,
    options: ProcessOptions = ProcessOptions(),
    db: Session = Depends(get_db),
    _=Depends(auth),
):
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")

    lecture.mode = options.mode
    lecture.status = "processing"
    db.commit()

    try:
        if options.mode == "summary":
            project_lectures = (
                db.query(Lecture)
                .filter(Lecture.project_id == lecture.project_id, Lecture.original_text != "")
                .all()
            )
            combined = "\n\n---\n\n".join([f"[{l.filename}]\n{l.original_text}" for l in project_lectures])
            result = process_text(combined, mode="summary")
            lecture.result_text = result
        else:
            result = process_text(lecture.original_text, mode=options.mode, extended=options.extended)
            lecture.result_text = result

        lecture.status = "completed"
    except Exception as e:
        lecture.status = "error"
        lecture.result_text = str(e)

    db.commit()
    db.refresh(lecture)
    return lecture


@router.get("/lectures/{lecture_id}", response_model=LectureResultResponse)
def get_lecture(lecture_id: int, db: Session = Depends(get_db), _=Depends(auth)):
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    return lecture


@router.get("/lectures/{lecture_id}/download")
def download_lecture(lecture_id: int, db: Session = Depends(get_db), _=Depends(auth)):
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    if not lecture.result_text:
        raise HTTPException(status_code=400, detail="No result to download")

    from fastapi.responses import Response
    docx_bytes = create_docx(lecture.result_text)
    filename = lecture.filename.replace(".docx", "_simplified.docx")
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/projects/{project_id}/summary", response_model=SummaryResponse)
def get_project_summary(project_id: int, db: Session = Depends(get_db), _=Depends(auth)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    lectures = (
        db.query(Lecture)
        .filter(Lecture.project_id == project_id, Lecture.original_text != "")
        .all()
    )
    if not lectures:
        raise HTTPException(status_code=400, detail="No lectures to summarize")

    combined = "\n\n---\n\n".join([f"[{l.filename}]\n{l.original_text}" for l in lectures])
    summary = process_text(combined, mode="summary")

    return {
        "project_id": project_id,
        "summary": summary,
        "lecture_count": len(lectures),
    }


@router.delete("/lectures/{lecture_id}")
def delete_lecture(lecture_id: int, db: Session = Depends(get_db), _=Depends(auth)):
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    db.delete(lecture)
    db.commit()
    return {"detail": "Lecture deleted"}
