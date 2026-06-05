trigger CaseTrigger on Case (after update) {
    Set<Id> toSubmit = new Set<Id>();

    for (Case c : Trigger.new) {
        Case old = Trigger.oldMap.get(c.Id);
        // 'Closed' is a guaranteed-valid standard Status; map to org's Approved value in production
        if (c.Status == 'Closed' && old.Status != 'Closed') {
            toSubmit.add(c.Id);
        }
    }

    for (Id caseId : toSubmit) {
        LoanOriginationCallout.submitApplication(caseId);
    }
}
