package com.heavenstay.hswrms.m2booking;

import com.heavenstay.hswrms.m2booking.service.ReceptionistOperationService;
import com.heavenstay.hswrms.m2booking.service.RetreatBookingService;
import com.heavenstay.hswrms.m2booking.service.VNPayDepositService;
import com.heavenstay.hswrms.m5billing.port.PaymentTransactionPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class M2PaymentBoundaryArchitectureTest {

    @Test
    @DisplayName("APP-04 Architecture Guard: M2 duplicate PaymentTransaction entity and repository classes must not exist")
    void testM2DuplicateClassesDoNotExist() {
        assertThrows(ClassNotFoundException.class, () ->
                Class.forName("com.heavenstay.hswrms.m2booking.entity.PaymentTransaction"));

        assertThrows(ClassNotFoundException.class, () ->
                Class.forName("com.heavenstay.hswrms.m2booking.repository.PaymentTransactionRepository"));
    }

    @Test
    @DisplayName("APP-04 Architecture Guard: M2 services must NOT declare any dependency on PaymentTransactionRepository or PaymentTransactionEntity")
    void testM2ServicesHaveNoDirectPersistenceDependency() {
        List<Class<?>> m2Services = List.of(
                VNPayDepositService.class,
                ReceptionistOperationService.class,
                RetreatBookingService.class
        );

        for (Class<?> serviceClass : m2Services) {
            // Check fields
            for (Field field : serviceClass.getDeclaredFields()) {
                String typeName = field.getType().getName();
                String simpleName = field.getType().getSimpleName();

                assertFalse(simpleName.equals("PaymentTransactionRepository"),
                        serviceClass.getSimpleName() + " must NOT declare PaymentTransactionRepository field: " + field.getName());
                assertFalse(simpleName.equals("PaymentTransactionEntity"),
                        serviceClass.getSimpleName() + " must NOT declare PaymentTransactionEntity field: " + field.getName());
                assertFalse(typeName.startsWith("com.heavenstay.hswrms.m5billing.repository"),
                        serviceClass.getSimpleName() + " must NOT depend on M5 internal repository: " + typeName);
                assertFalse(typeName.startsWith("com.heavenstay.hswrms.m5billing.entity"),
                        serviceClass.getSimpleName() + " must NOT depend on M5 internal entity: " + typeName);
            }

            // Check constructors
            for (Constructor<?> ctor : serviceClass.getConstructors()) {
                for (Class<?> paramType : ctor.getParameterTypes()) {
                    String simpleName = paramType.getSimpleName();
                    String paramTypeName = paramType.getName();

                    assertFalse(simpleName.equals("PaymentTransactionRepository"),
                            serviceClass.getSimpleName() + " constructor must NOT accept PaymentTransactionRepository");
                    assertFalse(simpleName.equals("PaymentTransactionEntity"),
                            serviceClass.getSimpleName() + " constructor must NOT accept PaymentTransactionEntity");
                    assertFalse(paramTypeName.startsWith("com.heavenstay.hswrms.m5billing.repository"),
                            serviceClass.getSimpleName() + " constructor must NOT accept M5 repository: " + paramTypeName);
                }
            }
        }
    }

    @Test
    @DisplayName("APP-04 Architecture Guard: All three M2 services must declare dependency on PaymentTransactionPort")
    void testM2ServicesDependOnPaymentTransactionPort() {
        List<Class<?>> m2Services = List.of(
                VNPayDepositService.class,
                ReceptionistOperationService.class,
                RetreatBookingService.class
        );

        for (Class<?> serviceClass : m2Services) {
            boolean hasPortField = Arrays.stream(serviceClass.getDeclaredFields())
                    .anyMatch(f -> f.getType().equals(PaymentTransactionPort.class));
            assertTrue(hasPortField, serviceClass.getSimpleName() + " must declare field of type PaymentTransactionPort");

            boolean hasPortCtorParam = Arrays.stream(serviceClass.getConstructors())
                    .anyMatch(ctor -> Arrays.stream(ctor.getParameterTypes())
                            .anyMatch(pt -> pt.equals(PaymentTransactionPort.class)));
            assertTrue(hasPortCtorParam, serviceClass.getSimpleName() + " must have a constructor accepting PaymentTransactionPort");
        }
    }
}

