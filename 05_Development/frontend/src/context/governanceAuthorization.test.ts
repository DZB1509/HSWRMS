import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isCapabilityAuthorized, isPermissionAuthorized } from './governanceAuthorization.ts';

describe('backend governance capability authorization', () => {
  it('denies access while effective permissions are loading', () => {
    assert.equal(isCapabilityAuthorized('admin', 'admin', 'S52:V', null, 'loading'), false);
  });

  it('denies access when permission loading fails', () => {
    assert.equal(isCapabilityAuthorized('admin', 'admin', 'S52:V', [], 'error'), false);
  });

  it('denies an authenticated user without the required permission', () => {
    assert.equal(isCapabilityAuthorized('admin', 'admin', 'S52:V', ['S50:V'], 'ready'), false);
  });

  it('denies a permission granted to a different role', () => {
    assert.equal(isCapabilityAuthorized('manager', 'admin', 'S52:V', ['S52:V'], 'ready'), false);
  });

  it('allows only the matching role with a backend-loaded permission', () => {
    assert.equal(isCapabilityAuthorized('admin', 'admin', 'S52:V', ['S52:V'], 'ready'), true);
  });

  it('denies capabilities without an explicit backend permission mapping', () => {
    assert.equal(isCapabilityAuthorized('admin', 'admin', undefined, ['S52:V'], 'ready'), false);
  });
});

describe('backend permission-code authorization', () => {
  it('denies cached permission while /auth/me is loading', () => {
    assert.equal(isPermissionAuthorized('S52:V', true, 'loading'), false);
  });

  it('denies permission after /auth/me fails', () => {
    assert.equal(isPermissionAuthorized('S52:V', true, 'error'), false);
  });

  it('allows a permission only after successful backend loading', () => {
    assert.equal(isPermissionAuthorized('S52:V', true, 'ready'), true);
    assert.equal(isPermissionAuthorized('S52:V', false, 'ready'), false);
  });

  it('requires backend-verified S55:V before rendering system overview', () => {
    assert.equal(isPermissionAuthorized('S55:V', true, 'loading'), false);
    assert.equal(isPermissionAuthorized('S55:V', true, 'error'), false);
    assert.equal(isPermissionAuthorized('S55:V', false, 'ready'), false);
    assert.equal(isPermissionAuthorized('S55:V', true, 'ready'), true);
  });

  it('denies an unmapped permission code', () => {
    assert.equal(isPermissionAuthorized(undefined, true, 'ready'), false);
  });
});
