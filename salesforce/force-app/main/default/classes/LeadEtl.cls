public with sharing class LeadEtl implements Database.Batchable<Object>,
                                              Database.AllowsCallouts,
                                              Database.Stateful {

    // Group IDs for the CCO Events Subscribers board
    private static final List<String> GROUP_IDS = new List<String>{
        'topics',
        'group_title'
    };

    private List<Lead> leadsToUpsert = new List<Lead>();
    private String boardId;

    public LeadEtl() {
        Monday_Config__mdt config = [
            SELECT Board_Id__c FROM Monday_Config__mdt
            WHERE DeveloperName = 'Subscriber_Board' LIMIT 1
        ];
        boardId = config.Board_Id__c;
    }

    public Iterable<Object> start(Database.BatchableContext bc) {
        return (List<Object>) GROUP_IDS;
    }

    public void execute(Database.BatchableContext bc, List<Object> scope) {
        for (Object groupIdObj : scope) {
            fetchGroup((String) groupIdObj);
        }
    }

    public void finish(Database.BatchableContext bc) {
        if (!leadsToUpsert.isEmpty()) {
            Database.UpsertResult[] results = Database.upsert(
                leadsToUpsert, Lead.Monday_Item_Id__c, false
            );
            Integer successCount = 0;
            for (Database.UpsertResult r : results) {
                if (r.isSuccess()) successCount++;
            }
            System.debug('LeadEtl finish: upserted ' + successCount
                + ' of ' + leadsToUpsert.size() + ' leads');
        }
    }

    private void fetchGroup(String groupId) {
        String query = buildQuery(groupId);
        String body  = JSON.serialize(new Map<String, Object>{
            'query' => query
        });

        HttpRequest req = new HttpRequest();
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
            System.debug('LeadEtl HTTP error for group ' + groupId + ': ' + e.getMessage());
            return;
        }

        if (res.getStatusCode() != 200) {
            System.debug('LeadEtl non-200 for group ' + groupId + ': ' + res.getStatus());
            return;
        }

        leadsToUpsert.addAll(parseItems(res.getBody()));
    }

    private String buildQuery(String groupId) {
        return 'query { boards(ids: [' + boardId + ']) { ' +
               'groups(ids: ["' + groupId + '"]) { ' +
               'items_page(limit: 100) { items { ' +
               'id name ' +
               'column_values(ids: ["email_mm3y7jse","date_mm3yf68t"]) ' +
               '{ id text } } } } } } }';
    }

    @TestVisible
    private List<Lead> parseItems(String responseBody) {
        List<Lead> leads = new List<Lead>();
        Map<String, Object> root = (Map<String, Object>) JSON.deserializeUntyped(responseBody);
        Map<String, Object> data = (Map<String, Object>) root.get('data');
        if (data == null) return leads;

        List<Object> boards = (List<Object>) data.get('boards');
        if (boards == null || boards.isEmpty()) return leads;

        Map<String, Object> board = (Map<String, Object>) boards[0];
        List<Object> groups = (List<Object>) board.get('groups');
        if (groups == null || groups.isEmpty()) return leads;

        Map<String, Object> grp = (Map<String, Object>) groups[0];
        Map<String, Object> itemsPage = (Map<String, Object>) grp.get('items_page');
        List<Object> items = (List<Object>) itemsPage.get('items');

        for (Object itemObj : items) {
            Map<String, Object> item = (Map<String, Object>) itemObj;
            String mondayId  = (String) item.get('id');
            String itemName  = (String) item.get('name');

            Map<String, String> cols = new Map<String, String>();
            List<Object> colVals = (List<Object>) item.get('column_values');
            for (Object cv : colVals) {
                Map<String, Object> col = (Map<String, Object>) cv;
                cols.put((String) col.get('id'),
                         col.get('text') != null ? (String) col.get('text') : '');
            }

            String email       = cols.get('email_mm3y7jse');
            String dateSubbed  = cols.get('date_mm3yf68t');

            // Skip rows with no email — unusable as a Lead
            if (String.isBlank(email)) continue;

            Lead ld = new Lead(
                Monday_Item_Id__c = mondayId,
                LastName          = String.isNotBlank(itemName) ? itemName : email,
                Company           = 'CCO United Subscriber',
                Email             = email,
                LeadSource        = 'Web',
                Description       = String.isNotBlank(dateSubbed)
                                        ? 'Subscribed: ' + dateSubbed
                                        : null
            );

            leads.add(ld);
        }
        return leads;
    }

    @InvocableMethod(label='Run Subscriber ETL' description='Fetches CCO Events subscribers from Monday and upserts to Lead')
    public static void runEtl(List<String> ignored) {
        Database.executeBatch(new LeadEtl(), 5);
    }
}
