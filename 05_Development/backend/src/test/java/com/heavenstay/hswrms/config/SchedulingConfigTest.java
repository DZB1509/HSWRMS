package com.heavenstay.hswrms.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.annotation.ScheduledAnnotationBeanPostProcessor;

import static org.assertj.core.api.Assertions.assertThat;

class SchedulingConfigTest {
    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withUserConfiguration(SchedulingConfig.class, ProbeConfiguration.class);

    @Test
    void schedulingIsEnabledWhenPropertyIsAbsent() {
        runner.run(context -> assertThat(context.getBean(ScheduledAnnotationBeanPostProcessor.class)
                .getScheduledTasks()).hasSize(1));
    }

    @Test
    void schedulingIsEnabledWhenPropertyIsTrue() {
        runner.withPropertyValues("app.scheduling.enabled=true").run(context ->
                assertThat(context.getBean(ScheduledAnnotationBeanPostProcessor.class)
                        .getScheduledTasks()).hasSize(1));
    }

    @Test
    void schedulingIsNotRegisteredWhenPropertyIsFalse() {
        runner.withPropertyValues("app.scheduling.enabled=false").run(context ->
                assertThat(context).doesNotHaveBean(ScheduledAnnotationBeanPostProcessor.class));
    }

    @Configuration(proxyBeanMethods = false)
    static class ProbeConfiguration {
        @Bean
        ScheduledProbe scheduledProbe() {
            return new ScheduledProbe();
        }
    }

    static class ScheduledProbe {
        @Scheduled(fixedRate = 3_600_000, initialDelay = 3_600_000)
        void scheduledMethod() {
            // Delayed far beyond the test lifetime; registration is what this test measures.
        }
    }
}
