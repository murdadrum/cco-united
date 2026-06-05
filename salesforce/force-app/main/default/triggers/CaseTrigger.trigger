trigger CaseTrigger on Case (after update) {
    Set<Id> toSubmit = new Set<Id>();

    for (Case c : Trigger.new) {
        Case old = Trigger.oldMap.get(c.Id);
        if (c.Status == 'Approved' && old.Status != 'Approved') {
            toSubmit.add(c.Id);
        }
    }

    for (Id caseId : toSubmit) {
        LoanOriginationCallout.submitApplication(caseId);
    }
}
