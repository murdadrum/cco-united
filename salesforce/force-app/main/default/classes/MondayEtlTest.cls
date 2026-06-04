@isTest
private class MondayEtlTest {

    // ── Mock HTTP responses ──────────────────────────────────────
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

    // Valid Monday API response: data > boards[] > groups[] > items_page > items[] > column_values[]
    private static final String MOCK_RESPONSE = '{'
        + '"data":{"boards":[{"groups":[{"items_page":{"items":[{'
        + '"id":"99001","name":"Ribbon Cutting Ceremony",'
        + '"column_values":['
        + '{"id":"date_mm3wkeye","text":"2026-08-15"},'
        + '{"id":"dropdown_mm3wv6ax","text":"Keys CCO"},'
        + '{"id":"location_mm3wrcrr","text":"Tahlequah, OK"},'
        + '{"id":"dropdown_mm3w9yyc","text":"Ribbon Cutting"},'
        + '{"id":"boolean_mm3wsfmn","text":"true"},'
        + '{"id":"long_text_mm3wd4nk","text":"Ribbon cutting for new Keys CCO facility"},'
        + '{"id":"text_mm3w87h6","text":"Josh Barteaux"},'
        + '{"id":"email_mm3w2zs6","text":"josh@joshbarteaux.com"}'
        + ']}]}}]}]}}';

    // ── parseItems unit tests (no callout) ───────────────────────
    @isTest
    static void testParseItemsMapsFieldsCorrectly() {
        MondayEtl etl = new MondayEtl();
        List<Event__c> results = etl.parseItems(MOCK_RESPONSE, 'Approved');

        System.assertEquals(1, results.size(), 'Should parse one event');
        Event__c ev = results[0];
        System.assertEquals('99001', ev.Monday_Item_Id__c);
        System.assertEquals('Ribbon Cutting Ceremony', ev.Name);
        System.assertEquals('Approved', ev.Status__c);
        System.assertEquals(true, ev.Is_Public__c);
        System.assertEquals('Tahlequah, OK', ev.Location__c);
        System.assertEquals('Ribbon Cutting', ev.Event_Type__c);
        System.assertEquals('Josh Barteaux', ev.Submitted_By__c);
        System.assertEquals('josh@joshbarteaux.com', ev.Submitter_Email__c);
        System.assertNotEquals(null, ev.Event_Date__c, 'Date should be parsed');
    }

    @isTest
    static void testParseItemsEmptyBoardsReturnsEmptyList() {
        MondayEtl etl = new MondayEtl();
        List<Event__c> results = etl.parseItems('{"data":{"boards":[]}}', 'Approved');
        System.assertEquals(0, results.size(), 'Empty boards should return empty list');
    }

    @isTest
    static void testParseItemsNullDataReturnsEmptyList() {
        MondayEtl etl = new MondayEtl();
        List<Event__c> results = etl.parseItems('{"data":null}', 'Approved');
        System.assertEquals(0, results.size(), 'Null data should return empty list');
    }

    // ── Upsert idempotency via parseItems + Database.upsert ─────
    @isTest
    static void testUpsertIsIdempotent() {
        MondayEtl etl = new MondayEtl();
        List<Event__c> parsed = etl.parseItems(MOCK_RESPONSE, 'Approved');

        Database.UpsertResult[] r1 = Database.upsert(parsed, Event__c.Monday_Item_Id__c, false);
        System.assert(r1[0].isSuccess(), 'First upsert should succeed');
        System.assert(r1[0].isCreated(), 'First upsert should be an insert');

        Database.UpsertResult[] r2 = Database.upsert(parsed, Event__c.Monday_Item_Id__c, false);
        System.assert(r2[0].isSuccess(), 'Second upsert should succeed');
        System.assert(!r2[0].isCreated(), 'Second upsert should be an update, not insert');

        Integer count = [SELECT COUNT() FROM Event__c WHERE Monday_Item_Id__c = '99001'];
        System.assertEquals(1, count, 'Only one record should exist after two upserts');
    }

    // ── Full batch flow with mock HTTP ───────────────────────────
    @isTest
    static void testBatchExecuteSuccess() {
        Test.setMock(HttpCalloutMock.class, new MockMondaySuccess());
        Test.startTest();
        Database.executeBatch(new MondayEtl(), 5);
        Test.stopTest();
        System.assert(true, 'Batch should complete without exception');
    }

    @isTest
    static void testBatchHandles500Error() {
        Test.setMock(HttpCalloutMock.class, new MockMondayFailure());
        Test.startTest();
        Database.executeBatch(new MondayEtl(), 5);
        Test.stopTest();
        System.assert(true, 'HTTP 500 error should be handled gracefully without exception');
    }

    @isTest
    static void testInvocableMethod() {
        Test.setMock(HttpCalloutMock.class, new MockMondaySuccess());
        Test.startTest();
        MondayEtl.runEtl(new List<String>{ 'ignored' });
        Test.stopTest();
        System.assert(true, 'InvocableMethod should execute without exception');
    }

    @isTest
    static void testSchedulerExecutes() {
        Test.setMock(HttpCalloutMock.class, new MockMondaySuccess());
        Test.startTest();
        MondayEtlScheduler scheduler = new MondayEtlScheduler();
        scheduler.execute(null);
        Test.stopTest();
        System.assert(true, 'Scheduler should execute without exception');
    }

    @isTest
    static void testSchedulerSchedule() {
        Test.setMock(HttpCalloutMock.class, new MockMondaySuccess());
        Test.startTest();
        MondayEtlScheduler.schedule();
        Test.stopTest();
        List<CronTrigger> jobs = [SELECT Id FROM CronTrigger WHERE CronJobDetail.Name = 'Monday ETL Daily'];
        System.assertNotEquals(0, jobs.size(), 'Scheduled job should be created');
    }
}
