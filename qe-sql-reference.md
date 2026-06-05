# SQL & SOQL Reference — CCO United / Salesforce QA
# Sr QA Engineer (Salesforce) — backend data validation patterns
# Tied to: Event__c, Account, Lead, Case, ETL reconciliation harness

# ─────────────────────────────────────────────────────────────────────
# SECTION 1 — SOQL: Count & Aggregate Validation
# Purpose: ETL CI gate — prove the migration landed the right records
# ─────────────────────────────────────────────────────────────────────

# 1a. Total approved public events — compare to Monday source count
SELECT COUNT()
FROM Event__c
WHERE Is_Public__c = TRUE
  AND Status__c = 'Approved';

# 1b. Event count by type — spot-check distribution matches source
SELECT Event_Type__c,
       COUNT(Id) eventCount
FROM Event__c
WHERE Is_Public__c = TRUE
GROUP BY Event_Type__c
ORDER BY COUNT(Id) DESC;

# 1c. Events per CCO organization — validates lookup integrity post-ETL
SELECT CCO_Organization__r.Name orgName,
       COUNT(Id)               eventCount
FROM Event__c
WHERE Is_Public__c = TRUE
GROUP BY CCO_Organization__r.Name
ORDER BY COUNT(Id) DESC;

# 1d. Events landing in each status bucket — mirrors Monday group mapping
SELECT Status__c,
       COUNT(Id) total
FROM Event__c
GROUP BY Status__c;


# ─────────────────────────────────────────────────────────────────────
# SECTION 2 — SOQL: Data Quality & Null Detection
# Purpose: Catch migration defects — missing required fields, bad data
# ─────────────────────────────────────────────────────────────────────

# 2a. Events missing any required field after ETL load
#     Any result here is a FAIL in the reconciliation harness
SELECT Id,
       Name,
       Event_Date__c,
       CCO_Organization__c,
       Event_Type__c,
       Submitted_By__c,
       Submitter_Email__c
FROM Event__c
WHERE Is_Public__c = TRUE
  AND (Event_Date__c         = NULL
    OR CCO_Organization__c   = NULL
    OR Event_Type__c         = NULL
    OR Submitted_By__c       = NULL)
ORDER BY CreatedDate DESC;

# 2b. Leads (subscribers) missing email — blocks lead conversion
SELECT Id, Name, Email, CreatedDate
FROM Lead
WHERE Email = NULL
  AND LeadSource = 'CCO United Subscribe'
ORDER BY CreatedDate DESC;

# 2c. Cases (housing requests) stuck in New for more than 3 days
#     SLA validation — feeds the Service Cloud defect-density story
SELECT Id,
       Subject,
       Status,
       Priority,
       CreatedDate,
       SuppliedEmail
FROM Case
WHERE Status = 'New'
  AND Type   = 'Housing'
  AND CreatedDate < LAST_N_DAYS:3
ORDER BY CreatedDate ASC;

# 2d. Accounts (CCO Registry) with no related events
#     Detects CCOs that were migrated but have no event data attached
SELECT Id, Name, BillingCity
FROM Account
WHERE Id NOT IN (
    SELECT CCO_Organization__c
    FROM Event__c
    WHERE CCO_Organization__c != NULL
)
ORDER BY Name;


# ─────────────────────────────────────────────────────────────────────
# SECTION 3 — SOQL: Relationship Traversal
# Purpose: Validate parent-child integrity and cross-object joins
# SOQL uses dot notation and subqueries in place of SQL JOINs
# ─────────────────────────────────────────────────────────────────────

# 3a. Parent-to-child: Account with all its related public Events
#     Child relationship name = Events__r (plural + __r suffix)
SELECT Id,
       Name,
       (SELECT Id,
               Name,
               Event_Date__c,
               Event_Type__c,
               Status__c
        FROM Events__r
        WHERE Is_Public__c = TRUE
        ORDER BY Event_Date__c ASC)
FROM Account
WHERE Name LIKE '%Cherokee%'
ORDER BY Name;

# 3b. Child-to-parent: Event with its parent Account fields
#     Dot notation traverses the lookup: CCO_Organization__r.Name
SELECT Id,
       Name,
       Event_Date__c,
       Event_Type__c,
       CCO_Organization__r.Name         AS orgName,
       CCO_Organization__r.BillingCity  AS orgCity
FROM Event__c
WHERE Is_Public__c = TRUE
  AND Status__c = 'Approved'
ORDER BY Event_Date__c ASC;

# 3c. Case with related Contact (Service Cloud — housing requests)
SELECT Id,
       Subject,
       Status,
       Priority,
       Contact.Name,
       Contact.Email
FROM Case
WHERE Type = 'Housing'
  AND Status != 'Closed'
ORDER BY CreatedDate DESC;


# ─────────────────────────────────────────────────────────────────────
# SECTION 4 — SOQL: Duplicate Detection
# Purpose: Data quality gate — catch dupes introduced by the ETL load
# ─────────────────────────────────────────────────────────────────────

# 4a. Duplicate Leads by email address
SELECT Email,
       COUNT(Id) dupeCount
FROM Lead
WHERE Email != NULL
GROUP BY Email
HAVING COUNT(Id) > 1
ORDER BY COUNT(Id) DESC;

# 4b. Duplicate Accounts by name (CCO Registry integrity)
SELECT Name,
       COUNT(Id) dupeCount
FROM Account
WHERE Name != NULL
GROUP BY Name
HAVING COUNT(Id) > 1
ORDER BY COUNT(Id) DESC;

# 4c. Retrieve the actual dupe records for a specific email
#     Run after 4a to get IDs for merge/delete
SELECT Id, Name, Email, LeadSource, CreatedDate
FROM Lead
WHERE Email = 'example@cherokee.org'
ORDER BY CreatedDate ASC;


# ─────────────────────────────────────────────────────────────────────
# SECTION 5 — Standard SQL: Cross-System ETL Reconciliation
# Purpose: Prove Monday source data matches Salesforce target data
# Runs against the staging tables in the ETL pipeline (Node/PostgreSQL)
# This is the "complex SQL for backend data validation" JD centerpiece
# ─────────────────────────────────────────────────────────────────────

# 5a. Side-by-side count: Monday source vs Salesforce target
#     Expected result: both rows show the same record_count
SELECT 'Monday Source'     AS system,
       COUNT(*)            AS record_count
FROM monday_events_staging
WHERE is_public  = TRUE
  AND group_id   = 'group_mm3wn6pa'

UNION ALL

SELECT 'Salesforce Target' AS system,
       COUNT(*)            AS record_count
FROM sf_events_staging
WHERE is_public_c = TRUE
  AND status_c    = 'Approved';


# 5b. CTE — Orphan detection: records in Monday that did NOT land in SF
#     Any row in the result = a migration defect requiring a Jira bug
WITH monday_approved AS (
    SELECT external_id,
           name,
           event_date,
           cco_org,
           event_type
    FROM monday_events_staging
    WHERE status    = 'Approved'
      AND is_public = TRUE
),
sf_migrated AS (
    SELECT monday_external_id AS external_id
    FROM sf_events_staging
    WHERE status_c = 'Approved'
),
orphans AS (
    SELECT m.*
    FROM monday_approved m
    LEFT JOIN sf_migrated s ON m.external_id = s.external_id
    WHERE s.external_id IS NULL
)
SELECT COUNT(*)          AS missing_count,
       MIN(event_date)   AS earliest_missing,
       MAX(event_date)   AS latest_missing
FROM orphans;


# 5c. CTE — Field-level diff: detect value mismatches record by record
#     Surfaces data-transformation bugs (wrong date format, truncation)
WITH comparison AS (
    SELECT m.external_id,
           m.name                                       AS monday_name,
           s.name                                       AS sf_name,
           m.event_date::DATE                           AS monday_date,
           s.event_date_c::DATE                         AS sf_date,
           m.event_type                                 AS monday_type,
           s.event_type_c                               AS sf_type,
           CASE WHEN m.name       != s.name        THEN 'name '       ELSE '' END ||
           CASE WHEN m.event_date != s.event_date_c THEN 'date '      ELSE '' END ||
           CASE WHEN m.event_type != s.event_type_c THEN 'event_type' ELSE '' END
                                                        AS mismatched_fields
    FROM monday_events_staging m
    JOIN sf_events_staging s ON m.external_id = s.monday_external_id
)
SELECT *
FROM comparison
WHERE mismatched_fields != ''
ORDER BY external_id;


# ─────────────────────────────────────────────────────────────────────
# SECTION 6 — SQL: Stored Procedure (PostgreSQL)
# Purpose: Reusable validation function — called by the CI ETL harness
# Pattern: each check returns a row with PASS / FAIL and counts
# ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION validate_event_migration(
    p_expected_count INTEGER
)
RETURNS TABLE (
    check_name      TEXT,
    expected        INTEGER,
    actual          INTEGER,
    result          TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check 1: Total count matches Monday source
    RETURN QUERY
    SELECT
        'Approved Event Count'::TEXT,
        p_expected_count,
        (SELECT COUNT(*)::INTEGER
         FROM sf_events_staging
         WHERE status_c    = 'Approved'
           AND is_public_c = TRUE),
        CASE
            WHEN (SELECT COUNT(*)
                  FROM sf_events_staging
                  WHERE status_c = 'Approved' AND is_public_c = TRUE)
                 = p_expected_count
            THEN 'PASS'
            ELSE 'FAIL'
        END;

    -- Check 2: No orphaned records (missing Monday external ID)
    RETURN QUERY
    SELECT
        'No Orphaned SF Records'::TEXT,
        0,
        (SELECT COUNT(*)::INTEGER
         FROM sf_events_staging
         WHERE monday_external_id IS NULL),
        CASE
            WHEN (SELECT COUNT(*)
                  FROM sf_events_staging
                  WHERE monday_external_id IS NULL) = 0
            THEN 'PASS'
            ELSE 'FAIL'
        END;

    -- Check 3: Required fields fully populated
    RETURN QUERY
    SELECT
        'Required Fields Populated'::TEXT,
        0,
        (SELECT COUNT(*)::INTEGER
         FROM sf_events_staging
         WHERE event_date_c       IS NULL
            OR cco_organization_c IS NULL
            OR event_type_c       IS NULL),
        CASE
            WHEN (SELECT COUNT(*)
                  FROM sf_events_staging
                  WHERE event_date_c       IS NULL
                     OR cco_organization_c IS NULL
                     OR event_type_c       IS NULL) = 0
            THEN 'PASS'
            ELSE 'FAIL'
        END;
END;
$$;

-- Call the function (expected_count comes from the ETL run log)
SELECT * FROM validate_event_migration(p_expected_count := 87)
ORDER BY result DESC;


# ─────────────────────────────────────────────────────────────────────
# SECTION 7 — Apex Anonymous: SF-Side Validation Script
# Purpose: Stored-procedure equivalent run directly against the org
# Run via: sf apex run --file scripts/validate-migration.apex --target-org ccouSF
# ─────────────────────────────────────────────────────────────────────

/*
// scripts/validate-migration.apex

Integer EXPECTED_COUNT = 87; // Update from ETL run log before executing

List<String> failures = new List<String>();

// --- Check 1: Approved public event count ---
Integer sfCount = [
    SELECT COUNT()
    FROM Event__c
    WHERE Is_Public__c = TRUE
      AND Status__c    = 'Approved'
];
System.debug('Event count — expected: ' + EXPECTED_COUNT + ', actual: ' + sfCount);
if (sfCount != EXPECTED_COUNT) {
    failures.add('COUNT MISMATCH: expected ' + EXPECTED_COUNT + ', got ' + sfCount);
}

// --- Check 2: Required fields fully populated ---
List<Event__c> nullFieldRecords = [
    SELECT Id, Name, Event_Date__c, CCO_Organization__c, Event_Type__c
    FROM Event__c
    WHERE Is_Public__c = TRUE
      AND (Event_Date__c       = NULL
        OR CCO_Organization__c = NULL
        OR Event_Type__c       = NULL)
];
if (!nullFieldRecords.isEmpty()) {
    for (Event__c e : nullFieldRecords) {
        failures.add('NULL FIELDS: ' + e.Id + ' — ' + e.Name);
    }
}

// --- Check 3: Duplicate Accounts by name ---
AggregateResult[] dupes = [
    SELECT Name, COUNT(Id) cnt
    FROM Account
    GROUP BY Name
    HAVING COUNT(Id) > 1
];
if (!dupes.isEmpty()) {
    for (AggregateResult ar : dupes) {
        failures.add('DUPE ACCOUNT: ' + ar.get('Name') + ' (' + ar.get('cnt') + ' records)');
    }
}

// --- Report ---
if (failures.isEmpty()) {
    System.debug('✓ ALL CHECKS PASSED — migration validation clean');
} else {
    System.debug('✗ VALIDATION FAILURES (' + failures.size() + '):');
    for (String f : failures) {
        System.debug('  → ' + f);
    }
}
*/


# ─────────────────────────────────────────────────────────────────────
# SECTION 8 — Quick Reference: SOQL vs SQL
# Purpose: Interview talking point — know the differences cold
# ─────────────────────────────────────────────────────────────────────

# SOQL does NOT support:
#   - JOINs (use relationship dot notation and subqueries instead)
#   - Wildcards in SELECT (no SELECT *)
#   - UNION / UNION ALL
#   - INSERT / UPDATE / DELETE (use DML statements in Apex)
#   - Subqueries in WHERE beyond one level deep

# SOQL DOES support:
#   - Relationship traversal:  Contact.Account.Name
#   - Child subqueries:        SELECT Id, (SELECT Id FROM Contacts) FROM Account
#   - Date literals:           WHERE CloseDate = THIS_QUARTER
#   - Semi-join / anti-join:   WHERE Id IN (SELECT ...) / WHERE Id NOT IN (SELECT ...)
#   - Governor limits:         50,000 rows per query, 100 SOQL queries per transaction

# SOSL — Salesforce Object Search Language
#   Use when: searching across multiple objects simultaneously
#   Example: FIND 'Cherokee' IN ALL FIELDS
#            RETURNING Account(Id, Name), Lead(Id, Name, Email)
#   QA use: validate that indexed search returns expected records post-migration
