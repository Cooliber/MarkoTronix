from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, date

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.service import Service, ServiceReport
from app.schemas.service import (
    ServiceCreate,
    ServiceResponse,
    ServiceUpdate,
    ServiceReportCreate,
    ServiceReportResponse,
    ServiceReportUpdate,
    ServiceWithReportResponse,
)

router = APIRouter()

@router.post("/", response_model=ServiceResponse)
async def create_service(
    service_in: ServiceCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new service appointment.
    """
    service = Service(
        **service_in.dict(exclude_unset=True),
        status="scheduled",
    )
    
    db.add(service)
    db.commit()
    db.refresh(service)
    
    # Add background task to send notification
    from app.utils.notifications import send_service_notification
    background_tasks.add_task(
        send_service_notification,
        service_id=service.id,
    )
    
    return service

@router.get("/", response_model=List[ServiceResponse])
async def read_services(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    service_type: Optional[str] = None,
    client_id: Optional[str] = None,
    technician_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve services with optional filtering.
    """
    query = db.query(Service)
    
    if status:
        query = query.filter(Service.status == status)
    
    if service_type:
        query = query.filter(Service.service_type == service_type)
    
    if client_id:
        query = query.filter(Service.client_id == client_id)
    
    if technician_id:
        query = query.filter(Service.assigned_to_id == technician_id)
    
    if date_from:
        query = query.filter(Service.scheduled_date >= date_from)
    
    if date_to:
        query = query.filter(Service.scheduled_date <= date_to)
    
    services = query.order_by(Service.scheduled_date).offset(skip).limit(limit).all()
    
    return services

@router.get("/{service_id}", response_model=ServiceWithReportResponse)
async def read_service(
    service_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific service by ID, including its reports.
    """
    service = db.query(Service).filter(Service.id == service_id).first()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )
    
    return service

@router.put("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: str,
    service_in: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a service.
    """
    service = db.query(Service).filter(Service.id == service_id).first()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )
    
    update_data = service_in.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(service, field, value)
    
    db.commit()
    db.refresh(service)
    
    return service

@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(
    service_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a service.
    """
    service = db.query(Service).filter(Service.id == service_id).first()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )
    
    db.delete(service)
    db.commit()
    
    return None

@router.post("/{service_id}/start", response_model=ServiceResponse)
async def start_service(
    service_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark a service as in progress.
    """
    service = db.query(Service).filter(Service.id == service_id).first()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )
    
    if service.status != "scheduled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Service is already in {service.status} status",
        )
    
    service.status = "in_progress"
    service.actual_start_time = datetime.now()
    
    db.commit()
    db.refresh(service)
    
    return service

@router.post("/{service_id}/complete", response_model=ServiceResponse)
async def complete_service(
    service_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark a service as completed.
    """
    service = db.query(Service).filter(Service.id == service_id).first()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )
    
    if service.status != "in_progress":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Service is not in progress",
        )
    
    service.status = "completed"
    service.actual_end_time = datetime.now()
    
    db.commit()
    db.refresh(service)
    
    return service

@router.post("/{service_id}/cancel", response_model=ServiceResponse)
async def cancel_service(
    service_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cancel a service.
    """
    service = db.query(Service).filter(Service.id == service_id).first()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )
    
    if service.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel a completed service",
        )
    
    service.status = "cancelled"
    
    db.commit()
    db.refresh(service)
    
    return service

@router.post("/{service_id}/reports", response_model=ServiceReportResponse)
async def create_service_report(
    service_id: str,
    report_in: ServiceReportCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new service report.
    """
    service = db.query(Service).filter(Service.id == service_id).first()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )
    
    report = ServiceReport(
        **report_in.dict(exclude_unset=True),
        service_id=service_id,
    )
    
    db.add(report)
    db.commit()
    db.refresh(report)
    
    # Add background task to generate and send report
    from app.utils.reports import generate_and_send_report
    background_tasks.add_task(
        generate_and_send_report,
        report_id=report.id,
    )
    
    return report

@router.get("/{service_id}/reports", response_model=List[ServiceReportResponse])
async def read_service_reports(
    service_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all reports for a service.
    """
    service = db.query(Service).filter(Service.id == service_id).first()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )
    
    reports = db.query(ServiceReport).filter(ServiceReport.service_id == service_id).all()
    
    return reports

@router.get("/{service_id}/reports/{report_id}", response_model=ServiceReportResponse)
async def read_service_report(
    service_id: str,
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific service report.
    """
    report = db.query(ServiceReport).filter(
        ServiceReport.id == report_id,
        ServiceReport.service_id == service_id
    ).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    
    return report

@router.put("/{service_id}/reports/{report_id}", response_model=ServiceReportResponse)
async def update_service_report(
    service_id: str,
    report_id: str,
    report_in: ServiceReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a service report.
    """
    report = db.query(ServiceReport).filter(
        ServiceReport.id == report_id,
        ServiceReport.service_id == service_id
    ).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    
    update_data = report_in.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(report, field, value)
    
    db.commit()
    db.refresh(report)
    
    return report

@router.post("/{service_id}/reports/{report_id}/send", response_model=ServiceReportResponse)
async def send_service_report(
    service_id: str,
    report_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send a service report to the client.
    """
    report = db.query(ServiceReport).filter(
        ServiceReport.id == report_id,
        ServiceReport.service_id == service_id
    ).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    
    # Add background task to send report
    from app.utils.reports import send_report
    background_tasks.add_task(
        send_report,
        report_id=report.id,
    )
    
    return report