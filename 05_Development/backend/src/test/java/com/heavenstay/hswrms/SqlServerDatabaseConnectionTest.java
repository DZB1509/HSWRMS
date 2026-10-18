package com.heavenstay.hswrms;

import com.heavenstay.hswrms.m2booking.entity.PhysicalVilla;
import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import com.heavenstay.hswrms.m2booking.entity.VillaCategory;
import com.heavenstay.hswrms.m2booking.repository.PhysicalVillaRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatPackageRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaCategoryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=HSWRMS;encrypt=true;trustServerCertificate=true",
        "spring.datasource.username=sa",
        "spring.datasource.password=123",
        "spring.datasource.driver-class-name=com.microsoft.sqlserver.jdbc.SQLServerDriver",
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.jpa.hibernate.naming.physical-strategy=org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl"
})
public class SqlServerDatabaseConnectionTest {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private RetreatPackageRepository packageRepository;

    @Autowired
    private VillaCategoryRepository categoryRepository;

    @Autowired
    private PhysicalVillaRepository villaRepository;

    @Test
    @DisplayName("Verify connection to SQL Server with credentials sa / 123")
    void testSqlServerConnection() throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            assertNotNull(connection, "Connection to SQL Server must not be null");
            DatabaseMetaData metaData = connection.getMetaData();
            System.out.println(">>> Connected to DBMS: " + metaData.getDatabaseProductName() + " v" + metaData.getDatabaseProductVersion());
            System.out.println(">>> Database URL: " + metaData.getURL());
            System.out.println(">>> Connected User: " + metaData.getUserName());
            assertEquals("HSWRMS", connection.getCatalog(), "Current database must be HSWRMS");
        }
    }

    @Test
    @DisplayName("Verify seeded data can be queried via Spring Data JPA from HSWRMS")
    void testQuerySeededData() {
        List<RetreatPackage> packages = packageRepository.findAll();
        assertFalse(packages.isEmpty(), "Retreat packages should be seeded in database");
        System.out.println(">>> Total Retreat Packages loaded from SQL Server: " + packages.size());

        List<VillaCategory> categories = categoryRepository.findAll();
        assertFalse(categories.isEmpty(), "Villa categories should be seeded in database");
        System.out.println(">>> Total Villa Categories loaded from SQL Server: " + categories.size());

        List<PhysicalVilla> villas = villaRepository.findAll();
        assertFalse(villas.isEmpty(), "Physical villas should be seeded in database");
        System.out.println(">>> Total Physical Villas loaded from SQL Server: " + villas.size());
    }
}
