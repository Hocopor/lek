from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ProjectCreate(BaseModel):
    name: str
    description: str = ""


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str
    created_at: datetime
    updated_at: datetime
    lecture_count: int = 0

    class Config:
        from_attributes = True


class LectureResponse(BaseModel):
    id: int
    project_id: int
    filename: str
    mode: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class LectureResultResponse(BaseModel):
    id: int
    filename: str
    result_text: str
    extended_text: str
    mode: str
    status: str

    class Config:
        from_attributes = True


class ProcessOptions(BaseModel):
    mode: str = "simple"
    extended: bool = False


class SummaryResponse(BaseModel):
    project_id: int
    summary: str
    lecture_count: int


class LoginRequest(BaseModel):
    password: str


class LoginResponse(BaseModel):
    token: str
