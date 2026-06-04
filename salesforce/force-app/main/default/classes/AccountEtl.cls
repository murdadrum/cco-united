public with sharing class AccountEtl implements Database.Batchable<Object>,
                                                Database.AllowsCallouts,
                                                Database.Stateful {

    // Monday board ID for Master CCO Registry
    private static final String BOARD_ID = '18415645308';

    // Group title → CCO_Status__c picklist value
    private static final Map<String, String> GROUP_STATUS_MAP = new Map<String, String>{
        'group_mm3x15g0' => 'Active',
        'group_mm3xvskj' => 'Inactive',
        'group_mm3x738q' => 'Pending Approval',
        'group_mm3x90g7' => 'Rejected'
    };

    private List<Account> accountsToUpsert = new List<Account>();

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
        if (!accountsToUpsert.isEmpty()) {
            Database.UpsertResult[] results = Database.upsert(
                accountsToUpsert, Account.Monday_Board_Id__c, false
            );
            Integer successCount = 0;
            for (Database.UpsertResult r : results) {
                if (r.isSuccess()) successCount++;
            }
            System.debug('AccountEtl finish: upserted ' + successCount
                + ' of ' + accountsToUpsert.size() + ' accounts');
        }
    }

    private void fetchGroup(String groupId, String status) {
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
            System.debug('AccountEtl HTTP error for group ' + groupId + ': ' + e.getMessage());
            return;
        }

        if (res.getStatusCode() != 200) {
            System.debug('AccountEtl non-200 for group ' + groupId + ': ' + res.getStatus());
            return;
        }

        accountsToUpsert.addAll(parseItems(res.getBody(), status));
    }

    private String buildQuery(String groupId) {
        return 'query { boards(ids: [' + BOARD_ID + ']) { ' +
               'groups(ids: ["' + groupId + '"]) { ' +
               'items_page(limit: 100) { items { ' +
               'id name ' +
               'column_values(ids: ["text_mm3xdg2b","email_mm3wh2bk",' +
               '"phone_mm3wq6p6","date_mm3wcr5v","link_mm3wcg66",' +
               '"long_text_mm3wy3j4"]) ' +
               '{ id text } } } } } } }';
    }

    @TestVisible
    private List<Account> parseItems(String responseBody, String status) {
        List<Account> accounts = new List<Account>();
        Map<String, Object> root = (Map<String, Object>) JSON.deserializeUntyped(responseBody);
        Map<String, Object> data = (Map<String, Object>) root.get('data');
        if (data == null) return accounts;

        List<Object> boards = (List<Object>) data.get('boards');
        if (boards == null || boards.isEmpty()) return accounts;

        Map<String, Object> board = (Map<String, Object>) boards[0];
        List<Object> groups = (List<Object>) board.get('groups');
        if (groups == null || groups.isEmpty()) return accounts;

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
                String colId   = (String) col.get('id');
                String colText = (String) col.get('text');
                cols.put(colId, colText != null ? colText : '');
            }

            String rawDate = cols.get('date_mm3wcr5v');
            Date memberSince = null;
            if (String.isNotBlank(rawDate)) {
                try {
                    memberSince = Date.valueOf(rawDate.left(10));
                } catch (Exception e) {
                    memberSince = null;
                }
            }

            Account acct = new Account(
                Monday_Board_Id__c  = mondayId,
                Name                = itemName,
                CCO_Status__c       = status,
                CCO_Contact_Name__c = cols.get('text_mm3xdg2b'),
                CCO_Contact_Email__c = cols.get('email_mm3wh2bk'),
                Phone               = cols.get('phone_mm3wq6p6'),
                CCO_Member_Since__c = memberSince,
                Website             = cols.get('link_mm3wcg66'),
                Description         = cols.get('long_text_mm3wy3j4')
            );

            accounts.add(acct);
        }
        return accounts;
    }

    @InvocableMethod(label='Run CCO Registry ETL' description='Fetches all CCO orgs from Monday and upserts to Account')
    public static void runEtl(List<String> ignored) {
        Database.executeBatch(new AccountEtl(), 5);
    }
}
