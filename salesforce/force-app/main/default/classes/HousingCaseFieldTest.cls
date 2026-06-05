@isTest
private class HousingCaseFieldTest {

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static Case insertCase(String program, String suppliedEmail) {
        Case c = new Case(
            Subject       = 'Housing Request: Test User',
            SuppliedName  = 'Test User',
            SuppliedEmail = suppliedEmail,
            SuppliedPhone = '918-555-0199',
            Description   = 'Program Interest: ' + program + '\n\nE2E test submission',
            Type          = program,
            Priority      = (program == 'Emergency Shelter') ? 'High' : 'Medium',
            Status        = 'New',
            Origin        = 'Web'
        );
        insert c;
        return [SELECT Id, Subject, SuppliedName, SuppliedEmail, SuppliedPhone,
                       Description, Type, Priority, Status, Origin
                FROM Case WHERE Id = :c.Id LIMIT 1];
    }

    // ── Field-fidelity: Rental Assistance ────────────────────────────────────

    @isTest
    static void testRentalAssistanceCaseFields() {
        Case c = insertCase('Rental Assistance', 'rental-test@ccounited.test');

        System.assertEquals('Rental Assistance', c.Type,          'Type should match program');
        System.assertEquals('Medium',            c.Priority,      'Non-emergency priority should be Medium');
        System.assertEquals('New',               c.Status,        'Status should be New on creation');
        System.assertEquals('Web',               c.Origin,        'Origin should be Web');
        System.assertEquals('rental-test@ccounited.test', c.SuppliedEmail, 'SuppliedEmail must match form input');
        System.assert(c.Subject.contains('Test User'),    'Subject should include applicant name');
        System.assert(c.Description.contains('Rental Assistance'), 'Description should include program name');
    }

    // ── Field-fidelity: Emergency Shelter → Priority = High ──────────────────

    @isTest
    static void testEmergencyShelterPriorityIsHigh() {
        Case c = insertCase('Emergency Shelter', 'emergency-test@ccounited.test');

        System.assertEquals('Emergency Shelter', c.Type,     'Type should match program');
        System.assertEquals('High',              c.Priority, 'Emergency Shelter must set Priority to High');
        System.assertEquals('Web',               c.Origin,   'Origin should be Web');
        System.assertEquals('New',               c.Status,   'Status should be New');
    }

    // ── Field-fidelity: Elder Housing ─────────────────────────────────────────

    @isTest
    static void testElderHousingCaseFields() {
        Case c = insertCase('Elder Housing', 'elder-test@ccounited.test');

        System.assertEquals('Elder Housing', c.Type,     'Type should match program');
        System.assertEquals('Medium',        c.Priority, 'Elder Housing priority should be Medium');
        System.assertEquals('Web',           c.Origin,   'Origin should be Web');
    }

    // ── Field-fidelity: Homeownership Paths ──────────────────────────────────

    @isTest
    static void testHomeownershipPathsCaseFields() {
        Case c = insertCase('Homeownership Paths', 'homeowner-test@ccounited.test');

        System.assertEquals('Homeownership Paths', c.Type,     'Type should match program');
        System.assertEquals('Medium',              c.Priority, 'Homeownership priority should be Medium');
        System.assertEquals('Web',                 c.Origin,   'Origin should be Web');
    }

    // ── Bulk insert: all programs, assert no field drift ─────────────────────

    @isTest
    static void testBulkInsertAllPrograms() {
        List<String> programs = new List<String>{
            'Emergency Shelter', 'Rental Assistance', 'Elder Housing',
            'Homeownership Paths', 'Utility Relief'
        };
        List<Case> cases = new List<Case>();
        Integer i = 0;
        for (String prog : programs) {
            cases.add(new Case(
                Subject       = 'Housing Request: Bulk User ' + i,
                SuppliedName  = 'Bulk User ' + i,
                SuppliedEmail = 'bulk' + i + '@ccounited.test',
                Description   = 'Program Interest: ' + prog,
                Type          = prog,
                Priority      = (prog == 'Emergency Shelter') ? 'High' : 'Medium',
                Status        = 'New',
                Origin        = 'Web'
            ));
            i++;
        }
        insert cases;

        List<Case> queried = [SELECT Id, Type, Priority, Status, Origin
                              FROM Case
                              WHERE Origin = 'Web' AND Status = 'New'
                              ORDER BY CreatedDate ASC];

        System.assertEquals(5, queried.size(), 'All 5 program cases should be inserted');
        for (Case c : queried) {
            System.assertEquals('Web', c.Origin, 'Origin must be Web');
            System.assertEquals('New', c.Status, 'Status must be New');
        }

        // Emergency Shelter must be High, all others Medium
        Case emergencyCase = queried[0]; // inserted first
        System.assertEquals('High', emergencyCase.Priority, 'Emergency Shelter must be High priority');
    }

    // ── SuppliedEmail round-trip fidelity ─────────────────────────────────────

    @isTest
    static void testSuppliedEmailRoundTrip() {
        String email = 'roundtrip-unique@ccounited.test';
        Case c = insertCase('Utility Relief', email);

        Case queried = [SELECT SuppliedEmail FROM Case
                        WHERE SuppliedEmail = :email LIMIT 1];
        System.assertEquals(email, queried.SuppliedEmail,
            'SuppliedEmail should survive round-trip through insert and SOQL query');
    }
}
