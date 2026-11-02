-- Test-only schema initialization for bridge tables not mapped by JPA entities.
-- Ensures H2 in-memory test databases have dbo.RetreatPackageSpaTreatment available.
CREATE TABLE IF NOT EXISTS dbo.RetreatPackageSpaTreatment (
    retreat_package_id  INT NOT NULL,
    treatment_id        INT NOT NULL,
    included_sessions   INT NOT NULL DEFAULT 1,
    entitlement_status  VARCHAR(50) NOT NULL DEFAULT 'INCLUDED',
    notes               VARCHAR(500) NULL,
    CONSTRAINT PK_Test_RetreatPackageSpaTreatment PRIMARY KEY (retreat_package_id, treatment_id)
);
