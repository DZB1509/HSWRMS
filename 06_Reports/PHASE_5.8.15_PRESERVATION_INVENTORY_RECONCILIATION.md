# Phase 5.8.15 — Preservation Inventory Reconciliation

Date: 2026-11-01  
Repository: `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`

## Conclusion

The reported decrease from 158 to 35 did **not** represent 123 missing files. It compared an untracked leaf-file count with Git's default short-status entry count, which collapses untracked directories. The Phase 5.8.13 inventory had 157 Appendix B leaf files; its report was created after that list, making the end-of-phase count 158. All 158 paths are still present. Phase 5.8.14 added one report; this Phase 5.8.15 report adds another. The current untracked leaf count after this report is therefore 160.

The current worktree and both stashes account for the inventoried paths. Content differences from stash snapshots are identified below and attributable to later authorized work. No project file was moved, renamed, or deleted in this reconciliation. The previous report did not record the recovery snapshot's object ID, so its exact intended identity cannot be proved; a repository-internal checkpoint tree at the Phase 5.8.13 timestamp has the exact expected path set and is retained.

## Exact current Git state

- Repository root: `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`
- Branch: `feature/hswrms-m1-m6-integration`
- HEAD: `ab1d2451d6d2500dfd4065b4c14c1f53eef37871` (expected `ab1d2451d6d2500dfd4065b4c14c1f53eef37871`)
- Modified tracked paths: 77
- Total porcelain status entries after report creation: 113
- Untracked leaf paths after adding this report: 160
- Staged paths: 0
- Deleted paths: 0
- Conflicted paths: 0
- Ahead/behind reported by Git at inspection: `isp-origin/feature/hswrms-m1-m6-integration`, ahead 1, behind 0.

`git status --short` before this report showed 77 modified tracked paths and 35 untracked status entries. Those 35 entries were not 35 leaf files. `git ls-files --others --exclude-standard` expanded them to 159 leaf paths; after creating this report, it is 160. The exact status lists are in Appendices A–C.

### Why the count difference was 123

- Phase 5.8.13 Appendix B enumerates 157 files. The Phase 5.8.13 report itself was added after that appendix, so the complete prior untracked inventory was 158.
- At the end of Phase 5.8.14, those 158 files were still present, plus `PHASE_5.8.14_IMPLEMENTATION_GAP_CLOSURE_REPORT.md`: 159 leaf files.
- Default porcelain status represented those 159 files as 35 entries by collapsing directories. Thus `158 - 35 = 123` was a comparison of unlike units. There were zero old paths absent; leaf inventory grew by one.
- At the end of this phase, the 35 status entries become 36 after adding this report. The leaf count is 160. There are no missing paths.

## Required three-way inventory lists

### 1. Present before and still present

All 158 prior paths are present in the current untracked leaf inventory:

- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/ImmediateSpaAcceptedScheduleOutboxDispatcher.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/SpaAcceptedScheduleOutboxDispatcher.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/config/SchedulingConfigTest.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m1identity/service/OtpIssuanceConcurrencyTest.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaBookingValidationTests.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaTestIsolationIntegrationTest.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/TestProfileSpaAcceptedScheduleOutboxDispatcher.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/TestProfileSpaCalendarAdapter.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/TestProfileSpaNotificationAdapter.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m5billing/config/M5DataInitializerCustomerBFixtureTest.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/security/JwtAuthenticationFilterTest.java`
- `05_Development/database/generated/HSWRMS_TEST_schema_continuation.sql`
- `05_Development/database/generated/HSWRMS_TEST_schema.sql`
- `05_Development/frontend/src/context/governanceAuthorization.test.ts`
- `05_Development/frontend/src/context/governanceAuthorization.ts`
- `05_Development/frontend/src/pages/admin/FeatureFlagsPage.tsx`
- `05_Development/frontend/src/utils/customerPrivateStorage.test.ts`
- `05_Development/frontend/src/utils/customerPrivateStorage.ts`
- `05_Development/frontend/src/utils/identityScopedState.test.ts`
- `05_Development/frontend/src/utils/identityScopedState.ts`
- `06_Reports/audit-output/backup_targeted_correction_20261029/01_Task_Assignment_Reconciliation.csv`
- `06_Reports/audit-output/backup_targeted_correction_20261029/05_Test_Evidence_Reconciliation.csv`
- `06_Reports/audit-output/backup_targeted_correction_20261029/06_Test_Evidence_RECONCILED.csv`
- `06_Reports/audit-output/backup_targeted_correction_20261029/Correction_Log.csv`
- `06_Reports/audit-output/backup_targeted_correction_20261029/HSWRMS_BAO_CAO_TONG_KET_DU_AN_RECONCILED.md`
- `06_Reports/audit-output/backup_targeted_correction_20261029/HSWRMS_DANH_GIA_DONG_GOP_THANH_VIEN_RECONCILED.xlsx`
- `06_Reports/audit-output/backup_targeted_correction_20261029/TIN_NHAN_ZALO_TONG_KET_HSWRMS_REVISED.md`
- `06_Reports/PHASE_1.3A_REPOSITORY_MIGRATION_AUDIT_REPORT.md`
- `06_Reports/PHASE_1.3B_LIVE_SQLSERVER_READINESS_ASSESSMENT.md`
- `06_Reports/PHASE_1.3C_DBA_READ_ONLY_METADATA_COLLECTION_GUIDE.md`
- `06_Reports/PHASE_1.3C_DBA_READ_ONLY_METADATA_COLLECTION.sql`
- `06_Reports/PHASE_1.3C_MIGRATION_CONSOLIDATION_AND_DEPLOYMENT_DESIGN.md`
- `06_Reports/PHASE_1.3C-2A_DBA_BUSINESS_EVIDENCE_READINESS.md`
- `06_Reports/PHASE_5.8.11_SAFE_GITLAB_INTEGRATION_ASSESSMENT.md`
- `06_Reports/PHASE_5.8.12_CONTROLLED_GITLAB_MERGE_REPORT.md`
- `06_Reports/SQL_SERVER_CONNECTIVITY_BASELINE_REPORT.md`
- `06_Reports/SQL_SERVER_SCHEMA_COMPATIBILITY_ASSESSMENT.md`
- `06_Reports/visual-evidence/01_landing_hero.png`
- `06_Reports/visual-evidence/02_pillars_sticky_story.png`
- `06_Reports/visual-evidence/03_experiences_sticky_story.png`
- `06_Reports/visual-evidence/04_image_reveal_rounded.png`
- `06_Reports/visual-evidence/05_receptionist_dashboard.png`
- `06_Reports/visual-evidence/06_receptionist_arrivals.png`
- `06_Reports/visual-evidence/07_therapist_schedule.png`
- `06_Reports/visual-evidence/08_admin_staff.png`
- `06_Reports/visual-evidence/celestial_logo_scrolled_light_canvas.png`
- `06_Reports/visual-evidence/celestial_logo_win_off_hero.png`
- `06_Reports/visual-evidence/celestial_logo_win_on_hero.png`
- `06_Reports/visual-evidence/chrome_940px_storytelling.png`
- `06_Reports/visual-evidence/debug_experiences_390.png`
- `06_Reports/visual-evidence/debug_pillars_390.png`
- `06_Reports/visual-evidence/desktop_1024px_storytelling.png`
- `06_Reports/visual-evidence/desktop_1440px_storytelling.png`
- `06_Reports/visual-evidence/desktop_default_reduce_cta_hover.png`
- `06_Reports/visual-evidence/desktop_default_reduce_experiences_2col.png`
- `06_Reports/visual-evidence/desktop_default_reduce_hero.png`
- `06_Reports/visual-evidence/desktop_default_reduce_pillars_2col.png`
- `06_Reports/visual-evidence/desktop_nopref_experiences_2col.png`
- `06_Reports/visual-evidence/desktop_nopref_pillars_2col.png`
- `06_Reports/visual-evidence/dining_card_hover_win_off.png`
- `06_Reports/visual-evidence/dining_card_hover_win_on.png`
- `06_Reports/visual-evidence/experiences_dining_hash.png`
- `06_Reports/visual-evidence/experiences_spa_hash.png`
- `06_Reports/visual-evidence/experiences_storytelling_1280px.png`
- `06_Reports/visual-evidence/experiences_storytelling_1440px.png`
- `06_Reports/visual-evidence/experiences_storytelling_390px.png`
- `06_Reports/visual-evidence/experiences_storytelling_540px.png`
- `06_Reports/visual-evidence/experiences_storytelling_820px.png`
- `06_Reports/visual-evidence/experiences_storytelling_900px.png`
- `06_Reports/visual-evidence/experiences_storytelling_940px.png`
- `06_Reports/visual-evidence/final_acceptance_telemetry.json`
- `06_Reports/visual-evidence/final_verification_summary.json`
- `06_Reports/visual-evidence/global_logo_and_role_consistency_telemetry.json`
- `06_Reports/visual-evidence/hover_card_retreat_luminous.png`
- `06_Reports/visual-evidence/hover_cta_retreat_primary.png`
- `06_Reports/visual-evidence/intermediate_600px_storytelling.png`
- `06_Reports/visual-evidence/logo_celestial_hero_dark.png`
- `06_Reports/visual-evidence/logo_celestial_scrolled_light.png`
- `06_Reports/visual-evidence/logo_contrast_hero_dark.png`
- `06_Reports/visual-evidence/logo_contrast_scrolled_light.png`
- `06_Reports/visual-evidence/logo_motion_win_anim_off.png`
- `06_Reports/visual-evidence/logo_motion_win_anim_on.png`
- `06_Reports/visual-evidence/logo_role_admin.png`
- `06_Reports/visual-evidence/logo_role_auth_login.png`
- `06_Reports/visual-evidence/logo_role_auth_register.png`
- `06_Reports/visual-evidence/logo_role_customer_dashboard.png`
- `06_Reports/visual-evidence/logo_role_kitchen.png`
- `06_Reports/visual-evidence/logo_role_manager.png`
- `06_Reports/visual-evidence/logo_role_mobile_public.png`
- `06_Reports/visual-evidence/logo_role_public_landing.png`
- `06_Reports/visual-evidence/logo_role_receptionist.png`
- `06_Reports/visual-evidence/logo_role_therapist.png`
- `06_Reports/visual-evidence/logo_sidebar_mobile_drawer.png`
- `06_Reports/visual-evidence/logo_windows_anim_reduce.png`
- `06_Reports/visual-evidence/mismatch_antigravity_experiences_2columns.png`
- `06_Reports/visual-evidence/mismatch_antigravity_pillars_2columns.png`
- `06_Reports/visual-evidence/mismatch_user_experiences_3cards.png`
- `06_Reports/visual-evidence/mismatch_user_pillars_3columns.png`
- `06_Reports/visual-evidence/mobile_320px_storytelling.png`
- `06_Reports/visual-evidence/mobile_375px_storytelling.png`
- `06_Reports/visual-evidence/mobile_390px_storytelling.png`
- `06_Reports/visual-evidence/mobile_430px_storytelling.png`
- `06_Reports/visual-evidence/mobile_fallback_experiences_3cards.png`
- `06_Reports/visual-evidence/mobile_fallback_pillars_3col.png`
- `06_Reports/visual-evidence/mobile_long_content_320px.png`
- `06_Reports/visual-evidence/mobile_step2_active.png`
- `06_Reports/visual-evidence/mobile_step3_active.png`
- `06_Reports/visual-evidence/pillars_storytelling_1280px.png`
- `06_Reports/visual-evidence/pillars_storytelling_1440px.png`
- `06_Reports/visual-evidence/pillars_storytelling_390px.png`
- `06_Reports/visual-evidence/pillars_storytelling_540px.png`
- `06_Reports/visual-evidence/pillars_storytelling_820px.png`
- `06_Reports/visual-evidence/pillars_storytelling_900px.png`
- `06_Reports/visual-evidence/pillars_storytelling_940px.png`
- `06_Reports/visual-evidence/responsive_experiences_1024x768.png`
- `06_Reports/visual-evidence/responsive_experiences_1152x864.png`
- `06_Reports/visual-evidence/responsive_experiences_1280x800.png`
- `06_Reports/visual-evidence/responsive_experiences_1440x900.png`
- `06_Reports/visual-evidence/responsive_experiences_768x1024.png`
- `06_Reports/visual-evidence/responsive_experiences_820x900.png`
- `06_Reports/visual-evidence/responsive_experiences_900x800.png`
- `06_Reports/visual-evidence/responsive_experiences_960x800.png`
- `06_Reports/visual-evidence/responsive_pillars_1024x768.png`
- `06_Reports/visual-evidence/responsive_pillars_1152x864.png`
- `06_Reports/visual-evidence/responsive_pillars_1280x800.png`
- `06_Reports/visual-evidence/responsive_pillars_1440x900.png`
- `06_Reports/visual-evidence/responsive_pillars_768x1024.png`
- `06_Reports/visual-evidence/responsive_pillars_820x900.png`
- `06_Reports/visual-evidence/responsive_pillars_900x800.png`
- `06_Reports/visual-evidence/responsive_pillars_960x800.png`
- `06_Reports/visual-evidence/snap_820px_storytelling.png`
- `06_Reports/visual-evidence/spa_card_hover_win_off.png`
- `06_Reports/visual-evidence/spa_card_hover_win_on.png`
- `06_Reports/visual-evidence/story_experiences_1024x768.png`
- `06_Reports/visual-evidence/story_experiences_1152x864.png`
- `06_Reports/visual-evidence/story_experiences_1280x800.png`
- `06_Reports/visual-evidence/story_experiences_1440x900.png`
- `06_Reports/visual-evidence/story_experiences_640x900.png`
- `06_Reports/visual-evidence/story_experiences_768x1024.png`
- `06_Reports/visual-evidence/story_experiences_820x900.png`
- `06_Reports/visual-evidence/story_experiences_900x800.png`
- `06_Reports/visual-evidence/story_experiences_940x900.png`
- `06_Reports/visual-evidence/story_experiences_960x800.png`
- `06_Reports/visual-evidence/story_pillars_1024x768.png`
- `06_Reports/visual-evidence/story_pillars_1152x864.png`
- `06_Reports/visual-evidence/story_pillars_1280x800.png`
- `06_Reports/visual-evidence/story_pillars_1440x900.png`
- `06_Reports/visual-evidence/story_pillars_640x900.png`
- `06_Reports/visual-evidence/story_pillars_768x1024.png`
- `06_Reports/visual-evidence/story_pillars_820x900.png`
- `06_Reports/visual-evidence/story_pillars_900x800.png`
- `06_Reports/visual-evidence/story_pillars_940x900.png`
- `06_Reports/visual-evidence/story_pillars_960x800.png`
- `06_Reports/visual-evidence/tablet_768px_storytelling.png`
- `06_Reports/visual-evidence/verification_summary_v2.json`
- `HSWRMS_CODEX_FULL_PROJECT_HANDOVER.md`
- `HSWRMS_FINAL_IMPLEMENTATION_REPORT.txt`
- `06_Reports/PHASE_5.8.13_COMPLETE_CODE_CONTENT_RECONCILIATION.md`
### 2. Present before but not currently reported as untracked

None. **0 paths.** All prior paths listed above remain untracked and present in the working tree.

### 3. Newly untracked since the Phase 5.8.13 inventory

- `06_Reports/PHASE_5.8.14_IMPLEMENTATION_GAP_CLOSURE_REPORT.md`
- `06_Reports/PHASE_5.8.15_PRESERVATION_INVENTORY_RECONCILIATION.md`
## The 123-path reconciliation, individually accounted for

There are no 123 missing paths. The individual prior paths are the 158 entries in list 1 above; each is currently present. The apparent drop came from directory grouping. In the Phase 5.8.14 Git status output, directories containing multiple files appeared as single untracked entries, including the visual-evidence directory and audit-output backup directory. The database generated directory also appeared as one status entry for two files. Git's `--untracked-files=all` or `git ls-files --others --exclude-standard` enumerates their leaf paths. None was classified as disposable or removed.

No prior path is now tracked or staged, renamed/moved, missing, or available only in a stash. One prior file has a newer working-tree version than the oldest stash blob; that exact content delta is disclosed in the stash section, and the older blob remains in the stash.

## Five additional modified tracked paths

Phase 5.8.13 Appendix A lists 72 modified tracked paths. All 72 remain modified. The five additions bringing the count to 77 are:

- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/VietQrService.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m6admin/AdminControllersSecurityTest.java`
- `05_Development/database/schema.sql`
- `05_Development/frontend/src/app/router/index.tsx`
- `05_Development/frontend/src/features/m5-billing/types/index.ts`

The Phase 5.8.14 report documents the edits that made these paths modified: read-only invoice VietQR behavior, a persisted-user S55 denial test, the six-column M3 clean-install schema/trigger alignment, System Overview's S55 frontend guard, and the VietQR response type. The report and current blobs support that attribution. Git history does not record unstaged-edit timestamps per path, so a more precise edit-time claim is not available.

Phase 5.8.14 also changed content in three paths already present in the Phase 5.8.13 modified list: `BillingAccessEvaluator.java`, `M5BillingAndCheckoutTests.java`, and `FinalPaymentPage.tsx`. Therefore the current worktree differs from the Phase 5.8.12 preservation stash on eight tracked paths total, but only five new *path names* were added to the modified-path inventory.

## Preservation stash verification

Both stashes remain in `git stash list`; neither was applied, popped, or dropped in this phase:

| Stash | Object | Tracked paths in saved worktree diff | Untracked-tree paths | Saved paths missing from current worktree |
| --- | --- | ---: | ---: | ---: |
| Phase 5.8.12 preservation | `b3e223508fb6e242a2827af7d4f994d557e5a052` | 78 | 156 | 0 |
| Earlier consolidation preservation | `250dc3d82c53d7cf482cb731da5a1fcb7cd2b4a8` | 61 | 141 | 0 |

For the Phase 5.8.12 stash, all 156 untracked-tree paths exist in the current working tree. Comparing the current tracked worktree to the stash shows eight changed paths, all documented Phase 5.8.14 implementation/test edits. The remaining saved tracked blobs match the current files or are now represented by the merge tree; no saved tracked path is absent.

For the earlier stash, all 141 untracked-tree paths and all 61 tracked-diff paths still exist. The current versions of these three untracked files differ from their older stash blobs:

- `05_Development/frontend/src/context/governanceAuthorization.test.ts` — later S55 authorization coverage.
- `05_Development/frontend/src/context/governanceAuthorization.ts` — later governance authorization helper implementation.
- `HSWRMS_FINAL_IMPLEMENTATION_REPORT.txt` — later report content.

The files remain in the current worktree and the older blobs remain readable in the stash. No stash was applied to perform this comparison.

### Exact Phase 5.8.12 tracked differences from current working files

- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/security/BillingAccessEvaluator.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/VietQrService.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m5billing/M5BillingAndCheckoutTests.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m6admin/AdminControllersSecurityTest.java`
- `05_Development/database/schema.sql`
- `05_Development/frontend/src/app/router/index.tsx`
- `05_Development/frontend/src/features/m5-billing/types/index.ts`
- `05_Development/frontend/src/pages/customer/FinalPaymentPage.tsx`

## Recovery snapshot and manifests

Phase 5.8.13 says a recovery snapshot existed but does not name its path, object ID, or creation command. No standalone filesystem file with `recovery` or `snapshot` in its name was found in the repository. The Git object database does contain retained Codex turn-diff tree snapshots:

- Phase 5.8.13-time candidate: tree `2d2ab984bcfd1ab6b17f3ffbad8ee9ad27bba27b`, under `refs/codex/turn-diffs/checkpoints/4023384d1f6c36dacb7c2359c9afe16f/a2d9a4a881171418fcd93b8e50a7cd3b/1793476245142/6ee2a71d-d4c3-44c1-bc0b-55724830af42`. It has 1,557 leaf paths, matching the 1,399-path HEAD tree plus 158 untracked paths at the Phase 5.8.13 inventory point.
- Phase 5.8.14-time capture: tree `af8549bb92d89da44c77fba61a80a71c28b78744`, under `refs/codex/turn-diffs/captures/1793477649075/35fb2c00-6e48-4116-a97c-fc06df9046fa/base`. It has 1,558 leaf paths, matching the 1,399 tracked paths plus the 159 untracked leaf paths after Phase 5.8.14.
- An earlier checkpoint tree `1ac7a7b21619baf4a850e97bc5a4ad664f14d33e` has 1,531 leaf paths and predates the Phase 5.8.13 inventory.

The Phase 5.8.13 checkpoint path set contains all paths in the 158-file prior inventory and excludes the later Phase 5.8.14 and Phase 5.8.15 reports. The Phase 5.8.14 capture path set matched the complete worktree path set at that phase's end. These refs and both stashes were left untouched. Because the Phase 5.8.12 report did not identify which object it called the “recovery snapshot,” the match is strongly evidenced by timestamp/path count but the exact intended snapshot identity remains undocumented.

## Preservation conclusion and residual risk

All 158 paths in the Phase 5.8.13 end-of-phase inventory are present now. The five modified-path additions are the documented Phase 5.8.14 edits. The two preservation stashes and the matching checkpoint trees remain available; zero listed paths are missing. Therefore the pre-existing work is demonstrably preserved by path, with stash copies for historical content. The only unresolved preservation-record issue is the missing identifier for the recovery snapshot cited in the prior report. No automatic recovery was attempted.

No project files were modified, moved, renamed, deleted, staged, committed, or pushed in this investigation. The only file created is this report.

## Appendix A — Exact current modified tracked paths

- `05_Development/backend/src/main/java/com/heavenstay/hswrms/HswrmsApplication.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/config/DevAccountBootstrap.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m2booking/controller/VillaInventoryController.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m2booking/entity/PaymentTransaction.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m2booking/repository/RetreatBookingRepository.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m2booking/service/ReceptionistOperationService.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m2booking/service/RetreatBookingService.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m2booking/service/VNPayDepositService.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/dto/request/ConfirmReservationRequest.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/SpaScheduleAuditEventListener.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/config/M5DataInitializer.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/config/VNPayConfig.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/CheckoutController.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/VnpayWebhookController.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/security/BillingAccessEvaluator.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/CheckoutService.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/FolioBillingService.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/VietQrService.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m6admin/controller/DashboardController.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m6admin/service/SystemOverviewService.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/security/JwtAuthenticationFilter.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/security/JwtTokenProvider.java`
- `05_Development/backend/src/main/resources/application-local.yml`
- `05_Development/backend/src/main/resources/application-sqlserver.yml`
- `05_Development/backend/src/main/resources/application.yml`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m2booking/ReceptionistOperationServiceTest.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m2booking/RetreatBookingSecurityTest.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m2booking/RetreatBookingServiceAuthorizationTest.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m5billing/M5BillingAndCheckoutTests.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m6admin/AdminControllersSecurityTest.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m6admin/DelegationServiceTest.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m6admin/M6AdminIntegrationTests.java`
- `05_Development/backend/src/test/resources/application.yml`
- `05_Development/database/schema.sql`
- `05_Development/frontend/src/api/health/healthProfileApi.ts`
- `05_Development/frontend/src/app/router/guards/RoleGuard.tsx`
- `05_Development/frontend/src/app/router/index.tsx`
- `05_Development/frontend/src/components/navigation/CustomerNavbar.tsx`
- `05_Development/frontend/src/components/navigation/PublicNavbar.tsx`
- `05_Development/frontend/src/context/CustomerContext.tsx`
- `05_Development/frontend/src/context/DiningContext.tsx`
- `05_Development/frontend/src/context/FolioContext.tsx`
- `05_Development/frontend/src/context/GovernanceContext.tsx`
- `05_Development/frontend/src/context/SpaContext.tsx`
- `05_Development/frontend/src/features/m5-billing/api/billingApi.ts`
- `05_Development/frontend/src/features/m5-billing/types/index.ts`
- `05_Development/frontend/src/features/m5-billing/utils/bookingResolver.test.ts`
- `05_Development/frontend/src/features/m5-billing/utils/bookingResolver.ts`
- `05_Development/frontend/src/features/m5-billing/utils/paymentSafety.test.ts`
- `05_Development/frontend/src/features/m6-admin/api/delegationApi.test.ts`
- `05_Development/frontend/src/features/m6-admin/api/delegationApi.ts`
- `05_Development/frontend/src/pages/admin/AdminDelegationPage.tsx`
- `05_Development/frontend/src/pages/common/SystemOverviewPage.tsx`
- `05_Development/frontend/src/pages/customer/AccountSettingsPage.tsx`
- `05_Development/frontend/src/pages/customer/AlaCarteOrderPage.tsx`
- `05_Development/frontend/src/pages/customer/CheckoutConfirmationPage.tsx`
- `05_Development/frontend/src/pages/customer/CustomerDashboardPage.tsx`
- `05_Development/frontend/src/pages/customer/DailyMealSelectionPage.tsx`
- `05_Development/frontend/src/pages/customer/DietaryMenuPage.tsx`
- `05_Development/frontend/src/pages/customer/FinalPaymentPage.tsx`
- `05_Development/frontend/src/pages/customer/FinalPaymentResultPage.tsx`
- `05_Development/frontend/src/pages/customer/FolioInvoicePage.tsx`
- `05_Development/frontend/src/pages/customer/HealthDataDeletionPage.tsx`
- `05_Development/frontend/src/pages/customer/HealthProfilePage.tsx`
- `05_Development/frontend/src/pages/customer/RetreatBookingPage.tsx`
- `05_Development/frontend/src/pages/customer/ReviewRatingPage.tsx`
- `05_Development/frontend/src/pages/customer/SpaConfirmationPage.tsx`
- `05_Development/frontend/src/pages/fb/MealOrderDetailPage.tsx`
- `05_Development/frontend/src/pages/fb/MealPrepListPage.tsx`
- `05_Development/frontend/src/pages/manager/ManagerDashboardPage.tsx`
- `05_Development/frontend/src/pages/receptionist/ReceptionistBookingsPage.tsx`
- `05_Development/frontend/src/pages/therapist/TherapistSchedulePage.tsx`
- `05_Development/frontend/src/pages/therapist/TherapistSessionDetailPage.tsx`
- `05_Development/frontend/src/types/customer.ts`
- `05_Development/frontend/src/types/dining.ts`
- `05_Development/frontend/src/types/folio.ts`
- `05_Development/frontend/src/types/spa.ts`
## Appendix B — Exact current untracked leaf paths after report creation

- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/ImmediateSpaAcceptedScheduleOutboxDispatcher.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/SpaAcceptedScheduleOutboxDispatcher.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/config/SchedulingConfigTest.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m1identity/service/OtpIssuanceConcurrencyTest.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaBookingValidationTests.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaTestIsolationIntegrationTest.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/TestProfileSpaAcceptedScheduleOutboxDispatcher.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/TestProfileSpaCalendarAdapter.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/TestProfileSpaNotificationAdapter.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m5billing/config/M5DataInitializerCustomerBFixtureTest.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/security/JwtAuthenticationFilterTest.java`
- `05_Development/database/generated/HSWRMS_TEST_schema.sql`
- `05_Development/database/generated/HSWRMS_TEST_schema_continuation.sql`
- `05_Development/frontend/src/context/governanceAuthorization.test.ts`
- `05_Development/frontend/src/context/governanceAuthorization.ts`
- `05_Development/frontend/src/pages/admin/FeatureFlagsPage.tsx`
- `05_Development/frontend/src/utils/customerPrivateStorage.test.ts`
- `05_Development/frontend/src/utils/customerPrivateStorage.ts`
- `05_Development/frontend/src/utils/identityScopedState.test.ts`
- `05_Development/frontend/src/utils/identityScopedState.ts`
- `06_Reports/PHASE_1.3A_REPOSITORY_MIGRATION_AUDIT_REPORT.md`
- `06_Reports/PHASE_1.3B_LIVE_SQLSERVER_READINESS_ASSESSMENT.md`
- `06_Reports/PHASE_1.3C-2A_DBA_BUSINESS_EVIDENCE_READINESS.md`
- `06_Reports/PHASE_1.3C_DBA_READ_ONLY_METADATA_COLLECTION.sql`
- `06_Reports/PHASE_1.3C_DBA_READ_ONLY_METADATA_COLLECTION_GUIDE.md`
- `06_Reports/PHASE_1.3C_MIGRATION_CONSOLIDATION_AND_DEPLOYMENT_DESIGN.md`
- `06_Reports/PHASE_5.8.11_SAFE_GITLAB_INTEGRATION_ASSESSMENT.md`
- `06_Reports/PHASE_5.8.12_CONTROLLED_GITLAB_MERGE_REPORT.md`
- `06_Reports/PHASE_5.8.13_COMPLETE_CODE_CONTENT_RECONCILIATION.md`
- `06_Reports/PHASE_5.8.14_IMPLEMENTATION_GAP_CLOSURE_REPORT.md`
- `06_Reports/SQL_SERVER_CONNECTIVITY_BASELINE_REPORT.md`
- `06_Reports/SQL_SERVER_SCHEMA_COMPATIBILITY_ASSESSMENT.md`
- `06_Reports/audit-output/backup_targeted_correction_20261029/01_Task_Assignment_Reconciliation.csv`
- `06_Reports/audit-output/backup_targeted_correction_20261029/05_Test_Evidence_Reconciliation.csv`
- `06_Reports/audit-output/backup_targeted_correction_20261029/06_Test_Evidence_RECONCILED.csv`
- `06_Reports/audit-output/backup_targeted_correction_20261029/Correction_Log.csv`
- `06_Reports/audit-output/backup_targeted_correction_20261029/HSWRMS_BAO_CAO_TONG_KET_DU_AN_RECONCILED.md`
- `06_Reports/audit-output/backup_targeted_correction_20261029/HSWRMS_DANH_GIA_DONG_GOP_THANH_VIEN_RECONCILED.xlsx`
- `06_Reports/audit-output/backup_targeted_correction_20261029/TIN_NHAN_ZALO_TONG_KET_HSWRMS_REVISED.md`
- `06_Reports/visual-evidence/01_landing_hero.png`
- `06_Reports/visual-evidence/02_pillars_sticky_story.png`
- `06_Reports/visual-evidence/03_experiences_sticky_story.png`
- `06_Reports/visual-evidence/04_image_reveal_rounded.png`
- `06_Reports/visual-evidence/05_receptionist_dashboard.png`
- `06_Reports/visual-evidence/06_receptionist_arrivals.png`
- `06_Reports/visual-evidence/07_therapist_schedule.png`
- `06_Reports/visual-evidence/08_admin_staff.png`
- `06_Reports/visual-evidence/celestial_logo_scrolled_light_canvas.png`
- `06_Reports/visual-evidence/celestial_logo_win_off_hero.png`
- `06_Reports/visual-evidence/celestial_logo_win_on_hero.png`
- `06_Reports/visual-evidence/chrome_940px_storytelling.png`
- `06_Reports/visual-evidence/debug_experiences_390.png`
- `06_Reports/visual-evidence/debug_pillars_390.png`
- `06_Reports/visual-evidence/desktop_1024px_storytelling.png`
- `06_Reports/visual-evidence/desktop_1440px_storytelling.png`
- `06_Reports/visual-evidence/desktop_default_reduce_cta_hover.png`
- `06_Reports/visual-evidence/desktop_default_reduce_experiences_2col.png`
- `06_Reports/visual-evidence/desktop_default_reduce_hero.png`
- `06_Reports/visual-evidence/desktop_default_reduce_pillars_2col.png`
- `06_Reports/visual-evidence/desktop_nopref_experiences_2col.png`
- `06_Reports/visual-evidence/desktop_nopref_pillars_2col.png`
- `06_Reports/visual-evidence/dining_card_hover_win_off.png`
- `06_Reports/visual-evidence/dining_card_hover_win_on.png`
- `06_Reports/visual-evidence/experiences_dining_hash.png`
- `06_Reports/visual-evidence/experiences_spa_hash.png`
- `06_Reports/visual-evidence/experiences_storytelling_1280px.png`
- `06_Reports/visual-evidence/experiences_storytelling_1440px.png`
- `06_Reports/visual-evidence/experiences_storytelling_390px.png`
- `06_Reports/visual-evidence/experiences_storytelling_540px.png`
- `06_Reports/visual-evidence/experiences_storytelling_820px.png`
- `06_Reports/visual-evidence/experiences_storytelling_900px.png`
- `06_Reports/visual-evidence/experiences_storytelling_940px.png`
- `06_Reports/visual-evidence/final_acceptance_telemetry.json`
- `06_Reports/visual-evidence/final_verification_summary.json`
- `06_Reports/visual-evidence/global_logo_and_role_consistency_telemetry.json`
- `06_Reports/visual-evidence/hover_card_retreat_luminous.png`
- `06_Reports/visual-evidence/hover_cta_retreat_primary.png`
- `06_Reports/visual-evidence/intermediate_600px_storytelling.png`
- `06_Reports/visual-evidence/logo_celestial_hero_dark.png`
- `06_Reports/visual-evidence/logo_celestial_scrolled_light.png`
- `06_Reports/visual-evidence/logo_contrast_hero_dark.png`
- `06_Reports/visual-evidence/logo_contrast_scrolled_light.png`
- `06_Reports/visual-evidence/logo_motion_win_anim_off.png`
- `06_Reports/visual-evidence/logo_motion_win_anim_on.png`
- `06_Reports/visual-evidence/logo_role_admin.png`
- `06_Reports/visual-evidence/logo_role_auth_login.png`
- `06_Reports/visual-evidence/logo_role_auth_register.png`
- `06_Reports/visual-evidence/logo_role_customer_dashboard.png`
- `06_Reports/visual-evidence/logo_role_kitchen.png`
- `06_Reports/visual-evidence/logo_role_manager.png`
- `06_Reports/visual-evidence/logo_role_mobile_public.png`
- `06_Reports/visual-evidence/logo_role_public_landing.png`
- `06_Reports/visual-evidence/logo_role_receptionist.png`
- `06_Reports/visual-evidence/logo_role_therapist.png`
- `06_Reports/visual-evidence/logo_sidebar_mobile_drawer.png`
- `06_Reports/visual-evidence/logo_windows_anim_reduce.png`
- `06_Reports/visual-evidence/mismatch_antigravity_experiences_2columns.png`
- `06_Reports/visual-evidence/mismatch_antigravity_pillars_2columns.png`
- `06_Reports/visual-evidence/mismatch_user_experiences_3cards.png`
- `06_Reports/visual-evidence/mismatch_user_pillars_3columns.png`
- `06_Reports/visual-evidence/mobile_320px_storytelling.png`
- `06_Reports/visual-evidence/mobile_375px_storytelling.png`
- `06_Reports/visual-evidence/mobile_390px_storytelling.png`
- `06_Reports/visual-evidence/mobile_430px_storytelling.png`
- `06_Reports/visual-evidence/mobile_fallback_experiences_3cards.png`
- `06_Reports/visual-evidence/mobile_fallback_pillars_3col.png`
- `06_Reports/visual-evidence/mobile_long_content_320px.png`
- `06_Reports/visual-evidence/mobile_step2_active.png`
- `06_Reports/visual-evidence/mobile_step3_active.png`
- `06_Reports/visual-evidence/pillars_storytelling_1280px.png`
- `06_Reports/visual-evidence/pillars_storytelling_1440px.png`
- `06_Reports/visual-evidence/pillars_storytelling_390px.png`
- `06_Reports/visual-evidence/pillars_storytelling_540px.png`
- `06_Reports/visual-evidence/pillars_storytelling_820px.png`
- `06_Reports/visual-evidence/pillars_storytelling_900px.png`
- `06_Reports/visual-evidence/pillars_storytelling_940px.png`
- `06_Reports/visual-evidence/responsive_experiences_1024x768.png`
- `06_Reports/visual-evidence/responsive_experiences_1152x864.png`
- `06_Reports/visual-evidence/responsive_experiences_1280x800.png`
- `06_Reports/visual-evidence/responsive_experiences_1440x900.png`
- `06_Reports/visual-evidence/responsive_experiences_768x1024.png`
- `06_Reports/visual-evidence/responsive_experiences_820x900.png`
- `06_Reports/visual-evidence/responsive_experiences_900x800.png`
- `06_Reports/visual-evidence/responsive_experiences_960x800.png`
- `06_Reports/visual-evidence/responsive_pillars_1024x768.png`
- `06_Reports/visual-evidence/responsive_pillars_1152x864.png`
- `06_Reports/visual-evidence/responsive_pillars_1280x800.png`
- `06_Reports/visual-evidence/responsive_pillars_1440x900.png`
- `06_Reports/visual-evidence/responsive_pillars_768x1024.png`
- `06_Reports/visual-evidence/responsive_pillars_820x900.png`
- `06_Reports/visual-evidence/responsive_pillars_900x800.png`
- `06_Reports/visual-evidence/responsive_pillars_960x800.png`
- `06_Reports/visual-evidence/snap_820px_storytelling.png`
- `06_Reports/visual-evidence/spa_card_hover_win_off.png`
- `06_Reports/visual-evidence/spa_card_hover_win_on.png`
- `06_Reports/visual-evidence/story_experiences_1024x768.png`
- `06_Reports/visual-evidence/story_experiences_1152x864.png`
- `06_Reports/visual-evidence/story_experiences_1280x800.png`
- `06_Reports/visual-evidence/story_experiences_1440x900.png`
- `06_Reports/visual-evidence/story_experiences_640x900.png`
- `06_Reports/visual-evidence/story_experiences_768x1024.png`
- `06_Reports/visual-evidence/story_experiences_820x900.png`
- `06_Reports/visual-evidence/story_experiences_900x800.png`
- `06_Reports/visual-evidence/story_experiences_940x900.png`
- `06_Reports/visual-evidence/story_experiences_960x800.png`
- `06_Reports/visual-evidence/story_pillars_1024x768.png`
- `06_Reports/visual-evidence/story_pillars_1152x864.png`
- `06_Reports/visual-evidence/story_pillars_1280x800.png`
- `06_Reports/visual-evidence/story_pillars_1440x900.png`
- `06_Reports/visual-evidence/story_pillars_640x900.png`
- `06_Reports/visual-evidence/story_pillars_768x1024.png`
- `06_Reports/visual-evidence/story_pillars_820x900.png`
- `06_Reports/visual-evidence/story_pillars_900x800.png`
- `06_Reports/visual-evidence/story_pillars_940x900.png`
- `06_Reports/visual-evidence/story_pillars_960x800.png`
- `06_Reports/visual-evidence/tablet_768px_storytelling.png`
- `06_Reports/visual-evidence/verification_summary_v2.json`
- `HSWRMS_CODEX_FULL_PROJECT_HANDOVER.md`
- `HSWRMS_FINAL_IMPLEMENTATION_REPORT.txt`
- `06_Reports/PHASE_5.8.15_PRESERVATION_INVENTORY_RECONCILIATION.md`
## Appendix C — Staged, deleted, and conflicted paths

- Staged: none.
- Deleted: none.
- Conflicted: none.



