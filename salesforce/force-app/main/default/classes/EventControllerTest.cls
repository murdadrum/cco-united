@isTest
private class EventControllerTest {

    @TestSetup
    static void makeData() {
        Event__c future = new Event__c(
            Name           = 'Test Public Event',
            Event_Date__c  = Datetime.now().addDays(7),
            Location__c    = 'Tahlequah, OK',
            Event_Type__c  = 'Community Meeting',
            Is_Public__c   = true,
            Status__c      = 'Approved',
            Monday_Item_Id__c = 'TEST_EC_001'
        );
        Event__c past = new Event__c(
            Name           = 'Test Past Event',
            Event_Date__c  = Datetime.now().addDays(-1),
            Is_Public__c   = true,
            Status__c      = 'Approved',
            Monday_Item_Id__c = 'TEST_EC_002'
        );
        Event__c notPublic = new Event__c(
            Name           = 'Private Event',
            Event_Date__c  = Datetime.now().addDays(3),
            Is_Public__c   = false,
            Status__c      = 'Approved',
            Monday_Item_Id__c = 'TEST_EC_003'
        );
        insert new List<Event__c>{ future, past, notPublic };
    }

    @isTest
    static void testGetUpcomingEventsReturnsOnlyFuturePublic() {
        List<Event__c> results = EventController.getUpcomingEvents();

        System.assert(!results.isEmpty(), 'Should return at least one event');
        for (Event__c ev : results) {
            System.assert(ev.Is_Public__c, 'All returned events must be public');
            System.assertEquals('Approved', ev.Status__c, 'All returned events must be Approved');
            System.assert(ev.Event_Date__c >= Datetime.now(), 'All returned events must be in the future');
        }
    }

    @isTest
    static void testGetUpcomingEventsExcludesPastEvents() {
        List<Event__c> results = EventController.getUpcomingEvents();
        for (Event__c ev : results) {
            System.assertNotEquals('TEST_EC_002', ev.Monday_Item_Id__c, 'Past event should not be returned');
        }
    }

    @isTest
    static void testGetUpcomingEventsExcludesPrivateEvents() {
        List<Event__c> results = EventController.getUpcomingEvents();
        for (Event__c ev : results) {
            System.assertNotEquals('TEST_EC_003', ev.Monday_Item_Id__c, 'Private event should not be returned');
        }
    }
}
