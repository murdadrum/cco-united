public with sharing class LoanOriginationCallout {

    @future(callout=true)
    public static void submitApplication(Id caseId) {
        Case c = [
            SELECT Id, CaseNumber, ContactId, Subject, Description, Status
            FROM Case
            WHERE Id = :caseId
            LIMIT 1
        ];

        Map<String, Object> payload = new Map<String, Object>{
            'caseId'      => c.Id,
            'caseNumber'  => c.CaseNumber,
            'contactId'   => c.ContactId,
            'subject'     => c.Subject,
            'description' => c.Description,
            'status'      => c.Status,
            'submittedAt' => String.valueOf(Datetime.now())
        };

        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:Loan_Origination_Mock/api/applications');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(JSON.serialize(payload));
        req.setTimeout(10000);

        HttpResponse res = new Http().send(req);

        if (res.getStatusCode() < 200 || res.getStatusCode() >= 300) {
            System.debug(LoggingLevel.ERROR,
                'LoanOriginationCallout: unexpected status ' + res.getStatusCode()
                + ' for Case ' + caseId + ' — body: ' + res.getBody());
        }
    }
}
