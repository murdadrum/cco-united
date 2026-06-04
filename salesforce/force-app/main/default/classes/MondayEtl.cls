public with sharing class MondayEtl implements Database.Batchable<Object>,
                                               Database.AllowsCallouts,
                                               Database.Stateful {

    // Monday board ID for CN Master Events Calendar
    private static final String BOARD_ID = '18415647485';

    // Group ID → SF Status mapping (mirrors Monday group structure)
    private static final Map<String, String> GROUP_STATUS_MAP = new Map<String, String>{
        'group_mm3wccdn' => 'Pending Review',
        'group_mm3wn6pa' => 'Approved',
        'group_mm3wzkwn' => 'Happening Soon',
        'group_mm3w807e' => 'Completed',
        'group_mm3w8f8w' => 'Cancelled'
    };

    private List<Event__c> eventsToUpsert = new List<Event__c>();

    public Iterable<Object> start(Database.BatchableContext bc) {
        List<Object> groupIds = new List<Object>();
        for (String key : GROUP_STATUS_MAP.keySet()) {
            groupIds.add(key);
        }
        return groupIds;
    }

    public void execute(Database.BatchableContext bc, List<Object> scope) {
        for (Object groupIdObj : scope) {
            String groupId = (String) groupIdObj;
            String status  = GROUP_STATUS_MAP.get(groupId);
            fetchGroup(groupId, status);
        }
    }

    public void finish(Database.BatchableContext bc) {
        if (!eventsToUpsert.isEmpty()) {
            Database.UpsertResult[] results = Database.upsert(
                eventsToUpsert, Event__c.Monday_Item_Id__c, false
            );
            Integer successCount = 0;
            for (Database.UpsertResult r : results) {
                if (r.isSuccess()) successCount++;
            }
            System.debug('MondayEtl finish: upserted ' + successCount
                + ' of ' + eventsToUpsert.size() + ' events');
        }
    }

    private void fetchGroup(String groupId, String status) {
        String query = buildQuery(groupId);
        String body  = JSON.serialize(new Map<String, Object>{
            'query' => query
        });

        HttpRequest req = new HttpRequest();
        // Named Credential: Setup > Security > Named Credentials > New
        // Label: Monday API | Name: Monday_API | URL: https://api.monday.com
        // Auth Protocol: No Authentication
        // Custom Header: Authorization = Bearer {MONDAY_API_KEY}
        req.setEndpoint('callout:Monday_API/v2');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('API-Version', '2023-10');
        req.setBody(body);

        Http http = new Http();
        HttpResponse res;
        try {
            res = http.send(req);
        } catch (Exception e) {
            System.debug('MondayEtl HTTP error for group ' + groupId + ': ' + e.getMessage());
            return;
        }

        if (res.getStatusCode() != 200) {
            System.debug('MondayEtl non-200 for group ' + groupId + ': ' + res.getStatus());
            return;
        }

        eventsToUpsert.addAll(parseItems(res.getBody(), status));
    }

    private String buildQuery(String groupId) {
        return 'query { boards(ids: [' + BOARD_ID + ']) { ' +
               'groups(ids: ["' + groupId + '"]) { ' +
               'items_page(limit: 100) { items { ' +
               'id name ' +
               'column_values(ids: ["date_mm3wkeye","dropdown_mm3wv6ax",' +
               '"location_mm3wrcrr","dropdown_mm3w9yyc","boolean_mm3wsfmn",' +
               '"long_text_mm3wd4nk","text_mm3w87h6","email_mm3w2zs6"]) ' +
               '{ id text } } } } } }';
    }

    @TestVisible
    private List<Event__c> parseItems(String responseBody, String status) {
        List<Event__c> events = new List<Event__c>();
        Map<String, Object> root = (Map<String, Object>) JSON.deserializeUntyped(responseBody);
        Map<String, Object> data = (Map<String, Object>) root.get('data');
        if (data == null) return events;

        List<Object> boards = (List<Object>) data.get('boards');
        if (boards == null || boards.isEmpty()) return events;

        Map<String, Object> board = (Map<String, Object>) boards[0];
        List<Object> groups = (List<Object>) board.get('groups');
        if (groups == null || groups.isEmpty()) return events;

        Map<String, Object> grp = (Map<String, Object>) groups[0];
        Map<String, Object> itemsPage = (Map<String, Object>) grp.get('items_page');
        List<Object> items = (List<Object>) itemsPage.get('items');

        for (Object itemObj : items) {
            Map<String, Object> item = (Map<String, Object>) itemObj;
            String mondayId = (String) item.get('id');
            String itemName = (String) item.get('name');

            Map<String, String> cols = new Map<String, String>();
            List<Object> colVals = (List<Object>) item.get('column_values');
            for (Object cv : colVals) {
                Map<String, Object> col = (Map<String, Object>) cv;
                String colId   = (String) col.get('id');
                String colText = (String) col.get('text');
                cols.put(colId, colText != null ? colText : '');
            }

            Boolean isPublic = cols.get('boolean_mm3wsfmn') == 'true'
                            || cols.get('boolean_mm3wsfmn') == 'v';

            String rawDate = cols.get('date_mm3wkeye');
            Datetime eventDt = null;
            if (String.isNotBlank(rawDate)) {
                try {
                    eventDt = (rawDate.length() == 10)
                        ? Datetime.newInstance(Date.valueOf(rawDate), Time.newInstance(0, 0, 0, 0))
                        : Datetime.valueOf(rawDate);
                } catch (Exception e) {
                    eventDt = null;
                }
            }

            Event__c ev = new Event__c(
                Monday_Item_Id__c  = mondayId,
                Name               = itemName,
                Status__c          = status,
                Is_Public__c       = isPublic,
                Event_Date__c      = eventDt,
                Location__c        = cols.get('location_mm3wrcrr'),
                Event_Type__c      = cols.get('dropdown_mm3w9yyc'),
                Description__c     = cols.get('long_text_mm3wd4nk'),
                Submitted_By__c    = cols.get('text_mm3w87h6'),
                Submitter_Email__c = cols.get('email_mm3w2zs6')
            );

            events.add(ev);
        }
        return events;
    }

    // Invocable for manual runs / Scheduler / Flow
    @InvocableMethod(label='Run Monday ETL' description='Fetches all CCO events from Monday and upserts to Event__c')
    public static void runEtl(List<String> ignored) {
        Database.executeBatch(new MondayEtl(), 5);
    }
}
