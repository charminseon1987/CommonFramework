public with sharing class AlarmSchedule implements Schedulable {
    
    public void execute(SchedulableContext context) {
        // 스케줄된 배치 작업 실행
        SampleBatch batch = new SampleBatch();
        Database.executeBatch(batch, 200);
    }
    
    // 스케줄 설정: System.schedule('Alarm Schedule', '0 0 12 * * ?', new AlarmSchedule());
}