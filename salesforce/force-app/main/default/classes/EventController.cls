public with sharing class EventController {

    @AuraEnabled(cacheable=true)
    public static List<Event__c> getUpcomingEvents() {
        return [
            SELECT Id,
                   Name,
                   Event_Date__c,
                   Location__c,
                   Event_Type__c,
                   Description__c,
                   CCO_Organization__c,
                   Is_Public__c,
                   Status__c,
                   Monday_Item_Id__c
            FROM Event__c
            WHERE Is_Public__c = true
              AND Status__c    = 'Approved'
              AND Event_Date__c >= TODAY
            ORDER BY Event_Date__c ASC
            LIMIT 20
        ];
    }
}
