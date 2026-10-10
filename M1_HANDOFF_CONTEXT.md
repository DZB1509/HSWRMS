# HSWRMS â€” M1 Handoff Context

> Má»¥c Ä‘Ã­ch: Ä‘Æ°a file nÃ y vÃ o chat má»›i Ä‘á»ƒ AI tiáº¿p tá»¥c cÃ´ng viá»‡c mÃ  khÃ´ng cáº§n ngÆ°á»i dÃ¹ng ká»ƒ láº¡i toÃ n bá»™ bá»‘i cáº£nh.
> Tráº¡ng thÃ¡i táº¡i thá»i Ä‘iá»ƒm bÃ n giao: **WP1 Ä‘ang lÃ m dá»Ÿ trÃªn nhÃ¡nh M1 riÃªng; chÆ°a commit/push; chÆ°a cháº¡y Maven test; chÆ°a cháº¡y SQL migration**.

## 1. CÃ¡ch lÃ m viá»‡c vá»›i ngÆ°á»i dÃ¹ng

- Trao Ä‘á»•i báº±ng tiáº¿ng Viá»‡t, giá»ng tá»± nhiÃªn/thÃ¢n thiá»‡n.
- HÆ°á»›ng dáº«n theo tá»«ng bÆ°á»›c nhá»; sau má»—i bÆ°á»›c quan trá»ng, Ä‘á»£i ngÆ°á»i dÃ¹ng gá»­i káº¿t quáº£ rá»“i má»›i Ä‘i tiáº¿p.
- Äá»«ng yÃªu cáº§u ngÆ°á»i dÃ¹ng dÃ¡n láº¡i toÃ n bá»™ repository hoáº·c toÃ n bá»™ ngá»¯ cáº£nh nÃ y. DÃ¹ng lá»‡nh Ä‘á»c file/tráº¡ng thÃ¡i Git Ä‘á»ƒ xÃ¡c minh khi cáº§n.
- Agent láº­p trÃ¬nh cá»§a ngÆ°á»i dÃ¹ng hiá»‡n bÃ¡o háº¿t quota vÃ  yÃªu cáº§u chá» 7 ngÃ y. KhÃ´ng cáº§n phá»¥ thuá»™c vÃ o Agent Ä‘á»ƒ tiáº¿p tá»¥c kiá»ƒm tra thá»§ cÃ´ng.
- KhÃ´ng nÃ³i Ä‘Ã£ commit/push/test/cháº¡y SQL náº¿u ngÆ°á»i dÃ¹ng chÆ°a cháº¡y vÃ  gá»­i káº¿t quáº£ xÃ¡c minh.

## 2. Repository vÃ  nhÃ¡nh

- Repository local: `C:\Users\Admin\Desktop\ISP392\Project\fall26_isp392_is2005_g1-work`
- NhÃ¡nh lÃ m viá»‡c dá»± kiáº¿n: `DucHoangM1`
- NhÃ¡nh Ä‘Æ°á»£c táº¡o tá»« `origin/main`, baseline commit `4b44f3d` (`refactor: restructure HSWRMS development baseline for full-stack implementation`).
- Láº§n kiá»ƒm tra gáº§n nháº¥t: `git fetch origin` Ä‘Ã£ cháº¡y; `git log --oneline HEAD..origin/main` khÃ´ng tráº£ ra commit nÃ o.
- **KhÃ´ng merge `origin/NTDatZB` vÃ o `main` hoáº·c nhÃ¡nh M1.** ÄÃ¢y lÃ  nhÃ¡nh M3 riÃªng; nhÃ³m trÆ°á»Ÿng Ä‘Ã£ dáº·n M1 vÃ  M3 tiáº¿p tá»¥c tÃ¡ch riÃªng.
- NÃªn xÃ¡c minh láº¡i báº±ng `git branch --show-current`, `git status --short` trÆ°á»›c khi thay Ä‘á»•i hoáº·c push.

## 3. Stack vÃ  ranh giá»›i kiáº¿n trÃºc Ä‘Ã£ Ä‘Æ°á»£c nhÃ³m thá»‘ng nháº¥t

- Frontend: React + TypeScript + Vite.
- Backend: Java + Spring Boot, Spring MVC REST, Spring Data JPA/Hibernate, Spring Security/JWT, Maven.
- Database: Microsoft SQL Server.
- Code chÃ­nh thá»©c á»Ÿ `05_Development/`. `04_Implement/Frontend_Prototype/` chá»‰ lÃ  prototype/tham kháº£o, khÃ´ng pháº£i nguá»“n code backend chÃ­nh thá»©c.
- M1 package: `com.heavenstay.hswrms.m1identity`; frontend feature dá»± kiáº¿n `features/m1-identity`; M1 quáº£n lÃ½ Auth/Register/JWT, `CustomerProfile`, `HealthProfile`/consent/retention vÃ  yÃªu cáº§u xÃ³a dá»¯ liá»‡u sá»©c khá»e.
- API prefix thá»‘ng nháº¥t: `/api/v1/...`; chuáº©n response dÃ¹ng `ResponseEntity<ApiResponse<T>>`.
- Nhá»¯ng vÃ¹ng dÃ¹ng chung cáº§n háº¡n cháº¿ sá»­a vÃ  pháº£i review ká»¹: `backend/.../common/`, `security/`, `config/`; frontend `src/api/`, app/router/layouts, shared components/styles. Thay Ä‘á»•i tá»‘i thiá»ƒu náº¿u báº¯t buá»™c vÃ  nÃªu rÃµ áº£nh hÆ°á»Ÿng khi review.

## 4. Quyáº¿t Ä‘á»‹nh cá»§a nhÃ³m trÆ°á»Ÿng â€” khÃ´ng tá»± suy diá»…n láº¡i

1. DÃ¹ng schema chung hiá»‡n cÃ³; PK/FK giá»¯ `INT`/Java `Integer`, khÃ´ng tá»± táº¡o `BIGINT` riÃªng cho M1.
2. TÃ¡ch `User`, `CustomerProfile`, `HealthProfile`. DOB, Ä‘á»‹a chá»‰ vÃ  ngÃ´n ngá»¯ Æ°u tiÃªn á»Ÿ `CustomerProfile`. `User.full_name` Ä‘Æ°á»£c giá»¯ táº¡m Ä‘á»ƒ tÆ°Æ¡ng thÃ­ch, khÃ´ng nÃªn coi lÃ  nguá»“n profile lÃ¢u dÃ i.
3. KhÃ´ng táº¡o báº£ng Allergy/Dietary riÃªng náº¿u requirement váº«n giá»¯ cÃ¡c thÃ´ng tin nÃ y trong `HealthProfile`.
4. `schema.sql` lÃ  baseline clean install; migrations lÃ  script nÃ¢ng cáº¥p database hiá»‡n cÃ³; seed Ä‘áº·t riÃªng trong `database/seed/`. KhÃ´ng tá»± thÃªm Flyway chá»‰ riÃªng cho M1; cÃ¡ch Ä‘Ã¡nh version migration sáº½ thá»‘ng nháº¥t lÃºc tÃ­ch há»£p.
5. Chá»‰ whitelist chÃ­nh xÃ¡c endpoint public; trÃ¡nh `permitAll` wildcard vá»›i `/api/v1/auth/**`. Vai trÃ²/tÃ¬nh tráº¡ng tÃ i khoáº£n bá»‹ khÃ³a hoáº·c deactivate pháº£i Ä‘Æ°á»£c backend Ã¡p dá»¥ng tá»« request káº¿ tiáº¿p, khÃ´ng Ä‘á»£i JWT tá»± háº¿t háº¡n. KhÃ´ng xÃ¢y há»‡ thá»‘ng revoke phá»©c táº¡p vÆ°á»£t scope.
6. OTP/SSO: adapter dev/test tÃ¡ch riÃªng. KhÃ´ng tráº£ OTP trong header/response API thÆ°á»ng vÃ  khÃ´ng log OTP ngoÃ i dev. Google/Facebook UI cÃ³ thá»ƒ giá»¯ integration boundary; náº¿u chÆ°a cÃ³ provider tháº­t thÃ¬ pháº£i Ä‘Ã¡nh dáº¥u PARTIAL, khÃ´ng phÃ¡t JWT giáº£ qua callback.
7. YÃªu cáº§u xÃ³a HealthProfile: náº¿u chÆ°a xÃ¡c Ä‘á»‹nh Ä‘Æ°á»£c tráº¡ng thÃ¡i booking tá»« M2 thÃ¬ fail closed, Ä‘á»ƒ request `PENDING`/`DEFERRED`; khÃ´ng máº·c Ä‘á»‹nh â€œkhÃ´ng cÃ³ bookingâ€ rá»“i xÃ³a dá»¯ liá»‡u.
8. CÃ²n unresolved: `notification_preference` lÃ  má»™t chuá»—i trong schema nhÆ°ng Screen 7 mÃ´ táº£ ba cá» `notifyEmail`, `notifySms`, `notifyWellness`; ERD cÃ³ cÃ¡c cá» thÃ´ng bÃ¡o theo event. KhÃ´ng tá»± chá»n má»™t cÃ¡ch biá»ƒu diá»…n trÆ°á»›c khi giáº£i quyáº¿t á»Ÿ WP4.

## 5. Thay Ä‘á»•i vÃ  file hiá»‡n cÃ³

Láº§n `git status --short` gáº§n nháº¥t cho tháº¥y:

**Tracked modified**
- `02_Requirement/SRS/HSWRMS_ISP392_G1_SRS.docx`
- `02_Requirement/SRS/HSWRMS_ISP392_G1_SRS.pdf`
- `05_Development/database/schema.sql`

**Untracked**
- `03_Design/Diagrams/02_Business_Flows/M1_BusinessFlow.drawio`
- `03_Design/Diagrams/03_Data_Model/M1_ERD.drawio`
- `03_Design/Diagrams/04_Use_Case_Diagrams/M1_UseCase.drawio`
- `03_Design/Diagrams/05_Screen_Flow/M1_ScreenFlow.drawio`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m1identity/entity/`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m1identity/repository/`
- `05_Development/database/migrations/_draft_m1_identity_health_profile.sql`
- `05_Development/database/seed/_draft_m1_roles_seed.sql`
- `M1_Phase1_Audit.md`
- `M1_Phase2_Plan.md`

Bá»‘n diagram vÃ  hai file Audit/Plan Ä‘Æ°á»£c **copy** tá»« thÆ° má»¥c tÃ i liá»‡u cÅ© sang repo branch; originals bÃªn thÆ° má»¥c cÅ© Ä‘Æ°á»£c giá»¯ láº¡i. Nhá»¯ng file nÃ y chÆ°a Ä‘Æ°á»£c commit táº¡i thá»i Ä‘iá»ƒm ghi handoff.

### SRS hiá»‡n táº¡i

- DOCX má»›i Ä‘Æ°á»£c copy tá»« `C:\Users\Admin\Downloads\HSWRMS_ISP392_G1_SRS.docx` vÃ o repo. SHA256 Ä‘Ã£ Ä‘á»‘i chiáº¿u trÃ¹ng nhau: `934D63031EBDDD0C67D2022FDED8D15F28816C4A2A209DB88137E48567999169`.
- PDF trong repo Ä‘Æ°á»£c ngÆ°á»i dÃ¹ng xuáº¥t thá»§ cÃ´ng tá»« DOCX má»›i qua Word.
- Báº£n repo DOCX/PDF cÅ© Ä‘Æ°á»£c backup ngoÃ i repo á»Ÿ `C:\Users\Admin\Desktop\ISP392\Project\HSWRMS_ISP392_G1_SRS_repo-original.docx` vÃ  `C:\Users\Admin\Desktop\ISP392\Project\HSWRMS_ISP392_G1_SRS_repo-original.pdf`.

## 6. WP1 hiá»‡n cÃ³

CÃ¡c entity Ä‘Ã£ Ä‘Æ°á»£c táº¡o trong `.../m1identity/entity/`:

- `User.java`
- `Role.java`
- `UserRole.java`
- `UserRoleId.java`
- `AuthIdentity.java`
- `CustomerProfile.java`
- `HealthProfile.java`
- `ConsentRecord.java`
- `HealthDataDeletionRequest.java`
- `EmailOtp.java`

Repositories Ä‘Ã£ táº¡o: `UserRepository`, `RoleRepository`, `UserRoleRepository`, `AuthIdentityRepository`, `CustomerProfileRepository`, `HealthProfileRepository`, `ConsentRecordRepository`, `HealthDataDeletionRequestRepository`, `EmailOtpRepository`.

CÃ¡c thay Ä‘á»•i schema/draft migration gá»“m cÃ¡c field CustomerProfile cÃ³ cáº¥u trÃºc, báº£ng `HealthProfile`, `ConsentRecord`, `HealthDataDeletionRequest`, `EmailOtp` vÃ  index; seed draft thÃªm 6 role theo cÃ¡ch idempotent. Report review trÆ°á»›c cho biáº¿t PK/FK Ä‘ang dÃ¹ng `INT`/`Integer`, `UserRoleId` cÃ³ `Serializable`/`equals`/`hashCode`, khÃ´ng dÃ¹ng `CascadeType.REMOVE`/`ALL`, timestamp dÃ¹ng `Instant`. Nhá»¯ng Ä‘iá»ƒm nÃ y váº«n cáº§n Ä‘Æ°á»£c xÃ¡c minh báº±ng code/test thá»±c táº¿.

## 7. Cáº¢NH BÃO QUAN TRá»ŒNG â€” migration OTP chÆ°a an toÃ n

Lá»‡nh gáº§n nháº¥t cá»§a ngÆ°á»i dÃ¹ng Ä‘á»c `_draft_m1_identity_health_profile.sql` cho tháº¥y:

```sql
ELSE IF COL_LENGTH('dbo.EmailOtp', 'otp_code') IS NOT NULL
     AND COL_LENGTH('dbo.EmailOtp', 'otp_hash') IS NULL
BEGIN
    EXEC sp_rename 'dbo.EmailOtp.otp_code', 'otp_hash', 'COLUMN';
    ALTER TABLE dbo.EmailOtp ALTER COLUMN otp_hash VARCHAR(255) NOT NULL;
    PRINT 'Renamed column dbo.EmailOtp.otp_code to otp_hash and resized to VARCHAR(255)';
END
```

**KhÃ´ng Ä‘Æ°á»£c cháº¡y migration nÃ y trÃªn database hiá»‡n cÃ³ khi cÃ²n Ä‘oáº¡n trÃªn. KhÃ´ng Ä‘Æ°á»£c coi rename `otp_code` thÃ nh `otp_hash` lÃ  mÃ£ hÃ³a dá»¯ liá»‡u.** Rename chá»‰ Ä‘á»•i tÃªn cá»™t; OTP dáº¡ng plaintext cÅ© sáº½ váº«n lÃ  plaintext nhÆ°ng bá»‹ hiá»ƒu nháº§m lÃ  hash.

HÆ°á»›ng sá»­a Ä‘Ã£ thá»‘ng nháº¥t trÆ°á»›c khi quota Agent háº¿t: náº¿u báº£ng hiá»‡n há»¯u cÃ³ cá»™t legacy `otp_code` mÃ  chÆ°a cÃ³ `otp_hash`, migration nÃªn **dá»«ng vá»›i lá»—i rÃµ rÃ ng trÆ°á»›c khi thá»±c hiá»‡n cÃ¡c thay Ä‘á»•i tiáº¿p theo**, yÃªu cáº§u xá»­ lÃ½/invalidate OTP legacy má»™t cÃ¡ch an toÃ n; khÃ´ng rename vÃ  khÃ´ng tuyÃªn bá»‘ Ä‘Ã£ hash dá»¯ liá»‡u cÅ©. `schema.sql` cho clean install vÃ  entity pháº£i cÃ¹ng dÃ¹ng `otp_hash VARCHAR(255)`/`otpHash`. Kiá»ƒm tra láº¡i entity `EmailOtp.java` Ä‘á»ƒ cháº¯c mapping khá»›p.

File hiá»‡n lÃ  draft, chÆ°a Ä‘Æ°á»£c Ä‘Ã¡nh global version, vÃ  chÆ°a cÃ³ SQL nÃ o Ä‘Æ°á»£c xÃ¡c nháº­n Ä‘Ã£ cháº¡y. KhÃ´ng tÃ­ch há»£p/merge cho Ä‘áº¿n khi review xong.

## 8. MÃ´i trÆ°á»ng Java

NgÆ°á»i dÃ¹ng Ä‘Ã£ cÃ i Eclipse Temurin JDK 17. Lá»‡nh trong PowerShell thÃ nh cÃ´ng:

- `java -version` â†’ OpenJDK `17.0.20.1`
- `javac -version` â†’ `17.0.20.1`
- `JAVA_HOME` â†’ `C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot`

LÆ°u Ã½: `JAVA_HOME` vÃ  `PATH` má»›i Ä‘Æ°á»£c cáº¥u hÃ¬nh trong **cá»­a sá»• PowerShell hiá»‡n táº¡i**, chÆ°a pháº£i biáº¿n mÃ´i trÆ°á»ng vÄ©nh viá»…n. Náº¿u má»Ÿ terminal má»›i thÃ¬ cáº§n cáº¥u hÃ¬nh láº¡i hoáº·c kiá»ƒm tra `java -version`.

Táº¡i thá»i Ä‘iá»ƒm handoff, **chÆ°a cháº¡y** `mvnw test`, `mvnw package`, test DB hoáº·c migration. TrÆ°á»›c khi Maven, chuyá»ƒn thÆ° má»¥c vá» repository root rá»“i vÃ o `05_Development/backend`.

## 9. Äá» xuáº¥t trÃ¬nh tá»± tiáº¿p tá»¥c á»Ÿ chat má»›i

1. Äá»c file handoff nÃ y; Ä‘á»«ng yÃªu cáº§u ngÆ°á»i dÃ¹ng ká»ƒ láº¡i bá»‘i cáº£nh.
2. Cháº¡y `git branch --show-current` vÃ  `git status --short` trong repository root Ä‘á»ƒ xÃ¡c nháº­n tráº¡ng thÃ¡i hiá»‡n táº¡i.
3. Náº¿u ngÆ°á»i dÃ¹ng chá»‰ muá»‘n lÆ°u cÃ´ng viá»‡c lÃªn GitLab, commit/push WIP lÃªn `DucHoangM1` riÃªng; khÃ´ng merge vÃ o `main` vÃ  khÃ´ng cháº¡y migration SQL. TrÆ°á»›c khi commit pháº£i xem `git diff --check` vÃ  `git diff --cached --check`.
4. Khi quay láº¡i code: sá»­a Ä‘oáº¡n legacy OTP migration trÆ°á»›c; review `EmailOtp.java`, `schema.sql`, draft migration vÃ  seed Ä‘á»ƒ cÃ¡c mapping nháº¥t quÃ¡n.
5. Sau khi sá»­a, cháº¡y kiá»ƒm tra Maven tá»« `05_Development/backend`:
   - Äá»©ng ngay trong `05_Development/backend` rá»“i cháº¡y `.\mvnw.cmd test` (bá» khoáº£ng tráº¯ng Ä‘áº§u lá»‡nh); sau khi test qua, cháº¡y `.\mvnw.cmd package`.
   - Náº¿u cÃ³ lá»—i, Ä‘á»c lá»—i cá»¥ thá»ƒ rá»“i má»›i sá»­a; khÃ´ng tuyÃªn bá»‘ build thÃ nh cÃ´ng trÆ°á»›c khi cÃ³ output.
6. Kiá»ƒm tra cÃ¡c pháº§n backend shared security/auth trÆ°á»›c khi triá»ƒn khai endpoint tháº­t; `SecurityConfig`/JWT filter hiá»‡n lÃ  háº¡ táº§ng chung cáº§n review cáº©n tháº­n.
7. ChÆ°a tá»± quyáº¿t Ä‘á»‹nh notification preference; giá»¯ lÃ m open item vÃ  há»i nhÃ³m trÆ°á»Ÿng á»Ÿ má»‘c tÃ­ch há»£p.

## 10. Lá»‡nh kiá»ƒm tra tráº¡ng thÃ¡i nhanh

Cháº¡y trong PowerShell:

```powershell
cd C:\Users\Admin\Desktop\ISP392\Project\fall26_isp392_is2005_g1-work
git branch --show-current
git status --short
git diff --check
```

Náº¿u cáº§n chuáº©n bá»‹ commit, xem láº¡i diff trÆ°á»›c, Ä‘áº·c biá»‡t migration OTP, rá»“i má»›i stage. CÃ³ thá»ƒ push WIP lÃªn nhÃ¡nh M1 riÃªng Ä‘á»ƒ sao lÆ°u, nhÆ°ng **khÃ´ng merge vÃ  khÃ´ng cháº¡y SQL draft** cho Ä‘áº¿n khi cáº£nh bÃ¡o á»Ÿ má»¥c 7 Ä‘Æ°á»£c xá»­ lÃ½.

