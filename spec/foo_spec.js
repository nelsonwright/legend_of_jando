describe ('foo', function() {
    it ("has a passing test", function() {
        expect(true).toBe(true);
    });  
    
    it ("supports custom jquery matchers", function() {
        var testDom = jasmine.getFixtures().set("<div id='foo' class='bar'><span>baz</span></div>");
        var foo = testDom.find('#foo');
        expect(foo).toHaveClass('bar');
        expect(foo).toHaveText('baz');
    });
});
