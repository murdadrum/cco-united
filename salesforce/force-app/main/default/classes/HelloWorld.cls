public with sharing class HelloWorld {
    public static String greet(String name) {
        if (String.isBlank(name)) {
            return 'Osiyo!';
        }
        return 'Osiyo, ' + name + '!';
    }
}
