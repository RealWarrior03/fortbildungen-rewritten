const { Client } = require('ldapts');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

function escapeLdapFilter(value) {
  return String(value)
    .replace(/\\/g, '\\5c')
    .replace(/\*/g, '\\2a')
    .replace(/\(/g, '\\28')
    .replace(/\)/g, '\\29')
    .replace(/\x00/g, '\\00');
}

function normalizeList(value) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function extractCnFromDn(dn) {
  const match = /^CN=([^,]+)/i.exec(String(dn || ''));
  return match ? match[1].toLowerCase() : '';
}

function normalizeMemberOf(memberOf) {
  if (Array.isArray(memberOf)) {
    return memberOf.map((entry) => String(entry));
  }

  if (!memberOf) {
    return [];
  }

  return [String(memberOf)];
}

function buildUserPrincipalName(username) {
  if (String(username).includes('@')) {
    return String(username);
  }

  if (process.env.AD_DOMAIN) {
    return `${username}@${process.env.AD_DOMAIN}`;
  }

  return String(username);
}

function extractSamAccountName(username) {
  const raw = String(username || '').trim();

  if (raw.includes('\\')) {
    return raw.split('\\').pop();
  }

  if (raw.includes('@')) {
    return raw.split('@')[0];
  }

  return raw;
}

function buildDownLevelLogonName(username) {
  if (String(username).includes('\\')) {
    return String(username);
  }

  if (!process.env.AD_NETBIOS_DOMAIN) {
    return '';
  }

  return `${process.env.AD_NETBIOS_DOMAIN}\\${username}`;
}

function uniq(values) {
  return [...new Set(values.filter(Boolean).map((entry) => String(entry).trim()).filter(Boolean))];
}

function adDebugEnabled() {
  return String(process.env.AD_DEBUG || '').toLowerCase() === 'true';
}

function adDebugLog(message, meta = {}) {
  if (!adDebugEnabled()) {
    return;
  }

  console.log('[AD-DEBUG]', message, meta);
}

function parseAdSubCode(error) {
  const message = String((error && error.message) || '');
  const match = message.match(/data\s+([0-9a-f]+)/i);
  return match ? match[1].toLowerCase() : '';
}

function mapAdSubCodeToMessage(subCode) {
  const messages = {
    '52e': 'ungueltige Anmeldedaten (Benutzername/Passwort)',
    '525': 'Benutzer nicht gefunden',
    '530': 'Anmeldung zu dieser Zeit nicht erlaubt',
    '531': 'Anmeldung von dieser Workstation nicht erlaubt',
    '532': 'Passwort abgelaufen',
    '533': 'Konto deaktiviert',
    '701': 'Konto abgelaufen',
    '773': 'Passwort muss geaendert werden',
    '775': 'Konto gesperrt'
  };

  return messages[subCode] || 'Anmeldung fehlgeschlagen';
}

function buildInitialBindCandidates(username) {
  const samAccountName = extractSamAccountName(username);

  return uniq([
    String(username || '').trim(),
    buildUserPrincipalName(samAccountName),
    buildDownLevelLogonName(samAccountName),
    samAccountName
  ]);
}

async function tryBindWithCandidates(client, password, candidates) {
  let lastBindError = null;

  for (const identity of uniq(candidates)) {
    try {
      adDebugLog('Trying bind identity', { identity });
      await client.bind(identity, password);
      adDebugLog('Bind succeeded', { identity });
      return identity;
    } catch (bindError) {
      adDebugLog('Bind failed', { identity, code: bindError.code });
      lastBindError = bindError;
    }
  }

  throw lastBindError || new Error('LDAP-Bind fehlgeschlagen');
}

function isInAdminGroup(memberOfDns) {
  const configuredGroups = normalizeList(process.env.AD_ADMIN_GROUPS);
  if (configuredGroups.length === 0) {
    return false;
  }

  const groupDns = memberOfDns.map((dn) => dn.toLowerCase());
  const groupCns = memberOfDns.map(extractCnFromDn).filter(Boolean);

  return configuredGroups.some((configuredGroup) => {
    return groupDns.includes(configuredGroup) || groupCns.includes(configuredGroup);
  });
}

async function authenticateAdmin(username, password) {
  if (!process.env.AD_ADMIN_GROUPS) {
    const error = new Error('AD_ADMIN_GROUPS ist nicht gesetzt');
    error.status = 500;
    throw error;
  }

  const user = await authenticateDirectoryUser(username, password);
  const memberOfDns = normalizeMemberOf(user.memberOf);

  if (!isInAdminGroup(memberOfDns)) {
    const error = new Error('Keine Berechtigung: AD-Gruppe fehlt');
    error.status = 403;
    throw error;
  }

  const groups = memberOfDns.map(extractCnFromDn).filter(Boolean);

  return {
    username: String(user.sAMAccountName || extractSamAccountName(username)),
    displayName: String(user.displayName || user.sAMAccountName || extractSamAccountName(username)),
    email: String(user.mail || ''),
    userPrincipalName: String(user.userPrincipalName || buildUserPrincipalName(extractSamAccountName(username))),
    groups
  };
}

async function authenticateUser(username, password) {
  const user = await authenticateDirectoryUser(username, password);
  const groups = normalizeMemberOf(user.memberOf).map(extractCnFromDn).filter(Boolean);

  return {
    username: String(user.sAMAccountName || extractSamAccountName(username)),
    displayName: String(user.displayName || user.sAMAccountName || extractSamAccountName(username)),
    email: String(user.mail || ''),
    userPrincipalName: String(user.userPrincipalName || buildUserPrincipalName(extractSamAccountName(username))),
    groups
  };
}

async function authenticateDirectoryUser(username, password) {
  if (!process.env.AD_URL || !process.env.AD_BASE_DN) {
    const error = new Error('AD ist nicht korrekt konfiguriert (AD_URL / AD_BASE_DN fehlen)');
    error.status = 500;
    throw error;
  }

  const samAccountName = extractSamAccountName(username);
  const userPrincipalName = buildUserPrincipalName(samAccountName);
  const client = new Client({
    url: process.env.AD_URL,
    timeout: 10000,
    connectTimeout: 10000
  });

  try {
    const bindDn = process.env.AD_BIND_DN;
    const bindPassword = process.env.AD_BIND_PASSWORD;
    let searchBoundAsServiceAccount = false;

    if (bindDn && bindPassword) {
      adDebugLog('Binding with service account', { bindDn });
      try {
        await client.bind(bindDn, bindPassword);
        searchBoundAsServiceAccount = true;
      } catch (serviceBindError) {
        if (serviceBindError && Number(serviceBindError.code) === 49) {
          const subCode = parseAdSubCode(serviceBindError);
          adDebugLog('Service account bind failed, fallback to direct user bind', {
            subCode,
            bindDn
          });

          const initialCandidates = buildInitialBindCandidates(username);
          adDebugLog('Trying direct user bind candidates after service bind failure', {
            candidates: initialCandidates
          });
          await tryBindWithCandidates(client, password, initialCandidates);
          searchBoundAsServiceAccount = false;
        } else {
          throw serviceBindError;
        }
      }
    } else {
      const initialCandidates = buildInitialBindCandidates(username);
      adDebugLog('Binding without service account', { candidates: initialCandidates });
      await tryBindWithCandidates(client, password, initialCandidates);
    }

    const escapedUsername = escapeLdapFilter(samAccountName);
    const escapedUpn = escapeLdapFilter(userPrincipalName);

    const { searchEntries } = await client.search(process.env.AD_BASE_DN, {
      scope: 'sub',
      filter: `(&(objectClass=user)(|(sAMAccountName=${escapedUsername})(userPrincipalName=${escapedUpn})))`,
      attributes: ['dn', 'distinguishedName', 'sAMAccountName', 'displayName', 'mail', 'userPrincipalName', 'memberOf']
    });

    adDebugLog('Search completed', { resultCount: searchEntries.length, samAccountName, userPrincipalName });

    if (searchEntries.length === 0) {
      const error = new Error('Benutzer nicht im Active Directory gefunden');
      error.status = 401;
      throw error;
    }

    const user = searchEntries[0];

    if (searchBoundAsServiceAccount) {
      const discoveredUpn = String(user.userPrincipalName || '').trim();
      const discoveredDn = String(user.dn || user.distinguishedName || '').trim();
      const discoveredSam = String(user.sAMAccountName || samAccountName).trim();
      const downLevelName = buildDownLevelLogonName(discoveredSam);
      const fallbackUpn = buildUserPrincipalName(discoveredSam);
      const originalInput = String(username || '').trim();

      const candidateIdentities = [
        originalInput,
        discoveredUpn,
        discoveredDn,
        downLevelName,
        fallbackUpn,
        discoveredSam
      ].filter(Boolean);

      try {
        adDebugLog('Trying user credential bind after directory lookup', { candidates: candidateIdentities });
        await tryBindWithCandidates(client, password, candidateIdentities);
      } catch (lastBindError) {
        if (lastBindError && Number(lastBindError.code) === 49) {
          const subCode = parseAdSubCode(lastBindError);
          const hint = mapAdSubCodeToMessage(subCode);
          const authError = new Error(`AD-Anmeldung fehlgeschlagen: ${hint}${subCode ? ` (AD data ${subCode})` : ''}.`);
          authError.status = 401;
          throw authError;
        }

        throw lastBindError;
      }
    }

    return user;
  } catch (error) {
    if (error && Number(error.code) === 49) {
      const subCode = parseAdSubCode(error);
      const hint = mapAdSubCodeToMessage(subCode);
      adDebugLog('LDAP bind failed with code 49', { subCode, rawMessage: String(error.message || '') });
      const authError = new Error(`AD-Anmeldung fehlgeschlagen: ${hint}${subCode ? ` (AD data ${subCode})` : ''}.`);
      authError.status = 401;
      throw authError;
    }

    throw error;
  } finally {
    try {
      await client.unbind();
    } catch (unbindError) {
      // Ignore unbind errors to avoid masking the root cause.
    }
  }
}

module.exports = {
  authenticateAdmin,
  authenticateUser
};