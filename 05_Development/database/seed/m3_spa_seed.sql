-- ============================================================================
-- HSWRMS Development Seed Data: Module 3 Spa Treatments & Rooms
-- Apply only for development and demo environments.
-- ============================================================================

-- 1. Baseline Seed Data for Treatments
IF NOT EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Herbal Poultice Therapy')
BEGIN
    INSERT INTO dbo.SpaTreatment (treatment_name, duration_minutes, base_price, treatment_status, category, description)
    VALUES 
    (N'Herbal Poultice Therapy', 90, 1800000.00, 'ACTIVE', 'MASSAGE', N'Traditional Vietnamese warm herbal compression relieving deep muscular tension and revitalizing circulation.'),
    (N'Lotus Radiance Facial', 60, 1200000.00, 'FACIAL', N'Restorative skincare treatment using organic white lotus extracts and gentle acupressure for cellular renewal.'),
    (N'Mineral Hydrotherapy Soak', 60, 950000.00, 'HYDROTHERAPY', N'Thermal hydrotherapy pool treatment infused with coastal minerals to soothe the nervous system.'),
    (N'Mindful Pranyama & Meditation', 60, 600000.00, 'MEDITATION', N'Guided breathwork and mindfulness meditation session fostering inner stillness and mental clarity.'),
    (N'Deep Tissue Bamboo Massage', 90, 2100000.00, 'MASSAGE', N'Therapeutic deep pressure massage utilizing heated bamboo stalks for intense muscle recovery.');
END
GO

-- 2. Baseline Treatment Rooms
IF NOT EXISTS (SELECT 1 FROM dbo.TreatmentRoom WHERE room_name = N'Lotus Pavilion Suite 1')
BEGIN
    INSERT INTO dbo.TreatmentRoom (room_name, room_status)
    VALUES 
    (N'Lotus Pavilion Suite 1', 'AVAILABLE'),
    (N'Lotus Pavilion Suite 2', 'AVAILABLE'),
    (N'Bamboo Sanctuary Suite A', 'AVAILABLE'),
    (N'Hydro-Thermal Suite', 'AVAILABLE'),
    (N'Meditation Garden Pavilion', 'AVAILABLE');
END
GO
