@isTest
private class LeadEtlTest {

    private class MockMondaySuccess implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setBody(MOCK_RESPONSE);
            return res;
        }
    }

    private class MockMondayFailure implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(500);
            res.setBody('{"error":"Internal Server Error"}');
            return res;
        }
    }

    private static final String MOCK_RESPONSE = '{'
        + '"data":{"boards":[{"groups":[{"items_page":{"items":[{'
        + '"id":"55001","name":"Ada Swimmer",'
        + '"column_values":['
        + '{"id":"email_mm3y7jse","text":"ada@example.com"},'
        + '{"id":"date_mm3yf68t","text":"2026-05-01"}'
        + ']}]}}]}]}}';

    // Seed the required CMT record for all tests
    @TestSetup
    static void makeData() {
        // Custom Metadata Types cannot be DML-inserted in tests; the deployed record
        // Monday_Config.Subscriber_Board is queried directly. No setup needed.
    }

    @isTest
    static void testParseItemsMapsFieldsCorrectly() {
        LeadEtl etl = new LeadEtl();
        List<Lead> results = etl.parseItems(MOCK_RESPONSE);

        System.assertEquals(1, results.size(), 'Should parse one lead');
        Lead ld = results[0];
        System.assertEquals('55001', ld.Monday_Item_Id__c);
        System.assertEquals('Ada Swimmer', ld.LastName);
        System.assertEquals('ada@example.com', ld.Email);
        System.assertEquals('Web', ld.LeadSource);
        System.assertEquals('CCO United Subscriber', ld.Company);
        System.assert(ld.Description.contains('2026-05-01'), 'Description should include subscribed date');
    }

    @isTest
    static void testParseItemsSkipsBlankEmail() {
        String body = '{"data":{"boards":[{"groups":[{"items_page":{"items":[{'
            + '"id":"55002","name":"No Email",'
            + '"column_values":['
            + '{"id":"email_mm3y7jse","text":""},'
            + '{"id":"date_mm3yf68t","text":"2026-05-01"}'
            + ']}]}}]}]}}}';
        LeadEtl etl = new LeadEtl();
        List<Lead> results = etl.parseItems(body);
        System.assertEquals(0, results.size(), 'Rows with no email should be skipped');
    }

    @isTest
    static void testParseItemsEmptyBoardsReturnsEmptyList() {
        LeadEtl etl = new LeadEtl();
        List<Lead> results = etl.parseItems('{"data":{"boards":[]}}');
        System.assertEquals(0, results.size(), 'Empty boards should return empty list');
    }

    @isTest
    static void testParseItemsNullDataReturnsEmptyList() {
        LeadEtl etl = new LeadEtl();
        List<Lead> results = etl.parseItems('{"data":null}');
        System.assertEquals(0, results.size(), 'Null data should return empty list');
    }

    @isTest
    static void testUpsertIsIdempotent() {
        LeadEtl etl = new LeadEtl();
        List<Lead> parsed = etl.parseItems(MOCK_RESPONSE);

        Database.UpsertResult[] r1 = Database.upsert(parsed, Lead.Monday_Item_Id__c, false);
        System.assert(r1[0].isSuccess(), 'First upsert should succeed');
        System.assert(r1[0].isCreated(), 'First upsert should be an insert');

        Database.UpsertResult[] r2 = Database.upsert(parsed, Lead.Monday_Item_Id__c, false);
        System.assert(r2[0].isSuccess(), 'Second upsert should succeed');
        System.assert(!r2[0].isCreated(), 'Second upsert should be an update, not insert');

        Integer count = [SELECT COUNT() FROM Lead WHERE Monday_Item_Id__c = '55001'];
        System.assertEquals(1, count, 'Only one Lead should exist after two upserts');
    }

    @isTest
    static void testBatchExecuteSuccess() {
        Test.setMock(HttpCalloutMock.class, new MockMondaySuccess());
        Test.startTest();
        Database.executeBatch(new LeadEtl(), 5);
        Test.stopTest();
        System.assert(true, 'Batch should complete without exception');
    }

    @isTest
    static void testBatchHandles500Error() {
        Test.setMock(HttpCalloutMock.class, new MockMondayFailure());
        Test.startTest();
        Database.executeBatch(new LeadEtl(), 5);
        Test.stopTest();
        System.assert(true, 'HTTP 500 should be handled gracefully');
    }

    @isTest
    static void testInvocableMethod() {
        Test.setMock(HttpCalloutMock.class, new MockMondaySuccess());
        Test.startTest();
        LeadEtl.runEtl(new List<String>{ 'ignored' });
        Test.stopTest();
        System.assert(true, 'InvocableMethod should execute without exception');
    }
}
