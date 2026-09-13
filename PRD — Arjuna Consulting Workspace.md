# PRODUCT REQUIREMENTS DOCUMENT
## Arjuna Consulting Workspace
### Project Management System untuk Konsultasi & Pendampingan Operasional Daycare

**Version:** 1.0  
**Initial Project:** Rumah Nara Islamic Child Center  
**Primary Consultant:** Yayasan Arjuna Cendekia  
**Product Type:** Multi-project Consulting Management Web Application

---

# 1. PRODUCT OVERVIEW

Arjuna Consulting Workspace adalah web application untuk mengelola seluruh proses konsultasi dan pendampingan operasional antara **Tim Arjuna sebagai konsultan** dan **tim klien**.

Aplikasi harus menjadi **single source of truth** untuk:

- aktivitas konsultasi harian,
- task dan action item,
- rekomendasi konsultan,
- keputusan klien,
- issue/problem log,
- permintaan dan penugasan SDM,
- dokumen konsultasi,
- laporan harian, mingguan, dan bulanan,
- histori diskusi,
- approval,
- serta audit trail seluruh proses konsultasi.

Sistem pertama kali digunakan untuk proyek konsultasi Rumah Nara, tetapi arsitektur harus mendukung penambahan banyak proyek konsultasi lain di kemudian hari.

---

# 2. BUSINESS CONTEXT

Berdasarkan PKS, Arjuna berperan sebagai **konsultan dan vendor penyedia SDM**, sedangkan pihak klien merupakan pengambil keputusan bisnis dan operasional harian.

Ruang lingkup konsultasi mencakup:

- SOP operasional,
- kurikulum dan standar layanan,
- persiapan pembukaan dan stabilisasi,
- transfer knowledge dan supervisi,
- konsultasi, sharing, serta diskusi operasional.

Karena keputusan akhir berada di pihak klien sementara konsultan memberikan rekomendasi, sistem harus dapat membedakan secara eksplisit antara:

**Recommendation → Client Decision → Action → Implementation → Verification.**

Hal ini sesuai PKS yang menyatakan bahwa PIHAK PERTAMA memberikan masukan dan rekomendasi sebagai konsultan tetapi keputusan akhir tetap berada pada PIHAK KEDUA.

---

# 3. PRODUCT GOALS

Tujuan utama aplikasi:

1. Memastikan seluruh pekerjaan konsultasi terdokumentasi.
2. Mengetahui dengan jelas apa yang sudah, sedang, dan belum dikerjakan.
3. Memisahkan antara rekomendasi konsultan dan keputusan klien.
4. Menghindari komunikasi penting hilang di WhatsApp.
5. Memastikan setiap masalah memiliki PIC dan tindak lanjut.
6. Menghasilkan laporan konsultasi secara otomatis.
7. Membuat permintaan SDM sepenuhnya paperless.
8. Menyediakan bukti aktivitas dan output konsultasi selama periode kontrak.
9. Mengurangi potensi perbedaan persepsi mengenai scope pekerjaan.
10. Menjadi sistem yang reusable untuk proyek konsultasi Arjuna berikutnya.

---

# 4. PRODUCT PRINCIPLE

Aplikasi mengikuti prinsip:

### Everything should leave a trail.

Setiap aktivitas penting harus menghasilkan jejak digital berupa:

**Who → Did What → When → For Which Project → Result → Next Action.**

Tidak boleh ada proses penting yang hanya berubah status tanpa histori.

---

# 5. MULTI PROJECT ARCHITECTURE

Struktur utama:

```text
ARJUNA CONSULTING WORKSPACE

Organization
│
├── Project Rumah Nara
│   ├── Tim Arjuna
│   └── Tim Rumah Nara
│
├── Project Client B
│   ├── Tim Arjuna
│   └── Tim Client B
│
└── Project Client C
```

Satu user dapat tergabung pada beberapa project.

Contoh:

```text
Rahmadhita
├── Rumah Nara
├── Daycare ABC
└── Daycare XYZ
```

---

# 6. USER ROLES

## 6.1 Arjuna Super Admin

Hak akses tertinggi.

Dapat:

- membuat project,
- mengedit project,
- mengundang anggota,
- menghapus anggota,
- menentukan role,
- melihat semua project,
- mengatur kategori,
- mengatur scope,
- melihat seluruh laporan,
- mengelola dokumen,
- membuat rekomendasi,
- memberikan approval internal.

---

## 6.2 Arjuna Consultant

Dapat:

- membuat activity log,
- membuat task,
- menerima task,
- membuat recommendation,
- membuat issue,
- memberikan komentar,
- upload dokumen,
- melakukan evaluasi,
- membuat laporan,
- memproses permintaan SDM.

---

## 6.3 Client Owner / Decision Maker

Role untuk owner/pimpinan klien.

Dapat:

- melihat seluruh project miliknya,
- membuat task,
- merespons rekomendasi,
- approve/reject recommendation,
- approve biaya SDM,
- membuat issue,
- memberikan komentar,
- melihat laporan,
- upload dokumen,
- mengundang anggota internal apabila diberi izin.

Role ini penting karena PKS menempatkan pihak klien sebagai decision maker operasional.

---

## 6.4 Client Manager

Contoh:

- Kepala Daycare,
- Kepala Operasional,
- Project Manager.

Dapat menjalankan aktivitas harian tetapi approval strategis tertentu dapat dibatasi.

---

## 6.5 Team Member

Dapat:

- melihat project sesuai permission,
- mengerjakan task,
- membuat activity log,
- memberikan komentar,
- upload attachment.

Tidak dapat melakukan approval strategis kecuali diberikan permission.

---

# 7. PROJECT DASHBOARD

Dashboard merupakan halaman pertama setelah masuk ke sebuah project.

Contoh:

```text
HOUSE NARA CONSULTING PROJECT

Consulting Period
9 Sep 2026 ━━━━━━━━━━━━━━━ 8 Sep 2027

Project Progress
████████████░░░░░ 64%

TASK
24 Open
7 Overdue
38 Completed

RECOMMENDATIONS
8 Awaiting Client Decision
21 Approved
3 Rejected

ISSUES
6 Open
2 Critical
19 Resolved

ACTIVITY THIS WEEK
17 Activities

SDM
2 Active Assignment
1 New Request
```

Di bawahnya terdapat:

### Today's Focus
Task yang jatuh tempo hari tersebut.

### Awaiting My Action
Semua item yang membutuhkan respons user login.

### Latest Activities

### Open Issues

### Pending Client Decisions

### Upcoming Deadlines

### Recently Updated Documents

---

# 8. CONSULTING CATEGORY SYSTEM

Setiap:

- Activity
- Task
- Recommendation
- Issue
- Document

harus memiliki kategori.

Kategori default mengikuti ruang lingkup PKS:

### Core Consulting Categories

1. SOP & Operational Procedure
2. Curriculum & Program
3. Service Standards
4. Pre-Opening Preparation
5. Operational Stabilization
6. Training & Knowledge Transfer
7. Supervision & Evaluation
8. Operational Consultation
9. SDM / Human Resources

Kemudian dapat ditambahkan kategori operasional:

10. Facility & Equipment
11. Licensing
12. Finance
13. Marketing
14. Administration
15. Parent Relations
16. Safety & Child Protection
17. Other

Admin dapat membuat custom category.

---

# 9. SCOPE CONTROL

Ini merupakan fitur penting.

Setiap aktivitas dapat diberi salah satu flag:

```text
● IN SCOPE
● ADDITIONAL REQUEST
● OUTSIDE ORIGINAL SCOPE
```

Alasannya, beberapa aktivitas secara kontraktual berada di luar fee konsultasi.

Lampiran PKS menyatakan bahwa fee konsultasi tidak mencakup antara lain renovasi, perlengkapan, perizinan, iklan, dan biaya operasional kecuali disepakati tertulis.

Contoh:

```text
Task:
Membuat desain renovasi halaman daycare

Category:
Facility

Scope:
OUTSIDE ORIGINAL SCOPE

Requested by:
Rumah Nara

Consultant Response:
Can assist as additional consulting request.
```

Dengan fitur ini, aplikasi sekaligus berfungsi sebagai **scope creep protection**.

---

# 10. DAILY ACTIVITY LOG

Activity Log merupakan jurnal utama proyek.

Setiap aktivitas memiliki:

```text
Activity ID
Project
Date
Start Time
End Time
Duration

Activity Title

Category

Activity Type:
- Consultation
- Meeting
- Training
- Supervision
- Site Visit
- Document Preparation
- Review
- Discussion
- Evaluation
- Other

Description

Participants

Created By

Scope Status

Related Task
Related Recommendation
Related Issue

Outcome

Next Action

Attachments

Photos

Comments
```

Contoh:

```text
14 September 2026

Training SOP Penjemputan Anak

Category:
SOP

Type:
Training

Participants:
Arjuna Consultant
Kepala Daycare
5 Teachers

Duration:
2h 15m

Outcome:
Guru telah memahami alur verifikasi penjemput.

Finding:
Belum tersedia format daftar authorized pickup person.

Next Action:
Rumah Nara membuat database authorized pickup person.

Related Task:
TASK-023
```

Durasi dicatat karena dokumen kerja sama juga menyebut bahwa durasi pendampingan harian menyesuaikan waktu yang dikomunikasikan dan disepakati para pihak.

---

# 11. TASK / ACTION ITEM

Setiap tindak lanjut harus dapat dibuat menjadi task.

Data:

```text
Task ID
Title
Description

Project
Category

Created By

Assigned To
Supporting Members

Priority:
LOW
NORMAL
HIGH
URGENT

Status:
BACKLOG
TO DO
IN PROGRESS
WAITING CLIENT
WAITING CONSULTANT
BLOCKED
DONE
CANCELLED

Start Date
Due Date
Completed Date

Scope Status

Related Activity
Related Recommendation
Related Issue

Checklist

Attachments

Comment Thread
```

---

# 12. TASK DETAIL EXAMPLE

```text
TASK-0024

Create Authorized Pickup Form

Category:
SOP

Priority:
HIGH

Assigned:
Kepala Daycare Rumah Nara

Due:
18 September

Status:
IN PROGRESS

Source:
Training SOP Penjemputan Anak

Checklist:

☑ Draft form
☐ Consultant review
☐ Final revision
☐ Staff briefing
☐ Implementation
```

---

# 13. RECOMMENDATION & DECISION MODULE

Ini menjadi salah satu modul utama.

Workflow:

```text
CONSULTANT
creates Recommendation

↓
CLIENT
reviews Recommendation

↓

APPROVE
REJECT
REQUEST REVISION
NEED DISCUSSION

↓

if APPROVED

Create Action Item

↓

Implementation

↓

Consultant Verification

↓

CLOSED
```

---

# 14. RECOMMENDATION DATA

```text
Recommendation ID

Title

Problem / Background

Consultant Analysis

Recommendation

Expected Outcome

Category

Priority

Scope Status

Attachment

Created By

Decision Required From

Decision Deadline
```

Status:

```text
DRAFT
SUBMITTED
UNDER DISCUSSION
APPROVED
REJECTED
REVISION REQUESTED
IMPLEMENTING
IMPLEMENTED
VERIFIED
CLOSED
```

---

# 15. CLIENT DECISION

Ketika klien mengambil keputusan:

```text
Decision:

APPROVED

Decision Maker:
Ryan

Date:
16 September 2026

Comment:
Setuju diterapkan mulai Senin.

Create Action Item:
YES
```

Sistem otomatis membuat histori.

```text
14 Sep
Recommendation submitted

15 Sep
Client opened recommendation

16 Sep
Client approved

16 Sep
TASK-034 automatically created
```

---

# 16. ISSUE / PROBLEM LOG

Issue Log dipakai untuk masalah operasional.

Contoh issue:

```text
ISSUE-019

Teacher Arrival Delay

Category:
SDM

Severity:
MEDIUM

Reported:
15 September

Reported By:
Kepala Daycare

Problem:
Dua guru datang lebih dari 20 menit terlambat.

Impact:
Morning preparation disrupted.

Consultant Analysis:
Shift preparation needs clearer responsibility.

Recommendation:
Introduce morning readiness checklist.

Assigned:
Head of Daycare
```

Status:

```text
OPEN
INVESTIGATING
ACTION REQUIRED
MONITORING
RESOLVED
CLOSED
```

Severity:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

---

# 17. ISSUE ESCALATION

Jika issue:

```text
CRITICAL
```

dashboard harus menampilkan alert.

Contoh:

```text
⚠ CRITICAL ISSUE

Child Safety Procedure Violation

Opened 2 hours ago

Awaiting Client Action
```

---

# 18. SDM REQUEST MODULE

Permintaan tambahan SDM dilakukan sepenuhnya melalui aplikasi.

Hal ini menggantikan form kertas.

Lampiran penugasan SDM mensyaratkan permintaan memuat posisi, jumlah personel, tanggal mulai, jadwal kerja, durasi, rincian tugas, dan lokasi.

Form:

```text
NEW SDM REQUEST

Requested By
Project

Position

Number of Personnel

Requested Start Date

Duration

Work Schedule

Job Description

Location

Reason for Request

Additional Notes
```

---

# 19. SDM WORKFLOW

```text
CLIENT

Create SDM Request

↓

SUBMITTED

↓

ARJUNA REVIEW

↓

ARJUNA PROPOSES:

Personnel
Schedule
Cost

↓

CLIENT REVIEW

↓

APPROVED / REJECTED

↓

ARJUNA ASSIGNMENT

↓

ACTIVE

↓

COMPLETED
```

Alur ini mengikuti mekanisme pada lampiran:

**permintaan SDM → penawaran personel dan biaya → persetujuan → tagihan → pembayaran → pembayaran gaji oleh Arjuna.**

---

# 20. SDM REQUEST STATUS

```text
DRAFT
SUBMITTED
UNDER REVIEW
PROPOSAL SENT
AWAITING APPROVAL
APPROVED
REJECTED
ASSIGNED
ACTIVE
COMPLETED
CANCELLED
```

---

# 21. SDM COST APPROVAL

Proposal Arjuna:

```text
Requested:
1 Teacher

Proposed Personnel:
Teacher A

Schedule:
Mon-Fri
07:00-16:00

Monthly Cost:
Rp X.XXX.XXX

Additional Cost:
Rp XXX.XXX

TOTAL
Rp X.XXX.XXX
```

Client:

```text
[ APPROVE ]
[ REJECT ]
[ DISCUSS ]
```

Setelah approval, record tidak boleh diubah diam-diam.

Perubahan harus menghasilkan revision history.

---

# 22. DOCUMENT CENTER

Semua dokumen konsultasi disimpan di dalam project.

Contoh folder:

```text
Documents

├── SOP
├── Curriculum
├── Training Materials
├── Evaluation
├── SDM
├── Meeting Notes
├── Reports
└── Other
```

Lampiran output konsultasi sendiri menyebut beberapa jenis output seperti SOP operasional, kurikulum/program kegiatan, pembagian tugas, materi pelatihan dan catatan evaluasi.

---

# 23. DOCUMENT VERSIONING

Contoh:

```text
SOP Penjemputan Anak

Version 1
10 Sep
Uploaded by Arjuna

Version 2
14 Sep
Revision requested by Rumah Nara

Version 3
16 Sep
Approved
```

Status:

```text
DRAFT
UNDER REVIEW
REVISION REQUIRED
APPROVED
ARCHIVED
```

Jangan overwrite file lama.

Setiap revisi membuat versi baru.

---

# 24. DOCUMENT RELATIONSHIP

Dokumen dapat dikaitkan dengan:

```text
Activity
Task
Recommendation
Issue
SDM Request
Report
```

Contoh:

```text
SOP PENJEMPUTAN ANAK V3

Related Recommendation:
REC-014

Related Task:
TASK-023

Related Training:
ACT-087
```

---

# 25. PROJECT TIMELINE

Semua kejadian penting ditampilkan secara kronologis.

Contoh:

```text
16 SEP
Recommendation REC-003 approved

15 SEP
Issue ISSUE-009 created

14 SEP
Training SOP completed

13 SEP
Document SOP-v2 uploaded

12 SEP
TASK-021 completed
```

---

# 26. DAILY REPORT

Daily Report dapat dihasilkan otomatis berdasarkan activity log.

Struktur:

```text
DAILY CONSULTING REPORT
15 September 2026

Activities
6

Tasks Completed
3

New Issues
1

Recommendations Submitted
2

Client Decisions
1

Activities:

09:00
SOP Review

11:00
Teacher Training

13:30
Operational Discussion

Key Findings:
...

Recommendations:
...

Open Issues:
...

Next Actions:
...
```

User dapat menambahkan executive note sebelum report difinalisasi.

---

# 27. WEEKLY REPORT

Weekly Report harus memberi gambaran progress.

```text
WEEKLY CONSULTING REPORT

Period:
14–20 September

Activities
24

Completed Tasks
17

Open Tasks
8

Overdue
2

Recommendations
7

Approved
5

Awaiting Decision
2

Issues Opened
4

Issues Resolved
6
```

Bagian naratif:

```text
Key Achievements

Current Challenges

Consultant Observations

Client Decisions Needed

Priority Next Week
```

---

# 28. MONTHLY REPORT

Monthly report lebih bersifat executive summary.

Menampilkan:

```text
Monthly Project Health

Overall Progress

Consulting Activities

Task Completion Rate

Recommendations

Decision Response

Issues

Training Activities

Documents Produced

SDM Utilization

Major Achievements

Outstanding Problems

Consultant Assessment

Priorities Next Month
```

---

# 29. PROJECT HEALTH SCORE

Dashboard dapat menampilkan:

```text
PROJECT HEALTH

GREEN
Healthy

YELLOW
Needs Attention

RED
Critical
```

Score dihitung dari:

- overdue task,
- unresolved critical issues,
- recommendations awaiting decision,
- implementation progress,
- milestone progress.

Score hanya indikator management, bukan klausul kontrak.

---

# 30. REPORT ARCHIVE

Setelah report difinalisasi:

```text
FINALIZED
```

Report menjadi read-only.

Jika perlu perubahan:

```text
Revision 2
```

dibuat.

---

# 31. COMMENT & DISCUSSION

Semua object utama memiliki comment thread.

Contoh:

```text
Rahmadhita
10:32

Menurut kami SOP ini perlu diterapkan
sebelum penerimaan siswa batch berikutnya.

Ryan
10:47

Setuju. Target implementasi Senin.

SYSTEM
10:48

Recommendation approved.
TASK-041 created.
```

---

# 32. @MENTION

Support:

```text
@Ryan
@KepalaDaycare
@Rahmadhita
```

Mention menghasilkan notification.

---

# 33. NOTIFICATION CENTER

Contoh:

```text
3 New Notifications

Ryan approved REC-021

TASK-019 is due tomorrow

New comment on ISSUE-004
```

Jenis notification:

- assigned task,
- task due,
- task overdue,
- recommendation submitted,
- recommendation decision,
- issue assigned,
- critical issue,
- SDM approval needed,
- document revision,
- mention.

---

# 34. "MY WORK" PAGE

Setiap user memiliki halaman:

```text
MY WORK

Assigned to Me

Awaiting My Decision

Overdue

Due Today

Due This Week

My Open Issues

Recently Mentioned
```

---

# 35. CONSULTING PROJECT PHASE

Project dapat dibagi ke fase:

```text
1. Initial Assessment
2. Preparation
3. Pre-Opening
4. Opening
5. Stabilization
6. Operational Improvement
7. Knowledge Transfer
8. Final Evaluation
```

Task, activity, issue dan recommendation dapat dikaitkan ke fase.

---

# 36. MILESTONE

Contoh:

```text
Milestone

SOP Core Completed
Target: 30 September

Teacher Training Completed
Target: 5 October

Soft Opening
Target: 15 October

Operational Stabilization
Target: 15 November
```

---

# 37. PROJECT PROGRESS

Progress dihitung terutama berdasarkan milestone dan task.

Contoh:

```text
Preparation
████████████████ 100%

Pre-Opening
████████████░░░░ 75%

Stabilization
██████░░░░░░░░░░ 35%
```

---

# 38. TEAM MANAGEMENT

Project Admin dapat:

```text
Invite Member

Name
Email

Organization:
Arjuna
Rumah Nara

Role

Project Access
```

Invitation dikirim melalui link.

---

# 39. ORGANIZATION STRUCTURE

Database harus membedakan:

```text
Organization

Yayasan Arjuna Cendekia

CV Santara Artha
```

dan:

```text
Project

Rumah Nara Islamic Child Center
```

Karena satu organisasi dapat memiliki beberapa project.

---

# 40. PROJECT NAME CONFIGURATION

Dokumen yang diberikan menggunakan istilah **Ruang Nara** pada beberapa bagian dan **Rumah Nara** pada bagian lainnya.

Karena itu sistem jangan hardcode nama.

Gunakan:

```text
project_display_name
legal_project_name
client_organization
```

Sehingga perubahan nama project tidak mempengaruhi struktur database.

---

# 41. GLOBAL PROJECT SEARCH

Search:

```text
Search anything...

SOP Penjemputan
```

Result:

```text
2 Documents
3 Tasks
1 Recommendation
4 Activities
```

---

# 42. FILTER SYSTEM

Semua list mendukung filter:

```text
Project
Date
Category
Status
PIC
Priority
Created By
Scope
Phase
```

---

# 43. AUDIT LOG

Setiap perubahan penting dicatat.

Contoh:

```text
16 Sep 10:42

Ryan changed:

Recommendation REC-002

FROM:
UNDER DISCUSSION

TO:
APPROVED
```

Audit log tidak boleh dihapus user biasa.

---

# 44. ACTIVITY FEED

Contoh:

```text
TODAY

10:45
Ryan approved recommendation REC-019

10:20
Rahmadhita uploaded SOP Penjemputan V3

09:50
Kepala Daycare completed TASK-022

09:10
New ISSUE-019 reported
```

---

# 45. DATA MODEL

Core entities:

```text
User
Organization
OrganizationMember

Project
ProjectMember

Category
ProjectPhase
Milestone

ActivityLog

Task
TaskChecklist
TaskComment

Recommendation
RecommendationDecision

Issue

SDMRequest
SDMProposal
SDMAssignment

Document
DocumentVersion

Report

Comment
Attachment

Notification

AuditLog
```

---

# 46. KEY RELATIONSHIP

```text
Organization
    ↓
Project
    ↓
┌─────────────┬──────────────┐
Activity      Task           Issue
                  ↑
           Recommendation
                  ↓
              Decision
```

---

# 47. SUGGESTED DATABASE STRUCTURE

Example:

```text
users
- id
- name
- email
- password_hash
- avatar
- created_at

organizations
- id
- name
- type

organization_members
- user_id
- organization_id
- role

projects
- id
- client_organization_id
- consultant_organization_id
- display_name
- legal_name
- start_date
- end_date
- status

project_members
- project_id
- user_id
- role

categories
- id
- project_id
- name

activities
- id
- project_id
- category_id
- title
- description
- activity_type
- activity_date
- start_time
- end_time
- outcome
- next_action
- scope_status
- created_by

tasks
- id
- project_id
- category_id
- title
- description
- priority
- status
- assigned_to
- due_date
- scope_status

recommendations
- id
- project_id
- title
- background
- analysis
- recommendation
- expected_outcome
- priority
- status
- decision_required_from
- decision_deadline

recommendation_decisions
- recommendation_id
- decision
- decision_by
- decision_at
- comment

issues
- id
- project_id
- title
- problem
- impact
- severity
- status
- assigned_to

sdm_requests
- id
- project_id
- position
- personnel_count
- start_date
- duration
- schedule
- duties
- location
- status

documents
- id
- project_id
- title
- category_id
- status

document_versions
- id
- document_id
- version
- file_path
- uploaded_by
- created_at
```

---

# 48. FILE STORAGE — NO PAID DATABASE REQUIREMENT

Requirement:

**Tidak menggunakan database SaaS berbayar seperti Supabase sebagai dependency utama.**

Recommended architecture untuk MVP:

```text
Application
Next.js

Database
SQLite

ORM
Prisma / equivalent

File Storage
Local persistent storage

Deployment
Docker on VPS

Backup
Automated scheduled backup
```

Struktur:

```text
/app
/data
   database.sqlite

/uploads
   /projects
      /project-id
          /documents
          /activities
          /issues
          /reports
```

Database dan upload berada pada persistent volume.

---

# 49. WHY SQLITE FOR MVP

Untuk aplikasi konsultasi dengan user relatif terbatas per project, SQLite cukup sederhana dan menghilangkan kebutuhan database cloud berbayar.

Keuntungan:

- tidak membutuhkan database server tersendiri,
- tidak membutuhkan Supabase,
- mudah di-backup,
- portable,
- cocok untuk MVP,
- mudah dikembangkan lokal.

Arsitektur tetap harus dibuat sehingga database dapat dimigrasikan ke PostgreSQL self-hosted apabila aplikasi berkembang jauh lebih besar.

---

# 50. FILE STORAGE ABSTRACTION

Jangan menulis logic upload langsung secara tersebar.

Buat interface:

```text
StorageService
```

dengan implementasi awal:

```text
LocalStorageService
```

Sehingga kemudian dapat diganti dengan:

```text
S3 Storage
MinIO
Cloudflare R2
atau storage lain
```

tanpa mengubah business logic.

---

# 51. BACKUP

Minimum:

```text
Daily SQLite backup

Daily uploads backup

Retention:
7 daily
4 weekly
6 monthly
```

Admin harus dapat melihat:

```text
Last Successful Backup
```

---

# 52. AUTHENTICATION

MVP:

```text
Email
Password
Invitation Link
```

Flow:

```text
Admin invites user

↓

User receives invitation link

↓

Create Password

↓

Join Project
```

Optional future:

```text
Google Login
WhatsApp OTP
2FA
```

---

# 53. PROJECT PERMISSION

User hanya boleh mengakses project dimana dia menjadi member.

URL:

```text
/projects/{projectId}
```

Backend wajib memvalidasi membership.

Jangan hanya menyembunyikan menu di frontend.

---

# 54. DASHBOARD NAVIGATION

Desktop:

```text
ARJUNA CONSULTING

Overview

My Work

Activities

Tasks

Recommendations

Issues

SDM Requests

Documents

Reports

Timeline

Team

Project Settings
```

---

# 55. MOBILE RESPONSIVENESS

Aplikasi harus nyaman digunakan dari smartphone karena aktivitas konsultasi banyak dilakukan di lapangan.

Mobile actions utama:

```text
+ Activity
+ Task
+ Issue
+ Recommendation
+ SDM Request
```

harus dapat dilakukan maksimal dalam beberapa tap.

---

# 56. GLOBAL QUICK CREATE

Floating button:

```text
+
```

klik:

```text
New Activity
New Task
New Recommendation
New Issue
New SDM Request
Upload Document
```

---

# 57. DAILY CONSULTANT WORKFLOW

Contoh penggunaan:

```text
08:30
Consultant arrives

↓

Creates Activity
"Morning operational observation"

↓

Finds problem

↓

Creates ISSUE

↓

Writes recommendation

↓

Client receives notification

↓

Client approves recommendation

↓

System creates task

↓

Client team implements

↓

Consultant verifies

↓

Issue closed
```

Semua menjadi satu chain.

---

# 58. RELATIONSHIP CHAIN

Sistem harus dapat menampilkan:

```text
ACTIVITY-033

↓

ISSUE-018

↓

REC-019

↓

CLIENT DECISION

↓

TASK-041

↓

IMPLEMENTATION

↓

VERIFICATION

↓

CLOSED
```

Ini salah satu fitur paling penting dalam aplikasi.

---

# 59. REPORT GENERATION LOGIC

Report tidak perlu diinput ulang.

Daily, Weekly dan Monthly Report harus menarik data dari:

```text
Activity Log
Tasks
Recommendations
Decisions
Issues
SDM Requests
Documents
Milestones
```

Consultant hanya menambahkan:

```text
Executive Summary

Key Observation

Consultant Notes

Next Priority
```

---

# 60. REPORT EXPORT

Future/MVP+:

```text
Export PDF
```

Report harus memiliki:

```text
Project Name
Period
Generated By
Generated Date
Version
```

---

# 61. CONSULTANT OUTPUT REGISTER

Sediakan menu khusus:

```text
Consulting Outputs
```

Misalnya:

```text
SOP Operational
✓ Delivered
✓ Reviewed
✓ Approved

Curriculum
✓ Delivered
○ Review

Training Materials
✓ Delivered

Evaluation Notes
✓ Delivered
```

Ini membantu mendokumentasikan serah terima output sebagaimana Lampiran 5.

---

# 62. PROJECT COMPLETION PAGE

Pada akhir masa konsultasi:

```text
PROJECT COMPLETION

Contract Period
100%

Activities
421

Consulting Hours
672h

Tasks Completed
286

Recommendations
98

Implemented
81

Documents Produced
42

Training Sessions
27

Issues Resolved
74
```

Kemudian:

```text
Final Consultant Report

Outstanding Issues

Outstanding Recommendations

Output Checklist

Handover Documents
```

---

# 63. MVP SCOPE

Version 1 harus fokus pada:

### Must Have

- Authentication
- Organization
- Project
- Team Member
- Role / permission
- Dashboard
- Category
- Activity Log
- Task
- Recommendation
- Client Decision
- Issue Log
- SDM Request
- SDM Approval
- Document upload
- Document version
- Daily report
- Weekly report
- Monthly report
- Comments
- Notifications
- Audit log
- Project timeline
- Search & filter

---

# 64. PHASE 2

Setelah MVP stabil:

- WhatsApp notification
- Email notification
- PDF report generator
- calendar integration
- recurring tasks
- analytics
- consulting hours analysis
- project health automation
- AI report summarization
- AI meeting minutes
- AI recommendation drafting
- voice-to-activity log.

---

# 65. FEATURES NOT INCLUDED

Aplikasi ini **bukan daycare management system**.

Tidak perlu membangun:

- attendance anak,
- parent mobile application,
- tuition billing anak,
- child progress report,
- CCTV,
- meal tracking,
- student enrollment.

Jika kemudian diperlukan, dibuat sebagai product terpisah atau module lain.

---

# 66. HOME PAGE — MULTI PROJECT

Setelah login Arjuna:

```text
GOOD MORNING

Consulting Portfolio

────────────────────────

Rumah Nara
Project Health: GREEN
Progress 42%

5 Tasks Need Attention
2 Client Decisions Pending

────────────────────────

Daycare ABC
Project Health: YELLOW
Progress 67%

3 Overdue Tasks

────────────────────────

+ NEW PROJECT
```

---

# 67. CLIENT HOME

Client hanya melihat project miliknya.

Contoh:

```text
RUMAH NARA

Today

3 Tasks Assigned to Your Team

2 Recommendations Need Decision

1 Issue Requires Attention

Upcoming:

Teacher Training
18 Sep · 09:00

Recent Consultant Activity:

SOP Review
16 Sep

Classroom Observation
15 Sep
```

---

# 68. UX PRINCIPLE

Aplikasi harus terasa lebih dekat dengan:

```text
Linear
+
Notion
+
simple consulting dashboard
```

daripada ERP yang kompleks.

Interface:

- clean,
- minimal,
- fast,
- card-based,
- responsive,
- sedikit form field yang tidak diperlukan.

---

# 69. COLOR STATUS

Gunakan semantic colors:

```text
Green
Completed / Approved

Yellow
Waiting / Attention

Red
Critical / Overdue

Gray
Draft / Inactive

Blue
In Progress
```

---

# 70. IMPORTANT SYSTEM RULES

1. Approval tidak boleh dihapus.
2. Decision harus memiliki timestamp.
3. History tidak boleh hilang ketika status berubah.
4. Version dokumen lama tidak boleh ditimpa.
5. User hanya melihat project sesuai membership.
6. Task harus memiliki creator.
7. Recommendation harus memiliki consultant author.
8. Client decision harus memiliki decision maker.
9. Audit log wajib untuk perubahan penting.
10. Data antar-project tidak boleh tercampur.

---

# 71. KEY KPI

Dashboard portfolio Arjuna:

```text
Active Projects

Activities This Month

Consulting Hours

Task Completion %

Overdue Tasks

Open Critical Issues

Recommendations Awaiting Decision

Average Client Decision Time

Recommendation Implementation %

SDM Active Assignments
```

---

# 72. CONSULTING EFFECTIVENESS KPI

Sistem dapat menghitung:

```text
Recommendation Acceptance Rate

Recommendations:
100

Approved:
82

Acceptance:
82%
```

dan:

```text
Implementation Rate

Approved:
82

Implemented:
67

Implementation:
81.7%
```

Ini akan menjadi data yang sangat berguna bagi Arjuna untuk mengevaluasi efektivitas konsultasi.

---

# 73. DECISION RESPONSE KPI

Contoh:

```text
Average Client Decision Time

2.4 days
```

Berguna untuk mengetahui apakah project terhambat pada konsultan atau pada decision making klien.

---

# 74. PROJECT BOTTLENECK

Dashboard dapat menampilkan:

```text
PROJECT BOTTLENECK

Client Decision
8 items

Consultant Review
3 items

Implementation
11 items
```

Sehingga kedua pihak dapat melihat sumber keterlambatan secara objektif.

---

# 75. SUCCESS CRITERIA

MVP dianggap berhasil apabila:

- hampir seluruh aktivitas konsultasi dapat dicatat melalui aplikasi;
- semua recommendation strategis memiliki keputusan tercatat;
- semua action item memiliki PIC dan status;
- semua masalah penting masuk Issue Log;
- permintaan SDM dilakukan melalui aplikasi;
- laporan harian/mingguan/bulanan dapat dibuat tanpa rekap manual;
- dokumen konsultasi memiliki histori versi;
- Arjuna dan klien dapat mengetahui kondisi project dalam kurang dari satu menit dari dashboard.

---

# 76. CORE PRODUCT PHILOSOPHY

Arjuna Consulting Workspace bukan hanya task management.

Produk harus menjawab lima pertanyaan setiap saat:

```text
1. Apa yang sudah dilakukan?

2. Apa masalah yang ditemukan?

3. Apa rekomendasi konsultan?

4. Apa keputusan klien?

5. Apa yang harus dilakukan berikutnya?
```

Jika lima pertanyaan ini bisa dijawab dari dashboard dan timeline, berarti sistem bekerja dengan benar.

---

# 77. MVP IMPLEMENTATION PRIORITY

Urutan development yang direkomendasikan:

```text
PHASE A
Foundation

Auth
Organization
Project
Team
Role

↓

PHASE B
Core Consulting

Activity
Task
Category

↓

PHASE C
Decision System

Recommendation
Client Decision
Issue

↓

PHASE D
Operations

SDM Request
Document Center

↓

PHASE E
Monitoring

Dashboard
Timeline
Notification

↓

PHASE F
Reporting

Daily
Weekly
Monthly
```

---

# 78. FINAL PRODUCT VISION

Dalam kondisi ideal, komunikasi seperti:

> “Kemarin apa saja yang dilakukan konsultan?”

atau:

> “Rekomendasi yang belum saya approve apa saja?”

atau:

> “Siapa yang belum menyelesaikan task?”

atau:

> “Problem operasional bulan ini apa saja?”

atau:

> “Apa saja output konsultasi yang sudah diterima?”

tidak perlu lagi dicari melalui chat WhatsApp.

Semua tersedia dalam satu dashboard dengan histori yang jelas.

**Arjuna Consulting Workspace menjadi digital record seluruh perjalanan konsultasi dari awal hingga handover.**