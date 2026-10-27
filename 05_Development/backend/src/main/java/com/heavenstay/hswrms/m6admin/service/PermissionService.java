package com.heavenstay.hswrms.m6admin.service;

import com.heavenstay.hswrms.m6admin.entity.RightDelegation;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

/**
 * Resolves effective permissions: (role permissions) UNION (permissions of delegations that are currently valid).
 * Evaluated against the database on every protected request, so matrix edits and delegation revocations
 * take effect immediately (AC-01, AC-02).
 */
@Service
public class PermissionService {

    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public Set<String> effectiveCodes(Integer userId) {
        Set<String> codes = new TreeSet<>(rolePermissionCodes(userId));
        codes.addAll(delegatedPermissionCodes(userId));
        return codes;
    }

    @Transactional(readOnly = true)
    public boolean userHas(Integer userId, String module, String action) {
        return effectiveCodes(userId).contains(module + ":" + action);
    }

    @Transactional(readOnly = true)
    public Set<String> rolePermissionCodes(Integer userId) {
        List<Object[]> rows = em.createQuery(
                        "select p.moduleOrScreen, p.actionType from Permission p where p.permissionId in ("
                                + "select rp.id.permissionId from RolePermission rp where rp.id.roleId in ("
                                + "select ur.id.roleId from UserRole ur where ur.id.userId = :uid))",
                        Object[].class)
                .setParameter("uid", userId)
                .getResultList();
        return toCodes(rows);
    }

    @Transactional(readOnly = true)
    public Set<String> delegatedPermissionCodes(Integer userId) {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        List<Object[]> rows = em.createQuery(
                        "select p.moduleOrScreen, p.actionType from Permission p where p.permissionId in ("
                                + "select dp.id.permissionId from RightDelegationPermission dp where dp.id.delegationId in ("
                                + "select d.delegationId from RightDelegation d "
                                + "where d.receivedByManagerUserId = :uid and d.delegationStatus = :active "
                                + "and d.validFrom <= :now and d.validUntil >= :now))",
                        Object[].class)
                .setParameter("uid", userId)
                .setParameter("active", RightDelegation.ACTIVE)
                .setParameter("now", now)
                .getResultList();
        return toCodes(rows);
    }

    private static Set<String> toCodes(List<Object[]> rows) {
        Set<String> out = new TreeSet<>();
        for (Object[] row : rows) {
            out.add(row[0] + ":" + row[1]);
        }
        return out;
    }
}
