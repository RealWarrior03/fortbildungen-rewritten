function normalizeGroupName(value) {
  return String(value || '').trim().toLowerCase();
}

function userHasAdminRole(userData) {
  const roles = Array.isArray(userData?.roles) ? userData.roles : [];
  return roles.includes('admin');
}

function getNormalizedUserGroups(userData) {
  const groups = Array.isArray(userData?.groups) ? userData.groups : [];
  return groups.map(normalizeGroupName).filter(Boolean);
}

function canUserAccessCourseByGroup(userData, courseAdGroup) {
  if (userHasAdminRole(userData)) {
    return true;
  }

  const normalizedCourseGroup = normalizeGroupName(courseAdGroup);
  if (!normalizedCourseGroup) {
    return false;
  }

  const userGroups = getNormalizedUserGroups(userData);
  return userGroups.includes(normalizedCourseGroup);
}

function buildCourseAccessWhere(userData, groupColumnSql = 'ad_group') {
  if (userHasAdminRole(userData)) {
    return {
      whereSql: '1 = 1',
      params: []
    };
  }

  const userGroups = getNormalizedUserGroups(userData);
  if (userGroups.length === 0) {
    return {
      whereSql: '1 = 0',
      params: []
    };
  }

  const placeholders = userGroups.map(() => '?').join(', ');
  return {
    whereSql: `LOWER(TRIM(COALESCE(${groupColumnSql}, ''))) IN (${placeholders})`,
    params: userGroups
  };
}

module.exports = {
  normalizeGroupName,
  userHasAdminRole,
  canUserAccessCourseByGroup,
  buildCourseAccessWhere
};
