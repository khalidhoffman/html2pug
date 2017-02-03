const expect = require('chai').expect;

describe("php2pug", function(){
    const php2pug = require('../lib');

    it("can convert php to pug", function(done){

        const sampleText = "<div><?php echo 'Hello World'; ?></div>";

        php2pug(sampleText, {
                useLib: false
            })
            .then(function(pugText) {
                expect(pugText).to.eql(`div !{"<?php echo 'Hello World';  ?>"}`);
                done();
            });
    });
})
