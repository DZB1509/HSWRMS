# HSWRMS AUDIT SOURCE INVENTORY & EVIDENCE MANIFEST

## 1. Inventory Overview

This inventory catalogs all original audit deliverables, planning source documents, git merge logs, and baseline artifacts used during the evidence reconciliation process. Every original file has been hashed with SHA-256 and kept strictly immutable.

| File ID | Relative Path | Type | Size (Bytes) | Lines/Sheets | Authority Level | SHA-256 (First 16 chars) |
|:---|:---|:---|:---:|:---:|:---|:---|
| SRC-01 | `06_Reports/audit-output/01_Executive_Summary.csv` | Audit CSV | 3998 | 17 | DERIVED_AUDIT_EVIDENCE | `7b6cfc7927dfb9da...` |
| SRC-02 | `06_Reports/audit-output/02_Member_Summary.csv` | Audit CSV | 5270 | 9 | DERIVED_AUDIT_EVIDENCE | `45e068882c4cae90...` |
| SRC-03 | `06_Reports/audit-output/03_Contribution_Log.csv` | Audit CSV | 15285 | 46 | DERIVED_AUDIT_EVIDENCE | `9aafd197a99821df...` |
| SRC-04 | `06_Reports/audit-output/04_Module_Completeness.csv` | Audit CSV | 15447 | 51 | DERIVED_AUDIT_EVIDENCE | `7f7376ade6962276...` |
| SRC-05 | `06_Reports/audit-output/05_Branch_Integration.csv` | Audit CSV | 3708 | 10 | DERIVED_AUDIT_EVIDENCE | `2200a0f0e0d14396...` |
| SRC-06 | `06_Reports/audit-output/06_Test_Evidence.csv` | Audit CSV | 3623 | 14 | DERIVED_AUDIT_EVIDENCE | `f348d52a67567f16...` |
| SRC-07 | `06_Reports/audit-output/07_Gap_Register.csv` | Audit CSV | 3898 | 10 | DERIVED_AUDIT_EVIDENCE | `274b1db692c15b72...` |
| SRC-08 | `06_Reports/audit-output/08_Action_Plan.csv` | Audit CSV | 2488 | 10 | DERIVED_AUDIT_EVIDENCE | `5acb9d4473e25633...` |
| SRC-09 | `06_Reports/audit-output/09_Evidence_Index.csv` | Audit CSV | 8457 | 35 | DERIVED_AUDIT_EVIDENCE | `3bc61b1ce9e36750...` |
| SRC-10 | `06_Reports/audit-output/10_Identity_Mapping.csv` | Audit CSV | 1899 | 9 | DERIVED_AUDIT_EVIDENCE | `984b0caf8679ddd5...` |
| SRC-11 | `06_Reports/audit-output/HSWRMS_BAO_CAO_TONG_KET_DU_AN.md` | Audit Report | 51685 | 254 | DERIVED_AUDIT_EVIDENCE | `9eb5c14406e0748b...` |
| SRC-12 | `06_Reports/audit-output/HSWRMS_DANH_GIA_DONG_GOP_THANH_VIEN.xlsx` | Audit Workbook | 49203 | 11 sheets (Tong_Quan, Thanh_Vien, Dong_Gop_Chi_Tiet...) | DERIVED_AUDIT_EVIDENCE | `3a4a18034fbabe29...` |
| SRC-13 | `06_Reports/audit-output/TIN_NHAN_ZALO_TONG_KET_HSWRMS.md` | Audit Summary | 10499 | 114 | DERIVED_AUDIT_EVIDENCE | `f8c6242d273b5534...` |
| SRC-14 | `06_Reports/audit-output/HSWRMS_FULL_TEAM_AUDIT_REPORT.md` | Audit Report | 33562 | 354 | DERIVED_AUDIT_EVIDENCE | `f8531a02175b6acf...` |
| SRC-15 | `06_Reports/audit-output/AUDIT_CHECKPOINT_TRACKER.md` | Audit Tracking | 2670 | 24 | DERIVED_AUDIT_EVIDENCE | `4e3daacdaf72c38b...` |
| SRC-16 | `01_Planning/Task_Project_G1_IS2005.xlsx` | Planning Workbook | 94227 | 2 sheets (Official Plan, Đánh giá thành viên...) | AUTHORITATIVE_PLAN | `89befc8e6187ff07...` |
| SRC-17 | `01_Planning/Task_Project_G1_IS2005.csv` | Planning CSV | 27531 | 186 | AUTHORITATIVE_PLAN | `70edc787065854e5...` |
| SRC-18 | `06_Reports/PHASE_5.8.3.117-5.8.3.118_FULL_TEAM_MERGE_HISTORY.txt` | Merge History | 57084 | 878 | PRIMARY_GIT_LOG | `369c5988f80535f7...` |

## 2. Evidence Hierarchy & Classification Rules

1. **Authoritative Planning Source (`AUTHORITATIVE_PLAN`):**
   - `01_Planning/Task_Project_G1_IS2005.xlsx`: Primary source for official student roster, full names, and official Student IDs (MSSV) in sheet `Đánh giá thành viên`. Official baseline for assigned tasks and complexities in sheet `Official Plan`.
2. **Primary Git & Build Logs (`PRIMARY_GIT_LOG`):**
   - `06_Reports/PHASE_5.8.3.117-5.8.3.118_FULL_TEAM_MERGE_HISTORY.txt`: Primary evidence for integration merges, conflict resolutions, and the execution logs of 536 backend tests.
3. **Derived Audit Evidence (`DERIVED_AUDIT_EVIDENCE`):**
   - Original 10 CSVs and markdown reports in `06_Reports/audit-output/`. Subject to audit reconciliation, conservative confidence adjustments, and cross-file harmonization.

## 3. Immutability Verification

All files listed in this manifest remain completely untouched in their original locations. Any corrections, reconciliations, and recalculated spreadsheets are emitted with new, versioned file identifiers (`_RECONCILED`, `_REVISED`).
