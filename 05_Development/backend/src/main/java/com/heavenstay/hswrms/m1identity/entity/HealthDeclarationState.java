package com.heavenstay.hswrms.m1identity.entity;

/**
 * Explicit declaration states for customer health profile sections
 * (e.g., food allergies, dietary requirements).
 *
 * NOT_DECLARED       : The customer has not yet completed/answered this section.
 * EXPLICITLY_NONE    : The customer explicitly confirmed having no allergies or dietary requirements.
 * DECLARED           : The customer declared one or more specific items.
 */
public enum HealthDeclarationState {
    NOT_DECLARED,
    EXPLICITLY_NONE,
    DECLARED
}
