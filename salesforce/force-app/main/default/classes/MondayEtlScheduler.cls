public with sharing class MondayEtlScheduler implements Schedulable {
    public void execute(SchedulableContext sc) {
        Database.executeBatch(new MondayEtl(), 5);
    }

    // Schedule daily at 2 AM UTC from Developer Console:
    // MondayEtlScheduler.schedule();
    public static void schedule() {
        System.schedule('Monday ETL Daily', '0 0 2 * * ?', new MondayEtlScheduler());
    }
}
