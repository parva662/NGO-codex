# NGO Enforcement Support Tool – MVP Specification

## 1. Goal
Internal web-based tool for NGO staff to manually document, classify, and prepare enforcement cases related to digital food marketing targeting children.

## 2. Users & Roles
- Administrator:
  - Manage organisations and users
- Case Manager:
  - Create and manage cases, monitoring entries, evidence, reports
- Viewer:
  - Read-only access to assigned cases

## 3. Organisation Rule
- Every user belongs to exactly one organisation
- Every record (case, evidence, report) belongs to one organisation
- Admin can see all organisations

## 4. MVP Modules
- Case Management
- Monitoring Entries
- Complaint Intake (internal)
- Evidence Management (files)
- Legal Classification
- Reporting (PDF + ZIP)

## 5. Core Workflow
1. Create a case
2. Add one or more monitoring entries
3. Upload evidence (screenshots, video, documents)
4. Add legal classification and notes
5. Generate enforcement report (PDF + evidence ZIP)

## 6. Legal Classification (Manual)
- Select applicable legal framework(s)
- Select infringement type(s)
- Add free-text legal notes
- No automated analysis or decision-making

## 7. Explicit Non-Goals
- No AI or ML
- No automated detection or scraping
- No public complaint portal
- No integrations with external platforms
- No dashboards or analytics

## 8. Acceptance Criteria
- User can create and manage cases
- Evidence can be uploaded and linked
- Legal classification can be added manually
- PDF report can be generated
- Data is separated by organisation
