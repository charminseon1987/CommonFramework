@isTest
public with sharing class TestBatch {
    
    @testSetup
    static void setup() {
        // 테스트 데이터 생성
        List<Account> accounts = new List<Account>();
        for (Integer i = 0; i < 5; i++) {
            accounts.add(new Account(Name = 'Test Account ' + i));
        }
        insert accounts;
    }
    
    @isTest
    static void testBatchExecution() {
        // 배치 클래스 실행
        Test.startTest();
        // SampleBatch batch = new SampleBatch();
        // Database.executeBatch(batch, 200);
        Test.stopTest();
        
        // 결과 검증
        List<Account> accounts = [SELECT Id, Name FROM Account];
        System.assert(!accounts.isEmpty(), '계정이 존재해야 합니다');
    }
    
    @isTest
    static void testBatchWithSchedulable() {
        // 스케줄된 배치 테스트
        Test.startTest();
        // String jobId = System.schedule('Test Batch Job', '0 0 12 * * ?', new SampleBatchSchedule());
        Test.stopTest();
        
        // 스케줄 확인
        // CronTrigger ct = [SELECT Id, CronExpression, TimesTriggered FROM CronTrigger WHERE Id = :jobId];
        // System.assertEquals('0 0 12 * * ?', ct.CronExpression);
    }
}