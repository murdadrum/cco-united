@isTest
private class HelloWorldTest {

    @isTest
    static void testGreetWithName() {
        Test.startTest();
        String result = HelloWorld.greet('Alis');
        Test.stopTest();

        System.assertEquals('Osiyo, Alis!', result, 'Should greet by name');
    }

    @isTest
    static void testGreetWithoutName() {
        Test.startTest();
        String result = HelloWorld.greet(null);
        Test.stopTest();

        System.assertEquals('Osiyo!', result, 'Null should default to Osiyo');
    }

    @isTest
    static void testGreetWithBlankName() {
        Test.startTest();
        String result = HelloWorld.greet('');
        Test.stopTest();

        System.assertEquals('Osiyo!', result, 'Blank should default to Osiyo');
    }
}
