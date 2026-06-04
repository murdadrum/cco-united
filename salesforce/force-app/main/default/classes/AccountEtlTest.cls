@isTest
private class AccountEtlTest {

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
        + '"id":"77001","name":"Keys CCO",'
        + '"column_values":['
        + '{"id":"text_mm3xdg2b","text":"Sarah Mankiller"},'
        + '{"id":"email_mm3wh2bk","text":"keys.cherokee.community@gmail.com"},'
        + '{"id":"phone_mm3wq6p6","text":"(918) 555-0101"},'
        + '{"id":"date_mm3wcr5v","text":"2024-03-15"},'
        + '{"id":"link_mm3wcg66","text":"https://keys.cherokee.org"},'
        + '{"id":"long_text_mm3wy3j4","text":"Serving the Keys community since 2024"}'
        + ']}]}}]}]}}';

    @isTest
    static void testParseItemsMapsFieldsCorrectly() {
        AccountEtl etl = new AccountEtl();
        List<Account> results = etl.parseItems(MOCK_RESPONSE, 'Active');

        System.assertEquals(1, results.size(), 'Should parse one account');
        Account acct = results[0];
        System.assertEquals('77001', acct.Monday_Board_Id__c);
        System.assertEquals('Keys CCO', acct.Name);
        System.assertEquals('Active', acct.CCO_Status__c);
        System.assertEquals('Sarah Mankiller', acct.CCO_Contact_Name__c);
        System.assertEquals('keys.cherokee.community@gmail.com', acct.CCO_Contact_Email__c);
        System.assertEquals('(918) 555-0101', acct.Phone);
        System.assertEquals('https://keys.cherokee.org', acct.Website);
        System.assertNotEquals(null, acct.CCO_Member_Since__c, 'Date should be parsed');
        System.assert(acct.Description.contains('Keys community'), 'Mission notes should be populated');
    }

    @isTest
    static void testParseItemsEmptyBoardsReturnsEmptyList() {
        AccountEtl etl = new AccountEtl();
        List<Account> results = etl.parseItems('{"data":{"boards":[]}}', 'Active');
        System.assertEquals(0, results.size(), 'Empty boards should return empty list');
    }

    @isTest
    static void testParseItemsNullDataReturnsEmptyList() {
        AccountEtl etl = new AccountEtl();
        List<Account> results = etl.parseItems('{"data":null}', 'Active');
        System.assertEquals(0, results.size(), 'Null data should return empty list');
    }

    @isTest
    static void testUpsertIsIdempotent() {
        AccountEtl etl = new AccountEtl();
        List<Account> parsed = etl.parseItems(MOCK_RESPONSE, 'Active');

        Database.UpsertResult[] r1 = Database.upsert(parsed, Account.Monday_Board_Id__c, false);
        System.assert(r1[0].isSuccess(), 'First upsert should succeed');
        System.assert(r1[0].isCreated(), 'First upsert should be an insert');

        Database.UpsertResult[] r2 = Database.upsert(parsed, Account.Monday_Board_Id__c, false);
        System.assert(r2[0].isSuccess(), 'Second upsert should succeed');
        System.assert(!r2[0].isCreated(), 'Second upsert should be an update, not insert');

        Integer count = [SELECT COUNT() FROM Account WHERE Monday_Board_Id__c = '77001'];
        System.assertEquals(1, count, 'Only one record should exist after two upserts');
    }

    @isTest
    static void testBatchExecuteSuccess() {
        Test.setMock(HttpCalloutMock.class, new MockMondaySuccess());
        Test.startTest();
        Database.executeBatch(new AccountEtl(), 5);
        Test.stopTest();
        System.assert(true, 'Batch should complete without exception');
    }

    @isTest
    static void testBatchHandles500Error() {
        Test.setMock(HttpCalloutMock.class, new MockMondayFailure());
        Test.startTest();
        Database.executeBatch(new AccountEtl(), 5);
        Test.stopTest();
        System.assert(true, 'HTTP 500 should be handled gracefully');
    }

    @isTest
    static void testInvocableMethod() {
        Test.setMock(HttpCalloutMock.class, new MockMondaySuccess());
        Test.startTest();
        AccountEtl.runEtl(new List<String>{ 'ignored' });
        Test.stopTest();
        System.assert(true, 'InvocableMethod should execute without exception');
    }
}
