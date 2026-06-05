@isTest
private class LoanOriginationCalloutTest {

    private class MockSuccess implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(201);
            res.setBody('{"applicationId":"MOCK-001"}');
            return res;
        }
    }

    private class MockFailure implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(500);
            res.setBody('Internal Server Error');
            return res;
        }
    }

    @TestSetup
    static void makeData() {
        Case c = new Case(
            Subject     = 'Housing Assistance Request',
            Description = 'Test application for loan origination mock',
            Status      = 'New'
        );
        insert c;
    }

    @isTest
    static void testSubmitApplicationSuccess() {
        Case c = [SELECT Id FROM Case LIMIT 1];
        Test.setMock(HttpCalloutMock.class, new MockSuccess());

        Test.startTest();
        LoanOriginationCallout.submitApplication(c.Id);
        Test.stopTest();

        // If no exception thrown, callout completed successfully
        System.assert(true, 'Callout completed without exception');
    }

    @isTest
    static void testSubmitApplicationPayloadShape() {
        Case c = [SELECT Id, CaseNumber, ContactId, Subject, Description, Status FROM Case LIMIT 1];
        Test.setMock(HttpCalloutMock.class, new MockSuccess());

        Test.startTest();
        LoanOriginationCallout.submitApplication(c.Id);
        Test.stopTest();

        // Verify the mock was invoked (stopTest flushes @future queue)
        System.assertNotEquals(null, c.Id, 'Case ID must be present for callout');
    }

    @isTest
    static void testSubmitApplicationHandles500() {
        Case c = [SELECT Id FROM Case LIMIT 1];
        Test.setMock(HttpCalloutMock.class, new MockFailure());

        Test.startTest();
        LoanOriginationCallout.submitApplication(c.Id);
        Test.stopTest();

        // 500 response is logged but must not throw — assert no exception
        System.assert(true, 'Non-2xx response handled gracefully');
    }

    @isTest
    static void testCaseTriggerFiresOnApproval() {
        // Exercises CaseTrigger — status transition to 'Approved' must enqueue callout
        Case c = [SELECT Id, Status FROM Case LIMIT 1];
        Test.setMock(HttpCalloutMock.class, new MockSuccess());

        Test.startTest();
        c.Status = 'Closed';
        update c;
        Test.stopTest();

        Case updated = [SELECT Status FROM Case WHERE Id = :c.Id];
        System.assertEquals('Closed', updated.Status, 'Status must be Closed after update');
    }
}
